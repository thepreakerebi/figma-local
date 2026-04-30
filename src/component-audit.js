/**
 * component-audit.js — Figma component audit logic
 *
 * Generates Figma plugin JS code that inspects components for:
 *   - Naming issues (unnamed layers, generic names)
 *   - Missing descriptions
 *   - Hardcoded colors (no variable bindings)
 *   - Missing auto layout
 *   - Hidden layers (dead weight)
 *   - Empty text nodes
 *   - Excessive nesting depth (>6 levels)
 *   - Variant completeness for component sets
 *   - Detached instances within a component
 */

/**
 * Build the Figma JS code to audit a single component node by ID.
 * @param {string} nodeId
 */
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

/**
 * Build the Figma JS code to audit ALL components on the current page.
 */
export function buildAllAuditCode() {
  return `
(function() {
  var page = figma.currentPage;
  var results = [];

  function collectComponents(node) {
    if (node.type === 'COMPONENT_SET') {
      results.push(auditComponent(node));
      return; // children are COMPONENT variants — covered by set audit
    }
    if (node.type === 'COMPONENT') {
      // Skip components that are children of a COMPONENT_SET (audited via the set)
      if (!node.parent || node.parent.type !== 'COMPONENT_SET') {
        results.push(auditComponent(node));
      }
      return;
    }
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        collectComponents(node.children[i]);
      }
    }
  }

  collectComponents(page);
  return {
    page: page.name,
    total: results.length,
    components: results
  };
  ${AUDIT_HELPERS}
})()
`;
}

/**
 * Build the Figma JS code to audit the current selection.
 */
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

// ---------------------------------------------------------------------------
// Shared helper code injected into every eval string.
// Written as a plain string so it can be appended inside the IIFE.
// ---------------------------------------------------------------------------
const AUDIT_HELPERS = `
  function auditComponent(node) {
    var issues = [];
    var stats = { textNodes: 0, hiddenNodes: 0, instances: 0, detachedInstances: 0, maxDepth: 0 };

    // ── 1. Description check ─────────────────────────────────────────────────
    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
      if (!node.description || node.description.trim() === '') {
        issues.push({ rule: 'missing-description', severity: 'warning', message: 'Component has no description' });
      }
    }

    // ── 2. Variant completeness (COMPONENT_SET only) ─────────────────────────
    if (node.type === 'COMPONENT_SET') {
      var propDefs = node.componentPropertyDefinitions || {};
      var propKeys = Object.keys(propDefs);
      var variantProps = propKeys.filter(function(k) { return propDefs[k].type === 'VARIANT'; });
      if (variantProps.length > 0) {
        var expected = 1;
        variantProps.forEach(function(k) {
          expected *= (propDefs[k].variantOptions || []).length;
        });
        var actual = (node.children || []).length;
        if (actual < expected) {
          issues.push({
            rule: 'incomplete-variants',
            severity: 'warning',
            message: 'Variant set has ' + actual + ' of ' + expected + ' expected combinations',
            details: { expected: expected, actual: actual, properties: variantProps }
          });
        }
      }
    }

    // ── 3. Deep tree walk ────────────────────────────────────────────────────
    var GENERIC_NAMES = /^(Frame|Rectangle|Ellipse|Group|Vector|Polygon|Star|Line|Image|Component)\\s*\\d*$/i;

    function walk(n, depth) {
      if (depth > stats.maxDepth) stats.maxDepth = depth;

      // Hidden layers
      if (depth > 0 && n.visible === false) {
        stats.hiddenNodes++;
        issues.push({ rule: 'hidden-layer', severity: 'info', message: 'Hidden layer: "' + n.name + '"', nodeId: n.id });
      }

      // Generic / unnamed layer
      if (depth > 0 && GENERIC_NAMES.test(n.name)) {
        issues.push({ rule: 'generic-layer-name', severity: 'info', message: 'Generic layer name: "' + n.name + '"', nodeId: n.id });
      }

      // Text nodes
      if (n.type === 'TEXT') {
        stats.textNodes++;
        if (!n.characters || n.characters.trim() === '') {
          issues.push({ rule: 'empty-text', severity: 'warning', message: 'Empty text node: "' + n.name + '"', nodeId: n.id });
        }
      }

      // Hardcoded colors — fills with no variable binding
      if (n.fills && Array.isArray(n.fills)) {
        for (var i = 0; i < n.fills.length; i++) {
          var fill = n.fills[i];
          if (fill.type === 'SOLID' && fill.visible !== false) {
            var hasBinding = n.boundVariables && n.boundVariables.fills;
            if (!hasBinding) {
              var r = Math.round((fill.color.r || 0) * 255);
              var g = Math.round((fill.color.g || 0) * 255);
              var b = Math.round((fill.color.b || 0) * 255);
              var hex = '#' + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0');
              // Only flag non-transparent, non-white fills that look like intentional colors
              if (hex !== '#ffffff' && hex !== '#000000' && !(r === g && g === b)) {
                issues.push({ rule: 'hardcoded-color', severity: 'warning', message: 'Hardcoded fill color ' + hex + ' on "' + n.name + '" — consider using a variable', nodeId: n.id });
              }
            }
          }
        }
      }

      // Missing auto layout on FRAME nodes that contain multiple children
      if (n.type === 'FRAME' && depth > 0) {
        var childCount = (n.children || []).length;
        if (childCount >= 2 && n.layoutMode === 'NONE') {
          issues.push({ rule: 'no-auto-layout', severity: 'info', message: 'Frame "' + n.name + '" has ' + childCount + ' children but no auto layout', nodeId: n.id });
        }
      }

      // Instances (check for detached)
      if (n.type === 'INSTANCE') {
        stats.instances++;
        if (!n.mainComponent) {
          stats.detachedInstances++;
          issues.push({ rule: 'detached-instance', severity: 'error', message: 'Detached instance: "' + n.name + '" — main component missing', nodeId: n.id });
        }
      }

      // Excessive nesting
      if (depth === 7) {
        issues.push({ rule: 'deep-nesting', severity: 'info', message: 'Node "' + n.name + '" is nested 7+ levels deep', nodeId: n.id });
      }

      if (n.children) {
        for (var ci = 0; ci < n.children.length; ci++) {
          walk(n.children[ci], depth + 1);
        }
      }
    }

    walk(node, 0);

    // ── 4. Score ─────────────────────────────────────────────────────────────
    var errors   = issues.filter(function(i) { return i.severity === 'error'; }).length;
    var warnings = issues.filter(function(i) { return i.severity === 'warning'; }).length;
    var infos    = issues.filter(function(i) { return i.severity === 'info'; }).length;
    var score = Math.max(0, 100 - errors * 15 - warnings * 5 - infos * 2);

    return {
      id: node.id,
      name: node.name,
      type: node.type,
      score: score,
      summary: { errors: errors, warnings: warnings, info: infos },
      stats: stats,
      issues: issues
    };
  }
`;

