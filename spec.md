# spec.md — Personal Portfolio Website
**Owner:** Iain Morton  
**Version:** 1.7  
**Date:** April 2026  
**Status:** ✅ APPROVED — all items resolved. Ready to build.

---

## 1. Title & Purpose

**What are we building?**  
A personal portfolio website for a senior engineering leader (Head of Engineering / CTO level), hosted publicly and linked from a CV. The site serves as a credibility signal — a hiring manager or recruiter clicks the URL and immediately understands the candidate's seniority, range, and impact without reading a wall of text.

**Goals:**
- Reinforce the CV with a polished, memorable web presence
- Present professional identity without exposing personal/employer-identifying information
- Require zero ongoing cost to run
- Require minimal effort to update (quarterly at most, via file edits + git push)

**Out of Scope:**
- Blog / writing section
- Project portfolio
- CMS or admin UI
- Authentication / login
- Any server-side logic beyond form submission

---

## 2. Sections & Content Requirements

### 2.1 Hero / Landing
- Display full name: **Iain Morton**
- Display a one-line title: e.g. `Head of Engineering · CTO`
- Display a short (2–3 sentence) professional summary — anonymised, no employer names
- Prominent call-to-action links: `View Experience` (scroll) + `Get In Touch` (scroll to contact)
- No photo required (optional placeholder for future)

### 2.2 About / Profile
- A slightly longer (3–5 sentence) anonymised profile statement drawn from CV profile
- Must convey: years of experience, team scale, areas of expertise, seniority
- Must NOT reference: specific employer names, specific brand names (tastecard, Coffee Club, etc.), personal address, phone number, personal email

### 2.3 Core Competencies / Skills
Displayed as a standalone section with clearly grouped skill clusters. Content drawn from CV:

| Cluster | Skills |
|---|---|
| Leadership | Org design, SDLC transformation, DORA metrics, team building, stakeholder management |
| Cloud & Infrastructure | AWS (ECS, Fargate, Lambda, EC2, RDS, Aurora, DynamoDB, CloudFront, VPC, IAM), Terraform, Kubernetes, EKS |
| Data Platform | Snowflake, dbt, Fivetran, Airflow, Kinesis, Athena, Power BI — data warehouse design, Lambda architecture, Data Mesh |
| DevOps & CI/CD | GitHub Actions, Jenkins, SAST/DAST, feature flagging, Blue/Green & canary deployments |
| Security | ISO 27001 (2017 & 2022), PCI DSS, pen test remediation, GitHub Advanced Security, GuardDuty, CloudTrail |
| Application Stack | Next.js, React, Java, Go, PHP, REST APIs, GraphQL, EventBridge, SQS, SNS, Auth0 |
| Methodology | Agile (Scrum & Kanban), DORA metrics, cycle/lead time optimisation, release management |

- Skills must be scannable — rendered as tags, pills, or grouped lists (not a wall of text)
- No employer context attached to any skill

### 2.4 Work Experience
Timeline/list of roles. Each entry contains:
- **Job title** (e.g. `Head of Engineering`)
- **Date range** (e.g. `Jun 2025 – Present`)
- **Anonymised company descriptor** (e.g. `Membership & Loyalty Technology Company` — NOT the company name)
- **3–5 anonymised bullet points** describing impact, using metrics where possible but stripping brand/employer identifiers

**Anonymisation rules:**
- Replace company names with a generic descriptor (e.g. "a UK membership platform", "a government-contracted training provider")
- Replace brand names (tastecard, Coffee Club, etc.) with "brand websites" or similar
- Keep all metrics (75% reduction, £180k saving, 18-person org, etc.) — these are the compelling part
- Keep technology names (AWS, ECS, GitHub Actions, etc.) — these are not identifying

**Roles to include (from CV):**
1. Head of Engineering — Jun 2025–Present
2. DevOps Manager — Jan 2023–Jun 2025
3. Lead Data Engineer — Sep 2021–Dec 2022
4. Data & Insight Lead — Apr 2020–Sep 2021
5. Senior BI Analyst — Nov 2018–Apr 2020
6. Management Information Manager — Jun 2010–Nov 2018

