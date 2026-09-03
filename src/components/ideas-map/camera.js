import { d3 } from '@/lib/d3.js';
import { W, H } from './dataset.js';

export function bboxOf(nodes, pad = 60) {
	if (!nodes.length) return { cx: W / 2, cy: H / 2, w: W };
	const xs = nodes.map((n) => n.x);
	const ys = nodes.map((n) => n.y);
	const x0 = Math.min(...xs); const x1 = Math.max(...xs);
	const y0 = Math.min(...ys); const y1 = Math.max(...ys);
	return {
		cx: (x0 + x1) / 2,
		cy: (y0 + y1) / 2,
		w: Math.max(x1 - x0, y1 - y0) + pad * 2,
	};
}

export function makeCamera(viewEl, width = W) {
	const aspect = H / W;
	let current = [width / 2, (width * aspect) / 2, width];

	function apply(view) {
		const [cx, cy, w] = view;
		const k = width / w;
		const tx = width / 2 - cx * k;
		const ty = (width * aspect) / 2 - cy * k;
		viewEl.setAttribute('transform', `translate(${tx},${ty}) scale(${k})`);
		current = view;
	}

	return {
		zoomTo: apply,
		view: () => current,
		easeTo(target, { duration = 0 } = {}) {
			if (duration <= 0) { apply(target); return; }
			const i = d3.interpolateZoom(current, target);
			d3.select(viewEl).transition().duration(duration)
				.tween('cam', () => (t) => apply(i(t)));
		},
	};
}
