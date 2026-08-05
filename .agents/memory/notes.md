# Notes

Working notes, gotchas, lessons learned, and useful references.

---

## Gotchas

- `@astrojs/sitemap` writes its output during `astro build` (via the `astro:build:done` hook),
  which runs *before* the `postbuild` npm script. Any postbuild step that needs to affect the
  sitemap (e.g. pruning draft tool routes, ADR-001) must edit the generated sitemap file directly —
  deleting build output afterward doesn't retroactively remove it from `dist/sitemap-*.xml`.
- `scripts/generate-og.mjs` runs as plain `node scripts/generate-og.mjs`, not through Vite/Astro,
  and currently gets its data by regex-parsing MDX frontmatter straight off disk. Extending it for
  SPEC-002 R-23 (tool OG images) means importing `src/data/tools.ts`, a real TypeScript module,
  from that plain script. Node 24 (this repo's pinned engine) has native type-stripping, so a plain
  `import()` of a `.ts` file should work — but it's unverified in this repo and uses a different
  mechanism than the script's existing MDX-regex approach. Spike this before assuming it's trivial.
- **[Now written into SPEC-001 v2.2.0, R-11]** nonce-stamping mechanism
  (`document.currentScript.nonce`) is very likely broken: `document.currentScript` is spec'd to be
  `null` while a *module* script executes, and Astro compiles client `<script>` blocks (without
  `is:inline`) to `<script type="module">`. Use `document.querySelector('[nonce]').nonce` instead —
  reads the IDL property (which browsers keep live for same-document script even though the
  reflected attribute is blanked), works regardless of module vs. classic script. Still untested
  against a real Astro build — confirm in the CSP spike (SPEC-001 §5 step 2, V-31–V-33).
- **[Now written into SPEC-001 v2.2.0, R-7]** `diagnostics.ts` must use `error.hash.loc.first_line`
  for click-to-locate, not `error.hash.line` — verified against a real parse error from
  `mermaid@11.16.1`: `hash.line` is 0-indexed, `hash.loc.first_line`/`last_line` is 1-indexed and
  matches the human-readable message. Using `hash.line` directly will put every click-to-locate one
  line too high.
- **[Now written into SPEC-001 v2.2.0, R-3]** diagram-type guard: `mermaid.parse(source, { suppressErrors: true })` returns
  `{ diagramType, config }` without rendering — a sequence diagram reports `diagramType: 'sequence'`
  (not `'sequenceDiagram'`). There's no working `detectType` export at runtime despite it appearing
  in the `.d.ts`; use `parse()`'s return value instead.
- SPEC-001's R-4 guard cannot rely on Mermaid rejecting `link`/`links`/`properties` itself — verified
  `mermaid.parse()` parses a `link` statement with zero error. Also verified the `onclick` attribute
  Mermaid attaches to actor popups (4 call sites in the sequence bundle) is gated by
  `links.length && !forceMenus`, so `sequence.forceMenus: false` (R-9) does *not* suppress it when a
  `links` array is present — the first-party pre-render guard (R-4) is the only thing that stops this,
  not a config flag.
- **[Now written into SPEC-001 v2.2.0, R-1]** exact `mermaid` pin, no caret/tilde: this repo has no
  `.npmrc` and `npm config get save-exact` is `false`. A plain `npm install mermaid@11.16.1` writes
  `"mermaid": "^11.16.1"` to `package.json` — the range R-1 forbids. Must use
  `npm install mermaid@11.16.1 --save-exact` (or hand-edit after) when adding the dependency.
- SPEC-001's R-5 (frontmatter strip) is a real risk, not a hypothetical one — verified with
  `mermaid@11.16.1`: a diagram with `config:\n  theme: forest` in frontmatter has `theme: forest`
  come back in `parse()`'s returned config, i.e. it would genuinely compete with the separate Style
  document if left unstripped. `securityLevel: loose` in the same frontmatter was silently dropped
  by Mermaid itself before reaching config — a second, independent layer under R-9/R-17, but not a
  reason to relax R-5 (style ambiguity is the thing being guarded against, and that part is real).
- SPEC-001's R-7 hash-bearing-error shape holds on the real `render()` call path, not just `parse()`
  — verified by rendering (with `CSSStyleSheet`/`SVGElement`/etc. polyfilled into jsdom) a malformed
  diagram through `mermaid.render()` directly; same `hash.line` (0-indexed) /
  `hash.loc.first_line` (1-indexed) shape as `parse()`. A *valid* diagram failed at `render()` on
  `getBBox is not a function` — a jsdom SVG-layout gap, not a Mermaid problem; real rendering needs
  an actual browser (§5 step 2/3 spikes), not informative beyond that.
- **[Now written into SPEC-001 v2.2.0, R-8]** hint-table content: "unknown participant" (listed as a
  common case) does not occur — Mermaid auto-declares any actor referenced anywhere
  (`note left of Zzz`, `activate Ghost` both parse clean). Two real cases to use instead, both
  verified: `deactivate` on a never-activated participant throws
  `"Trying to inactivate an inactive participant (X)"` with a normal hash/line; `destroy X` with no
  matching destroying message throws
  `"The destroyed participant undefined does not have an associated destroying message..."`
  (note the literal, confusing "undefined" — a Mermaid interpolation bug) **with no `.hash` at
  all** — this is the concrete case that exercises R-7's no-line-info fallback path, not a
  theoretical edge case.
- **[Now written into SPEC-001 v2.3.0, R-9/R-41d/V-29]** SPEC-001 R-9's claim that `deterministicIds: true` gives
  "stable element IDs so export diffs and snapshot tests are meaningful" is false as tested: IDs
  (`actor0`→`actor1`→`actor2`...) increment via a persistent module-level counter on every
  `render()` call, unaffected by `deterministicIds` or `deterministicIDSeed`; `mermaidAPI.reset()`
  doesn't reset the counter either. Threatens R-41d's CI snapshot gate (false-positive diffs on
  every run) and V-29's manual "identical geometry, only fill/stroke differ — verify by diff" test
  (confirmed by direct testing: two renders with identical `sequence` spacing but different
  `themeVariables` produced byte-identical output once IDs were normalised out of the comparison,
  but showed spurious diffs otherwise). Fix applied: normalise IDs at the point of comparison only
  (vitest snapshot serializer for R-41d, explicit step in V-29's manual procedure) — the render
  pipeline itself needs no change, since a single exported artefact is internally self-consistent
  regardless of its IDs' numeric values; the instability only matters when comparing two separate
  renders. R-9's rationale line corrected too.

- **[Now written into SPEC-001 v2.9.0, R-17 / D-10, see ADR-007]** `fontFamily`/`fontSize` must
  merge into `themeVariables`, not Mermaid's config root — verified Mermaid has both a genuine
  root-level `config.fontFamily` and a separately-honoured `themeVariables.fontFamily`, and
  `themeVariables.fontFamily` silently wins when both are set differently. Writing to the root (a
  literal reading of R-17's original "top-level keys" wording) would have risked the user's font
  choice being silently overridden by any other code path that later touches
  `themeVariables.fontFamily`. Found while double-checking D-10's "21 themeVariables" figure against
  R-16's example, which turned out to be stale too — corrected to 19.
- **[Now written into SPEC-001 v2.8.0, V-60]** the hostile-payload acceptance test needed
  strengthening after ADR-005: as originally worded ("a payload decompressing past 100 KB"), a
  bomb that decompresses to just ~105 KB would satisfy it — but a naive buffer-then-check decoder
  handles that fine too, cheaply, with no responsiveness problem. That test payload couldn't catch
  a regression back to the unsafe implementation ADR-005 replaced. Needs a payload compressed at a
  high ratio (tens of MB if fully materialised) to actually exercise the difference between
  streaming enforcement and buffer-then-check.
- **[Now written into SPEC-001 v2.7.0, §3.1/§3.6]** Two stale/wrong cross-references found by sweeping
  §3 rather than re-reading it as prose: §3.1's YAML stack-table row still described the pre-D-14
  "reuse `js-yaml`" plan after D-14 was already closed (only the Decisions-table row got updated at
  the time, not this one); §3.6 trade-off 3 cited V-56 (themeCSS-in-links test) where it clearly
  meant V-65 (the snapshot gate) — unrelated tests, easy to miss since both are valid IDs. Swept all
  67 `V-XX` citations in the document afterward for references to nonexistent IDs — none found, but
  that sweep only catches missing IDs, not other wrong-but-valid mismatches like this one.
- **[Verified, no spec change needed]** §3.3's 195 KB Mermaid gzipped-bundle claim: an initial naive
  check (gzip just `mermaid.esm.min.mjs` + the sequence chunk) gave 40.8 KB — wrong, because that
  entry file dynamically imports the real work (d3, dagre layout, shared utilities) as separate
  chunks at runtime, so tracing only 2 files massively undercounts what loads. Used a Node
  `--experimental-loader` hook to trace every file actually `import()`ed during a real `render()`
  call (18 files) and gzipped the complete set: **156 KB gzipped, 935 KB raw**, using the unminified
  `mermaid.core` entry (mermaid ships both; a real production build would run this through a
  minifier first, likely landing somewhat lower). Consistent with, and if anything favourable to,
  the spec's stated 195 KB figure and ≤230 KB budget.
- **[Now written into SPEC-001 v2.6.0, R-59]** `CompressionStream`/`DecompressionStream` are real,
  working globals in Node 24 (confirmed by direct test) — validates R-41's `link.ts` `[pure*]` claim.
  Built the exact R-54 codec (JSON envelope → UTF-8 → `deflate-raw` → base64url) and round-tripped
  it; the R-38 sample diagram plus the full Site style document produces a 792-character URL, well
  under R-57's 2,000-char warning threshold — a useful real-world sizing baseline. Malformed payloads
  (garbage base64, empty string, valid-base64-but-not-deflate, truncated real payloads) all throw
  catchable `TypeError`s, confirming V-59 is achievable as long as the decode path is
  try/catch-wrapped, which R-59 already requires. See ADR-005 for the more serious finding
  (decompression-bomb guard needed streaming enforcement, not buffer-then-check).
- **[Now written into SPEC-001 v2.5.0, R-42]** SPEC-002 R-4's build-time registry/page consistency
  check fails unconditionally (draft or not) if a registry slug has no corresponding page under
  `src/pages/tools/`. SPEC-001 §5's own implementation order doesn't create the route file until
  step 6, so the R-42 registry entry must land in the same commit as that step, not any earlier —
  adding it during step 1 (SPEC-002 setup) would trip SPEC-002's own check with a confusing
  failure. A cross-spec sequencing gap, not a contradiction between the two specs.
- **[Now written into SPEC-001 v2.4.0, R-67]** Safari does not support `requestIdleCallback` in any
  stable release (desktop or iOS) — confirmed via current browser-support data (MDN, caniuse), not
  local Mermaid testing. WebKit ships it only behind a developer feature flag. Since §3.5 puts
  Safari in scope, R-67's idle-preload trigger silently never fires there — Safari visitors only
  get the Mermaid chunk loading on first real interaction (keystroke/rail click), not proactively
  during idle time like Chrome/Firefox/Edge visitors do. Needs a `setTimeout`-based
  `requestIdleCallback` polyfill, the standard shim for this gap.
- Verified (`mermaid@11.16.1`, real `parse()`/`render()`) a sample diagram covering every R-38
  construct with zero errors — worth reusing directly when `seqdiag-help.ts` is authored (§5 step
  11) rather than re-deriving one from the requirement text:
  ```
  sequenceDiagram
      title Coffee Order
      autonumber
      actor Customer
      participant B as Barista
      participant Machine
      Customer->>B: Order a latte
      activate B
      B->>Machine: Start brew
      Machine-->>B: Brew ready
      B->>B: Prepare cup
      Note over Customer,B: Order takes about 3 minutes
      alt Payment succeeds
          B-->>Customer: Here's your latte
      else Payment fails
          B-->>Customer: Sorry, payment declined
      end
      deactivate B
  ```

---

## Lessons Learned

- `BlogCard.astro` and `BlogList.astro` are not safe to extend for the tools index: `BlogList` ships
  a "Load more" `<script>` (violates SPEC-002 R-9, zero client JS), and `BlogCard` has two separate
  `<a>` tags to the same destination (violates R-8, single link target / no nested interactive
  elements). The tools index card/list needs to be built fresh, not extended from these.
- When a spec claims it "follows the existing X convention exactly," check the actual mechanism
  before taking that at face value — SPEC-002 v1.2.0's R-5 claimed to follow blog's draft-exclusion
  convention, but blog achieves it via a dynamic route (`getStaticPaths` filtering), which doesn't
  exist for tools' static per-file pages. Caught by reading `src/pages/blog/[...slug].astro`
  directly rather than trusting the spec's description of it. See ADR-001.

---

## Useful References

- [None yet]

---

## Scratch

[Temporary working notes — can be cleared between sessions]
