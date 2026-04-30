---
name: figma-component-audit
description: |
  Use this skill when the user wants to audit, review, or check the quality of Figma components. Triggers on: "audit", "audit components", "audit all components", "check component quality", "what's wrong with my components", "component issues", "find problems in components", "review my design system components", "component health", "component score", "check for hardcoded colors", "missing descriptions", "detached instances", "incomplete variants". Requires a Figma file to be open and the daemon connected.
allowed-tools:
  - Bash(fig component-audit *)
  - Bash(fig component-audit)
  - Bash(fig daemon status)
---

# Figma Component Audit

Audit Figma components for design-system quality issues. Returns a score (0–100) and a categorized list of issues per component.

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

This is the most useful command for a full design-system review. It scans every `COMPONENT` and `COMPONENT_SET` on the page, ranks them by score (worst first), and prints a summary.

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

By default, only errors and warnings are shown. Add `--verbose` to also see info-level suggestions:

```bash
fig component-audit --all --verbose
fig component-audit "Button" --verbose
```

## What Gets Checked

| Rule | Severity | What it flags |
|------|----------|---------------|
| `missing-description` | warning | Component has no description set |
| `incomplete-variants` | warning | Component set is missing expected variant combinations |
| `hidden-layer` | info | A child layer is hidden (dead weight in the file) |
| `generic-layer-name` | info | Layer has a default name like "Frame 2" or "Rectangle" |
| `empty-text` | warning | A text node exists but has no content |
| `hardcoded-color` | warning | A solid fill color with no variable binding |
| `no-auto-layout` | info | A frame with 2+ children but no auto layout enabled |
| `detached-instance` | error | An instance whose main component is missing |
| `deep-nesting` | info | A node nested 7+ levels deep |

## Scoring

`score = 100 − (errors × 15) − (warnings × 5) − (info × 2)`

- **≥ 80** — Good
- **60–79** — Fair
- **< 60** — Needs work

## Workflow: Full Design-System Audit

1. Open the Figma file containing your component library
2. Make sure `fig` is connected: `fig daemon status`
3. Run the full audit:
   ```bash
   fig component-audit --all
   ```
4. Review the output — components sorted worst-first
5. For a detailed look at the worst component:
   ```bash
   fig component-audit "ComponentName" --verbose
   ```
6. Fix the issues in Figma, then re-run to verify improvement

## Tips

- Run `--all --json` to save a baseline report and compare over time
- `detached-instance` errors (score −15 each) are the highest priority to fix
- `hardcoded-color` warnings usually mean a token should be created in your variable collection
- Use `fig var list` to see available variable collections before fixing hardcoded colors
- `incomplete-variants` means your component set has a property with N options but fewer than the expected NxM combinations
