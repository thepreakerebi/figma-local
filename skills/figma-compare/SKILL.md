---
name: figma-compare
description: |
  Use this skill when the user wants to visually compare two things — two Figma elements, a screenshot vs a Figma component, two screenshots, or a design vs coded output. Triggers on: "compare", "diff", "does this match", "check against", "visual comparison", "how close is this", "spot the differences", "compare design to code", "compare these two", "are they the same". Also use when verifying coded UI matches a Figma design. Requires the fig CLI to be connected.
allowed-tools:
  - Bash(fig compare *)
  - Bash(fig compare)
  - Bash(fig verify *)
  - Bash(fig verify)
  - Bash(fig screenshot *)
  - Bash(fig screenshot)
  - Read
---

# Figma Compare

Visually compare any two sources: Figma selections, node IDs, Figma links, or screenshot files. Outputs both images and a structured gap report template for analysis.

## Prerequisites

The `fig` CLI must be connected. Check with `fig daemon status`. If not connected: `fig connect --safe`.

## Usage

### Compare current selection vs a node

```bash
fig compare --a selection --b "123:456"
```

### Compare two screenshot files

```bash
fig compare --a design.png --b coded-output.png
```

### Compare a screenshot file vs a Figma node

```bash
fig compare --a screenshot.png --b "123:456"
```

### Compare two Figma links

```bash
fig compare --a-link "https://www.figma.com/...?node-id=1-2" --b-link "https://www.figma.com/...?node-id=3-4"
```

### Compare selection vs a Figma link

```bash
fig compare --a selection --b-link "https://www.figma.com/...?node-id=123-456"
```

### Compare two nodes by ID

```bash
fig compare --a "123:456" --b "789:012"
```

## Source types

The `--a` and `--b` options accept three source types:

| Source | Example | Description |
|--------|---------|-------------|
| `selection` | `--a selection` | Whatever is currently selected in Figma |
| Node ID | `--a "123:456"` | A specific Figma node by its ID |
| File path | `--a design.png` | An existing screenshot/image file on disk |

For Figma selection URLs, use `--a-link` / `--b-link` instead.

## Options

```bash
fig compare --a selection --b "123:456" -s 2         # 2x scale for exports
fig compare --a selection --b "123:456" --max 3000    # Max dimension 3000px
fig compare --a selection --b "123:456" --save-dir .  # Save images to current dir
```

## Output

The command exports both sources as PNG images (saved to `/tmp/` by default) and outputs:

1. **File paths** for both images — use `Read` tool to view them
2. **Structured JSON** with a gap report template:
   - `matches` — elements that are the same
   - `differences` — table of element, property, value in A, value in B, severity
   - `summary` — overall assessment

## Workflow: Design vs Code Comparison

1. Take a screenshot of the coded output (browser screenshot or `fig screenshot`)
2. Get the Figma node ID or link for the original design
3. Run compare:
   ```bash
   fig compare --a coded-output.png --b-link "https://www.figma.com/...?node-id=123-456"
   ```
4. Read both output images to visually analyze differences
5. Use `fig inspect` on the Figma node to get exact specs for fixing differences

## Workflow: Before/After Comparison

1. Screenshot the current state: `fig screenshot --node "123:456" -o before.png`
2. Make changes in Figma
3. Compare: `fig compare --a before.png --b "123:456"`

## Verify command (simpler alternative)

For quick verification of a single element without a full comparison:

```bash
fig verify                              # Screenshot selection for AI review
fig verify --node "123:456"             # Verify specific node
fig verify --link "https://..."         # Verify from Figma link
fig verify --compare "https://..."      # Compare against a prototype URL
```

## Tips

- Use `--save-dir .` to save comparison images in your project directory instead of `/tmp/`
- For AI-powered analysis, read both output images with the `Read` tool after running compare
- Combine with `fig inspect --deep` on the Figma source to get exact specs for fixing any differences
- When comparing design to code, screenshot the browser at the same viewport width as the Figma frame for best results
