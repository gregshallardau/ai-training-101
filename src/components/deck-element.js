/**
 * Base class for every canonical deck component.
 *
 * This file is framework machinery (src/components/) - the actual <deck-*>
 * implementations are deck-author content and live in the root-level
 * components/ folder; they import this as `@/components/deck-element.js`.
 *
 * ONE definition per component. Slides place a <deck-*> tag and pass data via
 * attributes / slots - they never write <style>, never inline style (beyond
 * Reveal's own positioning data-attributes), never re-declare markup.
 *
 * Component CSS lives in Shadow DOM (`static styles`). The framework's semantic
 * CSS custom properties still reach it because custom properties inherit through
 * the shadow boundary - so a component reads `var(--primary)` etc. directly.
 * A class selector (`.chip { ... }` in deck.css) does NOT reach through -
 * prepend `SHARED_STYLES` from `./shared-styles.js` for that shared vocabulary.
 *
 * Subclasses:
 *   - set `static tag` and `static styles` (usually `` `${SHARED_STYLES} ...` ``)
 *   - implement `render()` (append nodes to `this.shadowRoot`)
 *   - keep `connectedCallback` idempotent (Reveal relocates slide nodes in the DOM)
 */
export class DeckElement extends HTMLElement {
	/** Custom-element tag name, e.g. 'deck-hero-title'. Subclass overrides. */
	static tag = 'deck-element';

	/** Component-scoped CSS string, injected into Shadow DOM. Subclass overrides. */
	static styles = '';

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		if (this._upgraded) return; // idempotent: Reveal moves sections around
		this.shadowRoot.innerHTML = `<style>${this.constructor.styles}</style>`;
		this.render();
		this._upgraded = true;
	}

	/** Subclass appends its DOM to `this.shadowRoot` here. */
	render() {}

	/**
	 * Resolve a CSS custom property from this element's computed style
	 * (pierces the shadow boundary). Use for JS that needs a live value,
	 * e.g. feeding a colour into a canvas or a D3 scale.
	 */
	cssVar(name, el = this) {
		return getComputedStyle(el).getPropertyValue(name).trim();
	}
}
