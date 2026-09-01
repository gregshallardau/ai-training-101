---
name: deck-builder
description: >-
  Scaffold a whole new deck for this reveal.js presentation framework from an
  outline. Use when the user says "scaffold a deck from this outline", "turn this
  wireframe/outline into slides", "build the slide skeleton for ...", or "new deck
  from <file>.md". Reads an outline file and writes slides/ - a numbered stub per
  section, vertical stacks where the outline nests, a title slide, and an overview
  jump menu. Emits stubs only; never writes slide prose or components.
---

# deck-builder

**Before anything: read `.claude/skills/framework-conventions.md`,
`slides/README.md`, and
`.claude/skills/slide-builder/reference/slide-templates.md`.**

## Inputs

- path to the outline file (e.g. `wireframe.md`)
- deck title
- optional theme name (an existing `[data-theme]` in `src/styles/vars/semantic.css`)
- may it overwrite a non-empty `slides/`? default **no** - but the committed
  `00-title.html` is expected and will be regenerated.

## Read (detect state)

1. `framework-conventions.md`, `slides/README.md`, the slide templates.
2. The outline file.
3. `slides/` current contents.
4. `src/components/registry.js` - which `<deck-*>` already exist.
5. `index.html` - `<!-- @slides -->` present.

## Procedure

1. **Parse the outline into a tree.** Be tolerant of messy outlines:
   - the first `#` (or the given title) = deck title;
   - `##` headings, and lone numbered lines like `5. Context`, = horizontal
     sections;
   - `###` / nested list items = vertical children **or** stub bullet content
     (nest only when the outline clearly nests);
   - free text under a heading becomes `TODO:` stub bullets.
2. **Allocate numbers:** `00-title`, `01-overview`, then sections from `02`
   (zero-padded, step 1). Vertical children get `NN.1`, `NN.2`, ...
3. **Slug** = kebab-case of the heading.
4. **Per node:** pick `.md` / `.html` with the `slide-builder` heuristic; render a
   stub from the templates - heading, `TODO:` bullets drawn from the outline's
   talking points, `id`/`data-slug` set.
5. Generate `slides/00-title.html` (title + optional subtitle) and
   `slides/01-overview.html` - one `<a href="#/<slug>">` per top-level section,
   with a comment noting it is deck-specific and not portable.
6. Write all files. Print the deck map: number -> slug -> format.
7. **Flag** every section that implies a `<deck-*>` not in `registry.js`; leave a
   `<!-- TODO: run artefact-builder for deck-<x> -->` in that slide. Do not create
   components.

## Consistency

Use `slide-builder`'s numbering / slug / portability rules verbatim. Never inline
a component definition. In styling notes say "CSS custom property" / "CSS
variable", never "token" - but stub *content* may keep the word "token" where the
outline uses it (in these talks it means a chunk of text).
