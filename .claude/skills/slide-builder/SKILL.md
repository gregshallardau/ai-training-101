---
name: slide-builder
description: >-
  Scaffold, edit, insert, reorder, or renumber slide files in slides/ for this
  reveal.js presentation framework. Use when the user says "add a slide", "insert
  a slide after/before X", "new slide about ...", "edit / rewrite / change slide
  X", "add bullets to X", "change X's title", "promote X to HTML", "reorder the
  slides", "renumber the deck", "split this slide into a vertical stack", or "make
  slide N a sub-slide of M". Produces one portable .md or .html file per slide and
  keeps its id/slug and overview-menu link consistent.
---

# slide-builder

**Before anything: read `docs/framework-conventions.md` and `docs/cheatsheet.md`.**

## The one hard rule: compose, never invent classes

A slide is built from exactly three things:

1. **semantic HTML elements** - `<dl>`/`<dt>`/`<dd>` for a glossary, `<table>`
   for a grid, `<strong>` for a term, `<hr>` for a rule, `<blockquote>` for a
   pull-quote, `<h2>`-`<h4>` for headings. The framework styles these already.
2. **the `deck.css` utility classes** - `.text-primary` `.text-muted`
   `.text-center` `.flex-cols` `.flex-rows` `.columns` `.columns-3`
   `.list-compact` `.box` (+ `.border` / `.bar` / `.interactive` / `.selected` /
   `.compact`) `.chip`, and the whole-slide **molecules**: `.title-slide`
   (+ `.eyebrow` / `.dek`), `.divider`, `.stage` (+ `.stage-vertical`,
   `style="--stage-height: …"`), `blockquote.quote` (+ `<cite>`).
3. **the colour modifiers** - `.primary` `.secondary` `.success` `.danger`
   `.warning`, added after a block class.
4. **the topic-colour attribute** - `data-topic="<name>"` on a `.chip`/`.box`,
   where `<name>` is one this deck actually defined in `deck.css`'s
   `TOPIC COLOURS` section (see Read step below). Do not invent a topic name
   that isn't defined there.

That is the **entire** toolkit. You may **NOT** create a bespoke class family -
`.glossary-book` / `.glossary-entry` / `.card-title` / `.step-2` and the like -
**anywhere**:

- not in a per-slide `<style>`,
- not by adding a block to `deck.css`,
- not in `src/`.

A `.glossary-entry` that is just bold text is a `<strong>` (or a `<dt>`). If a
layout you need has no utility, it is one of:

- **a `<dl>` / `<table>` / `<hr>` you forgot exists** - use it;
- **a genuinely missing utility** - STOP, show the user the markup, and say "this
  needs one small utility added to `deck.css` (your call)". Do not add it yourself
  from this skill;
- **a real widget** (needs a library, JS, or is a reusable component) - STOP and
  tell the user to run `artefact-builder` for a `<deck-*>`.

| Rationalisation | Reality |
|---|---|
| "I'll put the classes in `deck.css` - that's the proper place" | `deck.css` is the framework's surface, not yours to extend from slide work. |
| "It's a reusable pattern, it deserves its own classes" | Reusable -> a `<deck-*>` component, or one utility the user approves. Never a family. |
| "A `<style>` block scoped to `#slug` is fine here" | Only for a genuinely one-off inline artefact (shape 3). A glossary is not that. |
| "It's a step-by-step build-up over several slides, I'll copy the previous one and add a line" | That's the glossary-wall anti-pattern - use the auto-animate rung technique (`docs/cheatsheet.md` § Step-through across slides) instead. |

## Modes

- **New / structural** - create a slide, insert between slides, reorder, renumber,
  split into a vertical stack.
- **Edit** - change the content of an existing slide: rewrite body, add/remove
  bullets, change the heading, add a scoped artefact, convert `.md` <-> `.html`.

## Inputs

- for a new slide: title / topic, target position ("after `architecture`",
  "position 3", "vertical child of 3", "end"), optional format hint (`.md` /
  `.html`), optional artefact description or existing `<deck-*>` name
- for an edit: which slide (slug, number, or "the one about X") + the change

## Read (detect state)

1. `docs/framework-conventions.md` and `slides/README.md`.
2. `slides/` listing -> parse every `NN(.M)-<slug>.<ext>` into an ordered model.
3. `index.html` - confirm `<!-- @slides -->` is present.
4. `src/components/registry.js` - **only if** the slide will use a `<deck-*>` tag.
   If the tag is not in `COMPONENTS`, stop and tell the user to run
   `artefact-builder` first.
