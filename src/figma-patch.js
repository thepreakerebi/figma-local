/**
 * Figma Patch
 *
 * Patches Figma Desktop to enable remote debugging.
 * Newer Figma versions block --remote-debugging-port by default.
 */

import { readFileSync, writeFileSync, accessSync, constants, mkdirSync, existsSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';

// Port config file location
const CONFIG_DIR = join(homedir(), '.figma-cli');
const PORT_FILE = join(CONFIG_DIR, 'cdp-port');

// Default port range: 9222-9322 (100 possible ports)
const PORT_MIN = 9222;
const PORT_MAX = 9322;

/**
 * Generate a random CDP port
 */
export function generateRandomPort() {
  return PORT_MIN + Math.floor(Math.random() * (PORT_MAX - PORT_MIN));
}

/**
 * Save the CDP port to config file
 */
export function saveCdpPort(port) {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(PORT_FILE, String(port));
  return port;
}

/**
 * Get the CDP port from config file, or default 9222
 */
export function getCdpPort() {
  try {
    if (existsSync(PORT_FILE)) {
      const port = parseInt(readFileSync(PORT_FILE, 'utf8').trim(), 10);
      if (port >= PORT_MIN && port <= PORT_MAX) {
        return port;
      }
    }
  } catch {}
  return 9222; // Fallback to default
}

/**
 * Clear the saved CDP port (on disconnect/cleanup)
 */
export function clearCdpPort() {
  try {
    if (existsSync(PORT_FILE)) {
      unlinkSync(PORT_FILE);
    }
  } catch {}
}

// Figma app.asar locations by platform
const ASAR_PATHS = {
  darwin: '/Applications/Figma.app/Contents/Resources/app.asar',
  win32: `${process.env.LOCALAPPDATA}\\Figma\\resources\\app.asar`,
  linux: '/opt/figma/resources/app.asar'
};

// The string that blocks remote debugging
const BLOCK_STRING = Buffer.from('removeSwitch("remote-debugging-port")');
// The patched string (changes "port" to "Xort" to disable the block)
const PATCH_STRING = Buffer.from('removeSwitch("remote-debugXing-port")');

/**
 * Get the path to Figma's app.asar file
 */
export function getAsarPath() {
  return ASAR_PATHS[process.platform] || null;
}

/**
 * Check if Figma is patched
 * @returns {boolean|null} true=patched, false=not patched, null=can't determine
 */
export function isPatched() {
  const asarPath = getAsarPath();
  if (!asarPath) return null;

  try {
    const content = readFileSync(asarPath);

    if (content.includes(PATCH_STRING)) {
      return true; // Already patched
    }

    if (content.includes(BLOCK_STRING)) {
      return false; // Needs patching
    }

    return null; // Can't determine (maybe old Figma version)
  } catch {
    return null;
  }
}

/**
 * Check if we have write access to the Figma app.asar file
 * @returns {boolean} true if we can write, false otherwise
 */
export function canPatchFigma() {
  const asarPath = getAsarPath();
  if (!asarPath) return false;

  try {
    accessSync(asarPath, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Patch Figma to enable remote debugging
 * @returns {boolean} true if patched successfully
 */
export function patchFigma() {
  const asarPath = getAsarPath();
  if (!asarPath) {
    throw new Error('Cannot detect Figma installation path for this platform');
  }

  // Check write access first
  if (!canPatchFigma()) {
    if (process.platform === 'darwin') {
      throw new Error('No write access to Figma. Grant Terminal "Full Disk Access" in System Settings → Privacy & Security');
    } else {
      throw new Error('No write access to Figma. Try running as administrator.');
    }
  }

  const content = readFileSync(asarPath);
  const blockIndex = content.indexOf(BLOCK_STRING);

  if (blockIndex < 0) {
    // Check if already patched
    if (content.includes(PATCH_STRING)) {
      return true; // Already patched
    }
    throw new Error('Could not find the string to patch. Figma version may be incompatible.');
  }

  // Apply patch
  PATCH_STRING.copy(content, blockIndex);
  writeFileSync(asarPath, content);

  // On macOS, re-sign the app
  if (process.platform === 'darwin') {
    try {
      execSync('codesign --force --deep --sign - /Applications/Figma.app', { stdio: 'ignore' });
    } catch {
      // Codesign might fail but patch might still work
    }
  }

  return true;
}

/**
 * Unpatch Figma to restore original state (re-enables remote debugging block)
 * @returns {boolean} true if unpatched successfully
 */
export function unpatchFigma() {
  const asarPath = getAsarPath();
  if (!asarPath) {
    throw new Error('Cannot detect Figma installation path for this platform');
  }

  const content = readFileSync(asarPath);
  const patchIndex = content.indexOf(PATCH_STRING);

  if (patchIndex < 0) {
    // Check if already unpatched (original state)
    if (content.includes(BLOCK_STRING)) {
      return true; // Already in original state
    }
    throw new Error('Could not find the patched string. Figma may not have been patched by this tool.');
  }

  // Restore original
  BLOCK_STRING.copy(content, patchIndex);
  writeFileSync(asarPath, content);

  // On macOS, re-sign the app
  if (process.platform === 'darwin') {
    try {
      execSync('codesign --force --deep --sign - /Applications/Figma.app', { stdio: 'ignore' });
    } catch {
      // Codesign might fail but unpatch might still work
    }
  }

  return true;
}

/**
 * Get the command to start Figma with remote debugging
 */
export function getFigmaCommand(port = 9222) {
  switch (process.platform) {
    case 'darwin':
      return `open -a Figma --args --remote-debugging-port=${port}`;
    case 'win32':
      return `"%LOCALAPPDATA%\\Figma\\Figma.exe" --remote-debugging-port=${port}`;
    case 'linux':
      return `figma --remote-debugging-port=${port}`;
    default:
      return null;
  }
}

/**
 * Get the path to Figma binary
 */
export function getFigmaBinaryPath() {
  switch (process.platform) {
    case 'darwin':
      return '/Applications/Figma.app/Contents/MacOS/Figma';
    case 'win32':
      return `${process.env.LOCALAPPDATA}\\Figma\\Figma.exe`;
    case 'linux':
      return '/usr/bin/figma';
    default:
      return null;
  }
}

export default {
  getAsarPath,
  isPatched,
  canPatchFigma,
  patchFigma,
  unpatchFigma,
  getFigmaCommand,
  getFigmaBinaryPath,
  generateRandomPort,
  saveCdpPort,
  getCdpPort,
  clearCdpPort
};
