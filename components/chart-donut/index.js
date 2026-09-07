// components/chart-donut/index.js
// Donut chart - share of a whole. `data` is `[{ label, value }]`.
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';
import { d3, readPalette, pxToViewBoxUnits } from '@/lib/d3.js';

const SIZE = 400;
const SERIES_VARS = ['--primary', '--secondary', '--success', '--warning', '--danger'];

const SAMPLE = [
	{ label: 'Renewals', value: 42 },
	{ label: 'New', value: 28 },
	{ label: 'Expansion', value: 18 },
	{ label: 'Churned', value: 12 },
];

class DeckChartDonut extends DeckElement {
	static tag = 'deck-chart-donut';
	static observedAttributes = ['data', 'label'];

	static styles = `
		${SHARED_STYLES}
		.root { position: relative; }
		svg { width: 100%; height: auto; max-width: 420px; display: block; margin-inline: auto; font: inherit; }
		.legend { display: flex; flex-wrap: wrap; gap: var(--space-gap); justify-content: center; margin-top: var(--space-gap); }
		text.total { fill: var(--fg); text-anchor: middle; dominant-baseline: middle; font-weight: 700; }
	`;

	get data() {
		try {
			const parsed = JSON.parse(this.getAttribute('data') || 'null');
			return Array.isArray(parsed) && parsed.length ? parsed : SAMPLE;
		} catch {
			return SAMPLE;
		}
	}

	render() {
		this._root = document.createElement('div');
		this._root.className = 'root box';
		this.shadowRoot.append(this._root);
		this._draw();

		this._ro = new ResizeObserver(() => this._draw());
		this._ro.observe(this);
	}

	disconnectedCallback() {
		this._ro?.disconnect();
	}

	attributeChangedCallback() {
		if (!this._upgraded) return;
		this._draw();
	}

	_draw() {
		const data = this.data;
		this._root.innerHTML = '';
		if (!data.length) return;

		const colors = readPalette(SERIES_VARS);
		const color = (i) => colors[i % colors.length];

		const svg = d3.select(this._root)
			.append('svg')
			.attr('viewBox', `0 0 ${SIZE} ${SIZE}`)
			.attr('role', 'img')
			.attr('aria-label', this.getAttribute('label') || 'donut chart');
		svg.append('title').text(this.getAttribute('label') || 'donut chart');

		const rPx = this.cssVarPx('--radius-control');
		const r = pxToViewBoxUnits(rPx, svg.node(), SIZE);

		const R = SIZE / 2 - 8;
		const arc = d3.arc().innerRadius(R * 0.6).outerRadius(R).cornerRadius(r).padAngle(0.015);
		const pie = d3.pie().value((d) => d.value).sort(null);

		const g = svg.append('g').attr('transform', `translate(${SIZE / 2},${SIZE / 2})`);
		g.selectAll('path.wedge').data(pie(data)).join('path')
			.attr('class', 'wedge')
			.attr('d', arc)
			.attr('fill', (d, i) => color(i));

		const total = d3.sum(data, (d) => d.value);
		g.append('text').attr('class', 'total').attr('font-size', 28).text(total);

		const legend = document.createElement('div');
		legend.className = 'legend';
		data.forEach((d, i) => {
			const chip = document.createElement('span');
			chip.className = 'chip';
			chip.style.setProperty('--c', color(i));
			chip.textContent = `${d.label} (${d.value})`;
			legend.append(chip);
		});
		this._root.append(legend);
	}
}

customElements.define(DeckChartDonut.tag, DeckChartDonut);
