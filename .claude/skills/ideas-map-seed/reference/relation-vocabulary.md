# Relation vocabulary (closed set)

A `relations[].rel` in a seeded dataset MUST be one of these names. Each has an
authored 2-D offset direction so every pair of that relation lands on the same
on-screen vector (the word2vec parallelogram). The generating LLM chooses the
**name**; it never chooses the geometry.

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

## Paste into `src/components/ideas-map/dataset.js`

Replace the existing `RELATION_OFFSETS` block (which ships with only a few) with
this full set, so any vocabulary name a seeded dataset uses resolves. `D` is
already declared in that file.

```js
export const RELATION_OFFSETS = {
	gender:      [-D, 0],
	parent:      [0, -D],
	tense:       [D, 0],
	plural:      [0, D],
	comparative: [D * 1.0, -D * 0.35],
	superlative: [D * 1.5, -D * 0.55],
	'capital-of':  [D * 0.75, -D * 0.65],
	opposite:      [-D * 0.75, -D * 0.65],
	'part-of':     [-D * 0.75, D * 0.65],
	'instance-of': [D * 0.75, D * 0.65],
	profession:  [-D * 0.35, -D * 1.0],
	symbol:      [D * 0.35, D * 1.0],
};
```

## Extending the vocabulary

If the talk needs a relation not here: add it to BOTH this table and the
`RELATION_OFFSETS` block, with a direction at least ~30° from every existing one
(and not `[0,0]`). Then `scripts/validate.mjs`'s `RELS` set must be updated to
match. Do not let the generator invent one.
