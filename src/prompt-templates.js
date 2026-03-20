/**
 * prompt-templates.js — Per-tool structured prompt generators
 *
 * Each tool has different expectations: vocabulary, detail level,
 * session context format, and token budgets.
 * We generate lean, tool-calibrated prompts instead of generic dumps.
 */

/**
 * Generate a ready-to-paste prompt for the given target tool.
 *
 * @param {string} target   - 'figma-make' | 'lovable' | 'pencil' | 'paper' | 'stitch'
 * @param {object} design   - { frameName, page, size, structure, tokens, interactions }
 * @param {object} options  - { platform, stack, goal, guardrails }
 */
export function generatePrompt(target, design, options = {}) {
  const { frameName, page, size, structure, tokens, interactions } = design;
  const { platform = 'desktop', stack = 'React + Tailwind', goal = '', guardrails = '' } = options;

  // Build shared token block (used by all tools)
  const tokenBlock = buildTokenBlock(tokens);

  switch (target) {
    case 'figma-make': return figmaMakePrompt(design, options, tokenBlock);
    case 'lovable':    return lovablePrompt(design, options, tokenBlock);
    case 'pencil':     return pencilPrompt(design, options, tokenBlock);
    case 'paper':      return paperPrompt(design, options, tokenBlock);
    case 'stitch':     return stitchPrompt(design, options, tokenBlock);
    default:
      throw new Error(`Unknown target: ${target}. Use: figma-make, lovable, pencil, paper, stitch`);
  }
}

function buildTokenBlock(tokens) {
  if (!tokens || Object.keys(tokens).length === 0) return '';
  const lines = Object.entries(tokens)
    .slice(0, 20) // cap at 20 tokens max
    .map(([k, v]) => `  ${k}: ${v}`);
  return `Design tokens:\n${lines.join('\n')}`;
}

// ─────────────────────────────────────────────────────────────
// Figma Make — Interactive HTML prototype
// Key rules: use MCP text context block (NOT frame attachment),
// one screen at a time, action words: change / set / on click
// ─────────────────────────────────────────────────────────────
function figmaMakePrompt(design, options, tokenBlock) {
  const { frameName, size, structure, interactions = [] } = design;
  const { platform = 'desktop', goal = '', guardrails = '' } = options;

  const sessionCtx = [
    `Screen: ${frameName}`,
    `Size: ${size}`,
    `Platform: ${platform}`,
    tokenBlock,
  ].filter(Boolean).join('\n');

  const interactionList = interactions.length > 0
    ? interactions.map(i => `- ${i}`).join('\n')
    : '- (No interactions specified)';

  const structureBlock = structure ? `\nStructure:\n${structure}` : '';

  const screenPrompt = [
    `Build a ${platform} UI screen called "${frameName}".`,
    goal ? `Goal: ${goal}` : '',
    '',
    structureBlock,
    '',
    'Interactions:',
    interactionList,
    guardrails ? `\nDo not: ${guardrails}` : '',
  ].filter(s => s !== undefined).join('\n').trim();

  const full = `${sessionCtx}\n\n${screenPrompt}`;
  const tokenEst = Math.round(full.length / 4);

  return `## Figma Make Prompt — ${frameName}

### Session context (paste once at session start):
${sessionCtx}

### Screen prompt:
${screenPrompt}

### Follow-ups:
1. Adjust spacing and typography to match the design tokens exactly.
2. Add hover and active states to all interactive elements.

---
💰 Token estimate: ~${tokenEst} tokens
⚡ Use this text block instead of attaching the Figma frame — saves 300–500 hidden tokens.`;
}

// ─────────────────────────────────────────────────────────────
// Lovable — Full-stack React app
// Key rules: specify stack, real component names, action verbs,
// one screen per prompt, mention shadcn if using it
// ─────────────────────────────────────────────────────────────
function lovablePrompt(design, options, tokenBlock) {
  const { frameName, size, structure, interactions = [] } = design;
  const { platform = 'desktop', stack = 'React + shadcn/ui + Tailwind', goal = '', guardrails = '' } = options;

  const sessionCtx = [
    `App: ${frameName}`,
    `Stack: ${stack}`,
    `Platform: ${platform}`,
    tokenBlock,
  ].filter(Boolean).join('\n');

  const interactionList = interactions.length > 0
    ? interactions.map(i => `- ${i}`).join('\n')
    : '- Static layout, no interactions specified';

  const structureBlock = structure ? `\nComponent structure:\n${structure}` : '';

  const screenPrompt = [
    `Create a ${platform} React page for "${frameName}".`,
    `Stack: ${stack}.`,
    goal ? `User goal: ${goal}` : '',
    structureBlock,
    '',
    'Interactions:',
    interactionList,
    guardrails ? `\nConstraints: ${guardrails}` : '',
    '\nUse exact hex values from design tokens. Match spacing and layout precisely.',
  ].filter(s => s !== undefined).join('\n').trim();

  const full = `${sessionCtx}\n\n${screenPrompt}`;
  const tokenEst = Math.round(full.length / 4);

  return `## Lovable Prompt — ${frameName}

### Session context (paste once at session start):
${sessionCtx}

### Screen prompt:
${screenPrompt}

### Follow-ups:
1. Wire up form validation and error states.
2. Make layout fully responsive for mobile.

---
💰 Token estimate: ~${tokenEst} tokens
⚡ Lovable charges per message — keep follow-ups focused on one change each.`;
}

