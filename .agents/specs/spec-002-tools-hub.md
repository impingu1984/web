# Spec — Tools Hub & Navigation

| Field | Value |
| --- | --- |
| Spec ID | `SPEC-002` |
| Version | `1.3.0` — **APPROVED** |
| Date | 2026-08-05 |
| Repo | `impingu1984/web` |
| Routes | `/tools`, plus a primary-navigation entry |
| Status | Not implemented |
| Changed at 1.1.0 | Corrections after reading the repo: Nav has **no** active-state mechanism to reuse (R-13/R-14), and OG image generation needs extending (R-23). |
| Changed at 1.2.0 | **New requirement R-16a** — the shared layout gains a `wide` variant, closing a gap where SPEC-001 R-62 referenced a prop this spec never defined. Plus scoping clarifications to R-20 and R-21 following SPEC-001 v2.0.0's decision to bundle `mermaid` on `/tools/sequence-diagram`. |
| Changed at 1.3.0 | **R-5 mechanism resolved.** Tool pages are statically named files (`src/pages/tools/{slug}.astro`), not a `getStaticPaths` catch-all like blog — so unlike blog, the registry's `draft` flag cannot prevent a page from being built. Resolved with a `postbuild` prune step (R-5a). |

---

## 1. Title & Purpose

### What are we building?

A `/tools` section on `iainmorton.me`: a primary-navigation entry, an index page listing available
tools, and a typed registry that future tools plug into by adding a single data entry.

This exists separately from any individual tool because it is **shared infrastructure**. The
sequence diagram tool (SPEC-001) is the first consumer. The value of this spec is that the second,
third, and fourth tools require no changes to navigation, layout, sitemap, or SEO wiring.

### Why a registry rather than hand-written cards?

Hand-maintained index markup drifts. Every future tool would need someone to remember to edit the
index page, the nav, and the sitemap. A single typed source of truth makes adding a tool a
one-file change and makes omissions a type error rather than a silent gap.

This mirrors the pattern already established in the repo by `src/data/cv.ts` and
`src/data/blogs/`.

### Non-goals

- No search, no tag filtering, no sorting controls on the index (see R-9 — the index ships zero JS).
- No per-tool analytics or usage counters.
- No tool categories or nested sections. A flat list until there are enough tools to warrant more.

---

## 2. Requirements

### 2.1 Registry

**R-1.** A registry SHALL exist at `src/data/tools.ts`, exporting a typed array as the single
source of truth for the tools section.

**R-2.** Each entry SHALL conform to:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `slug` | `string` | Yes | URL segment. Must match `^[a-z0-9-]+$`. Resolves to `/tools/{slug}`. |
| `title` | `string` | Yes | Display name. |
| `summary` | `string` | Yes | 1–2 sentences, max 160 chars — reused as the page meta description. |
| `tags` | `string[]` | Yes | Displayed on the card. Not interactive in v1. |
| `added` | `Date` | Yes | Used for index ordering. |
| `updated` | `Date` | No | Displayed on the card when present. |
| `draft` | `boolean` | Yes | Excluded from production builds. See R-5. |

**R-3.** The registry type SHALL be exported so tool pages can import their own metadata rather
than duplicating title and description strings.

**R-4.** A build-time check SHALL fail the build if a registry `slug` has no corresponding page
under `src/pages/tools/`, or if a page exists with no registry entry. A missing tool must be a
build failure, not a missing card.

**R-5.** `draft: true` entries SHALL be excluded from the production build entirely — no card, no
route, no sitemap entry — and included when `INCLUDE_CONTENT_DRAFTS=true`, which is set on the
Cloudflare Preview environment only.

**R-5a — Prune mechanism.** Blog achieves R-5 natively: `[...slug].astro` sources its paths from
`getStaticPaths()` filtered by `INCLUDE_CONTENT_DRAFTS`, so a draft post's route is simply never
generated. Tool pages do not have that shape — each is a statically named file
(`src/pages/tools/{slug}.astro`, per SPEC-001 §3.2 and §3.3), which Astro builds unconditionally
regardless of the registry's `draft` flag. Route exclusion therefore SHALL be enforced by a build
step, not by routing:

- A `postbuild` script, `scripts/prune-draft-tools.mjs`, SHALL run after `astro build` (and may run
  before or after `generate-og.mjs`; order between the two is not significant since R-23 already
  skips OG generation for draft entries).
- For every registry entry with `draft: true` when `INCLUDE_CONTENT_DRAFTS` is unset, the script
  SHALL delete `dist/tools/{slug}/` (or the equivalent build output path for that route).
- **Sitemap ordering matters.** `@astrojs/sitemap` runs inside `astro build` itself, via its
  `astro:build:done` hook — before `postbuild` runs. A draft tool's URL may therefore already be
  written into `dist/sitemap-*.xml` by the time the route directory is deleted. The prune script
  SHALL also parse the generated sitemap file(s) and remove any `<url>` entry whose `<loc>` matches
  a pruned slug. Deleting the route without also editing the sitemap satisfies half of R-5 and
  silently fails the other half.
