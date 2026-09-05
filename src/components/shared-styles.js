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

	/* bare colour modifiers - class="chip primary", class="box bar danger" */
	.primary   { --c: var(--primary);   --c-fg: var(--primary-fg); }
	.secondary { --c: var(--secondary); --c-fg: var(--secondary-fg); }
	.success   { --c: var(--success);   --c-fg: var(--success-fg); }
	.danger    { --c: var(--danger);    --c-fg: var(--danger-fg); }
	.warning   { --c: var(--warning);   --c-fg: var(--warning-fg); }

	.chip {
		display: inline-block;
		padding: 0.15em 0.5em;
		margin: 0.12em 0.2em 0.12em 0;
		border-radius: var(--radius-control);
		border: 1px solid var(--c, var(--line));
		background: color-mix(in srgb, var(--c, var(--muted)) 12%, transparent);
		background-clip: padding-box;
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

	.note { color: var(--muted); }

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

	.box {
		padding: var(--space-block);
		border-radius: var(--radius-card);
		background: var(--bg);
		color: var(--fg);
		margin-block: var(--space-block);
	}
	.box > :first-child { margin-top: 0; }
	.box > :last-child { margin-bottom: 0; }
	.box.border { border: 1px solid var(--c, var(--line)); }
	.box:is(.primary, .secondary, .success, .danger, .warning) {
		background: color-mix(in srgb, var(--c) 8%, var(--bg));
	}
	.box.bar {
		border: 0; border-radius: 0; background: none;
		border-left: 4px solid var(--c, var(--line));
		padding-left: var(--space-inline);
	}

	.row { display: flex; gap: var(--space-gap); flex-wrap: wrap; align-items: center; }
	.col { display: flex; gap: var(--space-gap); flex-direction: column; }
`;
