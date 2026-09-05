# This deck's components

One folder per `<deck-*>` custom element **this deck** defines - the same
deck-author surface as `slides/`, `deck.css`, and `deck.config.js` (all at the
repo root, all things you'd carry over or rewrite per-deck; everything under
`src/` is framework machinery you never edit).

```
components/
  <kebab-name>/
    index.js      the ONLY place customElements.define('deck-<kebab-name>', ...) runs
    (partials, assets as needed)
```

- The component **contract** (base class, registry, shared style vocabulary)
  is framework machinery and lives in `src/components/` - see
  `src/components/README.md`.
- **`src/components/registry.js`** is still the one manifest of what exists -
  it imports each `index.js` from here and lists it in `COMPONENTS`.
- Built by the `artefact-builder` skill (`.claude/skills/artefact-builder/`).
  A slide places the `<deck-*>` tag; it never reaches into this folder
  directly.
