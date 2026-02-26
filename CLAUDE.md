# figma-ds-cli

CLI that controls Figma Desktop directly. No API key needed.

## IMPORTANT: Creating a Full Webpage in Figma

When user asks to "create a website", "design a landing page", or similar:

### Step 1: Create Design System First
```bash
node src/index.js tokens ds
```
This creates IDS Base colors: gray, primary (blue), accent (purple), plus semantic colors.

### Step 2: Create Page Frame with Sections Inside

**CRITICAL:** Always create ONE parent frame with vertical auto-layout that contains all sections.

```bash
# RECOMMENDED: One frame with all sections nested inside
node src/index.js render '<Frame name="Landing Page" w={1440} flex="col" bg="#0a0a0f">
  <Frame name="Hero" w="fill" h={800} flex="col" justify="center" items="center" gap={24} p={80}>
    <Text size={64} weight="bold" color="#fff">Headline</Text>
    <Text size={20} color="#a1a1aa">Subheadline</Text>
    <Frame bg="#3b82f6" px={32} py={16} rounded={8}><Text size={16} weight="medium" color="#fff">CTA Button</Text></Frame>
  </Frame>
  <Frame name="Features" w="fill" flex="row" gap={40} p={80} bg="#111">
    <Frame flex="col" gap={12} grow={1}><Text size={24} weight="bold" color="#fff">Feature 1</Text></Frame>
    <Frame flex="col" gap={12} grow={1}><Text size={24} weight="bold" color="#fff">Feature 2</Text></Frame>
    <Frame flex="col" gap={12} grow={1}><Text size={24} weight="bold" color="#fff">Feature 3</Text></Frame>
  </Frame>
  <Frame name="Footer" w="fill" h={200} flex="col" justify="center" items="center" bg="#0a0a0f">
    <Text size={14} color="#71717a">© 2024 Company</Text>
  </Frame>
</Frame>'
```

**Why one parent frame?**
- Responsive: Parent can resize, children adapt with `w="fill"`
- Exportable: One frame = one design
- Organized: Clear hierarchy in layers panel

### If Sections Already Exist Separately

Wrap existing sections in a parent frame:
```bash
node src/index.js eval "(function() {
  const sectionNames = ['Hero', 'Features', 'Footer'];
  const sections = sectionNames.map(name => figma.currentPage.findOne(n => n.name.includes(name))).filter(Boolean);
  if (sections.length === 0) return 'No sections found';

  const page = figma.createFrame();
  page.name = 'Landing Page';
  page.x = sections[0].x;
  page.y = sections[0].y;
  page.layoutMode = 'VERTICAL';
  page.primaryAxisSizingMode = 'AUTO';
  page.counterAxisSizingMode = 'FIXED';
  page.resize(1440, 100);
  page.fills = sections[0].fills;

  sections.forEach(s => {
    s.x = 0; s.y = 0;
    page.appendChild(s);
    s.layoutSizingHorizontal = 'FILL';
  });

  return 'Created page with ' + sections.length + ' sections';
})()"
```

### Step 3: Use Variables for Colors

After creating, bind colors to variables:
```bash
node src/index.js bind fill "background/default"
node src/index.js bind fill "primary/500" -n "BUTTON_ID"
```

### Design Tips for Webpages
- **Hero:** Full-width, centered content, big headline, CTA button
- **Sections:** Consistent width (1440px desktop, 375px mobile)
- **Dark themes:** Use gray/900-950 for backgrounds, gray/100-300 for text
- **Light themes:** Use white/gray-50 for backgrounds, gray/800-950 for text
- **Spacing:** Use 80px padding for sections, 24-40px gaps between elements

---

## IMPORTANT: Two Connection Modes

### 🚀 Yolo Mode (Default) — Recommended for most users

**What:** Patches Figma once to enable debug port, then connects directly via CDP.

**Pros:** Fully automatic, faster, all features work
**Cons:** Needs Full Disk Access on macOS (one-time), modifies Figma app

```bash
node src/index.js connect
```

### 🔒 Safe Mode — For secure environments

**What:** Uses a Figma plugin for communication. No Figma modification.

**Pros:** No patching, no Full Disk Access needed, works in corporate environments
**Cons:** Manual plugin start each session, slightly slower

```bash
node src/index.js connect --safe
```

**Then in Figma (one-time import):**
1. **Plugins → Development → Import plugin from manifest**
2. Select `plugin/manifest.json` from this project

**Each session:**
1. **Plugins → Development → FigCli**
2. Terminal shows "Plugin connected!"

**Tip:** Add plugin to toolbar for one-click access.

### When to suggest Safe Mode
- User gets "EPERM" or "permission" error during patching
- User mentions corporate laptop or can't modify apps
- User explicitly asks for no-patch solution

---

## IMPORTANT: When User Says "Initiate Project"

