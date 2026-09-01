/**
 * Template for src/components/<name>/index.js
 *
 * Replace <Name> (PascalCase), <name> (kebab). Keep it to ONE component per file.
 * Consume SEMANTIC custom properties only - var(--surface-*), var(--accent*),
 * var(--space-*), var(--radius-*), var(--motion-*), var(--font-*) - plus Reveal's
 * var(--r-*). Never a tier-1 primitive, never a raw colour / length literal.
 */
import { DeckElement } from '../deck-element.js';
// import { d3 } from '@/lib/d3.js';   // lazy libs only when actually needed
// import { gsap } from '@/lib/gsap.js';

class Deck<Name> extends DeckElement {
	static tag = 'deck-<name>';

	/** attributes that trigger a re-render when changed */
	static observedAttributes = [/* 'kind', 'label' */];

	static styles = `
		:host {
			display: block;
			color: var(--surface-fg);
		}
		.root {
			gap: var(--space-gap);
			border-radius: var(--radius-card);
			transition: opacity var(--motion-ui-duration) var(--motion-ui-ease);
		}
	`;

	render() {
		const root = document.createElement('div');
		root.className = 'root';
		root.textContent = this.getAttribute('label') ?? '';
		this.shadowRoot.append(root);
	}

	attributeChangedCallback() {
		if (!this._upgraded) return;
		this.shadowRoot.querySelectorAll('.root').forEach((n) => n.remove());
		this.render();
	}
}

customElements.define(Deck<Name>.tag, Deck<Name>);
