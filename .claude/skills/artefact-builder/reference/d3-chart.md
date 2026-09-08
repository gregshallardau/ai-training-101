# Recipe: chart artefact (D3)

For **data-bound** visuals - bar, line, area, scatter, pie, and the layout
families (hierarchies, chord, force, geo). Anything where marks are computed
from data through scales.

Not for: boxes-and-arrows (`svg-diagram.md`), a click-through demo
(`alpine-interactive.md`).

D3 technique below is adapted from
<https://github.com/chrisvoncsefalvay/claude-d3js-skill> (MIT). The **technique**
transfers; the **integration** does not - re-home every one of these:

| Generic D3 idiom | This framework |
|---|---|
| `import * as d3` / CDN `d3.v7.min.js` | `import { d3 } from '@/lib/d3.js'` (lazy - only in a component) |
| React `useEffect` / `svgRef` | `render()` + `attributeChangedCallback` on the DeckElement |
| `d3.select('#chart')` | `d3.select(this.shadowRoot.querySelector('svg'))` |
| `d3.select('body').append('div.tooltip')` | a tooltip `<div>` appended **inside** `this.shadowRoot`, positioned in host coords |
| `"steelblue"`, `d3.schemeCategory10` | `this.cssVar('--primary')`, or `readPalette([...])` from `@/lib/d3.js` |
| `window.addEventListener('resize', ...)` | `ResizeObserver` on `this`, redraw |
| fixed `width`/`height` px | `viewBox="0 0 W H"` on the `<svg>`, CSS `width:100%` - it scales within the 1920x1080 slide |

Add `role="img"` + `<title>`/`<desc>` to the `<svg>` for accessibility - that
guidance from the source transfers directly.

## Rounded corners

SVG has no `border-radius`; a bar/cell that should carry the deck's actual
`--radius-control` needs its outline drawn as a path via `roundedRectPath`
(`@/lib/d3.js`) instead of a plain `<rect>`. The token is a px value against
the *rendered* element, but marks are drawn in `viewBox` units - convert with
`pxToViewBoxUnits` before passing the radius in:

```js
import { d3, readPalette, roundedRectPath, pxToViewBoxUnits } from '@/lib/d3.js';
// ...inside _draw(), after `const svg = d3.select(...)`:
// cssVarPx (DeckElement, not cssVar) - a custom property's value is literal
// authored text ("0.375rem"), not a resolved length; cssVarPx is what
// actually converts it to a px number.
const rPx = this.cssVarPx('--radius-control');
const r = pxToViewBoxUnits(rPx, svg.node(), W);

g.selectAll('path.bar').data(data).join('path').attr('class', 'bar')
	.attr('d', (d) => roundedRectPath(x(d.label), y(d.value), x.bandwidth(), ih - y(d.value), r))
	.attr('fill', primary)
	// same mousemove/mouseleave tooltip handlers as the plain-rect version above
```

Default corners are `{ tl: true, tr: true }` (top-only, the standard bar look);
pass `{ tl: true, tr: true, bl: true, br: true }` for a fully-rounded cell
(e.g. a heatmap square). For pie/donut wedges, radial charts round via
`d3.arc().cornerRadius(r)` instead (same `r`, no `roundedRectPath` needed -
`d3.arc()` already emits an SVG arc). Recompute `r` inside `_draw` (and on
`[data-theme]` changes, since re-themeing goes through the same redraw path)
rather than caching it - it depends on the live rendered size.

Wrap the whole component's shadow-root content in `SHARED_STYLES`'s `.box`
class (padding, `--bg`, `--radius-card`, hover shadow) when the chart should
read as its own card rather than sit directly on the slide background.

## Worked example - `<deck-chart kind="bar">`