### 2.5 Contact
- No contact form — visitors are directed to connect via LinkedIn
- A simple section with a short line of text and a prominent LinkedIn button/link
- GitHub profile link also displayed
- No personal email, phone, or any other contact detail displayed
- LinkedIn: `https://www.linkedin.com/in/iain-morton-7b7485286/`
- GitHub: `https://github.com/impingu1984`

---

## 3. Technical Constraints

### 3.1 Tech Stack
| Concern | Choice | Rationale |
|---|---|---|
| Framework | **Astro** (latest stable) | Static output, near-zero JS by default, fast build, Markdown-friendly content, excellent dev experience |
| Styling | **Tailwind CSS v4** | Utility-first, dark mode trivial, no runtime CSS |
| Hosting | **Cloudflare Pages** | Free tier, global CDN, automatic HTTPS, native GitHub integration |
| Domain | **`iainmorton.me`** ✅ confirmed — purchase via Cloudflare Registrar at-cost (~£9/year) | Professional; linked from CV |
| CI/CD | **GitHub Actions** (via Cloudflare Pages GitHub App) | Push to `main` → automatic build & deploy |
| Edge Function | **Cloudflare Pages Functions** (`functions/_middleware.js`) | Per-request CSP nonce injection — free tier, no infrastructure |
| Package manager | **pnpm** | Fast, modern |

### 3.2 Design Constraints
- **Dark mode only** — terminal/developer aesthetic
- Colour palette: near-black background, off-white/light grey text, accent colour: **cyan `#00d4ff`** ✅ confirmed
- Monospace or mixed monospace + humanist typeface pairing (e.g. `JetBrains Mono` + `Fraunces`, or similar distinctive pairing — NOT Inter/Roboto/Arial)
- Subtle animations on scroll-in (no jarring full-screen transitions)
- Responsive: mobile-first, functional at 320px width minimum
- No cookie banners (no tracking, no analytics)
- No third-party scripts except Web3Forms

### 3.3 Performance Constraints
| Metric | Target |
|---|---|
| Lighthouse Performance | ≥ 95 |
| Lighthouse Accessibility | ≥ 90 |
| Largest Contentful Paint (LCP) | < 1.5s on 4G |
| Total JS bundle (client) | < 50KB (Astro ships near-zero JS) |
| Total page weight | < 500KB uncompressed |

### 3.4 Security Constraints

**Target: Mozilla HTTP Observatory score of A+ (≥ 115 points)**  
All headers configured in the Cloudflare Pages `_headers` file. No server-side code required.

#### 3.4.1 Required HTTP Security Headers

| Header | Required Value | Rationale |
|---|---|---|
| `Content-Security-Policy` | See §3.4.2 | Prevents XSS; highest-weighted Observatory test |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS for 2 years; enables HSTS preload list |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Disables unused browser features |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates browsing context |
| `Cross-Origin-Embedder-Policy` | `require-corp` | Enables cross-origin isolation |
| `Cross-Origin-Resource-Policy` | `same-origin` | Prevents cross-origin resource reads |

#### 3.4.2 Content Security Policy (CSP)

**Approach: Per-request nonces via Cloudflare Pages Function**

`unsafe-inline` must NOT be used for `style-src`. Instead, a nonce is generated cryptographically on every HTTP request by a Cloudflare Pages Function (a thin edge Worker, ~20 lines, free tier). The nonce is injected into both:
1. The `Content-Security-Policy` response header
2. Every `<style>` tag in the HTML document

This eliminates `unsafe-inline` entirely while allowing Tailwind/Astro inline styles, achieving the strict policy required for A+.

**Implementation:**
- A `functions/_middleware.js` file in the repo handles nonce injection at the edge
- The nonce is generated using `crypto.randomUUID()` (available in the CF Worker runtime)
- No server infrastructure required — runs on Cloudflare's free Pages Functions tier

**Target CSP policy (delivered via Pages Function, not static `_headers` file):**

