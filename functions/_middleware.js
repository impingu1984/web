// functions/_middleware.js
// Cloudflare Pages Edge Function — runs on every request (free tier).
// Generates a cryptographic nonce per request and injects it into:
//   1. The Content-Security-Policy response header
//   2. Every <style> and <script> tag in the HTML response body
//
// No inline style="" attributes exist in the HTML — all moved to CSS classes.
// This means no style-src-attr directive is needed.

export async function onRequest(context) {
  const { next } = context;

  const response = await next();

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  // Generate a cryptographically random nonce per request
  const nonce = crypto.randomUUID().replace(/-/g, '');

  // Inject nonce into every <style> and <script> tag (skip if already nonced)
  let body = await response.text();
  body = body.replace(/<style(?![^>]*nonce)([^>]*)>/gi,  (_, attrs) => `<style${attrs} nonce="${nonce}">`);
  body = body.replace(/<script(?![^>]*nonce)([^>]*)>/gi, (_, attrs) => `<script${attrs} nonce="${nonce}">`);

  // Build strict CSP with nonce
  // font-src includes data: because @fontsource embeds font files as data URIs in CSS
  const csp = [
    "default-src 'none'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "font-src 'self' data:",
    "img-src 'self' data:",
    "connect-src 'self'",
    "form-action 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  const newHeaders = new Headers(response.headers);
  newHeaders.set('Content-Security-Policy', csp);

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}