- This SHALL be covered by V-6 (draft excluded) in addition to the existing build-output check —
  V-6's pass condition extends to "absent from `dist/sitemap-*.xml`" as well as absent card and
  route.

### 2.2 Index page

**R-6.** `/tools` SHALL render a heading, a short section introduction, and one card per
non-draft registry entry.

**R-7.** Each card SHALL show `title`, `summary`, `tags`, and `updated` where present, and SHALL
link to `/tools/{slug}`.

**R-8.** Cards SHALL be ordered by `added` descending. The whole card SHALL be a single link
target — no nested interactive elements.

**R-9.** `/tools` SHALL ship **zero client-side JavaScript**. It is a static list and has no need
of any.

**R-10.** The cards SHALL be marked up as a list (`<ul>` / `<li>`), not a sequence of `<div>`s, so
assistive technology announces the count.

**R-11.** The layout SHALL hold from 1 to 20 entries without redesign, and SHALL be responsive:
single column on mobile, multi-column above the site's existing medium breakpoint.

**R-12.** An empty non-draft registry SHALL render a graceful "nothing published yet" state rather
than an empty page. This is a correctness requirement, not a cosmetic one — it is the state the
index is in before SPEC-001 ships.

### 2.3 Navigation

**R-13.** A **Tools** entry SHALL be added to the `navLinks` array in `src/components/Nav.astro`,
positioned after **Blog**. That array drives both the desktop `<ul>` and the mobile dropdown, so one
entry covers both. No new nav component.

**R-14.** The nav entry SHALL show as active for `/tools` and every `/tools/*` descendant.

> `Nav.astro` computes `currentPath` from `Astro.url.pathname` but never uses it for styling —
> **there is no active-state mechanism to reuse.** R-14 is therefore new work: extend the `navLinks`
> entries with an optional match rule and apply an active class in both the desktop and mobile
> renders. The `/blog` entry SHOULD gain the same behaviour in the same change, since one highlighted
> nav item and one not is worse than neither.

**R-15.** Every tool page SHALL render a breadcrumb: Home → Tools → *tool title*, with the current
page not linked.

**R-16.** A shared layout or wrapper SHALL exist for tool pages so that breadcrumbs, page heading,
and meta tags are applied consistently and are not re-implemented per tool.

### 2.4 SEO and site plumbing

**R-16a — Width variant.** The shared tool layout SHALL accept a `wide` boolean prop, defaulting to
`false`.

| `wide` | Content width |
| --- | --- |
| `false` (default) | `max-w-4xl mx-auto` inside `px-6 md:px-12 lg:px-24` — identical to every other page on the site |
| `true` | Full viewport width minus the same horizontal padding |

- Both variants SHALL keep `pt-20` clearing the fixed nav, `<Nav />`, the breadcrumb (R-15), the page
  heading, and the site's type and colour tokens. `wide` changes the content container only, so a
  wide tool still reads as part of the site.
- Nav, breadcrumb, and footer SHALL remain within the standard constrained width in both variants —
  a full-width editor pane must not drag the site chrome out to the viewport edge with it.

> **Why this belongs here, not in the tool.** SPEC-001 R-62 needs full width for a three-pane editor
> and cannot work at `max-w-4xl`. That is not specific to sequence diagrams: any tool with a canvas,
> a table, or side-by-side panes will want the same thing. Left to the tool, the second such tool
> reinvents it and the two drift — which is the exact failure mode §1 gives as the reason this spec
> exists. One prop on the shared layout is the cheapest possible version of that decision.

**R-17.** `/tools` and all non-draft `/tools/{slug}` routes SHALL appear in the sitemap. Drafts
SHALL NOT.

**R-18.** Each tool page SHALL emit a title, meta description sourced from `summary`, canonical
URL, and OG/Twitter tags, via the existing site mechanism.

**R-19.** No change to `robots.txt` is required. The section is public and indexable.

**R-23 — Open Graph images.** `scripts/generate-og.mjs` runs as a `postbuild` step and scans
`src/data/blogs` only, so tool pages would silently fall back to `og/default.png`.

- The script SHALL be extended to generate `dist/og/tools-{slug}.png` for every non-draft registry
  entry, reusing the existing satori + resvg pipeline, its font loading, and its hash-based cache.
- Each tool page SHALL pass the generated path to `Base.astro` via its `ogImage` prop.
- Extending the script is preferred over accepting the default: the tools section is intended as a
  portfolio showpiece, and a shared link is the most likely way anyone arrives at it.

### 2.5 Constraints inherited from the site

**R-20.** No new runtime dependency **on the surfaces this spec owns** — `/tools`, the registry, the
nav, and the shared tool layout. Astro and Tailwind only.

> Scoping note added at 1.2.0. SPEC-001 v2.0.0 adds `mermaid@11.16.1` as a runtime dependency, lazily
> loaded, on `/tools/sequence-diagram` only. That dependency SHALL NOT be imported by the index page,
> the registry, the nav, or `ToolLayout`, and SHALL NOT appear in any shared chunk. R-9 (zero client
> JS on `/tools`) and V-2 remain the binding check: if a Mermaid chunk ever appears in the index
> page's network trace, a tool has leaked a dependency into shared infrastructure.