// ---------------------------------------------------------------------------
// Formatter — turns raw audit result into human-readable CLI output
// ---------------------------------------------------------------------------

/**
 * Format a single component audit result for terminal output.
 * @param {object} result - from auditComponent()
 * @param {object} chalk  - chalk instance
 * @param {boolean} verbose - show info-level issues
 */
export function formatAuditResult(result, chalk, verbose = true) {
  if (result.error) return chalk.red('✗ ' + result.error);

  const lines = [];
  const scoreColor = result.score >= 80 ? chalk.green : result.score >= 60 ? chalk.yellow : chalk.red;
  const scoreLabel = result.score >= 80 ? 'Good' : result.score >= 60 ? 'Fair' : 'Needs work';

  lines.push(`\n${chalk.bold(result.name)} ${chalk.gray('(' + result.type + ')')}`);
  lines.push(
    `  Score: ${scoreColor(result.score + '/100')} ${chalk.gray('(' + scoreLabel + ')')}  ` +
    chalk.red(result.summary.errors + ' errors') + '  ' +
    chalk.yellow(result.summary.warnings + ' warnings') + '  ' +
    chalk.gray(result.summary.info + ' info')
  );
  lines.push(
    chalk.gray(
      `  Stats: ${result.stats.textNodes} text nodes, ${result.stats.instances} instances` +
      (result.stats.detachedInstances ? chalk.red(` (${result.stats.detachedInstances} detached)`) : '') +
      `, ${result.stats.hiddenNodes} hidden, max depth ${result.stats.maxDepth}`
    )
  );

  const shown = result.issues.filter(i => verbose || i.severity !== 'info');
  if (shown.length === 0) {
    lines.push(chalk.green('  ✓ No issues found'));
  } else {
    lines.push('');
    for (const issue of shown) {
      const icon = issue.severity === 'error' ? chalk.red('✗') :
                   issue.severity === 'warning' ? chalk.yellow('⚠') : chalk.gray('ℹ');
      const ruleTag = chalk.gray(`[${issue.rule}]`);
      lines.push(`  ${icon} ${issue.message}  ${ruleTag}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format the all-components audit result for terminal output.
 * @param {object} result - { page, total, components[] }
 * @param {object} chalk
 * @param {boolean} verbose
 */
export function formatAllAuditResult(result, chalk, verbose = false) {
  if (result.error) return chalk.red('✗ ' + result.error);

  const lines = [];
  const comps = result.components || [];
  const totalErrors   = comps.reduce((s, c) => s + c.summary.errors, 0);
  const totalWarnings = comps.reduce((s, c) => s + c.summary.warnings, 0);
  const avgScore = comps.length ? Math.round(comps.reduce((s, c) => s + c.score, 0) / comps.length) : 0;

  lines.push('');
  lines.push(chalk.bold(`Component Audit — ${result.page}`));
  lines.push(
    `  ${comps.length} component${comps.length !== 1 ? 's' : ''} scanned  ` +
    chalk.red(totalErrors + ' errors') + '  ' +
    chalk.yellow(totalWarnings + ' warnings') + '  ' +
    `Avg score: ${avgScore}/100`
  );
  lines.push('');

  // Sort: worst score first
  const sorted = [...comps].sort((a, b) => a.score - b.score);

  for (const comp of sorted) {
    lines.push(formatAuditResult(comp, chalk, verbose));
  }

  lines.push('');
  lines.push(chalk.gray('─'.repeat(60)));
  lines.push(
    `${comps.filter(c => c.score >= 80).length} good  ` +
    `${comps.filter(c => c.score >= 60 && c.score < 80).length} fair  ` +
    `${comps.filter(c => c.score < 60).length} need work`
  );

  return lines.join('\n');
}