### Step 1: Install dependencies
```bash
npm install
```

### Step 2: Ask which connection mode

**Use AskUserQuestion tool to ask:**

Question: "Which connection mode do you want to use?"

Options:
1. **Yolo Mode (Recommended)** - Automatic, patches Figma once, needs Full Disk Access on Mac
2. **Safe Mode** - No patching, works everywhere, requires manual plugin start

### Step 3a: If user chooses Yolo Mode

```bash
node src/index.js connect
```

This command:
- Patches Figma if needed (first time only)
- Closes and restarts Figma with debug port enabled
- Connects automatically

**If permission error appears**, tell user:
```
Permission error! Grant Full Disk Access:
1. System Settings → Privacy & Security → Full Disk Access
2. Add Terminal (or your terminal app)
3. Restart Terminal completely (Cmd+Q, reopen)
4. Try again

Or switch to Safe Mode if you can't grant permissions.
```

### Step 3b: If user chooses Safe Mode

```bash
node src/index.js connect --safe
```

Then tell user:
```
Safe Mode started! Now set up the plugin in Figma:

ONE-TIME SETUP:
1. Open Figma Desktop
2. Go to: Plugins → Development → Import plugin from manifest
3. Navigate to this folder and select: plugin/manifest.json
4. Click "Open"

EACH SESSION:
1. In Figma: Plugins → Development → FigCli
2. A small window appears (keep it open)
3. Terminal shows "Plugin connected!"

TIP: Right-click the plugin → "Add to toolbar" for quick access
```

### Step 4: Show examples
When connected, show:
```
Ready! Try asking:

"Create a blue rectangle"
"Add Tailwind colors to my file"
"Create a card with title and description"
"Check accessibility"
```

---

## IMPORTANT: Fresh Mac Setup

If `node` command is not found, install Node.js first:

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add Homebrew to PATH (Apple Silicon Macs)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
eval "$(/opt/homebrew/bin/brew shellenv)"

# Install Node.js
brew install node

# Verify
node -v
```

Then run the CLI:
```bash
node src/index.js connect
```

## IMPORTANT: macOS Full Disk Access

If you see "permission" or "EPERM" error, Terminal needs Full Disk Access:

1. Open **System Settings**
2. Go to **Privacy & Security → Full Disk Access**
3. Click **+** and add **Terminal** (or iTerm/VS Code)
4. Quit Terminal completely (Cmd+Q)
5. Reopen Terminal and try again

## IMPORTANT: Website Recreation Workflow

When user asks to "recreate", "rebuild", "copy", or "clone" a website:

### One-Command Recreation (RECOMMENDED)
```bash
node src/index.js recreate-url "https://example.com" --name "My Page"
```

This does everything automatically:
1. Analyzes the page with Playwright (1440px desktop viewport)
2. Extracts exact CSS values (colors, fonts, sizes, positions)
3. Generates Figma code
4. Creates the page in Figma (~4-5 seconds total)

**Options:**
- `-w, --width <n>` - Viewport width (default: 1440)
- `-h, --height <n>` - Viewport height (default: 900)
- `--name <name>` - Frame name (default: "Recreated Page")

**Examples:**
```bash
# Desktop (default 1440px)
node src/index.js recreate-url "https://notion.so/login" --name "Notion Login"

# Mobile
node src/index.js recreate-url "https://notion.so/login" -w 375 -h 812 --name "Notion Mobile"
```

### Manual Analysis Only
If you need just the data without creating in Figma:
```bash
node src/index.js analyze-url "https://example.com/page" --screenshot
```

Returns JSON with all elements:
```json
{
  "bodyBg": "#fffefc",
  "elements": [
    { "type": "heading", "text": "Title", "fontSize": 22, "fontWeight": 600, "color": "#040404", "x": 560, "y": 146 },
    { "type": "button", "text": "Continue", "w": 360, "h": 40, "bgColor": "#2383e2", "borderRadius": 8 }
  ]
}
```

### Alternative: Screenshot Only
If Playwright fails, use capture-website-cli:
```bash
npx --yes capture-website-cli "https://example.com" --output=/tmp/site.png --width=1440 --height=900
```
Then `Read /tmp/site.png` to view and analyze visually.

## After Setup: Show Designer-Friendly Examples

When setup is complete, show these natural language examples (NOT CLI commands):

```
Ready! Try asking:

