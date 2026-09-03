// src/components/ideas-map/index.js
import { DeckElement } from '../deck-element.js';
import { d3 } from '@/lib/d3.js';
import { W, H, DATASET, RELATION_OFFSETS, WARMUP } from './dataset.js';
import { buildSimulation } from './simulation.js';
import { topicColors } from './palette.js';
import { makeCamera } from './camera.js';
import { drawGraph } from './render.js';

class DeckIdeasMap extends DeckElement {
	static tag = 'deck-ideas-map';
	static observedAttributes = [
		'data', 'show-links', 'reveal', 'tag', 'scope',
		'highlight', 'spotlight', 'activate', 'attention-from',
		'constellation', 'labels', 'label',
	];

	static styles = `
		:host { display: block; color: var(--fg); font: inherit; }
		svg { width: 100%; height: auto; display: block; background: transparent; }
		text { fill: var(--fg); }
		circle.node { cursor: grab; }
	`;

	_readDataset() {
		try { return JSON.parse(this.getAttribute('data') || 'null') || DATASET; }
		catch { return DATASET; }
	}

	/**
	 * Resolve a CSS custom property to a concrete colour. Chrome returns the raw
	 * `var(...)` string for getPropertyValue on a custom property, which d3.hcl
	 * cannot parse; a probe span that *consumes* the var resolves it.
	 */
	_resolve(varName) {
		if (!this._probe) {
			this._probe = document.createElement('span');
			this._probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
			this.shadowRoot.appendChild(this._probe);
		}
		this._probe.style.color = `var(${varName})`;
		return getComputedStyle(this._probe).color; // -> 'rgb(r, g, b)'
	}

	render() {
		const svg = d3.select(this.shadowRoot).append('svg')
			.attr('viewBox', `0 0 ${W} ${H}`)
			.attr('role', 'img')
			.attr('aria-label', this.getAttribute('label') || 'ideas in space');
		svg.append('title').text(this.getAttribute('label') || 'ideas in space');
		svg.append('desc').text('a force-directed map of ideas');
		const view = svg.append('g').attr('class', 'view').node();

		this._svg = svg.node();
		this._camera = makeCamera(view, W);
		this._data = this._readDataset();
		this._sim = buildSimulation(this._data, { showLinks: this.hasAttribute('show-links') });
		this._computeState();
		drawGraph(this._svg, this._state);
		this._camera.zoomTo([W / 2, H / 2, W]);
	}

	_computeState() {
		const topicOrder = this._data.topics.map((t) => t.id);
		this._state = {
			nodes: this._sim.nodes(),
			links: (this._sim.force('link') && this._sim.force('link').links()) || this._data.links,
			colors: topicColors(topicOrder, (v) => this._resolve(v)),
			showLinks: this.hasAttribute('show-links'),
			labelsMode: this.getAttribute('labels') || 'auto',
			reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
			tag: new Set((this.getAttribute('tag') || '').split(',').map((s) => s.trim()).filter(Boolean)),
			scope: this.getAttribute('scope') || null,
			highlight: new Set((this.getAttribute('highlight') || '').split(',').map((s) => s.trim()).filter(Boolean)),
			spotlight: this.getAttribute('spotlight') || null,
			activate: null,
			reveal: this.hasAttribute('reveal') ? Number(this.getAttribute('reveal')) : null,
			relations: this._data.relations,
			offsets: RELATION_OFFSETS,
			topicOrder,
		};
	}

	attributeChangedCallback(name) {
		if (!this._upgraded) return;
		if (name === 'data') { this._data = this._readDataset(); this._rebuild(); return; }
		if (name === 'show-links') { this._rebuild({ reheat: true }); return; }
		this._computeState();
		if (this._state.scope) this._applyScope();
		drawGraph(this._svg, this._state);
	}

	_applyScope() {} // real body lands in Task 8

	_rebuild({ reheat = false } = {}) {
		this._sim && this._sim.stop();
		this._sim = buildSimulation(this._data, { showLinks: this.hasAttribute('show-links') });
		if (reheat) {
			this._sim.alpha(0.6);
			for (let i = 0; i < Math.floor(WARMUP / 2); i++) this._sim.tick();
			this._sim.alpha(0).stop();
		}
		this._computeState();
		drawGraph(this._svg, this._state);
	}

	disconnectedCallback() { this._sim && this._sim.stop(); }
}

customElements.define(DeckIdeasMap.tag, DeckIdeasMap);
