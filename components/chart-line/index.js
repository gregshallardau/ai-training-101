// components/chart-line/index.js
// Line chart - trend over an ordered sequence. `data` is either a single
// series (`[{ x, y }]`) or multiple (`[{ name, values: [{ x, y }] }]`).
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';
import { d3, readPalette } from '@/lib/d3.js';

const W = 800, H = 400, M = { top: 16, right: 16, bottom: 32, left: 40 };
const SERIES_VARS = ['--primary', '--secondary', '--success', '--warning', '--danger'];

const SAMPLE = [
	{ x: 'Jan', y: 12 }, { x: 'Feb', y: 19 }, { x: 'Mar', y: 14 },
	{ x: 'Apr', y: 23 }, { x: 'May', y: 17 }, { x: 'Jun', y: 26 },
];

class DeckChartLine extends DeckElement {
	static tag = 'deck-chart-line';
	static observedAttributes = ['data', 'label'];

	static styles = `
		${SHARED_STYLES}
		.root { position: relative; }
		svg { width: 100%; height: auto; display: block; font: inherit; }
		.axis text { fill: var(--muted); font-size: 12px; }
		.axis path, .axis line { stroke: var(--line); }
		.legend { display: flex; flex-wrap: wrap; gap: var(--space-gap); margin-bottom: var(--space-gap); }
	`;

	get series() {
		try {
			const parsed = JSON.parse(this.getAttribute('data') || 'null');
			if (!Array.isArray(parsed) || !parsed.length) return [{ name: null, values: SAMPLE }];
			return parsed[0].values ? parsed : [{ name: null, values: parsed }];
		} catch {
			return [{ name: null, values: SAMPLE }];
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
		const series = this.series;
		this._root.innerHTML = '';
		if (!series.length) return;

		const colors = readPalette(SERIES_VARS);
		const color = (i) => colors[i % colors.length];
		const named = series.some((s) => s.name);

		if (named) {
			const legend = document.createElement('div');
			legend.className = 'legend';
			series.forEach((s, i) => {
				const chip = document.createElement('span');
				chip.className = 'chip';
				chip.style.setProperty('--c', color(i));
				chip.textContent = s.name;
				legend.append(chip);
			});
			this._root.append(legend);
		}

		const svg = d3.select(this._root)
			.append('svg')
			.attr('viewBox', `0 0 ${W} ${H}`)
			.attr('role', 'img')
			.attr('aria-label', this.getAttribute('label') || 'line chart');
		svg.append('title').text(this.getAttribute('label') || 'line chart');

		const iw = W - M.left - M.right, ih = H - M.top - M.bottom;
		const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

		const allX = [...new Set(series.flatMap((s) => s.values.map((d) => d.x)))];
		const x = d3.scalePoint().domain(allX).range([0, iw]).padding(0.1);
		const y = d3.scaleLinear()
			.domain([0, d3.max(series, (s) => d3.max(s.values, (d) => d.y))])
			.nice().range([ih, 0]);

		g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x));
		g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5));

		const line = d3.line().x((d) => x(d.x)).y((d) => y(d.y)).curve(d3.curveMonotoneX);

		g.selectAll('path.line').data(series).join('path')
			.attr('class', 'line')
			.attr('fill', 'none')
			.attr('stroke', (d, i) => color(i))
			.attr('stroke-width', 2.5)
			.attr('stroke-linecap', 'round')
			.attr('stroke-linejoin', 'round')
			.attr('d', (d) => line(d.values));

		g.selectAll('g.pts').data(series).join('g')
			.attr('class', 'pts')
			.attr('fill', (d, i) => color(i))
			.each(function (s) {
				d3.select(this).selectAll('circle').data(s.values).join('circle')
					.attr('cx', (d) => x(d.x)).attr('cy', (d) => y(d.y)).attr('r', 3);
			});
	}
}

customElements.define(DeckChartLine.tag, DeckChartLine);
