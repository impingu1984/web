# Spec — Sequence Diagram Tool

| Field | Value |
| --- | --- |
| Spec ID | `SPEC-001` |
| Version | `2.9.0` — **APPROVED** |
| Date | 2026-08-05 |
| Repo | `impingu1984/web` |
| Route | `/tools/sequence-diagram` |
| Depends on | **SPEC-002 (Tools Hub) — implemented and signed off** |
| Status | Approved, not implemented — §5 steps 2 and 3 (CSP spike, export spike) are gates on the first code written |

### Changelog

| Version | Change |
| --- | --- |
| 0.1.0 | Initial draft with five open decisions |
| 1.0.0 | D-1…D-5 resolved. vitest + CI, export theme override, OS-preference default, sample-on-load |
| 1.1.0 | Collapsible help rail: syntax reference + user guide (R-45…R-51) |
| 1.2.0 | Shareable links (R-52…R-61). Reversed the "no sharing" and "no persistence" non-goals |
| 1.3.0 | Corrections after reading the repository. Zero CSP changes targeted; `data:` over `blob:`; site is dark-only |
| 2.0.0 | Breaking. The custom DSL is withdrawn and replaced by Mermaid `sequenceDiagram` syntax, rendered by a bundled `mermaid@11.16.1`. Styling moves out of the diagram source into a separate Mermaid-native YAML config document. Consequences: the 40 KB JS budget is withdrawn and replaced (§3.3), the `[pure]` module architecture is reduced (§3.2), Lighthouse Performance 100 on mobile is no longer a target (§3.3), and two former non-goals are reversed. Requirement disposition in §1.4. |
| 2.1.0 | Corrections after verifying `mermaid@11.16.1`'s actual installed behaviour (not just its docs). R-15 amended: role is extended, not overwritten. R-17/R-18 amended: `sequence.*` sub-key allowlist made explicit (8 new spacing/layout keys added, all per-role font keys excluded). D-14 closed: no `js-yaml` or any generic YAML library exists anywhere in Mermaid's dependency tree, so the first-party parser is not a fallback, it's the only option. |
| 2.2.0 | Further corrections from the same verification pass. R-1: `--save-exact` required, repo has no `.npmrc`. R-3: exact type-detection mechanism specified (`parse()`'s `diagramType`, not a nonexistent `detectType`). R-7: `hash.loc.first_line` vs. 0-indexed `hash.line` off-by-one documented; confirmed a real no-hash error case exists. R-8: hint-table example list corrected — "unknown participant" doesn't occur, replaced with two real verified cases. R-11: nonce-capture mechanism corrected from `document.currentScript.nonce` (breaks for module scripts) to querying an already-nonced element's `.nonce` property. `deterministicIds`/snapshot-testing risk (R-9, R-41d, V-29) identified, resolution still open. |
| 2.3.0 | `deterministicIds`/snapshot-testing risk resolved. R-9's rationale corrected (the setting is non-random, not cross-render-stable). R-41d and V-29 both amended to normalise IDs before comparison. Render pipeline and exported artefacts unaffected — the instability only matters when comparing two separate renders, which only these two verification paths do. |
| 2.4.0 | R-67 amended: Safari has no `requestIdleCallback` in any stable release (verified against current browser-support data), so the idle-preload trigger silently never fires there. A `setTimeout`-based polyfill is now required so all four supported browsers get equivalent lazy-load behaviour. |
| 2.5.0 | R-42 amended: explicit ordering constraint with SPEC-002 R-4's build-time registry/page consistency check — the registry entry must land in the same commit as the §5 step-6 route shell, not any earlier, or SPEC-002's own build check fails. |
| 2.6.0 | R-59 amended: the 100 KB decompressed-envelope limit SHALL be enforced by incremental reads with an early `cancel()`, not by fully buffering the decompressed stream first — verified a naive full-buffer decode lets a sub-8,000-character fragment (under R-57's own refuse threshold) balloon to 100+ MB in memory before any size check can run. |
| 2.7.0 | Two spec bugs fixed in §3: the YAML row in §3.1's stack table still described the pre-D-14 "reuse `js-yaml`" approach, now corrected to match the resolved decision; §3.6 trade-off 3 cited V-56 (themeCSS-in-links) where it meant V-65 (the snapshot gate), now corrected. §3.3's 195 KB Mermaid bundle-size claim independently re-measured by tracing every file a real render actually imports (18 files, not the 2 an initial naive check used) — 156 KB gzipped unminified, consistent with the spec's figure. |
| 2.8.0 | V-60 strengthened: the hostile-payload test now requires a bomb that would decompress to tens of MB, not merely "past 100 KB" — a barely-over-limit payload doesn't distinguish R-59's required streaming enforcement (ADR-005) from the unsafe buffer-then-check approach it replaced, so the weaker wording couldn't actually catch a regression back to it. |
| **2.9.0** | **R-17 amended: `fontFamily`/`fontSize` merge into `themeVariables`, not Mermaid's config root — verified `themeVariables.fontFamily` silently wins over a root-level `config.fontFamily` when both are set, so writing to the root (a literal reading of the old text) risked the user's font choice being silently overridden by any other code path touching `themeVariables.fontFamily`. D-10's stale "21 themeVariables" count corrected to 19, matching R-16's example.** |

---

## 1. Title & Purpose

### 1.1 What are we building?

A browser-based **Mermaid sequence diagram editor** hosted on `iainmorton.me`. The user writes
standard Mermaid `sequenceDiagram` source in one pane; a live SVG preview renders alongside; the
result exports as SVG, PNG, self-contained HTML, or a shareable link.

Two things distinguish it from the Mermaid Live Editor and from `sequencediagram.org`:

1. **Style lives in its own document.** Diagram structure and visual style are two separate
   editable files, not one interleaved blob. The same style document can be reused across
   diagrams, exported, imported, and kept in version control next to a project's docs.
2. **A Style UI drives that document.** Mermaid's theming is powerful but its variable names
   (`actorBkg`, `labelBoxBkgColor`, `altSectionBkgColor`) are undiscoverable. A control panel
   presents them as named, previewed, validated controls, writing Mermaid-native YAML underneath.

The style document is a **Mermaid config document**, not an invented format. Anything the tool
writes can be pasted into Mermaid frontmatter and will render identically on GitHub, in the Live
Editor, or through `mmdc`. The tool adds a UI and an export pipeline on top of Mermaid; it does not
fork it.

### 1.2 Why?

1. Replaces a third-party dependency in the author's day-to-day toolchain with a self-hosted one,
   **without inventing a syntax** — diagrams remain portable to every other Mermaid consumer.
2. Serves as a public demonstration piece on the portfolio site, and the first entry in `/tools`.
3. Produces themed diagram assets that visually match documents and decks without post-editing,
   and a reusable house style that makes that repeatable.

### 1.3 Who is it for?

- **Primary user:** the site owner (Iain), on desktop.
- **Secondary:** any public visitor. The route is public and indexed, but no feature is designed
  around anonymous-visitor needs.

### 1.4 Requirement disposition, v1.3.0 → v2.0.0

Every v1.3.0 requirement is accounted for. Nothing is silently dropped.

| v1.3.0 | Disposition in v2.0.0 |
| --- | --- |
| R-1 … R-5 (custom DSL grammar) | **WITHDRAWN.** Replaced by R-1…R-5 (Mermaid source, new meanings) |
| R-6 (tolerant parse) | **WITHDRAWN.** Mermaid throws on first error. Replaced by R-6 (last-good-render) |
| R-7, R-8 (diagnostics) | **AMENDED.** Diagnostics now derive from Mermaid errors, best-effort line mapping |
| R-9, R-10, R-11 (pure renderer, TextMeasurer, layout) | **WITHDRAWN.** Mermaid owns layout and measurement |
| R-12, R-13 (debounce, zoom/pan) | **KEPT**, R-12 debounce raised to 150 ms |
| R-14, R-15 (inert SVG, a11y) | **KEPT and strengthened.** Now enforced by a sanitiser (R-10) because the output is third-party |
| R-16 … R-19a (custom theme tokens) | **WITHDRAWN.** Replaced by §2.3, Mermaid `themeVariables` |
| R-20 (bidirectional sync) | **KEPT**, and materially simplified — the two documents no longer interleave |
| R-21, R-22, R-23 | **KEPT** |
| R-24 … R-30 (export) | **KEPT**, R-25 amended for the style-inlining requirement |
| R-31 … R-35a (security) | **KEPT.** R-34 amended: exactly one runtime dependency |
| R-36 … R-38 (editor, sample) | **KEPT**, R-38 extended by R-38a (pre-rendered sample) |
| R-39, R-40 (export palette override) | **KEPT**, reimplemented as a style-document swap |
| R-41 … R-41c (testing, CI) | **KEPT**, scope narrowed with §3.2 |
| R-42, R-43 (tools hub) | **KEPT unchanged** |
| R-44 … R-51 (mobile, help rail) | **KEPT**, R-46 and R-51 rewritten for a grammar we do not own |
| R-52 … R-61 (shareable links) | **KEPT**, payload version raised to `2` — two documents, not one |
| R-62, R-63 (page width, OG) | **KEPT unchanged** |

### 1.5 Non-goals

Explicitly out of scope. Listed so they are not silently reintroduced.

- No backend, no database, no server-side rendering of diagrams at request time.
- No accounts, no auth, no collaboration or multi-user editing.
- No server-side or browser-storage persistence. State lives in the editor and, on explicit user
  action, in a shareable link (§2.8) or a downloaded file.
- No link shortening, no hosted gallery, no server-side record of any shared link.
- **No diagram types other than `sequenceDiagram`.** Mermaid supports eighteen; this tool renders
  one and rejects the rest with a clear message (R-3). Supporting more is a future spec, not a
  stretch goal.
- No Mermaid feature that requires script execution in the output — specifically actor links and
  popup menus (R-4).
- No modification of Mermaid. It is a pinned, unpatched dependency.
- No analytics or telemetry, in line with existing site policy.
- No mobile editing experience beyond the read-only fallback in R-44.

**Reversed at 2.0.0:** "no import from, or export to, Mermaid" is withdrawn — Mermaid
interoperability is now the premise. "Zero runtime dependencies" is withdrawn and replaced by
"exactly one, pinned" (R-34).

---

## 2. Requirements

### 2.1 Diagram source

**R-1.** The diagram source SHALL be a Mermaid document parsed and rendered by
**`mermaid@11.16.1`, pinned to an exact version** with no caret or tilde range. Mermaid's rendered
class names and theme variables are this tool's styling contract; a range would let a patch release
restyle every diagram silently. Upgrades SHALL be a deliberate PR carrying updated snapshots (R-41).

> **Verified:** this repo has no `.npmrc` and `npm config get save-exact` is `false`, so a plain
> `npm install mermaid@11.16.1` writes `"mermaid": "^11.16.1"` — the exact range R-1 forbids.
> Installation SHALL use `npm install mermaid@11.16.1 --save-exact` (or the `package.json` entry
> SHALL be hand-verified as an exact version after install).

**R-2.** The tool SHALL accept any construct Mermaid's `sequenceDiagram` grammar accepts, except
those forbidden by R-4. A **verified subset** is defined as the constructs covered by the help
reference (R-46) and by the acceptance test V-1:

| Group | Constructs |
| --- | --- |
| Structure | `sequenceDiagram`, `title`, `participant`, `actor`, `as` aliases, `box` … `end` |
| Messages | `->`, `-->`, `->>`, `-->>`, `-x`, `--x`, `-)`, `--)`, self-messages |
| Lifecycle | `activate`, `deactivate`, `+` / `-` shorthand, `create`, `destroy` |
| Annotations | `note left of`, `note right of`, `note over`, `rect` |
| Blocks | `alt` / `else`, `opt`, `loop`, `par` / `and`, `critical` / `option`, `break` |
| Meta | `autonumber`, `%%` comments, `accTitle`, `accDescr` |

Constructs outside the verified subset SHALL render if Mermaid supports them, but SHALL NOT be
documented in the help rail and SHALL NOT be covered by acceptance tests. This distinction SHALL be
stated in the Guide tab: *we render all of Mermaid; we vouch for this list.*

**R-3.** A source whose first non-comment, non-frontmatter statement is not `sequenceDiagram` SHALL
be rejected before rendering, with a message naming the detected diagram type and stating that this
tool renders sequence diagrams only. It SHALL NOT attempt to render other diagram types even though
the bundled Mermaid is capable of it — the chunk cost of every other renderer is not paid (§3.3),
and none of them are styled, tested, or documented here.

> **Verified mechanism:** there is no working `detectType` export at runtime despite one appearing
> in Mermaid's `.d.ts`. Detection SHALL instead use `mermaid.parse(source, { suppressErrors: true })`,
> which returns `{ diagramType, config }` without rendering anything. A sequence diagram reports
> `diagramType === 'sequence'` — **not** `'sequenceDiagram'` — the guard SHALL compare against the
> reported type, not the grammar keyword.

**R-4 — Forbidden constructs.** The `link`, `links`, and `properties` statements SHALL be rejected
at parse time with a specific diagnostic explaining why.

> Verified against the bundled renderer: these statements make Mermaid emit actor popup menus
> carrying **inline `onclick` attributes** (four call sites in `sequenceDiagram-*.js`). Those are
> blocked by the site CSP, and they would place executable attributes into exported SVG and HTML,
> breaking R-14. Rejecting the statement is preferable to silently stripping the attribute, because
> silently stripping produces a menu that looks interactive and is not.

**R-5 — Frontmatter is not a style channel.** If the diagram document contains a YAML frontmatter
block, the tool SHALL strip it before rendering and raise a `warning` diagnostic pointing the user
at the Style tab. Style has exactly one source of truth: the style document (§2.3). Permitting both
would recreate, across two files, the ambiguity that R-4 of v1.3.0 existed to resolve.

**R-6 — Error behaviour.** Mermaid aborts on the first syntax error rather than parsing tolerantly.
Therefore:

- On a failed parse, the preview SHALL continue to display the **last successful render**, visibly
  marked as stale (reduced opacity plus a status line), and the error SHALL be reported per R-7.
- The preview SHALL NOT blank, SHALL NOT show a Mermaid error graphic, and SHALL NOT show a
  partially rendered diagram.
- This is a behavioural regression against v1.3.0's tolerant parser and is accepted as the cost of
  not owning the parser. It is recorded in §3.6.

**R-7.** Parse errors SHALL be surfaced as `{ line number, severity, message }` beneath the editor.
Mermaid's error objects carry a `hash` with line information for most failures; where a line number
is available it SHALL be used, the entry SHALL be clickable, and it SHALL move the caret and mark
the gutter. Where no line number is available the entry SHALL still render, without a line number
and without a click target, rather than being suppressed.

> **Verified — off-by-one trap:** a real parse error's `hash` carries two line fields with different
> indexing: `hash.line` is **0-indexed**, `hash.loc.first_line` / `last_line` is **1-indexed** and
> matches the human-readable text in the thrown error's `message`. `diagnostics.ts` SHALL use
> `hash.loc.first_line`; using `hash.line` directly puts every click-to-locate one line too high.
> Also verified: `render()` throws the identical hash shape as `parse()`, so this applies uniformly
> to the actual re-render path (R-12), not just an initial parse.
>
> Also verified: not every error carries a `hash` — a semantic error (e.g. `destroy` with no
> matching destroying message, see R-8) is thrown with no `hash` at all. The "no line number,
> render anyway" fallback above is exercised by a real, common case, not a theoretical one.

**R-8.** Mermaid's raw error text SHALL be shown verbatim, prefixed by a plain-language hint drawn
from a lookup table of the common cases (unclosed `alt`/`loop`/`opt`, `else` outside a block,
`deactivate` without a prior `activate`, `destroy` without a matching destroying message, missing
`end`). The verbatim text is kept because it is searchable against Mermaid's own documentation and
issue tracker; the hint is added because it is not friendly.

> **Verified against real parse/semantic errors from `mermaid@11.16.1`:**
> - "Unknown participant" (present in earlier drafts of this list) **does not occur** — Mermaid
>   auto-declares any actor referenced anywhere (`note left of Zzz`, `activate Ghost` both parse
>   clean, no error). There is no undeclared-participant error case in the grammar.
> - `deactivate` on a never-activated participant throws
>   `"Trying to inactivate an inactive participant (X)"`, with a normal hash and line number — a
>   real, common mistake, now in the hint table above.
> - `destroy X` with no matching destroying message throws
>   `"The destroyed participant undefined does not have an associated destroying message..."` — note
>   the literal, confusing `"undefined"` (a Mermaid message-interpolation bug) — **and this error has
>   no `.hash` at all.** The hint for this case SHALL specifically address the confusing raw text,
>   since R-8 shows it verbatim.

### 2.2 Rendering

**R-9.** Rendering SHALL be performed by `mermaid.render()` into a detached container, initialised
with **exactly** this configuration, which SHALL NOT be overridable from either user document:

| Key | Value | Reason |
| --- | --- | --- |
| `startOnLoad` | `false` | Rendering is explicit and single-flight |
| `securityLevel` | `'strict'` | Enables Mermaid's own DOMPurify pass on labels |
| `sequence.htmlLabels` | `false` | **Verified:** `true` selects the `byFo` path and emits `<foreignObject>`, which canvas rasterisation drops — PNG export loses every label (R-25) |
| `sequence.useMaxWidth` | `false` | The preview owns sizing via zoom (R-13); `useMaxWidth` injects a responsive `style` attribute that fights it and corrupts export dimensions |
| `sequence.forceMenus` | `false` | Complements R-4 |
| `deterministicIds` | `true` | Non-random IDs, not random `Math.random()` ones. **Verified this does NOT mean stable across separate `render()` calls** — see the note below the table |
| `logLevel` | `'error'` | No console noise in production |

> **Verified — `deterministicIds` does not give cross-render ID stability.** Rendering the same
> source twice in the same session produces `actor0`/`actor1`/`actor2`... — a persistent
> module-level counter that increments on every `render()` call, unaffected by `deterministicIds`
> or `deterministicIDSeed`, and not reset by `mermaidAPI.reset()`. A single exported artefact is
> unaffected by this (it is internally self-consistent regardless of what number its IDs happen to
> be), but anything that **compares two separate renders** — R-41d's snapshot suite, V-29's
> style-override diff — will see ID churn as a false difference, unrelated to any real content or
> Mermaid-version change. R-41d and V-29 SHALL normalise IDs (strip or replace `id="..."` and the
> matching `url(#...)` / `href="#..."` references with positional placeholders) before comparing;
> the render pipeline and every exported artefact are otherwise unaffected and need no change.

**R-10 — Output sanitiser.** The SVG string returned by Mermaid SHALL pass through a first-party
sanitiser before it is inserted into the document or handed to any exporter. This is not
redundant with `securityLevel: 'strict'`: Mermaid sanitises *label text*, while this sanitiser
asserts properties of *the whole document* that the exports depend on. It SHALL:

1. Remove any `<script>` element.
2. Remove any attribute matching `^on` (case-insensitive).
3. Remove any `href` / `xlink:href` whose value is not a same-document fragment reference.
4. Assert the absence of `<foreignObject>`; if one is present, **fail closed** — do not render,
   report an internal error, and keep the last good output. A `<foreignObject>` means the R-9
   configuration was not applied and every downstream export is silently broken.
5. Assert the absence of `@import`, `url(` with a non-fragment target, and any `http` substring.

Sanitiser failures SHALL be treated as defects, not as user errors: they indicate a Mermaid upgrade
changed the output shape. V-22 covers this.

**R-11 — CSP nonce stamping.** Mermaid returns an SVG containing a `<style>` element. The site CSP
is `style-src 'self' 'nonce-{n}'` with no `unsafe-inline`, so that element is inert on insertion and
the diagram renders unstyled.

- The island SHALL capture the request nonce at initialisation via
  `document.querySelector('[nonce]').nonce` — reading the `.nonce` **IDL property**, not the
  reflected attribute (browsers deliberately keep the property readable by same-document script
  even though the attribute is blanked after use) — and stamp it onto the style element before
  insertion. **Not** `document.currentScript.nonce`: per the HTML spec, `document.currentScript` is
  `null` while a *module* script executes, and Astro compiles client `<script>` blocks (anything
  without `is:inline`) to `<script type="module">` by default — the mechanism as originally
  described here would silently fail to find a nonce. The middleware nonces every `<script>` and
  `<style>` tag in the response, so there is always at least one already-nonced element to query.
  To be proven in the step-2 CSP spike (V-31–V-33) against a real build, not assumed.
- **No CSP change is permitted to solve this.** `unsafe-inline` on `style-src` SHALL NOT be
  introduced under any circumstance. If nonce stamping proves unworkable, the fallback is to strip
  Mermaid's style element and reapply the same CSS from a nonce-bearing stylesheet the tool
  controls — not to weaken the policy.
- Exported artefacts are unaffected: they carry the style element inline with no nonce and no CSP
  (R-25a).

**R-12.** The preview SHALL re-render on source or style change, debounced at 150 ms. Renders SHALL
be single-flight: a render in progress SHALL be superseded, not queued, so a fast typist cannot
build a backlog.

**R-13.** The preview pane SHALL support zoom (25 %–400 %) and pan. Zoom SHALL NOT alter exported
output.

**R-14.** Every artefact this tool produces — preview DOM, SVG export, HTML export — SHALL contain
no `<script>`, no `<foreignObject>`, no inline event handler, and no external reference. Guaranteed
by R-9 and R-10 and asserted by test (R-41) and by V-17, V-20, V-22.

**R-15 — Accessible output.** Verified against real `mermaid@11.16.1` output: the SVG root already
carries `role="graphics-document document"` and `aria-roledescription="sequence"` by default — richer
than a plain image role, and worth keeping rather than discarding.

- The sanitiser SHALL **extend, not overwrite**, Mermaid's `role` attribute: append `img` as a final
  fallback token, producing `role="graphics-document document img"`. ARIA resolves a space-separated
  role list left to right by first-supported-token, so assistive technology that understands
  `graphics-document` gets the richer semantics, and anything that doesn't falls through to `img`.
  This is strictly additive — nothing is stripped from what Mermaid already emits correctly.
- The emitted SVG SHALL carry a `<title>` from the diagram's `accTitle` or `title` (falling back to
  `"Sequence diagram"`), and a `<desc>` from `accDescr` where present. **Verified:** Mermaid only
  auto-generates a correctly wired `<title>`/`<desc>` (with matching `aria-labelledby` /
  `aria-describedby`) when `accTitle`/`accDescr` are used — a plain `title` directive alone produces
  no `<title>` element, and with none of the three present neither element appears at all. The
  `title`-only fallback and the "Sequence diagram" default are therefore first-party work in every
  case except `accTitle` being present, not something to lean on Mermaid for generally.
- Where `accDescr` is absent the tool SHALL generate a plain-text linearisation of the messages and
  insert it as `<desc>`. The Guide SHALL recommend `accTitle` / `accDescr` for shared diagrams.

### 2.3 Style document

**R-16 — Format.** Style SHALL live in a second editable document, in **Mermaid's own YAML config
format**. The tool SHALL NOT invent keys. A style document is exactly what may appear inside Mermaid
frontmatter under `config:`:

```yaml
# Site — iainmorton.me house style
theme: base

themeVariables:
  actorBkg: '#111820'
  actorBorder: '#00d4ff'
  actorTextColor: '#e2e8f0'
  actorLineColor: '#1e2d3d'
  signalColor: '#8899aa'
  signalTextColor: '#e2e8f0'
  labelBoxBkgColor: '#1a2230'
  labelBoxBorderColor: '#1e2d3d'
  labelTextColor: '#e2e8f0'
  loopTextColor: '#8899aa'
  noteBkgColor: '#111820'
  noteBorderColor: '#00a8cc'
  noteTextColor: '#e2e8f0'
  activationBkgColor: '#1a2230'
  activationBorderColor: '#00d4ff'
  sequenceNumberColor: '#0a0e13'
  altSectionBkgColor: '#0e141b'
  fontFamily: 'JetBrains Mono, ui-monospace, monospace'
  fontSize: '13px'

sequence:
  actorMargin: 60
  messageMargin: 40
  boxMargin: 10
  noteMargin: 10
  mirrorActors: false
  showSequenceNumbers: false
  messageAlign: center
  rightAngles: false

themeCSS: |
  .actor { rx: 6; ry: 6; }
```

Portability is the point: **Export merged `.mmd`** (R-66) emits this block as frontmatter above the
diagram source, and the result renders identically anywhere Mermaid runs.

**R-17 — Key allowlist.** Only these top-level keys SHALL be accepted:
`theme`, `themeVariables`, `themeCSS`, `sequence`, `fontFamily`, `fontSize`. Any other key SHALL be
rejected with a diagnostic naming it, and SHALL NOT be merged.

This is a **security control, not tidiness**. A style document arrives from a shared link as
untrusted input (§2.8), and Mermaid's config surface includes `securityLevel`, `htmlLabels`, and
`maxTextSize`. A deep merge of arbitrary YAML into Mermaid's config would let a crafted link
re-enable exactly the behaviours R-4, R-9, and R-10 exist to prevent. The merge SHALL be an
allowlisted field-by-field copy, never a recursive object merge.

**`fontFamily` and `fontSize` merge into `themeVariables`, not Mermaid's config root — this is
where they read from in the document (R-16's example already nests them correctly) and it is not
optional.** Verified against `mermaid@11.16.1`: Mermaid has a genuine root-level `config.fontFamily`
*and* a separately-honoured `themeVariables.fontFamily`, and when both are set to different values,
**`themeVariables.fontFamily` wins** — silently, no error. If the allowlisted copy ever wrote these
two validated values to the config root instead (a literal reading of "top-level keys" above), any
other code path that later touches `themeVariables.fontFamily` — a preset, a future feature — would
silently override the user's font choice with no diagnostic. The two keys are listed here because
they are validated the same way as everything else in this allowlist and arrive at the top level of
the *style document*; they are **not** top-level in Mermaid's *config object* they get copied into.

**`sequence` is itself an object, not a scalar — the same allowlist principle applies one level
down.** Verified against `mermaid@11.16.1`'s actual default config: `sequence.*` has roughly 27
real keys, not the 8 shown in R-16's example document. Accepting the `sequence` key at the
top-level allowlist without also allowlisting its sub-keys would reopen exactly the hole R-17
exists to close, one level deeper. R-18's table is therefore the complete, closed list of accepted
`sequence.*` sub-keys — any `sequence.*` key not in that table SHALL be rejected with a diagnostic
naming it, identically to an unrecognised top-level key.

**R-18 — Value validation.** Every value SHALL be validated before merge; an invalid value SHALL
fall back to the preset default and raise a `warning` diagnostic (R-7).

| Key class | Rule |
| --- | --- |
| Colours (`themeVariables.*Color`, `*Bkg*`, `*Border*`) | `^#([0-9a-fA-F]{3}\|[0-9a-fA-F]{6}\|[0-9a-fA-F]{8})$` only. No named colours, no `rgb()`, no `hsl()`, no `url()`, no `var()` |
| `theme` | Enum: `base` only. Mermaid's other built-in themes are not styled or tested here |
| `fontFamily` | Allowlist of three stacks (sans / serif / mono), resolved to fixed system stacks. No web fonts SHALL be loaded or referenced |
| `fontSize` | Integer 10–24, serialised with a `px` suffix |
| `themeCSS` | Per R-64 |

**`sequence.*` — complete closed allowlist.** No key outside this table is accepted under
`sequence`. Deliberately excludes every per-role font key (`actorFontFamily`/`Size`/`Weight`,
`noteFontFamily`/`Size`/`Weight`/`Align`, `messageFontFamily`/`Size`/`Weight`) — font control SHALL
have exactly one source of truth, the top-level `fontFamily`/`fontSize` keys above. Allowing
per-role overrides here would create a second, competing font system and complicate R-20's
bidirectional sync (which value wins when the panel and a per-role override disagree). If a
diagram needs per-role font differentiation, that is out of scope for this tool.

| `sequence.*` key | Type / rule | Mermaid default |
| --- | --- | --- |
| `actorMargin` | Integer 10–300 | 50 |
| `messageMargin` | Integer 10–200 | 35 |
| `boxMargin` | Integer 0–100 | 10 |
| `noteMargin` | Integer 0–100 | 10 |
| `mirrorActors` | Boolean | `true` |
| `showSequenceNumbers` | Boolean | `false` |
| `messageAlign` | Enum: `left` \| `center` \| `right` | `center` |
| `rightAngles` | Boolean | `false` |
| `activationWidth` | Integer 2–50 | 10 |
| `diagramMarginX` | Integer 0–200 | 50 |
| `diagramMarginY` | Integer 0–100 | 10 |
| `boxTextMargin` | Integer 0–50 | 5 |
| `wrap` | Boolean | `false` |
| `wrapPadding` | Integer 0–50 | 10 |
| `labelBoxWidth` | Integer 10–200 | 50 |
| `labelBoxHeight` | Integer 10–100 | 20 |

Range bounds were chosen to comfortably bracket Mermaid's own defaults (verified above) — a
**Reset style** (R-23) SHALL never itself produce a value the validator would reject.

**R-19 — Presets.** Four presets SHALL ship, each a complete style document:

| Preset | Purpose |
| --- | --- |
| **Site** | The live `iainmorton.me` palette, as above. Default on load |
| **Light** | Neutral light, for dropping into light documents |
| **Dark** | Neutral dark, generic — for other people's dark documents |
| **Print** | High-contrast, white background, hairline strokes, no fills that cost ink |

Preset values SHALL be duplicated as literals in `presets.ts`, **not** imported from the site's CSS
tokens. A diagram exported today must not change colour because the site is restyled next year. A
code comment SHALL record the provenance and the deliberate duplication.

**R-20 — Bidirectional sync.** The style document text SHALL be the single source of truth.

- **Panel → document:** changing a control SHALL rewrite the corresponding YAML key in place,
  preserving comments, key order, and unrelated keys. Absent keys SHALL be inserted into the correct
  block, creating the block if needed.
- **Document → panel:** on every successful parse, control values SHALL be set from the parsed
  document. Keys absent from the document SHALL display the active preset's value.
- **Loop prevention:** a document→panel update SHALL NOT trigger a panel→document write. One
  mutation entry point, with a value-equality check before writing.
- The caret SHALL be preserved across panel-driven rewrites.

> This is materially simpler than v1.3.0's design, which had to interleave theme directives with
> diagram statements in one buffer and protect the caret across both. Separating the documents
> removes the hardest part of the original spec.

**R-21.** The Style UI SHALL be the **Style** tab of the collapsible side rail (R-45). Controls SHALL
be grouped as: Participants, Messages, Notes, Blocks, Type, Spacing, Advanced (R-64) — not presented
as a flat list of twenty-one Mermaid variable names. Each control SHALL show its Mermaid key as
secondary text, so the panel teaches the underlying format rather than hiding it.

**R-22.** Each colour control SHALL offer a native colour picker and a text input accepting the hex
forms of R-18, with a persistent visible label.

**R-23 — Reset.** A **Reset style** action SHALL replace the style document with the active preset.
Because style is now a separate document, reset is a whole-document replacement and cannot disturb
diagram source or user comments in it.

**R-64 — Advanced CSS (`themeCSS`).** The style document MAY carry a `themeCSS` block, exposed in
the rail behind an **Advanced** disclosure, collapsed by default.

- Validation SHALL be an allowlist of properties: fill, stroke, stroke-width, stroke-dasharray,
  opacity, rx, ry, font-weight, font-style, letter-spacing, text-anchor, filter.
- `url(`, `@import`, `@font-face`, `position`, `z-index`, `content`, and any `http` substring SHALL
  be rejected outright.
- Selectors SHALL be limited to Mermaid's own sequence classes plus descendant combinators. No
  attribute selectors, no `:has()`, no universal selector.
- **`themeCSS` SHALL be stripped from shareable links** (R-59). CSS from an untrusted third party
  can exfiltrate via resource loads, obscure page chrome, and fingerprint the reader. It survives in
  local files, in exports, and in the merged `.mmd`, all of which are user-initiated.

**R-65 — Style import / export.** The style document SHALL be downloadable as `style.yaml` and
loadable from a local file, so one house style is reusable across diagrams. Import SHALL run the
full R-17 / R-18 / R-64 validation and report every rejection rather than failing at the first.

**R-66 — Export merged `.mmd`.** A fifth export SHALL emit a single Mermaid document with the style
document as frontmatter `config:` above the diagram source. It SHALL render identically in the
Mermaid Live Editor, GitHub, and `mmdc`. Verified by V-55.

### 2.4 Export

**R-24.** Five outputs. Four are files; one is a link.

| Format | Filename | Content |
| --- | --- | --- |
| SVG | `diagram.svg` | Rendered SVG, standalone, XML prolog, styles inlined (R-25a) |
| PNG | `diagram.png` | Raster of the SVG at a user-selected scale |
| HTML | `diagram.html` | Self-contained HTML5 document with the SVG inlined |
| Mermaid | `diagram.mmd` | Style frontmatter + diagram source (R-66) |
| Link | — | URL encoding both documents (§2.8) |

**R-25.** PNG export SHALL offer 1×, 2×, and 3×, implemented as
SVG string → base64 → `data:image/svg+xml;base64,` → `HTMLImageElement` → `<canvas>` →
`canvas.toBlob()`. The `data:` scheme is primary because the existing CSP already permits it and does
not permit `blob:` (§3.4). The canvas SHALL be filled with the effective background colour before
drawing, so PNGs are never transparent.

**R-25a — Styles must travel inside the SVG.** Mermaid applies visual style through a `<style>`
element and class names, not through per-element presentation attributes. Page CSS does not reach an
SVG rasterised from a `data:` URL. Therefore every export path SHALL serialise the complete
effective stylesheet — Mermaid's generated CSS plus any validated `themeCSS` — into a `<style>`
element **inside the exported SVG root**, and SHALL assert that no styling depends on an ancestor
outside the SVG. This is the single most likely source of a "looks right on screen, exports wrong"
defect. Verified by V-19a.

**R-26.** If the `data:` path taints the canvas or fails on any target browser, the implementation
MAY fall back to a `blob:` object URL, which requires appending `blob:` to `img-src` per R-35a.
Verified per V-18.

**R-27.** HTML export SHALL produce a single file with no external requests, no JavaScript, and no
`<link>` elements.

**R-28.** All object URLs created during export SHALL be revoked after use.

**R-29.** Exports SHALL reflect the effective style exactly and SHALL be unaffected by preview zoom.

**R-30.** A **Copy SVG to clipboard** action SHALL be provided alongside the downloads, honouring the
R-39 override.

**R-39 — Export style override.** The export controls SHALL offer: **Current**, **Light**, **Dark**,
**Print**. Default **Current**.

- Implemented as a style-document swap: render once more with the selected preset's document, export
  that output, discard it.
- The override SHALL substitute **`themeVariables` only**. `sequence.*` spacing, `fontFamily`, and
  `fontSize` SHALL be taken from the user's document in all cases, so geometry is identical across
  the four options and only fills and strokes differ. Verified by V-31.

**R-40.** Selecting an override SHALL NOT mutate either document, the panel values, or the on-screen
preview. It persists for the session and is not written to storage.

### 2.5 Editor, initial state, and in-tool help

**R-37 — Two-document editor.** The editing surface SHALL present both documents: the diagram source
as the primary pane, the style document reachable from the rail's Style tab as raw YAML beneath the
controls. Both SHALL be plain `<textarea>` elements with synchronised line-number gutters. Switching
between them SHALL NOT lose caret position or scroll state in the other.

**R-38 — Sample on load.** The editor SHALL be pre-filled with a sample diagram exercising, at
minimum: `title`, one `actor`, two `participant` declarations (one aliased), a sync message, a reply,
a self-message, an `activate`/`deactivate` pair, a `note over`, an `alt`/`else`/`end` block, and
`autonumber`. It doubles as inline documentation and makes R-36 well-defined.

**R-38a — Pre-rendered sample.** The sample's rendered SVG SHALL be generated **at build time** by the
same pinned Mermaid version and shipped in the route's static HTML.

> This is what preserves the page's loading behaviour despite a 195 KB dependency. The visitor sees a
> complete, styled diagram at first paint with zero JavaScript executed; Mermaid loads lazily (R-67)
> and takes over on first edit. It also gives R-44's mobile fallback its content for free, and it
> means the route degrades to a static illustrated page with JS disabled rather than to an empty box.
> The build step SHALL fail if the sample does not render, so a Mermaid upgrade that breaks the sample
> cannot ship.

**R-67 — Lazy load.** The Mermaid chunk SHALL be dynamically imported, triggered by the first of:
first keystroke in either editor, first interaction with any rail control, or `requestIdleCallback`.
It SHALL NOT block first paint, and the route SHALL remain usable as a static page until it resolves.
A visible, non-blocking indicator SHALL show while it loads.

> **Verified — Safari has no `requestIdleCallback`.** Checked current browser support directly:
> Safari does not implement `requestIdleCallback` in any stable release, desktop or iOS — WebKit
> ships it only behind a developer feature flag essentially no visitor enables. Chrome, Firefox, and
> Edge all support it. Since §3.5 explicitly puts Safari in scope, R-67 as written means Safari
> visitors get **no idle-time preloading at all** — the chunk only starts loading on the first real
> interaction, making the first edit feel slower than on every other supported browser, silently. A
> `setTimeout`-based `requestIdleCallback` polyfill (the standard shim for this exact gap) SHALL be
> used so all four supported browsers get equivalent idle-preload behaviour.

**R-36 — Unload guard.** A `beforeunload` handler SHALL warn before navigating away when either
document differs from the state as loaded — sample or link-loaded (R-61). This stores nothing.

**R-44 — Mobile.** Below the site's medium breakpoint, the route SHALL present the pre-rendered
sample (R-38a) and a short note directing the visitor to a desktop browser. Editors and rail SHALL
NOT render, and **Mermaid SHALL NOT be loaded at all**. Help content SHALL remain in the document for
indexing, as ordinary page content below the diagram.

**R-45 — Side rail.** One collapsible rail to the right of the preview, with exactly three tabs:
**Style**, **Syntax**, **Guide**.

- One rail with tabs, not multiple independent panels — a single rail has exactly two states.
- A single labelled toggle shows and hides the whole rail. Tab switching SHALL NOT be possible while
  collapsed.
- Rail width SHALL be fixed. Collapsing and expanding SHALL resize the preview, not overlay it.

**R-46 — Syntax tab.** One entry per construct in the R-2 verified subset. Each entry SHALL show the
construct name, its syntax pattern, a one-line description, and a copyable working example. Grouped
per the R-2 table. Each group SHALL carry a link to the corresponding section of the Mermaid
documentation, and the tab SHALL state plainly that the tool renders all of Mermaid's sequence
grammar while documenting and testing this subset.

**R-47 — Guide tab.** SHALL cover, at minimum:

1. That style lives in a separate document, and that document is Mermaid-native and portable.
2. That the diagram source is plain Mermaid and moves to any other Mermaid tool unchanged.
3. Which export to use when — including the font-portability trade-off (§3.6), namely that PNG is the
   portable raster and SVG may reflow where font metrics differ.
4. The export style override (R-39) and that it does not alter either document.
5. That **nothing is saved** — both documents are lost on reload unless exported or linked.
6. That `themeCSS` does not travel in shared links, and why (R-64).
7. Why `link` / `links` / `properties` are rejected (R-4).
8. Zoom, pan, and the full keyboard shortcut list.

**R-48 — Single source of truth for help.** All help content SHALL live in one typed module,
`src/data/seqdiag-help.ts`, rendered into static HTML at build time. It SHALL contribute **zero bytes**
to the route's initial JavaScript. Only show/hide and tab switching are scripted.

**R-49 — Insert example.** Each Syntax entry SHALL insert its example into the diagram editor at the
caret, on its own line, followed by a re-render. Insertion SHALL NOT corrupt the caret and SHALL NOT
target the style document.

**R-50 — Default state.** The rail SHALL default to **collapsed**, with the Style tab pre-selected for
when it is first opened.

**R-51 — Example validity (replaces grammar coverage).** v1.3.0 asserted that every parser statement
form had exactly one help entry. That direction is no longer possible against a grammar we do not
own. The test inverts, and SHALL assert at build/test time:

1. **Every documented example renders** against the pinned Mermaid with zero errors. A documented
   example can never be stale or wrong.
2. **Every R-2 verified-subset construct has exactly one help entry.** The subset is our list, so this
   direction remains enforceable.
3. **Every style key the Style UI can write is accepted by Mermaid's config schema** — asserted by
   rendering with each key set to a non-default value and confirming the output differs. This is what
   catches a Mermaid upgrade renaming a theme variable.

### 2.6 Security

**R-31.** All user text reaches the output through Mermaid's `securityLevel: 'strict'` sanitisation
(R-9) and the first-party sanitiser (R-10). All style values reach Mermaid through the R-17 allowlist
and R-18 validation. **No user input SHALL reach Mermaid's config object except through the
allowlisted, validated copy.**

**R-32.** The tool SHALL make zero network requests after the route's own assets have loaded — no
fetch, no XHR, no WebSocket, no beacon, no external font, no CDN. Mermaid is bundled and served from
`'self'`.

**R-33.** The tool SHALL NOT write to `localStorage`, `sessionStorage`, `IndexedDB`, or cookies, and
SHALL NOT write to the URL as an ambient side effect of editing. URL writes are permitted only per
R-52 and R-60.

**R-34 — Dependency posture (amended).** Exactly **one** runtime dependency: `mermaid`, pinned to
`11.16.1`. No other runtime dependency SHALL be added by this spec. Everything else — the editors,
rail, sanitiser, style codec, link codec, and exporters — is first-party TypeScript.

- Mermaid's own transitive tree (d3, dompurify, katex, cytoscape, marked, roughjs and others, 21
  direct dependencies) is accepted as part of that single decision and SHALL be recorded in the PR.
- The lockfile SHALL be committed. Dependabot SHALL be configured for `mermaid` only, and updates
  SHALL be treated as R-1 upgrades: snapshot review required, never auto-merged.

**R-35.** The site CSP SHALL remain nonce-based with no `unsafe-inline` and no `unsafe-eval`.

**R-35a — Target: zero CSP changes.** The implementation SHALL aim to require no modification to
`functions/_middleware.js`. If preview verification shows `blob:` is unavoidable for the download
anchor, the only permitted change is appending `blob:` to `img-src`. **If Mermaid is found to require
`unsafe-eval` or `unsafe-inline`, the tool SHALL NOT ship** — that outcome reopens D-8, it does not
relax the policy. Verified by V-23, which is a gate on step 1 of implementation, not step 10.

### 2.7 Integration with the tools hub

**R-42.** A registry entry SHALL be added to `src/data/tools.ts` per SPEC-002 R-2, with
`slug: "sequence-diagram"`. The route SHALL use the shared tool layout (SPEC-002 R-16).

> **Ordering constraint with SPEC-002 R-4.** SPEC-002 R-4's build-time check fails the build if a
> registry slug has no corresponding page under `src/pages/tools/` — unconditionally, `draft: true`
> or not. Per §5's implementation order, the actual route file
> (`src/pages/tools/sequence-diagram.astro`) is not created until **step 6**. The registry entry
> from this requirement SHALL therefore land in the **same commit** as the step-6 route shell, not
> any earlier — adding it during step 1 (SPEC-002 setup) or any other point before the route file
> exists trips SPEC-002's own build check with a confusing, easy-to-misdiagnose failure.

**R-43.** The entry SHALL ship `draft: true` and be flipped to `draft: false` in the same PR that
promotes the verified feature to `main`.

### 2.8 Shareable links

**R-52 — Explicit action only.** A **Copy link** action SHALL produce a URL encoding both documents
and place it on the clipboard. The tool SHALL NOT update the URL as a side effect of editing.

**R-53 — Fragment, not query string.**

```
https://iainmorton.me/tools/sequence-diagram#d=2.<payload>
```

1. **Fragments are never transmitted to the server.** A query string would send diagram contents to
   Cloudflare on every load, into edge logs and the cache key. Diagrams routinely contain internal
   service names, unreleased architecture, and client detail.
2. **It preserves R-32.** The diagram never leaves the browser.
3. **Referer leakage.** Fragments are stripped from `Referer`; query strings are not.

**R-54 — Codec.** Canonical documents → JSON envelope `{ v: 2, d: <diagram>, s: <style> }` → UTF-8 →
`deflate-raw` via native `CompressionStream` → base64url, unpadded. Decoding reverses it. No
additional dependency.

**R-54a.** `CompressionStream` / `DecompressionStream` SHALL be feature-detected. Where absent, **Copy
link** SHALL be disabled with a visible explanation.

**R-55 — Style is materialised before encoding.** The encoded style document SHALL be the fully
resolved style, including preset values the author left implicit. A link must reproduce what the
author saw, not what the recipient's defaults produce.

**R-56 — Payload versioning.** Version `2` (v1 was single-document and never shipped). An unrecognised
version SHALL produce a clear "created by a newer version" message and SHALL NOT attempt a partial
decode.

**R-57 — Size budget.** On copy, the tool SHALL report resulting URL length. Above **2,000 characters**:
warn that some clients truncate long links. Above **8,000**: refuse, and direct the user to SVG, PNG,
or `.mmd` export.

**R-58 — Load behaviour.**

- Valid fragment → decode, validate, populate both editors, render. The R-38 sample is suppressed.
- Absent fragment → load the sample.
- Invalid, corrupt, oversized, or unknown-version fragment → load the sample and show a specific,
  human-readable error. Never a blank page, a partial render, or an uncaught exception.

**R-59 — Hostile payload limits.** Link payloads are untrusted input.

| Control | Limit | Behaviour on breach |
| --- | --- | --- |
| Decompressed envelope size | 100 KB | Abort decode, error, load sample |
| Diagram document size | 60 KB | Abort decode, error, load sample |
| Style document size | 8 KB | Abort decode, error, load sample |
| Statement count | 2,000 | Abort before render, error |
| Participant count | 50 | Abort before render, error |
| Block nesting depth | 20 | Abort before render, error |
| `themeCSS` | **Stripped unconditionally** | Silent removal, `info` diagnostic on load |

- **The decompressed envelope size limit SHALL be enforced by incremental reads, never by fully
  buffering the decompressed stream and checking its length afterward.** Verified: `deflate-raw`
  compresses realistic repetitive content at roughly 336:1 (encoded-fragment-characters to
  decompressed bytes) — a fragment of a few hundred KB, itself far short of R-57's own 8,000-character
  refuse threshold, decompresses to over 100 MB in well under half a second on ordinary hardware. A
  naive `await new Response(stream).arrayBuffer()` fully materialises that before any size check can
  run — by the time the check fires, the cost it exists to prevent has already been paid, which on a
  memory-constrained mobile browser is a real crash, not a theoretical one. There is no cheaper
  shortcut via fragment length either: a fragment safely under R-57's threshold can still decompress
  past this limit, so pre-checking the encoded length is not a substitute. The decoder SHALL instead
  get a reader from the `DecompressionStream`'s `readable`, accumulate bytes chunk by chunk, and
  `cancel()` the stream — discarding whatever has been produced so far — the instant the running
  total exceeds 100 KB.
- The decode path SHALL be wrapped so no malformed input produces an uncaught exception.
- Mermaid's own `maxTextSize` SHALL additionally be set below the diagram document limit.
- The R-17 allowlist and R-18 validation apply unchanged to link-sourced style. They were written for
  this case.
- Auto-rendering untrusted payloads is deliberate: it is what makes the feature useful, and it is
  acceptable **only because** output is inert (R-14), sanitised twice (R-9, R-10), config is
  allowlisted (R-17), CSS is stripped (R-64), and the limits above bound the work done.

**R-60 — Address bar and history.** Copying a link SHALL place it on the clipboard. If the address bar
is also updated it SHALL use `history.replaceState`. The address bar SHALL NOT change while editing.

**R-61 — Unload guard baseline.** R-36 compares against the documents as loaded, whether from a link
or from the sample.

---

## 3. Technical Constraints

### 3.1 Stack

| Concern | Decision |
| --- | --- |
| Framework | Astro (existing). No React/Preact/Svelte/Vue added |
| Interactivity | A single vanilla TypeScript client island |
| Diagram engine | `mermaid@11.16.1`, exact pin, dynamically imported (R-67) |
| Styling | Tailwind CSS (existing) for tool chrome. Diagram styling is Mermaid config driven |
| Editors | Plain `<textarea>` with synchronised gutters. **No CodeMirror / Monaco / Ace** |
| YAML | **First-party parser, restricted to the R-17/R-18 key set (D-14, resolved).** Verified: no `js-yaml` or any generic YAML library exists anywhere in Mermaid's dependency tree, direct or transitive — there was no bundled instance to reach for. **No second YAML dependency SHALL be added** |
| Package manager | `npm` (existing). Node 24 per `.nvmrc` |
| Runtime dependencies | One: `mermaid` |
| Dev dependencies added | `vitest`, `jsdom` |
| Hosting | Cloudflare Pages (existing). Fully static |

### 3.2 Module structure

Mermaid owns parsing, layout, and text measurement, so the `[pure]` set is smaller than in v1.3.0 —
but the modules that remain pure are the ones carrying security consequences, which is the right
half to keep testable without a browser.

```
src/pages/tools/sequence-diagram.astro     Route shell, SEO, static markup, pre-rendered sample
src/components/tools/SequenceDiagram.astro Client island: editors, rail, preview, export UI
src/data/seqdiag-help.ts                   Help content: syntax reference + guide
src/lib/seqdiag/
  style.ts         YAML style doc ↔ object; R-17 allowlist, R-18 validation   [pure]
  presets.ts       The four preset documents, as literals                     [pure]
  css.ts           themeCSS validation (R-64)                                 [pure]
  sanitise.ts      SVG output sanitiser + assertions (R-10)                   [pure]
  guard.ts         Source guards: diagram type (R-3), forbidden statements     [pure]
                   (R-4), frontmatter strip (R-5), R-59 limits
  link.ts          Fragment codec: envelope, version, limits                  [pure*]
  diagnostics.ts   Mermaid error → {line, severity, message} + hint table     [pure]
  render.ts        Mermaid init, single-flight render, nonce stamping         [DOM]
  export/svg.ts    Style inlining (R-25a)                                      [DOM]
  export/png.ts
  export/html.ts
  export/mmd.ts    Merged frontmatter + source (R-66)                         [pure]
  __tests__/       vitest specs, colocated
scripts/render-sample.mjs                  Build-time sample render (R-38a)
```

**Constraint:** every `[pure]` module SHALL contain no DOM references and no browser globals, and
SHALL NOT import `mermaid`. Verified by V-35. `link.ts` is `[pure*]`: it uses `CompressionStream`,
`TextEncoder`, and `atob`/`btoa`, standard in both browsers and Node 24.

`sanitise.ts` operates on **SVG strings via a parser injected by the caller**, so it is testable in
plain Node against fixture strings captured from real Mermaid output.

### 3.3 Performance (revised — v1.3.0 budgets withdrawn)

Measured on `mermaid@11.16.1` with esbuild, minified, code-split, loading only what a sequence diagram
requires: **164 KB gzipped for Mermaid core, 195 KB including the sequence renderer.** The v1.3.0
budget of 40 KB is withdrawn; pretending otherwise would make every other number in this table a lie.

| Metric | Budget |
| --- | --- |
| Initial route JS, gzipped (excludes Mermaid) | ≤ 30 KB |
| Mermaid chunk, gzipped, lazily loaded | ≤ 230 KB (measured 195 KB; headroom for upgrade drift) |
| Total route JS after Mermaid loads | ≤ 260 KB |
| Route CSS, gzipped | ≤ 10 KB |
| Route HTML, gzipped (help + pre-rendered sample, server-rendered) | ≤ 90 KB |
| First render after Mermaid loads, 30-message diagram | ≤ 150 ms |
| First render after Mermaid loads, 200-message diagram | ≤ 800 ms |
| Re-render on edit, 30-message diagram | ≤ 100 ms |
| Lighthouse Performance, **desktop** | 100 |
| Lighthouse Performance, **mobile** | ≥ 90 (Mermaid is never loaded on mobile per R-44) |
| Lighthouse Accessibility / Best Practices / SEO | 100 |
| Cumulative Layout Shift | 0 |
| Total Blocking Time, desktop | ≤ 300 ms |

The pre-rendered sample (R-38a) and reserved pane dimensions are what hold CLS at 0 and keep LCP
independent of the Mermaid chunk.

### 3.4 CSP and security headers

Live policy:

```
default-src 'none'; script-src 'self' 'nonce-{n}'; style-src 'self' 'nonce-{n}';
font-src 'self' data:; img-src 'self' data: https:; frame-src https://www.youtube.com;
connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none';
upgrade-insecure-requests
```

Consequences:

1. **`script-src 'self' 'nonce-{n}'` already exists** and the middleware nonces every script tag. The
   Mermaid chunk is served from `/_astro/*` — same origin, no change needed.
2. **`style-src` is the live risk.** Mermaid injects a `<style>` element (confirmed:
   `createElement("style")` in the bundle) and returns SVG containing one. Both are inert without a
   nonce. R-11 stamps it. **`unsafe-inline` is not an option.**
3. **`img-src` already permits `data:`, not `blob:`.** R-25 uses `data:` as the primary path.
4. **`connect-src 'self'`** — R-32 remains a behavioural requirement, not something the CSP enforces.
5. **`unsafe-eval` is not present and SHALL NOT be added.** If any Mermaid code path in the sequence
   renderer requires it, R-35a applies: do not ship.

### 3.5 Browser support

Latest two stable versions of Chrome, Firefox, Safari, and Edge on desktop. Safari is explicitly in
scope because its SVG-to-canvas behaviour is the highest-risk part of PNG export.

### 3.6 Known trade-offs

Recorded so they are not rediscovered as bugs.

1. **We do not own the parser.** Mermaid aborts on the first syntax error, so the tolerant parsing of
   v1.3.0 is gone (R-6). Mitigated by last-good-render and the hint table (R-8), not eliminated.
2. **We do not own the layout.** Spacing is what `sequence.*` exposes. Where Mermaid offers no knob,
   the answer is "not supported" — not a CSS hack against internal geometry.
3. **Mermaid's class names are our styling contract.** A minor release can rename them. Mitigated by
   the exact pin (R-1), snapshot tests, and V-65.
4. **195 KB of third-party JavaScript on a site with a zero-dependency ethos.** Accepted knowingly:
   it buys the full grammar, portability to every other Mermaid consumer, and a rendering engine that
   is far better tested than a first-party one would be. Mitigated by lazy loading (R-67), the
   pre-rendered sample (R-38a), and never loading it on mobile (R-44).
5. **System fonts mean non-portable SVG.** Layout is measured against the author's fonts; an exported
   SVG opened elsewhere may show minor label overflow. PNG is the portable raster; stated in help.
6. **No persistence means work is lost on refresh.** Mitigated by R-36, and now also by `.mmd` and
   `style.yaml` export.
7. **Shareable links make the tool a renderer of untrusted content.** Anyone can craft a link that
   displays arbitrary text on `iainmorton.me`. Technically bounded by R-9, R-10, R-17, R-59; the
   reputational surface is real and is **accepted, not mitigated**. Inherent to every paste-and-share
   tool.
8. **Mermaid's own supply chain is now ours.** 21 direct transitive dependencies. Accepted as part of
   D-8; managed by the lockfile and the no-auto-merge rule in R-34.

### 3.7 Accessibility

- Lighthouse Accessibility 100.
- All controls keyboard-reachable with a visible focus ring.
- Colour inputs SHALL have persistent visible `<label>` elements, not placeholder-only labels.
- The diagnostics list SHALL be an ARIA live region (`aria-live="polite"`).
- The rail toggle SHALL implement the disclosure pattern: `aria-expanded`, `aria-controls`, and an
  accessible name that does not change meaning between states.
- Tabs SHALL implement the ARIA tabs pattern, arrow-key navigation, single tab stop.
- A collapsed rail SHALL be removed from the accessibility tree and tab order — `hidden` or
  `display: none`, not visual offscreening.
- The Mermaid loading indicator (R-67) SHALL be announced politely, once.
- Tool chrome SHALL meet WCAG 2.2 AA contrast. The **diagram itself is user-styled and therefore
  exempt**; the Style panel SHALL show a non-blocking contrast warning when `signalTextColor` against
  the effective background falls below 4.5:1.

### 3.8 Testing and CI

**R-41.** A `vitest` suite SHALL cover:

- `guard.ts` — non-sequence diagram type rejected (R-3); each of `link`, `links`, `properties`
  rejected (R-4); frontmatter stripped with warning (R-5); every R-59 limit enforced.
- `style.ts` — YAML parse/serialise round-trip; **comment and key-order preservation** across a panel
  write; unknown top-level key rejected (R-17); each R-18 value class validated and falling back on
  invalid input; preset application; reset.
- `css.ts` — every allowlisted property accepted; `url()`, `@import`, `@font-face`, `position`,
  `z-index`, and `http` each rejected; hostile selectors rejected.
- `sanitise.ts` — against captured real Mermaid output fixtures: `<script>` removed, `on*` removed,
  external `href` removed, `<foreignObject>` causes fail-closed, clean output passes untouched.
- `link.ts` — encode/decode round-trip over a corpus including Unicode labels, every R-2 construct,
  and a full explicit style; version `2` accepted, unknown rejected; truncated, non-base64, and empty
  payloads rejected without throwing; every R-59 limit including a decompression bomb; `themeCSS`
  stripped. Round-trip fidelity asserted on parsed documents, not string equality.
- `diagnostics.ts` — each hint-table case maps a real Mermaid error to the right hint.
- `export/mmd.ts` — merged output parses as valid Mermaid frontmatter.
- `seqdiag-help.ts` — the three R-51 assertions. These run in `jsdom` with real Mermaid and are the
  only tests permitted to import it.

**R-41a.** `npm test` SHALL run the suite and exit non-zero on any failure.

**R-41b.** `.github/workflows/test.yml` SHALL run `npm ci && npm test` on push to `preview` and on PRs
targeting `main`, on Node 24.

**R-41c.** The `main` ruleset SHALL require the test status check before merge.

**R-41d.** A snapshot test SHALL capture the rendered SVG of the R-38 sample under each of the four
presets. A Mermaid upgrade that changes output SHALL therefore fail CI and require a reviewed
snapshot update. This is the primary defence for trade-off 3.

Per R-9's verified note on `deterministicIds`, the captured snapshot SHALL be normalised before
storage and comparison — `id="..."` and the matching `url(#...)`/`href="#..."` references replaced
with positional placeholders — so the gate fails on a real Mermaid-output change and only on that,
not on which render in the process happened to run first.

### 3.9 Page width and social image

**R-62.** The route SHALL use the full viewport width minus standard horizontal padding, via the
`wide` prop defined in **SPEC-002 R-16a**, keeping `pt-20`, `<Nav />`, and site type and colour
tokens. This is the only place the tool may deviate from site layout conventions, and the deviation
is supplied by the shared layout rather than implemented here.

**R-63.** The Open Graph image is generated by the extended `scripts/generate-og.mjs` from the
registry entry — see SPEC-002 R-23.

### 3.10 SDLC

Standard repo flow, unchanged: work on `preview` → verify on the Cloudflare preview deployment → PR
`preview` → `main` → tag. Versioning: `MINOR`. SPEC-002 ships first, as its own `MINOR` release.

---

## 4. Verification / Acceptance Criteria

Automated checks run via `npm test` in CI. Everything else is verified manually against the Cloudflare
preview deployment (`PREVIEW`).

**Definition of done:** V-1 … V-67 pass, SPEC-002 is signed off and merged, and the production `curl`
checklist in `README.md` still passes after promotion.

### 4.1 Parsing and rendering

| ID | Criterion | Method | Pass condition |
| --- | --- | --- | --- |
| V-1 | Verified subset renders | Paste the reference diagram assembled from `seqdiag-help.ts`, covering every R-2 construct | All render; zero errors |
| V-2 | Portability in | Paste a real Mermaid sequence diagram from an existing repo | Renders without modification |
| V-3 | Portability out | Copy the editor source into the Mermaid Live Editor | Renders identically bar styling |
| V-4 | Wrong diagram type | Paste a `flowchart TD` document | Clear message naming the type; no render attempt; no Mermaid chunk error |
| V-5 | Forbidden statements | Enter `link Alice: Dashboard @ https://x` | Rejected with the R-4 explanation; nothing rendered; no `onclick` anywhere in the DOM |
| V-6 | Last-good-render | Delete a closing `end` mid-session | Previous diagram stays visible, marked stale; error listed; no blank pane, no Mermaid error graphic |
| V-7 | Click-to-locate | Click a diagnostic with a line number | Caret moves to the line; gutter marked |
| V-8 | Error without line info | Trigger an error Mermaid reports without a hash | Entry still listed, no line number, no crash |
| V-9 | Frontmatter stripped | Paste a diagram carrying `config:` frontmatter | Frontmatter removed, warning raised, style document unchanged |
| V-10 | Long labels | A 120-character message label | No clipping, no overlap |

### 4.2 Style document and the Style UI

| ID | Criterion | Method | Pass condition |
| --- | --- | --- | --- |
| V-11 | Panel → document | Change `actorBkg` via the picker | Key written under `themeVariables` within 200 ms; preview updates; comments and key order preserved |
| V-12 | Document → panel | Hand-edit `signalColor` in the YAML | Panel swatch updates; preview updates |
| V-13 | No feedback loop | Alternate 10 panel edits and 10 YAML edits | Exactly one line per key; no duplicates; no flicker |
| V-14 | Caret preservation | Caret mid-word in the YAML, then change a panel colour | Caret line and column unchanged |
| V-15 | Invalid value | Set `noteBkgColor: red` | Preset default used; one warning; no crash |
| V-16 | Unknown key rejected | Add `securityLevel: loose` to the style document | Rejected, named in a diagnostic, **not merged**; render still uses `strict` |
| V-17 | Preset application | Select each of the four presets | Full document written; preview matches; diagram source untouched |
| V-18 | Reset | Click **Reset style** | Style document replaced by active preset; diagram source untouched |
| V-19 | themeCSS allowlist | Enter `.actor { fill: url(https://x/a.png) }`, then `@import url(x)`, then `.actor { rx: 6 }` | First two rejected with reasons; third applied |
| V-20 | Style export / import | Download `style.yaml`, reset, re-import | Byte-identical document restored; preview identical |
| V-21 | Merged `.mmd` | Export merged, open in the Mermaid Live Editor | Renders with the author's styling, no edits needed |

### 4.3 Export

| ID | Criterion | Method | Pass condition |
| --- | --- | --- | --- |
| V-22 | SVG export | Export, open in a fresh tab | Renders identically to preview; `grep -c "<script" diagram.svg` returns `0` |
| V-23 | **Styles travel** | Export SVG with a non-default style, open it with the site stylesheet absent | Fully styled — no reliance on page CSS; `<style>` present inside the SVG root |
| V-24 | No foreignObject | `grep -c foreignObject diagram.svg` | `0` |
| V-25 | PNG, all scales | Export 1×, 2×, 3× on Chrome, Firefox, **and Safari** | Three files each; **labels present**; no blank or black output; 2× is twice 1× |
| V-26 | PNG background | Export with a dark style | Background matches the effective background; not transparent, not white |
| V-27 | HTML export | Open with the Network tab recording | Zero network requests; `grep -Ec "<script\|<link\|http" diagram.html` returns `0` |
| V-28 | Zoom independence | Zoom to 400 %, export SVG and PNG | Dimensions identical to 100 % |
| V-29 | Style override | Author in Site, export SVG at Current / Light / Dark / Print | Four files; **identical geometry**, only fill and stroke values differ — verify by diff **with IDs normalised first** (per R-9's note — raw IDs differ between the four renders regardless of style and are expected noise, not a failure) |
| V-30 | Override non-destructive | Export with **Light** selected while authoring in Site | Both documents unchanged; panel unchanged; preview still Site |

### 4.4 Security, CSP, and performance

| ID | Criterion | Method | Pass condition |
| --- | --- | --- | --- |
| V-31 | **CSP gate (step 1)** | Load the route, render, exercise every control and export, watch the console | Zero CSP violations; zero console errors; diagram fully styled |
| V-32 | CSP not weakened | `curl -I PREVIEW/tools/sequence-diagram \| grep content-security-policy` | Contains `nonce-`; contains neither `unsafe-inline` nor `unsafe-eval`; policy byte-identical to other routes unless `blob:` was added per R-35a |
| V-33 | Nonce stamping | Inspect the rendered SVG's `<style>` element | Carries the request nonce; styles applied |
| V-34 | Injection attempt | Participant named `<script>alert(1)</script>`; note containing `" onload="alert(1)`; then export SVG and HTML and open both | No alert in preview or either export; text renders literally |
| V-35 | Sanitiser fail-closed | Temporarily force `htmlLabels: true` in a test build | Render refused with an internal error; last good output retained; nothing exported |
| V-36 | No network traffic | Record Network from load through every export | No requests beyond the document, CSS, first-party JS, and the Mermaid chunk |
| V-37 | No storage written | After a full session, inspect Application → Storage | `localStorage`, `sessionStorage`, IndexedDB, cookies all empty; URL unchanged |
| V-38 | Lazy load | Load the route, do not interact for 2 s, then type | Mermaid chunk not requested before first paint; requested on first keystroke or idle; page usable throughout |
| V-39 | Bundle budgets | Inspect build output | Initial JS ≤ 30 KB gz; Mermaid chunk ≤ 230 KB gz |
| V-40 | Lighthouse desktop | Run Lighthouse (desktop) | Performance 100; A11y / BP / SEO 100 |
| V-41 | Lighthouse mobile | Run Lighthouse (mobile) | Performance ≥ 90; A11y / BP / SEO 100; **no Mermaid chunk requested** |
| V-42 | Render latency | `performance.now()` around a re-render of a 200-message diagram | ≤ 800 ms first, ≤ 300 ms subsequent |
| V-43 | Production headers unchanged | Full `README.md` checklist against `https://iainmorton.me` after promotion | All checks PASS |

### 4.5 Editor, initial state, help, and mobile

| ID | Criterion | Method | Pass condition |
| --- | --- | --- | --- |
| V-44 | Pre-rendered sample | Hard-reload with JavaScript **disabled** | Styled sample diagram visible; help content present; no error state |
| V-45 | Sample coverage | Inspect the sample source | Exercises every construct listed in R-38 |
| V-46 | Unload guard | Edit either document then navigate away; separately reload unedited | Warning after an edit; none on an untouched sample |
| V-47 | Mobile fallback | Load at 390 px wide | Pre-rendered sample plus desktop note; no editor, no rail; **no Mermaid chunk requested**; help present; no horizontal overflow |
| V-48 | Rail default and toggle | Hard-reload, then toggle | Collapsed on load; expands to the Style tab; preview resizes rather than being overlaid |
| V-49 | Tabs and keyboard | Focus the tablist, navigate with arrows, activate each tab | All three reachable; `aria-selected` tracks; single tab stop |
| V-50 | Collapsed rail inert | Collapse, Tab through the page, run a screen reader | No focus enters the rail; content not announced |
| V-51 | Insert example | Caret mid-diagram, insert an example from the Syntax tab | Inserted on its own line; re-renders with zero errors; style document untouched |
| V-52 | Help is static | Disable JS and `curl PREVIEW/tools/sequence-diagram \| grep -c "note over"` | Syntax and Guide present in raw HTML; initial JS still within §3.3 |

### 4.6 Shareable links

| ID | Criterion | Method | Pass condition |
| --- | --- | --- | --- |
| V-53 | Round trip | Build a diagram using every R-2 construct plus a custom style, copy the link, open in a fresh private window | Both documents and rendered output identical; zero diagnostics |
| V-54 | Fragment never sent | Open a shared link with Network recording; inspect the document request | Request URL carries no `#d=` payload |
| V-55 | Style fidelity | Author in Site, copy link, open on a machine with a light OS preference | Recipient sees the author's colours |
| V-56 | themeCSS stripped | Add `themeCSS`, copy link, open it | CSS absent; `info` diagnostic shown; rest of the style intact |
| V-57 | Version rejection | Hand-edit the fragment to `#d=9.<payload>` | "Newer version" message; sample loaded; no partial render |
| V-58 | Size budget | Exceed 2,000 characters, then 8,000 | Warning at the first; refusal plus export pointer at the second; length reported both times |
| V-59 | Malformed payload | `#d=2.@@@@`, `#d=2.`, `#d=`, `#d=2.dHJ1bmNhdGVk`, and a payload with one character deleted | Every case: readable error, sample loaded, no uncaught exception |
| V-60 | Hostile payloads | A payload compressed at a high ratio that would decompress to **tens of MB** if fully materialised (not merely "past 100 KB" — see R-59's note: a naive buffer-then-check decoder passes a barely-over-limit payload just as easily as a safe one, so the test payload must be large enough to actually distinguish streaming enforcement from buffer-then-check); one with 3,000 statements; one with 60 participants; one setting `securityLevel: loose` | All rejected before render with readable messages; tab responsive; config never merged; memory does not spike to the fully-decompressed size |
| V-61 | Injection via link | Encode the V-34 inputs into a link and open it | No alert; text literal; exports equally inert |
| V-62 | No ambient URL writes | Type for 30 s watching the address bar, then press Back | Address bar unchanged; Back leaves the tool |
| V-63 | Feature detection | Override `CompressionStream` to `undefined` before init | Copy link disabled with an explanation; rest of the tool functional |

### 4.7 Automated checks

| ID | Criterion | Method | Pass condition |
| --- | --- | --- | --- |
| V-64 | Test suite green | `npm test` locally and in CI | All R-41 cases pass; exit 0; no `[pure]` module imports `mermaid` or a browser global — asserted by running the pure suite in plain Node with no jsdom |
| V-65 | Snapshot gate | Bump Mermaid to a newer patch in a scratch branch and run CI | R-41d snapshots fail, forcing review — confirms the upgrade gate works |
| V-66 | CI gates the merge | Open a PR `preview` → `main` with a deliberately failing test | PR blocked; revert and confirm it unblocks |
| V-67 | Tools hub integration | Verify per SPEC-002 V-9 | Card, route, nav active state, breadcrumb, and sitemap entry correct |

---

## 5. Implementation Order

Ordered so the two decisions that could kill the approach are tested first, before significant work
is invested.

1. **SPEC-002** — tools hub, registry, nav, shared layout. Ships and is verified independently.
2. **CSP spike (gate).** Minimal island: import Mermaid, render one diagram, stamp the nonce, deploy to
   preview. **Verify V-31, V-32, V-33 before anything else is built.** If Mermaid requires
   `unsafe-eval` or the nonce cannot be stamped, stop and reopen D-8 — this is the decision point that
   costs least here and most later.
3. **Export spike (gate).** From the same island, export PNG on Chrome, Firefox, and Safari. Verify
   V-23, V-24, V-25 — that labels survive rasterisation with `htmlLabels: false` and that styles
   travel inside the SVG. These are the second and third things that can invalidate the approach.
4. `vitest` + `jsdom` + CI workflow + ruleset check (R-41a–c), before further logic.
5. `guard.ts`, `style.ts`, `presets.ts`, `css.ts`, `sanitise.ts`, `diagnostics.ts` with tests. No UI.
6. Build-time sample renderer (R-38a) and the static route shell. The route is now a working static
   page before any interactivity exists.
7. Island: editors, gutters, diagnostics, preview, zoom, lazy Mermaid load (R-67).
8. Style UI and bidirectional sync (R-20) — highest-risk UI work; build once rendering is stable.
9. Exporters, including the style override and merged `.mmd`.
10. `link.ts` with its full test suite **before** wiring it to the UI. Encode/decode and the R-59
    limits are the highest-consequence code in the tool — a defect either breaks links already shared
    or accepts a hostile payload.
11. Help rail: author `src/data/seqdiag-help.ts` first, add the R-51 assertions, then build tabs,
    static rendering, and insert-example.
12. Snapshot suite (R-41d). Full §4 verification on preview.
13. Flip `draft: false`, PR to `main`, tag `MINOR`.

---

## 6. Decisions

| # | Decision | Resolution |
| --- | --- | --- |
| D-1 | vitest + CI | **Adopted.** R-41, §3.8, V-64, V-66 |
| D-2 | Directive syntax | **VOID.** No directives exist; style is a separate document |
| D-3 | Markdown export | **Superseded by R-66.** Merged `.mmd` is the portable text format |
| D-4a | Default theme | **Site preset, always.** The site is dark-only; OS preference is not followed |
| D-5 | Sample on load | **Adopted** (R-38), extended by R-38a |
| D-6 | Help panel structure | **One rail, three tabs** |
| D-7 | Link payload location | **URL fragment**, not query string (R-53) |
| **D-8** | **Diagram engine** | **RESOLVED — bundle `mermaid@11.16.1`.** Chosen over a first-party Mermaid-compatible parser. Buys the complete grammar, portability to every other Mermaid consumer, and a far better tested renderer. Costs 195 KB gzipped, 21 transitive dependencies, the `[pure]` layout architecture, and Lighthouse Performance 100 on mobile. Mitigated by R-38a, R-67, R-44. **Conditional on the step 2 and step 3 gates in §5** |
| **D-9** | **Style document format** | **RESOLVED — Mermaid-native YAML config.** No invented keys, so `themeCSS` serves as the advanced escape hatch and merged export stays portable (R-16, R-66). Cost: the Style UI is bounded by what Mermaid's config exposes |
| **D-10** | **Styling depth** | **RESOLVED — two layers.** Layer 1: the 19 sequence `themeVariables` (17 colour variables plus `fontFamily`/`fontSize`, per R-16's example — corrected from a stale "21," R-17) plus the 16-key `sequence.*` allowlist (R-18, ADR-003), driven by grouped, validated, labelled controls with four presets. Layer 2: `themeCSS`, behind an Advanced disclosure, property-allowlisted and stripped from links (R-64) |
| **D-11** | **Grammar scope** | **RESOLVED — render everything, vouch for a subset.** R-2 defines the verified subset; anything else Mermaid accepts renders but is undocumented and untested |
| **D-12** | **Version policy** | **RESOLVED — exact pin, no auto-merge.** Upgrades are reviewed PRs gated by R-41d snapshots |
| **D-13** | **`themeCSS` in links** | **RESOLVED — stripped.** Untrusted CSS can exfiltrate and obscure. It survives in files and exports, which are user-initiated |
| **D-14** | **YAML parser source** | **RESOLVED — first-party parser, not a fallback.** Verified against the installed `mermaid@11.16.1` dependency tree: no `js-yaml`, and no generic YAML library at all, exists anywhere in it, direct or transitive. Mermaid's own frontmatter handling comes from `@mermaid-js/parser`, a purpose-built Langium/Chevrotain grammar for Mermaid's specific frontmatter shape — not a reusable `load()`/`dump()` API. The "otherwise" branch of the original decision is therefore the only path; there was nothing to reach. Made tractable by R-17/R-18's narrow, closed key set (§3.1): the parser can be a targeted find-key/replace-value-span edit against the existing text rather than a general YAML CST parser, which is what R-20's comment- and key-order-preserving round-trip actually needs anyway — a full parse-then-regenerate approach (what `js-yaml` would have done even if present) can't preserve comments on its own. **A second YAML dependency SHALL NOT be added** |
| D-15 | Multi-diagram support | **DEFERRED.** Flowchart and others are already in the bundle, but none are styled, tested, or documented. A future spec, not a stretch goal |

---

## 7. Sign-off

| Role | Name | Status | Date |
| --- | --- | --- | --- |
| Author | Iain Morton | ☑ Approved | 2026-08-05 |

Implementation SHALL NOT begin until this table is completed. §5 steps 2 and 3 are gates: failing
either reopens D-8 before further work.
