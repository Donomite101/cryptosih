# 4. Risk analysis ("AI" engine)

Code: [backend/ai_engine.py](../backend/ai_engine.py)

This is an **explainable rule-based model** (heuristics with weights), not a trained machine-learning model. Each signal is scored 0-100 from the suspect wallet's own latest transfers and the exchanges detected; every signal that fires also produces a human-readable explanation.

## Signals

| Signal | Score when | Weight |
|---|---|---|
| Mixer interaction | a mixer was reached: 100, else 0 | 35 % |
| Exchange proximity | exchange reached: 85; other entity: 40; none: 15 | 25 % |
| Fund velocity | 2 or more transfers within 1 hour of the previous one: 88; exactly 1: 65; else 20 | 15 % |
| Wallet drain | outflow of 85 % or more of inflow with balance under 0.1: 90 ("disposable mule"); 60 % or more: 60; large token outflow with no gas: 80; else 30 | 15 % |
| Dispersion (peeling chain) | 3 or more distinct recipients: 82; exactly 2: 60; else 25 | 10 % |

`risk = round(sum of score x weight)`, clamped to **15-99**. A wallet with no transfers at all gets **10 (Low)**.

| Score | Level |
|---|---|
| 85 or more | Severe |
| 65 or more | High |
| 40 or more | Medium |
| below 40 | Low |

`confidence = min(80 + 1.5 x transfers_analysed + 4 x exchanges_found, 98.5)`. It reflects how much data was seen, not a statistical probability.

## Reading the result sensibly
* The number is a **guide**. "Reached an exchange" *raises* the score because that is the actionable outcome; it does not mean the exchange is guilty.
* The plain-English verdict in the report ([05](05-report-and-ui.md)) is driven by *what was found* (exchange / mixer / funds still held / nothing), **not** by this score.
* Detected patterns are rewritten into simple sentences in the report (for example "Money was split across 5 different wallets...").
* The score and metrics appear in the report under *Technical details*.
