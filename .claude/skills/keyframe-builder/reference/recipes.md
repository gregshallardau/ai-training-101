# Keyframe recipes

All three compose `r-stack` / `r-hstack` / `fragment` - nothing here is a new
class. Swap `<slug>`, image paths, and copy for the real slide.

---

## 1. Question -> answer swap (the canonical case)

A picture on the left, a question, an arrow, and a placeholder that becomes
the answer picture on the *same* click the placeholder disappears.

```html
<section id="<slug>" data-slug="<slug>">
	<h2>What animal lives here?</h2>
	<div class="r-hstack">
		<img class="r-stretch" src="/<habitat>.png" alt="">
		<p class="text-muted">&rarr;</p>
		<div class="r-stack">
			<p class="fragment fade-out" data-fragment-index="0">?</p>
			<img class="fragment" data-fragment-index="0" src="/<animal>.png" alt="">
		</div>
	</div>
</section>
```

Why it works: `r-stack` puts the `?` and the answer `<img>` in the same grid
cell (`grid-area: 1/1`), so the answer appears exactly where the `?` was - no
layout shift, nothing appears below. The shared `data-fragment-index="0"`
means one click fires both: the `?` fades out, the picture fades in.

**Variant - pop instead of crossfade:** swap the answer's fragment class from
(default fade-in) to `grow` - it scales up in place instead of fading in.
**Variant - the placeholder just vanishes instead of fading:** use `fade-out`
still, or drop it to instant (no fragment class on the `?`, it will vanish the
moment the sibling's `grid-area` paints over it as the image fills the cell).

---

## 2. Sequential build-up in fixed slots

Every slot exists and is laid out from the first frame; each click reveals
one that was invisible. Nothing new is inserted - `.flex-cols` (or
`.flex-rows`) fixes the layout up front.

```html
<section id="<slug>" data-slug="<slug>">
	<h2>How the pipeline fits together</h2>
	<div class="flex-cols">
		<div class="box">Input</div>
		<p class="fragment" data-fragment-index="0">&rarr;</p>
		<div class="box fragment" data-fragment-index="0">Encoder</div>
		<p class="fragment" data-fragment-index="1">&rarr;</p>
		<div class="box fragment" data-fragment-index="1">Decoder</div>
	</div>
</section>
```

Each click reveals one arrow + one box together (paired index) - the row
never reflows because every box already occupies its column; unrevealed ones
are just `opacity: 0` until their step.

---

## 3. Before -> after swap (full-slide)

Two states of the same picture (or diagram), same slot, second one replaces
the first on click.

```html
<section id="<slug>" data-slug="<slug>">
	<h2>Before refactoring &rarr; after</h2>
	<div class="r-stack">
		<img class="r-stretch" src="/<before>.png" alt="">
		<img class="r-stretch fragment" src="/<after>.png" alt="">
	</div>
</section>
```

No shared index needed - the "before" doesn't need to explicitly fade out;
the "after" painting over the same grid cell is enough. Add `fade-out` to the
"before" `<img>` (paired index with the "after") only if you want them to
visibly cross-dissolve rather than the after simply covering the before.
