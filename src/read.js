/**
 * read.js — Staged, token-efficient Figma design extraction
 *
 * Instead of dumping raw canvas data, this extracts design info in stages
 * and returns a lean structured text block (91-97% smaller than full dumps).
 *
 * Inspired by the figma-to-ai-prompter approach by Roy Villasana:
 * only pull metadata first, then frame details, then only the tokens
 * that specific frame actually uses — nothing more.
 */

/**
 * Stage 1: Lightweight canvas metadata
 * Returns page name, frame names/IDs, total node count.
 * No layout data, no token data — just a map.
 */
export const STAGE1_METADATA = `
(function() {
  var page = figma.currentPage;
  var frames = page.children.filter(function(n) {
    return n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'COMPONENT_SET';
  });
  return {
    page: page.name,
    frameCount: frames.length,
    totalNodes: page.children.length,
    frames: frames.map(function(f) {
      return { id: f.id, name: f.name, type: f.type, w: Math.round(f.width), h: Math.round(f.height) };
    })
  };
})()
`;

/**
 * Stage 2: Frame structure — layout, components, text content.
 * Only runs on the specific frame the user cares about.
 * @param {string} frameId
 */
export function buildFrameStructureCode(frameId) {
  return `
(function() {
  var target = figma.getNodeById('${frameId}');
  if (!target) return { error: 'Node not found: ${frameId}' };

  function summariseNode(node, depth) {
    if (depth > 4) return null; // cap depth to avoid huge dumps
    var entry = {
      id: node.id,
      name: node.name,
      type: node.type,
    };

    // Layout
    if (node.width !== undefined) {
      entry.size = Math.round(node.width) + 'x' + Math.round(node.height);
    }
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      entry.layout = node.layoutMode.toLowerCase();
      entry.gap = node.itemSpacing || 0;
      entry.padding = [node.paddingTop||0, node.paddingRight||0, node.paddingBottom||0, node.paddingLeft||0];
      entry.align = node.primaryAxisAlignItems;
      entry.crossAlign = node.counterAxisAlignItems;
    }

    // Text
    if (node.type === 'TEXT') {
      entry.text = node.characters;
      if (node.fontSize) entry.fontSize = node.fontSize;
      if (node.fontName) entry.fontFamily = node.fontName.family;
      if (node.fontWeight) entry.fontWeight = node.fontWeight;
    }

    // Fill color (first solid fill, or variable binding)
    if (node.fills && node.fills.length > 0) {
      var fill = node.fills[0];
      if (fill.type === 'SOLID') {
        var r = Math.round((fill.color.r || 0) * 255);
        var g = Math.round((fill.color.g || 0) * 255);
        var b = Math.round((fill.color.b || 0) * 255);
        entry.fill = '#' + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0');
      }
    }

    // Corner radius
    if (node.cornerRadius && node.cornerRadius !== 0) {
      entry.radius = node.cornerRadius;
    }

    // Visibility
    if (node.visible === false) entry.hidden = true;

    // Component instance
    if (node.type === 'INSTANCE' && node.mainComponent) {
      entry.component = node.mainComponent.name;
    }

    // Children
    if (node.children && node.children.length > 0) {
      var kids = [];
      for (var i = 0; i < node.children.length; i++) {
        var child = summariseNode(node.children[i], depth + 1);
        if (child) kids.push(child);
      }
      if (kids.length > 0) entry.children = kids;
    }

    return entry;
  }

  return summariseNode(target, 0);
})()
`;
}

/**
 * Stage 3: Extract only variable bindings used in this frame.
 * Returns { varName: resolvedValue } for each unique variable the frame references.
 * @param {string} frameId
 */
export function buildUsedTokensCode(frameId) {
  return `
(function() {
  var target = figma.getNodeById('${frameId}');
  if (!target) return {};

  var usedVars = {};

  function collectVars(node) {
    // Check variable bindings on fills, strokes, effects
    if (node.boundVariables) {
      var bindings = node.boundVariables;
      Object.keys(bindings).forEach(function(prop) {
        var binding = bindings[prop];
        if (!binding) return;
        var ids = Array.isArray(binding) ? binding.map(function(b){ return b.id; }) : [binding.id];
        ids.forEach(function(id) {
          if (!id) return;
          try {
            var v = figma.variables.getVariableById(id);
            if (v) {
              var modes = Object.keys(v.valuesByMode);
              var val = modes.length > 0 ? v.valuesByMode[modes[0]] : null;
              var resolved = val;
              if (val && typeof val === 'object' && val.r !== undefined) {
                var r = Math.round((val.r||0)*255);
                var g = Math.round((val.g||0)*255);
                var b = Math.round((val.b||0)*255);
                resolved = '#' + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0');
              }
              usedVars[v.name] = resolved;
            }
          } catch(e) {}
        });
      });
    }

    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        collectVars(node.children[i]);
      }
    }
  }

  collectVars(target);
  return usedVars;
})()
`;
}

/**
 * Format the staged data into a lean structured text block.
 * This is what gets passed to Claude / AI tools — not raw JSON.
 *
 * @param {object} metadata  - Stage 1 result
 * @param {object} frame     - Stage 2 result (frame structure)
 * @param {object} tokens    - Stage 3 result (used tokens only)
 * @param {string} frameName - The frame we focused on
 */
export function formatLeanContext(metadata, frame, tokens, frameName) {
  const lines = [];

  lines.push(`## Design Context — ${frameName}`);
  lines.push(`Page: ${metadata.page} | Total frames: ${metadata.frameCount}`);
  lines.push('');

  // Frame summary
  if (frame && !frame.error) {
    lines.push(`### Frame: ${frame.name} (${frame.size})`);
    if (frame.layout) {
      lines.push(`Layout: ${frame.layout}, gap=${frame.gap}px, padding=[${frame.padding?.join(',')}]`);
    }
    lines.push('');

    // Component tree (compact)
    lines.push('### Structure');
    lines.push(formatNode(frame, 0));
    lines.push('');
  }

  // Used tokens only
  const tokenKeys = Object.keys(tokens || {});
  if (tokenKeys.length > 0) {
    lines.push(`### Design Tokens (${tokenKeys.length} used in this frame)`);
    for (const key of tokenKeys) {
      lines.push(`  ${key}: ${tokens[key]}`);
    }
    lines.push('');
  }

  // Token estimate
  const text = lines.join('\n');
  const tokenEst = Math.round(text.length / 4);
  lines.push(`---`);
  lines.push(`Token estimate: ~${tokenEst} tokens (${text.length} chars)`);

  return lines.join('\n');
}

/**
 * Compact node tree formatter — indented, key info only.
 */
function formatNode(node, depth) {
  const indent = '  '.repeat(depth);
  const parts = [`${indent}[${node.type}] ${node.name}`];

  if (node.size) parts[0] += ` (${node.size})`;
  if (node.text) parts[0] += ` "${node.text.slice(0, 40)}${node.text.length > 40 ? '…' : ''}"`;
  if (node.component) parts[0] += ` → ${node.component}`;
  if (node.fill) parts[0] += ` fill=${node.fill}`;
  if (node.radius) parts[0] += ` r=${node.radius}`;
  if (node.hidden) parts[0] += ` [hidden]`;

  const result = [parts[0]];
  if (node.children && depth < 3) {
    for (const child of node.children) {
      result.push(formatNode(child, depth + 1));
    }
  } else if (node.children && node.children.length > 0) {
    result.push(`${'  '.repeat(depth + 1)}… ${node.children.length} more children`);
  }

  return result.join('\n');
}
