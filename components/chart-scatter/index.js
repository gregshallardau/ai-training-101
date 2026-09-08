// components/chart-scatter/index.js
// Scatter plot - correlation between two numeric measures. `data` is
// `[{ x, y, r? }]`; `r` (optional per-point) sizes the point, else fixed radius.
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';
import { d3, readPalette } from '@/lib/d3.js';

const W = 800, H = 400, M = { top: 16, right: 16, bottom: 32, left: 40 };

const SAMPLE = [
	{ x: 3, y: 8 }, { x: 5, y: 12 }, { x: 7, y: 10 }, { x: 9, y: 18 },
	{ x: 4, y: 6 }, { x: 8, y: 15 }, { x: 6, y: 14 }, { x: 2, y: 4 },
];

class DeckChartScatter extends DeckElement {
	static tag = 'deck-chart-scatter';
	static observedAttributes = ['data', 'label'];

	static styles = `
		${SHARED_STYLES}
		.root { position: relative; }
		svg { width: 100%; height: auto; display: block; font: inherit; }
		.axis text { fill: var(--muted); font-size: 12px; }
		.axis path, .axis line { stroke: var(--line); }
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

		const svg = d3.select(this._root)
			.append('svg')
			.attr('viewBox', `0 0 ${W} ${H}`)
			.attr('role', 'img')
			.attr('aria-label', this.getAttribute('label') || 'scatter plot');
		svg.append('title').text(this.getAttribute('label') || 'scatter plot');

		const tip = document.createElement('div');
		tip.className = 'tip';
		this._root.append(tip);

		const [primary] = readPalette(['--primary']);

		const iw = W - M.left - M.right, ih = H - M.top - M.bottom;
		const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

		const x = d3.scaleLinear().domain(d3.extent(data, (d) => d.x)).nice().range([0, iw]);
		const y = d3.scaleLinear().domain(d3.extent(data, (d) => d.y)).nice().range([ih, 0]);
		const hasR = data.some((d) => d.r != null);
		const rScale = hasR ? d3.scaleSqrt().domain([0, d3.max(data, (d) => d.r || 0)]).range([2, 16]) : null;

		g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x));
		g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5));

		g.selectAll('circle').data(data).join('circle')
			.attr('cx', (d) => x(d.x)).attr('cy', (d) => y(d.y))
			.attr('r', (d) => (rScale ? rScale(d.r || 0) : 5))
			.attr('fill', primary)
			.attr('fill-opacity', 0.7)
			.on('mousemove', (e, d) => {
				const rect = this.getBoundingClientRect();
				tip.style.opacity = 1;
				tip.style.left = `${e.clientX - rect.left + 8}px`;
				tip.style.top = `${e.clientY - rect.top + 8}px`;
				tip.textContent = `(${d.x}, ${d.y})`;
			})
			.on('mouseleave', () => (tip.style.opacity = 0));
	}
}

customElements.define(DeckChartScatter.tag, DeckChartScatter);
