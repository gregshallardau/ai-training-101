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
this one.# Generation prompt

Hand this to the local LLM. Fill the three `<<…>>` placeholders and save the
reply.

**Batching is optional.** For one file, use one call with a broad `<<DOMAIN>>`
and a large `<<N>>`, and the `<<SLUG>>.` id prefix does not matter (pick any).
For a large map on a small local model, run this once per domain — save each
reply as `batch-<<SLUG>>.json`, keep the `<<SLUG>>.` prefix on every id, then
merge with `./merge.mjs`. See "One file or many?" in the `ideas-map-seed` skill.

---

You generate one JSON object for a knowledge-map dataset. Output **only** the
JSON — no prose, no markdown fence.

**Domain:** <<DOMAIN NAME, e.g. "Cell biology">>
**Domain slug:** <<SLUG, e.g. "bio">> — every id you produce MUST start with `<<SLUG>>.`
**Topic budget:** about <<N, e.g. 25>> topics.

Shape:

```
{
  "topics":   [ { "id": "<<SLUG>>.<sub-area-slug>", "name": "<Sub-area Name>" }, ... ],
  "nodes":    [ { "id": "<<SLUG>>.<idea-slug>", "name": "<idea>", "topics": ["<<SLUG>>.<sub-area-slug>"] }, ... ],
  "links":    [ { "source": "<<SLUG>>.<id>", "target": "<<SLUG>>.<id>" }, ... ],
  "relations":[ { "rel": "<name>", "pairs": [ ["<<SLUG>>.<id>", "<<SLUG>>.<id>"], ... ] }, ... ]
}
```

Rules:

1. `topics` = the sub-areas of the domain (about <<N>> of them). `id` is
   `<<SLUG>>.` + a kebab-case slug; `name` is a short human label.
2. `nodes` = concrete ideas / words, 5–15 per sub-area, `topics` = `["<<SLUG>>.<their sub-area>"]`.
   A node may list two sub-areas if it genuinely straddles them.
3. `links` = plain "these two ideas are associated" edges between node ids in
   THIS batch. Aim for ~1–2 per node. No self-links.
4. `relations` = structured pairs, grouped by `rel`. **`rel` must be one of:**
   `gender`, `parent`, `tense`, `plural`, `comparative`, `superlative`,
   `capital-of`, `opposite`, `part-of`, `instance-of`, `profession`, `symbol`.
   Only include relations that genuinely apply in this domain. `parent` and
   `part-of` are the workhorses for a knowledge map (specific→broad,
   component→whole). Every pair is `[sourceId, targetId]` following the
   relation's own direction (e.g. `part-of`: `[part, whole]`).
5. Every id is unique and starts with `<<SLUG>>.`. Every id referenced in
   `links` / `relations` is defined in this batch's `nodes`.
6. No `contexts` in a batch — those are added later by hand.

---

## Stitch pass (run once, after all batches)

Same rules, but:

- Output only `{ "links": [...], "relations": [...] }`.
- Reference ids from ANY batch (they are all `<slug>.<id>`).
- Add the cross-domain connections a knowledge map wants: a person to their
  place, a discovery to its field, an instrument to its music, etc.
- `relations` here are usually `instance-of` or `part-of` spanning domains.

Save as `batch-stitch.json`.


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