"Create a blue rectangle"
"Add Tailwind colors to my file"
"Create a card with title and description"
"Show me what's on the canvas"
"Find all frames named Button"
```

IMPORTANT: Never show `node src/index.js` commands to designers. They just type natural language and you execute the right commands.

## Setup

Figma must be running. Then:
```bash
node src/index.js connect
```

## Speed Daemon (Auto-Start)

The `connect` command automatically starts a background daemon that keeps the WebSocket connection open. This makes all subsequent commands ~10x faster.

```bash
node src/index.js connect
# Output:
# ✓ Figma started
# ✓ Connected to Figma
# ✓ Speed daemon running (commands are now 10x faster)
```

**Manual daemon control (if needed):**
```bash
node src/index.js daemon status   # Check if running
node src/index.js daemon restart  # Restart if issues
node src/index.js daemon stop     # Stop daemon
```

## Key Learnings

1. **ALWAYS use `render` for creating frames** - It has smart positioning (no overlaps) and handles fonts correctly
2. **NEVER use `eval` to create visual elements** - No smart positioning, elements will overlap at (0,0)
3. **NEVER use `npx figma-use render` directly** - It has NO smart positioning! Always use `node src/index.js render`
4. **Use `eval` ONLY for**: Variable bindings, deletions, moves, property changes on existing nodes
5. **For multiple frames**: Use `render-batch` with JSON array (one process, fast)
6. **Convert frames to components**: `node src/index.js node to-component "id1" "id2"`
7. **Always verify with `node tree`**: Check all children are present after creation

## CRITICAL: Smart Positioning

The `render` command automatically positions new frames to the RIGHT of existing content (100px gap).

```bash
# CORRECT - uses smart positioning
node src/index.js render '<Frame name="Card" w={300} h={200} bg="#fff" p={24}><Text>Hello</Text></Frame>'

# WRONG - will overlap at (0,0)
node src/index.js eval "const f = figma.createFrame(); f.name = 'Card';"

# WRONG - npx figma-use has NO smart positioning!
npx figma-use render --stdin  # DON'T USE THIS DIRECTLY
```

**IMPORTANT:** Never use `npx figma-use render` directly. Always use `node src/index.js render` which wraps it with smart positioning.

## CRITICAL: Multiple Frames = Use render-batch

**NEVER call render multiple times in a loop** - each call spawns a new process (slow).

For multiple frames, use `render-batch` with a JSON array:
```bash
# Horizontal layout (default)
node src/index.js render-batch '[
  "<Frame name=\"Card 1\" w={300} h={200} bg=\"#fff\" p={24}><Text>Card 1</Text></Frame>",
  "<Frame name=\"Card 2\" w={300} h={200} bg=\"#fff\" p={24}><Text>Card 2</Text></Frame>"
]'

# Vertical layout (use -d col)
node src/index.js render-batch '[
  "<Frame name=\"Card 1\" w={300} h={200} bg=\"#fff\" p={24}><Text>Card 1</Text></Frame>",
  "<Frame name=\"Card 2\" w={300} h={200} bg=\"#fff\" p={24}><Text>Card 2</Text></Frame>"
]' -d col

# Custom gap
node src/index.js render-batch '[...]' -g 24
```

Options:
- `-d row` - Horizontal layout (default)
- `-d col` - Vertical layout
- `-g <n>` - Gap between frames (default: 40)

This creates all frames in ONE process with ONE connection = much faster.

If you MUST use eval to create elements, ALWAYS include smart positioning code:
```javascript
// Get next free X position FIRST
let smartX = 0;
figma.currentPage.children.forEach(n => { smartX = Math.max(smartX, n.x + n.width); });
smartX += 100;

