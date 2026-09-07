/**
 * Shared component style vocabulary - THE single source of truth.
 *
 * Shadow DOM does not inherit class-selector rules from deck.css (only
 * inherited CSS properties and custom properties cross that boundary), so
 * every <deck-*> component needs its own copy of .chip / .box / .btn / etc.
 * to read as one visual language. That copy lives HERE, once - a component
 * imports SHARED_STYLES and concatenates it into `static styles`; it never
 * retypes these rules. Change a rule here and every component picks it up
 * the next time it (re)connects - no per-component hunt-and-fix.
 *
 * Semantic custom properties only (same tier-2 set deck.css itself reads),
 * so this still follows a [data-theme] re-skin. Documented for humans in
 * `.claude/skills/artefact-builder/reference/component-styles.md`.
 */
export const SHARED_STYLES = `
	:host { display: block; color: var(--fg); font: inherit; }

	.btn {
		font: inherit;
		padding: var(--space-gap) var(--space-inline);
		border: 0;
		border-radius: var(--radius-control);
		background: var(--c, var(--primary));
		color: var(--c-fg, var(--primary-fg));
		cursor: pointer;
		transition: opacity var(--motion-ui-duration) var(--motion-ui-ease);
	}
	.btn:hover { opacity: 0.9; }
	.btn:disabled { opacity: 0.4; cursor: default; }
	.btn.ghost {
		background: transparent;
		color: var(--c, var(--primary));
		border: 1px solid var(--line);
	}

	/* SHARED-VOCAB:start colour-modifiers */
	/* bare colour modifiers - class="chip primary", class="box bar danger" */
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

	/* SHARED-VOCAB:start chip */
	.chip {
		display: inline-block;
		padding: 0.1em 0.5em;
		margin: 0.12em 0.2em 0.12em 0;
		border-radius: var(--radius-control);
		border: 1px solid var(--c, var(--line));
		background: color-mix(in srgb, var(--c, var(--muted)) 12%, transparent);
		background-clip: padding-box;
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

	/* a wrapping row of .chip pills - tokeniser, attention flow, any
	   per-item chip stream. Component-only, no deck.css counterpart. Do not
	   re-declare this per component. */
	.token-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-gap);
		margin-block: var(--space-block);
		min-height: 1.8em;
	}

	.note { color: var(--muted); }
	.text-primary { color: var(--primary); }
	.text-muted { color: var(--muted); }
	.text-center { text-align: center; }

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

	/* SHARED-VOCAB:start box */
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

	.row { display: flex; gap: var(--space-gap); flex-wrap: wrap; align-items: center; }
	.col { display: flex; gap: var(--space-gap); flex-direction: column; }

	/* fixed N equal-width panels - different from .row (wraps, no forced
	   equal width). Matches deck.css's .flex-cols / .flex-rows exactly. */
	.flex-cols, .flex-rows { display: flex; gap: var(--space-block); max-width: none; }
	.flex-cols { flex-direction: row; }
	.flex-rows { flex-direction: column; }
	.flex-cols > * { flex: 1; }

	.list-compact li + li { margin-top: 0; }

	.columns, .columns-3 { max-width: none; column-gap: var(--space-block); }
	.columns { columns: 2; column-gap: calc(var(--space-block) * 1.5); }
	.columns-3 { columns: 3; }
	:is(.columns, .columns-3) > * { break-inside: avoid; }
	:is(.columns, .columns-3) dt { break-after: avoid; }
`;
