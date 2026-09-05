# Generation prompt

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