// Then create element at smartX
const frame = figma.createFrame();
frame.x = smartX;
```

## What Users Might Ask → Commands

### Canvas Awareness (Smart Positioning)

"Show what's on canvas"
```bash
node src/index.js canvas info
```

"Get next free position"
```bash
node src/index.js canvas next           # Returns { x, y } for next free spot
node src/index.js canvas next -d below  # Position below existing content
```

**Smart Positioning**: All `create` commands auto-position to avoid overlaps when no `-x` is specified.

### Variable Binding

"Bind color variable to fill"
```bash
node src/index.js bind fill "primary/500"
node src/index.js bind fill "background/default" -n "1:234"
```

"Bind variable to stroke, radius, gap, padding"
```bash
node src/index.js bind stroke "border/default"
node src/index.js bind radius "radius/md"
node src/index.js bind gap "spacing/md"
node src/index.js bind padding "spacing/lg"
```

"List available variables"
```bash
node src/index.js bind list
node src/index.js bind list -t COLOR
node src/index.js bind list -t FLOAT
```

### Sizing Control (Auto-Layout)

"Hug contents"
```bash
node src/index.js sizing hug
node src/index.js sizing hug -a h    # Horizontal only
```

"Fill container"
```bash
node src/index.js sizing fill
node src/index.js sizing fill -a v   # Vertical only
```

"Fixed size"
```bash
node src/index.js sizing fixed 320 200
```

### Layout Shortcuts

"Set padding"
```bash
node src/index.js padding 16              # All sides
node src/index.js padding 16 24           # Vertical, horizontal
node src/index.js padding 16 24 16 24     # Top, right, bottom, left
```

"Set gap"
```bash
node src/index.js gap 16
```

"Align items"
```bash
node src/index.js align center
node src/index.js align start
node src/index.js align stretch
```

### Quick Primitives (Fast Design)

**All create commands auto-position to avoid overlaps** when no `-x` is specified.

"Create a rectangle"
```bash
node src/index.js create rect "Card" -w 320 -h 200 --fill "#ffffff" --radius 12
```

"Create a circle"
```bash
node src/index.js create circle "Avatar" -w 48 --fill "#3b82f6"
```

"Add text"
```bash
node src/index.js create text "Hello World" -s 24 -c "#000000" -w bold
```

"Create a line"
```bash
node src/index.js create line -l 200 -c "#e4e4e7"
```

"Create an auto-layout frame"
```bash
node src/index.js create autolayout "Card" -d col -g 16 -p 24 --fill "#ffffff" --radius 12
```

"Create an icon"
```bash
node src/index.js create icon lucide:star -s 24 -c "#f59e0b"
```

"Add an image from URL"
```bash
node src/index.js create image "https://example.com/photo.png"
node src/index.js create image "https://example.com/photo.png" -w 200  # Scale to width
node src/index.js create image "https://example.com/photo.png" -w 200 -h 200  # Fixed size
```

"Screenshot a website and import as reference"
```bash
node src/index.js screenshot-url "https://notion.com/login"
node src/index.js screenshot-url "https://example.com" --full  # Full page
node src/index.js screenshot-url "https://example.com" -w 1920 -h 1080  # Custom size
```
Use this when user asks to "recreate" or "rebuild" a website. Screenshot first, then use as visual reference.

"Remove background from image" (select image in Figma first)
```bash
node src/index.js remove-bg
```
Note: Requires remove.bg API key (free, 50 images/month). Get one at https://www.remove.bg/api
Then save it: `node src/index.js config set removebgApiKey YOUR_KEY`

"Group selection"
```bash
node src/index.js create group "Header"
```

"Make selection a component"
```bash
node src/index.js create component "Button"
```

"Render a card with JSX (RECOMMENDED for complex designs)"
```bash
node src/index.js render '<Frame name="Card" w={320} h={180} bg="#fff" rounded={16} flex="col" gap={8} p={24}>
  <Text size={20} weight="bold" color="#111">Title</Text>
  <Text size={14} color="#666" w="fill">Description</Text>
</Frame>'
```

### Modify Elements

"Change fill color"
```bash
node src/index.js set fill "#3b82f6"           # On selection
node src/index.js set fill "#3b82f6" -n "1:234" # On specific node
```

"Add stroke"
```bash
node src/index.js set stroke "#e4e4e7" -w 1
```

"Change corner radius"
```bash
node src/index.js set radius 12
```

"Resize element"
```bash
node src/index.js set size 320 200
```

"Move element"
```bash
node src/index.js set pos 100 100
```

"Set opacity"
```bash
node src/index.js set opacity 0.5
```

"Apply auto-layout to frame"
```bash
node src/index.js set autolayout row -g 8 -p 16
```

"Rename node"
```bash
node src/index.js set name "Header"
```

### Select, Find & Inspect

"Select a node"
```bash
node src/index.js select "1:234"
```

"Find nodes by name"
```bash
node src/index.js find "Button"
node src/index.js find "Card" -t FRAME
```

"Get node properties"
```bash
node src/index.js get              # Selection
node src/index.js get "1:234"      # Specific node
```

### Duplicate & Delete

"Duplicate selection"
```bash
node src/index.js duplicate
node src/index.js dup "1:234" --offset 50
```

"Delete selection"
```bash
node src/index.js delete
node src/index.js delete "1:234"
```

### Arrange

"Arrange all frames"
```bash
node src/index.js arrange -g 100          # Single row
node src/index.js arrange -g 100 -c 3     # 3 columns
```

### Design Tokens & Variables

"Create a design system"
```bash
node src/index.js tokens ds
```

"Add Tailwind/shadcn primitive colors" (slate, gray, blue, red, etc. with 50-950 shades)
```bash
node src/index.js tokens tailwind
```

**Note:** This creates 22 color families (slate, gray, zinc, neutral, stone, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose) with 11 shades each (50-950). These are the Tailwind CSS colors that shadcn/ui is built on. NOT the shadcn/ui semantic colors (background, foreground, card, etc.).

"Create spacing tokens"
```bash
node src/index.js tokens spacing
```

"Show all variables"
```bash
node src/index.js var list
```

"Create a color variable"
```bash
node src/index.js var create "primary/500" -c "CollectionId" -t COLOR -v "#3b82f6"
```

### "Create shadcn colors" or "Create Tailwind colors"

When users ask for "shadcn colors" or "Tailwind colors", they usually mean the **primitive color palette** (22 color families with 50-950 shades), NOT the shadcn/ui semantic colors (background, foreground, etc.).

```bash
# Create Tailwind/shadcn primitive colors (242 variables)
node src/index.js tokens tailwind
```

This creates: slate, gray, zinc, neutral, stone, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose (each with 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950).

### Visualize Color Palette on Canvas

Create color swatches bound to variables for any color system:

**Step 1: Create color palette frames with render**
```bash
# Create a row of color swatches for one color family
node src/index.js render '<Frame name="blue" flex="row" x={0} y={0}>
  <Frame name="50" w={80} h={60} bg="#eff6ff" />
  <Frame name="100" w={80} h={60} bg="#dbeafe" />
  <Frame name="500" w={80} h={60} bg="#3b82f6" />
  <Frame name="900" w={80} h={60} bg="#1e3a8a" />
