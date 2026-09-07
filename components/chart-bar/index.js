// components/chart-bar/index.js
// Vertical bar chart - categorical comparison. Drop in with a `data` attribute
// to personalise; renders sample data if omitted.
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';
import { d3, readPalette, roundedRectPath, pxToViewBoxUnits } from '@/lib/d3.js';

const W = 800, H = 400, M = { top: 16, right: 16, bottom: 32, left: 40 };

const SAMPLE = [
	{ label: 'Jan', value: 12 },
	{ label: 'Feb', value: 19 },
	{ label: 'Mar', value: 14 },
	{ label: 'Apr', value: 23 },
	{ label: 'May', value: 17 },
];

class DeckChartBar extends DeckElement {
	static tag = 'deck-chart-bar';
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
			.attr('aria-label', this.getAttribute('label') || 'bar chart');
		svg.append('title').text(this.getAttribute('label') || 'bar chart');

		const tip = document.createElement('div');
		tip.className = 'tip';
		this._root.append(tip);

		const [primary] = readPalette(['--primary']);
		const rPx = this.cssVarPx('--radius-control');
		const r = pxToViewBoxUnits(rPx, svg.node(), W);

		const iw = W - M.left - M.right, ih = H - M.top - M.bottom;
		const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

		const x = d3.scaleBand().domain(data.map((d) => d.label)).range([0, iw]).padding(0.15);
		const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.value)]).nice().range([ih, 0]);

		g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x));
		g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5));

		g.selectAll('path.bar').data(data).join('path')
			.attr('class', 'bar')
			.attr('d', (d) => roundedRectPath(x(d.label), y(d.value), x.bandwidth(), ih - y(d.value), r))
			.attr('fill', primary)
			.on('mousemove', (e, d) => {
				const rect = this.getBoundingClientRect();
				tip.style.opacity = 1;
				tip.style.left = `${e.clientX - rect.left + 8}px`;
				tip.style.top = `${e.clientY - rect.top + 8}px`;
				tip.textContent = `${d.label}: ${d.value}`;
			})
			.on('mouseleave', () => (tip.style.opacity = 0));
	}
}

customElements.define(DeckChartBar.tag, DeckChartBar);
