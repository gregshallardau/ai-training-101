# Editing src/components/registry.js

Two minimal additions per component. Preserve existing indentation (tabs) and the
alphabetical-ish ordering already in the file.

### 1. Import line

In the `// --- component imports ---` block. The path reaches up from
`src/components/` to the repo-root `components/`, where the implementation
actually lives:

```js
import '../../components/<name>/index.js';
```

### 2. COMPONENTS entry

In the `COMPONENTS` object:

```js
'<name>': { tag: 'deck-<name>', dir: '<name>' },
```

### Example diff

```diff
 // --- component imports (each self-registers) ---
+import '../../components/hero-title/index.js';

 export const COMPONENTS = {
+	'hero-title': { tag: 'deck-hero-title', dir: 'hero-title' },
 };
```

Do not otherwise reformat the file. Do not remove the commented example lines
unless real entries make them redundant. After editing, `assertRegistered()` will
warn in the console if a listed tag never called `customElements.define`.
