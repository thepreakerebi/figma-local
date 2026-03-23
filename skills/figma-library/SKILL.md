---
name: figma-library
description: |
  Use this skill when the user wants to access, browse, import, or use components and variables from a Figma team library or external Figma file. Triggers on: "library components", "import component", "library variables", "team library", "use components from another file", "get the button from the library", "what components are available", "design system components", "import from library", "library collections". Also use when building UI and the user references a design system or component library in another Figma file.
allowed-tools:
  - Bash(fig library *)
  - Bash(fig library)
  - Bash(fig inspect *)
  - Bash(fig read *)
---

# Figma Library

Access team library components and variables from other Figma files. Import components by key and browse available design tokens.

## Prerequisites

- The `fig` CLI must be connected: `fig daemon status`. If not: `fig connect --safe`.
- The Figma plugin must have `teamlibrary` permission in its manifest. If library commands fail with a permission error, re-import the plugin in Figma (Plugins → Development → Import from manifest).
- Libraries must be enabled in the current Figma file (check Assets panel → team library icon).

## Usage

### List library variable collections

See what variable collections are available from linked libraries:

```bash
fig library collections
```

Returns: collection name, library name, and collection key for each.

### List library variables

Browse all variables across all linked library collections:

```bash
fig library variables
```

Filter by name:

```bash
fig library variables --name "color"
fig library variables --name "spacing"
fig library variables --name "radius"
```

Returns: variable name, type (COLOR, FLOAT, STRING), key, collection, and library name.

### List library components

Find library components that are already used on the current page:

```bash
fig library components
```

Filter by name:

```bash
fig library components --name "button"
fig library components --name "input"
fig library components --name "card"
```

Returns: component name, component set, key, description, and whether it's remote (library) or local.

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

### JSON output

All commands support `--json` for structured output:

```bash
fig library collections --json
fig library variables --json
fig library variables --name "color" --json
fig library components --json
```

## Workflow: Building with library components

1. **Discover** what's available:
   ```bash
   fig library collections
   fig library variables --name "color"
   fig library components --name "button"
   ```

2. **Import** the components you need:
   ```bash
   fig library import --key "<key-from-step-1>"
   ```

3. **Inspect** the imported component to get its specs:
   ```bash
   fig inspect --deep
   ```

4. **Read** variables to get token values:
   ```bash
   fig library variables --name "primary" --json
   ```

5. **Replicate** in code using the exact specs and token values.

## Workflow: Extracting a design system

1. List all variable collections:
   ```bash
   fig library collections --json
   ```

2. Export all variables grouped by type:
   ```bash
   fig library variables --name "color" --json > colors.json
   fig library variables --name "spacing" --json > spacing.json
   fig library variables --name "radius" --json > radii.json
   ```

3. Find key components:
   ```bash
   fig library components --json
   ```

4. Import and document each:
   ```bash
   fig library import --key "<key>"
   fig document --json
   ```

## Tips

- If `fig library components` returns empty, drag some components from the Assets panel onto the page first — the command scans instances on the current page.
- Use `fig library variables --json` and pipe to `jq` for filtering: `fig library variables --json | jq '.[] | select(.resolvedType == "COLOR")'`
- After importing a component, use `fig inspect --deep` to get full specs including variable bindings.
- Component keys are stable across file versions — save them for repeated imports.
