# `<deck-ideas-map>` attributes

Mirror of the design spec §5 / §12, for wiring slide states. The spec is the
source of truth; the shipped component (`src/components/ideas-map/index.js`) is
what actually exists - check it.

## v1 (per the spec)

| Attribute | Value | State it puts the map in |
|---|---|---|
| `data` | JSON string | override the built-in `DATASET` for this instance |
| `labels` | `none` \| `topics` \| `all` \| `auto` | `none` = bare star map (talk over regions, plant seeds); `all` = every idea named, no arrows; `auto` = legible-view rule. A live corner `Aa` toggle also flips it. |
| `show-links` | boolean | add the link force, draw the association web; related words pull together |
| `reveal` | integer N | only the first N topics' nodes participate/draw (fragment-buildable) |
| `tag` | csv of topic ids | legend + lift those topics; others dim to ~0.35 (colour is always on) |
| `scope` | one topic id | camera flies to fit that topic; out-of-scope nodes stay visible but muted ~0.15 (overlap preserved) |
| `highlight` | csv of node ids | ring those nodes, bring their labels forward |
| `spotlight` | a `rel` id | draw the offset arrow for every pair of that relationship, across all topics it touches - parallel + equal |
| `activate` | one/more `contexts` keys (csv) **or** csv of node ids | light those ideas, fade the rest to faint stars, draw the attention layer; multiple keys compose (union + renormalised budget) |
| `attention-from` | one node id | attention edges fan from this node (else the context's `from`, else a light mesh) |
| `constellation` | boolean | also draw the connect-the-dots outline through the activated set |
| `label` | string | `aria-label` / `<title>` |

`tag` / `scope` / `highlight` / `spotlight` / `activate` stack. Progressive =
grow the `activate` list (or stack more `contexts` keys) across fragments.

## Deferred (spec §12 - not built until a slide needs one; adopting one is an artefact-builder change)

| Attribute | Value | Beat |
|---|---|---|
| `budget` | boolean | show the fixed attention-pool meter; more lit ideas -> thinner slices |
| `heads` | `2`..`4` | N coloured fans, each following a different edge rule (step / same-topic / long-range) |
| `sequence` | boolean | ordinal badges; the constellation outline follows reading order |
| `causal` | boolean (needs `sequence`) | a query's attention reaches only earlier-index nodes |
| `layer` | `1`..`6` | re-weight pass; the constellation tightens each step |
| `matrix` | boolean | swap the readout for an N×N attention heat grid |

## Typical slide beats

| Slide | Tag |
|---|---|
| "Ideas in Space" (star map) | `<deck-ideas-map labels="none">` |
| name the ideas | `<deck-ideas-map labels="all">` |
| a relationship | `<deck-ideas-map spotlight="gender">` |
| word-association web | `<deck-ideas-map show-links>` |
| talk about one area | `<deck-ideas-map tag="..."> ` then `scope="..."` |
| context builder | `<deck-ideas-map show-links activate="role" attention-from="..." constellation>` then grow `activate="role,industry"`, `activate="role,industry,product"` |
