# figma-cli

Control Figma Desktop with Claude Code. Direct connection — no API key, no MCP overhead.

## Quick Reference

| User says | Command |
|-----------|---------|
| "connect" / "use safe mode" | `fig connect --safe` |
| "connect yolo" / "connect direct" | `fig connect` |
| "what's on the canvas" | `fig read` (stage 1 only — fast) |
| "read this frame" / "analyze Login screen" | `fig read "Login"` |
| "show design tokens" | `fig read "Frame" --tokens` |
| "read my selection" | `fig read --selection` |
| "read this link" | `fig read --link "https://figma.com/..."` |
| "export prompt for Figma Make" | `fig prompt "Frame" --target figma-make` |
| "export prompt for Lovable" | `fig prompt "Frame" --target lovable` |
| "export prompt for Pencil" | `fig prompt "Frame" --target pencil` |
| "export prompt for Stitch" | `fig prompt "Frame" --target stitch` |
| "add shadcn colors" | `fig tokens preset shadcn` |
| "add tailwind colors" | `fig tokens tailwind` |
| "create a card / button / component" | `fig render '...'` |
| "add all shadcn components" | `fig shadcn add --all` |
| "create dashboard" | `fig blocks create dashboard-01` |
| "verify / check what was created" | `fig verify` |
| "compare with prototype URL" | `fig verify --compare "https://..."` |
| "take a screenshot" | `fig screenshot` (selection) |
| "screenshot from link" | `fig screenshot --link "https://..."` |
| "screenshot this node" | `fig screenshot --node "123:456"` |
| "compare selection vs node" | `fig compare --a selection --b "123:456"` |
| "compare two screenshots" | `fig compare --a design.png --b coded.png` |
| "compare two Figma links" | `fig compare --a-link "https://..." --b-link "https://..."` |
| "export as PNG/SVG" | `fig export png` |
| "lint / accessibility check" | `fig lint` |
| "list variables" | `fig var list` |
| "export as CSS / Tailwind" | `fig var export css` |
| "find node named X" | `fig find "X"` |
| "get specs for this element" | `fig inspect` (selection) |
| "inspect this button" | Select it in Figma, then `fig inspect` |
| "inspect from link" | `fig inspect --link "https://..."` |
| "inspect children too" | `fig inspect --deep` |
| "generate CSS" | `fig css` (selection) |
| "generate Tailwind" | `fig css --tailwind` |
| "measure spacing between" | Select 2 elements, then `fig measure` |
| "what styles does this frame use" | `fig styles "Frame Name"` |
| "document this component" | `fig document` (selection) |
| "document from link" | `fig document --link "https://..."` |
| "document as JSON" | `fig document --json` |

**Full command reference:** See REFERENCE.md

---

## CRITICAL: Staged Reading Workflow

**Never dump the full canvas or request all design data at once.**
Always read in stages. Each stage is a separate, targeted call.

### Stage 1 — Metadata (always do this first, cheapest)
```bash
fig read
```
Returns: page name, frame names/IDs, sizes, total count.
Use this to understand what's available before doing anything else.

### Stage 2 + 3 — Frame structure + tokens (only for the specific frame)
```bash
fig read "Frame Name"
```
Returns: layout hierarchy, component tree, text content, AND only the design
tokens that frame actually uses. NOT the full variable collection.

**Why staged reading matters:**
- Full canvas dump = 500–1500+ tokens of noise
- Staged read = ~45–80 tokens of focused signal
- Better AI output because the context is precise, not overwhelming

### When to run each stage:
- User asks "what's on the canvas" → Stage 1 only (`read` with no frame name)
- User asks to analyze / replicate / export a specific screen → `read "Frame Name"`
- User asks about tokens only → `read "Frame Name" --tokens`
- User asks to build something → Stage 1 to pick frame, then create with render/shadcn/blocks

---

## Prompt Export Workflow

When the user wants to take a Figma design into an AI prototyping tool:

**Step 1 — Generate the lean prompt:**
```bash
fig prompt "Screen Name" --target figma-make
fig prompt "Screen Name" --target lovable --stack "React + shadcn/ui"
fig prompt "Screen Name" --target pencil
fig prompt "Screen Name" --target paper
fig prompt "Screen Name" --target stitch --platform responsive
```

**Step 2 — Tell the user to paste the output into the target tool.**
Do NOT tell them to attach a Figma frame — the text prompt replaces the frame
attachment and saves 300–500 hidden tokens.