</Frame>'
```

**Step 2: Bind swatches to variables**
```javascript
// Save as /tmp/bind-palette.js, then run: npx figma-use eval "$(cat /tmp/bind-palette.js)"
const colors = [
  { name: 'blue', frameId: '2:123' },  // Replace with actual frame IDs
  { name: 'red', frameId: '2:456' }
];
const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

const allVars = figma.variables.getLocalVariables('COLOR');
colors.forEach(color => {
  const parentFrame = figma.getNodeById(color.frameId);
  if (!parentFrame) return;
  parentFrame.children.forEach((swatch, i) => {
    const varName = color.name + '/' + shades[i];
    const variable = allVars.find(v => v.name === varName);
    if (variable && swatch.type === 'FRAME') {
      swatch.fills = [figma.variables.setBoundVariableForPaint(
        { type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', variable
      )];
    }
  });
});
```

**Step 3: Verify bindings**
```bash
npx figma-use node bindings "2:123"  # Check if fills show $blue/50
```

### FigJam

"List FigJam pages"
```bash
node src/index.js fj list
```

"Add a sticky note"
```bash
node src/index.js fj sticky "Text here" -x 100 -y 100
```

"Add a sticky with color"
```bash
node src/index.js fj sticky "Note" -x 100 -y 100 --color "#FEF08A"
```

"Create a shape"
```bash
node src/index.js fj shape "Label" -x 200 -y 100 -w 200 -h 100
```

"Connect two elements"
```bash
node src/index.js fj connect "NODE_ID_1" "NODE_ID_2"
```

"Show elements on page"
```bash
node src/index.js fj nodes
```

"Delete an element"
```bash
node src/index.js fj delete "NODE_ID"
```

"Run JavaScript in FigJam"
```bash
node src/index.js fj eval "figma.currentPage.children.length"
```

### Figma Design

"Create a frame"
```bash
node src/index.js create frame "Card" -w 320 -h 200 --fill "#ffffff" --radius 12
```

"Add an icon"
```bash
node src/index.js create icon lucide:star -s 24 -c "#f59e0b"
node src/index.js create icon mdi:home -s 32
```

"Find all frames"
```bash
node src/index.js raw query "//FRAME"
```

"Find all components"
```bash
node src/index.js raw query "//COMPONENT"
```

"Find nodes named Button"
```bash
node src/index.js raw query "//*[contains(@name, 'Button')]"
```

"Select a node"
```bash
node src/index.js raw select "1:234"
```

"Export a node as PNG"
```bash
node src/index.js raw export "1:234" --scale 2
```

"Run JavaScript in Figma"
```bash
node src/index.js eval "figma.currentPage.name"
```

"Run JavaScript from file" (RECOMMENDED for complex scripts)
```bash
# Write script to temp file, then run
node src/index.js run /tmp/my-script.js

# Or use --file option
node src/index.js eval --file /tmp/my-script.js
```

### Export

"Export variables as CSS"
```bash
node src/index.js export css
```

"Export as Tailwind config"
```bash
node src/index.js export tailwind
```

"Take a screenshot"
```bash
node src/index.js export screenshot -o screenshot.png
```

"Export node as JSX/React code"
```bash
node src/index.js export-jsx "1:234"              # Output to stdout
node src/index.js export-jsx "1:234" --pretty     # Formatted output
node src/index.js export-jsx "1:234" -o Card.jsx  # Save to file
node src/index.js export-jsx --match-icons        # Match vectors to Iconify
```

"Export components as Storybook stories"
```bash
node src/index.js export-storybook "1:234"
node src/index.js export-storybook "1:234" -o Button.stories.jsx
```

### Design Analysis & Linting

"Lint design for issues"
```bash
node src/index.js lint                          # Check all rules
node src/index.js lint --fix                    # Auto-fix issues
node src/index.js lint --rule color-contrast    # Specific rule
node src/index.js lint --preset accessibility   # Use preset
node src/index.js lint --json                   # JSON output
```

Available presets: `recommended`, `strict`, `accessibility`, `design-system`

Available lint rules:
- `no-default-names` - detect unnamed layers
- `no-deeply-nested` - flag excessive nesting
- `no-empty-frames` - find empty frames
- `prefer-auto-layout` - suggest auto-layout
- `no-hardcoded-colors` - check variable usage
- `color-contrast` - WCAG AA/AAA compliance
- `touch-target-size` - minimum 44x44 check
- `min-text-size` - minimum 12px text

"Analyze color usage"
```bash
node src/index.js analyze colors          # Human readable
node src/index.js analyze colors --json   # JSON output
```

"Analyze typography"
```bash
node src/index.js analyze typography
node src/index.js analyze type --json     # alias
```

"Analyze spacing (gap/padding)"
```bash
node src/index.js analyze spacing
```

"Find repeated patterns (potential components)"
```bash
node src/index.js analyze clusters
```

### Node Operations

"Show node tree structure"
```bash
node src/index.js node tree              # Current selection
node src/index.js node tree "1:234"      # Specific node
node src/index.js node tree -d 5         # Deeper depth
```

"Show variable bindings"
```bash
node src/index.js node bindings          # Current selection
node src/index.js node bindings "1:234"  # Specific node
```

"Convert frames to components"
```bash
node src/index.js node to-component "1:234" "1:235" "1:236"
```

"Delete nodes by ID"
```bash
node src/index.js node delete "1:234"
node src/index.js node delete "1:234" "1:235"
```

## Advanced: Custom JavaScript

For complex operations, use `eval` with Figma Plugin API:

"Scale content and center it"
```bash
node src/index.js eval "
const node = figma.getNodeById('1:234');
node.rescale(1.2);
const frame = node.parent;
node.x = (frame.width - node.width) / 2;
node.y = (frame.height - node.height) / 2;
"
```

"Switch to dark mode" (for library variables)
```bash
node src/index.js eval "
const node = figma.getNodeById('1:234');

function findModeCollection(n) {
  if (n.boundVariables) {
    for (const [prop, binding] of Object.entries(n.boundVariables)) {
      const b = Array.isArray(binding) ? binding[0] : binding;
      if (b && b.id) {
        const variable = figma.variables.getVariableById(b.id);
        if (variable) {
          const col = figma.variables.getVariableCollectionById(variable.variableCollectionId);
          if (col && col.modes.length > 1) return { col, modes: col.modes };
        }
      }
    }
  }
  if (n.children) {
    for (const c of n.children) {
      const found = findModeCollection(c);
      if (found) return found;
    }
  }
  return null;
}

const found = findModeCollection(node);
if (found) {
  const darkMode = found.modes.find(m => m.name.includes('Dark'));
  if (darkMode) node.setExplicitVariableModeForCollection(found.col, darkMode.modeId);
}
"
```

"Rename all frames"
```bash
node src/index.js eval "
figma.currentPage.children
  .filter(n => n.type === 'FRAME')
  .forEach((f, i) => f.name = 'Screen-' + (i + 1));
"
```

## FigJam Advanced: Sections and Layouts

"Create a section in FigJam"
```bash
node src/index.js fj eval "
(async function() {
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  const section = figma.createSection();
  section.name = 'My Section';
  section.x = 0;
  section.y = 0;
  section.resizeWithoutConstraints(2000, 1000);
  section.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
})()
"
```

## Key Things to Know

1. **Always run from this directory** (where package.json is)

2. **Node IDs** look like `1:234` or `2:30`. Get them from query output or `fj nodes`.

3. **Use rescale() not resize()** when scaling, to avoid breaking layers.

4. **Library variables** cannot be accessed via `getLocalVariableCollections()`. Find them through `boundVariables` on nodes.

5. **Avoid stray elements**: Always use `render` command for frames with text. Using `eval` with async functions can create elements outside their parent frames. Clean up with:
   ```bash
   npx figma-use arrange --mode column --gap 20  # See what's on page
   npx figma-use node delete "2:123"             # Delete stray nodes
   ```

6. **FigJam eval needs IIFE** for async or to avoid variable conflicts:
   ```javascript
   (async function() { ... })()
   ```

6. **Font loading in FigJam** is required before setting text:
   ```javascript
   await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
   ```

## Creating Designs Best Practices

### IMPORTANT: Use `render` Command for Complex Designs

When creating frames with text inside, **always use the `render` command** instead of `eval`:

```bash
# CORRECT: Use render with JSX syntax
node src/index.js render '<Frame name="Card" w={320} h={180} bg="#fff" rounded={16} flex="col" gap={8} p={24}>
  <Text size={12} weight="medium" color="#1e3a8a">Tag</Text>
  <Text size={20} weight="bold" color="#1e3a8a">Title</Text>
  <Text size={14} color="#64748b" w="fill">Description text here</Text>
</Frame>'
```

**Why?** The `eval` command with async functions has issues with font loading and appendChild timing. The `render` command handles fonts and nesting correctly.

### Render Command Reference (figma-use)

**Uses `figma-use render` under the hood - full JSX support!**

**Elements:**
- `<Frame>` - Auto-layout frame
- `<Rectangle>` - Rectangle shape
- `<Ellipse>` - Circle/oval
- `<Text>` - Text layer
- `<Line>` - Line
- `<Image>` - Image (with src URL)
- `<SVG>` - SVG (with src URL or inline)
- `<Icon>` - Lucide icon
- `<Instance>` - Component instance

**Size & Position:**
```jsx
w={320} h={200}        // Fixed size
w="fill" h="fill"      // Fill parent
minW={100} maxW={500}  // Constraints
x={100} y={50}         // Position
```

**Layout (Auto-layout):**
```jsx
flex="row"             // Direction: "row" | "col"
gap={16}               // Spacing between items
wrap={true}            // Enable flex wrap
justify="between"      // Main axis: "start" | "center" | "end" | "between"
items="center"         // Cross axis: "start" | "center" | "end"
p={24}                 // Padding all sides
px={16} py={8}         // Padding x/y axis
pt={8} pr={16}...      // Individual padding
stretch={true}         // Stretch to fill cross-axis
grow={1}               // Flex grow
```

**Appearance:**
```jsx
bg="#3B82F6"           // Fill color
stroke="#E4E4E7"       // Stroke color
strokeWidth={1}        // Stroke thickness
opacity={0.5}          // Opacity
```

**Corners & Effects:**
```jsx
rounded={16}           // Corner radius
roundedTL={8}          // Individual corners
overflow="hidden"      // Clip content (important!)
shadow="0 4 12 #0001"  // Drop shadow
blur={10}              // Layer blur
rotate={45}            // Rotation
```

**Text:**
```jsx
<Text size={18} weight="bold" color="#000" font="Inter">Hello</Text>
```

### Auto-Layout Best Practices

**IMPORTANT:** To avoid clipped/cut-off content:

1. **Don't set fixed w/h** unless you specifically want fixed size
2. **Use `w="fill"`** for nested frames/text that should fill parent width
3. **Only use `overflow="hidden"`** when you want clipping

```bash
# GOOD: Gallery that grows with content (no fixed size)
node src/index.js render '<Frame name="Gallery" flex="row" gap={24} p={40} bg="#f4f4f5">
  <Frame name="Card 1" w={200} h={150} bg="#fff" rounded={8} />
  <Frame name="Card 2" w={200} h={150} bg="#fff" rounded={8} />
</Frame>'

# BAD: Fixed size = content may be clipped
<Frame w={800} h={400} overflow="hidden">
```

**NOTE:** For component instances, use `eval` - see "Using Component Instances" below.

### Using Component Instances

**NOTE:** `<Instance>` does NOT work with `render` command. Use `eval` instead:

```bash
# Create instance of a component by name
node src/index.js eval "(function() {
  const comp = figma.currentPage.findOne(n => n.type === 'COMPONENT' && n.name === 'Button - Primary');
  if (!comp) return 'Component not found';
  const instance = comp.createInstance();
  instance.x = 100;
  instance.y = 100;
  return instance.id;
})()"
```

To create a frame WITH component instances inside:
```bash
# Step 1: Create the container frame
node src/index.js render '<Frame name="Form" w={400} h={300} bg="#fff" flex="col" gap={16} p={24} />'

