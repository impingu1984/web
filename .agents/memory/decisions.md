# Architecture Decision Records

---

## Template

### ADR-XXX — [Title]

**Date:** [DATE]
**Status:** [Proposed | Accepted | Superseded]

**Context:**
[What is the situation that requires a decision?]

**Decision:**
[What was decided?]

**Rationale:**
[Why was this decision made?]

**Alternatives Considered:**
- [Alternative 1] — rejected because [reason]
- [Alternative 2] — rejected because [reason]

**Consequences:**
[What are the trade-offs or implications?]

---

### ADR-001 — Draft tool route exclusion via postbuild prune

**Date:** 2026-08-05
**Status:** Accepted

**Context:**
SPEC-002 R-5 requires `draft: true` registry entries to produce no card, no route, and no
sitemap entry in production. Blog achieves this natively: `src/pages/blog/[...slug].astro` is a
dynamic route whose `getStaticPaths()` sources paths from `getCollection('blogs', filter)`, so a
draft post's path is simply never generated. Tool pages do not have that shape — both SPEC-001
§3.2 and SPEC-002 §3.3 sketch each tool as its own statically named file
(`src/pages/tools/{slug}.astro`), which Astro builds unconditionally regardless of any registry
flag. R-4's build-time registry/page consistency check also has no existing precedent, since blog
has no separate registry to drift against its content collection.

**Decision:**
Add a `postbuild` script, `scripts/prune-draft-tools.mjs`, that runs after `astro build` (order
relative to `generate-og.mjs` is not significant). For every registry entry with `draft: true`
when `INCLUDE_CONTENT_DRAFTS` is unset, it deletes `dist/tools/{slug}/` and also removes any
matching `<url>` entry from the generated `dist/sitemap-*.xml`.

**Rationale:**
Keeps SPEC-001's per-tool static file layout intact — each tool can be a bespoke page with its
own imports/islands rather than being dispatched through a generic `[slug].astro`, which would
complicate a tool as involved as the sequence diagram editor. Mirrors the existing `postbuild`
pattern already used for OG image generation, so it's a consistent addition to the build pipeline
rather than a new mechanism.

The sitemap half is not optional: `@astrojs/sitemap` writes its output during `astro build`
itself (via `astro:build:done`, which runs before `postbuild`), so a draft tool's URL can already
be present in the sitemap file by the time the route directory is deleted. Pruning only the route
directory would satisfy "no route" but silently fail "no sitemap entry."

**Alternatives Considered:**
- Dynamic `src/pages/tools/[slug].astro` with `getStaticPaths()` off the registry, matching blog
  exactly — rejected because it forces every future tool's bespoke UI to be dispatched through one
  catch-all page rather than living in its own file, which doesn't scale well for a tool as complex
  as SPEC-001's editor.

**Consequences:**
- New build-time script and a new line in SPEC-002 §3 Technical Constraints.
- Does not add a step to SPEC-002 §3.3's three-step extensibility contract — pruning is driven
  entirely by the `draft` flag the author already sets, no extra action required.
- Recorded in SPEC-002 as R-5a (v1.3.0).

---

### ADR-002 — Sequence diagram SVG role: extend, don't overwrite

**Date:** 2026-08-05
**Status:** Accepted

**Context:**
SPEC-001 R-15 originally mandated `role="img"` on the exported SVG. Verified against real
`mermaid@11.16.1` output: the SVG root already carries `role="graphics-document document"` and
`aria-roledescription="sequence"` by default — richer, and arguably more correct for a diagram
with real substructure, than a plain image role.

**Decision:**
The sanitiser extends Mermaid's `role` attribute rather than overwriting it: append `img` as a
final fallback token, producing `role="graphics-document document img"`.

**Rationale:**
ARIA resolves a space-separated role list left to right by first-supported-token. Assistive
technology that understands `graphics-document` gets the richer semantics; anything that doesn't
falls through to `img`. Strictly additive — nothing correct that Mermaid already emits gets
stripped, and it's less code than an overwrite (append vs. replace-and-validate).

**Alternatives Considered:**
- Force `role="img"` as originally specced — rejected: downgrades semantics Mermaid already gets
  right, for no benefit.
- Leave Mermaid's native role untouched, no `img` at all — rejected: loses the safety net for
  older/simpler AT that doesn't recognise `graphics-document`.

**Consequences:**
- SPEC-001 R-15 rewritten (v2.1.0) to specify the append behaviour and explain why.

---

### ADR-003 — `sequence.*` style-document allowlist: expand spacing, exclude fonts

**Date:** 2026-08-05
**Status:** Accepted

