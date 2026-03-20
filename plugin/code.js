/**
 * Figma CLI Bridge Plugin — code.js
 *
 * Safe Mode: Connects to CLI daemon via WebSocket.
 * No debug port, no patching required.
 *
 * Security hardening:
 *  - All incoming messages from the UI are validated before execution
 *  - Code and batch payloads are size-capped
 *  - Batch arrays are length-capped
 *  - Notify text is sanitised (no arbitrary HTML/script injection)
 *  - Rate limiting: max 30 evals per 10-second window
 */

// ── Constants ──────────────────────────────────────────────────
const MAX_CODE_BYTES   = 512 * 1024;  // 512 KB max per eval code string
const MAX_BATCH_COUNT  = 50;          // Max codes in a single eval-batch
const MAX_NOTIFY_CHARS = 200;         // Max chars shown in Figma notification

// ── Rate limiter ───────────────────────────────────────────────
// Prevents a rogue daemon (or compromised WebSocket) from flooding
// the plugin with eval calls.
const RATE_WINDOW_MS = 10000;
const RATE_MAX       = 30;
let rateCount        = 0;
let rateWindowStart  = Date.now();

function isRateAllowed() {
  const now = Date.now();
  if (now - rateWindowStart > RATE_WINDOW_MS) {
    rateCount = 0;
    rateWindowStart = now;
  }
  if (rateCount >= RATE_MAX) return false;
  rateCount++;
  return true;
}

// ── Input validators ───────────────────────────────────────────
function isValidId(id) {
  return typeof id === 'number' && Number.isFinite(id) && id >= 0;
}

function isValidCode(code) {
  return typeof code === 'string' && code.length > 0 && code.length <= MAX_CODE_BYTES;
}

function sanitiseNotify(text) {
  if (typeof text !== 'string') return 'Unknown error';
  // Strip anything that looks like HTML tags, keep plain text only
  return text.replace(/<[^>]*>/g, '').slice(0, MAX_NOTIFY_CHARS);
}

// Show minimal UI (needed for WebSocket connection)
figma.showUI(__html__, {
  width: 200,
  height: 92
});

// Execute code with auto-return and timeout protection
async function executeCode(code, timeoutMs = 25000) {
  let trimmed = code.trim();

  // Don't add return if code already starts with return
  if (!trimmed.startsWith('return ')) {
    const isSimpleExpr = !trimmed.includes(';');
    const isIIFE = trimmed.startsWith('(function') || trimmed.startsWith('(async function');
    const isArrowIIFE = trimmed.startsWith('(() =>') || trimmed.startsWith('(async () =>');

    if (isSimpleExpr || isIIFE || isArrowIIFE) {
      trimmed = `return ${trimmed}`;
    } else {
      const lastSemicolon = trimmed.lastIndexOf(';');
      if (lastSemicolon !== -1) {
        const beforeLast = trimmed.substring(0, lastSemicolon + 1);
        const lastStmt = trimmed.substring(lastSemicolon + 1).trim();
        if (lastStmt && !lastStmt.startsWith('return ')) {
          trimmed = beforeLast + ' return ' + lastStmt;
        }
      }
    }
  }

  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  const fn = new AsyncFunction('figma', `return (async () => { ${trimmed} })()`);

  // Execute with timeout protection
  const execPromise = fn(figma);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Execution timeout (${timeoutMs/1000}s)`)), timeoutMs)
  );

  return Promise.race([execPromise, timeoutPromise]);
}

// Handle messages from UI (WebSocket bridge)
figma.ui.onmessage = async (msg) => {
  if (!msg || typeof msg.type !== 'string') return;

  // ── Single eval ─────────────────────────────────────────────
  if (msg.type === 'eval') {
    // Validate id and code before doing anything
    if (!isValidId(msg.id)) return;
    if (!isValidCode(msg.code)) {
      figma.ui.postMessage({ type: 'result', id: msg.id, error: 'Invalid or oversized code payload' });
      return;
    }
    if (!isRateAllowed()) {
      figma.ui.postMessage({ type: 'result', id: msg.id, error: 'Rate limit exceeded — slow down' });
      return;
    }
    try {
      const result = await executeCode(msg.code);
      figma.ui.postMessage({ type: 'result', id: msg.id, result });
    } catch (error) {
      figma.ui.postMessage({ type: 'result', id: msg.id, error: error.message });
    }
    return;
  }

  // ── Batch eval ──────────────────────────────────────────────
  if (msg.type === 'eval-batch') {
    if (!isValidId(msg.id)) return;
    if (!Array.isArray(msg.codes)) {
      figma.ui.postMessage({ type: 'batch-result', id: msg.id, results: [{ success: false, error: 'codes must be an array' }] });
      return;
    }
    // Cap array length
    if (msg.codes.length > MAX_BATCH_COUNT) {
      figma.ui.postMessage({ type: 'batch-result', id: msg.id, results: [{ success: false, error: `Batch too large (max ${MAX_BATCH_COUNT})` }] });
      return;
    }
    // Validate each code string
    for (const c of msg.codes) {
      if (!isValidCode(c)) {
        figma.ui.postMessage({ type: 'batch-result', id: msg.id, results: [{ success: false, error: 'Invalid or oversized code in batch' }] });
        return;
      }
    }
    if (!isRateAllowed()) {
      figma.ui.postMessage({ type: 'batch-result', id: msg.id, results: [{ success: false, error: 'Rate limit exceeded' }] });
      return;
    }
    const results = [];
    for (const code of msg.codes) {
      try {
        const result = await executeCode(code);
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    figma.ui.postMessage({ type: 'batch-result', id: msg.id, results });
    return;
  }

  // ── Connection lifecycle (no eval, safe to handle directly) ──
  if (msg.type === 'connected') {
    figma.notify('✓ Figma Local connected', { timeout: 2000 });
    return;
  }
  if (msg.type === 'disconnected') {
    figma.notify('Figma Local disconnected', { timeout: 2000 });
    return;
  }
  if (msg.type === 'error') {
    // Sanitise before displaying in Figma UI
    figma.notify('Figma Local: ' + sanitiseNotify(msg.message), { error: true });
    return;
  }
};

// Keep plugin alive
figma.on('close', () => {
  // Plugin closed
});

console.log('Figma DS CLI plugin started');
