#!/usr/bin/env bash
# Starts backend (8001) and frontend (5174). Press Ctrl+C to stop both.
cd "$(dirname "$0")"
[ -d .venv ] && [ -f .env ] || { echo "Run ./setup.sh first."; exit 1; }
.venv/bin/python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 &
BACK=$!
trap "kill $BACK 2>/dev/null" EXIT
echo "App: http://localhost:5174   API docs: http://localhost:8001/docs"
cd frontend && npm run dev
