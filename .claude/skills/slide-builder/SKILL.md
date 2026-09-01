---
name: slide-builder
description: >-
  Scaffold, insert, reorder, or renumber slide files in slides/ for this
  reveal.js presentation framework. Use when the user says "add a slide",
  "insert a slide after/before X", "new slide about ...", "reorder the slides",
  "renumber the deck", "split this slide into a vertical stack", or "make slide N
  a sub-slide of M". Produces one portable .md or .html file per slide and wires
  its id/slug (and overview-menu link if one exists).
---

# slide-builder

**Before anything: read `.claude/skills/framework-conventions.md`.**

## Inputs

- slide title / topic
- target position - "after `architecture`", "position 3", "vertical child of 3",
  "end"
- format hint (`.md` or `.html`) - optional; otherwise decide with the heuristic
- optional: an artefact description, or the name of an existing `<deck-*>` it uses

## Read (detect state)

1. `.claude/skills/framework-conventions.md` and `slides/README.md`.
2. `slides/` listing -> parse every `NN(.M)-<slug>.<ext>` into an ordered model.
3. `index.html` - confirm `<!-- @slides -->` is present.
4. `src/components/registry.js` - **only if** the slide will use a `<deck-*>` tag.
   If the tag is not in `COMPONENTS`, stop and tell the user to run
   `artefact-builder` first.

## Format heuristic

- prose / bullets / headings only -> `.md`
- scoped layout, a `<deck-*>` tag, or a fully-inlined artefact -> `.html`

## Procedure

1. Resolve the target position to a `major`(.`minor`).
   - "insert between" / "before X": shift the prefix of X and every later sibling
     by +1 (zero-padded, step 1). Produce an explicit **rename list**
     (`git mv old new`), applied bottom-up so names never collide.
   - "vertical child of N": assign `N.M` with the next free `M`.
2. Pick the format. Render the body from `reference/slide-templates.md`.
   - `.html`: exactly one `<section id="<slug>" data-slug="<slug>">...`.
   - `.md`: raw Markdown, no wrapper (the plugin adds it). Use
     `<!-- .slide: ... -->` only if the slide needs Reveal attributes.
3. **Portability lint** the body - reject or warn on:
   - `href="#/<other-slug>"` pointing at another slide,
   - any `import` inside an inline `<script>`,
   - `document.currentScript` in an inline script (null once bundled - use
     `document.getElementById('<slug>')`),
   - any `<deck-*>` tag not present in `registry.js`,
   - any `var(--...)` that is a tier-1 primitive, or a raw colour / length literal.
4. If an overview/menu slide exists (e.g. `slides/01-overview.html`), add one
   `<a href="#/<slug>">` link to it. Otherwise leave navigation alone.
5. Write the new file; apply the rename list.
6. Report: files created, files renamed, and confirm nothing else in the deck
   references the new or moved slides by `id`.

## Consistency

Never emit a per-slide `<style>` for anything reusable or a bespoke component
definition inside a slide - a non-trivial visual becomes a `<deck-*>` via
`artefact-builder`. Say "CSS custom property" / "CSS variable", never "token", in
any comment or note you add. Slide *content* text may use "token" as the user
wrote it.
