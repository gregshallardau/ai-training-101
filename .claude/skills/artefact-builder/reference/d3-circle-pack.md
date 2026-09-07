# Recipe: concept map (zoomable circle packing)

For **"topics in space"** - nested ideas as circles, sized by weight, click one
to zoom into it. The "Ideas in Space / The Map" kind of slide.

D3 technique is the canonical *Zoomable circle packing* example
(<https://observablehq.com/@d3/zoomable-circle-packing>, ISC). Layout logic
transfers verbatim; re-home the integration exactly as in `d3-chart.md`
(shadow `<svg>`, `@/lib/d3.js`, `readPalette`, motion from `--motion-*`).

## Data shape

A tree. Leaves carry `value` (their size); parents are sized by their subtree.

```json
{ "name": "AI", "children": [
  { "name": "context", "children": [
    { "name": "prompt", "value": 8 },
    { "name": "system message", "value": 5 },
    { "name": "retrieved docs", "value": 6 }
  ]},
  { "name": "training", "children": [
    { "name": "pretraining", "value": 9 },
    { "name": "fine-tuning", "value": 4 }
  ]}
]}
```

## Worked example - `<deck-concept-map>`

```js
// components/concept-map/index.js
import { DeckElement } from '@/components/deck-element.js';
import { d3, readPalette } from '@/lib/d3.js';

const SIZE = 900; // viewBox is centred: -SIZE/2 .. SIZE/2

const SAMPLE = {
	name: 'AI', children: [
		{ name: 'context', children: [
			{ name: 'prompt', value: 8 },
			{ name: 'system message', value: 5 },
			{ name: 'retrieved docs', value: 6 },
		]},
		{ name: 'training', children: [
			{ name: 'pretraining', value: 9 },
			{ name: 'fine-tuning', value: 4 },
		]},
	],
};

class DeckConceptMap extends DeckElement {
	static tag = 'deck-concept-map';
	static observedAttributes = ['data'];

	static styles = `
		:host { display: block; }
		svg { width: 100%; height: auto; display: block; cursor: pointer;
		      font: inherit; background: transparent; }
		text { fill: var(--fg); text-anchor: middle; }
		circle { stroke: var(--line); }
	`;

	get data() {
		try { return JSON.parse(this.getAttribute('data') || 'null') || SAMPLE; }
		catch { return SAMPLE; }
	}

	render() { this._build(); }

	attributeChangedCallback() {
		if (!this._upgraded) return;
		this.shadowRoot.querySelector('svg')?.remove();
		this._build();
	}

	_build() {
		const [primary, strong, bg] = readPalette(['--primary', '--primary-strong', '--bg']);
		const dur = parseFloat(this.cssVar('--motion-hero-duration')) || 600;

		const root = d3.pack().size([SIZE, SIZE]).padding(3)(
			d3.hierarchy(this.data)
				.sum((d) => d.value || 0)
				.sort((a, b) => b.value - a.value)
		);

		const depth = d3.scaleLinear().domain([0, root.height]).range([bg, primary]);

		const svg = d3.select(this.shadowRoot)
			.append('svg')
			.attr('viewBox', `${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`)
			.attr('role', 'img')
			.attr('aria-label', this.getAttribute('label') || 'concept map');

		let focus = root;
		let view;

		const node = svg.append('g').selectAll('circle')
			.data(root.descendants().slice(1)).join('circle')
			.attr('fill', (d) => (d.children ? depth(d.depth) : strong))
			.attr('fill-opacity', (d) => (d.children ? 0.7 : 1))
			.attr('pointer-events', (d) => (d.children ? null : 'none'))
			.on('click', (event, d) => focus !== d && (zoom(d), event.stopPropagation()));

		const label = svg.append('g')
			.attr('pointer-events', 'none')
			.selectAll('text')
			.data(root.descendants()).join('text')
			.style('fill-opacity', (d) => (d.parent === root ? 1 : 0))
			.style('display', (d) => (d.parent === root ? 'inline' : 'none'))
			.style('font-size', (d) => `${Math.max(10, d.r / 5)}px`)
			.text((d) => d.data.name);

		svg.on('click', () => zoom(root));
		zoomTo([root.x, root.y, root.r * 2]);

		function zoomTo(v) {
			const k = SIZE / v[2];
			view = v;
			label.attr('transform', (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
			node.attr('transform', (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
			node.attr('r', (d) => d.r * k);
		}

		function zoom(d) {
			focus = d;
			const t = svg.transition().duration(dur).tween('zoom', () => {
				const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
				return (s) => zoomTo(i(s));
			});
			label.filter(function (d) {
					return d.parent === focus || this.style.display === 'inline';
				})
				.transition(t)
				.style('fill-opacity', (d) => (d.parent === focus ? 1 : 0))
				.on('start', function (d) { if (d.parent === focus) this.style.display = 'inline'; })
				.on('end', function (d) { if (d.parent !== focus) this.style.display = 'none'; });
		}
	}
}

customElements.define(DeckConceptMap.tag, DeckConceptMap);
```

Slide: `<deck-concept-map label="Ideas in space"></deck-concept-map>` (uses the
sample), or pass your own tree in `data='{...}'`.

## Notes

- **Static, non-zoom variant:** drop `zoom` / `zoomTo` / the click handlers and
  show all labels (`fill-opacity: 1` for every `d.depth === 1`). One `layout`
  branch if you want both in the component.
- Colours track the theme via `readPalette` - leaves use `--primary-strong`,
  parents a `--bg -> --primary` depth ramp.
- Zoom duration is `--motion-hero-duration`; no hard-coded ms.
- `d3.interpolateZoom` ships in d3 core (via `@/lib/d3.js`).
