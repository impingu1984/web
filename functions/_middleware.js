// functions/_middleware.js
// Cloudflare Pages Edge Function — runs on every request (free tier).
// Generates a cryptographic nonce per request and injects it into:
//   1. The Content-Security-Policy response header
//   2. Every <style> tag in the HTML response body
//
// This eliminates 'unsafe-inline' from style-src, satisfying Mozilla Observatory A+.

export async function onRequest(context) {
  const { next } = context;

  // Fetch the response from the static asset
  const response = await next();

  // Only process HTML responses
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  // Generate a cryptographically random nonce per request
  const nonce = crypto.randomUUID().replace(/-/g, '');

  // Read and modify HTML body — inject nonce into every <style> tag
  let body = await response.text();
  body = body.replace(/<style(\s[^>]*)?>/gi, (match, attrs) => {
    const existing = attrs || '';
    return `<style${existing} nonce="${nonce}">`;
  });

  // Build strict CSP with nonce
  const csp = [
    "default-src 'none'",
    "script-src 'self'",
    `style-src 'self' 'nonce-${nonce}'`,
    "font-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "form-action 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  // Return modified response with CSP header added
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Content-Security-Policy', csp);

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
