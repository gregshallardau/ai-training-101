import { resolve } from 'path';
import { ModuleFormat } from 'rollup';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { rewriteLegacyCoreDtsPath } from './build/dts-paths.ts';
import slides from './build/vite-plugin-slides.js';

export const appendExtension = (format: ModuleFormat, name: String): string => {
	if (format === 'es') {
		return `${name}.mjs`;
	} else {
		return `${name}.js`;
	}
};

export default defineConfig({
	server: {
		port: Number(process.env.npm_config_port || 8000),
	},
	build: {
		target: ['es2015'],
		emptyOutDir: true,
		outDir: 'vendor/reveal.js/dist',
		lib: {
			formats: ['es', 'umd'],
			entry: resolve(__dirname, 'vendor/reveal.js/js/index.ts'),
			name: 'Reveal',
			fileName: (format, entryName) => {
				return appendExtension(format, 'reveal');
			},
		},
		rollupOptions: {
			output: {
				assetFileNames: 'reveal.[ext]',
			},
		},
	},
	resolve: {
		alias: {
			// Matches the exported paths in package.json
			'reveal.js/plugin': '/vendor/reveal.js/plugin',
			'reveal.js': '/vendor/reveal.js/js',
			'reveal.css': '/vendor/reveal.js/css/reveal.scss',
			// Framework source
			'@': '/src',
		},
	},
	plugins: [
		// Assembles slides/*.{html,md} into index.html's `<!-- @slides -->` marker.
		// Inert during the core library build (no index.html processed there).
		slides(),
		dts({
			insertTypesEntry: true,
			rollupTypes: false,
			exclude: ['**/index.ts'],
			copyDtsFiles: true,
			beforeWriteFile(filePath, content) {
				return {
					filePath: rewriteLegacyCoreDtsPath(filePath),
					content,
				};
			},
		}),
	],
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler',
			},
		},
	},
});
