# Canonical Component Library

## The rule

**One canonical definition per component.** Slides reference a component by its
`<deck-*>` tag and pass data via attributes / slots. Slides **never** redefine a
component's markup, styling, or behaviour, and **never** carry a per-slide
`<style>` for it. If you're tempted to style something on a slide, that something
should be a component.

## Anatomy - machinery here, content at the repo root

This folder holds the **framework machinery**: the base class, the manifest,
and the shared style vocabulary. The actual `<deck-*>` implementations are
deck-author content, same as `slides/` - they live in the root-level
`components/` folder, not here.

```
src/components/              FRAMEWORK MACHINERY - the contract, not a deck's content
  deck-element.js            base class (DeckElement)
  registry.js                the manifest + barrel - the one list of what exists
  shared-styles.js           SHARED_STYLES - the shared CSS vocabulary (.chip/.box/.btn/...)
  README.md                  this file

components/                  THIS DECK'S CONTENT (repo root, alongside slides/, deck.css)
  <kebab-name>/
    index.js                 the ONLY place customElements.define('deck-<kebab-name>', ...) runs
    (partials, assets as needed)
```

## Contract

- `index.js` self-registers on import; it needn't export anything.
- The class `extends DeckElement` (imported as `@/components/deck-element.js`).
- All visual style goes in `static styles` (a CSS string, injected into Shadow DOM).
  Prepend `SHARED_STYLES` (`@/components/shared-styles.js`) for anything in the
  shared vocabulary (`.chip`, `.box`, `.btn`, `.meter`, `.note`, `.row`/`.col`,
  colour modifiers) - **import it, never copy its rules** (see
  `.claude/skills/artefact-builder/reference/component-styles.md`).
- **Consume tier-2 semantic custom properties only** - `var(--bg)` / `var(--fg)` / `var(--muted)` / `var(--line)`,
  `var(--primary*)`, `var(--space-*)`, `var(--radius-*)`, `var(--motion-*)`,
  `var(--font-*)`, plus Reveal's `var(--r-*)`. Never a tier-1 primitive, never a
  raw colour / length literal. (These are CSS custom properties, not "tokens".)
- `connectedCallback` must be idempotent - Reveal relocates `<section>` nodes.
- A component may import from `@/lib/*` (GSAP / D3 / Alpine); a slide may not.
- Register it: add one `import '../../components/<kebab-name>/index.js';` line
  in `registry.js` (from `src/components/`) **and** one `COMPONENTS` entry.

## Using one in a slide

```html
<section>
  <deck-hero-title text="Quarterly Review"></deck-hero-title>
</section>
```

## Per-component skeleton

```js
// components/hero-title/index.js
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';

class DeckHeroTitle extends DeckElement {
  static tag = 'deck-hero-title';
  static styles = `
    ${SHARED_STYLES}
    h1 {
      margin: 0;
      color: var(--fg);
      font: 700 2.5em/1.05 var(--font-heading);
    }
  `;
  render() {
    const h1 = document.createElement('h1');
    h1.textContent = this.getAttribute('text') ?? '';
    this.shadowRoot.append(h1);
  }
}
customElements.define(DeckHeroTitle.tag, DeckHeroTitle);
```

The `artefact-builder` skill generates and registers components against this
contract - see `.claude/skills/artefact-builder/`.
