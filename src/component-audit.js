/**
 * component-audit.js — Figma component audit logic
 *
 * Comprehensive quality audit across five categories:
 *
 * ── Token compliance ──────────────────────────────────────────────────────────
 *   hardcoded-fill-color        Fill color not bound to a color variable
 *   hardcoded-stroke-color      Stroke color not bound to a variable
 *   hardcoded-effect-color      Shadow/glow color not bound to a variable
 *   hardcoded-spacing           Padding or gap value not bound to a spacing variable
 *   hardcoded-font-size         Font size not bound to a variable
 *   hardcoded-border-radius     Corner radius not bound to a variable
 *   missing-text-style          Text node not using a shared text style
 *   hardcoded-opacity           Non-100% opacity not bound to a variable
 *
 * ── Component structure ───────────────────────────────────────────────────────
 *   missing-description         No description on the component / set
 *   missing-component-props     Component exposes no properties (variants, text, boolean, swap)
 *   incomplete-variants         Component set missing expected variant combinations
 *   detached-instance           Instance whose main component is gone
 *
 * ── Layout & organisation ─────────────────────────────────────────────────────
 *   no-auto-layout              Frame with 2+ children but no auto layout
 *   absolute-in-autolayout      Child pinned absolute inside an auto-layout frame
 *   non-standard-spacing        Spacing value not on the 4px grid
 *   deep-nesting                Node nested 7+ levels deep
 *
 * ── Layer hygiene ─────────────────────────────────────────────────────────────
 *   hidden-layer                Invisible layer still present in the tree
 *   generic-layer-name          Default name like "Frame 2" or "Rectangle"
 *   empty-text                  Text node with no content
 */

// ─── Figma eval code builders ──────────────────────────────────────────────

export function buildSingleAuditCode(nodeId) {
  return `
(function() {
  var node = figma.getNodeById(${JSON.stringify(nodeId)});
  if (!node) return { error: 'Node not found: ${nodeId}' };
  if (node.type !== 'COMPONENT' && node.type !== 'COMPONENT_SET' && node.type !== 'FRAME') {
    return { error: 'Node is not a COMPONENT, COMPONENT_SET, or FRAME. Got: ' + node.type };
  }
  return auditComponent(node);
  ${AUDIT_HELPERS}
})()
`;
}

export function buildAllAuditCode() {
  return `
(function() {
  var page = figma.currentPage;
  var results = [];

  function collectComponents(node) {
    if (node.type === 'COMPONENT_SET') {
      results.push(auditComponent(node));
      return;
    }
    if (node.type === 'COMPONENT') {
      if (!node.parent || node.parent.type !== 'COMPONENT_SET') {
        results.push(auditComponent(node));
      }
      return;
    }
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) collectComponents(node.children[i]);
    }
  }

  collectComponents(page);
  return { page: page.name, total: results.length, components: results };
  ${AUDIT_HELPERS}
})()
`;
}

export function buildSelectionAuditCode() {
  return `
(function() {
  var sel = figma.currentPage.selection;
  if (!sel || sel.length === 0) return { error: 'Nothing selected. Select a component or frame in Figma first.' };
  var node = sel[0];
  if (node.type !== 'COMPONENT' && node.type !== 'COMPONENT_SET' && node.type !== 'FRAME') {
    return { error: 'Selection is not a COMPONENT, COMPONENT_SET, or FRAME. Got: ' + node.type };
  }
  return auditComponent(node);
  ${AUDIT_HELPERS}
})()
`;
}

// ─── Shared Figma helpers (injected as a string into every eval IIFE) ──────

