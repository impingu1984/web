# iainmorton.me — Portfolio Site

Personal portfolio for Iain Morton. Built with Astro + Tailwind CSS, deployed on Cloudflare Pages.

**Stack:** Astro · Tailwind CSS · Cloudflare Pages · Cloudflare Pages Functions (CSP nonce)  
**Domain:** iainmorton.me  
**Target:** Mozilla HTTP Observatory A+ · Lighthouse ≥ 95

---

## Local Development

```bash
# Install dependencies (Node ≥ 20 required)
pnpm install

# Start dev server at http://localhost:4321
pnpm dev

# Production build
pnpm build

# Preview production build locally
pnpm preview
```

> **Note on CSP in dev:** The nonce middleware runs on Cloudflare Pages only. In local dev, inline styles are unrestricted. This is expected and doesn't affect production security.

---

## Updating Content

**All content lives in one file: `src/data/cv.ts`**

To update the site:
1. Edit `src/data/cv.ts`
2. `git add src/data/cv.ts && git commit -m "content: update [section]"`
3. `git push` — Cloudflare Pages auto-deploys within ~60 seconds

---

## Cloudflare Pages Setup (One-Time)

### 1. Connect GitHub Repo

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → **Create a project**
2. Select **Connect to Git** → choose GitHub → select this repo (`impingu1984/web`)
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `pnpm build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (leave blank)
4. **Environment variables** — add:
   - `NODE_VERSION` = `22`
5. Click **Save and Deploy**

### 2. Custom Domain

1. In Cloudflare Pages → your project → **Custom domains** → **Set up a custom domain**
2. Enter `iainmorton.me`
3. Since the domain is registered via Cloudflare Registrar, DNS is managed automatically. Cloudflare will add the required `CNAME` record.

### 3. WWW → Apex Redirect

In Cloudflare Dashboard → **DNS** for `iainmorton.me`:
1. Add a `CNAME` record: `www` → `iainmorton.me` (Proxied ✓)
2. Go to **Rules** → **Redirect Rules** → **Create rule**:
   - **Name:** `www to apex`
   - **When:** Hostname equals `www.iainmorton.me`
   - **Then:** Static redirect → `https://iainmorton.me` → **301**
3. Save

Verify: `curl -I http://www.iainmorton.me` → should return `301` to `https://iainmorton.me`

### 4. Verify Security Headers

After deploy:
```bash
curl -I https://iainmorton.me
```

Expected headers:
- `content-security-policy: default-src 'none'; ... style-src 'self' 'nonce-...'`
- `strict-transport-security: max-age=63072000; includeSubDomains; preload`
- `x-frame-options: DENY`
- `x-content-type-options: nosniff`
- `referrer-policy: strict-origin-when-cross-origin`
- `permissions-policy: camera=(), microphone=(), geolocation=(), payment=()`
- `cross-origin-opener-policy: same-origin`
- `cross-origin-embedder-policy: require-corp`
- `cross-origin-resource-policy: same-origin`

Then run: https://observatory.mozilla.org/analyze/iainmorton.me — target **A+**

### 5. HSTS Preload (Post-Launch)

After confirming HSTS header is live and correct:
1. Visit https://hstspreload.org
2. Enter `iainmorton.me`
3. Submit — this adds the domain to browser HSTS preload lists (Chrome, Firefox, Safari)

> **Important:** Only submit after confirming the site works correctly over HTTPS. HSTS preload is very difficult to undo.

---

## Security Notes

- No secrets committed to this repo — it is intentionally public (Cloudflare Pages free tier requirement)
- CSP is enforced via per-request nonce (`functions/_middleware.js`) — `unsafe-inline` is absent
- No analytics, tracking scripts, or third-party JS of any kind
- Contact details (email, phone, address) are never rendered in HTML

---

## Verification Checklist (Spec §5)

Run these after deploy to confirm spec compliance:

```bash
DOMAIN=https://iainmorton.me

# C2 — No employer/brand names in HTML (add your own grep terms here)
# curl $DOMAIN | grep -i "EMPLOYER_NAME" && echo "FAIL" || echo "PASS"

# C3 — No personal contact info (add your own grep terms here)
# curl $DOMAIN | grep -i "PHONE|EMAIL|LOCATION" && echo "FAIL" || echo "PASS"

# S2 — All 9 security headers present
curl -I $DOMAIN | grep -E "content-security-policy|strict-transport-security|x-frame-options|x-content-type-options|referrer-policy|permissions-policy|cross-origin-opener-policy|cross-origin-embedder-policy|cross-origin-resource-policy"

# S2a — CSP has nonce, not unsafe-inline
curl -I $DOMAIN | grep content-security-policy | grep "nonce-" && echo "nonce present"
curl -I $DOMAIN | grep content-security-policy | grep "unsafe-inline" && echo "FAIL — unsafe-inline present" || echo "PASS"

# S7 — No tracking scripts
curl $DOMAIN | grep -i "gtag\|analytics\|pixel\|hotjar" && echo "FAIL" || echo "PASS"
```
