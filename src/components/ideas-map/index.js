// src/components/ideas-map/index.js
import { DeckElement } from '../deck-element.js';
import { d3 } from '@/lib/d3.js';
import { W, H, DATASET, RELATION_OFFSETS } from './dataset.js';
import { buildSimulation, makeLinkForce } from './simulation.js';
import { topicColors } from './palette.js';
import { makeCamera, bboxOf } from './camera.js';
import { drawGraph } from './render.js';

// Named per-slide starting states. `mode="web"` on a slide == the map picks up
// in this preset; explicit attributes (or a live control) override a dimension.
const MODES = {
	'star-map':      { labels: 'topics', links: false, vectors: null,   scope: null,     activate: null,      starmap: false },
	'labels':        { labels: 'all',  links: false, vectors: null,     scope: null,     activate: null,      starmap: false },
	'vectors':       { labels: 'all',  links: false, vectors: 'gender', scope: null,     activate: null,      starmap: false },
	'web':           { labels: 'all',  links: true,  vectors: null,     scope: null,     activate: null,      starmap: false },
	'zoomed':        { labels: 'auto', links: true,  vectors: null,     scope: 'family', activate: null,      starmap: false },
	'constellation': { labels: 'auto', links: true,  vectors: null,     scope: null,     activate: 'royalty', starmap: true  },
};
const MODE_ORDER = ['star-map', 'labels', 'vectors', 'web', 'zoomed', 'constellation'];

class DeckIdeasMap extends DeckElement {
	static tag = 'deck-ideas-map';
	static observedAttributes = [
		'data', 'show-links', 'reveal', 'tag', 'scope',
		'highlight', 'spotlight', 'activate', 'attention-from',
		'constellation', 'labels', 'label', 'mode', 'controls',
	];