```
Content-Security-Policy:
  default-src 'none';
  script-src 'self';
  style-src 'self' 'nonce-{generated-per-request}';
  font-src 'self';
  img-src 'self' data:;
  connect-src 'self';
  form-action 'none';
  base-uri 'none';
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

> **Note on fonts:** If using Google Fonts, self-host the font files (download and serve from `/public/fonts/`) to avoid needing `https://fonts.gstatic.com` in `font-src`. This keeps the CSP cleaner and removes a third-party dependency. Astro makes this straightforward via `@fontsource` npm packages.

> **Note on remaining headers:** All headers other than CSP (HSTS, X-Frame-Options, etc.) are still delivered via the `_headers` static file — only the CSP moves to the Pages Function.

#### 3.4.3 WWW Redirect

All traffic arriving at `www.iainmorton.me` must redirect permanently to the apex domain `iainmorton.me`. This is configured in Cloudflare DNS — not in the `_headers` file or Pages Function.

**Implementation:** In the Cloudflare dashboard, add a `CNAME` record for `www` pointing to `iainmorton.me`, then create a Cloudflare Redirect Rule (free tier): `www.iainmorton.me/*` → `https://iainmorton.me/$1` with a `301` permanent redirect.

**Verification:**
```
curl -I http://www.iainmorton.me
```
Must return `301` with `Location: https://iainmorton.me`

