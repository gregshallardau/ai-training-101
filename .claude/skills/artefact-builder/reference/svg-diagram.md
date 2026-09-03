# Recipe: diagram artefact (hand SVG / CSS)

For **explanatory schematics** - layers, boxes and arrows, a flow, a labelled
picture. No data binding, no library.

Not for: anything computed from data (`d3-chart.md`), a click-through
(`alpine-interactive.md`).

## Pattern

One component, a `kind` attribute, one `render<Kind>()` per diagram. Each builds
an `<svg viewBox>` so it scales inside the slide. Strokes and fills are semantic
custom properties via CSS in `static styles` (use `currentColor` / class hooks -
you cannot put `var(--x)` in a presentation attribute, but you can in CSS).

## Worked example - `<deck-diagram kind="layers">`

Matches the stub in `slides/02-architecture.html`.

```js
// src/components/diagram/index.js
import { DeckElement } from '../deck-element.js';

class DeckDiagram extends DeckElement {
	static tag = 'deck-diagram';
	static observedAttributes = ['kind'];

	static styles = `
		:host { display: block; }
		svg { width: 100%; height: auto; font: inherit; }
		.box { fill: color-mix(in srgb, var(--accent) 10%, transparent); stroke: var(--accent); }
		.box.muted { fill: none; stroke: var(--surface-line); }
		.label { fill: var(--surface-fg); font-size: 16px; }
		.edge { stroke: var(--surface-line); stroke-width: 2; marker-end: url(#arrow); }
	`;

	render() {
		const kind = this.getAttribute('kind') || 'layers';
		const fn = this[`render_${kind}`] || this.render_layers;
		this.shadowRoot.append(fn.call(this));
	}

	attributeChangedCallback() {
		if (!this._upgraded) return;
		this.shadowRoot.querySelectorAll('svg').forEach((n) => n.remove());
		this.render();
	}

	render_layers() {
		const rows = ['slides/', 'components', 'semantic vars', 'primitives', 'reveal.js'];
		const svg = svgEl('svg', { viewBox: '0 0 400 260' });
		svg.innerHTML = `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
			markerWidth="6" markerHeight="6" orient="auto-start-reverse">
			<path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker></defs>`;
		rows.forEach((label, i) => {
			const y = 12 + i * 48;
			svg.append(svgEl('rect', { class: i === 0 ? 'box' : 'box muted', x: 40, y, width: 320, height: 36, rx: 6 }));
			const t = svgEl('text', { class: 'label', x: 200, y: y + 23, 'text-anchor': 'middle' });
			t.textContent = label;
			svg.append(t);
		});
		return svg;
	}
}

function svgEl(name, attrs = {}) {
	const el = document.createElementNS('http://www.w3.org/2000/svg', name);
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
	return el;
}

customElements.define(DeckDiagram.tag, DeckDiagram);
```

Slide: `<deck-diagram kind="layers"></deck-diagram>`

## Rules

- `viewBox` always; never a fixed pixel `width`/`height` on the `<svg>`.
- Colour/stroke through a CSS class in `static styles`, not a hard-coded hex and
  not a presentation attribute holding `var(...)` (that does not resolve).
- `<text>` fill = `var(--surface-fg)` / `var(--surface-fg-muted)` via a class.
- Keep one `render_<kind>()` per diagram; add kinds, do not fork the component.
- Genuinely reusable box/arrow CSS -> add it to `component-styles.md`.
