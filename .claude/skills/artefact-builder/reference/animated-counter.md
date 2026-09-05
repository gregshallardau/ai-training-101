# Recipe: animated counter (number ticking up)

For a **single number that counts up** from 0 (or a `from` value) to a target
when the slide arrives - "10,000 examples", "3 layers". GSAP-driven (`@/lib/gsap.js`)
since this is a one-shot entrance, exactly `gsap-hero.md`'s territory, just
counting a number instead of animating words.

Not for: step-by-step reveal (that's a fragment on a plain slide, no
component needed at all), a row of several counters with shared layout
(`stat-tiles.md`, which uses this same technique per-tile).

## Pattern

`gsap.to()` a plain JS object's numeric property, formatting the number into
the DOM on every tick via `onUpdate`. Replay on `slidechanged` exactly like
`gsap-hero.md`. Respect `prefers-reduced-motion` - jump straight to the final
value instead of animating.

## Worked example - `<deck-counter to="10000" label="training examples">`

```js
// components/counter/index.js
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';
import { gsap } from '@/lib/gsap.js';

class DeckCounter extends DeckElement {
	static tag = 'deck-counter';

	static styles = `
		${SHARED_STYLES}
		:host { text-align: center; }
		.value { font: 700 3em/1 var(--font-heading); color: var(--c, var(--primary)); }
		.label { color: var(--muted); margin-top: var(--space-gap); }
	`;

	render() {
		this.shadowRoot.innerHTML = `
			<div class="value">${this.getAttribute('from') || 0}</div>
			${this.getAttribute('label') ? `<div class="label">${this.getAttribute('label')}</div>` : ''}
		`;
		this._valueEl = this.shadowRoot.querySelector('.value');

		const to = Number(this.getAttribute('to')) || 0;
		const from = Number(this.getAttribute('from')) || 0;
		const format = (n) => Math.round(n).toLocaleString();

		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			this._valueEl.textContent = format(to);
			return;
		}

		const play = () => {
			const counter = { n: from };
			gsap.to(counter, { n: to, onUpdate: () => (this._valueEl.textContent = format(counter.n)) });
		};
		play();
		Reveal.on('slidechanged', (e) => {
			if (e.currentSlide.contains(this)) play();
		});
	}
}

customElements.define(DeckCounter.tag, DeckCounter);
```

Slide: `<deck-counter to="10000" label="training examples"></deck-counter>`

## Rules

- One `gsap.to()` per counter, tweening a plain object - never animate the
  DOM text content directly (GSAP can't tween a string).
- Format inside `onUpdate` (`toLocaleString()` for thousands separators, or a
  `suffix`/`prefix` attribute if you need `%`/`$`/`x`) - never a raw float.
- Duration/ease from `gsap.defaults()` (already wired to `--motion-hero-duration`
  in `initGsap()`) - never a hard-coded second count.
- Always the `prefers-reduced-motion` guard - a fast-ticking number is exactly
  the kind of motion that setting exists to suppress.
