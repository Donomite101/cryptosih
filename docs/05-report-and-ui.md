# 5. Plain-English report and the results page

Built for people with **no crypto knowledge**. Code: [backend/report_builder.py](../backend/report_builder.py), [frontend/src/components/TracerView.jsx](../frontend/src/components/TracerView.jsx), [frontend/src/reportExport.js](../frontend/src/reportExport.js).

## Where the report comes from
After tracing, `build_report()` turns raw results into a `report` object that is returned inside `POST /api/trace`:

| Field | Meaning |
|---|---|
| `verdict` | `level` (critical / warning / info / nodata), a one-line `headline`, a short `detail` |
| `stats` | transfers, wallets involved, exchanges found, balance, first/last activity |
| `findings` | Bullet sentences in simple language, each with a level (colour dot) |
| `next_steps` | What the user should do now |
| `destinations` | One row per receiving wallet (many transfers collapsed into count + total) |
| `glossary` | Key crypto terms explained |
| `disclaimer`, `generated_at` | Footer information |

## How the verdict is chosen (first match wins)

| Situation | Level | Headline |
|---|---|---|
| Some API calls failed | warning | We could not fully check this address |
| No activity on any network | nodata | No crypto activity found for this address |
| An exchange received money | **critical** | Money reached a known exchange: *Name* |
| A mixer received money | critical | Money passed through a privacy mixer |
| Money moved on, no exchange yet | warning | Money was moved on, but no exchange found yet |
| Wallet still holds funds | warning | Money is still sitting in the suspect wallet |
| Otherwise | info | Activity found, but no outgoing payments |

## The results page, top to bottom

1. **Header** - address (copy button), network badge, *New search*, *Download report*.
2. **Verdict box** - coloured by level, one clear sentence of what happened.
3. **Four number tiles** - transfers out, wallets involved, exchanges found, balance still in wallet.
4. **What we found / What to do next** - plain bullets and numbered steps.
5. **Exchanges that received the money** - one card per exchange: amount, last deposit, law-enforcement contact and portal link, proof links to the transactions, and **Create freeze request letter** (see [06](06-cases-and-freeze-notices.md)).
6. **Follow the money** - the graph ([below](#the-money-graph)).
7. **Where the money went** - table of receiving wallets (first 10, *Show all* to expand).
8. **Collapsed sections** - *All individual transfers*, *Technical details* (risk score, networks checked, who funded the wallet, data warnings) and *Key terms explained*.

## The money graph
Code: [GraphCanvas.jsx](../frontend/src/components/GraphCanvas.jsx)

* Each circle is a wallet, laid out in columns by step (hop). Colours: red suspect, amber other wallet, blue exchange, purple mixer.
* Many transfers between the same two wallets become **one arrow** labelled "8 transfers - 8.77 ETH"; thickness grows with the number of transfers.
* To stay readable it always shows the suspect and every identified entity, but only the **5 largest unknown wallets per step**. A note says how many are hidden; they are all in the table below.
* Click a circle to see its address, step, balance and a link to the block explorer. Zoom buttons are in the corner.

## Download report
`downloadReport(traceData)` builds a **single self-contained HTML file** in the browser (no server round-trip): verdict, numbers, findings, exchange contacts with proof links, money trail, next steps, all transfers, key terms. Open it in any browser; the **Print / Save as PDF** button at the top produces a PDF. The file name is `fraud-trace-report-<address start>.html`.

## Other UI details
* **Loading screen** (`AILoader.jsx`) is shown while tracing and lasts at least 3.2 s so the steps are visible; real tracing takes 15-60 s.
* **Four tabs:** Forensic Tracer, Victim Complaints, Sec 91 Freeze Orders, VASP Database ([06](06-cases-and-freeze-notices.md)).
* Explorer links automatically use the right site: Etherscan, Polygonscan, Arbiscan, Lineascan or Tronscan.

## Changing the wording
All sentences live in `backend/report_builder.py` (verdict texts, `next_steps`, `GLOSSARY`). The next steps currently mention the Indian National Cyber Crime Portal (cybercrime.gov.in) and the 1930 helpline; edit these for other countries.
