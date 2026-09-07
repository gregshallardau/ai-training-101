# Recipe: timeline / process stepper ("you are here")

For a **horizontal pipeline or evolution walkthrough** - "here's how X
evolved", "where we are in the process" - a line of stage labels with a
moving position indicator. Not a click-through demo of its own (that's
`alpine-interactive.md`); this is driven by an `active` attribute set from
outside, typically from a Reveal fragment/click on the slide.

Not for: a generic interactive stepper/quiz with its own internal state
(`alpine-interactive.md`), a vertical build-up of concepts (a Reveal vertical
stack, no component needed - see `docs/framework-conventions.md` section 8).

## Pattern

Flex row of step dots + labels, `justify-content: space-between`. A track
line behind them, and a **fill** line on top whose `width` is
`active / (steps.length - 1) * 100%` - the same "set width after a frame,
let the existing transition animate it" technique as `confidence-bars.md`.
The active dot gets a bigger/coloured treatment; passed dots stay coloured
but smaller, upcoming ones stay muted.

Advance it from the slide by changing the `active` attribute - e.g. a
plain-slide fragment whose `data-fragment-index` you listen for:
`Reveal.on('fragmentshown', (e) => { if (matches) el.setAttribute('active', n); })`.

## Worked example - `<deck-stepper steps='[...]' active="1">`

```js
// components/stepper/index.js
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';

class DeckStepper extends DeckElement {
	static tag = 'deck-stepper';
	static observedAttributes = ['active'];

	static styles = `
		${SHARED_STYLES}
		.track { position: relative; height: 4px; background: var(--line); border-radius: var(--radius-round); margin-block: var(--space-block); }
		.fill {
			position: absolute; inset: 0; width: 0%; background: var(--primary);
			border-radius: var(--radius-round);
			transition: width var(--motion-hero-duration) var(--motion-hero-ease);
		}
		.dots { display: flex; justify-content: space-between; margin-top: calc(-1 * var(--space-block) - 6px); }
		.dot { width: 12px; height: 12px; border-radius: 50%; background: var(--line); transition: background var(--motion-ui-duration) var(--motion-ui-ease); }
		.dot.done, .dot.active { background: var(--primary); }
		.dot.active { outline: 3px solid color-mix(in srgb, var(--primary) 30%, transparent); }
		.labels { display: flex; justify-content: space-between; margin-top: var(--space-gap); }
		.labels span { color: var(--muted); font-size: 0.85em; }
		.labels span.active { color: var(--fg); font-weight: 600; }
	`;

	get steps() {
		try { return JSON.parse(this.getAttribute('steps') || '[]'); }
		catch { return []; }
	}

	render() {
		const steps = this.steps;
		this.shadowRoot.innerHTML = `
			<div class="track"><div class="fill"></div></div>
			<div class="dots">${steps.map(() => `<div class="dot"></div>`).join('')}</div>
			<div class="labels">${steps.map((s) => `<span>${s}</span>`).join('')}</div>
		`;
		requestAnimationFrame(() => this._paint());
	}

	attributeChangedCallback() {
		if (!this._upgraded) return;
		this._paint();
	}

	_paint() {
		const steps = this.steps;
		const active = Math.max(0, Math.min(steps.length - 1, Number(this.getAttribute('active')) || 0));
		this.shadowRoot.querySelector('.fill').style.width = `${(active / (steps.length - 1)) * 100}%`;
		this.shadowRoot.querySelectorAll('.dot').forEach((el, i) => {
			el.classList.toggle('done', i < active);
			el.classList.toggle('active', i === active);
		});
		this.shadowRoot.querySelectorAll('.labels span').forEach((el, i) => {
			el.classList.toggle('active', i === active);
		});
	}
}

customElements.define(DeckStepper.tag, DeckStepper);
```

Slide: `<deck-stepper steps='["Data","Train","Eval","Deploy"]' active="1"></deck-stepper>`

## Rules

- `active` is the only externally-driven state - the component never
  advances itself. If you want click-to-advance with no outside wiring,
  that's `alpine-interactive.md`'s stepper pattern instead, not this one.
- Fill-line width transition needs the same "paint at 0 first" frame delay as
  `radial-meter.md` / `confidence-bars.md` - don't set it synchronously in
  `render()`.
- 3-6 steps. More than that, the labels won't fit a 1920-wide slide at
  readable size - split into two rows of `deck-stepper` or reconsider the
  content.
