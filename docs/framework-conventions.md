# Framework conventions (shared reference)

The architecture reference for this framework. The authoring skills
(`presentation-planner`, `deck-builder`, `slide-builder`, `artefact-builder`,
`skin-builder`) all read this file first; it is also the doc to read by hand when
you want the whole picture. For day-to-day "what tag / class / knob do I use", see
[`cheatsheet.md`](./cheatsheet.md); for the plan file, [`plan-format.md`](./plan-format.md).

---

## 1. Repo layout

```
index.html                     .reveal > .slides holds only `<!-- @slides -->`
                               plus one <style>@layer ...;</style> that pins layer order
deck.css                       ROOT-level deck look: brand knobs (commented menu) +
                               deck-wide element tweaks + utility classes.
                               @layer deck (highest). Edit per deck to re-skin.
deck.config.js                 ROOT-level Reveal knobs a deck author tunes: slide
                               size, transition, slideNumber, hash, and `chrome`
                               (a logo + footer on every slide). src/main.js spreads
                               the rest into new Reveal({...}) and mounts `chrome`
                               into .reveal; plugins stay in src.
build/vite-plugin-slides.js     stitches slides/*.{html,md} into that marker (dev + build)
vite.config.ts                  Reveal's config + `@ -> /src` alias + slides() plugin
vite.config.deck.js             `npm run build:deck` -> static export in deck-dist/

src/
  main.js                       single entry: styles -> registry -> Reveal(../deck.config.js + Notes,Markdown) -> gsap/alpine
  styles/
    layers.css                  the @layer order declaration
    index.css                   ordered @imports of everything below, incl. ../../deck.css last
    vendor/reveal-base.scss     wraps css/reset.css + css/layout.scss + css/reveal.scss
                                + css/theme/template/theme.scss into cascade layers (Sass compile time)
    vars/primitives.css         TIER 1 - raw values (@layer vars.primitive)
    vars/semantic.css           TIER 2 - role names + [data-theme] skins (@layer vars.semantic)
    theme/deck.css              maps semantic vars -> Reveal --r-* API (@layer theme). Plumbing only.
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
--bg  --fg  --muted  --line
--primary  --primary-strong  --primary-fg
--secondary  --secondary-strong  --secondary-fg
--success  --success-fg   --danger  --danger-fg   --warning  --warning-fg
--space-inline  --space-block  --space-gap
--radius-control  --radius-card  --radius-round
--font-heading  --font-body  --font-code
--motion-hero-duration  --motion-hero-ease  --motion-ui-duration  --motion-ui-ease
```

Naming follows the common Bootstrap / shadcn set.

A `[data-theme="name"] { ... }` block re-points semantics at other primitives - that
is the entire re-skin mechanism. Components and all JS consume **tier 2 only**;
never a primitive, never a raw literal.

**Deck look** (`deck.css`, repo root, `@layer deck`): the one file a deck author
edits. A commented menu of the high-value knobs (`--primary*`, `--secondary*`,
status colours, `--bg` / `--fg` / `--muted` / `--line`, `--font-*`, type scale)
plus active `--text-root-size` (shipped 32px; the primitive default stays
Reveal's 40px), `--slide-padding`, deck-wide element tweaks (list type-scale),
and the **utility classes** (`.text-primary`, `.text-muted`, `.text-center`,
`.flex-cols`, `.flex-rows`, `.list-compact`, `.box` + `.border` / `.bar`,
`.chip`, and the shared colour modifiers `.primary` / `.secondary` / `.success`
/ `.danger` / `.warning`) - a framework surface a slide may use so it never needs
its own `<style>` for common things. `@import`ed last by `src/styles/index.css`.
Highest layer, so it wins with no `!important`. `skin-builder` still writes
`[data-theme]` blocks to `semantic.css`, not here - this file is the single look
the deck ships with.

**Topic colours** (`deck.css`'s `TOPIC COLOURS` section, inside `:root {}`): an
open-ended, **deck-owned** named legend - `--topic-<name>` / `--topic-<name>-fg`
pairs a deck author defines for identity tagging (which speaker / theme /
category), any count, any names. Explicitly separate from and additive to the
tier-2 status colours above (`--success` / `--danger` / `--warning` stay for
severity, not identity). Unlike tier-2 semantics, these aren't a fixed
framework-owned role list - they live in `deck.css`, not `semantic.css`, because
each deck picks its own set. A matching `[data-topic="<name>"]` selector (near
`COLOUR MODIFIERS`, same file) sets `--c`/`--c-fg` the same way `.primary` /
`.success` etc. do, so `data-topic="<name>"` on any `.chip` or `.box` picks up
the tint with no new CSS - see `deck.css`'s own comments for the exact shape.

---

## 3. Cascade layer order

Declared once (`src/styles/layers.css`, and mirrored in `index.html`), low -> high:

```
@layer reveal.reset, reveal.base, reveal.theme, vars.primitive, vars.semantic, theme, components, deck;
```

Reveal's own CSS is pulled into `reveal.*` layers by `vendor/reveal-base.scss` so a
deck's `theme` / `components` / `deck` layers can override it without specificity
hacks. `deck` (the root `deck.css`) is highest. Nothing of ours is left unlayered
(unlayered = an explicit escape hatch, unused).

---

## 4. Canonical component contract

- **One definition per component.** `src/components/<kebab>/index.js` is the only
  place `customElements.define('deck-<kebab>', ...)` runs for it.
- The class `extends DeckElement` (`src/components/deck-element.js`): `attachShadow`,
  idempotent `connectedCallback`, `static styles` (CSS string in Shadow DOM),
  `static tag`, `cssVar(name)` helper.
- **Consume tier-2 semantic custom properties only** (plus Reveal's `--r-*`), and
  the shared style vocabulary in `artefact-builder/reference/component-styles.md` -
  never a bespoke per-component class pile.
- A component may `import` from `@/lib/*`; a slide may not. `artefact-builder`
  builds each one from a kind recipe (`d3-chart`, `d3-circle-pack`, `svg-diagram`,
  `gsap-hero`, `alpine-interactive`); Alpine markup in a shadow root needs
  `Alpine.initTree(this.shadowRoot)` behind a ready-guard.
- Register it: one `import './<kebab>/index.js';` line **and** one `COMPONENTS`
  entry in `src/components/registry.js`.
- **"Does component X exist?" is answered by reading `registry.js` alone.**
- Slides place a `<deck-*>` tag and pass data via attributes / slots - never
  markup, style, or behaviour.

---

## 5. Slide portability contract

Full text in `slides/README.md`. In short, a slide file is portable iff:

1. it references shared things only via framework-guaranteed surfaces - registered
   `<deck-*>` tags, tier-2 semantic custom properties, Reveal `--r-*`, the
   `deck.css` utility classes (and `@/lib/*` only from inside a component);
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

## 8. Re-skin

Runtime: `document.documentElement.dataset.theme = '<name>'` (or `<html
data-theme="<name>">`). A skin is a `[data-theme="<name>"] { ... }` block appended
to `src/styles/vars/semantic.css` by `skin-builder`. Reveal's `--r-*` (via
`theme/deck.css`) and D3 palettes (read live via `getComputedStyle`) follow
automatically.