const AUDIT_HELPERS = `

  // ── Utility helpers ────────────────────────────────────────────────────────

  function isBound(node, prop) {
    return !!(node.boundVariables && node.boundVariables[prop]);
  }

  function toHex(c) {
    var r = Math.round((c.r || 0) * 255);
    var g = Math.round((c.g || 0) * 255);
    var b = Math.round((c.b || 0) * 255);
    return '#' + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0');
  }

  // Returns true if the value sits on the standard 4-px grid
  function onGrid(v) { return v === 0 || Math.round(v) % 4 === 0; }

  // ── Main audit function ────────────────────────────────────────────────────

  function auditComponent(node) {
    var issues = [];
    var stats = {
      textNodes: 0, hiddenNodes: 0, instances: 0, detachedInstances: 0, maxDepth: 0,
      hardcodedColors: 0, hardcodedSpacing: 0, hardcodedFontSizes: 0, missingTextStyles: 0
    };

    // ════════════════════════════════════════════════════════════════════════
    // CATEGORY 1 — Component structure (top-level checks)
    // ════════════════════════════════════════════════════════════════════════

    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {

      // 1a. Missing description
      if (!node.description || node.description.trim() === '') {
        issues.push({ category: 'structure', rule: 'missing-description', severity: 'warning',
          message: 'Component has no description' });
      }

      // 1b. No exposed properties
      var propDefs = node.componentPropertyDefinitions || {};
      var propKeys = Object.keys(propDefs);
      if (propKeys.length === 0 && node.type === 'COMPONENT') {
        issues.push({ category: 'structure', rule: 'missing-component-props', severity: 'info',
          message: 'Component exposes no properties (no variants, text, boolean, or instance-swap)' });
      }

      // 1c. Incomplete variant combinations
      if (node.type === 'COMPONENT_SET') {
        var variantProps = propKeys.filter(function(k) { return propDefs[k].type === 'VARIANT'; });
        if (variantProps.length > 0) {
          var expected = variantProps.reduce(function(acc, k) {
            return acc * ((propDefs[k].variantOptions || []).length || 1);
          }, 1);
          var actual = (node.children || []).length;
          if (actual < expected) {
            issues.push({ category: 'structure', rule: 'incomplete-variants', severity: 'warning',
              message: 'Variant set has ' + actual + ' of ' + expected + ' expected combinations',
              details: { expected: expected, actual: actual, properties: variantProps } });
          }
        }
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // CATEGORIES 2-4 — Deep tree walk
    // ════════════════════════════════════════════════════════════════════════

    var GENERIC_NAMES = /^(Frame|Rectangle|Ellipse|Group|Vector|Polygon|Star|Line|Image|Component)\\s*\\d*$/i;

    // Deduplicate: avoid flagging the same node+rule twice
    var seen = {};
    function flag(rule, nodeId) {
      var key = rule + '::' + nodeId;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }

    function walk(n, depth) {
      if (depth > stats.maxDepth) stats.maxDepth = depth;

      // ── Layer hygiene ────────────────────────────────────────────────────

      if (depth > 0 && n.visible === false) {
        stats.hiddenNodes++;
        if (flag('hidden-layer', n.id))
          issues.push({ category: 'hygiene', rule: 'hidden-layer', severity: 'info',
            message: 'Hidden layer: "' + n.name + '"', nodeId: n.id });
      }

      if (depth > 0 && GENERIC_NAMES.test(n.name)) {
        if (flag('generic-layer-name', n.id))
          issues.push({ category: 'hygiene', rule: 'generic-layer-name', severity: 'info',
            message: 'Generic layer name: "' + n.name + '"', nodeId: n.id });
      }

      if (depth === 7) {
        if (flag('deep-nesting', n.id))
          issues.push({ category: 'layout', rule: 'deep-nesting', severity: 'info',
            message: 'Node "' + n.name + '" is nested 7+ levels deep', nodeId: n.id });
      }

      // ── Detached instance ────────────────────────────────────────────────

      if (n.type === 'INSTANCE') {
        stats.instances++;
        if (!n.mainComponent) {
          stats.detachedInstances++;
          if (flag('detached-instance', n.id))
            issues.push({ category: 'structure', rule: 'detached-instance', severity: 'error',
              message: 'Detached instance: "' + n.name + '" — main component is missing', nodeId: n.id });
        }
      }

      // ── Layout ───────────────────────────────────────────────────────────

      if (n.type === 'FRAME' && depth > 0) {
        var childCount = (n.children || []).length;
        if (childCount >= 2 && n.layoutMode === 'NONE') {
          if (flag('no-auto-layout', n.id))
            issues.push({ category: 'layout', rule: 'no-auto-layout', severity: 'info',
              message: 'Frame "' + n.name + '" has ' + childCount + ' children but no auto layout', nodeId: n.id });
        }
      }

      // Absolute-positioned child inside an auto-layout parent
      if (n.layoutPositioning === 'ABSOLUTE' && n.parent && n.parent.layoutMode && n.parent.layoutMode !== 'NONE') {
        if (flag('absolute-in-autolayout', n.id))
          issues.push({ category: 'layout', rule: 'absolute-in-autolayout', severity: 'warning',
            message: '"' + n.name + '" is absolutely positioned inside auto-layout frame "' + n.parent.name + '"', nodeId: n.id });
      }

      // ── TOKEN COMPLIANCE — Colors ─────────────────────────────────────────

      // Fill colors
      if (n.fills && Array.isArray(n.fills) && n.fills.length > 0) {
        var hasFillBinding = isBound(n, 'fills');
        if (!hasFillBinding) {
          for (var fi = 0; fi < n.fills.length; fi++) {
            var fill = n.fills[fi];
            if (fill.type === 'SOLID' && fill.visible !== false) {
              var fillHex = toHex(fill.color);
              stats.hardcodedColors++;
              if (flag('hardcoded-fill-color', n.id))
                issues.push({ category: 'tokens', rule: 'hardcoded-fill-color', severity: 'warning',
                  message: 'Fill color ' + fillHex + ' on "' + n.name + '" is not bound to a color variable', nodeId: n.id });
              break; // one flag per node is enough
            }
          }
        }
      }

      // Stroke colors
      if (n.strokes && Array.isArray(n.strokes) && n.strokes.length > 0) {
        var hasStrokeBinding = isBound(n, 'strokes');
        if (!hasStrokeBinding) {
          for (var si = 0; si < n.strokes.length; si++) {
            var stroke = n.strokes[si];
            if (stroke.type === 'SOLID' && stroke.visible !== false) {
              var strokeHex = toHex(stroke.color);
              stats.hardcodedColors++;
              if (flag('hardcoded-stroke-color', n.id))
                issues.push({ category: 'tokens', rule: 'hardcoded-stroke-color', severity: 'warning',
                  message: 'Stroke color ' + strokeHex + ' on "' + n.name + '" is not bound to a color variable', nodeId: n.id });
              break;
            }
          }
        }
      }

      // Effect (shadow / glow) colors
      if (n.effects && Array.isArray(n.effects) && n.effects.length > 0) {
        var hasEffectBinding = isBound(n, 'effects');
        if (!hasEffectBinding) {
          for (var ei = 0; ei < n.effects.length; ei++) {
            var effect = n.effects[ei];
            if ((effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') &&
                effect.visible !== false && effect.color) {
              var effectHex = toHex(effect.color);
              if (flag('hardcoded-effect-color', n.id))
                issues.push({ category: 'tokens', rule: 'hardcoded-effect-color', severity: 'warning',
                  message: 'Shadow color ' + effectHex + ' on "' + n.name + '" is not bound to a color variable', nodeId: n.id });
              break;
            }
          }
        }
      }

      // Opacity
      if (typeof n.opacity === 'number' && n.opacity < 1 && !isBound(n, 'opacity')) {
        if (flag('hardcoded-opacity', n.id))
          issues.push({ category: 'tokens', rule: 'hardcoded-opacity', severity: 'info',
            message: 'Opacity ' + Math.round(n.opacity * 100) + '% on "' + n.name + '" is not bound to a variable', nodeId: n.id });
      }

      // ── TOKEN COMPLIANCE — Spacing ────────────────────────────────────────

      var spacingProps = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'itemSpacing', 'counterAxisSpacing'];
      spacingProps.forEach(function(prop) {
        var val = n[prop];
        if (typeof val === 'number' && val > 0 && !isBound(n, prop)) {
          stats.hardcodedSpacing++;
          if (flag('hardcoded-spacing::' + prop, n.id))
            issues.push({ category: 'tokens', rule: 'hardcoded-spacing', severity: 'warning',
              message: prop + ' = ' + val + 'px on "' + n.name + '" is not bound to a spacing variable',
              nodeId: n.id, details: { property: prop, value: val } });

          // Non-standard spacing (off the 4px grid)
          if (!onGrid(val)) {
            if (flag('non-standard-spacing::' + prop, n.id))
              issues.push({ category: 'layout', rule: 'non-standard-spacing', severity: 'info',
                message: prop + ' = ' + val + 'px on "' + n.name + '" is not on the 4px grid',
                nodeId: n.id, details: { property: prop, value: val } });
          }
        }
      });

      // ── TOKEN COMPLIANCE — Border radius ──────────────────────────────────

      var radiusProps = ['cornerRadius', 'topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'];
      radiusProps.forEach(function(prop) {
        var val = n[prop];
        if (typeof val === 'number' && val > 0 && !isBound(n, prop)) {
          if (flag('hardcoded-border-radius', n.id))
            issues.push({ category: 'tokens', rule: 'hardcoded-border-radius', severity: 'warning',
              message: 'Corner radius ' + val + 'px on "' + n.name + '" is not bound to a variable',
              nodeId: n.id, details: { property: prop, value: val } });
        }
      });

      // ── TOKEN COMPLIANCE — Typography ─────────────────────────────────────

      if (n.type === 'TEXT') {
        stats.textNodes++;

        // Empty text
        if (!n.characters || n.characters.trim() === '') {
          if (flag('empty-text', n.id))
            issues.push({ category: 'hygiene', rule: 'empty-text', severity: 'warning',
              message: 'Empty text node: "' + n.name + '"', nodeId: n.id });
        }

        // Missing text style (no shared style applied)
        var hasTextStyle = n.textStyleId && typeof n.textStyleId === 'string' && n.textStyleId.trim() !== '';
        if (!hasTextStyle) {
          stats.missingTextStyles++;
          if (flag('missing-text-style', n.id))
            issues.push({ category: 'tokens', rule: 'missing-text-style', severity: 'warning',
              message: 'Text node "' + n.name + '" does not use a shared text style',
              nodeId: n.id,
              details: {
                fontSize: typeof n.fontSize === 'number' ? n.fontSize : null,
                fontFamily: n.fontName ? n.fontName.family : null,
                fontWeight: n.fontWeight || null
              }
            });
        }

        // Hardcoded font size (not bound to a variable, even if a text style is applied)
        if (typeof n.fontSize === 'number' && !isBound(n, 'fontSize') && !hasTextStyle) {
          stats.hardcodedFontSizes++;
          if (flag('hardcoded-font-size', n.id))
            issues.push({ category: 'tokens', rule: 'hardcoded-font-size', severity: 'warning',
              message: 'Font size ' + n.fontSize + 'px on "' + n.name + '" is not bound to a variable',
              nodeId: n.id, details: { fontSize: n.fontSize } });
        }

        // Font size off the standard type scale (if no style and size is unusual)
        if (typeof n.fontSize === 'number' && !hasTextStyle) {
          var typeScale = [10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96];
          if (typeScale.indexOf(n.fontSize) === -1) {
            if (flag('off-type-scale', n.id))
              issues.push({ category: 'tokens', rule: 'off-type-scale', severity: 'info',
                message: 'Font size ' + n.fontSize + 'px on "' + n.name + '" is not on a standard type scale',
                nodeId: n.id });
          }
        }
      }

      if (n.children) {
        for (var ci = 0; ci < n.children.length; ci++) {
          walk(n.children[ci], depth + 1);
        }
      }
    }

    walk(node, 0);

    // ── Scoring ──────────────────────────────────────────────────────────────
    var errors   = issues.filter(function(i) { return i.severity === 'error';   }).length;
    var warnings = issues.filter(function(i) { return i.severity === 'warning'; }).length;
    var infos    = issues.filter(function(i) { return i.severity === 'info';    }).length;
    var score    = Math.max(0, 100 - errors * 15 - warnings * 5 - infos * 2);

    // ── Group issues by category for the report ───────────────────────────────
    var byCategory = {};
    issues.forEach(function(issue) {
      var cat = issue.category || 'other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(issue);
    });

    return {
      id: node.id,
      name: node.name,
      type: node.type,
      score: score,
      summary: { errors: errors, warnings: warnings, info: infos, total: issues.length },
      stats: stats,
      byCategory: byCategory,
      issues: issues
    };
  }
`;

