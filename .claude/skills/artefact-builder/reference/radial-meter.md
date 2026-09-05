# Recipe: radial meter / dial (SVG stroke animation)

For a **0-100 circular fill** - confidence score, progress, completion,
"how sure is the model". Not a bar chart, not data-bound.

Not for: a horizontal bar comparison (`confidence-bars.md`), a general
diagram (`svg-diagram.md`), data-bound marks (`d3-chart.md`).

## Pattern

Two concentric `<circle>`s, same radius: a muted **track** ring and a
coloured **fill** ring. Give the fill ring `stroke-dasharray` equal to its
own circumference, then set `stroke-dashoffset = circumference * (1 -
value/100)` - that reveals exactly `value%` of the stroke. CSS-transition
`stroke-dashoffset` and the fill animates itself; no library.

**Triggering the animation:** fragments/Auto-Animate can't reach a shadow
root (see `component-styles.md`). Set the value from JS instead - on
`connectedCallback` (animate in when the slide arrives) or from a Reveal
event listener (`Reveal.on('fragmentshown', ...)`, checking the fragment
belongs to this slide) if it should wait for a click.

## Worked example - `<deck-radial-meter value="72" label="Confidence">`

```js
// components/radial-meter/index.js
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';

const R = 80;
const CIRCUMFERENCE = 2 * Math.PI * R;

class DeckRadialMeter extends DeckElement {
	static tag = 'deck-radial-meter';
	static observedAttributes = ['value'];

	static styles = `
		${SHARED_STYLES}
		svg { width: 100%; height: auto; max-width: 320px; }
		.track { fill: none; stroke: var(--line); }
		.fill {
			fill: none; stroke: var(--c, var(--primary)); stroke-linecap: round;
			transition: stroke-dashoffset var(--motion-hero-duration) var(--motion-hero-ease);
		}
		text { fill: var(--fg); text-anchor: middle; dominant-baseline: middle; font-weight: 700; }
		.label { font-size: 14px; fill: var(--muted); font-weight: 400; }
	`;

	render() {
		const label = this.getAttribute('label') || '';
		this.shadowRoot.innerHTML = `
			<svg viewBox="0 0 200 200" role="img" aria-label="${label}">
				<circle class="track" cx="100" cy="100" r="${R}" stroke-width="16" />
				<circle class="fill" cx="100" cy="100" r="${R}" stroke-width="16"
				        stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${CIRCUMFERENCE}"
				        transform="rotate(-90 100 100)" />
				<text x="100" y="94" font-size="36">0%</text>
				${label ? `<text class="label" x="100" y="124">${label}</text>` : ''}
			</svg>
		`;
		requestAnimationFrame(() => this._setValue(Number(this.getAttribute('value')) || 0));
	}

	attributeChangedCallback() {
		if (!this._upgraded) return;
		this._setValue(Number(this.getAttribute('value')) || 0);
	}

	_setValue(pct) {
		pct = Math.max(0, Math.min(100, pct));
		this.shadowRoot.querySelector('.fill').style.strokeDashoffset = CIRCUMFERENCE * (1 - pct / 100);
		this.shadowRoot.querySelector('text').textContent = `${Math.round(pct)}%`;
	}
}

customElements.define(DeckRadialMeter.tag, DeckRadialMeter);
```

Slide: `<deck-radial-meter value="72" label="Confidence"></deck-radial-meter>`
(add a colour modifier attribute if wanted, e.g. read `this.className` for
`.success`/`.danger` the same way `.box`/`.chip` do via `--c`).

## Rules

- `viewBox`, never fixed pixel `width`/`height`.
- The animation is `stroke-dashoffset` only - never animate `stroke-dasharray`
  itself (it doesn't interpolate cleanly).
- Setting the value on `connectedCallback` via `requestAnimationFrame` (not
  synchronously in `render()`) is required - the browser needs one paint at
  `dashoffset = circumference` (fully hidden) before the transition to the
  real value will actually animate instead of snapping.
- Colour via `var(--c, var(--primary))` (reads a `.primary`/`.success`/...
  modifier from `shared-styles.js` if present on the element), never a literal.
