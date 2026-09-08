// components/chart-bar-grouped/index.js
// Grouped bar chart - compare multiple series across categories. `data` is an
// array of `{ label, ...seriesValues }`; series keys are auto-detected (every
// key but `label`) unless a `keys` attribute pins the order/subset.
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';
import { d3, readPalette, roundedRectPath, pxToViewBoxUnits } from '@/lib/d3.js';

const W = 800, H = 400, M = { top: 16, right: 16, bottom: 32, left: 40 };
const SERIES_VARS = ['--primary', '--secondary', '--success', '--warning', '--danger'];

const SAMPLE = [
	{ label: 'Q1', renewals: 12, new: 8 },
	{ label: 'Q2', renewals: 19, new: 11 },
	{ label: 'Q3', renewals: 14, new: 15 },
	{ label: 'Q4', renewals: 23, new: 9 },
];

class DeckChartBarGrouped extends DeckElement {
	static tag = 'deck-chart-bar-grouped';
	static observedAttributes = ['data', 'keys', 'label'];

	static styles = `
		${SHARED_STYLES}
		.root { position: relative; }
		svg { width: 100%; height: auto; display: block; font: inherit; }
		.axis text { fill: var(--muted); font-size: 12px; }
		.axis path, .axis line { stroke: var(--line); }
		.legend { display: flex; flex-wrap: wrap; gap: var(--space-gap); margin-bottom: var(--space-gap); }
		.tip {
			position: absolute; pointer-events: none; opacity: 0;
			padding: var(--space-gap) var(--space-inline);
			border: 1px solid var(--line); border-radius: var(--radius-control);
			background: var(--bg); color: var(--fg); font-size: 0.8em;
			transition: opacity var(--motion-ui-duration) var(--motion-ui-ease);
		}
	`;

	get data() {
		try {
			const parsed = JSON.parse(this.getAttribute('data') || 'null');
			return Array.isArray(parsed) && parsed.length ? parsed : SAMPLE;
		} catch {
			return SAMPLE;
		}
	}

	get keys() {
		const attr = this.getAttribute('keys');
		if (attr) return attr.split(',').map((k) => k.trim()).filter(Boolean);
		const data = this.data;
		return data.length ? Object.keys(data[0]).filter((k) => k !== 'label') : [];
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
		const keys = this.keys;
		this._root.innerHTML = '';
		if (!data.length || !keys.length) return;

		const colors = readPalette(SERIES_VARS);
		const color = (i) => colors[i % colors.length];

		const legend = document.createElement('div');
		legend.className = 'legend';
		keys.forEach((k, i) => {
			const chip = document.createElement('span');
			chip.className = 'chip';
			chip.style.setProperty('--c', color(i));
			chip.textContent = k;
			legend.append(chip);
		});
		this._root.append(legend);

		const svg = d3.select(this._root)
			.append('svg')
			.attr('viewBox', `0 0 ${W} ${H}`)
			.attr('role', 'img')
			.attr('aria-label', this.getAttribute('label') || 'grouped bar chart');
		svg.append('title').text(this.getAttribute('label') || 'grouped bar chart');

		const tip = document.createElement('div');
		tip.className = 'tip';
		this._root.append(tip);

		const rPx = this.cssVarPx('--radius-control');
		const r = pxToViewBoxUnits(rPx, svg.node(), W);

		const iw = W - M.left - M.right, ih = H - M.top - M.bottom;
		const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

		const x0 = d3.scaleBand().domain(data.map((d) => d.label)).range([0, iw]).padding(0.2);
		const x1 = d3.scaleBand().domain(keys).range([0, x0.bandwidth()]).padding(0.1);
		const y = d3.scaleLinear()
			.domain([0, d3.max(data, (d) => d3.max(keys, (k) => d[k] || 0))])
			.nice().range([ih, 0]);

		g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x0));
		g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5));

		const groups = g.selectAll('g.group').data(data).join('g')
			.attr('class', 'group')
			.attr('transform', (d) => `translate(${x0(d.label)},0)`);

		groups.selectAll('path.bar').data((d) => keys.map((k, i) => ({ key: k, value: d[k] || 0, color: color(i), label: d.label })))
			.join('path')
			.attr('class', 'bar')
			.attr('d', (d) => roundedRectPath(x1(d.key), y(d.value), x1.bandwidth(), ih - y(d.value), r))
			.attr('fill', (d) => d.color)
			.on('mousemove', (e, d) => {
				const rect = this.getBoundingClientRect();
				tip.style.opacity = 1;
				tip.style.left = `${e.clientX - rect.left + 8}px`;
				tip.style.top = `${e.clientY - rect.top + 8}px`;
				tip.textContent = `${d.label} · ${d.key}: ${d.value}`;
			})
			.on('mouseleave', () => (tip.style.opacity = 0));
	}
}

customElements.define(DeckChartBarGrouped.tag, DeckChartBarGrouped);
