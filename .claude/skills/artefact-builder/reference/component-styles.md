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
	color: var(--fg);
	font: inherit;
}

/* ---- button --------------------------------------------------------- */
.btn {
	font: inherit;
	padding: var(--space-gap) var(--space-inline);
	border: 0;
	border-radius: var(--radius-control);
	background: var(--primary);
	color: var(--primary-fg);
	cursor: pointer;
	transition: opacity var(--motion-ui-duration) var(--motion-ui-ease);
}
.btn:hover { opacity: 0.9; }
.btn:disabled { opacity: 0.4; cursor: default; }
.btn.ghost {
	background: transparent;
	color: var(--primary);
	border: 1px solid var(--line);
}

/* ---- colour modifiers ------------------------------------------------- */
/* Same as deck.css: a bare class picks a colour into --c / --c-fg, every
   block below reads that pair. `class="chip primary"`, `class="chip danger"`. */
.primary   { --c: var(--primary);   --c-fg: var(--primary-fg); }
.secondary { --c: var(--secondary); --c-fg: var(--secondary-fg); }
.success   { --c: var(--success);   --c-fg: var(--success-fg); }
.danger    { --c: var(--danger);    --c-fg: var(--danger-fg); }
.warning   { --c: var(--warning);   --c-fg: var(--warning-fg); }

/* ---- chip / token pill -------------------------------------------------- */
/* Same vocabulary as the slide-level .chip in deck.css. Neutral outline by
   default; a colour modifier makes it a solid fill. .muted is the greyed
   variant. A component may add a domain alias (.chip.ragged { } for a
   "barely-seen token") on top. */
.chip {
	display: inline-block;
	padding: 0.15em 0.5em;
	border-radius: var(--radius-control);
	border: 1px solid var(--c, var(--line));
	background: color-mix(in srgb, var(--c, var(--muted)) 12%, transparent);
	color: var(--fg);
}
.chip:is(.primary, .secondary, .success, .danger, .warning) {
	background: var(--c);
	color: var(--c-fg);
}
.chip.muted {
	border-color: var(--line);
	background: color-mix(in srgb, var(--muted) 10%, transparent);
	color: var(--muted);
}

/* ---- muted note / caption ------------------------------------------- */
.note { color: var(--muted); }

/* ---- meter (confidence / progress bar) ------------------------------- */
.meter {
	height: 0.5em;
	border-radius: var(--radius-round);
	background: var(--line);
	overflow: hidden;
}
.meter > .fill {
	height: 100%;
	background: var(--primary);
	transition: width var(--motion-ui-duration) var(--motion-ui-ease);
}

/* ---- box / panel (same as the deck.css .box utility) ---------------- */
/* White & borderless by default; add .border, a colour modifier (tinted
   fill), or .bar (thick left bar). */
.box {
	padding: var(--space-block);
	border-radius: var(--radius-card);
	background: var(--bg);
	color: var(--fg);
}
.box.border { border: 1px solid var(--c, var(--line)); }
.box:is(.primary, .secondary, .success, .danger, .warning) {
	background: color-mix(in srgb, var(--c) 8%, var(--bg));
}
.box.bar {
	border: 0; border-radius: 0; background: none;
	border-left: 4px solid var(--c, var(--line));
	padding-left: var(--space-inline);
}

/* ---- row / column layout ------------------------------------------- */
.row { display: flex; gap: var(--space-gap); flex-wrap: wrap; align-items: center; }
.col { display: flex; gap: var(--space-gap); flex-direction: column; }
```

If a genuinely new primitive is needed (a shape these can't express), add it
here in the same semantic-var style so the next artefact reuses it - never as a
one-off literal inside a component.
