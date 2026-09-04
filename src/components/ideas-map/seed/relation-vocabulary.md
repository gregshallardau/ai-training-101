# Relation vocabulary (closed set)

A relation step's `rel` MUST be one of these names. The table's vectors are the
reference directions (the component's built-in map ships these for the four it
uses). The generating LLM chooses the **name**; it never chooses the geometry.

`D` is the base step length (defaults to `90` in `dataset.js`). Directions are
spread so distinct relations read as distinct arrows; `comparative` and
`superlative` are deliberately colinear ("further along the same step").

| `rel` | offset `[dx, dy]` | source → target | direction |
|---|---|---|---|
| `gender`        | `[-D, 0]`              | male → female                     | W |
| `parent`        | `[0, -D]`              | child → parent / specific → broader | N |
| `tense`         | `[D, 0]`              | base verb → past tense            | E |
| `plural`        | `[0, D]`              | singular → plural                 | S |
| `comparative`   | `[D * 1.0, -D * 0.35]` | adjective → "-er"                 | ENE |
| `superlative`   | `[D * 1.5, -D * 0.55]` | adjective → "-est"                | ENE (longer) |
| `capital-of`    | `[D * 0.75, -D * 0.65]` | country → capital city          | NE |
| `opposite`      | `[-D * 0.75, -D * 0.65]` | word → antonym                  | NW |
| `part-of`       | `[-D * 0.75, D * 0.65]` | part → whole                     | SW |
| `instance-of`   | `[D * 0.75, D * 0.65]` | instance → category              | SE |
| `profession`    | `[-D * 0.35, -D * 1.0]` | person → their field             | NNW |
| `symbol`        | `[D * 0.35, D * 1.0]` | element / unit → its symbol       | SSE |

## Authoring the offsets

In the node-centric map each step is written ONCE on its source idea and carries
its OWN vector — `src/components/ideas-map/dataset.json` ships the four rels it
uses this way:

```jsonc
{
  "id":    "bio.gene",
  "topic": "bio.cell-biology",
  "rels":  [
    { "rel": "part-of", "to": "bio.cell", "offset": [-67.5, 58.5] }
  ]
}
```

Steps are per-step editable, so "not exact" gaps are fine — you can shorten one
`gender` step without touching its siblings. (The word2vec parallelogram demo
— `son→daughter` == `king→queen` — still holds while the steps of a rel share
one vector, and the shared direction matters for how the arrows read.) JSON
holds plain numbers, so substitute `D` (= `90`, declared in `dataset.js`):
`[-D, 0]` → `[-90, 0]`, `[D * 0.75, -D * 0.65]` → `[67.5, -58.5]`. Keep a new
direction at least ~30° from every existing one (and not `[0, 0]`).

Legacy flat batches (seed/merge) group pairs instead (`{ "rel": "part-of",
"pairs": [...], "offset": [...] }`); the component expands those to per-step
vectors with the group's offset.

## Extending the vocabulary

If the talk needs a relation not here: add it to this table AND give each of its
steps its own `offset` in the dataset (or the group's `offset` in a flat batch),
with a direction at least ~30° from every existing one (and not `[0,0]`). Then
`./validate.mjs`'s `RELS` set must be updated to match. Do not let the generator
invent one.
