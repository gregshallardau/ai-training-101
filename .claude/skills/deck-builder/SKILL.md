---
name: deck-builder
description: >-
  Scaffold a whole new deck for this reveal.js presentation framework. Use when
  the user says "scaffold a deck from this outline", "turn this wireframe/outline
  into slides", "build the slide skeleton for ...", "new deck from <file>.md", or
  hands over a presentation-plan.md from presentation-planner. Reads an outline
  or a plan and writes slides/ - a numbered stub per section, vertical stacks
  where it nests, a title slide, an overview jump menu, a closing takeaways slide.
  Emits stubs only; never writes slide prose or components.
---

# deck-builder

**Before anything: read `docs/framework-conventions.md`, `slides/README.md`,
`docs/cheatsheet.md`, and `docs/plan-format.md`.**

## Inputs

- path to the input file - either a plain outline (`wireframe.md`) **or** a
  `presentation-plan.md` from `presentation-planner`
- deck title (taken from the plan's `title:` in plan mode)
- optional theme name (an existing `[data-theme]` in `src/styles/vars/semantic.css`;
  the plan's `theme:` key in plan mode)
- may it overwrite a non-empty `slides/`? default **no** - the committed
  `000-title.html` is expected and will be regenerated.

## Read (detect state)

1. `docs/framework-conventions.md`, `slides/README.md`, `docs/cheatsheet.md`,
   `docs/plan-format.md`.
2. The input file.
3. `slides/` current contents.
4. `src/components/registry.js` - which `<deck-*>` already exist.
5. `index.html` - `<!-- @slides -->` present.

## Mode

**Plan mode** iff the input file opens with a `---` frontmatter block (the
`docs/plan-format.md` schema). Otherwise **outline mode** (headings + bullets).

## Procedure

1. **Parse the input.**
   - *Outline mode* - be tolerant: first `#` (or the given title) = deck title;
     `##` and lone numbered lines (`5. Context`) = horizontal sections; `###` /
     nested list items = vertical children **or** stub bullets (nest only when it
     clearly nests); free text under a heading = `TODO:` stub bullets.
   - *Plan mode* - read the frontmatter; each `## Section` = a horizontal section,
     `### ` under it = a vertical child. Per section, note its `intent:` line, its
     `- ` bullets, and any `artefact:` line (see `docs/plan-format.md`).
2. **Allocate numbers:** `000-title`, `010-overview`, sections from `020`
   (zero-padded, step 10 - see `slides/README.md`), vertical children `NN.1`,
   `NN.2`, ...; in plan mode a final `NN-key-takeaways` after the last section.
3. **Slug** = kebab-case of the section title.
4. **Per section:** pick `.md` / `.html` with the `slide-builder` heuristic - or
   `.html` whenever a `artefact:` line is present. Render a stub: heading,
   `TODO:` bullets from the talking points, `id`/`data-slug` set. In plan mode,
   put the `intent:` text in as `<!-- intent: ... -->` at the top of the body.
5. **Title slide** `slides/000-title.html` - title + optional subtitle. In plan
   mode add `<!-- audience / goal / tone / duration -->` from the frontmatter as
   an HTML comment for the author's reference.
6. **Overview** `slides/010-overview.html` - one `<a href="#/<slug>">` per
   top-level section, with a comment that it is deck-specific and not portable.
7. **Takeaways (plan mode)** `slides/NN-key-takeaways.md` - `## Key takeaways`
   then one `- ` bullet per `takeaways` entry.
8. Write all files. Print the deck map: number -> slug -> format.
9. **Flag** every section whose `artefact:` (or, in outline mode, whose wording)
   implies a `<deck-*>` not in `registry.js`: leave
   `<!-- TODO: run artefact-builder for deck-<slug> — <description> -->` in that
   slide. Do not create components.

## Consistency

Use `slide-builder`'s numbering / slug / portability rules verbatim. Never inline
a component definition, never write a section's real prose - stubs only. Say "CSS
custom property" / "CSS variable", never "token" - but stub *content* may keep
"token" where the input uses it (in these talks it means a chunk of text).
