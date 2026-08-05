# Progress

**Last Updated:** 2026-08-05

---

## Current Status

Both specs are signed off and approved: SPEC-002 (Tools Hub) v1.3.0, SPEC-001 (Sequence Diagram
Tool) v2.9.0. Neither is implemented yet. SPEC-001's review was unusually deep — nearly every
technical claim was verified against a real installed `mermaid@11.16.1` (or real browser-support
data, or a real Node import-graph trace) rather than taken on faith, taking the spec from v2.0.0 to
v2.9.0 across nine amendments and seven ADRs. The two most consequential findings: R-59's
decompression-bomb guard needed streaming enforcement, not buffer-then-check (ADR-005, demonstrated
a sub-8,000-character fragment decompressing to 112.5 MB before a naive size check could run); R-17
said `fontFamily`/`fontSize` merge into Mermaid's config root, but `themeVariables.fontFamily`
silently wins when both are set, so the original wording risked a user's font choice being silently
overridden (ADR-007). Full list of amendments and ADRs in `decisions.md`/`notes.md`. Sign-off
doesn't remove the two remaining risk gates SPEC-001 already designed for itself — §5 steps 2 and 3
(CSP spike, export spike) are the first code written, and D-8 (bundle Mermaid at all) stays
conditional on them passing in a real browser.

---

## Completed

- [x] SPEC-002 walked section by section against the current codebase and signed off (v1.3.0)
- [x] SPEC-001 §2.1 (diagram source, R-1–R-8), §2.2 (rendering, R-9–R-15), §2.3 (style document,
      R-16–R-23), §2.4 (export, R-24–R-30/R-39/R-40), §2.5 (editor/help, R-36–R-51/R-67), §2.6
      (security, R-31–R-35a), §2.7 (tools-hub integration, R-42/R-43), §2.8 (shareable links,
      R-52–R-61) verified — mostly against a real `mermaid@11.16.1` install in a scratch sandbox
      (§2.8 against real `CompressionStream`/`DecompressionStream` round-trips instead), §2.5's R-67
      finding against current browser-support data, §2.7's finding against SPEC-002's
      already-signed-off R-4. Spec taken v2.0.0 → v2.6.0 across ten amendments: R-15 (role extended
      not overwritten, ADR-002), R-17/R-18 (`sequence.*` allowlist made explicit, ADR-003), D-14
      closed (ADR-004), R-1/R-3/R-7/R-8/R-11 corrected, R-9/R-41d/V-29 `deterministicIds` fix
      applied, R-67 Safari `requestIdleCallback` polyfill required, R-42 cross-spec ordering
      constraint added, R-59 streaming decompression-bomb guard required (ADR-005 — the most
      serious finding of the review so far). §2.6 checked out clean (no `eval`/`new Function` in
      Mermaid's bundle, no external network refs beyond inert XML namespace URIs, dependency count
      re-verified at exactly 21) — no amendment needed there. No outstanding corrections from this
      pass left unapplied. Also produced a working R-38 sample diagram (verified zero-error, saved
      in notes.md) for reuse when `seqdiag-help.ts` is built.
- [x] SPEC-001 §3 (technical constraints, all subsections) verified. Two spec bugs found and fixed:
      §3.1's YAML row still described the pre-D-14 plan (stale, not updated when D-14 closed);
      §3.6 trade-off 3 cited the wrong verification ID (V-56 instead of V-65). Independently
      re-measured the 195 KB Mermaid bundle-size claim via a real Node import-graph trace (18 files,
      156 KB gzipped) — confirmed consistent, no amendment needed. Spec now at v2.7.0.
- [x] SPEC-001 §4 (verification criteria) verified. Structural sweep of all 77 `R-XX` and 67 `V-XX`
      references came back clean (the two flagged `R-XX` hits were false positives — one a correct
      cross-spec reference, one a deliberately-withdrawn old requirement number in §1.4's disposition
      table). One tension found (R-64 `themeCSS` `url()` blanket ban vs. `filter`'s legitimate
      same-document `url(#id)` use) — discussed and deliberately left unchanged, recorded as ADR-006.
- [x] SPEC-001 §5 (implementation order) verified against everything found so far — holds together,
      no reordering needed (R-42's registry-entry constraint already matches step 6; step 10 already
      treats `link.ts` as late/high-caution, which ADR-005 validates rather than contradicts).
      V-60's hostile-payload test strengthened — as originally worded it couldn't distinguish the
      required streaming enforcement (ADR-005) from the unsafe decoder it replaced. Spec now v2.8.0.