5. **If the slide will use `data-topic`**, also parse `deck.css`'s
   `TOPIC COLOURS` section for the set of names this deck has actually
   uncommented/defined. Warn (don't invent) if the requested name isn't there -
   tell the user it needs adding to `deck.css` first.
6. **Edit mode:** read the target slide file itself; if the deck has an
   overview/menu slide (e.g. `slides/01-overview.html`), read that too.

## Format heuristic

- prose / bullets / headings only -> `.md`
- scoped layout, a `<deck-*>` tag, or a fully-inlined artefact -> `.html`

## Procedure - new / structural

1. Run `scripts/make-slide.js` to do the position math, zero-padded renumbering,
   rename list, and stub file - do not hand-derive this arithmetic:

   ```
   node scripts/make-slide.js --title "<title>" --format md|html \
     --after <slug> | --before <slug> | --position <N> | --vertical-of <N> | --end
   ```

   ("insert between X and Y" = `--after X` or `--before Y`, either works;
   "vertical child of N" = `--vertical-of N`.) Run with `--dry-run` first if the
   position is at all ambiguous, to show the user the plan before touching disk.
   It handles the rename list (via `git mv`, bottom-up, never colliding) and
   writes a `TODO:`-stub file itself - you do not write the initial file by hand.
2. Replace the script's `TODO:` stub with the real body, from the slide-file
   shapes in `docs/cheatsheet.md` ("Slide files").
   - `.html`: the script already wrote `<section id="<slug>" data-slug="<slug>">`
     - fill in the content, keep the wrapper.
   - `.md`: the script already wrote a heading - replace the `TODO:` bullet with
     real content. Use `<!-- .slide: ... -->` only if the slide needs Reveal
     attributes.
3. **Portability lint** (see below).
4. If an overview/menu slide exists, add one `<a href="#/<slug>">` link to it.
   Otherwise leave navigation alone.
5. Report: files created, files renamed (from the script's output), and confirm
   nothing else in the deck references the new or moved slides by `id`.

## Procedure - edit

1. Resolve the reference ("slide 7", "the one about vectors") to exactly one file.
   If it is ambiguous, ask.
2. Apply the requested content change to the body. Keep the existing `id` /
   `data-slug` and the filename unchanged unless the user explicitly asks to
   rename the slide.
3. **Format promotion:** if the edit introduces scoped layout, a `<deck-*>` tag,
   or an inline artefact, convert `.md` -> `.html` - wrap the body in
   `<section id="<slug>" data-slug="<slug>">`, carry the heading and content over,
   `git mv` the file to `.html`. (A `.html` slide never needs demoting to `.md`.)
4. **Portability lint** the new body (see below).
5. **Overview sync:** if the slide's visible heading changed and an overview/menu
   slide links this slug, update that link's **text** to match. Do not touch the
   `href` / slug unless the user asked for a rename (that is the structural mode's
   rename list).
6. **Rename requested:** if the user wants a new slug, hand off to the structural
   rename path - new filename, update `id`/`data-slug`, update the overview
   `href`, and check nothing else references the old `id`.
7. Report: file changed (and any `.md`->`.html` move), lint result, whether the
   overview link text was updated.

## Portability lint

After writing the body, run `npm run lint:slides` (checks every file in
`slides/`; the new/edited one is what matters here). It executes these same
rules - a non-zero exit is a hard stop: rewrite with semantic HTML + utilities,
or stop per "The one hard rule". Do not suppress or ignore a failure.

- any **class not in the toolkit above** and not defined in this slide's own
  scoped `<style>` (shape 3) - a `class="glossary-entry"` / `class="feature-card"`
  invented for this slide,
- any `<deck-*>` tag not present in `registry.js`'s `COMPONENTS` map,
- any `var(--...)` that is a tier-1 primitive (semantic custom properties only).

The lint is a static class/tag/var check - it doesn't know about the following,
so still reason through these by hand:

- `href="#/<other-slug>"` pointing at another slide (allowed only on the
  non-portable overview slide),
- any `import` inside an inline `<script>`,
- `document.currentScript` in an inline script (null once bundled - use
  `document.getElementById('<slug>')`),
- a raw colour / length literal outside `var(...)` (e.g. `style="color: #fff"`).

## Consistency

Prefer the `deck.css` utility classes (`.text-primary`, `.text-muted`,
`.text-center`, `.flex-cols`, `.flex-rows`, `.list-compact`, `.box`) over a
per-slide `<style>`. Never emit a per-slide `<style>` for anything reusable or a
bespoke component definition inside a slide - a non-trivial visual becomes a
`<deck-*>` via `artefact-builder`. Never edit `deck.css`, `src/styles/**`, or components from
this skill - a slide adapts to the framework's surfaces, it does not change them.
Say "CSS custom property" / "CSS variable", never "token", in any comment or note
you add. Slide *content* text may use "token" as the user wrote it.
