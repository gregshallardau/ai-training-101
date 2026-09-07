/**
 * Canonical component manifest + barrel.
 *
 * COMPONENTS is auto-discovered from the repo-root `components/` folder - a
 * `<deck-*>` implementation is registered the moment its folder exists there;
 * there is nothing to hand-edit here. This file is framework machinery
 * (src/components/) and does not move; the implementations it discovers live
 * in the root-level `components/` (deck-author content, alongside slides/).
 *
 * Vite's import.meta.glob with `eager: true` imports every matching module at
 * build time, so each component's index.js runs its
 * `customElements.define(...)` exactly as if it had been imported by hand.
 * `/components/*\/index.js` is resolved relative to the project root (the
 * leading `/`), not to this file's location.
 *
 * Imported once from src/main.js.
 */
import { DeckElement } from './deck-element.js';

const modules = import.meta.glob('/components/*/index.js', { eager: true });

/** @type {Record<string, { tag: string }>} key = kebab component name */
export const COMPONENTS = Object.fromEntries(
	Object.keys(modules).map((path) => {
		const name = path.split('/').at(-2);
		return [name, { tag: `deck-${name}` }];
	})
);

/** Dev sanity check: every discovered component actually defined a custom element. */
export function assertRegistered() {
	for (const { tag } of Object.values(COMPONENTS)) {
		if (!customElements.get(tag)) {
			console.warn(`[registry] "${tag}" was found under components/ but never called customElements.define`);
		}
	}
}

export { DeckElement };
