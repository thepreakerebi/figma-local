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

Access team library components and variables from other Figma files. Index libraries via REST API or plugin, search components by name, import by key, and browse design tokens.

## Prerequisites

- The `fig` CLI must be connected: `fig daemon status`. If not: `fig connect --safe`.
- The Figma plugin must have `teamlibrary` permission in its manifest. If library commands fail with a permission error, re-import the plugin in Figma (Plugins → Development → Import from manifest).

## IMPORTANT: How to access library components

Figma's plugin API does **not** allow browsing library components directly. To work with library components, you must **index** them first. There are three ways to index:

### Option A: REST API (recommended for large files)

No plugin needed. Works on any file size without hanging Figma.

**First time — provide token and file URL:**
```bash
fig library index --api --token "figd_xxxxx" --file "https://www.figma.com/design/ABC123/MyFile"
```

The token is saved for future use. Get one from: Figma → Settings → Personal Access Tokens.

**After first time — just provide the file URL:**
```bash
fig library index --api --file "https://www.figma.com/design/ABC123/MyFile"
```

### Option B: Page-by-page (for large files via plugin)

Open the library file in Figma, then scan one page at a time:

```bash
fig library index --page "Buttons"
fig library index --page "Inputs"
fig library index --page "Cards"
```

Each page's components are merged into the same index file. This avoids hanging on large files.

### Option C: Full scan (small files only)

Open the library file in Figma, then:

```bash
fig library index
```

**Warning:** This scans ALL pages at once. Only use on small files — large design systems will cause Figma to hang.

## After indexing: Search and Import

### Search indexed libraries

```bash
fig library search --name "button"
fig library search --name "input"
fig library search --name "card"
fig library search --name "checkbox"
```

Returns: component name, key (for importing), component set, page, and library name.

### List indexed libraries

```bash
fig library list
```

### Import by key

```bash
fig library import --key "<key-from-search>"
fig library import --key "<key>" --name "PrimaryButton"
```

The component is placed at viewport center and selected.

### Inspect the imported component

```bash
fig inspect --deep
```

## Variables (no indexing needed)

Library variables are available directly via the plugin API:

```bash
fig library collections                    # List variable collections
fig library variables                      # List all variables
fig library variables --name "color"       # Search by name
```

## Components on current page

Find library components already dragged onto the current page:

```bash
fig library components
fig library components --name "button"
```

## Full workflow

1. **Index** the library (pick one method):
   ```bash
   # Best for large files:
   fig library index --api --token "figd_..." --file "https://..."
   # Or page by page:
   fig library index --page "Buttons"
   ```

2. **Search** for components:
   ```bash
   fig library search --name "button" --json
   ```

3. **Import** into your working file:
   ```bash
   fig library import --key "<key>"
   ```

4. **Inspect** for full specs:
   ```bash
   fig inspect --deep
   ```

5. **Get variables** for tokens:
   ```bash
   fig library variables --name "primary" --json
   ```

6. **Replicate** in code.

## Tips

- **REST API is fastest** for large design systems — no file opening needed.
- Token is saved after first use in `~/.figma-local/figma-token`.
- Page-by-page indexing merges results — run multiple times to build up the index.
- Re-index when the library is updated to get new components.
- `fig library search --name "" --json` returns ALL indexed components.
- Component keys are stable across file versions — save them for repeated imports.
