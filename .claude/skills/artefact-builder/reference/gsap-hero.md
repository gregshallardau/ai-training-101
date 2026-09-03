# Recipe: hero / section-break animation (GSAP)

For **one big choreographed entrance** - a title building in, a section divider,
a headline whose words stagger up. One timeline, plays when the slide arrives.

Not for: step-by-step in-slide reveals - those are Reveal **fragments**
(`class="fragment"`, see `docs/cheatsheet.md`), never GSAP. Not for reactive
demos (`alpine-interactive.md`).

## Pattern

- `import { gsap } from '@/lib/gsap.js'`. `initGsap()` in `main.js` has already
  set `gsap.defaults()` from `--motion-hero-duration` / an ease, so a bare
  `gsap.from(...)` already feels like the deck.
- Build the timeline in `render()`, targeting nodes in `this.shadowRoot`.
- Replay on slide entry: listen once for Reveal's `slidechanged` and check the
  event's `currentSlide` contains this element.
- `prefers-reduced-motion`: skip the animation, leave elements at their final
  state.

## Worked example - `<deck-hero-title>`

```js
// src/components/hero-title/index.js
import { DeckElement } from '../deck-element.js';
import { gsap } from '@/lib/gsap.js';

class DeckHeroTitle extends DeckElement {
	static tag = 'deck-hero-title';

	static styles = `
		:host { display: block; }
		h1 { margin: 0; font: 700 var(--r-heading1-size, 2.5em)/1.1 var(--font-heading); color: var(--fg); }
		.word { display: inline-block; will-change: transform, opacity; }
	`;

	render() {
		const h1 = document.createElement('h1');
		const text = this.getAttribute('text') || this.textContent.trim();
		h1.innerHTML = text.split(/\s+/)
			.map((w) => `<span class="word">${w}</span>`).join(' ');
		this.shadowRoot.append(h1);

		const words = h1.querySelectorAll('.word');
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const play = () => gsap.from(words, { y: '0.6em', opacity: 0, stagger: 0.06 });
		play();
		Reveal.on('slidechanged', (e) => {
			if (e.currentSlide.contains(this)) play();
		});
	}
}

customElements.define(DeckHeroTitle.tag, DeckHeroTitle);
```

Slide: `<deck-hero-title text="It's not about the car"></deck-hero-title>`

## Rules

- One timeline per component. Do not animate many small things over many clicks -
  that is fragments.
- Durations/eases come from `gsap.defaults()` or the `--motion-*` custom
  properties - never a hard-coded second count.
- Always honour `prefers-reduced-motion`.
- `Reveal` is on `window` (set in `main.js`); guard with `typeof Reveal` if the
  component might load before it.
