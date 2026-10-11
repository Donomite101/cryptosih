#!/usr/bin/env bash
# One-time setup for macOS / Linux.
set -e
cd "$(dirname "$0")"
command -v python3 >/dev/null || { echo "[ERROR] Python 3.10+ not found"; exit 1; }
command -v node >/dev/null || { echo "[ERROR] Node.js 18+ not found"; exit 1; }

[ -d .venv ] || { echo "[1/4] Creating virtual environment..."; python3 -m venv .venv; }
echo "[2/4] Installing backend packages..."
.venv/bin/python -m pip install --upgrade pip >/dev/null
.venv/bin/python -m pip install -r requirements.txt
echo "[3/4] Installing frontend packages..."
(cd frontend && npm install)
if [ ! -f .env ]; then
  cp .env.example .env
  echo "[4/4] Created .env - ACTION NEEDED: add your ETHERSCAN_API_KEY (and optionally TRONGRID_API_KEY)."
else
  echo "[4/4] .env already exists - unchanged."
fi
echo "Setup complete. Start with: ./start.sh"