- [x] SPEC-001 §6 (decisions table) verified. Found a real correctness bug while double-checking
      D-10's "21 themeVariables" figure: R-17 said `fontFamily`/`fontSize` merge into Mermaid's
      config root, but `themeVariables.fontFamily` silently wins over the root when both are set —
      verified directly. Fixed R-17 to specify the correct merge target (ADR-007), and corrected
      D-10's stale count to 19 in the same pass. Spec now v2.9.0.
- [x] SPEC-001 §7 reviewed (just the sign-off table, nothing to verify beyond confirming the D-8
      gate reference still held). **Signed off by Iain Morton, 2026-08-05, SPEC-001 v2.9.0.** Both
      specs are now approved; neither is implemented.

---

## In Progress

- [ ] §5 gates (CSP spike, export spike) still unresolved code-side — this is now the actual next
      implementation step, not a review step. The `document.currentScript` risk for R-11 already has
      a corrected mechanism written into the spec (ADR from §2.2/§2.6 research), ready to test in the
      spike rather than being discovered live.

---

## Next

- [ ] Decide which spec to implement first (SPEC-002 is smaller/unblocked; SPEC-001's step 1 is
      SPEC-002 itself, so it needs building regardless)
- [ ] For SPEC-001: start with §5 step 2 (CSP spike) — deploy a minimal island to preview, verify
      V-31/V-32/V-33, using the corrected `document.querySelector('[nonce]').nonce` mechanism
      (R-11) rather than the originally-specced `document.currentScript.nonce`, which would have
      failed
- [ ] Then §5 step 3 (export spike) — PNG export on Chrome, Firefox, and Safari specifically

---

## Blockers

- None. Both specs are signed off. SPEC-001's own §5 steps 2 and 3 remain hard gates on the bulk of
  its implementation, but that's by design, not a blocker on starting.

---

## Session Notes

### 2026-08-05

Read both specs cold, reviewed SPEC-002 against the actual repo (Nav.astro, content.config.ts,
blog index/slug pages, BlogCard/BlogList, Base.astro/BlogPost.astro, generate-og.mjs,
astro.config.mjs, functions/_middleware.js) rather than taking the spec's claims at face value.

Found and resolved one real gap: R-5's draft-exclusion mechanism assumed blog's dynamic-route
pattern, which doesn't apply to tools' static per-file pages. Resolved as ADR-001 (postbuild prune
script) and written into SPEC-002 as R-5a, v1.3.0. Also noted (not blocking, see notes.md):
BlogCard/BlogList aren't reusable as a starting point for the tools index given R-8/R-9's stricter
single-link-target and zero-JS requirements, and R-23's OG script extension needs a quick spike to
confirm Node 24 can import `src/data/tools.ts` from a plain `.mjs` postbuild script.

SPEC-002 signed off by Iain Morton, 2026-08-05.

Moved to SPEC-001. Rather than reviewing it as prose, installed `mermaid@11.16.1` in the scratchpad
and tested its actual behaviour against the spec's claims — found the spec was right about most of
the security-critical stuff (R-4's onclick call sites, R-9's htmlLabels/byFo/foreignObject path,
R-9's useMaxWidth behaviour, R-7's hash-based line info) but wrong or incomplete on several
specifics: R-11's `document.currentScript.nonce` mechanism will likely fail for Astro's
module-script islands (fix identified: query an already-nonced element's `.nonce` IDL property
instead); R-9's `deterministicIds` does not mean stable-across-renders (it's a monotonic counter,
threatens R-41d's snapshot-testing gate — unresolved, needs a fix before step 12 of §5); R-8's hint
table lists a non-existent error case ("unknown participant" — Mermaid auto-declares actors) and
misses two real ones (deactivate-without-activate, destroy-without-message); R-7's `hash.line` is
0-indexed while `hash.loc.first_line` is 1-indexed, an off-by-one trap for click-to-locate.

Three amendments made and written into the spec directly (v2.0.0 → v2.1.0): R-15's SVG role now
extends Mermaid's own `role` attribute instead of overwriting it (ADR-002); R-17/R-18's
`sequence.*` allowlist is now a complete closed list — 8 new spacing/layout keys added, all 9
per-role font keys explicitly excluded to keep one font system, not two (ADR-003); D-14 closed —
no `js-yaml` or any YAML library exists anywhere in Mermaid's dependency tree, so the first-party
parser was never really a fallback (ADR-004).

Next session: continue the walkthrough from §2.4 (export). The `deterministicIds`/snapshot-testing
problem found in §2.2 is still open and needs a concrete fix (likely `vi.resetModules()` per
snapshot test, or ID-normalisation before diffing) before R-41d can be trusted.
