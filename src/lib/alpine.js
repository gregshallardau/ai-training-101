/**
 * Alpine.js integration - lightweight reactive UI state (toggles, click-to-reveal)
 * and cross-slide shared state.
 *
 * The deck is one continuously-loaded document (Reveal keeps every <section> in the
 * DOM), so `Alpine.store('deck', ...)` gives state that persists across slides -
 * e.g. a poll answer captured on slide 2 and shown again on slide 15.
 */
import Alpine from 'alpinejs';

export function initAlpine() {
	if (window.Alpine) return window.Alpine;
	window.Alpine = Alpine;

	Alpine.store('deck', {
		// shared reactive state lives here
	});

	Alpine.start();
	return Alpine;
}

export { Alpine };
