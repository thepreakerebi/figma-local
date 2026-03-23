---
name: figma-screenshot
description: |
  Use this skill when the user wants to take a screenshot or export an image from Figma — current selection, a specific node, or from a Figma link. Triggers on: "screenshot", "take a screenshot", "export as PNG", "export as SVG", "capture this", "save as image", "export this frame", "get an image of". Requires the fig CLI to be connected.
allowed-tools:
  - Bash(fig screenshot *)
  - Bash(fig screenshot)
---

# Figma Screenshot

Export any Figma element as an image (PNG, JPG, SVG, or PDF).

## Prerequisites

The `fig` CLI must be connected. Check with `fig daemon status`. If not connected: `fig connect --safe`.

## Usage

### Screenshot current selection

The user must select an element in Figma first, then:

```bash
fig screenshot
```

Saves to `screenshot.png` in the current directory by default.

### Screenshot from a Figma link

```bash
fig screenshot --link "https://www.figma.com/design/FILEID/Name?node-id=123-456"
```

### Screenshot a specific node by ID

```bash
fig screenshot --node "123:456"
```

### Options

```bash
fig screenshot -o design.png          # Custom output file name
fig screenshot -s 2                   # 2x scale (default is 2)
fig screenshot -s 4                   # 4x scale for high-res
fig screenshot -f svg                 # SVG format
fig screenshot -f jpg                 # JPG format
fig screenshot -f pdf                 # PDF format
```

### Combine options

```bash
fig screenshot --link "https://..." -o hero-section.png -s 3
fig screenshot --node "123:456" -f svg -o icon.svg
```

## Export a specific node by ID (alternative)

```bash
fig export node "123:456"                    # PNG at 2x
fig export node "123:456" -f svg -o out.svg  # SVG
```

## Tips

- Default scale is 2x which gives crisp images on retina displays
- Use `-s 1` for pixel-accurate exports (1:1 with Figma dimensions)
- SVG format is best for icons and vector graphics
- For AI verification of created components, use `fig verify` instead (optimized for smaller file size)
- Screenshots can be used with `fig compare` to visually diff against other screenshots or Figma nodes
