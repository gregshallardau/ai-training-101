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
| `data-topic="<name>"` | identity/category tint (commented out by default) - mirrors whatever `--topic-<name>` pairs the deck's own `deck.css` defines; uncomment the matching line here to match |
| `.chip` / `.chip:is(colour)` / `.chip.muted` | token/tag pill - outline, solid fill, or greyed. Ambient hover lift, no modifier needed |
| `.token-row` | a wrapping row of `.chip` pills (tokeniser, attention-flow, any per-item chip stream) - component-only, no `deck.css` counterpart |
| `.note` | muted caption text |
| `.text-primary` / `.text-muted` / `.text-center` | brand-colour / muted text, centre-align |
| `.meter` / `.meter > .fill` | progress / confidence bar |
| `.box` / `.box.border` / `.box:is(colour)` / `.box.bar` | panel - borderless, hairline, tinted fill, or left-bar callout. Ambient hover lift, no modifier needed |
| `.box.interactive` | this box is clickable - cursor: pointer + a stronger hover |
| `.box.selected` | a persistent "picked" state, set by JS, distinct from hover |
| `.box.compact` | tighter padding/margin - dense rows (list items, doc cards) |
| `.row` / `.col` | flex row / column that wraps, `--space-gap` |
| `.flex-cols` / `.flex-rows` | fixed N **equal-width** panels, no wrap, `--space-block` gap - different from `.row`, matches `deck.css` |
| `.columns` / `.columns-3` | newspaper columns (a `<dl>`/`<ul>`/wall of `<p>`s) |
| `.list-compact` | drop the gap between `<li>`s inside it |

Same class names as the slide-level utilities in `deck.css` (`.chip`, `.box`,
colour modifiers) - so a component and a plain slide read as one visual
language, even though the CSS text is necessarily separate (Shadow DOM does
not inherit class-selector rules from the light DOM, only inherited
properties and custom properties cross that boundary - that's the entire
reason this file, and `shared-styles.js`, exist). `deck.css` and
`shared-styles.js` are kept in sync by matching `/* SHARED-VOCAB:start <name>
*/` / `/* SHARED-VOCAB:end */` sentinel comments around the `colour-modifiers`,
`box`, and `chip` blocks in both files - `npm run check:vocab` diffs them; see
Read step 5 in `SKILL.md`.

If a component needs a genuinely new shared primitive (a shape none of these
express), add it to `shared-styles.js` directly - in the same semantic-var
style - and update the table above. Never as a one-off literal duplicated
inside a component.

## What does NOT cross the boundary, and can't be added here

Reveal's own built-in classes - `class="fragment"` (and its variants),
`r-stack`, `r-hstack`, `r-vstack`, `r-fit-text`, `r-stretch` - are styled by
Reveal as `.reveal .fragment`, `.reveal .r-stack`, etc. in **Reveal's own
stylesheet**, not `deck.css`. Same shadow boundary, but there is no
`SHARED_STYLES` fix for it: copying those rules in means reimplementing
Reveal's fragment-visibility and grid-stack logic yourself, not porting a
utility class. Putting `class="fragment"` or `class="r-stack"` on an element
inside a component's shadow-rendered markup will silently do nothing.

This is why every existing recipe drives step-by-step reveals and stacking
from inside the component instead: Alpine `x-show`/`x-transition`
(`alpine-interactive.md`) or a JS listener on Reveal's own events
(`gsap-hero.md`'s `slidechanged`). Do the same for a new component - never
reach for a bare `fragment`/`r-stack` class inside `render()`'s markup.
