# 6. Victim cases and freeze notices

## Victim complaint intake ("Report Incident")
Code: [VictimReportModal.jsx](../frontend/src/components/VictimReportModal.jsx), `POST /api/reports` in [main.py](../backend/main.py).

1. Click **Report Incident** (top right) and fill in: victim name, optional email/phone, **suspect wallet address**, amount lost and currency, scam type, incident date, optional FIR number, description.
2. The backend creates a complaint with an ID like `CYBER-2026-A1B2C3` (status `Investigating`).
3. It **automatically traces** the suspect address (2 hops) and stores the result as an *investigation* linked to the complaint.
4. If an exchange is found, the complaint status becomes **Traced to Exchange**.
5. The UI jumps to the results page for that trace.

## Victim Complaints tab
Lists every complaint with a status filter. **Load in tracer** re-runs the trace for that complaint's suspect address and links the new investigation to it.

## Freeze notice (Section 91 CrPC letter)
Code: [FreezeNoticeModal.jsx](../frontend/src/components/FreezeNoticeModal.jsx), [notice_generator.py](../backend/notice_generator.py), `POST /api/freeze-notice`.

1. On an exchange card press **Create freeze request letter**.
2. The form is pre-filled with the exchange, its law-enforcement contact, the suspect wallet, the deposit transaction hashes and the total amount. You can edit the **investigating officer, designation and statute**.
3. The backend builds the letter text, gives it a number such as `LE-FREEZE-2026-ABC123`, and saves it.
4. **Case details are filled automatically from the linked complaint** (victim name, complaint ID, FIR number). If the trace was not started from a complaint, those lines show `[... - to be filled by officer]` so no wrong details are ever sent.
5. Use **Copy Notice Text** or **Print / Export PDF**.

The letter asks the exchange to (1) freeze withdrawals for the accounts tied to the deposits, (2) preserve KYC data (ID documents, email, phone, login IPs, bank details), (3) provide the history of any onward transfers, and to confirm within two hours.

> The wording is a **template**. Have it reviewed by your legal/nodal officer before sending, and check the exchange's current law-enforcement contact.

## Sec 91 Freeze Orders tab
Shows all issued notices (number, exchange, amount, status) and lets you re-open the text.

## VASP Database tab
Search the loaded exchange/mixer label list by name, address or category (see [03](03-exchange-identification.md)).

## Data storage
Complaints, investigations (including the full graph JSON) and notices are kept in `tech_titans.db`. The dashboard numbers shown by `GET /api/stats` are counted from these tables, so a fresh install starts at zero.