// ─── CLI formatters ────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  tokens: 'Token Compliance',
  structure: 'Component Structure',
  layout: 'Layout & Organisation',
  hygiene: 'Layer Hygiene',
};

/**
 * Format a single component audit result for terminal output.
 */
export function formatAuditResult(result, chalk, verbose = true) {
  if (result.error) return chalk.red('✗ ' + result.error);

  const lines = [];
  const scoreColor = result.score >= 80 ? chalk.green : result.score >= 60 ? chalk.yellow : chalk.red;
  const scoreLabel = result.score >= 80 ? 'Good' : result.score >= 60 ? 'Fair' : 'Needs work';

  lines.push(`\n${chalk.bold(result.name)} ${chalk.gray('(' + result.type + ')')}`);
  lines.push(
    `  Score: ${scoreColor(result.score + '/100')} ${chalk.gray('(' + scoreLabel + ')')}` +
    `  ${chalk.red(result.summary.errors + ' errors')}` +
    `  ${chalk.yellow(result.summary.warnings + ' warnings')}` +
    `  ${chalk.gray(result.summary.info + ' info')}`
  );

  const s = result.stats;
  lines.push(chalk.gray(
    `  Stats: ${s.textNodes} text nodes` +
    (s.missingTextStyles ? chalk.yellow(` (${s.missingTextStyles} missing style)`) : '') +
    `, ${s.instances} instances` +
    (s.detachedInstances ? chalk.red(` (${s.detachedInstances} detached)`) : '') +
    `, ${s.hiddenNodes} hidden` +
    (s.hardcodedColors ? chalk.yellow(`, ${s.hardcodedColors} hardcoded colors`) : '') +
    (s.hardcodedSpacing ? chalk.yellow(`, ${s.hardcodedSpacing} hardcoded spacing`) : '') +
    `, max depth ${s.maxDepth}`
  ));

  // Group by category
  const byCategory = result.byCategory || {};
  const catOrder = ['structure', 'tokens', 'layout', 'hygiene'];
  let hasOutput = false;

  for (const cat of catOrder) {
    const catIssues = (byCategory[cat] || []).filter(i => verbose || i.severity !== 'info');
    if (catIssues.length === 0) continue;
    hasOutput = true;
    lines.push('');
    lines.push(chalk.dim('  ' + (CATEGORY_LABELS[cat] || cat)));
    for (const issue of catIssues) {
      const icon = issue.severity === 'error'   ? chalk.red('  ✗') :
                   issue.severity === 'warning' ? chalk.yellow('  ⚠') : chalk.gray('  ℹ');
      lines.push(`${icon} ${issue.message}  ${chalk.gray('[' + issue.rule + ']')}`);
    }
  }

  if (!hasOutput) {
    lines.push(chalk.green('  ✓ No issues found'));
  }

  return lines.join('\n');
}

