---
name: skin-builder
description: >-
  Add a re-skin (a [data-theme] block) to this reveal.js presentation framework
  from brand input. Use when the user says "re-skin the deck", "add a brand
  theme", "new theme called ...", "make a dark/light skin", or "apply these brand
  colours/fonts". Parses the existing custom-property tiers, then appends a
  [data-theme="<name>"] block to src/styles/vars/semantic.css (and any genuinely
  new primitives to primitives.css). Never touches slides or components.
---

# skin-builder

**Before anything: read `.claude/skills/framework-conventions.md` and
`reference/variable-tiers.md`.**

## Inputs

- theme name (kebab)
- brand colours (hex list; with roles - bg / fg / muted / accent - if known)
- font stacks (heading / body / mono)
- radius feel: sharp | soft | pill
- motion feel: snappy | gentle
- optional: is this the light or dark half of a pair

## Read (detect state)

1. `framework-conventions.md`, `reference/variable-tiers.md`.
2. **`src/styles/vars/primitives.css`** - parse every `--name: value;` under
   `:root` into a map (the tier-1 inventory).
3. **`src/styles/vars/semantic.css`** - parse the `:root` semantic names and the
   names of every existing `[data-theme]` block. **If `<name>` already exists ->
   STOP.**
4. `src/styles/layers.css` - confirm the `vars.primitive` / `vars.semantic` layer
   names for placement.

Do **not** read components, slides, or `theme/deck.css`.

## Write

- `src/styles/vars/primitives.css` - append, inside the existing `@layer
  vars.primitive { :root { ... } }`, **only** primitives that have no existing
  equivalent (e.g. a brand ramp `--color-brand-500`), under a `/* <name> skin */`
  comment.
- `src/styles/vars/semantic.css` - append, inside `@layer vars.semantic`, a
  `[data-theme="<name>"] { ... }` block that re-points **only** the semantics that
  differ from `:root`. Every value is `var(--<primitive>)` - never a raw colour or
  length.

Never redefine the base `:root` semantics. Never edit `theme/deck.css`, slides, or
components.

## Procedure

1. Reads above; if `<name>` exists, STOP.
2. Map the brand input onto the semantic names (`reference/variable-tiers.md` has
   the list). For each: reuse a matching existing primitive if there is one, else
   mint a new primitive.
3. Append new primitives to `primitives.css`.
4. Emit the `[data-theme="<name>"]` block (changed semantics only) and append to
   `semantic.css`.
5. Validate: every `var(--...)` in the new block resolves to a name now present in
   `primitives.css`. Print the diff.
6. Tell the user to activate it:
   `document.documentElement.dataset.theme = '<name>'` (or `<html
   data-theme="<name>">`), and that Reveal's `--r-*` and any D3 palettes follow
   automatically because they read the semantic layer.

## Consistency

Two-tier discipline holds: no raw colour / length inside a `[data-theme]` block.
Say "CSS custom property" / "CSS variable", never "token".
