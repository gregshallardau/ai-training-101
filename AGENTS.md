# Agent entry point

Before creating, editing, or reorganizing anything under `slides/`,
`components/`, or `src/styles/vars/`, read
[`docs/framework-conventions.md`](docs/framework-conventions.md)
first. It is the single reference for the repo layout, the CSS custom-property
tiers, the cascade layer order, the canonical-component contract, slide
portability/numbering, and Reveal.js vertical-stack/fragment/image mechanics.

**`src/` is framework machinery, never a deck's own content.** A deck's
components live in the root-level `components/` (alongside `slides/`,
`deck.css`, `deck.config.js`); `src/components/` holds only the base class,
registry, and shared style vocabulary those components import.

If your tooling supports loading a named skill from `.claude/skills/`, prefer
that over reading files by hand - each of the four below states its own
trigger conditions and procedure:

- **`slide-builder`** - add, insert, reorder, renumber, or split a slide in `slides/`.
- **`artefact-builder`** - define a new reusable `<deck-*>` custom element.
- **`deck-builder`** - scaffold a whole new deck from an outline.
- **`skin-builder`** - add a re-skin (`[data-theme]` block) from brand input.

Each skill's first line is "read `docs/framework-conventions.md`
first" - do that even if you read nothing else here.