/**
 * Format the all-components audit result for terminal output.
 */
export function formatAllAuditResult(result, chalk, verbose = false) {
  if (result.error) return chalk.red('✗ ' + result.error);

  const lines = [];
  const comps = result.components || [];
  const totalErrors   = comps.reduce((s, c) => s + c.summary.errors, 0);
  const totalWarnings = comps.reduce((s, c) => s + c.summary.warnings, 0);
  const totalIssues   = comps.reduce((s, c) => s + c.summary.total, 0);
  const avgScore = comps.length
    ? Math.round(comps.reduce((s, c) => s + c.score, 0) / comps.length)
    : 0;

  lines.push('');
  lines.push(chalk.bold(`Component Audit — ${result.page}`));
  lines.push(
    `  ${comps.length} component${comps.length !== 1 ? 's' : ''} scanned` +
    `  ${totalIssues} total issues` +
    `  ${chalk.red(totalErrors + ' errors')}` +
    `  ${chalk.yellow(totalWarnings + ' warnings')}` +
    `  Avg score: ${avgScore}/100`
  );
  lines.push('');

  // Sort worst-first
  const sorted = [...comps].sort((a, b) => a.score - b.score);
  for (const comp of sorted) {
    lines.push(formatAuditResult(comp, chalk, verbose));
  }

  lines.push('');
  lines.push(chalk.gray('─'.repeat(60)));
  const good = comps.filter(c => c.score >= 80).length;
  const fair = comps.filter(c => c.score >= 60 && c.score < 80).length;
  const bad  = comps.filter(c => c.score < 60).length;
  lines.push(
    chalk.green(good + ' good') + `  ` +
    chalk.yellow(fair + ' fair') + `  ` +
    chalk.red(bad + ' need work')
  );

  return lines.join('\n');
}
