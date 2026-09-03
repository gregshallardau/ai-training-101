# Canonical Component Library

## The rule

**One canonical definition per component.** Slides reference a component by its
`<deck-*>` tag and pass data via attributes / slots. Slides **never** redefine a
component's markup, styling, or behaviour, and **never** carry a per-slide
`<style>` for it. If you're tempted to style something on a slide, that something
should be a component.

## Anatomy

```
src/components/
  deck-element.js          base class (DeckElement)
  registry.js              the manifest + barrel - the one list of what exists
  <kebab-name>/
    index.js               the ONLY place customElements.define('deck-<kebab-name>', ...) runs
    (partials, assets as needed)
```

## Contract

- `index.js` self-registers on import; it needn't export anything.
- The class `extends DeckElement`.
- All visual style goes in `static styles` (a CSS string, injected into Shadow DOM).
- **Consume tier-2 semantic custom properties only** - `var(--bg)` / `var(--fg)` / `var(--muted)` / `var(--line)`,
  `var(--primary*)`, `var(--space-*)`, `var(--radius-*)`, `var(--motion-*)`,
  `var(--font-*)`, plus Reveal's `var(--r-*)`. Never a tier-1 primitive, never a
  raw colour / length literal. (These are CSS custom properties, not "tokens".)
- `connectedCallback` must be idempotent - Reveal relocates `<section>` nodes.
- A component may import from `@/lib/*` (GSAP / D3 / Alpine); a slide may not.
- Register it: add one `import './<kebab-name>/index.js';` line **and** one
  `COMPONENTS` entry in `registry.js`.

## Using one in a slide

```html
<section>
  <deck-hero-title text="Quarterly Review"></deck-hero-title>
</section>
```

## Per-component skeleton

```js
import { DeckElement } from '../deck-element.js';

class DeckHeroTitle extends DeckElement {
  static tag = 'deck-hero-title';
  static styles = `
    :host { display: block; }
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
