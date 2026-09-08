// components/chart-sparkline/index.js
// Compact inline trend line - for a stat tile or next to a KPI number.
// `data` is a plain array of numbers: `[12, 19, 14, 23, 17]`.
import { DeckElement } from '@/components/deck-element.js';
import { d3, readPalette } from '@/lib/d3.js';

const W = 120, H = 32, PAD = 3;

const SAMPLE = [12, 19, 14, 23, 17, 26, 21];

class DeckChartSparkline extends DeckElement {
	static tag = 'deck-chart-sparkline';
	static observedAttributes = ['data', 'label'];

	static styles = `
		:host { display: inline-block; color: var(--fg); font: inherit; line-height: 0; }
		svg { width: 100%; height: auto; max-width: 160px; display: block; }
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
		const values = this.data;
		this._root.innerHTML = '';
		if (!values.length) return;

		const [primary] = readPalette(['--primary']);

		const svg = d3.select(this._root)
			.append('svg')
			.attr('viewBox', `0 0 ${W} ${H}`)
			.attr('role', 'img')
			.attr('aria-label', this.getAttribute('label') || `sparkline: ${values.join(', ')}`);

		const x = d3.scalePoint().domain(values.map((_, i) => i)).range([PAD, W - PAD]);
		const y = d3.scaleLinear().domain(d3.extent(values)).nice().range([H - PAD, PAD]);

		const line = d3.line().x((_, i) => x(i)).y((d) => y(d)).curve(d3.curveMonotoneX);
		const area = d3.area().x((_, i) => x(i)).y0(H - PAD).y1((d) => y(d)).curve(d3.curveMonotoneX);

		svg.append('path').attr('d', area(values)).attr('fill', primary).attr('fill-opacity', 0.15);
		svg.append('path').attr('d', line(values)).attr('fill', 'none')
			.attr('stroke', primary).attr('stroke-width', 2)
			.attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round');

		const last = values.length - 1;
		svg.append('circle').attr('cx', x(last)).attr('cy', y(values[last])).attr('r', 2.5).attr('fill', primary);
	}
}

customElements.define(DeckChartSparkline.tag, DeckChartSparkline);
