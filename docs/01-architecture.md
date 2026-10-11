# 1. Architecture

## The big picture

```
 Browser (React + Vite, :5174)
        |  /api/*  (Vite dev-proxy -> :8001)
        v
 FastAPI backend (:8001)  ------------->  SQLite file (tech_titans.db)
   |        |                               victim_reports, investigations,
   |        |                               freeze_notices, vasp_records
   |        +--> data/vasp_labels.csv  (exchange / mixer labels, loaded into memory at start-up)
   |
   +--> Etherscan V2 API  (Ethereum, Polygon, Arbitrum, Linea)   <- ETHERSCAN_API_KEY
   +--> TronGrid API      (Tron)                                  <- TRONGRID_API_KEY (optional)
```

There is **no separate database server, queue, or cache**. Everything runs as two processes: the Python API and the Vite dev server.

## Request flow for one search

1. User pastes an address in the search box. `TracerView.handleSubmit` calls `api.traceAddress(address, 2)`.
2. `POST /api/trace` ([backend/main.py](../backend/main.py)) calls `BlockchainEngine.analyze_address`.
3. The engine resolves the input, scans networks, traces hops, matches exchanges, scores risk and builds the report ([02](02-tracing-engine.md), [03](03-exchange-identification.md), [04](04-risk-analysis.md), [05](05-report-and-ui.md)).
4. The API stores a summary row in `investigations` and returns one JSON document (nodes, edges, detected exchanges, risk, `report`).
5. React renders the report. Nothing is recomputed in the browser except grouping arrows in the graph and building the downloadable report.

## Backend modules

| File | Responsibility |
|---|---|
| `main.py` | HTTP routes, request validation (Pydantic), persistence |
| `blockchain_engine.py` | Talks to Etherscan/TronGrid, multi-hop traversal, node/edge construction |
| `vasp_service.py` | Loads `vasp_labels.csv`; `lookup_vasp(address)` is an in-memory dict lookup |
| `ai_engine.py` | Weighted heuristic risk model with explanations |
| `report_builder.py` | Converts raw results to verdict, findings, next steps, grouped "where the money went" |
| `crypto_utils.py` | Detects input type; derives an Ethereum address from a public key (Keccak-256) |
| `notice_generator.py` | Text of the freeze-notice letter |
| `models.py`, `database.py`, `config.py` | SQLAlchemy tables, DB session, `.env` settings |

## Frontend modules

| File | Responsibility |
|---|---|
| `App.jsx` | Tabs, global state (search text, current result), modals |
| `components/TracerView.jsx` | Home search, loading screen, and the full results page |
| `components/GraphCanvas.jsx` | SVG money-flow graph (groups arrows, limits to largest wallets) |
| `components/ExchangeCard.jsx` | One exchange: amount, contact, proof links, freeze-letter button |
| `components/VictimReportModal.jsx` | "Report Incident" form |
| `components/FreezeNoticeModal.jsx` | Freeze-letter editor with copy/print |
| `components/VictimCasesView.jsx`, `FreezeNoticesView.jsx`, `VaspDirectoryView.jsx` | The other three tabs |
| `reportExport.js` | Builds the downloadable HTML report |
| `api.js` | `fetch` wrapper (tries the Vite proxy, then `http://localhost:8001`) |

(`RiskDial.jsx` and `VaspCard.jsx` are older components no longer used by the results page.)

## Configuration (`.env`)

| Variable | Required | Meaning |
|---|---|---|
| `ETHERSCAN_API_KEY` | **yes** | Etherscan V2 key (also works for Polygon/Arbitrum/Linea) |
| `TRONGRID_API_KEY` | no | Raises TronGrid rate limits |
| `DATABASE_URL` | no | Default `sqlite:///./tech_titans.db` (relative to the folder you start the backend from) |
| `VASP_LABELS_FILE` | no | Path to the label CSV |
| `APP_ENV` | no | Shown in `/api/health` |

Ports are set by the start commands: backend `8001`, frontend `5174` (see `frontend/vite.config.js`, which proxies `/api` to `8001`).

## Database tables

| Table | Holds |
|---|---|
| `victim_reports` | Complaints: victim, suspect address, amount, FIR number, status |
| `investigations` | One row per trace: risk, totals, graph JSON, detected exchanges JSON |
| `freeze_notices` | Generated freeze letters with full text |
| `vasp_records` | Mirror of the label CSV |

The file `tech_titans.db` is created automatically on first start. Deleting it resets all cases and notices.
