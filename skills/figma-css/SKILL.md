---
name: figma-css
description: |
  Use this skill when the user wants to generate CSS or Tailwind classes from a Figma design element. Triggers on: "generate CSS", "CSS from Figma", "Tailwind classes", "get the styles as code", "convert to CSS", "translate to Tailwind", "what CSS would this be", "style this like the design", "code from Figma". Also use when implementing a UI component and needing the exact CSS properties to match the Figma design. Requires an element to be selected in Figma or a node ID / Figma link.
allowed-tools:
  - Bash(fig css *)
  - Bash(fig css)
---

# Figma CSS

Generate ready-to-use CSS or Tailwind utility classes from any Figma element.

## Prerequisites

The `fig` CLI must be connected. Check with `fig daemon status`. If not connected: `fig connect --safe`.

## Usage

### CSS from current selection (rem units — default)

```bash
fig css
```

**Output example:**
```css
/* card [FRAME] */
.card {
  width: 20rem;
  height: 12.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem;
  border-radius: 0.75rem;
  background-color: #ffffff;
  box-shadow: 0rem 0.063rem 0.188rem 0rem rgba(0,0,0,0.1);
}
```

### CSS in px units

```bash
fig css --px
```

### Tailwind utility classes

```bash
fig css --tailwind
```

**Output example:**
```
{/* card */}
className="w-[20rem] h-[12.5rem] flex flex-col gap-[0.5rem] p-[1.5rem] rounded-[0.75rem] bg-[#ffffff] shadow-[0rem_0.063rem_0.188rem_0rem_rgba(0,0,0,0.1)]"
```

### CSS from a Figma link

```bash
fig css --link "https://www.figma.com/design/FILEID/Name?node-id=123-456"
```

### CSS for a specific node

```bash
fig css --node "123:456"
```

### Raw JSON output

```bash
fig css --json
```

## What it extracts

| CSS Property | Figma Source |
|-------------|-------------|
| `width`, `height` | Node dimensions |
| `display: flex`, `flex-direction` | Auto layout mode |
| `gap` | Auto layout item spacing |
| `padding` | Auto layout padding (shorthand when possible) |
| `justify-content`, `align-items` | Auto layout alignment |
| `flex-wrap` | Auto layout wrap |
| `border-radius` | Corner radius (uniform or per-corner) |
| `background-color` | Solid fills (hex or rgba) |
| `background` | Gradient fills (linear-gradient) |
| `border` | Strokes (width + style + color) |
| `font-family` | Text font name |
| `font-size` | Text size |
| `font-weight` | Font style → weight mapping |
| `font-style` | Italic detection |
| `line-height` | Text line height (px/rem or unitless) |
| `letter-spacing` | Text letter spacing (px/rem or em) |
| `text-align` | Horizontal text alignment |
| `color` | Text fill color |
| `box-shadow` | Drop shadows and inner shadows |
| `opacity` | Layer opacity |
| `overflow: hidden` | Clip content |

## Workflow: Design to Code

1. Select the element in Figma
2. Run `fig css` (or `fig css --tailwind`)
3. Copy the output into your component file
4. Adjust class names or variable references as needed
5. Run `fig verify` to visually compare

## Tips

- For text elements, `color` is used instead of `background-color`
- Padding is automatically collapsed to shorthand when sides match (e.g., `1rem` instead of `1rem 1rem 1rem 1rem`)
- Use `--px` when your project uses px-based design systems
- Use `--tailwind` for React/Vue/Svelte projects using Tailwind CSS
- The generated class name is derived from the Figma layer name (sanitized to kebab-case)
- Select multiple elements to generate CSS for all of them at once (up to 10)
