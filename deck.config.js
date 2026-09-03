/*
 * deck.config.js - the deck author's Reveal.js knobs.
 * ============================================================================
 *
 * Everything under src/ is framework machinery you never edit. This file, like
 * deck.css, is a root-level surface you tune per deck. src/main.js imports it
 * and passes it to Reveal; plugins and bootstrapping stay in src/.
 *
 * Full option list: https://revealjs.com/config/
 */
export default {
	/* Slide coordinate space. Reveal scales the whole deck to fit the viewport;
	   these numbers are what you author against. 1920x1080 = true 16:9.
	   NOTE: --text-root-size (deck.css) is a fixed px value in THIS space, so a
	   taller space makes text look smaller - bump --text-root-size to match. */
	width: 1920,
	height: 1080,

	/* Slide numbers: false | 'c' | 'c/t' | 'h.v' | 'h/v'.
	   Reveal draws them bottom-right on a translucent-black fill; restyle with
	   `.reveal .slide-number { ... }` in deck.css. */
	slideNumber: false,

	/* Default slide transition:
	   'slide' | 'none' | 'fade' | 'convex' | 'concave' | 'zoom'
	   Override on one slide with data-transition (HTML) or
	   `<!-- .slide: data-transition="fade" -->` (Markdown). */
	transition: 'slide',

	/* Put #/<slug> in the URL bar and restore position on reload. */
	hash: true,

	/* Type a slide number then Enter to jump straight to it. */
	jumpToSlide: true,
};
