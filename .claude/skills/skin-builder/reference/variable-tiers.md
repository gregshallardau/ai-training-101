# Custom-property tiers - for skin-builder

## Tier 2 semantic names (the full list to map brand input onto)

Defined in `src/styles/vars/semantic.css` `:root`. A `[data-theme]` block
overrides any subset of these.

```
--bg                   page / slide background
--fg                   body + heading text
--muted                secondary text
--line                 hairlines, borders, table rules

--primary              the one brand colour (links, key fills)
--primary-strong       hover / pressed
--primary-fg           text/icon ON a solid --primary fill

--secondary            quieter second colour
--secondary-strong     hover / pressed
--secondary-fg         text on a solid --secondary fill

--success  --success-fg     green   status
--danger   --danger-fg      red     status
--warning  --warning-fg     amber   status

--space-inline        default horizontal rhythm unit
--space-block         default vertical rhythm unit
--space-gap           small gap (flex/grid gap)

--radius-control      buttons, inputs, small chips
--radius-card         panels, cards
--radius-round        pills / circles

--font-heading        heading stack
--font-body           body stack
--font-code           monospace stack

--motion-hero-duration   big hero / section-break timing
--motion-hero-ease       "
--motion-ui-duration     small UI transition timing
--motion-ui-ease         "
```

## Tier 1 primitive inventory shape

`src/styles/vars/primitives.css` `:root` - raw values only, grouped:

```
--color-<hue>-<step>     e.g. --color-ink-900, --color-brand-500
--size-<n>               spacing scale
--radius-<n>             --radius-0, --radius-1, --radius-2, --radius-pill
--font-sans / -serif / -mono
--text-root-size
--dur-fast / --dur-slow
--ease-standard / --ease-emphasis
```

Add new primitives here (never inside a `[data-theme]` block) when the brand
needs a value with no existing equivalent.

`--text-root-size` is Reveal's stock `40px` here, but the root `deck.css`
(`@layer deck`, highest) ships it active at `32px` and also carries the
commented brand-knob menu. `skin-builder` does not touch `deck.css`; a
`[data-theme]` block can still re-point `--text-root-size` if a skin needs a
different base size.

## Example [data-theme] block

```css
@layer vars.semantic {
	/* ...existing :root and [data-theme="dark"]... */

	[data-theme="acme"] {
		--bg: var(--color-paper-000);
		--fg: var(--color-acme-ink);      /* new primitive */
		--primary: var(--color-acme-red-500);      /* new primitive */
		--primary-strong: var(--color-acme-red-600);
		--font-heading: var(--font-acme-display); /* new primitive */
		--radius-card: var(--radius-0);           /* sharp feel */
	}
}
```

With matching additions in `primitives.css`:

```css
@layer vars.primitive {
	:root {
		/* acme skin */
		--color-acme-ink: #1a1a1a;
		--color-acme-red-500: #e4002b;
		--color-acme-red-600: #b80022;
		--font-acme-display: "Acme Display", Georgia, serif;
	}
}
```
