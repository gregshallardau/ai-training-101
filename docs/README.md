# docs/

| File | For |
|---|---|
| [`cheatsheet.md`](./cheatsheet.md) | authoring a slide: what tag / class / attribute to write, and the knob that restyles it. Start here. |
| [`framework-conventions.md`](./framework-conventions.md) | the architecture: CSS custom-property tiers, cascade layers, the component contract, slide portability, assembly. The authoring skills read this first. |

Also worth knowing:

- **`deck.css`** (repo root) - the one file you edit to re-skin a deck: a
  commented menu of brand knobs (`--accent`, `--surface-*`, `--font-*`, type
  scale), deck-wide element tweaks, and the utility classes (`.text-muted`,
  `.flex-cols`, `.box`, …). Each knob says where you'll see it.
- **`slides/README.md`** - the slide numbering + portability contract in full.
- **`src/components/README.md`** - the `<deck-*>` component contract.

Authoring skills (in `.claude/skills/`): `slide-builder`, `artefact-builder`,
`deck-builder`, `skin-builder`.
