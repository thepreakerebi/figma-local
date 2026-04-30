---
name: figma-component-audit
description: |
  Use this skill when the user wants to audit, review, or check the quality of Figma components. Triggers on: "audit", "audit components", "audit all components", "check component quality", "what's wrong with my components", "component issues", "find problems in components", "review my design system components", "component health", "component score", "check for hardcoded colors", "check spacing tokens", "check font styles", "check typography", "missing text styles", "hardcoded spacing", "missing variable bindings", "detached instances", "incomplete variants", "check border radius tokens". Requires a Figma file to be open and the daemon connected.
allowed-tools:
  - Bash(fig component-audit *)
  - Bash(fig component-audit)
  - Bash(fig daemon status)
---

# Figma Component Audit

Comprehensive quality audit for Figma components. Checks token compliance (colors, spacing, typography, effects, border radius), component structure, layout correctness, and layer hygiene. Returns a score (0–100) with issues grouped by category.

## Prerequisites

The `fig` CLI must be connected. Check with `fig daemon status`. If not connected: `fig connect --safe`.

## Usage

### Audit current selection

Select a component or frame in Figma, then:

```bash
fig component-audit
```

### Audit a specific component by name

```bash
fig component-audit "Button"
fig component-audit "Card"
fig component-audit "Navigation Bar"
```

### Audit ALL components on the current page

```bash
fig component-audit --all
```

Scans every `COMPONENT` and `COMPONENT_SET` on the page, ranks them by score (worst first), and prints a summary with issues grouped into four categories.

### Audit by node ID

```bash
fig component-audit --node "123:456"
```

### JSON output (for piping or saving)

```bash
fig component-audit --all --json
fig component-audit --all --json > audit-report.json
```

### Include info-level issues

Errors and warnings are shown by default. Add `--verbose` to also see info-level suggestions:

```bash
fig component-audit --all --verbose
fig component-audit "Button" --verbose
```

## Rules by Category

### Token Compliance
These ensure all design values come from Figma variables rather than hardcoded numbers.

| Rule | Severity | What it flags |
|------|----------|---------------|
| `hardcoded-fill-color` | warning | Fill color not bound to a color variable |
| `hardcoded-stroke-color` | warning | Stroke color not bound to a variable |
| `hardcoded-effect-color` | warning | Shadow / glow color not bound to a variable |
| `hardcoded-spacing` | warning | Padding or gap value not bound to a spacing variable |
| `hardcoded-border-radius` | warning | Corner radius not bound to a variable |
| `missing-text-style` | warning | Text node not using a shared text style |
| `hardcoded-font-size` | warning | Font size not bound to a variable (and no text style) |
| `hardcoded-opacity` | info | Non-100% opacity not bound to a variable |
| `off-type-scale` | info | Font size not on a standard type scale |

### Component Structure

| Rule | Severity | What it flags |
|------|----------|---------------|
| `missing-description` | warning | Component has no description |
| `missing-component-props` | info | Component exposes no properties at all |
| `incomplete-variants` | warning | Component set missing expected variant combinations |
| `detached-instance` | error | Instance whose main component is missing |

### Layout & Organisation

| Rule | Severity | What it flags |
|------|----------|---------------|
| `no-auto-layout` | info | Frame with 2+ children but no auto layout |
| `absolute-in-autolayout` | warning | Child pinned absolute inside an auto-layout frame |
| `non-standard-spacing` | info | Padding / gap value not on the 4px grid |
| `deep-nesting` | info | Node nested 7+ levels deep |

### Layer Hygiene

| Rule | Severity | What it flags |
|------|----------|---------------|
| `hidden-layer` | info | Invisible layer still in the tree |
| `generic-layer-name` | info | Default name like "Frame 2" or "Rectangle" |
| `empty-text` | warning | Text node with no content |

## Scoring

`score = 100 − (errors × 15) − (warnings × 5) − (info × 2)`

- **≥ 80** — Good
- **60–79** — Fair
- **< 60** — Needs work

## Workflow: Full Design-System Audit

1. Open the Figma file with your component library
2. Confirm connection: `fig daemon status`
3. Run the full audit:
   ```bash
   fig component-audit --all
   ```
4. Components are sorted worst-first — start with the lowest scores
5. Dig into a specific component with verbose output:
   ```bash
   fig component-audit "ComponentName" --verbose
   ```
6. Fix issues in Figma, then re-run to verify improvement

## Tips

- `detached-instance` (−15pts each) is always the highest priority to fix
- `missing-text-style` and `hardcoded-fill-color` are the most common warnings — fixing them usually means binding nodes to existing variables or creating new ones
- Use `fig var list` to see available variable collections before fixing hardcoded colors or spacing
- Use `fig styles "FrameName"` to see which text/color styles a frame currently uses
- Run `--all --json` to save a baseline report: `fig component-audit --all --json > baseline.json`
- `absolute-in-autolayout` is a warning, not an error — sometimes intentional (overlays, badges), but worth reviewing
- `non-standard-spacing` flags values not on the 4px grid (e.g., 5px, 7px, 13px) which may cause inconsistency at scale
