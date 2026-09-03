# Recipe: interactive artefact (Alpine)

For **staged / reactive** widgets - a click-through stepper, a quiz, a
"pour in the training pile" demo, a tokeniser, a confidence meter, a
preference picker. Anything where slide state changes in response to clicks.

Not for: a static chart (`d3-chart.md`), a boxes-and-arrows diagram
(`svg-diagram.md`), a one-shot entrance animation (`gsap-hero.md`).

## The shadow-DOM Alpine pattern

Alpine's global scan (`Alpine.start()` in `main.js`) does **not** enter shadow
roots, and it runs after `deck.initialize()`. So a component:

1. renders its `x-data` markup into `this.shadowRoot` as normal;
2. then calls `Alpine.initTree(this.shadowRoot)` once Alpine exists.

```js
// waits for window.Alpine (set by initAlpine() in main.js), then runs fn once
function whenAlpine(fn) {
	if (window.Alpine) return fn(window.Alpine);
	const t = setInterval(() => {
		if (window.Alpine) { clearInterval(t); fn(window.Alpine); }
	}, 30);
}
```

Stick to directives that work cleanly in a shadow subtree: `x-data`, `x-show`,
`x-text`, `x-html`, `x-for`, `x-model`, `@click` / `@input`, `x-transition`,
`:class`. Avoid `x-teleport` and `$root`/`$refs` reaching outside the component.

Cross-slide state (a poll answer shown again later) goes through
`Alpine.store('deck', ...)` - it is global, so it reads and writes fine from
inside the shadow tree. Add the store key in `src/lib/alpine.js`.

## Styling

Pull `.btn` / `.btn.secondary` / `.chip` / `.chip.ragged` / `.note` / `.meter`
from `component-styles.md` into `static styles`. Do not re-declare them. A
stagger-in effect is a keyframe with a per-index `animation-delay`, or
`x-transition` on the `x-for` items.

## Worked example - `<deck-tokeniser>`

Rebuilds the llm-training tokeniser demo as one component: a plain sentence
tokenises into neat chips; a specialist name shatters into `ragged` chips; a
note explains each stage; a button steps through.

```js
// src/components/tokeniser/index.js
import { DeckElement } from '../deck-element.js';

const STAGES = [
	{
		tokens: ['The', 'client', 'renewal', 'is', 'due', 'in', 'May'],
		ragged: false,
		note: 'Common words map to neat single pieces. Now a specialist product name:',
		cta: 'Tokenise a specialty term →',
	},
	{
		tokens: ['Allied', 'Health', 'Guard', 'PI', '-', 'Pro', '24', 'ii', 'Scheme'],
		ragged: true,
		note: "One product name, nine ragged fragments - it barely saw this string, so it improvises.",
		cta: 'Done',
	},
];

function whenAlpine(fn) {
	if (window.Alpine) return fn(window.Alpine);
	const t = setInterval(() => {
		if (window.Alpine) { clearInterval(t); fn(window.Alpine); }
	}, 30);
}

class DeckTokeniser extends DeckElement {
	static tag = 'deck-tokeniser';

	static styles = `
		:host { display: block; color: var(--surface-fg); font: inherit; }
		.line { display: flex; flex-wrap: wrap; gap: var(--space-gap); margin-block: var(--space-block); min-height: 1.8em; }
		.chip {
			padding: 0.15em 0.5em; border-radius: var(--radius-control);
			border: 1px solid var(--accent);
			background: color-mix(in srgb, var(--accent) 14%, transparent);
			animation: pop var(--motion-ui-duration) var(--motion-ui-ease) both;
		}
		.chip.ragged {
			border-color: var(--surface-line);
			background: color-mix(in srgb, var(--surface-fg-muted) 12%, transparent);
		}
		@keyframes pop { from { opacity: 0; transform: translateY(0.3em); } }
		.row { display: flex; gap: var(--space-gap); }
		.btn {
			font: inherit; padding: var(--space-gap) var(--space-inline); border: 0;
			border-radius: var(--radius-control);
			background: var(--accent); color: var(--accent-fg); cursor: pointer;
		}
		.btn:disabled { opacity: 0.4; cursor: default; }
		.btn.secondary { background: transparent; color: var(--accent); border: 1px solid var(--surface-line); }
		.note { color: var(--surface-fg-muted); margin-top: var(--space-block); }
	`;

	render() {
		const wrap = document.createElement('div');
		wrap.setAttribute('x-data', 'tokeniser()');
		wrap.innerHTML = `
			<template x-for="(chip, i) in shown" :key="i">
				<span class="line" style="display:contents">
					<template x-for="(tok, j) in chip.tokens" :key="j">
						<span class="chip" :class="{ ragged: chip.ragged }"
						      :style="'animation-delay:' + (j * 0.1) + 's'" x-text="tok"></span>
					</template>
				</span>
			</template>
			<div class="row">
				<button class="btn" @click="next()" :disabled="done" x-text="cta"></button>
				<button class="btn secondary" @click="reset()">Reset</button>
			</div>
			<p class="note" x-text="note"></p>
		`;
		this.shadowRoot.append(wrap);

		whenAlpine((Alpine) => {
			if (!Alpine.data('tokeniser')) {
				Alpine.data('tokeniser', () => ({
					stage: 0,
					get shown() { return STAGES.slice(0, this.stage + 1); },
					get done() { return this.stage >= STAGES.length - 1; },
					get note() { return this.stage === 0
						? 'A plain insurance sentence, chopped into tokens.'
						: STAGES[this.stage].note; },
					get cta() { return STAGES[Math.min(this.stage, STAGES.length - 1)].cta; },
					next() { if (!this.done) this.stage++; },
					reset() { this.stage = 0; },
				}));
			}
			Alpine.initTree(this.shadowRoot);
		});
	}
}

customElements.define(DeckTokeniser.tag, DeckTokeniser);
```

Register per `registry-edit.md`. On a slide: `<deck-tokeniser></deck-tokeniser>`.

## Adapting to other demos

- **stepper / "reveal one at a time"**: `x-data="{ i: 0 }"`, `x-show="i >= n"` per
  item, `@click="i++"`.
- **quiz / preference picker**: `x-data="{ picked: null }"`, `@click="picked = 'a'"`,
  `:class="{ correct: picked === answer }"`.
- **confidence / progress meter**: the `.meter > .fill` block from
  `component-styles.md`, `:style="'width:' + pct + '%'"`.
- **cross-slide result**: write to `Alpine.store('deck').pollAnswer` here, read it
  from another component later.