#### 3.4.4 Additional Security Rules
- No personal contact details (email, phone, address) exposed in HTML source or rendered page
- No third-party analytics, tracking pixels, or ad scripts of any kind
- HTTPS enforced at Cloudflare edge — HTTP requests redirected to HTTPS automatically
- Repo must be **public** (Cloudflare Pages free tier requirement) — verify no secrets present in full commit history before making public
- `iainmorton.me` submitted to [HSTS Preload List](https://hstspreload.org) after go-live (requires `preload` directive confirmed working first)

### 3.5 Maintenance Constraints
- Content updates must be achievable by editing a single config/content file (e.g. `src/content/cv.json` or `src/data/cv.ts`) and pushing to `main`
- No database, no CMS, no login required to update content
- Node.js LTS version pinned in `.nvmrc` / `package.json engines` field
- Dependencies updated quarterly alongside content reviews

---

## 4. Content Governance Rules

These apply permanently and must be checked before any content is published:

- [ ] No employer or brand names appear anywhere on the site (including meta tags, `<title>`, OG tags, or JSON-LD)
- [ ] No personal phone number appears on the site
- [ ] No personal home address appears on the site
- [ ] No personal email, phone, or address appears anywhere in rendered HTML or source
- [ ] All metrics and achievements are preserved (these are anonymised by omitting employer context, not by removing the numbers)

---

## 5. Verification & Acceptance Criteria

### 5.1 Build & Deploy
| # | Criterion | How to Verify |
|---|---|---|
| B1 | Site builds without errors | `pnpm build` exits with code 0 |
| B2 | Site previews locally | `pnpm dev` serves on `localhost:4321`, all sections visible |
| B3 | Push to `main` triggers Cloudflare Pages deploy | Check Cloudflare Pages dashboard — deployment completes within 3 minutes |
| B4 | Custom domain resolves over HTTPS | Navigate to `https://iainmorton.me` in browser — no cert warning |

### 5.2 Content
| # | Criterion | How to Verify |
|---|---|---|
| C1 | All 6 work experience roles present | Manually count entries in Experience section |
| C2 | No employer/brand names in rendered HTML | `curl https://iainmorton.me | grep -i "tastecard\|ello\|coffee club\|gourmet\|inspire"` — must return empty |
| C3 | No personal contact info in HTML source | `curl https://iainmorton.me | grep -i "07717\|impingu\|huddersfield"` — must return empty |
| C4 | All 7 skill clusters displayed | Manually verify Skills section renders all clusters from §2.3 |
| C5 | LinkedIn link present and correct | Click LinkedIn button → opens `https://www.linkedin.com/in/iain-morton-7b7485286/` in new tab |
| C6 | GitHub link present and correct | Click GitHub link → opens `https://github.com/impingu1984` in new tab |

### 5.3 Performance
| # | Criterion | How to Verify |
|---|---|---|
| P1 | Lighthouse Performance ≥ 95 | Run `npx lighthouse https://iainmorton.me --only-categories=performance` |
| P2 | Lighthouse Accessibility ≥ 90 | Run `npx lighthouse https://iainmorton.me --only-categories=accessibility` |
| P3 | Page loads < 1.5s LCP | Check Lighthouse LCP value or WebPageTest on 4G throttle |
| P4 | Client JS < 50KB | Run `pnpm build` and inspect `dist/` — check `.js` file sizes |

### 5.4 Security
**Primary target: Mozilla HTTP Observatory A+ score (≥ 115 points)**

| # | Criterion | How to Verify |
|---|---|---|
| S1 | Mozilla Observatory A+ | Run scan at `https://observatory.mozilla.org/analyze/iainmorton.me` — score must be **A+ (≥ 115)** |
| S2 | All 9 security headers present | `curl -I https://iainmorton.me` — verify `content-security-policy`, `strict-transport-security`, `x-frame-options`, `x-content-type-options`, `referrer-policy`, `permissions-policy`, `cross-origin-opener-policy`, `cross-origin-embedder-policy`, `cross-origin-resource-policy` all present |
| S2a | CSP contains nonce, not unsafe-inline | `curl -I https://iainmorton.me | grep content-security-policy` — value must contain `nonce-` and must NOT contain `unsafe-inline` |
| S3 | HSTS max-age ≥ 2 years | `curl -I https://iainmorton.me | grep strict-transport-security` — must show `max-age=63072000` |
| S4 | CSP blocks inline scripts | Open browser console on `https://iainmorton.me` — no CSP violation warnings |
| S5 | Site not embeddable in iframe | `curl -I https://iainmorton.me | grep x-frame-options` — must return `DENY` |
| S6 | Web3Forms key not in repo | `git log -p | grep -i "access_key"` — must return empty or show only placeholder value |
| S7 | No third-party tracking scripts | `curl https://iainmorton.me | grep -i "gtag\|analytics\|pixel\|hotjar"` — must return empty |
| S8 | HTTP redirects to HTTPS | `curl -I http://iainmorton.me` — must return `301` redirect to `https://iainmorton.me` |
| S9 | www redirects to apex | `curl -I http://www.iainmorton.me` — must return `301` with `Location: https://iainmorton.me` |

### 5.5 Responsive / Cross-browser
| # | Criterion | How to Verify |
|---|---|---|
| R1 | Site usable at 320px width | Open Chrome DevTools → set width to 320px → all content readable, no horizontal scroll |
| R2 | Site usable at 1440px width | Open in desktop browser → layout fills space appropriately |
| R3 | Works in Chrome, Firefox, Safari | Manual check in each browser — no layout breakage |

---

## 6. Open Items (Required Before Build Starts)

| # | Item | Owner |
|---|---|---|
| O1 | Confirm accent colour choice | ✅ `#00d4ff` cyan — confirmed |
| O2 | Provide LinkedIn profile URL | ✅ `https://www.linkedin.com/in/iain-morton-7b7485286/` — confirmed |
| O3 | Provide GitHub profile URL | ✅ `https://github.com/impingu1984` — confirmed |
| O4 | Confirm chosen domain name | ✅ `iainmorton.me` — confirmed |
| O5 | ~~Web3Forms access key~~ | ✅ No longer required — contact form removed in favour of LinkedIn |
| O6 | Review anonymised bullet points (drafted in §2.4) and approve | Iain |
| O7 | Write or approve final About/Profile paragraph (anonymised) | Iain |

---

## 7. Project File Structure (Expected)

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── data/
│   │   └── cv.ts          ← Single source of truth for all content
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── About.astro
│   │   ├── Skills.astro
│   │   ├── Experience.astro
│   │   └── Contact.astro
│   ├── layouts/
│   │   └── Base.astro
│   └── pages/
│       └── index.astro
├── functions/
│   └── _middleware.js     ← Cloudflare Pages Function: per-request CSP nonce injection
├── _headers               ← All security headers except CSP (HSTS, X-Frame-Options, etc.)
├── .nvmrc
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

**Key principle:** All content (name, summary, roles, skills) lives in `src/data/cv.ts`. Updating the site = editing one file + `git push`.

---

*Spec status: APPROVED v1.7. Build may commence.*