**Step 3 — Validation loop (Figma Make only):**
After they paste and get a result, ask for the preview URL:
```bash
fig verify --compare "https://figma.make/preview/..."
```
This saves the Figma design screenshot and outputs structured instructions
for visual comparison + correction prompts.

**Add interactions and goal for better prompts:**
```bash
fig prompt "Login" \
  --target lovable \
  --goal "user can sign in with email/password" \
  --interactions "submit button validates form, forgot password opens modal" \
  --guardrails "do not add social login"
```

---

## AI Verification (Internal)

After creating any component, verify visually:
```bash
fig verify              # Screenshot of current selection
fig verify "123:456"    # Screenshot of specific node ID
fig verify --save       # Save to /tmp/figma-verify-*.png
```

**Always verify after:** render, render-batch, node to-component, shadcn add, blocks create.

---

## Blocks (Pre-built UI Layouts)

**ALWAYS use `blocks create` for dashboards and page layouts.**
Never build dashboards manually with render/eval — blocks are faster and better.

```bash
fig blocks list               # Show available blocks
fig blocks create dashboard-01  # Create analytics dashboard
```

**dashboard-01** includes: sidebar (real Lucide icons), stats cards, area chart,
data table with pagination. All colors bound to shadcn variables (Light/Dark mode).

---

## Design Tokens

```bash
# Full shadcn system: 244 primitives + 32 semantic (Light/Dark)
fig tokens preset shadcn

# Tailwind color palette only (primitives)
fig tokens tailwind

# IDS base colors
fig tokens ds

# Visualize variables on canvas
fig var visualize

# Export as CSS custom properties
fig var export css

# Export as Tailwind config
fig var export tailwind
```

---

## Components (shadcn/ui)

```bash
fig shadcn list                    # List all 30 components
fig shadcn add button card input   # Add specific components
fig shadcn add --all               # Add all 30 components
```

All components use variable bindings (Light/Dark mode auto-switching).
Real Lucide icons via Iconify — not placeholder rectangles.

---

## Create Anything

```bash
# Render JSX directly
fig render '<Frame width={400} height={300} fill="#fff"><Text>Hello</Text></Frame>'

# Batch render (multiple nodes)
fig render-batch '[...]'

# Convert to component
fig node to-component "nodeId"

# Add icons (150k+ from Lucide, Material, Heroicons, Feather...)
fig icon add "home"
fig icon add "arrow-right" --size 24 --color "#6366F1"
```

---

## Session Setup

```bash
# Safe Mode (plugin-based, recommended):
fig connect --safe
# → Start Figma Local plugin in Figma first (Plugins > Development > Figma Local)

# Yolo Mode (direct patch, no plugin needed):
fig connect
# → Requires Full Disk Access on macOS, Admin on Windows
```

**Daemon status:**
```bash
fig daemon status
fig daemon restart
fig daemon diagnose  # troubleshooting
```

---

## Work From Anywhere

If you're NOT in the figma-cli directory, Claude still knows these commands
because this CLAUDE.md is installed globally. Use the `--here` flag:

```bash
fig-start --here --safe   # Stay in current project dir, use Safe Mode
fig-start --here          # Stay in current project dir, Yolo Mode
```

Or run from any directory after global install:
```bash
figma-cli read            # if installed globally via npm install -g .
```

---

## Decision Guide

| Task | Approach |
|------|----------|
| Understand what's in a file | `read` (stage 1) |
| Analyze a specific screen | `read "Frame Name"` |
| Build UI from scratch | `shadcn add` + `render` + `verify` |
| Add a dashboard | `blocks create dashboard-01` |
| Replicate Figma design in code | `prompt "Frame" --target lovable` |
| Send design to Figma Make | `prompt "Frame" --target figma-make` |
| Check created output | `verify` |
| Check prototype vs design | `verify --compare <url>` |
| Design system setup | `tokens preset shadcn` → `shadcn add --all` |

---

## Important Rules

1. **Read before creating** — always run `read` (stage 1) first to see what exists
2. **Staged reading** — never request full canvas data; use frame-targeted reads
3. **Verify always** — run `verify` after every creation step
4. **One screen per prompt** — when exporting to AI tools, scope to one frame at a time
5. **Text prompts over frame attachments** — use `prompt --target` output, not Figma frame links
6. **Safe Mode first** — prefer `connect --safe` unless user explicitly wants Yolo
