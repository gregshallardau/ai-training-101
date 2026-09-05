/**
 * <deck-attention-flow> - the tokeniser's sentence, already chipped, with a
 * "Next" button that steps through curved arrows linking related words -
 * illustrating that a word's meaning depends on the words around it. Plain
 * contextual relationships, not literal attention-weight percentages.
 */
import { DeckElement } from '@/components/deck-element.js';
import { SHARED_STYLES } from '@/components/shared-styles.js';

// ============================================================================
// Default sentence / relationships, used when a slide doesn't pass its own
// `data="..."` attribute (see DeckAttentionFlow._readData below). To use a
// different sentence on a slide WITHOUT touching this file, pass a JSON
// object shaped like { tokens, stages, introCaption? } on the tag itself:
//
//   <deck-attention-flow data='{
//     "tokens": ["The","client","renewal","is","due","in","May"],
//     "stages": [
//       { "arcs": [[1,2]], "caption": "The client owns the renewal." },
//       { "arcs": [[4,5]], "caption": "It is due in May." }
//     ]
//   }'></deck-attention-flow>
//
// TOKENS: the sentence, split into words, in order. Everything else below
// refers to a word by its position in this array (0-based) rather than by
// text, so that e.g. two identical words can't be confused.
//
// STAGES: one entry per click of "Next". Each stage's `arcs` is a list of
// [fromIndex, toIndex] pairs (indices into TOKENS) - an arrow curving from
// word `from` to word `to`. All arcs from earlier stages stay on screen
// (cumulative) once revealed; `caption` is the line of text shown under the
// sentence once that stage is reached. A stage's `arcs` can be `[]` (e.g. a
// closing remark with nothing new to point at).
//
// introCaption is what's shown before the first click; if omitted it
// defaults to the sentence itself (tokens joined with spaces).
// ============================================================================
const DEFAULT_TOKENS = ['The', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog'];

const DEFAULT_STAGES = [
	{ arcs: [[1, 3], [2, 3]], caption: 'We know the fox is quick and brown.' },
	{ arcs: [[7, 8]], caption: 'We know the dog is lazy.' },
	{ arcs: [[3, 8]], caption: 'We know the fox is jumping over the dog.' },
	{ arcs: [], caption: "There's a lot happening in just one sentence." },
];
const DEFAULT_INTRO_CAPTION = 'The quick brown fox jumps over the lazy dog.';

class DeckAttentionFlow extends DeckElement {
	static tag = 'deck-attention-flow';

	static styles = `
		${SHARED_STYLES}

		.wrap { position: relative; }
		.line { display: flex; flex-wrap: wrap; gap: var(--space-gap); margin-block: var(--space-block); min-height: 1.8em; }
		svg.arcs { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
		.arc {
			fill: none;
			stroke: var(--secondary);
			stroke-width: 2;
			marker-end: url(#attn-arrow);
			opacity: 0;
			transition: opacity var(--motion-ui-duration) var(--motion-ui-ease),
				stroke var(--motion-ui-duration) var(--motion-ui-ease),
				stroke-width var(--motion-ui-duration) var(--motion-ui-ease);
		}
		.arc.shown { opacity: 1; }
		.arc.focus { stroke: var(--primary); stroke-width: 2.3; }
		.note { margin-top: var(--space-block); }
	`;

	// a `data="..."` attribute on the tag is a full { tokens, stages,
	// introCaption? } document overriding the defaults above - not merged
	// field-by-field, since stages reference tokens by index and a partial
	// override could easily point at the wrong word.
	_readData() {
		try {
			const parsed = JSON.parse(this.getAttribute('data') || 'null');
			if (parsed?.tokens && parsed?.stages) {
				return {
					tokens: parsed.tokens,
					stages: parsed.stages,
					introCaption: parsed.introCaption ?? parsed.tokens.join(' ') + '.',
				};
			}
		} catch {
			// malformed data attribute - fall through to the built-in default
		}
		return { tokens: DEFAULT_TOKENS, stages: DEFAULT_STAGES, introCaption: DEFAULT_INTRO_CAPTION };
	}

	render() {
		const { tokens: TOKENS, stages: STAGES, introCaption: INTRO_CAPTION } = this._readData();

		const wrap = document.createElement('div');
		wrap.className = 'wrap';

		const line = document.createElement('div');
		line.className = 'line';
		const chips = TOKENS.map((tok) => {
			const span = document.createElement('span');
			span.className = 'chip muted'; // not yet part of a revealed relationship
			span.textContent = tok;
			line.append(span);
			return span;
		});

		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('class', 'arcs');
		// markerUnits="userSpaceOnUse" (rather than the default "strokeWidth")
		// keeps the arrowhead a fixed size regardless of the arc's own
		// stroke-width, so the focus state's thicker line doesn't grow it -
		// 12 matches what "6" at the default stroke-width of 2 used to render as
		svg.innerHTML = `<defs><marker id="attn-arrow" viewBox="0 0 10 10" refX="9" refY="5"
			markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
			<path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker></defs>`;

		const allArcs = STAGES.flatMap((s) => s.arcs);
		const arcStage = STAGES.flatMap((s, si) => s.arcs.map(() => si)); // which stage each arc belongs to

		// every arc touching a given chip - whether landing on it or
		// departing from it - would otherwise anchor at its exact centre.
		// Fine for one arc, but a second (or a departing arc sharing a chip
		// that others land on, e.g. `fox` receiving from quick/brown and
		// also sending to dog) then converges onto the same point, and
		// their paths cross right at that shared hub. Spread every arc
		// touching a chip across its width instead, shortest-span closest
		// to centre, regardless of which end of the arc it is.
		const hubs = new Map(); // chip index -> [{ arc: i, side: 'from' | 'to' }]
		allArcs.forEach((arc, i) => {
			[['from', arc[0]], ['to', arc[1]]].forEach(([side, chipIdx]) => {
				if (!hubs.has(chipIdx)) hubs.set(chipIdx, []);
				hubs.get(chipIdx).push({ i, side });
			});
		});
		const offset = { from: {}, to: {} };
		hubs.forEach((entries) => {
			const bySpan = [...entries].sort((a, b) => Math.abs(allArcs[a.i][1] - allArcs[a.i][0]) - Math.abs(allArcs[b.i][1] - allArcs[b.i][0]));
			bySpan.forEach(({ i, side }, rank) => { offset[side][i] = (rank - (bySpan.length - 1) / 2) * 10; });
		});

		// nesting level per arc: any arc whose span overlaps this one at all
		// must be cleared, so process shortest-span-first and take one level
		// above the tallest conflict already placed - guarantees a
		// containing/crossing arc is always strictly taller than everything
		// it has to arch over, how ever many are nested inside it.
		const overlaps = (p, q) => p[0] < q[1] && q[0] < p[1];
		const bySpanAsc = allArcs.map((_, i) => i).sort((i, j) => Math.abs(allArcs[i][1] - allArcs[i][0]) - Math.abs(allArcs[j][1] - allArcs[j][0]));
		const level = {};
		bySpanAsc.forEach((i) => {
			const conflicts = bySpanAsc.filter((j) => level[j] !== undefined && overlaps(allArcs[i], allArcs[j]));
			level[i] = conflicts.length ? Math.max(...conflicts.map((j) => level[j])) + 1 : 0;
		});
		const paths = allArcs.map(() => {
			const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			p.setAttribute('class', 'arc');
			svg.append(p);
			return p;
		});

		wrap.append(line, svg);

		const note = document.createElement('p');
		note.className = 'note';
		note.textContent = INTRO_CAPTION;

		const btn = document.createElement('button');
		btn.className = 'btn success';

		const resetBtn = document.createElement('button');
		resetBtn.className = 'btn ghost success';
		resetBtn.textContent = 'Reset';

		const row = document.createElement('div');
		row.className = 'row';
		row.append(btn, resetBtn);

		this.shadowRoot.append(wrap, row, note);

		// arc paths depend on the chips' actual rendered positions - but this
		// slide is `display:none` (not yet the "present" slide) at upgrade
		// time, so getBoundingClientRect() is all zeros until Reveal actually
		// shows it. A ResizeObserver on `wrap` catches that display:none ->
		// visible transition (and any later layout change); the viewBox is
		// recomputed from the same rect each time so the coordinates stay
		// correct however Reveal's own transform is scaling the slide.
		const drawArcs = () => {
			const wrapRect = wrap.getBoundingClientRect();
			if (!wrapRect.width) return; // still hidden - nothing to measure yet
			svg.setAttribute('viewBox', `0 0 ${wrapRect.width} ${wrapRect.height}`);
			allArcs.forEach(([from, to], i) => {
				const a = chips[from].getBoundingClientRect();
				const b = chips[to].getBoundingClientRect();
				const x1 = a.left + a.width / 2 - wrapRect.left + offset.from[i];
				const x2 = b.left + b.width / 2 - wrapRect.left + offset.to[i];
				const y = a.top - wrapRect.top;
				const midX = (x1 + x2) / 2;
				// nesting level does the heavy lifting against crossing; a
				// smaller span-based term on top just keeps same-level arcs
				// looking proportionate to how far they travel. Comparing
				// peak heights alone isn't quite enough though: a wide arc's
				// peak sits far from a narrow nested arc's peak, so near
				// their shared endpoint the wide arc can already be well
				// into its descent - keeping level-0 arcs low gives that
				// descent room to clear them.
				const lift = (10 + level[i] * 40 + Math.abs(to - from)) * 4;
				paths[i].setAttribute('d', `M${x1} ${y} Q${midX} ${y - lift} ${x2} ${y}`);
			});
		};
		drawArcs();
		new ResizeObserver(drawArcs).observe(wrap);

		let stage = 0;
		const isDone = () => stage >= STAGES.length;
		const sync = () => {
			const shown = STAGES.slice(0, stage).flatMap((s) => s.arcs);
			const currentStage = stage - 1; // the stage just revealed by the last click, if any
			paths.forEach((p, i) => {
				p.classList.toggle('shown', i < shown.length);
				p.classList.toggle('focus', i < shown.length && arcStage[i] === currentStage);
			});

			const activated = new Set(shown.flat());
			chips.forEach((chip, i) => {
				chip.classList.toggle('muted', !activated.has(i));
				chip.classList.toggle('primary', activated.has(i));
			});

			note.textContent = stage === 0 ? INTRO_CAPTION : STAGES[stage - 1].caption;
			btn.disabled = isDone();
			btn.textContent = isDone() ? 'Done' : 'Next →';
		};

		btn.addEventListener('click', () => {
			if (isDone()) return;
			stage++;
			sync();
		});
		resetBtn.addEventListener('click', () => {
			stage = 0;
			sync();
		});

		sync();
	}
}

customElements.define(DeckAttentionFlow.tag, DeckAttentionFlow);
