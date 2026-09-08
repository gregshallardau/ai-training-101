// components/chart-heatmap/index.js
// Heatmap - matrix/grid intensity. `data` is long-form `[{ row, col, value }]`;
// `rows`/`cols` attributes pin category order, else derived in first-seen order.
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';
import { d3, readPalette, roundedRectPath, pxToViewBoxUnits } from '@/lib/d3.js';

const W = 800, H = 400, M = { top: 16, right: 16, bottom: 48, left: 80 };

const SAMPLE = (() => {
	const rows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
	const cols = ['9am', '11am', '1pm', '3pm', '5pm'];
	const cells = [];
	rows.forEach((row, i) => cols.forEach((col, j) => {
		cells.push({ row, col, value: Math.round(((i + 1) * (j + 1) * 37) % 100) });
	}));
	return cells;
})();

class DeckChartHeatmap extends DeckElement {
	static tag = 'deck-chart-heatmap';
	static observedAttributes = ['data', 'rows', 'cols', 'label'];

	static styles = `
		${SHARED_STYLES}
		.root { position: relative; }
		svg { width: 100%; height: auto; display: block; font: inherit; }
		.axis text { fill: var(--muted); font-size: 12px; }
		.axis path, .axis line { stroke: transparent; }
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

	_categories(attr, data, key) {
		const pinned = this.getAttribute(attr);
		if (pinned) return pinned.split(',').map((s) => s.trim()).filter(Boolean);
		return [...new Set(data.map((d) => d[key]))];
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

		const rows = this._categories('rows', data, 'row');
		const cols = this._categories('cols', data, 'col');

		const svg = d3.select(this._root)
			.append('svg')
			.attr('viewBox', `0 0 ${W} ${H}`)
			.attr('role', 'img')
			.attr('aria-label', this.getAttribute('label') || 'heatmap');
		svg.append('title').text(this.getAttribute('label') || 'heatmap');

		const tip = document.createElement('div');
		tip.className = 'tip';
		this._root.append(tip);

		const [bg, primary] = readPalette(['--bg', '--primary']);
		const rPx = this.cssVarPx('--radius-control');
		const r = pxToViewBoxUnits(rPx, svg.node(), W);

		const iw = W - M.left - M.right, ih = H - M.top - M.bottom;
		const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

		const x = d3.scaleBand().domain(cols).range([0, iw]).padding(0.08);
		const y = d3.scaleBand().domain(rows).range([0, ih]).padding(0.08);
		const color = d3.scaleLinear().domain(d3.extent(data, (d) => d.value)).range([bg, primary]);

		g.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickSize(0));
		g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).tickSize(0));

		g.selectAll('path.cell').data(data).join('path')
			.attr('class', 'cell')
			.attr('d', (d) => roundedRectPath(x(d.col), y(d.row), x.bandwidth(), y.bandwidth(), r, { tl: true, tr: true, bl: true, br: true }))
			.attr('fill', (d) => color(d.value))
			.on('mousemove', (e, d) => {
				const rect = this.getBoundingClientRect();
				tip.style.opacity = 1;
				tip.style.left = `${e.clientX - rect.left + 8}px`;
				tip.style.top = `${e.clientY - rect.top + 8}px`;
				tip.textContent = `${d.row} · ${d.col}: ${d.value}`;
			})
			.on('mouseleave', () => (tip.style.opacity = 0));
	}
}

customElements.define(DeckChartHeatmap.tag, DeckChartHeatmap);