// ─────────────────────────────────────────────────────────────
// Pencil.dev — Production React components
// Key rules: component-first vocabulary, prop/variant naming,
// storybook-compatible output
// ─────────────────────────────────────────────────────────────
function pencilPrompt(design, options, tokenBlock) {
  const { frameName, size, structure, interactions = [] } = design;
  const { stack = 'React + TypeScript + Tailwind', goal = '', guardrails = '' } = options;

  const sessionCtx = [
    `Component: ${frameName}`,
    `Stack: ${stack}`,
    tokenBlock,
  ].filter(Boolean).join('\n');

  const structureBlock = structure ? `\nStructure:\n${structure}` : '';

  const screenPrompt = [
    `Generate a production-ready React component for "${frameName}".`,
    `Stack: ${stack}.`,
    goal ? `Purpose: ${goal}` : '',
    structureBlock,
    '',
    'States and variants:',
    ...(interactions.length > 0 ? interactions.map(i => `- ${i}`) : ['- default']),
    guardrails ? `\nDo not: ${guardrails}` : '',
    '\nExport as named export. Include prop types. Match design token values exactly.',
  ].filter(s => s !== undefined).join('\n').trim();

  const full = `${sessionCtx}\n\n${screenPrompt}`;
  const tokenEst = Math.round(full.length / 4);

  return `## Pencil.dev Prompt — ${frameName}

### Session context:
${sessionCtx}

### Component prompt:
${screenPrompt}

### Follow-ups:
1. Add Storybook story with all variant combinations.
2. Add unit tests for interaction states.

---
💰 Token estimate: ~${tokenEst} tokens`;
}

// ─────────────────────────────────────────────────────────────
// Paper.design — HTML/CSS canvas
// Key rules: structural, semantic HTML, CSS custom properties
// ─────────────────────────────────────────────────────────────
function paperPrompt(design, options, tokenBlock) {
  const { frameName, size, structure, interactions = [] } = design;
  const { goal = '', guardrails = '' } = options;

  const sessionCtx = [
    `Screen: ${frameName} (${size})`,
    tokenBlock,
  ].filter(Boolean).join('\n');

  const structureBlock = structure ? `\nLayout structure:\n${structure}` : '';

  const screenPrompt = [
    `Build an HTML/CSS layout for "${frameName}" (${size}).`,
    goal ? `Purpose: ${goal}` : '',
    structureBlock,
    '',
    'Use CSS custom properties for all colors and spacing from design tokens.',
    'Semantic HTML5 elements only.',
    guardrails ? `\nDo not: ${guardrails}` : '',
  ].filter(s => s !== undefined).join('\n').trim();

  const full = `${sessionCtx}\n\n${screenPrompt}`;
  const tokenEst = Math.round(full.length / 4);

  return `## Paper.design Prompt — ${frameName}

### Session context:
${sessionCtx}

### Layout prompt:
${screenPrompt}

### Follow-ups:
1. Add responsive breakpoints at 768px and 1024px.
2. Export final CSS as a separate file.

---
💰 Token estimate: ~${tokenEst} tokens`;
}

// ─────────────────────────────────────────────────────────────
// Google Stitch — Gemini 2.5, responsive UI
// Key rules: explicit responsiveness, Gemini vocabulary,
// limited monthly generations so keep prompts tight
// ─────────────────────────────────────────────────────────────
function stitchPrompt(design, options, tokenBlock) {
  const { frameName, size, structure, interactions = [] } = design;
  const { platform = 'responsive', goal = '', guardrails = '' } = options;

  const sessionCtx = [
    `UI: ${frameName}`,
    `Platform: ${platform}`,
    tokenBlock,
  ].filter(Boolean).join('\n');

  const structureBlock = structure ? `\nVisual structure:\n${structure}` : '';

  const screenPrompt = [
    `Design a ${platform} UI layout for "${frameName}".`,
    goal ? `Goal: ${goal}` : '',
    structureBlock,
    '',
    'Requirements:',
    '- Responsive: mobile (375px), tablet (768px), desktop (1280px)',
    '- Use exact color values from design tokens',
    '- Match component hierarchy from structure above',
    ...(interactions.map(i => `- ${i}`)),
    guardrails ? `\nAvoid: ${guardrails}` : '',
  ].filter(s => s !== undefined).join('\n').trim();

  const full = `${sessionCtx}\n\n${screenPrompt}`;
  const tokenEst = Math.round(full.length / 4);

  return `## Google Stitch Prompt — ${frameName}

### Session context:
${sessionCtx}

### UI prompt:
${screenPrompt}

### Follow-ups:
1. Adjust grid columns for tablet breakpoint.
2. Refine color contrast for accessibility.

---
💰 Token estimate: ~${tokenEst} tokens
⚡ Stitch has limited monthly generations — scope each prompt to one screen.`;
}
