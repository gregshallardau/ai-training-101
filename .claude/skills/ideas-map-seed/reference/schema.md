# `<deck-ideas-map>` DATASET schema

One JSON object. Every id is a **kebab-case slug**, unique within its kind.
When seeding in batches, prefix every id with the domain slug: `bio.cell`,
`music.mozart` — the merge step depends on it.

```jsonc
{
  "topics": [
    { "id": "bio.cell-biology", "name": "Cell biology" }
  ],
  "nodes": [
    // topics[] must all be defined topic ids; the FIRST one drives the node's colour.
    // A node may sit in two topics (it renders between the clusters).
    { "id": "bio.cell",    "name": "cell",    "topics": ["bio.cell-biology"] },
    { "id": "bio.gene",    "name": "gene",    "topics": ["bio.cell-biology"] },
    { "id": "bio.mitosis", "name": "mitosis", "topics": ["bio.cell-biology"] }
  ],
  "links": [
    // plain associations. source/target are node ids. no self-links.
    { "source": "bio.gene", "target": "bio.cell" },
    { "source": "bio.cell", "target": "bio.mitosis", "distance": 120 }
  ],
  "relations": [
    // `rel` MUST be a name from relation-vocabulary.md. pairs are [nodeId, nodeId];
    // every pair of one rel gets pulled to the same on-screen offset vector.
    { "rel": "part-of", "pairs": [["bio.gene", "bio.cell"], ["bio.mitosis", "bio.cell"]] }
  ],
  "contexts": {
    // named activation sets for the constellation / attention overlay.
    "gene-expression": {
      "from": "bio.gene",
      "nodes": ["bio.gene", "bio.cell", "bio.mitosis"],
      "weights": { "bio.cell": 1, "bio.mitosis": 0.6 }
    }
  }
}
```

## Rules the validator enforces

| # | Rule |
|---|---|
| 1 | `topics[].id` unique, kebab-case, non-empty; `name` non-empty. |
| 2 | `nodes[].id` unique, kebab-case; `name` non-empty. |
| 3 | Every `nodes[].topics` entry resolves to a defined topic id; the array is non-empty. |
| 4 | Every `links[].source` / `links[].target` is a defined node id; `source !== target`. |
| 5 | Optional `links[].distance` is a positive number. |
| 6 | Every `relations[].rel` is in the vocabulary (`relation-vocabulary.md`). |
| 7 | Every `relations[].pairs` entry is `[nodeId, nodeId]` with both ids defined and `a !== b`. |
| 8 | Every `contexts[k].from` (if present) is a defined node id. |
| 9 | Every `contexts[k].nodes` entry is a defined node id; array non-empty. |
| 10 | Every `contexts[k].weights` key is one of that context's `nodes`; every value is a number in `[0, 1]`. |

## Warnings (non-fatal)

- A topic with 0 nodes.
- `> 5000` nodes (force sim gets slow; use `reveal=` and/or split into decks).
- A node whose two `topics` are the same id.
- A relation with only one pair (nothing to compare it against on screen).

## JSON Schema (draft 2020-12)

`scripts/validate.mjs` does the referential checks the plain schema can't, but
this catches shape errors early:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "additionalProperties": false,
  "required": ["topics", "nodes"],
  "properties": {
    "topics": {
      "type": "array",
      "items": {
        "type": "object", "additionalProperties": false,
        "required": ["id", "name"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z0-9]+([.-][a-z0-9]+)*$" },
          "name": { "type": "string", "minLength": 1 }
        }
      }
    },
    "nodes": {
      "type": "array",
      "items": {
        "type": "object", "additionalProperties": false,
        "required": ["id", "name", "topics"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z0-9]+([.-][a-z0-9]+)*$" },
          "name": { "type": "string", "minLength": 1 },
          "topics": { "type": "array", "minItems": 1, "items": { "type": "string" } },
          "weight": { "type": "number" }
        }
      }
    },
    "links": {
      "type": "array",
      "items": {
        "type": "object", "additionalProperties": false,
        "required": ["source", "target"],
        "properties": {
          "source": { "type": "string" },
          "target": { "type": "string" },
          "distance": { "type": "number", "exclusiveMinimum": 0 }
        }
      }
    },
    "relations": {
      "type": "array",
      "items": {
        "type": "object", "additionalProperties": false,
        "required": ["rel", "pairs"],
        "properties": {
          "rel": { "type": "string" },
          "pairs": {
            "type": "array", "minItems": 1,
            "items": {
              "type": "array", "minItems": 2, "maxItems": 2,
              "items": { "type": "string" }
            }
          }
        }
      }
    },
    "contexts": {
      "type": "object",
      "additionalProperties": {
        "type": "object", "additionalProperties": false,
        "required": ["nodes"],
        "properties": {
          "from": { "type": "string" },
          "nodes": { "type": "array", "minItems": 1, "items": { "type": "string" } },
          "weights": {
            "type": "object",
            "additionalProperties": { "type": "number", "minimum": 0, "maximum": 1 }
          }
        }
      }
    }
  }
}
```
