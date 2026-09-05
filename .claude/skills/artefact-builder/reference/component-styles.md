# Shared component style vocabulary

Every `<deck-*>` draws from **this** set - but the CSS text lives in exactly one
place: **`src/components/shared-styles.js`** (`export const SHARED_STYLES`).
**Import it. Never copy its rules into a component's own `static styles`** -
a hand-pasted copy is the one thing guaranteed to drift the next time
`shared-styles.js` (or the semantic custom properties it reads) changes, since
nothing then tells you which components still hold the old text.

```js
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';

class DeckThing extends DeckElement {
	static tag = 'deck-thing';
	static styles = `
		${SHARED_STYLES}
		/* component-specific rules only, below */
		.root { gap: var(--space-gap); }
	`;
	// ...
}
```

Do not invent a per-artefact class pile (`.w-btn`, `.tk`, `.ts-tab`,
`.bar-fill` ...) that duplicates one of these either - use the class already
below, or add a domain-specific *modifier* on top of it (`.chip.ragged`, as
`alpine-interactive.md`'s tokeniser does).

## What's in it

All rules read semantic custom properties only, so they follow a `[data-theme]`
re-skin through the shadow boundary for free.

| Class | Does |
|---|---|
| `:host` | block display, inherits `--fg` + the slide's font |
| `.btn` / `.btn.ghost` | solid / outline button |
| `.primary` `.secondary` `.success` `.danger` `.warning` | bare colour modifiers - set `--c` / `--c-fg`, read by the blocks below |
| `.chip` / `.chip:is(colour)` / `.chip.muted` | token/tag pill - outline, solid fill, or greyed |
| `.note` | muted caption text |
| `.meter` / `.meter > .fill` | progress / confidence bar |
| `.box` / `.box.border` / `.box:is(colour)` / `.box.bar` | panel - borderless, hairline, tinted fill, or left-bar callout |
| `.row` / `.col` | flex row / column, `--space-gap` |

Same class names as the slide-level utilities in `deck.css` (`.chip`, `.box`,
colour modifiers) - so a component and a plain slide read as one visual
language, even though the CSS text is necessarily separate (Shadow DOM does
not inherit class-selector rules from the light DOM, only inherited
properties and custom properties cross that boundary - that's the entire
reason this file, and `shared-styles.js`, exist).

If a component needs a genuinely new shared primitive (a shape none of these
express), add it to `shared-styles.js` directly - in the same semantic-var
style - and update the table above. Never as a one-off literal duplicated
inside a component.
