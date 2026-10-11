# CryptoSentinel

**Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges from Victim-Reported Suspect Wallet Addresses through Automated Blockchain Analytics** — Team Tech Titans.

A victim reports the wallet address a scammer gave them. CryptoSentinel follows the stolen money across the blockchain, finds the exchanges it was cashed out through, explains everything in plain English, and generates the legal freeze request to send to those exchanges.

> **Not a crypto expert?** Search an address, read the coloured box at the top ("Money reached a known exchange: Binance"), then follow the *What to do next* list. Click **Download report** to save everything as a printable report.

---

## What it does

| Feature | In one line | Details |
|---|---|---|
| Multi-hop tracing | Follows money 1–3 steps from the suspect wallet (Ethereum, Polygon, Arbitrum, Linea, Tron) | [docs/02-tracing-engine.md](docs/02-tracing-engine.md) |
| Exchange identification | Matches receiving wallets against 900+ known exchange / mixer / bridge wallets | [docs/03-exchange-identification.md](docs/03-exchange-identification.md) |
| Risk analysis | Explainable pattern score (quick forwarding, splitting, mixers, draining) | [docs/04-risk-analysis.md](docs/04-risk-analysis.md) |
| Plain-English report | Verdict, findings, next steps, downloadable report | [docs/05-report-and-ui.md](docs/05-report-and-ui.md) |
| Victim cases + freeze notices | Complaint intake, auto-trace, Section 91 CrPC freeze letter generator | [docs/06-cases-and-freeze-notices.md](docs/06-cases-and-freeze-notices.md) |
| REST API | All of the above over HTTP | [docs/07-api-reference.md](docs/07-api-reference.md) |

Start with [docs/01-architecture.md](docs/01-architecture.md) for the big picture, and [docs/08-setup-and-troubleshooting.md](docs/08-setup-and-troubleshooting.md) if anything goes wrong.

---

## Requirements

| Needed | Version | Why | Get it |
|---|---|---|---|
| Python | 3.10 or newer (built on 3.12) | Backend (FastAPI) | https://www.python.org/downloads/ (tick **Add to PATH** on Windows) |
| Node.js | 18 or newer (built on 20) | Frontend (React + Vite) | https://nodejs.org/ |
| Internet connection | – | Live blockchain data | – |
| **Etherscan API key** | free | Ethereum/Polygon/Arbitrum/Linea data | https://etherscan.io/apis → sign up → *API Keys* |
| TronGrid API key | free, optional | Faster Tron tracing | https://www.trongrid.io |

Python packages are listed in [requirements.txt](requirements.txt) (fastapi, uvicorn, SQLAlchemy, pydantic, pydantic-settings, python-dotenv, requests, pycryptodome). Frontend packages are in [frontend/package.json](frontend/package.json) (react 19, vite 5, lucide-react).

No database server is needed: SQLite is used and the file is created automatically.

---

## Quick start on a new laptop

### 1. Get the code
```bash
git clone <your-repo-url> cryptosentinel
cd cryptosentinel
```

### 2. One-time setup

**Windows (PowerShell or Command Prompt)**
```bat
setup.bat
```

**macOS / Linux**
```bash
./setup.sh
```
This creates a Python virtual environment (`.venv`), installs backend and frontend packages, and creates `.env` from the template.

### 3. Add your API key
Open the new `.env` file and fill in:
```
ETHERSCAN_API_KEY=your_key_here
TRONGRID_API_KEY=your_key_here      # optional
```

### 4. Run
**Windows:** `start.bat` (opens two windows: backend + frontend)
**macOS / Linux:** `./start.sh`

Then open **http://localhost:5174**. API docs are at http://localhost:8001/docs.

### Prefer typing the commands yourself?
```bash
# one-time
python -m venv .venv
# Windows:        .venv\Scripts\activate
# macOS / Linux:  source .venv/bin/activate
pip install -r requirements.txt
cd frontend && npm install && cd ..
cp .env.example .env        # Windows: copy .env.example .env   (then edit it)

# every time - terminal 1 (project root, venv active)
python -m uvicorn backend.main:app --port 8001
# every time - terminal 2
cd frontend && npm run dev
```
> Run the backend **from the project root** (the folder containing `backend/`), not from inside `backend/`.

### Check it works
```bash
curl http://localhost:8001/api/health
# -> {"status":"healthy", ..., "vasp_cached_count": 908, "etherscan_api_ready": true}
```
`etherscan_api_ready: false` means the key is missing from `.env`.

---

## Try it with these real addresses

| Address | What you will see |
|---|---|
| `0x487cab40f6d11a278fa7c442c6741eabe44eab5d` | Money deposited into **Binance** → red "Action needed" verdict with the Binance contact |
| `TWRvGD71ywtp39kL3x1qfHgryb6s3dYWEd` | A **Tron** USDT wallet that was funded by Binance and split money across many wallets |
| `0x4838b106fce9647bdf1e7877bf73ce8b0bad5f97` | Active wallet that moved funds on, no exchange found yet |
| `0xd8da6bf26964af9d7eed9e03e53415d37aa96045` | Ordinary busy wallet (vitalik.eth) |
| `0x891a0c7d52f81b4737d9b23418c3938be4b3b8e6` | An address with **no activity** — shows the "nothing found" guidance |

Live addresses change over time, so results (and the Binance example) may differ from the day this was written.

---

## Project layout

```
backend/
  main.py               REST API (FastAPI) and request handling
  blockchain_engine.py  Live tracing: Etherscan V2 + TronGrid, multi-hop traversal
  vasp_service.py       Loads exchange/mixer labels from CSV into memory + DB
  ai_engine.py          Explainable risk scoring
  report_builder.py     Plain-English verdict, findings, next steps, grouped destinations
  crypto_utils.py       Input parsing: 0x address, Tron address, public key → address
  notice_generator.py   Freeze-notice letter text
  models.py / database.py / config.py
data/vasp_labels.csv    908 labelled wallets (exchanges, mixers, bridges, DEXs)
frontend/src/
  components/           TracerView (results), GraphCanvas, ExchangeCard, modals, tabs
  reportExport.js       "Download report" generator
  api.js                Backend client
docs/                   Detailed feature documentation
```

---

## Honest limitations

- **Networks covered:** Ethereum, Polygon, Arbitrum One, Linea (via the free Etherscan key) and Tron. BNB Chain, Base, Optimism, Avalanche and Bitcoin are **not** covered (they need a paid Etherscan plan or other providers).
- **Exchange recognition is list-based.** An exchange wallet that is not in `data/vasp_labels.csv` shows as an unknown wallet (high-volume ones are flagged "Likely exchange"). Growing this list is the best way to improve results.
- Only the **most recent 25 transfers per wallet** are examined, and only the **8 biggest recipients per wallet** are followed further.
- The risk score is a **heuristic**, not machine learning and not legal proof. A wallet address alone never reveals a person — only an exchange's customer records can.
- Law-enforcement email/portal details for most imported exchanges are blank (`N/A`); only the curated entries at the top of the CSV have them. Verify contacts before sending a notice.
- The freeze-notice letter is a template. Review it with your legal team before use.

## Security notes
- `.env` holds secret keys and is git-ignored. Never commit it or paste keys into code.
- The API has open CORS and no login — fine for a prototype on a laptop, not for the public internet.
