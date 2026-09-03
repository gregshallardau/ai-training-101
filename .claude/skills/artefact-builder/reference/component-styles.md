# Shared component style vocabulary

Every `<deck-*>` draws from **this** set. Do not invent a per-artefact class
pile (`.w-btn`, `.tk`, `.ts-tab`, `.bar-fill` ...). Copy the pieces you need into
the component's `static styles`, keep the class names, restyle only through the
semantic custom properties.

All values are semantic custom properties - they inherit through the shadow
boundary and follow a `[data-theme]` re-skin for free.

```css
/* ---- host ------------------------------------------------------------- */
:host {
	display: block;
	color: var(--surface-fg);
	font: inherit;
}

/* ---- button --------------------------------------------------------- */
.btn {
	font: inherit;
	padding: var(--space-gap) var(--space-inline);
	border: 0;
	border-radius: var(--radius-control);
	background: var(--accent);
	color: var(--accent-fg);
	cursor: pointer;
	transition: opacity var(--motion-ui-duration) var(--motion-ui-ease);
}
.btn:hover { opacity: 0.9; }
.btn:disabled { opacity: 0.4; cursor: default; }
.btn.secondary {
	background: transparent;
	color: var(--accent);
	border: 1px solid var(--surface-line);
}

/* ---- chip / token pill -------------------------------------------------- */
.chip {
	display: inline-block;
	padding: 0.15em 0.5em;
	border-radius: var(--radius-round);
	border: 1px solid var(--accent);
	background: color-mix(in srgb, var(--accent) 14%, transparent);
	color: var(--surface-fg);
}
.chip.ragged {                 /* "the model barely saw this" variant */
	border-color: var(--surface-line);
	background: color-mix(in srgb, var(--surface-fg-muted) 12%, transparent);
}

/* ---- muted note / caption ------------------------------------------- */
.note { color: var(--surface-fg-muted); }

/* ---- meter (confidence / progress bar) ------------------------------- */
.meter {
	height: 0.5em;
	border-radius: var(--radius-round);
	background: var(--surface-line);
	overflow: hidden;
}
.meter > .fill {
	height: 100%;
	background: var(--accent);
	transition: width var(--motion-ui-duration) var(--motion-ui-ease);
}

/* ---- card / panel (same as the deck.css .box utility) ---------------- */
.card {
	border: 1px solid var(--surface-line);
	border-radius: var(--radius-card);
	padding: var(--space-block);
}

/* ---- row / column layout ------------------------------------------- */
.row { display: flex; gap: var(--space-gap); flex-wrap: wrap; align-items: center; }
.col { display: flex; gap: var(--space-gap); flex-direction: column; }
```

If a genuinely new primitive is needed (a shape these can't express), add it
here in the same semantic-var style so the next artefact reuses it - never as a
one-off literal inside a component.
