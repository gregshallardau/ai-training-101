# Framework conventions (shared reference)

The four authoring skills (`slide-builder`, `artefact-builder`, `deck-builder`,
`skin-builder`) all read this file first. It is a reference, not a skill.

---

## 1. Repo layout

```
index.html                     .reveal > .slides holds only `<!-- @slides -->`
                               plus one <style>@layer ...;</style> that pins layer order
build/vite-plugin-slides.js     stitches slides/*.{html,md} into that marker (dev + build)
vite.config.ts                  Reveal's config + `@ -> /src` alias + slides() plugin
vite.config.deck.js             `npm run build:deck` -> static export in deck-dist/

src/
  main.js                       single entry: styles -> registry -> Reveal(+Notes,Markdown) -> gsap/alpine
  styles/
    layers.css                  the @layer order declaration
    index.css                   ordered @imports of everything below
    vendor/reveal-base.scss     wraps css/reset.css + css/layout.scss + css/reveal.scss
                                + css/theme/template/theme.scss into cascade layers (Sass compile time)
    vars/primitives.css         TIER 1 - raw values (@layer vars.primitive)
    vars/semantic.css           TIER 2 - role names + [data-theme] skins (@layer vars.semantic)
    theme/deck.css              maps semantic vars -> Reveal --r-* API (@layer theme)
  components/
    deck-element.js             DeckElement base class
    registry.js                 THE manifest + barrel - the one list of what components exist
    README.md                   the component contract
    <kebab>/index.js            one component; the only customElements.define() site for it
  lib/
    gsap.js                     initGsap() - hero / section-break motion
    d3.js                       d3 + topojson + readPalette(); imported lazily by components
    alpine.js                   initAlpine() - reactive UI + Alpine.store('deck') cross-slide state

slides/
  README.md                     slide portability contract + numbering
  NN[.M]-<slug>.{html,md}        one file per slide position

public/
  served at the site root by Vite (default `publicDir` behaviour) - a file at
  `public/foo/bar.png` is fetched as `/foo/bar.png`, **never** `/public/foo/bar.png`.
  Images, video, and other static assets referenced from a slide live here.
```

Reveal.js 6.0.1 is the base (its `js/`, `css/`, `plugin/`, `dist/`, build scripts kept
intact). Upstream is the git remote `upstream`; framework updates come via
`git fetch upstream && git merge upstream/<tag>`.

---

## 2. CSS custom property tiers

**Tier 1 - primitives** (`src/styles/vars/primitives.css`, `@layer vars.primitive`):
raw context-free values - `--color-*`, `--size-*`, `--radius-*`, `--font-*`,
`--dur-*`, `--ease-*`. Never referenced by a component, by JS, or inside a
`[data-theme]` block.

**Tier 2 - semantics** (`src/styles/vars/semantic.css`, `@layer vars.semantic`):
role names, each `var(--<primitive>)`. This is the API everything downstream uses:

```
--surface-bg  --surface-fg  --surface-fg-muted  --surface-line
--accent  --accent-strong  --accent-fg
--space-inline  --space-block  --space-gap
--radius-control  --radius-card  --radius-round
--font-heading  --font-body  --font-code
--motion-hero-duration  --motion-hero-ease  --motion-ui-duration  --motion-ui-ease
```

A `[data-theme="name"] { ... }` block re-points semantics at other primitives - that
is the entire re-skin mechanism. Components and all JS consume **tier 2 only**;
never a primitive, never a raw literal.

---

## 3. Cascade layer order

Declared once (`src/styles/layers.css`, and mirrored in `index.html`), low -> high:

```
@layer reveal.reset, reveal.base, reveal.theme, vars.primitive, vars.semantic, theme, components;
```

Reveal's own CSS is pulled into `reveal.*` layers by `vendor/reveal-base.scss` so a
deck's `theme` / `components` layers can override it without specificity hacks.
Nothing of ours is left unlayered (unlayered = an explicit escape hatch, unused).

---

## 4. Canonical component contract

- **One definition per component.** `src/components/<kebab>/index.js` is the only
  place `customElements.define('deck-<kebab>', ...)` runs for it.
- The class `extends DeckElement` (`src/components/deck-element.js`): `attachShadow`,
  idempotent `connectedCallback`, `static styles` (CSS string in Shadow DOM),
  `static tag`, `cssVar(name)` helper.
