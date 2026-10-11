# 3. Exchange (VASP) identification

**VASP** = Virtual Asset Service Provider (exchange, custodial wallet, etc.). Finding which one received the stolen money is the core of this project, because the exchange is the only party that knows the real identity of the account holder.

Code: [backend/vasp_service.py](../backend/vasp_service.py) - Data: [data/vasp_labels.csv](../data/vasp_labels.csv)

## The label list
`vasp_labels.csv` (908 rows) has these columns:

| Column | Meaning |
|---|---|
| `address` | Wallet address (matched case-insensitively) |
| `entity_name` | e.g. Binance |
| `category` | `Exchange (CEX)`, `Mixer / Privacy`, `DEX / Swapping`, `DEX Aggregator`, `Cross-Chain Bridge`, `Token Contract` |
| `risk_rating` | Low / Medium / High / Severe |
| `jurisdiction` | Where the entity is based |
| `le_contact_email`, `le_portal_url` | Where police should send requests (`N/A` when unknown) |
| `notes` | Free text |

**Two sources are mixed:**
1. About 44 **curated rows at the top** (Binance, Coinbase, Kraken, OKX, Bybit, Huobi, KuCoin, Bitfinex, Gate.io, MEXC, Bitget, WazirX, CoinDCX, Tornado Cash, Uniswap, bridges and one Tron Binance wallet) with law-enforcement contacts.
2. About 860 rows imported from a **public community label set** (exchanges, Tornado Cash, bridges, DEXs). Their `notes` end with "(public label set)" and the contact is `N/A` unless the same exchange exists in the curated rows.

## How matching works
At start-up `load_vasp_database` reads the CSV into a Python dict (`address.lower()` -> record) and also mirrors it into the `vasp_records` table. During tracing, every receiving wallet is looked up with `lookup_vasp(address)`, an O(1) dict lookup. The record's category decides the node type:

| Category contains | Node type | Effect |
|---|---|---|
| `Exchange` / `CEX` | `EXCHANGE` | Trail stops; exchange card + freeze letter offered |
| `Mixer` | `MIXER` | Trail stops; critical verdict |
| `DEX` | `DEX` | Trail continues |
| `Bridge` | `BRIDGE` | Trail continues |
| (no match) | `MULE` | Unknown wallet, trail continues |

For every exchange hit the engine stores an entry in `detected_vasps` with: entity, category, exchange wallet address, total deposited, all deposit transaction hashes, last deposit time, hop distance, law-enforcement email and portal.

## Important to understand
* A match means "the receiving wallet is a **known wallet of that exchange**". Individual customer deposit addresses are usually *not* in public lists; they sweep into the exchange's hot wallets. So seeing the **hot wallet** one hop further is the typical (and legitimate) evidence.
* Unlisted exchanges are invisible. That is why the engine also flags high-volume "Likely exchange" wallets ([02](02-tracing-engine.md)).
* Tron coverage is thin (one confirmed Binance wallet in the file). Add more Tron exchange wallets as you confirm them.

## How to improve coverage
Add rows to `data/vasp_labels.csv` (any text editor or Excel, keep the header) and restart the backend. Put confirmed law-enforcement contacts in `le_contact_email` / `le_portal_url`. The **VASP Database** tab in the UI lets you search the loaded list by name, address or category.
