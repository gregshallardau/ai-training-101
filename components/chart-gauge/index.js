// components/chart-gauge/index.js
// Radial gauge - a single KPI against a max (defaults 0-100). Stroke-dasharray
// dial, same technique as radial-meter.md. Colour via a `.primary`/`.success`/
// etc. modifier class on the host (reads `--c`, falls back to `--primary`).
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';

const R = 80;
const CIRCUMFERENCE = 2 * Math.PI * R;

class DeckChartGauge extends DeckElement {
	static tag = 'deck-chart-gauge';
	static observedAttributes = ['value', 'max', 'label'];

	static styles = `
		${SHARED_STYLES}
		svg { width: 100%; height: auto; max-width: 320px; display: block; margin-inline: auto; }
		.track { fill: none; stroke: var(--line); }
		.fill {
			fill: none; stroke: var(--c, var(--primary)); stroke-linecap: round;
			transition: stroke-dashoffset var(--motion-hero-duration) var(--motion-hero-ease);
		}
		text { fill: var(--fg); text-anchor: middle; dominant-baseline: middle; font-weight: 700; }
		.label { font-size: 14px; fill: var(--muted); font-weight: 400; }
	`;

	get max() {
		return Number(this.getAttribute('max')) || 100;
	}

	render() {
		const label = this.getAttribute('label') || '';
		this.shadowRoot.innerHTML = `
			<svg viewBox="0 0 200 200" role="img" aria-label="${label}">
				<circle class="track" cx="100" cy="100" r="${R}" stroke-width="16" />
				<circle class="fill" cx="100" cy="100" r="${R}" stroke-width="16"
				        stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${CIRCUMFERENCE}"
				        transform="rotate(-90 100 100)" />
				<text x="100" y="94" font-size="32"></text>
				${label ? `<text class="label" x="100" y="124">${label}</text>` : ''}
			</svg>
		`;
		requestAnimationFrame(() => this._setValue(Number(this.getAttribute('value')) || 0));
	}

	attributeChangedCallback() {
		if (!this._upgraded) return;
		this._setValue(Number(this.getAttribute('value')) || 0);
	}

	_setValue(value) {
		const max = this.max;
		const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
		this.shadowRoot.querySelector('.fill').style.strokeDashoffset = CIRCUMFERENCE * (1 - pct);
		this.shadowRoot.querySelector('text').textContent = max === 100 ? `${Math.round(value)}%` : `${value}`;
	}
}

customElements.define(DeckChartGauge.tag, DeckChartGauge);
