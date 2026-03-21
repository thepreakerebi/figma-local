---
name: figma-document
description: |
  Use this skill when the user wants complete documentation of a Figma component, frame, or screen — a full recursive breakdown of every element with all specs (colors, spacing, typography, layout, effects, variable bindings) in a structured format that coding agents can directly use to replicate in code. Triggers on: "document this component", "document this screen", "get full specs", "component documentation", "break down this design", "analyze this component for code", "full spec sheet", "replicate this in code", "all the specs for this", "deep inspect", "complete breakdown". Best for when you need everything about a component in one call — not just the top-level element. Requires an element to be selected in Figma or a node ID / Figma link.
allowed-tools:
  - Bash(fig document *)
  - Bash(fig document)
---

# Figma Document

Generate complete, recursive component documentation from Figma. Unlike `fig inspect` (which shows one element), `fig document` walks the **entire tree** of children and produces:

1. **Summary** — component name, type, dimensions, total node count
2. **Design tokens** — all unique colors, typography, spacing, radii, and shadows used across the tree, with usage counts
3. **Component tree** — full recursive JSON of every element with all specs (layout, fills, strokes, typography, effects, variable bindings)

All values in both **px and rem** (base 16px).

## Prerequisites

The `fig` CLI must be connected. Check with `fig daemon status`. If not connected: `fig connect --safe`.

## Commands

### Document current selection
```bash
fig document
```

### JSON output (best for coding agents)
```bash
fig document --json
```
Returns structured JSON with `summary`, `tokens`, and `tree` — directly parseable for code generation.

### Document a specific node
```bash
fig document --node "123:456"
```

### Document from a Figma link
```bash
fig document --link "https://www.figma.com/design/abc/file?node-id=123-456"
```

### Tokens only
```bash
fig document --tokens-only
```
Just the design tokens summary (colors, fonts, spacing, radii, shadows) without the full tree.

## Output Structure (JSON mode)

```json
{
  "summary": {
    "name": "Button",
    "type": "COMPONENT",
    "totalNodes": 5,
    "width": 120,
    "height": 40,
    "isComponent": true
  },
  "tokens": {
    "colors": [
      { "value": "#6366f1", "count": 2 }
    ],
    "typography": [
      { "value": "Inter Medium / 14px", "count": 1 }
    ],
    "spacing": [
      { "value": "8px", "rem": "0.5rem", "count": 1 },
      { "value": "16px", "rem": "1rem", "count": 2 }
    ],
    "radii": [
      { "value": "8px", "rem": "0.5rem", "count": 1 }
    ],
    "shadows": []
  },
  "tree": {
    "name": "Button",
    "type": "COMPONENT",
    "width": { "px": 120, "rem": 7.5 },
    "height": { "px": 40, "rem": 2.5 },
    "layout": {
      "direction": "row",
      "gap": { "px": 8, "rem": 0.5 },
      "padding": { "top": { "px": 8 }, "right": { "px": 16 }, "bottom": { "px": 8 }, "left": { "px": 16 } },
      "mainAxisAlign": "CENTER",
      "crossAxisAlign": "CENTER"
    },
    "fills": [{ "type": "SOLID", "hex": "#6366f1" }],
    "borderRadius": { "px": 8, "rem": 0.5 },
    "children": [
      {
        "name": "Label",
        "type": "TEXT",
        "text": {
          "content": "Click me",
          "fontFamily": "Inter",
          "fontStyle": "Medium",
          "fontSize": { "px": 14, "rem": 0.875 },
          "textAlign": "center"
        },
        "fills": [{ "type": "SOLID", "hex": "#ffffff" }]
      }
    ]
  }
}
```

## When to use `document` vs other commands

| Need | Command |
|------|---------|
| Quick look at one element | `fig inspect` |
| Full component with all children | `fig document` |
| Just CSS for one element | `fig css` |
| All unique styles in a frame | `fig styles` |
| Spacing between two elements | `fig measure` |

## Workflow: Design to Code

1. Select the component in Figma
2. Run `fig document --json` to get the full spec
3. Use the JSON tree to build the component — each node maps to an element, children map to nested elements
4. Use the `tokens` section to set up CSS variables or Tailwind config
5. Verify with `fig verify`
