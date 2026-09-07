// components/chart-pack/index.js
// Circle-packing / hierarchy - part-to-whole nesting ("topics in space").
// Static variant of d3-circle-pack.md's zoomable example (no click/zoom, all
// top-level labels shown) - a drop-in chart, not an interactive map.
import { DeckElement } from '@/components/deck-element.js';
import { d3, readPalette } from '@/lib/d3.js';

const SIZE = 700;

const SAMPLE = {
	name: 'root', children: [
		{ name: 'context', children: [
			{ name: 'prompt', value: 8 },
			{ name: 'system message', value: 5 },
			{ name: 'retrieved docs', value: 6 },
		]},
		{ name: 'training', children: [
			{ name: 'pretraining', value: 9 },
			{ name: 'fine-tuning', value: 4 },
		]},
		{ name: 'inference', children: [
			{ name: 'decoding', value: 6 },
			{ name: 'sampling', value: 3 },
		]},
	],
};

class DeckChartPack extends DeckElement {
	static tag = 'deck-chart-pack';
	static observedAttributes = ['data', 'label'];

	static styles = `
		:host { display: block; }
		svg { width: 100%; height: auto; display: block; font: inherit; }
		text { fill: var(--fg); text-anchor: middle; }
		text.leaf { font-size: 11px; }
		circle { stroke: var(--line); }
	`;

	get data() {
		try {
			return JSON.parse(this.getAttribute('data') || 'null') || SAMPLE;
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
		this._root.innerHTML = '';
		const [bg, primary, strong] = readPalette(['--bg', '--primary', '--primary-strong']);

		const root = d3.pack().size([SIZE, SIZE]).padding(3)(
			d3.hierarchy(this.data)
				.sum((d) => d.value || 0)
				.sort((a, b) => b.value - a.value)
		);

		const depth = d3.scaleLinear().domain([0, root.height]).range([bg, primary]);

		const svg = d3.select(this._root)
			.append('svg')
			.attr('viewBox', `0 0 ${SIZE} ${SIZE}`)
			.attr('role', 'img')
			.attr('aria-label', this.getAttribute('label') || 'hierarchy chart');
		svg.append('title').text(this.getAttribute('label') || 'hierarchy chart');

		const g = svg.append('g');
		g.selectAll('circle').data(root.descendants().slice(1)).join('circle')
			.attr('cx', (d) => d.x).attr('cy', (d) => d.y).attr('r', (d) => d.r)
			.attr('fill', (d) => (d.children ? depth(d.depth) : strong))
			.attr('fill-opacity', (d) => (d.children ? 0.7 : 1));

		g.selectAll('text.leaf').data(root.descendants().filter((d) => !d.children)).join('text')
			.attr('class', 'leaf')
			.attr('x', (d) => d.x).attr('y', (d) => d.y)
			.attr('dominant-baseline', 'middle')
			.text((d) => (d.r > 20 ? d.data.name : ''));

		g.selectAll('text.group').data(root.children || []).join('text')
			.attr('class', 'group')
			.attr('x', (d) => d.x).attr('y', (d) => d.y - d.r - 6)
			.attr('font-weight', 700)
			.text((d) => d.data.name);
	}
}

customElements.define(DeckChartPack.tag, DeckChartPack);
