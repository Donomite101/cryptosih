# 7. REST API reference

Base URL: `http://localhost:8001`. Interactive docs (try requests in the browser): **http://localhost:8001/docs**.
No authentication (prototype). All bodies are JSON.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Status, number of loaded labels, whether the Etherscan key is configured |
| GET | `/api/scenarios` | Example addresses |
| POST | `/api/trace` | Trace an address (main endpoint) |
| POST | `/api/reports` | File a victim complaint and auto-trace it |
| GET | `/api/reports` | List complaints (newest first) |
| GET | `/api/reports/{id}` | One complaint with its investigations |
| POST | `/api/freeze-notice` | Generate and store a freeze letter |
| GET | `/api/freeze-notices` | List notices |
| GET | `/api/vasp/directory?query=` | Search the exchange/mixer label list |
| GET | `/api/stats` | Counts for the dashboard |

## POST /api/trace

Request
```json
{ "address": "0x487cab40f6d11a278fa7c442c6741eabe44eab5d", "max_depth": 2, "victim_report_id": null }
```
`address` accepts a 0x address, a Tron `T...` address, a public key, or `vitalik.eth`. `max_depth` is 1-3 (default 2).

Response (main fields)
```jsonc
{
  "suspect_address": "0x...",
  "input_type": "ETHEREUM_ADDRESS",        // or TRON_ADDRESS, CRYPTOGRAPHIC_PUBLIC_KEY, ENS_NAME
  "chain": "Ethereum", "chain_id": 1, "native_symbol": "ETH",
  "explorer_url": "https://etherscan.io", "tx_url_base": "https://etherscan.io/tx/",
  "live_balance_eth": 0.0597,
  "risk_score": 54, "risk_level": "Medium", "ai_confidence_score": 85.5,
  "ai_detected_patterns": ["..."], "ai_recommendations": ["..."], "ai_metrics": {},
  "total_outflow_eth": 8.77, "total_outflow_tokens": 0, "spam_transfers": 20,
  "nodes": [{ "id": "0x..", "type": "SUSPECT|EXCHANGE|MIXER|DEX|BRIDGE|MULE", "hop_level": 0, "entity": "...", "balance_eth": 0.0 }],
  "edges": [{ "hash": "0x..", "source": "0x..", "target": "0x..", "amount": 3.04, "token_symbol": "ETH",
              "ts": 1760173211, "timestamp": "2026-10-11 09:00:11 UTC", "is_exchange_deposit": true, "exchange_name": "Binance" }],
  "detected_vasps": [{ "entity_name": "Binance", "category": "Exchange (CEX)", "address": "0x28c6..", "total_deposited": "3.04 ETH",
                       "deposit_hashes": ["0x.."], "hop_distance": 1, "le_contact_email": "case@binance.com", "le_portal_url": "https://..." }],
  "chain_activity": [{ "chain": "Ethereum", "has_activity": true, "balance": 0.0597 }],
  "funding_sources": [{ "address": "0x..", "entity": null, "total": 1.2, "tx_count": 1, "symbols": ["ETH"] }],
  "data_warnings": [],                      // non-empty = some API calls failed
  "summary": "...",
  "report": { "verdict": {}, "stats": {}, "findings": [], "next_steps": [], "destinations": [], "glossary": [] },
  "investigation_id": 7
}
```
Errors: `400` invalid/unrecognised address, `500` unexpected engine error (message in `detail`).

## POST /api/reports
```json
{ "victim_name": "A. Kumar", "suspect_address": "0x...", "amount_lost": 50000, "currency": "USDT",
  "scam_type": "Investment Fraud", "incident_date": "2026-10-01", "fir_number": "123/2026",
  "victim_email": null, "victim_phone": null, "initial_tx_hash": null, "police_station": null, "description": null }
```
Returns `{ report_id, complaint_id, status, investigation_id, analysis }` where `analysis` is the same object as `/api/trace`.

## POST /api/freeze-notice
```json
{ "investigation_id": 7, "victim_report_id": null, "exchange_name": "Binance",
  "exchange_email": "case@binance.com", "exchange_portal": "https://...",
  "suspect_address": "0x...", "deposit_hashes": ["0x..."], "total_deposit_amount": "3.04 ETH",
  "officer_name": "Insp. A", "officer_designation": "IO, Cyber Cell", "police_agency": "Cyber Crime Cell",
  "statute": "Section 91 Cr.P.C." }
```
If `victim_report_id` is omitted, the complaint is looked up through `investigation_id`. Returns the stored notice including `notice_content` (the full letter text).

## Quick tests from a terminal
```bash
curl http://localhost:8001/api/health
curl -X POST http://localhost:8001/api/trace -H "Content-Type: application/json" \
     -d '{"address":"0x487cab40f6d11a278fa7c442c6741eabe44eab5d","max_depth":2}'
```
(On Windows PowerShell use `curl.exe` and escape quotes, or just use the /docs page.)