	static styles = `
		:host { display: block; color: var(--fg); font: inherit; position: relative; }
		svg {
			display: block; margin-inline: auto; background: transparent;
			width: 100%; height: auto;
			max-width: 100%; max-height: var(--ideas-map-max-h, 72vh);
			aspect-ratio: ${W} / ${H};
		}
		text { fill: var(--fg); }
		circle.node { cursor: grab; }
		.controls {
			position: absolute; left: 50%; bottom: 0.6em; transform: translateX(-50%);
			display: inline-flex; align-items: stretch; gap: 1px;
			padding: 2px; border-radius: var(--radius-round);
			background: color-mix(in srgb, var(--bg) 78%, transparent);
			border: 1px solid color-mix(in srgb, var(--line) 55%, transparent);
			font: inherit;
		}
		.controls[hidden] { display: none; }
		.controls button {
			font: inherit; font-size: 0.58em; line-height: 1;
			letter-spacing: 0.02em; white-space: nowrap;
			padding: 0.42em 0.72em; border: 0; border-radius: var(--radius-round);
			background: transparent; color: var(--muted); cursor: pointer;
			transition: background var(--motion-ui-duration) var(--motion-ui-ease),
			            color var(--motion-ui-duration) var(--motion-ui-ease);
		}
		.controls button:hover { color: var(--fg); background: color-mix(in srgb, var(--fg) 8%, transparent); }
		.controls button.on { color: var(--primary-fg); background: var(--primary); }
		.controls button:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
		.legend {
			position: absolute; top: 0.6em; right: 0.6em;
			background: color-mix(in srgb, var(--bg) 82%, transparent);
			border: 1px solid color-mix(in srgb, var(--line) 55%, transparent);
			border-radius: var(--radius-card); padding: 0.4em 0.6em;
			display: flex; flex-direction: column; gap: 0.28em;
		}
		.legend[hidden] { display: none; }
		.row {
			display: flex; gap: 0.5em; align-items: center;
			font-size: 0.56em; line-height: 1; color: var(--muted);
			transition: opacity var(--motion-ui-duration) var(--motion-ui-ease);
		}
		.row.on { color: var(--fg); font-weight: 600; }
		.legend:has(.row.on) .row:not(.on) { opacity: 0.4; }
		.row .chip {
			display: inline-block; width: 0.72em; height: 0.72em; flex: none;
			border-radius: var(--radius-round);
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
		this._ov = {};              // live-control overrides, per dimension
		this._liveMode = null;      // set by the Mode button; else the `mode` attr
		this._clickScope = undefined; // undefined = use attr/mode; null = whole graph; id = zoomed
		this._data = this._readDataset();
		this._sim = buildSimulation(this._data, { showLinks: this._wantLinks() });
		this._legend = document.createElement('div');
		this._legend.className = 'legend';
		this._legend.hidden = true;
		this.shadowRoot.appendChild(this._legend);

		this._controls = document.createElement('div');
		this._controls.className = 'controls';
		this.shadowRoot.appendChild(this._controls);

		// Click a node → zoom the camera to fit that node's topic; click empty
		// space → zoom back out to the whole graph (spec §6.1). A click that ended
		// a real drag is not a zoom click.
		d3.select(this._svg).on('click', (event) => {
			if (this._dragMoved) { this._dragMoved = false; return; }
			const el = event.target && event.target.closest && event.target.closest('circle.node');
			if (el) {
				const n = this._sim.nodes().find((x) => x.id === el.dataset.id);
				this._clickScope = (n && n.topics[0]) ? n.topics[0] : undefined;
			} else {
				this._clickScope = null;
			}
			this._redraw();
			this._applyScope();
		});

		this._computeState();
		this._renderLegend();
		this._renderControls();
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
		this._renderControls();
		this._paint();
	}

	/** Optional on-slide control row. `controls="labels links vectors starmap zoom
	 *  mode"` — each listed name gets a button that flips a live override. Absent
	 *  → no row; the slide's `mode` / attributes drive the map on their own. */
	_renderControls() {
		const wanted = new Set((this.getAttribute('controls') || '').split(/[\s,]+/).filter(Boolean));
		this._controls.textContent = '';
		this._controls.hidden = wanted.size === 0;
		if (wanted.size === 0) return;
		const s = this._state;
		const mk = (text, on, onClick) => {
			const b = document.createElement('button');
			b.type = 'button';
			b.textContent = text;
			if (on) b.className = 'on';
			b.addEventListener('click', onClick);
			this._controls.appendChild(b);
		};
		if (wanted.has('mode')) {
			mk(`mode·${this._liveMode || this.getAttribute('mode') || 'star-map'}`, false, () => this._cycleMode());
		}
		if (wanted.has('labels')) {
			mk(s.labelsMode === 'none' ? 'labels' : `labels·${s.labelsMode}`, s.labelsMode !== 'none', () => {
				this._ov.labels = ({ topics: 'all', all: 'auto', auto: 'none', none: 'topics' })[s.labelsMode] || 'topics';
				this._redraw();
			});
		}
		if (wanted.has('links')) {
			mk('web', s.showLinks, () => { this._ov.links = !s.showLinks; this._toggleLinks(); });
		}
		if (wanted.has('vectors')) {
			mk(s.spotlight ? `vec·${s.spotlight}` : 'vectors', !!s.spotlight, () => {
				const seq = [null, 'gender', 'parent', 'tense', 'capital'];
				this._ov.vectors = seq[(seq.indexOf(s.spotlight) + 1) % seq.length];
				this._redraw();
			});
		}
		if (wanted.has('starmap')) {
			mk('stars', s.starmap, () => { this._ov.starmap = !s.starmap; this._redraw(); });
		}
		if (wanted.has('zoom')) {
			mk('−', false, () => this._zoomBy(1.3));
			mk('+', false, () => this._zoomBy(1 / 1.3));
		}
	}

	_zoomBy(factor) {
		const [cx, cy, w] = this._camera.view();
		this._camera.easeTo([cx, cy, w * factor], { duration: this._dur('ui') });
	}

	_cycleMode() {
		const cur = this._liveMode || this.getAttribute('mode') || 'star-map';
		this._liveMode = MODE_ORDER[(MODE_ORDER.indexOf(cur) + 1) % MODE_ORDER.length];
		this._ov = {};              // a fresh mode starts from a clean slate
		this._clickScope = undefined;
		this._toggleLinks();        // the new mode may flip the web — sync + redraw + reframe
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
		this._dragMoved = false;
		this._sim.alphaTarget(0.3).restart();
		d.fx = d.x; d.fy = d.y;
		this._dragId = d.id;
		this._computeState();
		this._paint();
	}

