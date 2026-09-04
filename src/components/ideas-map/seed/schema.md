# `<deck-ideas-map>` DATASET schema

One JSON object, **node-centric**: every idea is one entry carrying all of its
own variables — which cluster it is in, its plain links, its directed relation
steps (each with its own offset vector), and its constellation membership. There
is no separate `topics` / `links` / `relations` / `contexts` section to
cross-reference; the component derives those at load. Every id is a **kebab-case
slug**, unique within its kind.

When seeding in batches, prefix every id with the domain slug: `bio.cell`,
`music.mozart` — the merge step depends on it. Bulk-generated batch files use
the legacy flat shape (see the note at the bottom); the file you hand-edit is
this one.

```jsonc
{
  // optional: prettier cluster names; otherwise the id is prettified ("capital-of" -> "Capital Of")
  "topicLabels": { "bio.cell-biology": "Cell biology" },

  "nodes": [
    {
      "id":    "bio.cell",
      "name":  "cell",                 // optional — shown on the map; defaults to the id
      "topic": "bio.cell-biology",     // required — the cluster this idea lives in
      "also":  [],                     // optional — rare: second cluster it straddles
      "links": [ "bio.gene" ],         // optional — plain associations, by node id
      "rels":  [                       // optional — every directed step of this idea
        { "rel": "part-of", "to": "bio.mitochondria", "offset": [-67.5, 58.5] }
      ],
      "contexts": { "gene-expression": 0.6 },  // optional — constellation membership + weight (0..1)
      "from":     []                           // optional — constellations this idea focuses
    },
    { "id": "bio.gene", "topic": "bio.cell-biology", "links": ["bio.cell"] }
  ]
}
```

Clusters and their order derive from the node list: the first time a `topic`
value is seen it claims that position. A relation step is written ONCE, on the
source idea (`this → to`); `offset: [dx, dy]` is that step's own vector — where
`to` should sit relative to this idea. Steps are editable per step, so "not
exact" gaps are fine (validate.mjs does not force equality within a rel).

## Rules the validator enforces (authored shape)

| # | Rule |
|---|---|
| 1 | `nodes[].id` unique, kebab-case, non-empty. |
| 2 | `nodes[].name` (if present) is a non-empty string. |
| 3 | `nodes[].topic` is a non-empty kebab slug — every idea belongs to a cluster. |
| 4 | `nodes[].also` (if present) is a list of kebab slugs; a duplicate of its own `topic` is a warning. |
| 5 | Every `nodes[].links` entry resolves to a node id and is not a self-link. |
| 6 | Every `rels[]` step names a vocabulary rel (`relation-vocabulary.md`), its `to` resolves to a node id and is not itself. |
| 6a | A step's `offset` (when present) is `[dx, dy]` — two finite numbers. |
| 7 | Every `contexts` weight is a number in `[0, 1]`. |
| 8 | Every `from` entry is a context at least one idea belongs to. |
| 9 | `topicLabels` keys label a topic some idea uses (else warning). |

## Warnings (non-fatal)

- `> 5000` nodes (force sim gets slow; use `reveal=` and/or split into decks).
- A cluster reached only through `also` (no idea is primarily in it).
- A `topicLabels` key with no idea using that topic (typo).
- A rel name used by exactly one step (nothing to compare it against on screen).

## JSON Schema (draft 2020-12)

`./validate.mjs` does the referential checks the plain schema can't, but this
catches shape errors early:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "additionalProperties": false,
  "required": ["nodes"],
  "properties": {
    "topicLabels": {
      "type": "object",
      "additionalProperties": { "type": "string", "minLength": 1 }
    },
    "nodes": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "topic"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z0-9]+([.-][a-z0-9]+)*$" },
          "name": { "type": "string", "minLength": 1 },
          "topic": { "type": "string", "pattern": "^[a-z0-9]+([.-][a-z0-9]+)*$" },
          "also": { "type": "array", "items": { "type": "string", "pattern": "^[a-z0-9]+([.-][a-z0-9]+)*$" } },
          "links": { "type": "array", "items": { "type": "string" } },
          "rels": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["rel", "to"],
              "properties": {
                "rel": { "type": "string" },
                "to": { "type": "string" },
                "offset": {
                  "type": "array", "minItems": 2, "maxItems": 2,
                  "items": { "type": "number" }
                }
              }
            }
          },
          "contexts": {
            "type": "object",
            "additionalProperties": { "type": "number", "minimum": 0, "maximum": 1 }
          },
          "from": { "type": "array", "items": { "type": "string" } }
        }
      }
    }
  }
}
```

## Legacy flat / seed batches

`./validate.mjs` auto-detects the older flat shape (`{ topics, nodes:[{topics:
[]}], links, relations:[{rel,pairs}], contexts }`) and validates that too — that
is the shape bulk-generated batch files and `./merge.mjs` output use. The
component loads either shape (`expandDataset()` in `dataset.js`), so a merged
seed file can replace `dataset.json`'s contents as-is.
