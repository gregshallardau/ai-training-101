# Recipe: stat tile row (KPI strip)

For a **row of big numbers with labels** - "10,000 examples · 3 layers · 12
attention heads" - the classic opener/closer slide. Same counting technique
as `animated-counter.md`, staggered across several tiles in one layout.

Not for: a single standalone counter (`animated-counter.md` alone), a chart
of many data points (`d3-chart.md`).

## Pattern

`.flex-cols` (from `shared-styles.js`) for the equal-width row, one `.box`
per tile, one GSAP-tweened number per tile, `stagger` so they count up in a
short cascade rather than all at once.

## Worked example - `<deck-stat-tiles>`

```json
[
  { "to": 10000, "label": "training examples" },
  { "to": 3, "label": "layers" },
  { "to": 12, "label": "attention heads" }
]
```

```js
// components/stat-tiles/index.js
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';
import { gsap } from '@/lib/gsap.js';

class DeckStatTiles extends DeckElement {
	static tag = 'deck-stat-tiles';

	static styles = `
		${SHARED_STYLES}
		.tile { text-align: center; }
		.value { font: 700 2.5em/1 var(--font-heading); color: var(--primary); }
		.label { color: var(--muted); margin-top: var(--space-gap); }
	`;

	get stats() {
		try { return JSON.parse(this.getAttribute('data') || '[]'); }
		catch { return []; }
	}

	render() {
		const wrap = document.createElement('div');
		wrap.className = 'flex-cols';
		wrap.innerHTML = this.stats.map(({ label }) => `
			<div class="tile box">
				<div class="value">0</div>
				<div class="label">${label}</div>
			</div>
		`).join('');
		this.shadowRoot.append(wrap);

		const valueEls = wrap.querySelectorAll('.value');
		const format = (n) => Math.round(n).toLocaleString();
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

		const play = () => {
			this.stats.forEach(({ to }, i) => {
				if (reduced) { valueEls[i].textContent = format(to); return; }
				const counter = { n: 0 };
				gsap.to(counter, {
					n: to, delay: i * 0.15,
					onUpdate: () => (valueEls[i].textContent = format(counter.n)),
				});
			});
		};
		play();
		Reveal.on('slidechanged', (e) => {
			if (e.currentSlide.contains(this)) play();
		});
	}
}

customElements.define(DeckStatTiles.tag, DeckStatTiles);
```

Slide:
```html
<deck-stat-tiles data='[{"to":10000,"label":"training examples"},{"to":3,"label":"layers"},{"to":12,"label":"attention heads"}]'></deck-stat-tiles>
```

## Rules

- Same counter rules as `animated-counter.md` (format in `onUpdate`, GSAP
  defaults for timing, `prefers-reduced-motion` guard) - just staggered with
  a per-tile `delay`.
- `.flex-cols` gives equal-width tiles automatically - don't hand-roll a grid.
- 2-4 tiles. More than that, it's a `d3-chart.md` bar chart, not a stat strip.
