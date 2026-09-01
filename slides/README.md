# slides/

One file per slide. Each file is **either** Markdown (`.md`) **or** HTML (`.html`).
`build/vite-plugin-slides.js` stitches them, in filename order, into Reveal's
`<div class="slides">` at the `<!-- @slides -->` marker in `index.html` - for
`npm start`, `npm run build`, and `npm run build:deck` alike.

## Naming & numbering

```
NN-<slug>.<html|md>          NN = zero-padded major (>= 2 digits), step 1
NN.M-<slug>.<html|md>        .M = vertical-stack minor
```

- `<slug>` (kebab-case) becomes the slide's `id` and `data-slug`. Link with
  `<a href="#/<slug>">`, jump with `jumpToSlide`, or press `o` for the overview.
- **One file = one horizontal slide position.**
- Files that share a major `NN` are wrapped in **one vertical `<section>` stack**,
  ordered by `.M`. A single `.html` file may instead be its own stack via nested
  `<section>`s.
- `00-title.html` is the title slide. `01-overview.html`, by convention, is the
  jump menu - **deck-specific, not portable** (it names other slides' slugs).
- The plugin does not recurse into subfolders.

## File body

- `.html`: exactly one `<section>...</section>` (may nest `<section>`s). The plugin
  injects `id`/`data-slug` from the filename unless you set your own.
- `.md`: raw Markdown, no `<section>`. A `--` line starts a vertical sub-slide; a
  `Note:` line becomes a speaker note.

## Portability contract

A slide file is portable - drop it into any framework deck and it renders - iff:

1. It references shared things only through **framework-guaranteed surfaces**:
   - canonical `<deck-*>` tags (see `src/components/registry.js`),
   - **semantic** CSS custom properties (`--surface-*`, `--accent*`, `--space-*`,
     `--radius-*`, `--motion-*`, `--font-*`) and Reveal's `--r-*`,
   - `@/lib/*` **only from inside a `<deck-*>` component**, never from a slide.
2. **Or** it fully inlines its artefact: a scoped `<style>` plus an inline
   `<script type="module">` with **zero imports** (browser-native APIs only),
   DOM lookups scoped by the slide's own `#slug` (never `document.currentScript` -
   `null` once bundled), and any `getComputedStyle` custom-property read deferred
   to the `load` event (framework CSS is JS-injected in dev).
3. It makes **no reference to another slide's `id`** and no assumption about
   neighbouring slides. Cross-slide `<a href="#/...">` links belong on the
   non-portable overview slide only.
4. It uses **semantic** custom properties only - never a tier-1 primitive, never a
   hard-coded colour or length.

Anything that needs a library import must become a registered `<deck-*>` component
via the `artefact-builder` skill.

See `.claude/skills/framework-conventions.md` for the full picture.
