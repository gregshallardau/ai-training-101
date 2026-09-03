// src/components/ideas-map/index.js
import { DeckElement } from '../deck-element.js';
import { d3 } from '@/lib/d3.js';
import { W, H, DATASET, RELATION_OFFSETS } from './dataset.js';
import { buildSimulation, makeLinkForce } from './simulation.js';
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
		// A `data=` attribute is already a fresh object (JSON.parse); the built-in
		// DATASET is module-level and shared, so every instance takes its OWN deep
		// clone — buildSimulation mutates node objects (x/y/vx/vy, d3 adds .index)
		// and two instances must not corrupt each other. (review C2)
		let ds;
		try {
			const parsed = JSON.parse(this.getAttribute('data') || 'null');
			ds = parsed || structuredClone(DATASET);
		} catch {
			ds = structuredClone(DATASET);
		}
		return this._normaliseDataset(ds);
	}

	/** Drop unknown topic ids from every node; warn about a node left with none —
	 *  it is still placed by charge + link forces and drawn in --muted (spec §4.2). */
	_normaliseDataset(ds) {
		const topicIds = new Set((ds.topics || []).map((t) => t.id));
		for (const n of ds.nodes || []) {
			n.topics = Array.isArray(n.topics) ? n.topics.filter((t) => topicIds.has(t)) : [];
			if (n.topics.length === 0) {
				console.warn(`[ideas-map] node "${n.id}" has no known topic — placed by forces only, drawn muted`);
			}
		}
		return ds;
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
		this._scopeCleared = false;
		this._data = this._readDataset();
		this._sim = buildSimulation(this._data, { showLinks: this.hasAttribute('show-links') });
		this._legend = document.createElement('div');
		this._legend.className = 'legend';
		this._legend.hidden = true;
		this.shadowRoot.appendChild(this._legend);

		this._labelOverride = null;
		this._toggle = document.createElement('button');
		this._toggle.className = 'btn ghost';
		this._toggle.type = 'button';
		this._toggle.textContent = 'Aa';
		this._toggle.addEventListener('click', () => {
			this._labelOverride = this._labelOverride === null ? 'all'
				: this._labelOverride === 'all' ? 'none' : null;
			this._redraw();
		});
		this.shadowRoot.appendChild(this._toggle);

		// Background click → clear scope framing (spec §6.1). A click that lands on
		// a node is a drag target, not a background click.
		d3.select(this._svg).on('click', (event) => {
			if (event.target && event.target.closest && event.target.closest('circle.node')) return;
			this._scopeCleared = true;
			this._applyScope();
		});

		this._computeState();
		this._renderLegend();
		drawGraph(this._svg, this._state);
		this._applyScope(true);

		this._wireSim();

		// Live theme re-colour: a [data-theme] / class swap on <html> changes what
		// `--primary` (and friends) resolve to, so recompute colours and redraw.
		this._themeObserver = new MutationObserver(() => this._redraw());
		this._themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme', 'class'],
		});
	}

	/** Full recompute + redraw + drag re-wire. EVERY redraw path routes through
	 *  here so the graph is never left with dead `d3.drag()` bindings after
	 *  `layer()` blew the old `circle.node` elements away (review C1). */
	_redraw() {
		this._computeState();
		this._renderLegend();
		this._paint();
	}

	/** Cheap repaint: redraw the SVG from the current `this._state` and re-bind
	 *  drag — no state recompute. Used on every re-heat tick and drag move so
	 *  labels / attention / spotlight layers track their nodes too (review I2). */
	_paint() {
		drawGraph(this._svg, this._state);
		this._wireDrag();
	}

	/** (Re)attach the tick handler + drag to the current `this._sim`. Called after
	 *  render and after every sim swap (`_rebuild`). The tick handler does a full
	 *  `_paint()` each frame — at ~100 SVG elements this is cheap and it removes
	 *  the "which layers did I forget to move" risk of a partial position sync. */
	_wireSim() {
		this._sim.on('tick', () => {
			if (this._sim.alpha() < this._sim.alphaMin()) return;
			this._paint();
		});
		this._wireDrag();
	}

	_wireDrag() {
		const self = this;
		const drag = d3.drag()
			.subject(function () { return d3.select(this).datum(); })
			.on('start', function (event, d) { self._onDragStart(event, d); })
			.on('drag', function (event, d) { self._onDrag(event, d); })
			.on('end', function (event, d) { self._onDragEnd(event, d); });
		const byId = new Map(this._sim.nodes().map((n) => [n.id, n]));
		d3.select(this._svg).selectAll('g.nodes circle.node')
			.datum(function () { return byId.get(this.dataset.id) || null; })
			.call(drag);
	}

	_onDragStart(event, d) {
		this._sim.alphaTarget(0.3).restart();
		d.fx = d.x; d.fy = d.y;
		this._dragId = d.id;
		this._computeState();
		this._paint();
	}

	_onDrag(event, d) {
		d.fx = event.x; d.fy = event.y;
		this._paint();
	}

	_onDragEnd(event, d) {
		this._sim.alphaTarget(0);
		d.fx = null; d.fy = null;
		this._dragId = null;
		this._computeState();
		this._paint();
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
			labelsMode: this._labelOverride || this.getAttribute('labels') || 'auto',
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
			dragId: this._dragId || null,
		};

		// a11y: keep <desc> describing whatever overlay is currently active.
		const bits = [];
		if (this._state.scope) bits.push(`focused on ${this._state.scope}`);
		if (this._state.tag.size) bits.push(`tags: ${[...this._state.tag].join(', ')}`);
		if (this._state.activate) bits.push(`constellation of ${this._state.activate.ids.size} ideas`);
		this._svg.querySelector('desc').textContent =
			bits.length ? bits.join('; ') : 'a force-directed map of ideas';
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
		// the source node is always part of the activation — so it gets a halo and
		// is never muted by `dimByAct`, even if `attention-from` names a node that
		// is not in the csv / context set (review deferred #1).
		if (from) ids.add(from);
		// renormalise the fan weights (exclude `from`) so they sum to 1 — the fixed budget
		const fanIds = [...ids].filter((id) => id !== from);
		const sum = fanIds.reduce((s, id) => s + (weight.get(id) || 0), 0) || 1;
		for (const id of fanIds) weight.set(id, (weight.get(id) || 0) / sum);
		return { ids, from, weights: weight, constellation: this.hasAttribute('constellation') };
	}

	attributeChangedCallback(name) {
		if (!this._upgraded) return;
		// any authored attribute change re-asserts scope framing after a
		// background click cleared it (spec §6.1).
		this._scopeCleared = false;
		if (name === 'data') { this._data = this._readDataset(); this._rebuild(); return; }
		if (name === 'show-links') { this._toggleLinks(); return; }
		this._redraw();
		this._applyScope();
	}

	_applyScope(instant = false) {
		// a background click frames the whole graph until the next attribute change
		const scope = this._scopeCleared ? null : this._state.scope;
		const shown = this._state.nodes.filter((n) =>
			this._state.reveal == null
			|| this._state.topicOrder.indexOf(n.topics[0]) < this._state.reveal);
		const target = scope
			? bboxOf(shown.filter((n) => n.topics[0] === scope), 90)
			: bboxOf(shown, 90);
		this._camera.easeTo(
			[target.cx, target.cy, target.w],
			{ duration: instant ? 0 : this._dur('hero') },
		);
	}

	/** `show-links` toggle: spec §5.2 — the node/link data and settled positions
	 *  are NOT rebuilt, only the `link` force toggles. Add / remove exactly the
	 *  force `buildSimulation` uses on the LIVE sim and re-heat briefly (spec
	 *  §3.1); under reduced motion run a synchronous settle so it is an instant
	 *  cut. (review I3) */
	_toggleLinks() {
		this._computeState();
		const on = this.hasAttribute('show-links');
		this._sim.force('link', on ? makeLinkForce(this._data) : null);
		if (this._state.reduced) {
			this._sim.alpha(0.3);
			for (let i = 0; i < 160; i++) this._sim.tick();
			this._sim.alphaTarget(0).alpha(0).stop();
		} else {
			this._sim.alphaTarget(0.3).alpha(0.4).restart();
			clearTimeout(this._reheatTimer);
			this._reheatTimer = setTimeout(() => { this._sim && this._sim.alphaTarget(0); }, 500);
		}
		this._redraw();
		this._applyScope();
	}

	/** Full teardown + fresh simulation. Only a `data=` change needs this — it is
	 *  the one case where node/link identity genuinely changes (spec §5.2). */
	_rebuild() {
		this._sim && this._sim.stop();
		this._sim = buildSimulation(this._data, { showLinks: this.hasAttribute('show-links') });
		this._wireSim();
		this._redraw();
		this._applyScope();
	}

	connectedCallback() {
		super.connectedCallback();
		// Reveal relocates slide nodes: disconnectedCallback tears the observer
		// down on every move, so re-attach it here on each reconnect. The guard
		// makes the very first connect (before render() created it) a no-op;
		// MutationObserver ignores a duplicate observe() with identical options.
		if (this._themeObserver) {
			this._themeObserver.observe(document.documentElement, {
				attributes: true, attributeFilter: ['data-theme', 'class'],
			});
		}
	}

	disconnectedCallback() {
		this._sim && this._sim.stop();
		clearTimeout(this._reheatTimer);
		this._themeObserver && this._themeObserver.disconnect();
	}
}

customElements.define(DeckIdeasMap.tag, DeckIdeasMap);
