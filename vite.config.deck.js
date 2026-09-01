/**
 * App-mode build config for publishing a finished deck: `npm run build:deck`.
 * Outputs a self-contained static site to deck-dist/. NOT used by `npm start`
 * (that uses vite.config.ts, Reveal's own dev server).
 */
import { defineConfig } from 'vite';
import slides from './build/vite-plugin-slides.js';

export default defineConfig({
	build: {
		outDir: 'deck-dist',
		emptyOutDir: true,
		target: 'es2020',
	},
	resolve: {
		alias: {
			'reveal.js/plugin': '/plugin',
			'reveal.js': '/js',
			'reveal.css': '/css/reveal.scss',
			'@': '/src',
		},
	},
	plugins: [slides()],
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler',
			},
		},
	},
});
