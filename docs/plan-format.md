# Presentation plan format

The file `presentation-planner` writes and `deck-builder` reads. Default path:
`presentation-plan.md` at the repo root (any path may be passed to `deck-builder`).

A plan is **brief frontmatter** + **one `##` section per slide**.

```markdown
---
title: (Not) AI Training
audience: insurance brokers, mixed AI familiarity, ~20 people
goal: shift them from "a prompt is a question" to "a prompt is context you build"
duration: 45 min
slides: ~28
tone: conversational, hands-on, lightly irreverent
takeaways:
  - context beats cleverness
  - you already build context every day
  - your context is reusable
theme: none
---

## Ideas in Space
intent: give them a mental model for how a model "sees" meaning
- the map metaphor - words as places
- nearby = related
artefact: diagram — 2D concept map, a handful of labelled points, two shown as "close"

## The Meaning of Words
intent: show meaning comes from surrounding words, not the word alone
- same word, two sentences, two meanings
artefact: none
```

## Frontmatter keys

| Key | Required | Notes |
|---|---|---|
| `title` | yes | deck title -> `00-title.html` |
| `audience` | yes | free text; carried into `00-title.html` as an HTML comment |
| `goal` | yes | the shift you want in the audience; HTML comment on the title slide |
| `duration` | yes | e.g. `45 min`; informational |
| `slides` | no | estimate like `~28`; informational - `deck-builder` still makes one slide per `##` (plus nesting and the takeaways slide) |
| `tone` | yes | free text; HTML comment on the title slide |
| `takeaways` | yes | 2-4 list items -> a closing `NN-key-takeaways.md` stub |
| `theme` | no | an existing `[data-theme]` name, or `none` (default) |

## Section body

Each `## Section title` becomes one horizontal slide (`<slug>` = kebab-case of
the title). `### Sub-heading` under it becomes a vertical child (`NN.M`), same as
a plain outline.

| Line | Effect |
|---|---|
| `intent: <text>` (first line after the heading) | copied into the slide as `<!-- intent: <text> -->` |
| `- <bullet>` | becomes a `- TODO: <bullet>` stub bullet |
| `artefact: <kind> — <description>` | slide is written as `.html`; gets `<!-- TODO: run artefact-builder for deck-<slug> — <description> -->`. Separator may be `—`, `-`, or `:`. `kind` is a hint: `diagram` \| `chart` \| `demo` \| `comparison` \| `map` \| `animation` |
| `artefact: none` or no `artefact:` line | slide is written as `.md` |

## Mode detection

`deck-builder` treats the input as a plan **iff** the file opens with a `---`
frontmatter block. Otherwise it is a plain outline (headings + bullets), handled
as before - see `deck-builder/reference/outline-mapping.md`.
