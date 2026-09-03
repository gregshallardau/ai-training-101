/**
 * Canonical component manifest + barrel.
 *
 * Every deck component is imported here exactly once and listed in COMPONENTS.
 * This file is the SINGLE SOURCE OF TRUTH for "which components exist" - tooling
 * (the artefact-builder skill) answers that question by reading this file alone,
 * and refuses to redefine anything already listed.
 *
 * Imported once from src/main.js. Each component's index.js self-registers via
 * customElements.define() on import.
 */
import { DeckElement } from './deck-element.js';

// --- component imports (each self-registers) ------------------------------------
import './glossary/index.js';
// import './hero-title/index.js';
// import './choropleth-map/index.js';

/**
 * @type {Record<string, { tag: string, dir: string }>}
 * key = kebab component name, dir = folder under src/components/
 */
export const COMPONENTS = {
	'glossary': { tag: 'deck-glossary', dir: 'glossary' },
	// 'hero-title':     { tag: 'deck-hero-title',     dir: 'hero-title' },
	// 'choropleth-map': { tag: 'deck-choropleth-map', dir: 'choropleth-map' },
};

/** Dev sanity check: every listed component actually defined a custom element. */
export function assertRegistered() {
	for (const { tag } of Object.values(COMPONENTS)) {
		if (!customElements.get(tag)) {
			console.warn(`[registry] "${tag}" is listed in COMPONENTS but not defined`);
		}
	}
}

export { DeckElement };
