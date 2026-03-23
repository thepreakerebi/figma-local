---
name: figma-library
description: |
  Use this skill when the user wants to access, browse, import, or use components and variables from a Figma team library or external Figma file. Triggers on: "library components", "import component", "library variables", "team library", "use components from another file", "get the button from the library", "what components are available", "design system components", "import from library", "library collections", "index the library", "scan components", "search for a component". Also use when building UI and the user references a design system or component library in another Figma file.
allowed-tools:
  - Bash(fig library *)
  - Bash(fig library)
  - Bash(fig inspect *)
  - Bash(fig read *)
---

# Figma Library

Access team library components and variables from other Figma files. Index libraries, search components by name, import by key, and browse design tokens.

## Prerequisites

- The `fig` CLI must be connected: `fig daemon status`. If not: `fig connect --safe`.
- The Figma plugin must have `teamlibrary` permission in its manifest. If library commands fail with a permission error, re-import the plugin in Figma (Plugins → Development → Import from manifest).
- Libraries must be enabled in the current Figma file (check Assets panel → team library icon).

## IMPORTANT: How to access library components

Figma's plugin API does **not** allow browsing library components directly. To work with library components, you must **index** them first:

1. Open the **library file** in Figma (the file that contains the components)
2. Run `fig library index` — this scans all pages and saves every component with its key
3. Switch to your **working file**
4. Run `fig library search --name "button"` — finds components from indexed libraries
5. Run `fig library import --key "<key>"` — imports the component

## Usage

### Index a library (run in the library file)

Open the library/design system file in Figma, then:

```bash
fig library index
```

This scans ALL pages in the file and saves every component (name, key, description, page, size, component set) to `~/.figma-local/libraries/<filename>.json`.

Re-run this command after the library is updated to refresh the index.

### Search indexed libraries

Search across all indexed libraries by component name:

```bash
fig library search --name "button"
fig library search --name "input"
fig library search --name "card"
fig library search --name "checkbox"
```

Returns: component name, key (for importing), component set, page, size, and library name.

Use `--json` for structured output:

```bash
fig library search --name "button" --json
```

### List indexed libraries

See what libraries have been indexed:

```bash
fig library list
```

Returns: library name, component count, page count, and when it was indexed.

### Import a component by key

Import a library component onto the canvas by its key:

```bash
fig library import --key "abc123def456..."
```

Import and rename:

```bash
fig library import --key "abc123def456..." --name "PrimaryButton"
```

The imported component instance is placed at the viewport center and selected.

### List library variable collections

See what variable collections are available from linked libraries:

```bash
fig library collections
```

### List library variables

Browse all variables across all linked library collections:

```bash
fig library variables
fig library variables --name "color"
fig library variables --name "spacing"
```

### List components on current page

Find library components that are already used on the current page:

```bash
fig library components
fig library components --name "button"
```

### JSON output

All commands support `--json` for structured output.

## Workflow: Building UI with library components

1. **Index** the library (one-time, in the library file):
   ```bash
   fig library index
   ```

2. **Switch** to your working file in Figma.

3. **Search** for the components you need:
   ```bash
   fig library search --name "button"
   fig library search --name "input"
   ```

4. **Import** each component by key:
   ```bash
   fig library import --key "<key-from-search>"
   ```

5. **Inspect** the imported component to get its full specs:
   ```bash
   fig inspect --deep
   ```

6. **Get variables** for design tokens:
   ```bash
   fig library variables --name "primary" --json
   ```

7. **Replicate** in code using the exact specs and token values.

## Workflow: Extracting a full design system

1. Open the design system file → `fig library index`
2. Get all components: `fig library search --name "" --json`
3. Get all variables: `fig library variables --json`
4. Import key components one by one and document them:
   ```bash
   fig library import --key "<key>"
   fig document --json
   ```

## Tips

- **Index once, search many times** — the index is saved locally and persists across sessions.
- Re-index when the library is updated: open the library file → `fig library index`.
- `fig library components` only finds components already on the current page. Use `search` for the full library.
- After importing a component, use `fig inspect --deep` to get full specs including variable bindings.
- Component keys are stable across file versions — save them for repeated imports.
- Use `fig library search --name "button" --json | jq '.[].key'` to extract just the keys.
