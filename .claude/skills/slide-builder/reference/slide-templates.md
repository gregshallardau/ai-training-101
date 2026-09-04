# Slide templates

Three shapes. Replace `<slug>` with the kebab slug (also the filename stem).

---

## 1. Markdown slide - `NN-<slug>.md`

```md
## Heading

- point one
- point two

--

### Optional vertical sub-slide

Body.

Note: speaker note, stripped from the slide.
```

No `<section>` wrapper - `build/vite-plugin-slides.js` adds it. `--` on its own
line starts a vertical sub-slide. A `Note:` line becomes a speaker note.

---

## 2. HTML slide using a canonical component - `NN-<slug>.html`

```html
<section id="<slug>" data-slug="<slug>">
	<h2>Heading</h2>
	<deck-<component> attr="value"></deck-<component>>
</section>
```

`deck-<component>` MUST already be in `src/components/registry.js`. The slide only
places the tag - no `<style>`, no behaviour.

---

## 3. Fully-inlined artefact slide - `NN-<slug>.html`

```html
<section id="<slug>" data-slug="<slug>">
	<style>
		#<slug> .thing {
			color: var(--surface-fg);
			gap: var(--space-gap);
			border-radius: var(--radius-card);
			transition: opacity var(--motion-ui-duration) var(--motion-ui-ease);
		}
	</style>
	<h2>Heading</h2>
	<div class="thing"></div>
	<script type="module">
		// zero imports. browser-native only. scope by the slide's own id.
		// wait for 'load' before reading computed custom properties - the
		// framework CSS is JS-injected in dev and may not be live yet.
		addEventListener('load', () => {
			const root = document.getElementById('<slug>');
			const accent = getComputedStyle(document.documentElement)
				.getPropertyValue('--accent').trim();
			// ...
		});
	</script>
</section>
```

Rules: semantic custom properties only (no primitives, no literals); `<style>`
selectors keyed under `#<slug>`; inline `<script>` has **no imports**, never uses
`document.currentScript` (null once bundled), and defers any `getComputedStyle`
custom-property read to the `load` event. If it needs a library, it is not an
inline artefact - make a `<deck-*>` with `artefact-builder`.

---

## 4. HTML slide as its own vertical stack, with fragments - `NN-<slug>.html`

One file, nested `<section>`s - each is a sub-slide reached with the down
arrow. Use this shape (instead of sibling `NN.M-<slug>` files) when the
sub-slides are tightly coupled, e.g. one item per sub-slide under a shared
question.

```html
<section id="<slug>" data-slug="<slug>">
	<section>
		<h2>Shared question</h2>
		<img class="r-stretch" src="/<asset>.png" alt="">
		<p class="fragment">revealed on the next arrow press</p>
	</section>
	<section>
		<img class="r-stretch" src="/<asset-2>.png" alt="">
		<p class="fragment">revealed on the next arrow press</p>
	</section>
</section>
```

Fragments on a sub-slide resolve before Reveal advances to the next sub-slide
- no extra wiring needed. Images referenced from `public/` are root-relative
(`public/pictures/x.png` -> `src="/pictures/x.png"`, never `/public/...`).
See framework-conventions.md section 8 for the full fragment class list.