- **Consume tier-2 semantic custom properties only** (plus Reveal's `--r-*`).
- A component may `import` from `@/lib/*`; a slide may not.
- Register it: one `import './<kebab>/index.js';` line **and** one `COMPONENTS`
  entry in `src/components/registry.js`.
- **"Does component X exist?" is answered by reading `registry.js` alone.**
- Slides place a `<deck-*>` tag and pass data via attributes / slots - never
  markup, style, or behaviour.

---

## 5. Slide portability contract

Full text in `slides/README.md`. In short, a slide file is portable iff:

1. it references shared things only via framework-guaranteed surfaces - registered
   `<deck-*>` tags, tier-2 semantic custom properties, Reveal `--r-*` (and `@/lib/*`
   only from inside a component);
2. **or** it fully inlines its artefact: scoped `<style>` + an inline
   `<script type="module">` with **zero imports**, browser-native APIs only, DOM
   lookups scoped by the slide's own `#slug` (never `document.currentScript` - it is
   `null` once Vite bundles the inline script), and any `getComputedStyle`
   custom-property read deferred to the `load` event (framework CSS is JS-injected
   in dev, so it may not be live when an inline module first runs);
3. it makes no reference to another slide's `id` and no assumption about neighbours
   (cross-slide `<a href="#/...">` links live only on the non-portable overview slide);
4. it uses semantic custom properties only - never a primitive, never a raw literal.

### Numbering

```
NN-<slug>.<html|md>      NN = zero-padded major (>= 2 digits), step 1
NN.M-<slug>.<html|md>    .M = vertical-stack minor; files sharing NN wrap in one <section> stack
```

`<slug>` (kebab) becomes the slide `id` / `data-slug`. `00-title.*` = title slide;
`01-overview.*` = jump menu (deck-specific, NOT portable). `.html` body = exactly one
`<section>` (may nest); `.md` body = raw Markdown (`--` fence = vertical sub-slide,
`Note:` line = speaker note). The plugin does not recurse into subfolders.

---

## 6. Assembly

`build/vite-plugin-slides.js` runs in `transformIndexHtml` (order `'pre'`) for
`npm start`, `npm run build`, and `npm run build:deck` alike. It reads `slides/`
with `fs` (files never enter the module graph), sorts by filename, injects each at
`<!-- @slides -->`. `.md` files are inlined as `<section data-markdown><script
type="text/template">...`. Dev watcher triggers a full reload on slide add/change/
unlink; Reveal restores position from `hash: true`.

---

## 7. Terminology

Never call a styling value a **"token"** - it is a CSS custom property / CSS
variable. This binds generated code, comments, docs, and chat about styling. It
does **not** touch slide *content*: in these talks "token" legitimately means a
chunk of text, and `deck-builder` may keep that word in stub content verbatim.

---

## 8. Vertical stacks, fragments & images

Reveal.js mechanics that authoring skills rely on but don't reinvent - covered
here once so no one has to re-derive them from `js/reveal.js` source.

**Vertical stacks - two equivalent shapes:**

- Sibling files sharing a major number: `08-x.html`, `08.1-y.html`, `08.2-z.html`
  (see numbering in `slides/README.md`).
- One `.html` file, nested `<section>`s:
  ```html
  <section id="<slug>" data-slug="<slug>">
    <section><!-- first sub-slide --></section>
    <section><!-- second sub-slide --></section>
  </section>
  ```
  Prefer this shape when the sub-slides are tightly coupled (e.g. one picture
  per sub-slide under a shared question) - it keeps them in one portable file.

**Fragments (step-reveal on a single slide):** add `class="fragment"` to any
element inside a `<section>`. Variant classes change the reveal effect - `grow`
`shrink` `zoom-in` `fade-out` `semi-fade-out` `strike` `fade-up` `fade-down`
`fade-right` `fade-left` `fade-in-then-out` `current-visible`
`fade-in-then-semi-out` `highlight-red` `highlight-green` `highlight-blue`
`highlight-current-red` `highlight-current-green` `highlight-current-blue`.
`data-fragment-index="N"` (zero-based) reorders them; unindexed fragments
follow document order.

**Navigation order:** pressing down/right resolves every unrevealed fragment
on the current (sub-)slide first, one at a time, and only advances to the next
vertical/horizontal slide once none remain. A vertical stack of picture
sub-slides, each with its own fragment(s), composes directly with this - no
extra wiring needed.

**Images:** put the file under `public/` (see repo layout, section 1) and
reference it by the root-relative path Vite serves it at. Use `.r-stretch` on
an `<img>`/`<video>`/`<iframe>` to fill the remaining slide height instead of
hand-rolling a size.

---

## 9. Re-skin

Runtime: `document.documentElement.dataset.theme = '<name>'` (or `<html
data-theme="<name>">`). A skin is a `[data-theme="<name>"] { ... }` block appended
to `src/styles/vars/semantic.css` by `skin-builder`. Reveal's `--r-*` (via
`theme/deck.css`) and D3 palettes (read live via `getComputedStyle`) follow
automatically.
