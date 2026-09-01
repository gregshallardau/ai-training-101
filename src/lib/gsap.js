/**
 * GSAP integration - big hero / section-break motion ONLY.
 * In-slide element reveals are Reveal's fragments; do not duplicate that here.
 */
import { gsap } from 'gsap';
// import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Wire GSAP defaults from the framework's semantic custom properties, so hero
 * animations share the deck's motion feel. Call once from main.js.
 */
export function initGsap(root = document.documentElement) {
	const cs = getComputedStyle(root);
	const ms = parseFloat(cs.getPropertyValue('--motion-hero-duration')) || 600;
	gsap.defaults({ duration: ms / 1000, ease: 'power3.out' });
	// gsap.registerPlugin(ScrollTrigger);
	return gsap;
}

export { gsap };
