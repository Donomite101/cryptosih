# 8. Setup, moving to another laptop, and troubleshooting

## Pushing the code from this laptop
The repository includes a `.gitignore` that **keeps secrets and generated files out**:

| Not pushed | Why |
|---|---|
| `.env` | Contains your API keys |
| `.venv/`, `__pycache__/` | Rebuilt by `setup` |
| `frontend/node_modules/`, `frontend/dist/` | Rebuilt by `npm install` / `npm run build` |
| `*.db` | Local case data; recreated on first start |

```bash
git init                      # skip if already a repo
git add .
git status                    # check that .env and node_modules are NOT listed
git commit -m "CryptoSentinel"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## On the other laptop

1. Install **Python 3.10+** (tick *Add to PATH* on Windows), **Node.js 18+** and **Git**.
2. Clone and set up:
   ```bash
   git clone <your-repo-url> cryptosentinel
   cd cryptosentinel
   setup.bat          # Windows        |   ./setup.sh   # macOS / Linux
   ```
3. Edit the new `.env` and add `ETHERSCAN_API_KEY` (and optionally `TRONGRID_API_KEY`). Copy the values from the old laptop's `.env` or create new free keys.
4. Start: `start.bat` (Windows) or `./start.sh` (macOS / Linux).
5. Open http://localhost:5174 and search `0x487cab40f6d11a278fa7c442c6741eabe44eab5d`.

On macOS/Linux, if `./setup.sh` says "permission denied": `chmod +x setup.sh start.sh`.

## Manual commands (no scripts)
```bash
python -m venv .venv
.venv\Scripts\activate            # Windows      (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
cd frontend && npm install && cd ..
copy .env.example .env            # macOS/Linux: cp .env.example .env   - then edit .env

# terminal 1 (project root, venv active)
python -m uvicorn backend.main:app --port 8001
# terminal 2
cd frontend
npm run dev
```

## Production-style build (optional)
`cd frontend && npm run build` creates `frontend/dist/`. The backend does not serve it; host it with any static server and make sure `/api` is routed to the backend. For demos the dev server is enough.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `etherscan_api_ready: false` in `/api/health`, or "Data retrieval problem" | `ETHERSCAN_API_KEY` missing/invalid in `.env`. Restart the backend after editing `.env` |
| Every search says "No crypto activity found" | The address really is empty, or the network is not covered (BNB Chain, Bitcoin...). Test with a known active address from the README |
| "We could not fully check this address" | An API call failed (rate limit / no internet). Wait a minute and retry; add `TRONGRID_API_KEY` for Tron |
| Tron search is slow (about 1 min) | Normal: calls are sequential. A key makes it faster, not instant |
| `ModuleNotFoundError: backend` | Start uvicorn from the **project root**, not from inside `backend/` |
| `ModuleNotFoundError: Crypto` | `pip install -r requirements.txt` (package `pycryptodome`), with the venv active |
| Page loads but searches fail with "Failed to fetch" | Backend not running on port 8001. Check the backend window |
| `Port 8001 / 5174 already in use` | Another instance is running. Close it, or find the process: Windows `netstat -ano \| findstr :8001`, macOS/Linux `lsof -i :8001` |
| Frontend opens a different app on :5173 | Another Vite project owns 5173. This project uses **5174** |
| Changed `vasp_labels.csv` but nothing changes | Restart the backend (labels are loaded at start-up) |
| Old cases/notices wanted gone | Stop the backend, delete `tech_titans.db`, start again |
| `npm install` fails | Use Node 18+ (`node --version`); delete `frontend/node_modules` and retry |

## Verify an installation (checklist)
1. `curl http://localhost:8001/api/health` -> `"status":"healthy"`, `vasp_cached_count` about 908, `etherscan_api_ready: true`.
2. http://localhost:8001/docs opens.
3. http://localhost:5174 shows the search page.
4. Searching the Binance example address shows a red "Money reached a known exchange" box.
5. *Download report* saves an HTML file that opens in the browser.

## Security checklist before sharing the repo
* Confirm `git status` does not list `.env`.
* If a key was ever committed or pasted publicly, **revoke it** in the Etherscan/TronGrid dashboard and create a new one.
* The API has open CORS and no login; do not expose port 8001 to the internet.
