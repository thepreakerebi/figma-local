# figma-local

> Control Figma Desktop with Claude Code. Design tokens, shadcn/ui components, AI prompt export, lint, and more — no API key required.

[![npm version](https://img.shields.io/npm/v/figma-local.svg)](https://www.npmjs.com/package/figma-local)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows-blue)](#)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Ready-blue)](https://claude.ai/claude-code)

---

## What is this?

**figma-local** connects directly to Figma Desktop and lets you — or Claude Code — control it with natural language and `fig` commands.

- **Write** — Create frames, components, design tokens, icons, and full UI kits
- **Read** — Extract design context in a lean staged format (91–97% fewer tokens than raw data dumps)
- **Export** — Generate AI-ready prompts for Figma Make, Lovable, Pencil.dev, Paper.design, Google Stitch
- **Analyse** — Lint designs, check accessibility, audit colors and typography
- **Zero API key** — Connects via a local plugin bridge, no Figma API credentials needed

---

## Credits

This project is built on the shoulders of two excellent open-source works:

| Project | Author | What we built on |
|---------|--------|------------------|
| [**silships/figma-cli**](https://github.com/silships/figma-cli) | Sil Bormüller · [Into Design Systems](https://intodesignsystems.com) | Core daemon, plugin bridge, CDP connection, shadcn/ui component library, render engine, design token presets, FigJam support |
| [**royvillasana/figma-to-ai-prompter**](https://github.com/royvillasana/figma-to-ai-prompter) | Roy Villasana | Staged lean extraction approach, per-tool prompt templates, token-efficiency methodology |

**Our additions on top:**
- `fig read` — 3-phase staged design extraction (metadata → frame structure → used tokens only)
- `fig prompt` — lean tool-specific prompt generation (figma-make, lovable, pencil, paper, stitch)
- `fig verify --compare` — prototype vs design comparison loop with correction prompts
- Security hardening — WebSocket nonce handshake, input validation, rate limiting, body size caps
- `fig` short command — works globally from any directory
- Plugin UX — shows actionable "how to connect" instructions instead of infinite "Scanning..."

---

## Install

### npm (recommended)

```bash
npm install -g figma-local
```

Gives you `fig` and `fig-start` globally on your PATH.

**Update to latest:**

```bash
npm update -g figma-local
```

### curl (one-line)

```bash
curl -fsSL https://raw.githubusercontent.com/thepreakerebi/figma-local/main/install.sh | bash
```

### Homebrew

```bash
brew tap thepreakerebi/figma-local
brew install figma-cli
```

### npx (no install)

```bash
npx figma-local read
```

### From source

```bash
git clone https://github.com/thepreakerebi/figma-local.git
cd figma-cli
npm install && npm install -g .
```

---

## Requirements

| | |
|-|-|
| Node.js | 18+ |
| Figma Desktop | Any version (free account works) |
| OS | macOS or Windows |
| Claude Code | Optional but recommended |

---

## Setup (one time only)

### 1. Import the Figma plugin

1. Open **Figma Desktop**
2. Hamburger menu → **Plugins → Development → Import plugin from manifest...**
3. Navigate to the `plugin/` folder in this repo (or `$(npm root -g)/figma-local/plugin/`)
4. Select `manifest.json` → click **Open**
5. Right-click **Figma Local** in the plugin list → **Add to toolbar**

### 2. Connect

```bash
fig-start --safe
```

This starts the daemon, waits for you to click Figma Local in Figma, then launches Claude Code.

---

## Every session after that

```
1. Open Figma → click Figma Local in the toolbar
2. In terminal: fig-start --safe
```

Claude Code reads `CLAUDE.md` and knows every command automatically.

---

## Commands

### Read & understand your canvas

```bash
fig read                           # List all frames on the current page
fig read "Login Screen"            # Get the layout tree, components, and design tokens for that frame
fig read "Login Screen" --tokens   # Show only the design tokens (colors, spacing) that frame uses
fig read --selection               # Read whatever you have selected right now in Figma
fig read --link "https://..."      # Read a specific node from a Figma selection link
fig find "Button"                  # Find nodes by name
fig node tree                      # Layer hierarchy
fig canvas info                    # Raw canvas info
```

### Inspect design specs

```bash
fig inspect                        # Full specs for the selected element (spacing, colors, fonts, effects)
fig inspect --node "123:456"       # Inspect a specific node by ID
fig inspect --json                 # Raw JSON output
```

Returns dimensions, padding, gap, colors (hex + rgba), typography (font family, size, weight, line-height, letter-spacing), border radius, strokes, shadows, opacity, and variable bindings (name + resolved value + per-mode values for Light/Dark) — all in **px and rem**.

### Generate CSS / Tailwind from design

```bash
fig css                            # CSS for current selection (rem units)
fig css --px                       # CSS in px units
fig css --tailwind                 # Tailwind utility classes
fig css --link "https://..."       # CSS from a Figma link
```

### Measure spacing

```bash
fig measure                        # Select 2 elements in Figma, get the spacing between them
```

### Extract style guide from a frame

```bash
fig styles "Login Screen"          # All text styles, colors, spacing values, and radii used
fig styles --selection             # Styles from current selection
fig styles --json                  # Raw JSON
```

### Document a component (full recursive spec)

```bash
fig document                       # Document selected component — all children, all specs
fig document --json                # Structured JSON for coding agents
fig document --link "https://..."  # Document from a Figma link
fig document --tokens-only         # Just the design tokens used
```

Returns a complete breakdown: summary, all unique design tokens (colors, typography, spacing, radii, shadows), and a recursive tree of every element with full specs. One command gives a coding agent everything it needs to replicate the component.

### Design tokens

```bash
fig tokens preset shadcn           # 276 variables: primitives + semantic (Light/Dark)
fig tokens tailwind                # Tailwind 242-color palette
fig var list                       # All variables
fig var visualize                  # Swatches on canvas
fig var export css                 # → CSS custom properties
fig var export tailwind            # → Tailwind config
fig bind fill "primary/500"        # Bind variable to selection
```

### shadcn/ui components

```bash
fig shadcn list                    # 30 available components
fig shadcn add button card input   # Add specific ones
fig shadcn add --all               # All 30 components, 58 variants
```

Includes Button, Card, Input, Dialog, Tabs, Select, Switch, Badge, Alert, Checkbox, Radio Group, Accordion, Table, Pagination, Breadcrumb, Sheet, Tooltip, Dropdown, Avatar, Spinner, and more. All wired to Light/Dark variables.

### Create anything

```bash
# Quick primitives
fig create rect "Card" -w 320 -h 200 --fill "var:card" --radius 12
fig create text "Hello" -s 24 -c "var:foreground" -w bold
fig create icon lucide:home -s 24

# JSX render
fig render '<Frame name="Card" w={320} bg="var:card" rounded={16} flex="col" gap={8} p={24}>
  <Text size={20} weight="bold" color="var:foreground">Title</Text>
  <Text size={14} color="var:muted-foreground">Description</Text>
</Frame>'

# Pre-built blocks
fig blocks create dashboard-01     # Full analytics dashboard
```

### Icons (150,000+)

```bash
fig create icon lucide:home -s 24
fig create icon material:search -s 24
fig create icon heroicons:bell -s 20 -c "var:primary"
```

Lucide, Material Design, Heroicons, Feather, and 50+ more via Iconify.

### Export AI prompts

```bash
fig prompt "Screen" --target figma-make
fig prompt "Screen" --target lovable --stack "React + shadcn/ui"
fig prompt "Screen" --target pencil
fig prompt "Screen" --target stitch --platform responsive

# With context for better output
fig prompt "Login" \
  --target lovable \
  --goal "user signs in with email and password" \
  --interactions "submit validates form, forgot password opens modal" \
  --guardrails "no social login"
```

Generates ~45 tokens of structured text instead of attaching a Figma frame (300–500+ hidden tokens). **91–97% smaller input, more consistent AI output.**

### Verify & compare

```bash
fig verify                         # Screenshot of selection for AI review
fig verify --compare "https://..."  # Diff prototype vs Figma design → correction prompts
```

### Export

```bash
fig export css                     # Variables → CSS
fig export tailwind                # Variables → Tailwind config
fig export screenshot -o out.png   # Screenshot (add -s 2 for 2x)
fig export-jsx "1:234"             # → React JSX
fig export-storybook "1:234"       # → Storybook stories
```

### Lint & accessibility

```bash
fig lint                           # All rules
fig lint --fix                     # Auto-fix
fig lint --preset accessibility    # WCAG rules only
fig analyze colors                 # Color usage audit
fig analyze typography
```

Rules: WCAG AA/AAA contrast ratio, touch targets (44×44px min), hardcoded colors, empty frames, deeply nested layers, missing auto-layout, minimum text size.

### FigJam

```bash
fig fj sticky "Idea" -x 100 -y 100 --color "#FEF08A"
fig fj shape "Label" -x 200 -y 100 -w 200 -h 100
fig fj connect "ID1" "ID2"
```

---

## Connection modes

| | Safe Mode | Yolo Mode |
|-|-----------|-----------|
| How | Plugin bridge | Direct CDP |
| Setup per session | Start Figma Local plugin | Nothing (after one-time patch) |
| Speed | Standard | ~10× faster |
| Extra permissions | None | macOS: Full Disk Access / Windows: Admin |
| Command | `fig connect --safe` | `fig connect` |

**Recommendation:** Safe Mode. No system permissions needed, works on all machines including managed corporate Macs.

---

## Security

The daemon runs only on `127.0.0.1` (never exposed to the network) and is protected by multiple layers:

| Layer | Protects against |
|-------|-----------------|
| Binds to `127.0.0.1` | Not reachable from outside your machine |
| Session token (`X-Daemon-Token`) | Unauthorized local processes calling the HTTP API |
| Host header validation | DNS rebinding attacks |
| No CORS headers | Cross-origin browser requests |
| WebSocket nonce handshake | Rogue local processes impersonating the plugin |
| WebSocket origin validation | Browser tabs connecting to the daemon |
| 1 MB request/message body cap | Memory exhaustion from oversized payloads |
| Plugin input validation | Code size cap (512 KB), batch size cap (50), strict field types |
| Rate limiting | Max 30 evals per 10 s per connection |
| Idle auto-shutdown | Daemon stops after 1 hour of inactivity |

The session token is generated fresh on every `fig connect`, stored at `~/.figma-ds-cli/.daemon-token` with `chmod 600` (owner-read only).

---

## Work from anywhere

```bash
fig read                    # works from any directory
fig-start --safe --here     # launch from your project dir; Claude sees both your project and Figma
```

---

## Claude Code Plugin (Skills)

figma-local ships as a Claude Code plugin with 6 skills that teach coding agents how to use it automatically:

| Skill | Triggers on |
|-------|------------|
| **figma-local** | "read the design", "what's on the canvas", "Figma to code" |
| **figma-inspect** | "get specs", "what font/color/spacing", "design specs" |
| **figma-css** | "generate CSS", "Tailwind classes", "convert to CSS" |
| **figma-styles** | "style guide", "extract colors/fonts", "spacing scale" |
| **figma-measure** | "measure spacing", "gap between elements" |
| **figma-document** | "document this component", "full spec sheet", "deep breakdown" |

### Install the skills

Install via [skills.sh](https://skills.sh):

```bash
npx skills add thepreakerebi/figma-local
```

Once installed, restart Claude Code. It automatically knows all `fig` commands and uses them when your tasks involve Figma designs.

---

## For teams

```bash
# Install once per machine
npm install -g figma-local

# Import the Figma plugin once per Figma account (5 minutes)
# Then every designer on the team has identical fig commands
```

Pin a version for consistency:

```bash
npm install -g figma-local@1.0.0
```

---

## Uninstall

```bash
npm uninstall -g figma-local
rm -rf ~/.figma-cli ~/.figma-ds-cli
```

Remove the plugin in Figma: Plugins → Development → right-click Figma Local → Remove.

---

## Contributing

Issues and PRs welcome. For major changes, open an issue first to discuss.

```bash
git clone https://github.com/thepreakerebi/figma-local.git
cd figma-cli
npm install
node src/index.js --help
npm test
```

---

## License

MIT — see [LICENSE](LICENSE).

---

## Acknowledgements

- **[silships/figma-cli](https://github.com/silships/figma-cli)** by Sil Bormüller ([Into Design Systems](https://intodesignsystems.com)) — the original Figma Desktop CLI. The core engine, plugin bridge, CDP connection, shadcn/ui components, render pipeline, and design token presets all originate here. Please star their repo.

- **[royvillasana/figma-to-ai-prompter](https://github.com/royvillasana/figma-to-ai-prompter)** by Roy Villasana — the staged extraction and lean prompt approach. The insight that a text context block saves 91–97% of tokens vs attaching a Figma frame comes from their work. Please star their repo too.
