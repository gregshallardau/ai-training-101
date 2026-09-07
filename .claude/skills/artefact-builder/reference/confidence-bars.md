# Recipe: confidence bar row (labelled horizontal bars)

For comparing **a few labelled values as horizontal bars** - token
probabilities, model confidence across options, "how sure is it between
these 4 answers". Reuses `.meter` / `.meter > .fill` from `shared-styles.js`
directly - this is mostly layout, not new CSS.

Not for: a single 0-100 value (`radial-meter.md`), a real data-bound chart
with axes/scales (`d3-chart.md` - reach for that once it's more than ~6 bars
or needs an axis).

## Pattern

One row per label: the label, a `.meter` bar, the numeric value. Widths
animate via `.meter > .fill`'s existing `transition: width` - just set
`style.width` after a frame, same "must paint at 0 first" rule as
`radial-meter.md`.

## Worked example - `<deck-confidence-bars>`

```js
// components/confidence-bars/index.js
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';

class DeckConfidenceBars extends DeckElement {
	static tag = 'deck-confidence-bars';
	static observedAttributes = ['data'];

	static styles = `
		${SHARED_STYLES}
		.row-item { display: grid; grid-template-columns: 8em 1fr 3em; gap: var(--space-gap); align-items: center; margin-block: var(--space-gap); }
		.pct { text-align: right; color: var(--muted); font-variant-numeric: tabular-nums; }
	`;

	get items() {
		try { return JSON.parse(this.getAttribute('data') || '[]'); }
		catch { return []; }
	}

	render() {
		this.shadowRoot.innerHTML = this.items.map(({ label }) => `
			<div class="row-item">
				<span>${label}</span>
				<div class="meter"><div class="fill" style="width:0%"></div></div>
				<span class="pct">0%</span>
			</div>
		`).join('');
		requestAnimationFrame(() => this._paint());
	}

	attributeChangedCallback() {
		if (!this._upgraded) return;
		this.render();
	}

	_paint() {
		const rows = this.shadowRoot.querySelectorAll('.row-item');
		this.items.forEach(({ value }, i) => {
			rows[i].querySelector('.fill').style.width = `${value}%`;
			rows[i].querySelector('.pct').textContent = `${value}%`;
		});
	}
}

customElements.define(DeckConfidenceBars.tag, DeckConfidenceBars);
```

Slide:
```html
<deck-confidence-bars data='[{"label":"Cat","value":72},{"label":"Dog","value":21},{"label":"Fox","value":7}]'></deck-confidence-bars>
```

## Rules

- Sort the data yourself before passing it in (highest first reads best) -
  the component doesn't re-sort, so slide markup stays the source of truth
  for order.
- Widths animate through `.meter > .fill`'s existing `transition` - don't add
  a second transition property here.
- Grid columns (`8em 1fr 3em`) are a layout choice for THIS component, not a
  new shared primitive - leave them local, don't promote to `shared-styles.js`.
