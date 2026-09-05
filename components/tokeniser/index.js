/**
 * <deck-tokeniser> - a plain sentence, tokenised into chips one at a time
 * when the "Tokenise" button fires.
 *
 * Default sentence below, used when a slide doesn't pass its own `data="..."`
 * attribute (see DeckTokeniser._readData). To use a different sentence on a
 * slide WITHOUT touching this file:
 *
 *   <deck-tokeniser data='{ "tokens": ["Allied", "Health", "Guard"] }'></deck-tokeniser>
 */
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';

const DEFAULT_TOKENS = ['The', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog'];

// waits for window.Reveal (set by main.js after deck.initialize()), then runs fn once
function whenReveal(fn) {
	if (window.Reveal) return fn(window.Reveal);
	const t = setInterval(() => {
		if (window.Reveal) { clearInterval(t); fn(window.Reveal); }
	}, 30);
}

class DeckTokeniser extends DeckElement {
	static tag = 'deck-tokeniser';

	static styles = `
		${SHARED_STYLES}

		/* ---- this component's own bit: always primary-tinted, pops in on
		   click, laid out as a wrapping chip row */
		.chip {
			border-color: var(--primary);
			background: color-mix(in srgb, var(--primary) 14%, transparent);
			animation: pop var(--motion-ui-duration) var(--motion-ui-ease) both;
		}
		.line { display: flex; flex-wrap: wrap; gap: var(--space-gap); margin-block: var(--space-block); min-height: 1.8em; }
		@keyframes pop { from { opacity: 0; transform: translateY(0.3em); } }
	`;

	// a `data="..."` attribute on the tag is a { tokens } document overriding
	// DEFAULT_TOKENS above - same convention as <deck-ideas-map>'s `data` and
	// <deck-attention-flow>'s `data`.
	_readData() {
		try {
			const parsed = JSON.parse(this.getAttribute('data') || 'null');
			if (parsed?.tokens) return parsed.tokens;
		} catch {
			// malformed data attribute - fall through to the built-in default
		}
		return DEFAULT_TOKENS;
	}

	render() {
		const TOKENS = this._readData();
		const line = document.createElement('div');
		line.className = 'line';
		const words = TOKENS.map((tok) => {
			const span = document.createElement('span');
			span.textContent = tok;
			span.style.paddingTop = '0.2em';
			span.className = 'text-primary';
			line.append(span);
			return span;
		});

		const btn = document.createElement('button');
		btn.className = 'btn success';
		btn.textContent = 'Tokenise';
		btn.addEventListener('click', () => {
			btn.disabled = false;
			words.forEach((span, i) => {
				setTimeout(() => {
					span.classList.add('chip', 'primary');
					span.style.paddingTop = '0em';
				}, i * 100);
			});
		});

		const row = document.createElement('div');
		row.className = 'row';
		row.append(btn);

		this.shadowRoot.append(line, row);

		// leaving this slide, or stepping back past it as a fragment, resets
		// the demo - so returning to it (from either direction) always starts
		// from the plain sentence again
		const reset = () => words.forEach((span) => span.classList.remove('chip', 'primary'));
		whenReveal((Reveal) => {
			Reveal.on('slidechanged', (e) => {
				if (!e.currentSlide.contains(this)) reset();
			});
			Reveal.on('fragmenthidden', (e) => {
				if (e.fragment === this) reset();
			});
		});
	}
}

customElements.define(DeckTokeniser.tag, DeckTokeniser);
