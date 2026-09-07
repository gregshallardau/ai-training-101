# Outline -> slides mapping

Two inputs: a plain **outline**, or a **plan** (`docs/plan-format.md` - detected
by a leading `---` frontmatter block). Plan mode adds the rows marked *(plan)*
below; everything else is shared.

## Heading levels

| Outline / plan                            | Becomes                                   |
|-------------------------------------------|-------------------------------------------|
| First `#` / given title / `title:` *(plan)* | deck title (`000-title.html`)           |
| `##` heading                              | horizontal section slide `NN-<slug>`      |
| Lone numbered line, e.g. `5. Context`     | horizontal section slide                  |
| `###` under a `##`                        | vertical child `NN.M-<slug>` (if nested)  |
| Bullet list under a heading               | `TODO:` stub bullets in that slide        |
| Free prose under a heading                | `TODO:` stub bullets (one per sentence-ish)|
| `intent: <text>` line *(plan)*            | `<!-- intent: <text> -->` atop the slide body |
| `artefact: <kind> — <desc>` line *(plan)* | slide is `.html` + `<!-- TODO: run artefact-builder for deck-<slug> — <desc> -->` |
| `takeaways:` list *(plan)*                | closing `NN-key-takeaways.md` (`## Key takeaways` + one bullet each) |
| `audience` / `goal` / `tone` / `duration` *(plan)* | HTML comment block on `000-title.html` |

## Numbering

```
000-title.html
010-overview.html         jump menu - <a href="#/<slug>"> per section; NOT portable
020-<first-section>.md|html
030-<next-section>...
030.1-<child>...           vertical children share the parent major
NN-key-takeaways.md       plan mode only - last slide
```

Zero-padded (>= 3 digits), step 10 - gaps are left on purpose so a later
insertion (`slide-builder`) can slot in without renumbering the deck; see
`slides/README.md`. Recompute widths if there are >= 100 sections.

## Format choice (per node)

- prose / bullets / headings only            -> `.md`
- outline marks a demo, diagram, chart, map,
  "interactive", "animation", or an artefact -> `.html` (+ TODO for a `<deck-*>`)

## Stub body

```md
## <Heading>

- TODO: <talking point 1 from outline>
- TODO: <talking point 2>
```

or, for `.html`:

```html
<section id="<slug>" data-slug="<slug>">
	<h2><Heading></h2>
	<!-- TODO: run artefact-builder for deck-<x> -->
	<ul>
		<li>TODO: <talking point></li>
	</ul>
</section>
```

## Overview slide

```html
<section id="overview" data-slug="overview">
	<!-- Deck-specific jump menu. NOT portable - it names other slides' slugs. -->
	<h2><Deck title></h2>
	<ul>
		<li><a href="#/<slug-1>"><Section 1 title></a></li>
		<li><a href="#/<slug-2>"><Section 2 title></a></li>
	</ul>
</section>
```
