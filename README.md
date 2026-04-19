# iainmorton.me — Portfolio Site

Personal portfolio for Iain Morton. Built with Astro + Tailwind CSS, deployed on Cloudflare Pages.

**Stack:** Astro · Tailwind CSS · Cloudflare Pages · Cloudflare Pages Functions (CSP nonce)  
**Domain:** iainmorton.me  
**Target:** Mozilla HTTP Observatory A+ · Lighthouse 100

---

## Branches & Environments

| Branch | Environment | URL | Access |
|---|---|---|---|
| `main` | Production | https://iainmorton.me | Public |
| `preview` | Preview | https://preview.iainmorton.pages.dev | Cloudflare Zero Trust (authenticated only) |

**Branch protection:** `main` is protected by a GitHub ruleset — direct pushes are blocked. All changes must go through a PR from `preview`. Force pushes and branch deletion are also blocked.

---

## Development Workflow

This project uses Cloudflare Pages as the primary development environment rather than local dev. Every push to the `preview` branch triggers an automatic build and generates a unique deployment URL, giving a real production-equivalent environment on every commit — including the CSP nonce middleware, security headers, and edge functions running exactly as they do in production.

### Why no local dev?

The CSP nonce middleware (`functions/_middleware.js`) only runs on Cloudflare Pages. A local dev server cannot replicate it, meaning local testing always has a gap in security behaviour. Using Cloudflare preview deployments eliminates that gap entirely and keeps the feedback loop fast (~60 seconds per build).

### Making changes

```bash
git checkout preview

# Make your changes
git add .
git commit -m "type: description"
git push
```

Cloudflare Pages automatically builds and deploys on every push. Build cache is enabled, so subsequent builds are significantly faster than the initial cold build — typically well under 60 seconds for incremental changes.

```
https://<hash>.iainmorton.pages.dev
```

Find the URL for any specific commit in the Cloudflare Pages dashboard → your project → **Deployments**. Use this URL to verify the change before promoting to production.

There is also a fixed preview URL that always reflects the latest commit on the `preview` branch:

```
https://preview.iainmorton.pages.dev
```

Use the fixed URL for general ongoing verification, and the unique per-commit URL when you need to test a specific deployment or compare two commits side by side.

> **Note:** All preview URLs (both fixed and unique) are protected by Cloudflare Zero Trust — authentication is required to access them.

---

## SDLC — How to Make Changes

### Step 1 — Work on the preview branch

All changes are made against `preview`, never directly to `main`.

```bash
git checkout preview

# Make your changes, then:
git add .
git commit -m "type: description of change"
git push
```

Pushing to `preview` triggers a build automatically. Each push generates a unique deployment URL (`https://<hash>.iainmorton.pages.dev`) visible in the Cloudflare Pages dashboard → **Deployments**. Use this URL to verify the specific commit.

### Step 2 — Verify on preview

Check the preview deployment looks correct before promoting to production. For content changes this is a quick visual check. For code changes, run through the relevant acceptance criteria from the spec.

### Step 3 — Promote to production

When the preview deployment is verified, raise a Pull Request from `preview` → `main` on GitHub.

```
GitHub → Pull requests → New pull request
Base: main  ←  Compare: preview
```

Merge the PR. This triggers an automatic production deployment to `https://iainmorton.me`.

### Step 4 — Tag the release

After merging, tag the release using semantic versioning (`MAJOR.MINOR.PATCH`):

```bash
git checkout main
git pull
git tag -a v2.1.0 -m "release: description of changes"
git push origin v2.1.0
```

**Versioning guide:**
- `PATCH` — content updates, copy changes, dependency patches
- `MINOR` — new sections, hygiene changes, non-breaking dependency upgrades
- `MAJOR` — redesign, breaking infrastructure changes, major framework upgrades

---

## Publishing Blog Posts

Blog posts are MDX files stored in `src/data/blogs/`. Publishing follows the standard SDLC — there is no separate authoring tool.

### Writing a new post

Create a new `.mdx` file in `src/data/blogs/`:

```bash
git checkout preview
# Create src/data/blogs/your-post-slug.mdx
git add src/data/blogs/your-post-slug.mdx
git commit -m "content: add post — your post title"
git push
```

