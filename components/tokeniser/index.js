/**
 * <deck-tokeniser> - a plain sentence, tokenised into chips that pop in one
 * at a time. Static content for this deck's beat - no attributes, no
 * interaction; the stagger-in on connect is the whole effect.
 */
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';

const TOKENS = ['The', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog'];

class DeckTokeniser extends DeckElement {
	static tag = 'deck-tokeniser';

	static styles = `
		${SHARED_STYLES}

		/* ---- this component's own bit: always primary-tinted, pops in on
		   connect, laid out as a wrapping chip row */
		.chip {
			border-color: var(--primary);
			background: color-mix(in srgb, var(--primary) 14%, transparent);
			animation: pop var(--motion-ui-duration) var(--motion-ui-ease) both;
		}
		.line { display: flex; flex-wrap: wrap; gap: var(--space-gap); margin-block: var(--space-block); min-height: 1.8em; }
		@keyframes pop { from { opacity: 0; transform: translateY(0.3em); } }
	`;

	render() {
		const line = document.createElement('div');
		line.className = 'line';
		TOKENS.forEach((tok, i) => {
			const chip = document.createElement('span');
			chip.className = 'chip';
			chip.textContent = tok;
			chip.style.animationDelay = `${i * 0.1}s`;
			line.append(chip);
		});
		this.shadowRoot.append(line);
	}
}

customElements.define(DeckTokeniser.tag, DeckTokeniser);
