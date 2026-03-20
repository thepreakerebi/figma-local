#!/bin/bash
# figma-cli — one-line installer
# Usage: curl -fsSL https://raw.githubusercontent.com/thepreakerebi/figma-cli/main/install.sh | bash

set -e

REPO="thepreakerebi/figma-cli"
INSTALL_DIR="$HOME/.figma-cli"
BIN_DIR="/usr/local/bin"

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BOLD}  figma-cli installer${NC}"
echo ""

# ── Check Node.js ──────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Node.js not found.${NC}"
  echo "  Install Node.js 18+ from https://nodejs.org and re-run this script."
  exit 1
fi

NODE_VER=$(node -e "process.stdout.write(process.versions.node)")
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo -e "${RED}✗ Node.js $NODE_VER found, but 18+ is required.${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js $NODE_VER"

# ── Check npm ──────────────────────────────────────────────────
if ! command -v npm &>/dev/null; then
  echo -e "${RED}✗ npm not found.${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} npm $(npm -v)"

# ── Install via npm global ─────────────────────────────────────
echo ""
echo -e "  Installing figma-cli via npm..."
npm install -g @jetro/figcli 2>&1 | tail -3

if ! command -v fig &>/dev/null; then
  echo -e "${RED}✗ Installation failed — 'fig' not found on PATH.${NC}"
  echo "  Try manually: npm install -g @jetro/figcli"
  exit 1
fi

echo ""
echo -e "  ${GREEN}✓ figma-cli installed!${NC}"
echo ""
echo -e "  ${BOLD}Commands available:${NC}"
echo -e "    ${BOLD}fig${NC}           — run any figma-cli command"
echo -e "    ${BOLD}fig-start${NC}     — launch from any directory"
echo ""
echo -e "  ${BOLD}Quick start:${NC}"
echo -e "    1. Open Figma Desktop"
echo -e "    2. Import plugin: Plugins → Development → Import plugin from manifest"
echo -e "       Path: $(npm root -g)/figcli/plugin/manifest.json"
echo -e "    3. Run: ${BOLD}fig-start --safe${NC}"
echo ""
echo -e "  Docs: https://github.com/${REPO}"
echo ""