Every MDX file requires this frontmatter block at the top:

```mdx
---
title: "Your Post Title"
description: "1–2 sentence summary shown on listing cards and in social previews. Max 160 chars."
date: 2026-04-18
tags: ["engineering", "leadership"]
toc: true
draft: false
---
```

The filename becomes the URL slug: `my-post.mdx` → `https://iainmorton.me/blog/my-post`

### Rich content

```mdx
import YouTube from '../../components/YouTube.astro';

Inline emoji works natively 🚀

<YouTube id="dQw4w9WgXcQ" title="Accessible title for the embed" />

![Alt text is mandatory](/gifs/local.gif)
![Alt text is mandatory](https://media.giphy.com/media/abc/giphy.gif)
```

### Draft posts and the INCLUDE_CONTENT_DRAFTS flag

Set `draft: true` in frontmatter to prevent a post from appearing in production:

```mdx
draft: true
```

Draft posts with `draft: true` can still be pushed to `main` — this avoids holding up code changes. They are excluded from the production build entirely (no route, no sitemap entry).

To preview drafts, the `INCLUDE_CONTENT_DRAFTS` environment variable must be set:

| Environment | Value | Effect |
|---|---|---|
| Cloudflare Preview | `INCLUDE_CONTENT_DRAFTS=true` | All posts including drafts are built and visible |
| Cloudflare Production | Not set (or `false`) | Only `draft: false` posts are built |

**To set in Cloudflare Pages:** Dashboard → your project → **Settings** → **Environment variables** → add `INCLUDE_CONTENT_DRAFTS` = `true` for the **Preview** environment only. Do not add it to the Production environment.

### Promoting to production

Once verified on preview:
1. Raise a PR from `preview` → `main`
2. Merge
3. Tag the release: `git tag -a v2.1.1 -m "content: publish [post title]" && git push origin v2.1.1`

---

## Updating CV Content

**All CV content (experience, skills, profile) lives in one file: `src/data/cv.ts`**

```bash
git checkout preview
# Edit src/data/cv.ts
git add src/data/cv.ts
git commit -m "content: update [section name]"
git push
# Verify on deployment URL, then raise PR → main and tag release
```

---

## Cloudflare Pages Setup (One-Time Reference)

### 1. Connect GitHub Repo

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → **Create a project**
2. Select **Connect to Git** → choose GitHub → select this repo (`impingu1984/web`)
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (leave blank)
4. **Environment variables** — add:
   - `NODE_VERSION` = `24`
5. **Build cache** — enable under **Settings** → **Builds & deployments** → **Build cache**. Caches npm dependencies and Astro build artefacts between deployments, reducing typical build times significantly.
6. Click **Save and Deploy**

### 2. Environments

Two environments are configured in Cloudflare Pages:

**Production**
- Deployment branch: `main`
- Custom domain: `iainmorton.me`
- Access: Public

**Preview**
- Deployment branch: `preview`
- URL: `preview.iainmorton.pages.dev`
- Access: Cloudflare Zero Trust — authenticated users only

To configure environments: Cloudflare Pages → project → **Settings** → **Builds & deployments** → **Branch control**.

### 3. Cloudflare Zero Trust (Preview Protection)

Preview builds are protected by Cloudflare Zero Trust to prevent unauthenticated access to pre-production deployments.

To configure: Cloudflare Dashboard → **Zero Trust** → **Access** → **Applications** → add `preview.iainmorton.pages.dev` with your chosen identity provider policy.

### 4. Custom Domain

1. In Cloudflare Pages → your project → **Custom domains** → **Set up a custom domain**
2. Enter `iainmorton.me`
3. Since the domain is registered via Cloudflare Registrar, DNS is managed automatically.

### 5. WWW → Apex Redirect

In Cloudflare Dashboard → **DNS** for `iainmorton.me`:
1. Add a `CNAME` record: `www` → `iainmorton.me` (Proxied ✓)
2. Go to **Rules** → **Redirect Rules** → **Create rule**:
   - **Name:** `www to apex`
   - **When:** Hostname equals `www.iainmorton.me`
   - **Then:** Static redirect → `https://iainmorton.me` → **301**
