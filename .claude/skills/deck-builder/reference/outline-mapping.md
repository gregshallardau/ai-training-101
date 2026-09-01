# Outline -> slides mapping

## Heading levels

| Outline                                   | Becomes                                   |
|-------------------------------------------|-------------------------------------------|
| First `#` / given title                   | deck title (`00-title.html`)              |
| `##` heading                              | horizontal section slide `NN-<slug>`      |
| Lone numbered line, e.g. `5. Context`     | horizontal section slide                  |
| `###` under a `##`                        | vertical child `NN.M-<slug>` (if nested)  |
| Bullet list under a heading               | `TODO:` stub bullets in that slide        |
| Free prose under a heading                | `TODO:` stub bullets (one per sentence-ish)|

## Numbering

```
00-title.html
01-overview.html          jump menu - <a href="#/<slug>"> per section; NOT portable
02-<first-section>.md|html
03-<next-section>...
03.1-<child>...           vertical children share the parent major
```

Zero-padded, step 1. Recompute widths if there are >= 100 slides.

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