	_onDrag(event, d) {
		d.fx = event.x; d.fy = event.y;
		this._dragMoved = true;   // so the trailing `click` isn't read as a zoom
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

	/** Always-on colour key: one row per topic. `tag` / `scope` mark their rows
	 *  `.on` (and the CSS fades the rest), so the legend doubles as the emphasis
	 *  readout without disappearing when nothing is tagged. */
	_renderLegend() {
		const emph = this._state.scope
			? new Set([...this._state.tag, this._state.scope])
			: this._state.tag;
		this._legend.textContent = '';
		this._legend.hidden = this._data.topics.length === 0;
		for (const t of this._data.topics) {
			const row = document.createElement('div');
			row.className = 'row' + (emph.size && emph.has(t.id) ? ' on' : '');
			const chip = document.createElement('span');
			chip.className = 'chip';
			chip.style.background = (this._state.colors.get(t.id) || {}).fill || 'var(--primary)';
			row.append(chip, document.createTextNode(t.name));
			this._legend.appendChild(row);
		}
	}

	/** Effective mode preset for this render (Mode button > `mode` attr > star-map). */
	_mode() {
		return MODES[this._liveMode || this.getAttribute('mode') || 'star-map'] || MODES['star-map'];
	}

	/** Effective association-web state: live override > `show-links` attr > mode. */
	_wantLinks() {
		if (this._ov.links !== undefined) return this._ov.links;
		if (this.hasAttribute('show-links')) return true;
		return !!this._mode().links;
	}

	_computeState() {
		const topicOrder = this._data.topics.map((t) => t.id);
		const m = this._mode();
		const ov = this._ov;
		const scope = this._clickScope !== undefined
			? this._clickScope
			: (ov.scope ?? this.getAttribute('scope') ?? m.scope ?? null);
		this._state = {
			nodes: this._sim.nodes(),
			links: (this._sim.force('link') && this._sim.force('link').links()) || this._data.links,
			colors: topicColors(topicOrder, (v) => this._resolve(v)),
			showLinks: this._wantLinks(),
			labelsMode: ov.labels ?? this.getAttribute('labels') ?? m.labels ?? 'auto',
			reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
			tag: new Set((this.getAttribute('tag') || '').split(',').map((s) => s.trim()).filter(Boolean)),
			scope,
			highlight: new Set((this.getAttribute('highlight') || '').split(',').map((s) => s.trim()).filter(Boolean)),
			spotlight: ov.vectors ?? this.getAttribute('spotlight') ?? m.vectors ?? null,
			activate: this._parseActivate(ov.activate ?? this.getAttribute('activate') ?? m.activate ?? null),
			starmap: ov.starmap ?? m.starmap ?? false,
			reveal: this.hasAttribute('reveal') ? Number(this.getAttribute('reveal')) : null,
			relations: this._data.relations,
			offsets: RELATION_OFFSETS,
			topicOrder,
			topicNames: new Map(this._data.topics.map((t) => [t.id, t.name])),
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

	_parseActivate(raw = this.getAttribute('activate')) {
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
		// an authored change re-asserts the slide's framing over a live click-zoom;
		// a new `mode` wipes every live override back to that mode's clean state.
		this._clickScope = undefined;
		if (name === 'data') { this._data = this._readDataset(); this._rebuild(); return; }
		if (name === 'mode') {
			this._liveMode = null; this._ov = {};
			this._toggleLinks();   // a mode can flip the web on/off — sync the link force
			return;
		}
		if (name === 'show-links') { this._toggleLinks(); return; }
		this._redraw();
		this._applyScope();
	}

	_applyScope(instant = false) {
		const scope = this._state.scope;   // already folds in click-zoom / mode / attr
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
		const on = this._state.showLinks;
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
		this._sim = buildSimulation(this._data, { showLinks: this._wantLinks() });
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
