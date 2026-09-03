---
name: presentation-planner
description: >-
  Use when someone wants to plan a talk or presentation before it is built -
  "plan a presentation", "help me plan a talk about X", "/presentation-planner",
  or when a user describes a talk they have to give and has not settled its
  goal, length, structure, or which slides need a diagram / chart / demo. The
  step before deck-builder: it produces the plan file deck-builder scaffolds
  from.
---

# presentation-planner

**Before anything: read `docs/plan-format.md` and `docs/framework-conventions.md`.**

Interview the user, then write `presentation-plan.md` - a brief plus a section
outline that `deck-builder` turns into `slides/`. This skill plans; it never
writes slide prose or component code.

## Read (detect state)

1. `docs/plan-format.md` - the exact file schema you will write.
2. `docs/framework-conventions.md`, `docs/cheatsheet.md` - what the framework can
   render (utility classes, slide shapes).
3. `src/components/registry.js` - which `<deck-*>` artefacts already exist, so you
   can point a section at one instead of flagging a new build.
4. `src/styles/vars/semantic.css` - the names of any `[data-theme]` blocks (for
   the `theme` key).
5. `slides/` and any existing `presentation-plan.md` - if a plan or a built deck
   is already there, ask whether to replace it before writing.

## Interview

Work through the areas in `reference/interview.md`, **one question per message**,
using `AskUserQuestion` with concrete options wherever the answer is a choice.
Do not dump the whole questionnaire at once. Order:

1. Topic  2. Goal  3. Audience  4. Duration (-> rough slide count)
5. Tone  6. Key takeaways  7. Arc  8. Per-section artefacts  9. Theme

At step 7, propose a filled-in arc (one of the templates in
`reference/interview.md`, sections named for this topic) and let the user rename,
add, cut, or reorder sections before you continue. At step 8, walk the agreed
sections and ask which need a visual and what kind.

## Write

`presentation-plan.md` at the repo root, in the `docs/plan-format.md` schema:

- every required frontmatter key filled from the interview;
- one `## Section` per section the user agreed at step 7, in order;
- `intent:` line = the one-line purpose you and the user settled for that section;
- 2-4 `- ` bullets per section from the talking points raised (they become
  `TODO:` stubs - keep them terse, not written-out prose);
- `artefact:` line **only** on sections where the user asked for a visual; name
  an existing `<deck-*>` in the description if one fits.

## Then

Ask: **"Scaffold this into `slides/` now? (runs deck-builder)"**

- **Yes** -> invoke `deck-builder` with `presentation-plan.md` as the outline.
- **No** -> stop. Tell the user the plan is at `presentation-plan.md` and that
  `deck-builder` reads it when they are ready.

## Consistency

Plans only - never write a slide's real content or a component definition; that
is `slide-builder` / `artefact-builder` after `deck-builder` scaffolds. Say "CSS
custom property" / "CSS variable", never "token", in anything you write - except
inside plan *content*, where "token" may mean a chunk of text if the user uses it
that way. If `presentation-plan.md` already exists, confirm before overwriting.
