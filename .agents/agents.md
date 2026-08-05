# iainmorton.me — Agent Context

**Version:** 0.2
**Status:** In Progress
**Last Updated:** 2026-08-05

---

## Project Overview

`iainmorton.me` is Iain Morton's personal portfolio and blog — an Astro static site (CV/profile,
a blog, and a growing `/tools` section of small self-hosted utilities), deployed to Cloudflare
Pages. No backend, no database; content lives in typed data files and MDX, and the site ships as
static HTML with a strict, nonce-based CSP.

---

## Table of Contents

| File | Purpose |
|---|---|
| `specs/spec-001-sequence-diagram-tool.md` | SPEC-001 — Mermaid sequence diagram tool. v2.9.0, **APPROVED**, not implemented |
| `specs/spec-002-tools-hub.md` | SPEC-002 — `/tools` hub, registry, nav. v1.3.0, **APPROVED**, not implemented. SPEC-001 depends on this (build first) |
| `memory/decisions.md` | Architecture Decision Records |
| `memory/progress.md` | Current state, what's done, what's next |
| `memory/notes.md` | Working notes, gotchas, lessons learned |
| `memory/techdebt.md` | Tech debt register (not yet created — nothing implemented yet to register debt against) |
| `skills/documentation` | Documentation standards and behaviour |

---

## Instructions

- Always read the relevant `specs/spec-NNN-*.md` before implementing anything in that area — there
  is no single `specs.md`, each feature has its own numbered spec file
- Follow all documentation behaviour defined in `skills/documentation`
- Follow project-specific conventions in `skills/`
- Follow Spec Driven Design — refer to spec before implementing
- Flag gaps or inconsistencies in the spec before proceeding — don't assume a spec's claims about
  third-party library behaviour are correct without checking; several non-obvious defects in
  SPEC-001 were only found by actually installing `mermaid@11.16.1` in a scratch sandbox and testing
  real behaviour against the spec's claims (see `memory/decisions.md` ADR-002 through ADR-007)

---

## Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Astro (static output, `output: 'static'`) | Existing choice; zero-JS-by-default fits the site's minimal-dependency ethos |
| Styling | Tailwind CSS v4, CSS-first config (`@theme` in `Base.astro`) | Existing |
| Hosting | Cloudflare Pages | Existing; edge function (`functions/_middleware.js`) handles CSP nonce injection per request |
| Content | MDX via `astro:content` collections for blog posts; plain typed TS arrays (`src/data/cv.ts`, and `src/data/tools.ts` once SPEC-002 ships) for everything else | Not all content goes through content collections — pick whichever the existing sibling pattern uses before inventing a third approach |
| Package manager | npm, Node 24 (`.nvmrc` says `24`, `package.json engines` requires `>=24.0.0`) | Existing. No `.npmrc` exists — `npm install` defaults to caret ranges; anything requiring an exact pin needs `--save-exact` explicitly |
| Security | Nonce-based CSP, `script-src`/`style-src` both `'self' 'nonce-{n}'`, no `unsafe-inline`, no `unsafe-eval` | Site-wide policy; do not weaken without explicit sign-off — see `functions/_middleware.js` and `_headers` |
| OG images | `scripts/generate-og.mjs`, plain Node script (not run through Vite/Astro), `postbuild` step, satori + resvg | Reads MDX frontmatter by regex directly off disk today — extending it for non-MDX content (e.g. the tools registry) needs its own verification, not assumed to work the same way |
| Testing | None yet at repo root — `vitest`/`jsdom` are planned as dev dependencies for SPEC-001, not yet added | First test infrastructure in the repo; no existing pattern to follow |

---

## Key Conventions

- **SDLC:** work on `preview` branch → verify on the Cloudflare preview deployment → PR `preview` →
  `main` → tag. Versioning is semantic (`MINOR` for new features).
- **Draft content:** `draft: true` on a content item + `INCLUDE_CONTENT_DRAFTS=true` (set only on the
  Cloudflare Preview environment) shows drafts on preview, excludes them from production. The
  *mechanism* differs by content type — blog posts are a dynamic `getStaticPaths()` route filtered by
  the collection, so a draft's route is simply never generated; tools are statically named page files
  (`src/pages/tools/{slug}.astro`) that Astro always builds regardless of the flag, so draft exclusion
  there needs a `postbuild` prune step instead (SPEC-002 R-5a, ADR-001). Don't assume one mechanism
  generalises to the other without checking which routing shape you're actually in.
- **CSP is nonce-based and strict.** The middleware generates a per-request nonce and stamps it onto
  every `<script>`/`<style>` tag via regex post-processing of the HTML response — it does not touch
  dynamically-inserted DOM elements. Anything that injects a `<style>`/`<script>` client-side after
  the initial response (e.g. a third-party library's own DOM manipulation) needs to source the nonce
  itself, e.g. via `document.querySelector('[nonce]').nonce` — **not** `document.currentScript.nonce`,
  which is `null` for any `<script type="module">`, which is what Astro emits for client `<script>`
  blocks by default.
- **`cv.ts` has permanent anonymisation rules** in its own header comment (no employer/brand names,
  no personal contact details, preserve metrics and technology names) — respect these when editing
  it, they're not stale boilerplate.
- **Don't trust a spec's claims about third-party library internals at face value** before
  implementing against them — verify empirically where it's cheap to do so (install the package in
  the scratchpad, test real behaviour). This repo's specs are written with unusual technical
  specificity and have mostly held up under scrutiny, but not universally — see `memory/decisions.md`
  for the cases where verification changed the spec.

---

## Sub-Agent Contexts

Not a monorepo — single Astro app, no per-service `agents.md` files needed.
