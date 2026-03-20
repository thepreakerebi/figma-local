---
name: figma-inspect
description: |
  Use this skill when the user wants detailed design specifications from Figma — dimensions, spacing, padding, gap, colors, typography, shadows, border radius, opacity, or variable bindings. Triggers on: "inspect", "get specs", "what are the dimensions", "what font is this", "what color", "spacing", "padding", "design specs", "pixel values", "check the measurements". Also use when translating a Figma design to code and needing exact values. Requires an element to be selected in Figma or a node ID / Figma link.
allowed-tools:
  - Bash(fig inspect *)
  - Bash(fig inspect)
  - Bash(fig measure *)
  - Bash(fig measure)
---

# Figma Inspect

Get detailed design specs for any element in Figma. All values are returned in both **px and rem** (base 16px).

## Prerequisites

The `fig` CLI must be connected. Check with `fig daemon status`. If not connected: `fig connect --safe`.

## Usage

### Inspect current selection

The user must select an element in Figma first, then:

```bash
fig inspect
```

**Returns:**
- **Dimensions** — width, height (px + rem)
- **Position** — x, y (px + rem)
- **Layout** — flex direction, gap, padding (all 4 sides), main/cross axis alignment, wrap
- **Border radius** — uniform or per-corner (px + rem)
- **Fills** — hex color, rgba, opacity, gradient stops
- **Strokes** — color, weight, alignment
- **Typography** — font family, style, size, weight, line-height, letter-spacing, text-align, decoration, transform
- **Effects** — drop shadow, inner shadow, blur (offset, radius, spread, color)
- **Opacity** — when < 1
- **Variable bindings** — which design tokens are bound to which properties
- **Component info** — name, set, main vs instance

### Inspect from a Figma link

```bash
fig inspect --link "https://www.figma.com/design/FILEID/Name?node-id=123-456"
```

### Inspect a specific node

```bash
fig inspect --node "123:456"
```

### Inspect element + all children

```bash
fig inspect --deep
```

This inspects the selected element and then each of its direct children, giving you full specs for a complete component (e.g., a card with its title, description, button).

### Raw JSON output

```bash
fig inspect --json
```

Use `--json` when you need to programmatically process the specs or pass them to another tool.

## Measuring spacing between elements

Select exactly **2 elements** in Figma, then:

```bash
fig measure
```

Returns:
- Horizontal gap between the two elements (px + rem)
- Vertical gap between the two elements (px + rem)
- Center-to-center distance on both axes

## Workflow: From Specs to Code

1. User says "make this button match the Figma design"
2. Ask user to select the button in Figma
3. Run `fig inspect` to get exact specs
4. Run `fig inspect --deep` if it has children (label, icon, etc.)
5. Apply dimensions, padding, colors, typography, border-radius to code
6. Run `fig css` if you want ready-to-paste CSS

## Tips

- If inspect returns nothing for fills/colors, the element itself may have no fill — check its children with `--deep`
- For spacing between sibling elements, use `fig measure` instead of calculating manually
- Use `fig inspect --json | jq '.specs[0].typography'` to extract just typography
- Variable bindings tell you which design tokens are used — map these to your CSS variables or Tailwind config
