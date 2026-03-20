---
name: figma-local
description: |
  Use this skill whenever the user wants to work with Figma designs, read design context, get design specs, translate designs to code, generate CSS from Figma, inspect UI components, extract design tokens, or bridge Figma Desktop with code. Triggers on: "read the design", "get the Figma specs", "what's on the canvas", "match the design", "inspect this component", "generate CSS from Figma", "get the colors/fonts/spacing", "design tokens", "Figma to code", "check Figma", "read from Figma", or any reference to reading, inspecting, or extracting from Figma designs. Do NOT trigger for Figma API (REST), Figma plugins development, or Figma file URL fetching — this is for local Figma Desktop control only.
allowed-tools:
  - Bash(fig *)
  - Bash(fig-start *)
  - Bash(figma-cli *)
---

# Figma Local

Control Figma Desktop directly from Claude Code. Read designs, inspect specs, generate CSS/Tailwind, extract styles — no API key required.

## Prerequisites

The `fig` CLI must be installed and connected to Figma Desktop.

**Check status:**
```bash
fig daemon status
```

**If not connected:**
```bash
fig connect --safe
```

This starts the daemon and waits for the Figma Local plugin to connect. The user must have the plugin running in Figma Desktop (Plugins > Development > Figma Local).

**If not installed:**
```bash
npm install -g figma-local
```

## Workflow: Design to Code

Always follow this staged approach — never dump the full canvas at once.

### Step 1 — Scan the canvas (always do this first)

```bash
fig read
```

Returns: page name, frame names, sizes, count. Use this to understand what exists before doing anything else.

### Step 2 — Read a specific frame

```bash
fig read "Login Screen"
```

Returns: layout hierarchy, component tree, text content, and only the design tokens that frame uses. This is the primary command for getting design context.

### Step 3 — Get detailed specs for a specific element

Select the element in Figma, then:

```bash
fig inspect
```

Returns: dimensions (px + rem), padding, gap, colors (hex + rgba), typography (font, size, weight, line-height, letter-spacing), border radius, strokes, shadows, opacity, variable bindings.

### Step 4 — Generate code-ready CSS

```bash
fig css                   # CSS in rem
fig css --px              # CSS in px
fig css --tailwind        # Tailwind utility classes
```

### Step 5 — Verify your implementation

```bash
fig verify                # Screenshot for visual comparison
```

## Command Reference

### Reading designs

| Command | What it does |
|---------|-------------|
| `fig read` | List all frames on the current page |
| `fig read "Frame Name"` | Layout tree + components + used tokens for that frame |
| `fig read "Frame" --tokens` | Only the design tokens that frame uses |
| `fig read --selection` | Read whatever is selected in Figma |
| `fig read --link "https://..."` | Read a node from a Figma selection URL |
| `fig read --json` | Raw JSON output |

### Inspecting specs

| Command | What it does |
|---------|-------------|
| `fig inspect` | Full specs for current selection (px + rem) |
| `fig inspect --deep` | Inspect element + all children |
| `fig inspect --link "https://..."` | Inspect from a Figma link |
| `fig inspect --node "123:456"` | Inspect a specific node ID |
| `fig inspect --json` | Raw JSON output |

### Generating CSS

| Command | What it does |
|---------|-------------|
| `fig css` | CSS for current selection (rem units) |
| `fig css --px` | CSS in px units |
| `fig css --tailwind` | Tailwind utility classes |
| `fig css --link "https://..."` | CSS from a Figma link |
| `fig css --node "123:456"` | CSS for a specific node |

### Measuring spacing

| Command | What it does |
|---------|-------------|
| `fig measure` | Select 2 elements in Figma, get spacing between them (px + rem) |

### Extracting styles

| Command | What it does |
|---------|-------------|
| `fig styles "Frame Name"` | All text styles, colors, spacing, radii in that frame |
| `fig styles --selection` | Styles from current selection |
| `fig styles --link "https://..."` | Styles from a Figma link |

### Design tokens

| Command | What it does |
|---------|-------------|
| `fig tokens preset shadcn` | Apply full shadcn token system (Light/Dark) |
| `fig tokens tailwind` | Apply Tailwind color palette |
| `fig var list` | List all variables |
| `fig var export css` | Export as CSS custom properties |
| `fig var export tailwind` | Export as Tailwind config |

### Creating in Figma

| Command | What it does |
|---------|-------------|
| `fig render '<JSX>'` | Render JSX to Figma canvas |
| `fig shadcn add button card` | Add shadcn/ui components |
| `fig blocks create dashboard-01` | Pre-built dashboard layout |
| `fig create icon lucide:home` | Add icons (150k+ via Iconify) |

### Exporting

| Command | What it does |
|---------|-------------|
| `fig prompt "Frame" --target lovable` | AI prompt for Lovable |
| `fig prompt "Frame" --target figma-make` | AI prompt for Figma Make |
| `fig export screenshot -o out.png` | Screenshot |
| `fig export-jsx "1:234"` | Export as React JSX |

### Verification

| Command | What it does |
|---------|-------------|
| `fig verify` | Screenshot of current selection |
| `fig verify --compare "url"` | Compare prototype vs design |
| `fig lint` | Design lint (accessibility, contrast, etc.) |

## Important Rules

1. **Always `fig read` first** — scan the canvas before doing anything
2. **Staged reading** — never request full canvas data; focus on one frame at a time
3. **Verify after creating** — always run `fig verify` after rendering or adding components
4. **Use `fig inspect` for pixel-perfect code** — it gives exact specs in px + rem
5. **Use `fig css` to generate code** — paste directly into your codebase
6. **Select in Figma first** — most commands operate on the current Figma selection
