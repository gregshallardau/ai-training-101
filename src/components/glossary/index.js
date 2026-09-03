/**
 * deck-glossary — the running glossary of the deck, in the "reference card" style.
 *
 * A left-aligned editorial two-column glossary. Each entry is a bold term, an
 * em dash, then a muted plain-English definition. A thin vertical hairline
 * separates the two columns; thin rules and small-caps chrome frame it. No card
 * boxes, no emoji, no filler.
 *
 * Reveal behaviour: a term whose id is listed in the `revealed` attribute is
 * listed; any term not yet introduced is simply omitted (nothing spoils, nothing
 * is faked). With no `revealed` attribute every term is listed — the final,
 * complete glossary.
 *
 * Slide use: <deck-glossary revealed="token vector weight"></deck-glossary>
 *
 * Content lives here (one place to edit a term or its wording) so every glossary
 * slide stays in sync. Styling consumes semantic CSS custom properties only.
 */
import { DeckElement } from '../deck-element.js';

/** id: used in the `revealed` attribute; order = introduction order. */
const TERMS = [
	{ id: 'token', term: 'Token', def: 'a chunk of text. A word.' },
	{ id: 'vector', term: 'Vector', def: 'a direction and a distance. Similar words (or ideas) point the same way.' },
	{ id: 'weight', term: 'Weight', def: 'a dial. How strongly two tokens are connected.' },
	{ id: 'model', term: 'Model', def: 'all the dial positions together. The complete knowledge.' },
	{ id: 'prompt', term: 'Prompt', def: 'what you type. Where you start.' },
	{ id: 'context', term: 'Context', def: 'everything that came before. The situation around the words.' },
	{ id: 'llm', term: 'Large Language Model', def: 'a model trained on a huge amount of text and conversation.' },
	{ id: 'multi-modal', term: 'Multi-Modal', def: 'reads more than words — pictures, voice, files too.' },
	{ id: 'system-prompt', term: 'System Prompt', def: 'the instructions the tool gives itself before you type.' },
	{ id: 'prompt-engineering', term: 'Prompt Engineering', def: 'the old art of wording the perfect question.' },
	{ id: 'context-engineering', term: 'Context Engineering', def: 'the new skill: bringing who you are and what you need to the question.' },
	{ id: 'hallucination', term: 'Hallucination', def: 'when it makes things up — sure of itself.' },
];

class DeckGlossary extends DeckElement {
	static tag = 'deck-glossary';

	/** the listed term ids, space-separated; absent/empty = every term listed */
	static observedAttributes = ['revealed'];

	static styles = `
		:host {
			display: block;
			color: var(--surface-fg);
			font-family: var(--font-body);
		}
		.book {
			font-size: 0.6em;
		}
		.rule {
			border: 0;
			border-top: thin solid var(--surface-line);
			margin: 0 0 var(--space-block);
		}
		.cols {
			columns: 1;
		}
		/* Fuller glossaries flow into two columns with a hairline between. */
		.cols.two {
			columns: 2;
			column-gap: calc(var(--space-inline) * 2.5);
			column-rule: thin solid var(--surface-line);
		}
		.entry {
			break-inside: avoid;
			margin: 0 0 calc(var(--space-block) * 0.8);
			line-height: 1.4;
		}
		.term {
			font-family: var(--font-heading);
			font-weight: 700;
		}
		.dash {
			color: var(--surface-fg-muted);
		}
		.def {
			color: var(--surface-fg-muted);
		}
		.foot {
			margin: var(--space-block) 0 0;
			font-variant: small-caps;
			letter-spacing: 0.08em;
			font-size: 0.75em;
			color: var(--surface-fg-muted);
		}
	`;

	/** Which term ids are listed right now. null = every term (final glossary). */
	revealedSet() {
		const raw = (this.getAttribute('revealed') ?? '').trim();
		return raw ? new Set(raw.split(/\s+/)) : null;
	}

	render() {
		const revealed = this.revealedSet();

		const top = document.createElement('hr');
		top.className = 'rule';

		const cols = document.createElement('div');
		cols.className = 'cols';

		let listed = 0;
		for (const card of TERMS) {
			if (revealed !== null && !revealed.has(card.id)) continue; // not introduced yet

			const entry = document.createElement('p');
			entry.className = 'entry';

			const term = document.createElement('span');
			term.className = 'term';
			term.textContent = card.term;

			const dash = document.createElement('span');
			dash.className = 'dash';
			dash.textContent = ' — ';

			const def = document.createElement('span');
			def.className = 'def';
			def.textContent = card.def;

			entry.append(term, dash, def);
			cols.append(entry);
			listed++;
		}

		// Two columns once the list is full enough to warrant the hairline rule;
		// early reveal slides stay a single column rather than a half-empty pane.
		if (listed >= 6) cols.classList.add('two');

		const foot = document.createElement('p');
		foot.className = 'foot';
		foot.textContent = 'Reference · Glossary';

		const book = document.createElement('div');
		book.className = 'book';
		book.append(top, cols, foot);

		this.shadowRoot.append(book);
	}

	attributeChangedCallback() {
		if (!this._upgraded) return;
		this.shadowRoot.querySelectorAll('.book').forEach((n) => n.remove());
		this.render();
	}
}

customElements.define(DeckGlossary.tag, DeckGlossary);