**Context:**
SPEC-001 R-16's example style document showed 8 `sequence.*` keys. Verified against
`mermaid@11.16.1`'s real default config: `sequence.*` has ~27 keys. R-17/R-18 validated
"`sequence.*` integers/booleans" generically without enumerating which sub-keys were actually in
scope — a gap in the same allowlist principle R-17 uses to justify itself at the top level
("allowlisted field-by-field copy, never a recursive object merge"). The unlisted keys split into
two groups: spacing/layout numerics (`activationWidth`, `diagramMarginX/Y`, `boxTextMargin`,
`wrap`, `wrapPadding`, `labelBoxWidth/Height`) and per-role font overrides (`actorFontFamily`,
`actorFontSize`, `actorFontWeight`, `noteFontFamily/Size/Weight/Align`,
`messageFontFamily/Size/Weight`).

**Decision:**
`sequence.*` gets a complete, closed allowlist of 16 keys (the original 8 plus the 8 spacing/layout
keys). All 9 per-role font keys are explicitly excluded — rejected as unknown, same as any other
key outside the allowlist.

**Rationale:**
Spacing/layout keys are low-risk (numeric, range-checkable, same validation shape as the existing
8) and materially strengthen the "Spacing" UI group R-21 already promises — one of them
(`wrap`/`wrapPadding`) is also the only lever for controlling how a long message label lays out,
relevant to V-10. Per-role fonts were cut on purpose, not just deprioritised: R-18 already commits
to "one font, everywhere" via the top-level `fontFamily` key (three allowlisted system stacks). A
second, per-role font system would compete with that, and would complicate R-20's bidirectional
sync — the panel would need to represent and reconcile disagreement between `fontFamily` and (say)
`sequence.actorFontFamily`. The tool's own stated purpose (§1.1: "a reusable house style") argues
for one consistent font, not per-role variance.

**Alternatives Considered:**
- Lock the allowlist to exactly the original 8 keys — rejected: leaves real, low-risk value
  (spacing/layout control) on the table for no security benefit, and undersells the "Spacing" UI
  group R-21 already commits to.
- Expand to all ~27 keys including per-role fonts — rejected: reopens a competing font system that
  cuts against R-18's existing "one font" design and adds real complexity to R-20's sync logic for
  no clear benefit given the tool's stated house-style purpose.

**Consequences:**
- SPEC-001 R-17/R-18 rewritten (v2.1.0): R-18 now has a complete `sequence.*` key table with
  type/range and Mermaid's real default for each; range bounds chosen to bracket those defaults so
  **Reset style** (R-23) can never produce a value the validator itself would reject.

---

### ADR-007 — `fontFamily`/`fontSize` merge into `themeVariables`, not Mermaid's config root

**Date:** 2026-08-05
**Status:** Accepted

**Context:**
SPEC-001 R-17 listed `fontFamily`/`fontSize` as top-level allowlisted keys, worded in a way that
implied the allowlisted-copy implementation would write them to Mermaid's config root
(`config.fontFamily`). R-16's example style document nests them inside `themeVariables` instead.
Verified against `mermaid@11.16.1`'s real type definitions and behaviour: both a root-level
`config.fontFamily` and a `themeVariables.fontFamily` genuinely exist and are independently
honoured. Tested all four combinations directly — when both are set to different values,
**`themeVariables.fontFamily` silently wins**, no error, no diagnostic.

**Decision:**
The allowlisted copy SHALL write validated `fontFamily`/`fontSize` values into
`themeVariables.fontFamily`/`themeVariables.fontSize`, matching R-16's example — never to Mermaid's
config root.

**Rationale:**
If the implementation had instead followed a literal "top-level key" reading and written to the
config root, any other code path that later touches `themeVariables.fontFamily` — a preset, a
future feature, even an unrelated bug — would silently override the user's font choice with no
error. That's exactly the class of "looks right in isolation, silently wrong in combination" defect
that's expensive to diagnose after the fact and cheap to prevent by specifying the correct merge
target now.

**Alternatives Considered:**
- Write to the config root as R-17's original wording implied — rejected: demonstrated to be the
  losing side of an undocumented, silent precedence conflict.
- Write to both root and `themeVariables` — rejected: doesn't remove the conflict, just hides which
  value actually took effect, and adds a second, useless write.

**Consequences:**
- SPEC-001 R-17 rewritten (v2.9.0) to state the correct merge target explicitly, with the verified
  precedence behaviour as the rationale.
