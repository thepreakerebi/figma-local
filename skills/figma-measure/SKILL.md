---
name: figma-measure
description: |
  Use this skill when the user wants to measure spacing, gaps, or distances between elements in Figma. Triggers on: "measure spacing", "distance between", "gap between", "how far apart", "spacing between elements", "measure the gap". Requires exactly 2 elements to be selected in Figma.
allowed-tools:
  - Bash(fig measure *)
  - Bash(fig measure)
---

# Figma Measure

Measure the exact spacing between two selected elements in Figma. Returns horizontal gap, vertical gap, and center-to-center distance — all in px and rem.

## Prerequisites

The `fig` CLI must be connected. Check with `fig daemon status`. If not connected: `fig connect --safe`.

## Usage

Select exactly **2 elements** in Figma (hold Shift and click both), then:

```bash
fig measure
```

**Output example:**
```
Submit Button (120x44)
  |
Cancel Button (100x44)

Spacing
  Horizontal: 16px (1rem)
  Vertical:   0px (0rem)
Center-to-center
  X: 126px (7.875rem)
  Y: 0px (0rem)
```

### Raw JSON output

```bash
fig measure --json
```

## When to use

- Checking the gap between sibling elements (buttons, cards, list items)
- Verifying margin/spacing values when coding a layout
- Comparing spacing consistency across a design
- Measuring distance between a label and its input field

## Tips

- Select exactly 2 elements — fewer or more will fail
- Hold Shift in Figma to multi-select
- Horizontal spacing of 0 means elements overlap or are aligned vertically
- Vertical spacing of 0 means elements are on the same horizontal line
- Center-to-center distance is useful for grid alignment verification
