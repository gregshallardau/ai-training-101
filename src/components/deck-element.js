// One compiled CSSStyleSheet per subclass, cached and shared across every
// instance of that component - keyed by constructor, not by instance.
const styleSheets = new WeakMap();

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
 * Component CSS lives in Shadow DOM (`static styles`), applied via
 * `shadowRoot.adoptedStyleSheets` rather than an in-tree `<style>` child node -
 * deliberately, so a `render()` that does `this.shadowRoot.innerHTML = '...'`
 * (replacing the whole shadow tree, the natural thing to write) can never
 * accidentally delete the component's own styling along with it. The
 * framework's semantic CSS custom properties still reach it either way,
 * because custom properties inherit through the shadow boundary - so a
 * component reads `var(--primary)` etc. directly. A class selector
 * (`.chip { ... }` in deck.css) does NOT reach through - prepend
 * `SHARED_STYLES` from `./shared-styles.js` for that shared vocabulary.
 *
 * Subclasses:
 *   - set `static tag` and `static styles` (usually `` `${SHARED_STYLES} ...` ``)
 *   - implement `render()` (append nodes to `this.shadowRoot`, or replace
 *     `this.shadowRoot.innerHTML` wholesale - either is safe)
 *   - keep `connectedCallback` idempotent (Reveal relocates slide nodes in the DOM)
 */
export class DeckElement extends HTMLElement {
	/** Custom-element tag name, e.g. 'deck-hero-title'. Subclass overrides. */
	static tag = 'deck-element';

	/** Component-scoped CSS string, applied via adoptedStyleSheets. Subclass overrides. */
	static styles = '';

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		if (this._upgraded) return; // idempotent: Reveal moves sections around
		this.shadowRoot.adoptedStyleSheets = [this._sheet()];
		this.render();
		this._upgraded = true;
	}

	_sheet() {
		const ctor = this.constructor;
		if (!styleSheets.has(ctor)) {
			const sheet = new CSSStyleSheet();
			sheet.replaceSync(ctor.styles);
			styleSheets.set(ctor, sheet);
		}
		return styleSheets.get(ctor);
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

	/**
	 * Resolve a CSS custom property to an actual px number. `cssVar` returns
	 * the literal authored text (e.g. "0.375rem" for `--radius-control`) -
	 * correct to drop into more CSS, useless as a number for path/scale math.
	 * A transient probe element gets the browser's own unit resolution
	 * (`rem` against the document root's font-size, `em` against `el`'s -
	 * either needs an element actually in that context, a plain calculation
	 * can't replicate it since --text-root-size varies per deck).
	 */
	cssVarPx(name, el = this) {
		const raw = this.cssVar(name, el);
		if (!raw) return 0;
		const probe = document.createElement('div');
		probe.style.cssText = `position:absolute; visibility:hidden; height:0; width:${raw};`;
		el.appendChild(probe);
		const px = parseFloat(getComputedStyle(probe).width) || 0;
		probe.remove();
		return px;
	}
}
