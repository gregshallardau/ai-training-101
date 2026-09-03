// src/components/ideas-map/index.js
import { DeckElement } from '../deck-element.js';
import { d3 } from '@/lib/d3.js';
import { W, H } from './dataset.js';

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
	`;

	render() {
		const svg = d3.select(this.shadowRoot)
			.append('svg')
			.attr('viewBox', `0 0 ${W} ${H}`)
			.attr('role', 'img')
			.attr('aria-label', this.getAttribute('label') || 'ideas in space');
		svg.append('title').text(this.getAttribute('label') || 'ideas in space');
		svg.append('g').attr('class', 'view');
	}
}

customElements.define(DeckIdeasMap.tag, DeckIdeasMap);