# Step 2: Add instances via eval
node src/index.js eval "(function() {
  const frame = figma.currentPage.findOne(n => n.name === 'Form');
  const button = figma.currentPage.findOne(n => n.type === 'COMPONENT' && n.name === 'Button - Primary');
  if (frame && button) {
    const instance = button.createInstance();
    frame.appendChild(instance);
  }
  return 'Done';
})()"
```

### IMPORTANT: Create Elements INSIDE Frames

When user says "create a design":
1. **Use the `render` command** - it has smart positioning built-in
2. **All elements INSIDE** the frame automatically with JSX nesting
3. **Never loose elements** directly on canvas

```bash
# ALWAYS USE RENDER - has smart positioning, no overlaps
node src/index.js render '<Frame name="Card" w={300} h={200} bg="#fff" rounded={16} flex="col" gap={12} p={24}>
  <Text size={16} weight="bold">Title</Text>
  <Text size={14} color="#666" w="fill">Body text that might be longer</Text>
</Frame>'
```

**DO NOT use eval to create frames** - they will overlap at (0,0).

### Auto-Layout Text Settings (CRITICAL)

Text layers that should NOT overflow the frame:
```javascript
text.layoutSizingHorizontal = 'FILL';  // Text fills container width
text.textAutoResize = 'HEIGHT';        // Height grows with content (wrapping)
```

Without these settings, text will overflow frame boundaries!

### Two Levels of Positioning

1. **Frames on Canvas** → Smart Positioning (side by side, never overlapping)
2. **Elements in Frame** → appendChild + Auto-Layout

### Complete Card Example with Variables

```javascript
(async function() {
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

  // Get variables
  const cardBg = figma.variables.getVariableById('VariableID:1:5');
  const cardFg = figma.variables.getVariableById('VariableID:1:6');
  const mutedFg = figma.variables.getVariableById('VariableID:1:14');
  const border = figma.variables.getVariableById('VariableID:1:19');
  const col = figma.variables.getVariableCollectionById('VariableCollectionId:1:2');

  // Smart Position
  let smartX = 0;
  figma.currentPage.children.forEach(n => {
    smartX = Math.max(smartX, n.x + n.width);
  });
  smartX += 40;

  // Card Frame with Auto-Layout
  const card = figma.createFrame();
  card.name = 'Card';
  card.x = smartX;
  card.y = 0;
  card.resize(300, 200);
  card.cornerRadius = 16;
  card.layoutMode = 'VERTICAL';
  card.primaryAxisSizingMode = 'FIXED';
  card.counterAxisSizingMode = 'FIXED';
  card.itemSpacing = 12;
  card.paddingTop = 24;
  card.paddingBottom = 24;
  card.paddingLeft = 24;
  card.paddingRight = 24;
  card.clipsContent = true;
  card.strokeWeight = 1;

  // Variable binding for fills
  card.fills = [figma.variables.setBoundVariableForPaint(
    {type:'SOLID',color:{r:1,g:1,b:1}}, 'color', cardBg
  )];
  card.strokes = [figma.variables.setBoundVariableForPaint(
    {type:'SOLID',color:{r:0.9,g:0.9,b:0.9}}, 'color', border
  )];

  // Set Light/Dark Mode
  card.setExplicitVariableModeForCollection(col.id, col.modes[0].modeId);

  // Title - FILL width
  const title = figma.createText();
  title.fontName = {family:'Inter',style:'Bold'};
  title.characters = 'Card Title';
  title.fontSize = 20;
  title.fills = [figma.variables.setBoundVariableForPaint(
    {type:'SOLID',color:{r:0,g:0,b:0}}, 'color', cardFg
  )];
  title.layoutSizingHorizontal = 'FILL';
  card.appendChild(title);

  // Description - FILL width + HEIGHT auto
  const desc = figma.createText();
  desc.fontName = {family:'Inter',style:'Regular'};
  desc.characters = 'Description text that wraps nicely.';
  desc.fontSize = 14;
  desc.fills = [figma.variables.setBoundVariableForPaint(
    {type:'SOLID',color:{r:0.5,g:0.5,b:0.5}}, 'color', mutedFg
  )];
  desc.layoutSizingHorizontal = 'FILL';
  desc.textAutoResize = 'HEIGHT';
  card.appendChild(desc);
})()
```

### Additional Best Practices

1. **Always check available variables and components first** before creating designs:
   ```bash
   node src/index.js var list                    # List all variables
   node src/index.js col list                    # List variable collections
   node src/index.js eval 'figma.root.children.map(p => p.name)'  # List pages
   ```
   Then explore component pages to find reusable components.

2. **Use existing components** (Avatar, Button, Calendar, etc.) instead of building from scratch.

3. **Bind variables** for colors, spacing, and border radius to maintain design system consistency.

4. **Place new frames on canvas without overlapping** existing designs:
   ```javascript
   // Get rightmost position of existing frames
   const frames = figma.currentPage.children.filter(n => n.type === "FRAME");
   let maxX = 0;
   frames.forEach(f => { maxX = Math.max(maxX, f.x + f.width); });

   // Position new frame with 100px gap
   newFrame.x = maxX + 100;
   newFrame.y = 0;
   ```

5. **Reposition overlapping frames** if needed:
   ```javascript
   const frames = figma.currentPage.children.filter(n => n.name.includes("MyDesign"));
   let currentX = 0;
   frames.forEach(f => {
     f.x = currentX;
     f.y = 0;
     currentX += f.width + 100;  // 100px gap
   });
   ```

## Shape Types (FigJam)

ROUNDED_RECTANGLE, RECTANGLE, ELLIPSE, DIAMOND, TRIANGLE_UP, TRIANGLE_DOWN, PARALLELOGRAM_RIGHT, PARALLELOGRAM_LEFT

## Query Syntax (XPath-like)

- `//FRAME` - all frames
- `//COMPONENT` - all components
- `//*[@name='Card']` - by exact name
- `//*[@name^='Button']` - name starts with
- `//*[contains(@name, 'Icon')]` - name contains
