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
/* SHARED-VOCAB:start colour-modifiers */
/* Same as deck.css: a bare class picks a colour into --c / --c-fg, every
   block below reads that pair. `class="chip primary"`, `class="chip danger"`. */
.primary   { --c: var(--primary);   --c-fg: var(--primary-fg); }
.secondary { --c: var(--secondary); --c-fg: var(--secondary-fg); }
.success   { --c: var(--success);   --c-fg: var(--success-fg); }
.danger    { --c: var(--danger);    --c-fg: var(--danger-fg); }
.warning   { --c: var(--warning);   --c-fg: var(--warning-fg); }

/* Topic legend - mirrors whatever --topic-<name> pairs the deck's own
   deck.css has defined (see its TOPIC COLOURS section). Uncomment the
   matching lines here so a component can render a topic-tinted
   chip/box too - the values pierce the shadow boundary on their own,
   only the selector shape needs mirroring. */
/* [data-topic="inference"] { --c: var(--topic-inference); --c-fg: var(--topic-inference-fg); } */
/* [data-topic="training"]  { --c: var(--topic-training);  --c-fg: var(--topic-training-fg); } */
/* [data-topic="safety"]    { --c: var(--topic-safety);    --c-fg: var(--topic-safety-fg); } */
/* SHARED-VOCAB:end */

/* ---- chip / token pill -------------------------------------------------- */
/* SHARED-VOCAB:start chip */
/* Same vocabulary as the slide-level .chip in deck.css. Neutral outline by
   default; a colour modifier makes it a solid fill. .muted is the greyed
   variant. Gets the same ambient hover lift as .box - no modifier needed.
   A component may add a domain alias (.chip.ragged { } for a "barely-seen
   token") on top. */
.chip {
	display: inline-block;
	padding: 0.1em 0.5em;
	margin: 0.12em 0.2em 0.12em 0; /* gap between chips + wrapped rows */
	border-radius: var(--radius-control);
	border: 1px solid var(--c, var(--line));
	background: color-mix(in srgb, var(--c, var(--muted)) 12%, transparent);
	color: var(--fg);
	transition: box-shadow var(--motion-ui-duration) var(--motion-ui-ease);
}
.chip:hover {
	box-shadow: 0 0.2em 0.5em -0.2em color-mix(in srgb, var(--c, var(--fg)) 45%, transparent);
}
@media (prefers-reduced-motion: no-preference) {
	.chip {
		transition: transform var(--motion-ui-duration) var(--motion-ui-ease),
			box-shadow var(--motion-ui-duration) var(--motion-ui-ease);
	}
	.chip:hover {
		transform: translateY(-0.1em);
	}
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
/* SHARED-VOCAB:end */

/* ---- token row (a wrapping sequence of .chip pills - tokeniser, attention
   flow, any per-item chip stream. Component-only, no deck.css counterpart -
   a slide never needs a bare row of chips outside a component. Do not
   re-declare this per component - it is the exact rule deck-tokeniser and
   deck-attention-flow each independently reinvented as `.line` before this
   existed.) ------------------------------------------------------------- */
.token-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--space-gap);
	margin-block: var(--space-block);
	min-height: 1.8em; /* holds its height before chips render / when empty */
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
/* SHARED-VOCAB:start box */
/* White & borderless by default; add .border, a colour modifier (tinted
   fill), .bar (thick left bar), .interactive (clickable - cursor + stronger
   hover), .selected (persistent "picked" state, set by JS), or .compact
   (tighter padding/margin for dense rows). Gets the same ambient hover lift
   as .chip - no modifier needed. */
.box {
	padding: var(--space-block);
	border-radius: var(--radius-card);
	background: var(--bg);
	color: var(--fg);
	margin-block: var(--space-block);
	max-width: none;
	transition: box-shadow var(--motion-ui-duration) var(--motion-ui-ease);
}
.box:hover {
	box-shadow: 0 0.5em 1.2em -0.5em color-mix(in srgb, var(--fg) 35%, transparent);
}
@media (prefers-reduced-motion: no-preference) {
	.box {
		transition: transform var(--motion-ui-duration) var(--motion-ui-ease),
			box-shadow var(--motion-ui-duration) var(--motion-ui-ease);
	}
	.box:hover {
		transform: translateY(-0.15em);
	}
}
.box > :first-child { margin-top: 0; }
.box > :last-child { margin-bottom: 0; }
.box > .box,
.box > .token-row {
	margin-block: var(--space-gap);
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
.box.compact {
	padding: var(--space-gap);
	margin-block: var(--space-gap);
}
.box.interactive { cursor: pointer; }
.box.interactive:hover {
	box-shadow: 0 0.6em 1.4em -0.4em color-mix(in srgb, var(--c, var(--fg)) 45%, transparent);
}
.box.selected {
	border: 2px solid var(--c, var(--primary));
	background: color-mix(in srgb, var(--c, var(--primary)) 14%, var(--bg));
}
/* SHARED-VOCAB:end */

/* ---- row / column layout ------------------------------------------- */
.row { display: flex; gap: var(--space-gap); flex-wrap: wrap; align-items: center; }
.col { display: flex; gap: var(--space-gap); flex-direction: column; }
```

If a genuinely new primitive is needed (a shape these can't express), add it
here in the same semantic-var style so the next artefact reuses it - never as a
one-off literal inside a component.