```js
// components/chart/index.js
import { DeckElement } from '@/components/deck-element.js';
import { d3, readPalette } from '@/lib/d3.js';

const W = 800, H = 400, M = { top: 16, right: 16, bottom: 32, left: 40 };

class DeckChart extends DeckElement {
	static tag = 'deck-chart';
	static observedAttributes = ['kind', 'data'];

	static styles = `
		:host { display: block; }
		svg { width: 100%; height: auto; font: inherit; }
		.axis text { fill: var(--muted); font-size: 12px; }
		.axis path, .axis line { stroke: var(--line); }
		.tip {
			position: absolute; pointer-events: none; opacity: 0;
			padding: var(--space-gap) var(--space-inline);
			border: 1px solid var(--line); border-radius: var(--radius-control);
			background: var(--bg); color: var(--fg); font-size: 0.8em;
		}
	`;

	get data() {
		try { return JSON.parse(this.getAttribute('data') || '[]'); }
		catch { return []; }
	}

	render() {
		this.style.position = 'relative';
		const svg = d3.select(this.shadowRoot)
			.append('svg')
			.attr('viewBox', `0 0 ${W} ${H}`)
			.attr('role', 'img')
			.attr('aria-label', this.getAttribute('label') || 'chart');
		svg.append('title').text(this.getAttribute('label') || 'chart');
		this._tip = this.shadowRoot.appendChild(
			Object.assign(document.createElement('div'), { className: 'tip' })
		);
		this._draw();

		this._ro = new ResizeObserver(() => this._draw());
		this._ro.observe(this);
	}

	disconnectedCallback() { this._ro?.disconnect(); }

	attributeChangedCallback() {
		if (!this._upgraded) return;
		this.shadowRoot.querySelector('svg')?.querySelectorAll('g').forEach((n) => n.remove());
		this._draw();
	}

	_draw() {
		const data = this.data;
		if (!data.length) return;
		const [primary, muted] = readPalette(['--primary', '--muted']);
		const svg = d3.select(this.shadowRoot.querySelector('svg'));
		svg.selectAll('g').remove();

		const iw = W - M.left - M.right, ih = H - M.top - M.bottom;
		const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

		const x = d3.scaleBand().domain(data.map((d) => d.label)).range([0, iw]).padding(0.15);
		const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.value)]).nice().range([ih, 0]);

		g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x));
		g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5));

		g.selectAll('rect').data(data).join('rect')
			.attr('x', (d) => x(d.label)).attr('y', (d) => y(d.value))
			.attr('width', x.bandwidth()).attr('height', (d) => ih - y(d.value))
			.attr('fill', primary)
			.on('mousemove', (e, d) => {
				const r = this.getBoundingClientRect();
				this._tip.style.opacity = 1;
				this._tip.style.left = `${e.clientX - r.left + 8}px`;
				this._tip.style.top = `${e.clientY - r.top + 8}px`;
				this._tip.textContent = `${d.label}: ${d.value}`;
			})
			.on('mouseleave', () => (this._tip.style.opacity = 0));
	}
}

customElements.define(DeckChart.tag, DeckChart);
```

Slide: `<deck-chart kind="bar" label="Renewals by month"
data='[{"label":"Jan","value":12},{"label":"Feb","value":19}]'></deck-chart>`

## Scales (quick reference)

| Need | Scale |
|---|---|
| continuous number -> pixels | `d3.scaleLinear()` |
| category -> band (bars) | `d3.scaleBand().padding(0.1)` |
| category -> point (line/scatter x) | `d3.scalePoint()` |
| dates -> pixels | `d3.scaleTime()` |
| value -> sequential colour | `d3.scaleSequential(d3.interpolateBlues)` - but prefer `--primary` ramps |
| exponential data | `d3.scaleLog()` |
| circle area encoding | `d3.scaleSqrt()` |

`.nice()` rounds a domain to tidy bounds. `y` range is `[innerHeight, 0]`
(inverted for SVG).

## Other mark types (swap into `_draw`)

```js
// line
const line = d3.line().x((d) => x(d.date)).y((d) => y(d.value)).curve(d3.curveMonotoneX);
g.append('path').datum(data).attr('fill', 'none').attr('stroke', primary).attr('stroke-width', 2).attr('d', line);

// area
const area = d3.area().x((d) => x(d.date)).y0(ih).y1((d) => y(d.value)).curve(d3.curveMonotoneX);
g.append('path').datum(data).attr('fill', primary).attr('fill-opacity', 0.2).attr('d', area);

// scatter
g.selectAll('circle').data(data).join('circle')
	.attr('cx', (d) => x(d.x)).attr('cy', (d) => y(d.y)).attr('r', 4).attr('fill', primary).attr('opacity', 0.7);
```

Transitions: `sel.transition().duration(parseFloat(this.cssVar('--motion-ui-duration')))`.
For >1000 marks, draw to `<canvas>` instead of SVG.
