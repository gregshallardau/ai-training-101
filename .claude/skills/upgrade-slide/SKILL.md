---
name: upgrade-slide
description: >-
  Audit and upgrade one slide file at a time against this reveal.js presentation
  framework's current utilities/molecules (deck.css) - replacing hand-rolled
  inline styles, dead classes, or bespoke per-slide CSS with the real thing.
  Use when the user says "upgrade this slide/deck to the new molecules", "audit
  <deck> for anti-patterns", "check this deck against deck.css", "clean up this
  slide's CSS", or is migrating an older deck (built before a framework CSS
  update) onto the current utility set. Deliberately mechanical: a fixed
  pattern -> replacement table, one slide per pass, minimal judgment calls -
  built to be run by a cheap/small model or in a tight loop, not to design new
  patterns.
---

# upgrade-slide

**This skill does not design anything new.** It looks up a known anti-pattern in
the table below and applies the exact listed replacement. If a violation does
not match a row in the table, **STOP and report it for human review** - do not
improvise a fix, do not invent a new class, do not guess. Guessing is exactly
the failure mode this skill exists to avoid.

## The loop

1. Run `npm run lint:slides`. This is the objective, mechanical detector - it
   lists every violation as `<file>:<line> — <problem>`. Do not hand-scan for
   problems; work only from this output.
2. If there are zero violations, report "clean" and stop.
3. Take the **first violation in the first flagged file**. Read only that one
   file (not the whole deck - this keeps each pass small and cheap).
4. Match the violation against the **Recipe table** below by its shape (not by
   vibes - the table's "Detect" column is what `lint:slides` actually flagged,
   or a literal text/attribute pattern to grep for).
5. **Exact match found** -> apply the listed "Replace with" transformation
   verbatim. Nothing extra, nothing renamed, nothing "while I'm in here."
6. **No exact match** -> do not touch this violation. Add it to the report's
   "needs human review" list with the file, line, and violation text. Move on.
7. Re-run `npm run lint:slides` scoped to the file you just edited (or the full
   run - it's fast) to confirm that violation is actually gone and you didn't
   introduce a new one.
8. Repeat from step 3 for the next violation, until the file has none left or
   everything remaining is flagged for human review. Then move to the next
   flagged file.
9. If any component (`src/components/**`) was touched, run `npm run check:vocab`
   once before the final report.
10. **Final report**: files changed, violations fixed (count + which recipe row
    each used), and the full "needs human review" list with reasons. Never
    claim a file is "upgraded" if it still has unresolved violations - report
    it as partially done.

## Recipe table

| Detect | Replace with |
|---|---|
| Inline `style="height: …; display: flex; align-items: center; justify-content: center"` (or a local `<style>` doing the same) wrapping an image/text → arrow/connector → text sequence, repeated near-identically across multiple slide files | `.stage` (+ `.stage-item` per side, `.stage-arrow` for the connector, `.stage-vertical` if stacked, `style="--stage-height: …"` for the height override). See `deck.css`'s `.stage` comment block for the exact markup shape. |
| A `<section>` that's a big-statement / part-break slide, with an inline or local-`<style>` dark/inverted background + centred text | `.divider` on the `<section>` - no inline background needed, it already inverts `--fg`/`--bg`. |
| A hero/title slide with manually centred flex + a small label above the heading + a muted line below it | `.title-slide` on the `<section>`, with `.eyebrow` (above) and `.dek` (below) on the label/sub-line elements. |
| A `<blockquote>` (or a styled `<p>`) doing pull-quote styling by hand (centred, oversized, custom margin) | `blockquote.quote`, with a trailing `<cite>` for attribution. |
| A hand-rolled "card" - bordered box with padding/radius, maybe a hover state, defined in a local `<style>` or inline | `.box` (+ `.border`, and `.interactive` / `.selected` / `.compact` as the original hover/picked/dense behaviour calls for). Colour it with a colour modifier class (`.primary` etc.) or `data-topic="<name>"`, not a custom colour. |
| A hand-rolled coloured tag/pill (small rounded box, one word/short label) | `.chip`, coloured via a colour modifier or `data-topic="<name>"` if it's an identity/category tag (check `deck.css`'s `TOPIC COLOURS` section for defined names - do not invent one; if the needed name isn't defined, flag for human review, don't add it yourself). |
| A `<deck-*>` tag not in `src/components/registry.js`'s `COMPONENTS` map | **Always flag for human review** - never silently comment it out or delete it. The human decides: register a real component via `artefact-builder`, or remove the reference. |
| `var(--color-*)`, `var(--size-*)`, `var(--radius-0/1/2/pill)`, `var(--font-sans/serif/mono)`, `var(--dur-*)`, `var(--ease-*)` (tier-1 primitives, per `src/styles/vars/primitives.css`) | The matching tier-2 semantic from `src/styles/vars/semantic.css` (e.g. a raw brand-blue primitive → `var(--primary)`, a raw radius primitive → `var(--radius-control)` or `var(--radius-card)` depending on context). If it's genuinely unclear which tier-2 semantic applies, flag for human review rather than guessing. |
| A class not in `deck.css` / Reveal's built-ins **and no row above matches** | Flag for human review. This is the "genuinely bespoke, needs a judgment call" case `slide-builder`'s "compose, never invent" rule exists for - not this skill's job. |
| Several slides that are near-identical copies of each other, each adding one more item (a "wall" built by copy-pasting a whole slide per step) | Flag for human review with a note pointing at `docs/cheatsheet.md`'s "Step-through across slides (auto-animate rungs)" section - collapsing N copied files into an auto-animate rung sequence is a structural, multi-file change outside this skill's one-file-at-a-time scope. |

## Guardrails

- One file per edit. Never batch-edit multiple slides in one pass without
  re-running the lint in between.
- Never add a new utility to `deck.css`, `component-styles.md`, or
  `src/styles/**` from this skill - if the fix needs one that doesn't exist,
  that's a human-review item, exactly like `slide-builder`'s escalation path.
- Never touch slide *content* (headings, prose, data) - only the CSS/markup
  shape that expresses it.
- If unsure whether two things are "the same shape," they are not a match -
  flag it. A false negative (missed upgrade) is cheap; a false positive (wrong
  transformation applied) breaks a slide.
