---
name: figma-styles
description: |
  Use this skill when the user wants to extract a style guide, design system overview, or all unique styles from a Figma frame or component. Triggers on: "what styles are used", "style guide", "extract colors", "extract typography", "what fonts", "spacing scale", "design system", "all the colors in this frame", "text styles", "border radii used". Also use when setting up a project's CSS variables, Tailwind config, or theme from a Figma design. Requires a frame name or element selected in Figma.
allowed-tools:
  - Bash(fig styles *)
  - Bash(fig styles)
  - Bash(fig read *)
  - Bash(fig read)
---

# Figma Styles

Extract all unique text styles, colors, spacing values, and border radii from a Figma frame — a complete mini style guide for translating designs to code.

## Prerequisites

The `fig` CLI must be connected. Check with `fig daemon status`. If not connected: `fig connect --safe`.

## Usage

### Extract styles from a named frame

```bash
fig styles "Login Screen"
```

**Output example:**
```
Typography (4 styles)
  Inter Bold  24px (1.5rem)  line-height: 32px  x2
  Inter Medium  16px (1rem)  line-height: 24px  x5
  Inter Regular  14px (0.875rem)  line-height: 20px  x8
  Inter Regular  12px (0.75rem)  line-height: 16px  x3

Colors (6 unique)
  #18181b  used by: Heading, Label  x7
  #71717a  used by: Description, Helper text  x4
  #ffffff  used by: Card, Input  x3
  #f4f4f5  used by: Background  x1
  #3b82f6  used by: Button  x2
  #ef4444  used by: Error text  x1

Spacing scale (5 values)
  4px      0.25rem   x3
  8px      0.5rem    x8
  12px     0.75rem   x4
  16px     1rem      x6
  24px     1.5rem    x2

Border radii (3 values)
  4px      0.25rem   x2
  8px      0.5rem    x5
  full     full      x3
```

### Extract from current selection

```bash
fig styles --selection
```

### Extract from a Figma link

```bash
fig styles --link "https://www.figma.com/design/FILEID/Name?node-id=123-456"
```

### Raw JSON output

```bash
fig styles --json
```

## What it extracts

| Category | Details |
|----------|---------|
| **Typography** | Font family, style, size (px + rem), line-height, usage count |
| **Colors** | Hex values, which layers use them, usage count (fills + strokes) |
| **Spacing** | All gap and padding values used (px + rem), usage count |
| **Border radii** | All corner radius values (px + rem), usage count |

## Workflow: Setting Up a Project Theme

1. **Scan the canvas:** `fig read` to see available frames
2. **Extract styles:** `fig styles "Main Screen"` to get the full style inventory
3. **Map to your system:**
   - Typography → CSS font classes or Tailwind `text-*` utilities
   - Colors → CSS custom properties or Tailwind `colors` config
   - Spacing → Tailwind `spacing` scale or CSS variables
   - Radii → Tailwind `borderRadius` config
4. **Export tokens if available:** `fig var export css` or `fig var export tailwind`

## Combining with other commands

```bash
# Get the full picture for a frame
fig read "Dashboard"           # Structure + component tree
fig styles "Dashboard"         # All unique styles used
fig var export css             # Design tokens as CSS variables

# Then for individual components
fig inspect                    # Exact specs for selected element
fig css                        # Ready-to-paste CSS
```

## Tips

- Usage count (`xN`) shows how many times a style appears — higher counts indicate primary/system styles
- Colors are sorted by frequency — the most-used color appears first
- Spacing values are sorted by size — helps identify the spacing scale
- Use `--json` to pipe into scripts that generate Tailwind configs or CSS variable files
- Run on the top-level page frame to get the complete style inventory for a screen