- D-10's "21 sequence `themeVariables`" figure was stale as a side effect of investigating this —
  corrected to 19 (17 colour variables + `fontFamily` + `fontSize`, matching R-16's example) in the
  same pass.

---

### ADR-006 — R-64 `themeCSS` `url()` ban stays a blanket rule

**Date:** 2026-08-05
**Status:** Accepted (no change made)

**Context:**
V-19 tests that `themeCSS` rejects `url(https://x/a.png)`. R-64's actual rule is a blanket ban on
any `url(` token, no exceptions. Noted a tension while reviewing §4: R-64's allowlisted properties
include `filter`, and SVG `filter` is commonly referenced via `url(#id)` — a same-document fragment
reference, exactly the pattern R-10 already treats as safe elsewhere (verified in §2.2:
`url(#gExp-arrowhead)` is load-bearing and legitimate for arrowhead markers). So R-64 forbids a safe,
same-document use it could in principle allow by applying R-10's own fragment-vs-external
distinction.

**Decision:**
Leave R-64 as a blanket ban. No spec change.

**Rationale:**
Not a security gap either way — the current rule is safe, just more restrictive than strictly
necessary. Simplicity in a security-relevant validator has real value: one less distinction
(fragment vs. external) to get right in `css.ts`, for a narrow benefit (letting a power-user
reference an SVG filter by `url(#id)` in custom CSS).

**Alternatives Considered:**
- Apply R-10's fragment-vs-external distinction to `themeCSS` too, allowing `url(#...)` — rejected,
  explicitly, in favour of keeping the validator simple.

**Consequences:**
- None — recorded so this isn't mistaken for an overlooked bug and re-raised later without context.

---

### ADR-005 — R-59 decompression-bomb guard: streaming size check, not buffer-then-check

**Date:** 2026-08-05
**Status:** Accepted

**Context:**
SPEC-001 R-59 states a 100 KB decompressed-envelope size limit for shareable-link payloads, with
"abort decode, error, load sample" on breach, but specifies no enforcement mechanism. Verified with
a real `CompressionStream`/`DecompressionStream('deflate-raw')` round-trip: a highly repetitive
payload compresses at roughly 336:1 (encoded-fragment-characters to decompressed bytes). A
compressed fragment of a few hundred KB — well under R-57's own 8,000-character refuse threshold —
decompresses to 112.5 MB in ~400ms. The obvious implementation,
`await new Response(stream).arrayBuffer()` followed by a length check, fully materialises that
before the check can run, defeating the limit's purpose. Also verified: checking the *encoded*
fragment length first is not a substitute — a fragment safely under R-57's threshold can still
decompress well past 100 KB, so there's no cheap pre-decompression shortcut.

**Decision:**
R-59's decompressed-size limit SHALL be enforced by incremental reads: get a reader from
`DecompressionStream`'s `readable`, accumulate bytes chunk by chunk, and `cancel()` the stream —
discarding whatever's been produced so far — the instant the running total exceeds 100 KB.

**Rationale:**
This is the only approach that actually bounds the memory/CPU cost of a hostile payload before it's
paid. Buffer-then-check bounds nothing; the full cost is incurred either way, just followed by a
rejection. On a memory-constrained mobile browser, that's a real crash, not a theoretical risk —
directly relevant since §3.5 puts mobile browsers in scope for the load path (R-44's mobile fallback
doesn't apply here, since link loading happens on desktop where the tool is actually usable, but the
principle — bound cost before checking, not after — holds regardless of device).

**Alternatives Considered:**
- Pre-check the encoded fragment length before attempting decompression — rejected: verified
  ineffective, a fragment under R-57's own length threshold can still decompress past the R-59 limit.
- Rely on `Response.arrayBuffer()`'s size and just check afterward — rejected: this is the exact
  naive approach that was demonstrated to fail.

**Consequences:**
- SPEC-001 R-59 rewritten (v2.6.0) to specify the streaming mechanism explicitly, not just the
  policy.
- `link.ts`'s decode implementation is slightly more involved than a single-shot decompress call —
  worth flagging to whoever implements step 10 of §5, since it's easy to reach for the simpler
  buffer-then-check version without realising it doesn't provide the protection R-59 exists for.

---

### ADR-004 — D-14 closed: first-party YAML handling, not a fallback

**Date:** 2026-08-05
**Status:** Accepted

**Context:**
SPEC-001 §3.1 and D-14 described the YAML parser source as open, to "reuse the `js-yaml` instance
already inside the Mermaid bundle where reachable... otherwise a first-party parser." Verified
against the installed `mermaid@11.16.1` dependency tree (direct and transitive): there is no
`js-yaml`, and no generic YAML library at all, anywhere in it. Mermaid's own frontmatter handling
comes from `@mermaid-js/parser`, a purpose-built Langium/Chevrotain grammar for Mermaid's specific
frontmatter shape, not a reusable `load()`/`dump()` API.

**Decision:**
Close D-14: the tool builds its own first-party YAML handling for the style document. This was
never really a fallback — there was nothing to reach for in the primary path.

**Rationale:**
This turns out to be less work than "build a general YAML parser" implies, because R-17/R-18
(ADR-003) restrict the document to a narrow, closed key set with well-typed values. That makes
"panel writes a value" a targeted find-key/replace-value-span edit against the existing text,
rather than a full parse-then-regenerate round trip — which is also what R-20's comment- and
key-order-preservation requirement actually needs. A generic YAML library (had one existed) would
not have given that for free: `js-yaml`'s `dump()` regenerates from the parsed object and does not
preserve comments or original formatting.

**Alternatives Considered:**
- None — the primary path in the original decision (reuse Mermaid's bundled instance) doesn't
  exist to be chosen.

**Consequences:**
- SPEC-001 D-14 rewritten (v2.1.0) from OPEN to RESOLVED.
- No change to the "no second YAML dependency" constraint — it was never violated, just confirmed
  as the only viable path.

---
