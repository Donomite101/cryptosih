# 2. Multi-hop tracing engine

**Goal:** starting from the suspect wallet, find where the money went, step by step.
Code: [backend/blockchain_engine.py](../backend/blockchain_engine.py), [backend/crypto_utils.py](../backend/crypto_utils.py).

## Step 1 - Understand the input (`resolve_crypto_identifier`)

| You type | Treated as |
|---|---|
| `0x` + 40 hex characters (or 40 hex without `0x`) | Ethereum-style address (lower-cased) |
| `T...` (34 characters, base58) | Tron address (case is kept, Tron is case-sensitive) |
| 64 / 66 / 128 / 130 hex characters | A **public key**. The Ethereum address is derived with Keccak-256 (`address = last 20 bytes of keccak256(uncompressed public key)`) |
| `vitalik.eth`, `binance.eth`, `coinbase.eth` | Three hard-coded name shortcuts (no live ENS lookup) |

Anything else returns HTTP 400 "Unrecognized identifier".

## Step 2 - Which network? (`scan_chains`)

For Ethereum-style addresses the engine asks Etherscan V2 about **Ethereum (1), Polygon (137), Arbitrum One (42161) and Linea (59144)**: does the address have any normal transaction or token transfer, and what is its balance? The first network with activity is used for the trace. If none has activity, Ethereum is used and the report says "nothing found".
Tron addresses use TronGrid only.

## Step 3 - Breadth-first hop traversal

```
queue = [(suspect, hop 0)]
while queue:
    wallet, hop = queue.pop()
    if hop >= max_depth: continue            # max_depth = 1..3, the UI uses 2
    txs = latest 25 normal + 25 token transfers of wallet
    drop spam tokens (see below)
    outbound = transfers sent FROM wallet that did not fail, not to the zero address
    top8 = the 8 recipients that received the most value
    for each outbound transfer:
        look the recipient up in the exchange list   -> node type
        add node + edge (edge keeps hash, amount, time)
    expand only recipients in top8, and only if they are not an exchange or mixer
```

* **Why stop at exchanges and mixers?** An exchange is the cash-out point (what we are looking for); a mixer ends the traceable trail.
* **Why top 8?** Keeps a trace to roughly 15-50 s instead of minutes (every wallet costs several API calls) and focuses on where the bulk of the money went.
* **Node types:** `SUSPECT`, `EXCHANGE`, `MIXER`, `DEX`, `BRIDGE`, `MULE` (= unknown wallet).

## Spam / "lookalike" token filter
Scammers send worthless tokens whose symbol imitates ETH/USDT using look-alike letters (for example Cyrillic "E", Greek "T"). This is called "address poisoning". A transfer is treated as spam when its token symbol contains non-ASCII or non-printable characters, or is longer than 12 characters. Spam transfers are **not** added to the graph or totals; they are only counted and mentioned in the report.

## "Likely exchange" detection for unlabeled wallets
When a followed wallet (hop 1 or more) received from **12 or more distinct senders** within the transfers fetched, it behaves like a deposit hub (exchange or payment service) even if unlisted. It is flagged `probable_service` and labelled "Likely exchange". This is a hint, not proof.

## Funding sources
Inbound transfers to the suspect wallet are grouped by sender (count, total) and each sender is checked against the exchange list, for example "funded by Binance". Shown under *Technical details*.

## Data-reliability behaviour (`_call`)
* Up to 3 attempts per API call, with a wait on "rate limit" replies.
* An empty answer ("No transactions found") is a valid result.
* Any real failure (bad key, rate limit, unsupported network) is recorded in `data_warnings`. If there are warnings the verdict says **"We could not fully check this address"** instead of wrongly claiming the wallet is clean.

## Tron specifics
* TronGrid endpoints: account balance, native TRX transfers (`/transactions`), TRC-20 token transfers (`/transactions/trc20`; USDT is the main scam rail).
* Native transfers carry hex addresses (`41...`); `tron_hex_to_base58` converts them to `T...` (Base58Check with a double-SHA256 checksum).
* Without `TRONGRID_API_KEY` calls are spaced about 1.1 s apart; with a key about 0.25 s.

## Native coin naming
Internally the native coin of every network is stored under the key `ETH` so the scoring logic is shared. The **display** symbol is converted to `ETH`, `POL` (Polygon) or `TRX` (Tron).

## Known limits
Only the latest 25 transfers per wallet per type are read; older history is not seen. Internal contract transfers are not read. Bitcoin, BNB Chain, Base and Optimism are not supported. Requests are sequential (a deep Tron trace takes about a minute).