**R-21.** The existing CSP SHALL NOT be modified by this spec. `/tools` requires no script execution.

> Corrected at 1.2.0. The parenthetical "SPEC-001 modifies the CSP" is no longer accurate: SPEC-001
> v2.0.0 targets **zero** CSP changes (its R-35a), handling Mermaid's injected `<style>` element by
> stamping the request nonce rather than by relaxing `style-src`. The only change either spec permits
> is appending `blob:` to `img-src`, and only if PNG export proves impossible with `data:`. Either
> way the change belongs to SPEC-001, not here.

**R-22.** All other security headers remain unchanged.

---

## 3. Technical Constraints

| Concern | Decision |
| --- | --- |
| Framework | Astro (existing), static output |
| Styling | Tailwind CSS (existing), reusing established type scale and spacing |
| Registry | `src/data/tools.ts`, TypeScript, typed |
| Index route | `src/pages/tools/index.astro` |
| Shared layout | `src/layouts/ToolLayout.astro` (or extend the existing layout — confirm against `src/layouts/` during implementation), with the `wide` prop of R-16a |
| Draft prune | `scripts/prune-draft-tools.mjs`, run via `postbuild` alongside `generate-og.mjs` (R-5a) |
| Client JS on `/tools` | Zero |
| Dependencies added | None |

### 3.1 Performance

| Metric | Budget |
| --- | --- |
| Lighthouse (mobile) on `/tools` | 100 / 100 / 100 / 100 |
| Client JS on `/tools` | 0 bytes |
| CLS | 0 |

### 3.2 Accessibility

- Lighthouse Accessibility 100.
- Cards keyboard-navigable in visual order with a visible focus ring.
- Breadcrumb marked up as a `<nav aria-label="Breadcrumb">` containing an ordered list.
- Heading hierarchy unbroken: one `<h1>`, card titles at `<h2>`.

### 3.3 Extensibility contract

Adding a future tool SHALL require exactly these steps, and no edits to navigation, sitemap, or
index markup:

1. Add one entry to `src/data/tools.ts`.
2. Add `src/pages/tools/{slug}.astro` using the shared tool layout, setting `wide` if the tool needs
   it (R-16a).
3. Set `draft: false` when ready to publish.

This contract is itself verified by V-9.

---

## 4. Verification / Acceptance Criteria

Manual verification on the Cloudflare preview deployment (`PREVIEW`), plus automated checks where
they exist. **Definition of done:** V-1 … V-15 all pass.

| ID | Criterion | Method | Pass condition |
| --- | --- | --- | --- |
| V-1 | Index renders | Visit `PREVIEW/tools` | Heading, intro, and one card per non-draft entry |
| V-2 | Zero JS | DevTools → Network, filter JS, hard reload `PREVIEW/tools` | No JS requests beyond any pre-existing site-wide script; no island hydration |
| V-3 | Nav entry | Load any page | **Tools** appears in primary nav, styled identically to siblings |
| V-4 | Active state | Visit `/tools` and `/tools/sequence-diagram` | Nav entry shows active in both cases |
| V-5 | Breadcrumb | Visit a tool page | Home → Tools → title; first two are links, last is not |
| V-6 | Draft excluded | Add an entry with `draft: true`, deploy to preview and inspect production build output | Visible on preview; absent from the production build — no card, no route, no sitemap entry |
| V-7 | Registry/page mismatch fails build | Add a registry entry with no matching page; run `npm run build` | Build exits non-zero with a message naming the offending slug |
| V-8 | Empty state | Temporarily set every entry to `draft: true`, build | Index renders the empty state; no layout break, no error |
| V-9 | Extensibility contract | Add a stub tool following §3.3 only — no other file touched | Card, route, nav active state, breadcrumb, and sitemap entry all correct |
| V-10 | Sitemap | `curl PREVIEW/sitemap-index.xml` and follow to the URL set | `/tools` and each non-draft tool URL present; no draft URLs |
| V-11 | Lighthouse | Run Lighthouse (mobile) on `/tools` | 100 across all four categories |
| V-13 | Active state on Blog too | Visit `/blog` | Blog nav entry highlighted by the same mechanism as Tools |
| V-14 | OG image generated | Build, then inspect `dist/og/` and `curl` the page for `og:image` | `tools-{slug}.png` exists and is referenced; not `default.png` |
| V-15 | Width variant | Render a stub tool page with `wide` unset, then with `wide`, at 1440 px and 768 px | Default matches other site pages exactly; `wide` fills the viewport minus standard padding; nav, breadcrumb, and footer constrained in both; no horizontal overflow at either width |
| V-12 | Headers unchanged | `curl -I PREVIEW/tools`, compare against the README checklist | Identical header set to the rest of the site; CSP unmodified by this spec |

---

## 5. Sign-off

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Author | Iain Morton | ☑ Approved | 2026-08-05 |
