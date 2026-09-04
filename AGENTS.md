# Agent entry point

Before creating, editing, or reorganizing anything under `slides/`,
`src/components/`, or `src/styles/vars/`, read
[`.claude/skills/framework-conventions.md`](.claude/skills/framework-conventions.md)
first. It is the single reference for the repo layout, the CSS custom-property
tiers, the cascade layer order, the canonical-component contract, slide
portability/numbering, and Reveal.js vertical-stack/fragment/image mechanics.

If your tooling supports loading a named skill from `.claude/skills/`, prefer
that over reading files by hand - each of the four below states its own
trigger conditions and procedure:

- **`slide-builder`** - add, insert, reorder, renumber, or split a slide in `slides/`.
- **`artefact-builder`** - define a new reusable `<deck-*>` custom element.
- **`deck-builder`** - scaffold a whole new deck from an outline.
- **`skin-builder`** - add a re-skin (`[data-theme]` block) from brand input.
- **`keyframe-builder`** - build a multi-click reveal within a slide (content
  that transforms in place across clicks, e.g. a question becoming an answer).

Each skill's first line is "read `.claude/skills/framework-conventions.md`
first" - do that even if you read nothing else here.
