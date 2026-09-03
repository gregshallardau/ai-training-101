/**
 * Single module entry for the framework.
 *   styles -> component registry -> Reveal (+ plugins) -> library bootstrapping
 *
 * Loaded from index.html via <script type="module" src="/src/main.js">.
 * Deck-author Reveal knobs (size, transition, slide numbers...) live in the
 * root-level deck.config.js; plugins and bootstrap stay here as machinery.
 */
import '/src/styles/index.css';
import '@/components/registry.js';

import Reveal from 'reveal.js';
import RevealNotes from 'reveal.js/plugin/notes';
import RevealMarkdown from 'reveal.js/plugin/markdown';

import deckConfig from '/deck.config.js';
import { initGsap } from '@/lib/gsap.js';
import { initAlpine } from '@/lib/alpine.js';
// d3.js is imported lazily by the components that use it.

const deck = new Reveal({
	...deckConfig,
	plugins: [RevealNotes, RevealMarkdown],
});

deck.initialize().then(() => {
	initGsap();
	initAlpine();
});

window.Reveal = deck;