3. Save

### 6. Bulk Redirect — pages.dev → Custom Domain

A bulk redirect is configured to send any traffic arriving at `iainmorton.pages.dev` to the canonical domain `iainmorton.me`, preventing duplicate content and ensuring all traffic uses the custom domain.

To configure: Cloudflare Dashboard → **Bulk Redirects** → **Create redirect list**:
- **Source:** `iainmorton.pages.dev/*`
- **Target:** `https://iainmorton.me`
- **Status:** 301

### 7. SSL/TLS & Edge Certificate Settings

The following settings are configured under Cloudflare Dashboard → **SSL/TLS** → **Edge Certificates**:

| Setting | Value |
|---|---|
| Always Use HTTPS | On |
| Minimum TLS Version | TLS 1.2 |
| TLS 1.3 | Enabled |
| Automatic HTTPS Rewrites | On |

**Always Use HTTPS** ensures any HTTP request is redirected to HTTPS at the edge before it reaches Pages.  
**Minimum TLS 1.2** drops support for deprecated TLS 1.0 and 1.1.  
**Automatic HTTPS Rewrites** upgrades mixed-content HTTP references in HTML to HTTPS where possible.

### 8. GitHub Branch Protection

A ruleset is configured on `main` in GitHub:
- **Requires a pull request** before merging
- **Restricts deletions**
- **Blocks force pushes**

To configure: GitHub → **Settings** → **Rules** → **Rulesets**.

### 9. Dependabot

Dependabot is enabled for weekly npm dependency monitoring. PRs will be raised automatically against `preview` on Mondays and should be reviewed, tested on preview, and merged to main via the standard SDLC flow.

### 10. Verify Security Headers

After any production deploy:
```bash
curl -I https://iainmorton.me
```

Expected headers:
- `content-security-policy: default-src 'none'; ... style-src 'self' 'nonce-...'`
- `strict-transport-security: max-age=15552000; includeSubDomains; preload`
- `x-frame-options: DENY`
- `x-content-type-options: nosniff`
- `referrer-policy: strict-origin-when-cross-origin`
- `permissions-policy: camera=(), microphone=(), geolocation=(), payment=()`
- `cross-origin-opener-policy: same-origin`
- `cross-origin-embedder-policy: require-corp`
- `cross-origin-resource-policy: same-origin`

Then run: https://observatory.mozilla.org/analyze/iainmorton.me — target **A+**

### 11. HSTS Preload (Deferred)

Deferred until Cloudflare allows HSTS `max-age` above 6 months. Current value is `max-age=15552000` (6 months). Preload list requires a minimum of 1 year. No action required until platform constraint is resolved.

---

## Security Notes

- No secrets committed to this repo — it is intentionally public (Cloudflare Pages free tier requirement)
- CSP is enforced via per-request nonce (`functions/_middleware.js`) — `unsafe-inline` is absent
- No analytics, tracking scripts, or third-party JS of any kind
- Contact details (email, phone, address) are never rendered in HTML
- Preview environment is protected by Cloudflare Zero Trust — not publicly accessible

---

## Verification Checklist

Run these after any production deploy:

```bash
DOMAIN=https://iainmorton.me

# Security headers present
curl -I $DOMAIN | grep -E "content-security-policy|strict-transport-security|x-frame-options|x-content-type-options|referrer-policy|permissions-policy|cross-origin-opener-policy|cross-origin-embedder-policy|cross-origin-resource-policy"

# CSP has nonce, not unsafe-inline
curl -I $DOMAIN | grep content-security-policy | grep "nonce-" && echo "nonce present"
curl -I $DOMAIN | grep content-security-policy | grep "unsafe-inline" && echo "FAIL" || echo "PASS"

# No tracking scripts
curl $DOMAIN | grep -i "gtag\|analytics\|pixel\|hotjar" && echo "FAIL" || echo "PASS"

# www redirect
curl -I https://www.iainmorton.me | grep location

# security.txt
curl https://iainmorton.me/.well-known/security.txt

# sitemap
curl https://iainmorton.me/sitemap-index.xml
```