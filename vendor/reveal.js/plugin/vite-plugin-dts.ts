import { resolve } from 'node:path';
import dts from 'vite-plugin-dts';
import { rewriteLegacyPluginDtsPath } from '../../../build/dts-paths.ts';

export function createPluginDts(pluginName: string) {
	return dts({
		include: [`vendor/reveal.js/plugin/${pluginName}/index.ts`],
		entryRoot: 'vendor/reveal.js/plugin',
		outDir: 'vendor/reveal.js/dist/plugin',
		beforeWriteFile(filePath, content) {
			const rewrittenPath = rewriteLegacyPluginDtsPath(filePath, pluginName);

			if (!rewrittenPath) {
				return false;
			}

			return {
				filePath: resolve(rewrittenPath),
				content,
			};
		},
	});
}
