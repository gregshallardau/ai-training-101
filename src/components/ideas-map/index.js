// src/components/ideas-map/index.js
import { DeckElement } from '../deck-element.js';
import { d3 } from '@/lib/d3.js';
import { W, H, DATASET, RELATION_OFFSETS, WARMUP } from './dataset.js';
import { buildSimulation } from './simulation.js';
import { topicColors } from './palette.js';
import { makeCamera, bboxOf } from './camera.js';
import { drawGraph } from './render.js';

class DeckIdeasMap extends DeckElement {
	static tag = 'deck-ideas-map';
	static observedAttributes = [
		'data', 'show-links', 'reveal', 'tag', 'scope',
		'highlight', 'spotlight', 'activate', 'attention-from',
		'constellation', 'labels', 'label',
	];

	static styles = `
		:host { display: block; color: var(--fg); font: inherit; position: relative; }
		svg { width: 100%; height: auto; display: block; background: transparent; }
		text { fill: var(--fg); }
		circle.node { cursor: grab; }
		.legend {
			position: absolute; top: var(--space-gap); right: var(--space-gap);
			background: var(--bg); border: 1px solid var(--line);
			border-radius: var(--radius-card); padding: var(--space-gap);
			display: flex; flex-direction: column; gap: var(--space-gap);
		}
		.legend[hidden] { display: none; }
		.row { display: flex; gap: var(--space-gap); align-items: center; font-size: 0.8em; }
		.row .chip {
			display: inline-block; width: 0.8em; height: 0.8em; border-radius: var(--radius-round);
		}
		.btn.ghost {
			font: inherit; position: absolute; bottom: var(--space-gap); right: var(--space-gap);
			padding: var(--space-gap) var(--space-inline);
			background: transparent; color: var(--primary);
			border: 1px solid var(--line); border-radius: var(--radius-control); cursor: pointer;
		}
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
		this._legend = document.createElement('div');
		this._legend.className = 'legend';
		this._legend.hidden = true;
		this.shadowRoot.appendChild(this._legend);

		this._computeState();
		this._renderLegend();
		drawGraph(this._svg, this._state);
		this._applyScope(true);
	}

	_dur(kind) {
		if (this._state.reduced) return 0;
		const v = parseFloat(this.cssVar(kind === 'hero' ? '--motion-hero-duration' : '--motion-ui-duration'));
		return Number.isFinite(v) ? v : (kind === 'hero' ? 600 : 150);
	}

	_renderLegend() {
		const tags = this._state.scope
			? new Set([...this._state.tag, this._state.scope])
			: this._state.tag;
		this._legend.textContent = '';
		this._legend.hidden = tags.size === 0;
		for (const id of tags) {
			const t = this._data.topics.find((x) => x.id === id);
			const row = document.createElement('div');
			row.className = 'row';
			const chip = document.createElement('span');
			chip.className = 'chip';
			chip.style.background = (this._state.colors.get(id) || {}).fill || 'var(--primary)';
			row.append(chip, document.createTextNode(t ? t.name : id));
			this._legend.appendChild(row);
		}
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
			activate: this._parseActivate(),
			reveal: this.hasAttribute('reveal') ? Number(this.getAttribute('reveal')) : null,
			relations: this._data.relations,
			offsets: RELATION_OFFSETS,
			topicOrder,
		};
	}

	_parseActivate() {
		const raw = this.getAttribute('activate');
		if (!raw) return null;
		const tokens = raw.split(',').map((s) => s.trim()).filter(Boolean);
		const ctxs = this._data.contexts || {};
		const ids = new Set();
		const weight = new Map();
		let from = this.getAttribute('attention-from') || null;
		for (const tok of tokens) {
			if (ctxs[tok]) {
				const c = ctxs[tok];
				if (!from && c.from) from = c.from;
				for (const id of c.nodes) {
					ids.add(id);
					weight.set(id, (weight.get(id) || 0) + ((c.weights && c.weights[id]) ?? 0.5));
				}
			} else {
				ids.add(tok);
				weight.set(tok, (weight.get(tok) || 0) + 0.5);
			}
		}
		// renormalise the fan weights (exclude `from`) so they sum to 1 — the fixed budget
		const fanIds = [...ids].filter((id) => id !== from);
		const sum = fanIds.reduce((s, id) => s + (weight.get(id) || 0), 0) || 1;
		for (const id of fanIds) weight.set(id, (weight.get(id) || 0) / sum);
		return { ids, from, weights: weight, constellation: this.hasAttribute('constellation') };
	}

	attributeChangedCallback(name) {
		if (!this._upgraded) return;
		if (name === 'data') { this._data = this._readDataset(); this._rebuild(); return; }
		if (name === 'show-links') { this._rebuild({ reheat: true }); return; }
		this._computeState();
		this._renderLegend();
		this._applyScope();
		drawGraph(this._svg, this._state);
	}

	_applyScope(instant = false) {
		const shown = this._state.nodes.filter((n) =>
			this._state.reveal == null
			|| this._state.topicOrder.indexOf(n.topics[0]) < this._state.reveal);
		const target = this._state.scope
			? bboxOf(shown.filter((n) => n.topics[0] === this._state.scope), 90)
			: bboxOf(shown, 90);
		this._camera.easeTo(
			[target.cx, target.cy, target.w],
			{ duration: instant ? 0 : this._dur('hero') },
		);
	}

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
		this._renderLegend();
		this._applyScope();
	}

	disconnectedCallback() { this._sim && this._sim.stop(); }
}

customElements.define(DeckIdeasMap.tag, DeckIdeasMap);
