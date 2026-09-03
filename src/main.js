/**
 * Single module entry for the framework.
 *   styles -> component registry -> Reveal (+ plugins) -> library bootstrapping
 *
 * Loaded from index.html via <script type="module" src="/src/main.js">.
 */
import '/src/styles/index.css';
import '@/components/registry.js';

import Reveal from 'reveal.js';
import RevealNotes from 'reveal.js/plugin/notes';
import RevealMarkdown from 'reveal.js/plugin/markdown';

import { initGsap } from '@/lib/gsap.js';
import { initAlpine } from '@/lib/alpine.js';
// d3.js is imported lazily by the components that use it.

const deck = new Reveal({
	hash: true,
	jumpToSlide: true,
	// Coordinate space slides are authored against (true 16:9 / 1080p).
	// Reveal scales the whole deck to fit the viewport. Note: --text-root-size
	// is a fixed px value in this space, so a taller space => visually smaller
	// text; adjust --text-root-size in deck.css if you change these.
	width: 1920,
	height: 1080,
	// Slide numbers off by default. Reveal renders them as a small box bottom-
	// right (its own `.slide-number` style: monospace on a translucent-black
	// fill). Turn on per deck with e.g. slideNumber: 'c/t' (current/total),
	// 'c', or 'h.v'; restyle via `.reveal .slide-number { ... }` in deck.css.
	slideNumber: false,
	plugins: [RevealNotes, RevealMarkdown],
});

deck.initialize().then(() => {
	initGsap();
	initAlpine();
});

window.Reveal = deck;
