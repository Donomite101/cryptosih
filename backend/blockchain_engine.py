import time
import hashlib
import requests
from typing import Dict, Any, List, Set, Optional
from datetime import datetime
from .config import settings
from .vasp_service import lookup_vasp
from .crypto_utils import resolve_crypto_identifier
from .ai_engine import ai_engine
from .report_builder import build_report

ETHERSCAN_V2_BASE = "https://api.etherscan.io/v2/api"

# Chains reachable with a free Etherscan V2 key (checked in this order)
SCAN_CHAINS = {1: "Ethereum", 137: "Polygon", 42161: "Arbitrum One", 59144: "Linea"}
EXPLORERS = {1: "https://etherscan.io", 137: "https://polygonscan.com", 42161: "https://arbiscan.io", 59144: "https://lineascan.build"}
TRON_API = "https://api.trongrid.io"
TRON_EXPLORER = "https://tronscan.org/#"
_B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


def tron_hex_to_base58(hex_addr: str) -> str:
    """Converts a Tron hex address (41...) from raw contract data to base58check (T...)."""
    raw = bytes.fromhex(hex_addr)
    raw += hashlib.sha256(hashlib.sha256(raw).digest()).digest()[:4]
    n = int.from_bytes(raw, "big")
    out = ""
    while n:
        n, r = divmod(n, 58)
        out = _B58[r] + out
    return "1" * (len(raw) - len(raw.lstrip(b"\x00"))) + out


NATIVE_SYMBOL = {1: "ETH", 137: "POL", 42161: "ETH", 59144: "ETH", "tron": "TRX"}


def is_spam_symbol(sym: str) -> bool:
    """Lookalike/spam tokens use non-ASCII letters (e.g. Cyrillic 'Е' + Greek 'Τ') to imitate ETH/USDT."""
    return not (sym.isascii() and sym.isprintable()) or len(sym) > 12


EMPTY_MESSAGES = ("no transactions found", "no records found")

class BlockchainEngine:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.ETHERSCAN_API_KEY
        self.base_url = ETHERSCAN_V2_BASE

    def _call(self, params: Dict[str, Any], warnings: Optional[List[str]] = None) -> List[Any]:
        """
        Single Etherscan V2 call with rate-limit retry. Returns the result rows ([] if none).
        Real API failures (bad key, rate limit, unsupported chain) are appended to `warnings`
        so they are never mistaken for an address that simply has no activity.
        """
        params = {**params, "apikey": self.api_key}
        last_err = ""
        for attempt in range(3):
            try:
                data = requests.get(self.base_url, params=params, timeout=15).json()
            except Exception as e:
                last_err = f"network error: {e}"
                time.sleep(0.6)
                continue
            result = data.get("result")
            if data.get("status") == "1":
                return result if isinstance(result, list) else [result]
            msg = str(data.get("message", "")).lower()
            if any(m in msg for m in EMPTY_MESSAGES) and isinstance(result, list):
                return []
            last_err = f"{data.get('message')}: {result}"
            if "rate limit" in str(result).lower():
                time.sleep(1.1)
                continue
            break
        if warnings is not None and last_err:
            warnings.append(f"chain {params.get('chainid')} {params.get('action')}: {last_err}")
        return []

    def fetch_eth_balance(self, address: str, chain_id: int = 1, warnings: Optional[List[str]] = None) -> float:
        """Fetches live native-coin balance from Etherscan V2 (or TronGrid)."""
        if chain_id == "tron":
            return self.tron_balance(address, warnings)
        rows = self._call({"chainid": chain_id, "module": "account", "action": "balance",
                           "address": address, "tag": "latest"}, warnings)
        try:
            return round(int(rows[0]) / 1e18, 4) if rows else 0.0
        except (ValueError, TypeError):
            return 0.0

    def _tron_get(self, path: str, params: Dict[str, Any], warnings: Optional[List[str]]) -> Any:
        err = ""
        for _ in range(3):
            try:
                headers = {"TRON-PRO-API-KEY": settings.TRONGRID_API_KEY} if settings.TRONGRID_API_KEY else {}
                time.sleep(0.25 if headers else 1.1)  # keyless TronGrid allows ~1 req/s
                r = requests.get(f"{TRON_API}{path}", params=params, headers=headers, timeout=15)
                if r.status_code == 429:
                    err = "TronGrid rate limit (add TRONGRID_API_KEY to .env)"
                    time.sleep(2.0)
                    continue
                data = r.json()
                if data.get("success") is False:
                    err = str(data.get("error", "unknown error"))
                    break
                return data
            except Exception as e:
                err = f"network error: {e}"
                time.sleep(0.6)
        if warnings is not None and err:
            warnings.append(f"tron {path.split('/')[-1]}: {err}")
        return {}

    def tron_balance(self, address: str, warnings: Optional[List[str]] = None) -> float:
        rows = self._tron_get(f"/v1/accounts/{address}", {}, warnings).get("data") or []
        return round(int(rows[0].get("balance", 0)) / 1e6, 4) if rows else 0.0

    def tron_transactions(self, address: str, max_count: int = 25, warnings: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        txs = []
        for item in self._tron_get(f"/v1/accounts/{address}/transactions", {"limit": max_count, "only_confirmed": "true"}, warnings).get("data", []):
            try:
                c = item["raw_data"]["contract"][0]
                if c["type"] != "TransferContract":
                    continue
                v = c["parameter"]["value"]
                txs.append({"hash": item["txID"], "from": tron_hex_to_base58(v["owner_address"]),
                            "to": tron_hex_to_base58(v["to_address"]), "value": round(v.get("amount", 0) / 1e6, 4),
                            "token_symbol": "ETH",  # native coin (TRX) uses the generic native key
                            "timeStamp": str(int(item["block_timestamp"]) // 1000),
                            "isError": item.get("ret", [{}])[0].get("contractRet") != "SUCCESS",
                            "blockNumber": item.get("blockNumber")})
            except (KeyError, IndexError, ValueError):
                continue
        for item in self._tron_get(f"/v1/accounts/{address}/transactions/trc20", {"limit": max_count, "only_confirmed": "true"}, warnings).get("data", []):
            info = item.get("token_info", {})
            txs.append({"hash": item["transaction_id"], "from": item["from"], "to": item["to"],
                        "value": round(int(item.get("value", 0)) / (10 ** int(info.get("decimals", 6))), 2),
                        "token_symbol": (info.get("symbol") or "TOKEN").upper(),
                        "spam": is_spam_symbol(info.get("symbol") or "TOKEN"),
                        "timeStamp": str(int(item["block_timestamp"]) // 1000), "isError": False, "blockNumber": None})
        return txs

    def resolve_tx(self, tx_hash: str, warnings: List[str]) -> Dict[str, Any]:
        """
        Finds who RECEIVED a payment, given the victim's transaction ID.
        Checks every supported network; for token (USDT/USDC) transfers the receiver is decoded from the call data.
        """
        for cid, name in SCAN_CHAINS.items():
            try:
                data = requests.get(self.base_url, params={"chainid": cid, "module": "proxy", "action": "eth_getTransactionByHash",
                                                           "txhash": tx_hash, "apikey": self.api_key}, timeout=15).json()
            except Exception as e:
                warnings.append(f"chain {cid} tx lookup: network error: {e}")
                continue
            tx = data.get("result")
            if not isinstance(tx, dict) or not tx.get("hash"):
                continue
            to_addr = (tx.get("to") or "").lower()
            inp = tx.get("input") or "0x"
            token_contract = None
            if inp.startswith("0xa9059cbb") and len(inp) >= 74:      # ERC-20 transfer(to, amount)
                token_contract = to_addr
                to_addr = "0x" + inp[34:74]
            elif inp.startswith("0x23b872dd") and len(inp) >= 138:   # transferFrom(from, to, amount)
                token_contract = to_addr
                to_addr = "0x" + inp[98:138]
            return {"chain_id": cid, "chain": name, "sender": (tx.get("from") or "").lower(), "receiver": to_addr,
                    "token_contract": token_contract}
        raise ValueError("Transaction ID not found on Ethereum, Polygon, Arbitrum or Linea. "
                         "It may be on another network (e.g. BNB Chain, Tron, Bitcoin) that this tool cannot read yet.")

    def scan_chains(self, address: str, warnings: List[str]) -> List[Dict[str, Any]]:
        """Checks the address for any activity on every supported chain."""
        out = []
        for cid, name in SCAN_CHAINS.items():
            native = self._call({"chainid": cid, "module": "account", "action": "txlist", "address": address,
                                 "startblock": 0, "endblock": 99999999, "page": 1, "offset": 1, "sort": "desc"}, warnings)
            tokens = self._call({"chainid": cid, "module": "account", "action": "tokentx", "address": address,
                                 "page": 1, "offset": 1, "sort": "desc"}, warnings)
            out.append({"chain_id": cid, "chain": name, "has_activity": bool(native or tokens),
                        "balance": self.fetch_eth_balance(address, cid, warnings),
                        "explorer": f"{EXPLORERS[cid]}/address/{address}"})
        return out

    def fetch_transactions(self, address: str, max_count: int = 50, chain_id: int = 1,
                           warnings: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Fetches real on-chain native transactions and ERC-20 transfers via Etherscan V2 (or TronGrid)."""
        if chain_id == "tron":
            return self.tron_transactions(address, max_count, warnings)
        txs = []
        for item in self._call({"chainid": chain_id, "module": "account", "action": "txlist", "address": address,
                                "startblock": 0, "endblock": 99999999, "page": 1, "offset": max_count,
                                "sort": "desc"}, warnings):
            txs.append({
                "hash": item.get("hash"),
                "from": item.get("from", "").lower(),
                "to": item.get("to", "").lower(),
                "value": round(int(item.get("value", 0)) / 1e18, 4),
                "token_symbol": "ETH",  # native coin of the scanned chain
                "timeStamp": item.get("timeStamp"),
                "isError": item.get("isError", "0") == "1",
                "blockNumber": item.get("blockNumber")
            })
        for item in self._call({"chainid": chain_id, "module": "account", "action": "tokentx", "address": address,
                                "page": 1, "offset": max_count, "sort": "desc"}, warnings):
            decimals = int(item.get("tokenDecimal", 18) or 18)
            txs.append({
                "hash": item.get("hash"),
                "from": item.get("from", "").lower(),
                "to": item.get("to", "").lower(),
                "value": round(int(item.get("value", 0)) / (10 ** decimals), 2),
                "token_symbol": item.get("tokenSymbol", "TOKEN").upper(),
                "spam": is_spam_symbol(item.get("tokenSymbol", "TOKEN")),
                "timeStamp": item.get("timeStamp"),
                "isError": False,
                "blockNumber": item.get("blockNumber")
            })
        return txs

    def analyze_address(self, raw_identifier: str, max_depth: int = 2) -> Dict[str, Any]:
        """
        Executes 100% REAL on-chain blockchain forensics:
        1. Resolves input (supports both Ethereum Address & Cryptographic Public Key).
        2. Queries live Etherscan V2 API for balance and transactions.
        3. Recursive multi-hop tracing across downstream outbound addresses.
        4. Matches destination addresses against static VASP dataset.
        5. Runs AI/ML heuristic fraud engine to calculate explainable risk scores.
        """
        # Resolve address from input (Ethereum address or Public Key)
        resolved = resolve_crypto_identifier(raw_identifier)
        suspect_norm = resolved["derived_address"]
        input_type = resolved["input_type"]
        public_key = resolved.get("public_key")
        source_tx = None
        warnings: List[str] = []

        if input_type == "TX_HASH":
            info = self.resolve_tx(resolved["tx_hash"], warnings)
            source_tx = {"hash": resolved["tx_hash"], **info}
            suspect_norm = info["receiver"]
            input_type = "ETHEREUM_ADDRESS"

        # 1. Scan all supported chains, trace on the first one with activity (default Ethereum)
        if input_type == "TRON_ADDRESS":
            tx_probe = self.tron_transactions(suspect_norm, 1, warnings)
            bal = self.tron_balance(suspect_norm, warnings)
            chain_activity = [{"chain_id": "tron", "chain": "Tron", "has_activity": bool(tx_probe) or bal > 0,
                               "balance": bal, "explorer": f"{TRON_EXPLORER}/address/{suspect_norm}"}]
            SCAN_NAMES, EXPL = {"tron": "Tron"}, {"tron": TRON_EXPLORER}
        else:
            chain_activity = self.scan_chains(suspect_norm, warnings)
            SCAN_NAMES, EXPL = SCAN_CHAINS, EXPLORERS
        active = [c for c in chain_activity if c["has_activity"]]
        chain_id = active[0]["chain_id"] if active else chain_activity[0]["chain_id"]
        chain_name = SCAN_NAMES[chain_id]
        explorer = EXPL[chain_id]
        suspect_balance = next(c["balance"] for c in chain_activity if c["chain_id"] == chain_id)
        native_symbol = NATIVE_SYMBOL.get(chain_id, "ETH")

        # 2. Traverse multi-hop outbound transaction graph
        visited_nodes: Set[str] = set([suspect_norm])
        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []
        all_collected_txs: List[Dict[str, Any]] = []
        detected_vasps_map: Dict[str, Dict[str, Any]] = {}

        # Add root suspect node
        root_label = f"Suspect Wallet ({suspect_norm[:6]}...{suspect_norm[-4:]})"
        if input_type == "CRYPTOGRAPHIC_PUBLIC_KEY":
            root_label = f"Derived from PubKey ({suspect_norm[:6]}...{suspect_norm[-4:]})"

        nodes.append({
            "id": suspect_norm,
            "label": root_label,
            "type": "SUSPECT",
            "risk_score": 90,
            "balance_eth": suspect_balance,
            "hop_level": 0,
            "entity": "Target Under Investigation",
            "input_type": input_type,
            "public_key": public_key
        })

        queue = [(suspect_norm, 0)]
        total_eth_outflow = 0.0
        total_token_outflow = 0.0
        spam_count = 0

        while queue:
            current_addr, current_depth = queue.pop(0)
            if current_depth >= max_depth:
                continue

            current_txs = self.fetch_transactions(current_addr, max_count=25, chain_id=chain_id, warnings=warnings)
            spam_count += sum(1 for t in current_txs if t.get("spam"))
            current_txs = [t for t in current_txs if not t.get("spam")]
            if current_depth == 0:
                all_collected_txs.extend(current_txs)

            # Unlabeled high-volume wallet (many distinct senders) => probable custodial/exchange deposit hub
            if current_depth > 0:
                senders = {t["from"] for t in current_txs if t["to"] == current_addr}
                if len(senders) >= 12:
                    for n in nodes:
                        if n["id"] == current_addr and n["type"] == "MULE":
                            n["label"] = f"Probable Service/Exchange Hub ({current_addr[:6]}...{current_addr[-4:]})"
                            n["entity"] = f"Unlabeled high-volume wallet ({len(senders)} distinct senders)"
                            n["probable_service"] = True

            # Filter outbound transactions (fund flow leaving the wallet)
            outbound_txs = [t for t in current_txs if t["from"] == current_addr and not t.get("isError")]

            # Only expand/enrich the highest-value recipients per wallet (keeps traces fast and focused)
            by_value: Dict[str, float] = {}
            for t in outbound_txs:
                if t["to"]:
                    by_value[t["to"]] = by_value.get(t["to"], 0.0) + t["value"]
            top_recipients = set(sorted(by_value, key=by_value.get, reverse=True)[:8])

            for tx in outbound_txs:
                recipient = tx["to"]
                if not recipient or recipient == "0x0000000000000000000000000000000000000000":
                    continue

                val = tx["value"]
                sym = tx["token_symbol"]
                disp_sym = native_symbol if sym == "ETH" else sym
                if sym == "ETH":
                    total_eth_outflow += val
                else:
                    total_token_outflow += val

                vasp_info = lookup_vasp(recipient)
                is_exchange = False
                node_type = "MULE"
                entity_label = f"Intermediary ({recipient[:6]}...{recipient[-4:]})"
                node_risk = 75

                if vasp_info:
                    cat = vasp_info.get("category", "")
                    if "Mixer" in cat:
                        node_type = "MIXER"
                        entity_label = vasp_info["entity_name"]
                        node_risk = 100
                    elif "Exchange" in cat or "CEX" in cat:
                        node_type = "EXCHANGE"
                        entity_label = vasp_info["entity_name"]
                        node_risk = 15
                        is_exchange = True
                    elif "DEX" in cat:
                        node_type = "DEX"
                        entity_label = vasp_info["entity_name"]
                        node_risk = 40
                    elif "Bridge" in cat:
                        node_type = "BRIDGE"
                        entity_label = vasp_info["entity_name"]
                        node_risk = 35

                    # Record VASP deposit
                    if vasp_info["entity_name"] not in detected_vasps_map:
                        detected_vasps_map[vasp_info["entity_name"]] = {
                            "entity_name": vasp_info["entity_name"],
                            "category": vasp_info["category"],
                            "address": recipient,
                            "total_deposited": f"{val:,.4f} {disp_sym}" if val < 1 else f"{val:,.2f} {disp_sym}",
                            "deposit_hashes": [tx["hash"]],
                            "last_deposit_time": datetime.utcfromtimestamp(int(tx.get("timeStamp", time.time()))).strftime('%Y-%m-%d %H:%M:%S UTC'),
                            "hop_distance": current_depth + 1,
                            "le_contact_email": vasp_info.get("le_contact_email", "N/A"),
                            "le_portal_url": vasp_info.get("le_portal_url", "N/A"),
                            "action_recommended": "Urgent Section 91 CrPC Freeze Order & KYC Preservation Request"
                        }
                    else:
                        existing = detected_vasps_map[vasp_info["entity_name"]]
                        if tx["hash"] not in existing["deposit_hashes"]:
                            existing["deposit_hashes"].append(tx["hash"])

                # Add node if not visited
                if recipient not in visited_nodes:
                    visited_nodes.add(recipient)
                    bal = 0.0
                    if not is_exchange and recipient in top_recipients:
                        bal = self.fetch_eth_balance(recipient, chain_id, warnings)
                    nodes.append({
                        "id": recipient,
                        "label": entity_label,
                        "type": node_type,
                        "risk_score": node_risk,
                        "balance_eth": bal,
                        "hop_level": current_depth + 1,
                        "entity": vasp_info["entity_name"] if vasp_info else "Intermediary Wallet",
                        "category": vasp_info.get("category", "") if vasp_info else "Wallet",
                        "le_contact_email": vasp_info.get("le_contact_email", "") if vasp_info else "",
                        "le_portal_url": vasp_info.get("le_portal_url", "") if vasp_info else ""
                    })

                    # If not a terminal exchange/mixer and within depth, continue traversal
                    if not is_exchange and node_type != "MIXER" and recipient in top_recipients and current_depth + 1 < max_depth:
                        queue.append((recipient, current_depth + 1))

                # Add edge
                edge_id = f"e_{tx['hash'][:10]}_{len(edges)}"
                ts_str = datetime.utcfromtimestamp(int(tx.get("timeStamp", time.time()))).strftime('%Y-%m-%d %H:%M:%S UTC') if tx.get("timeStamp") else "Recent"
                edges.append({
                    "id": edge_id,
                    "source": current_addr,
                    "target": recipient,
                    "hash": tx["hash"],
                    "value": f"{val:,.2f}",
                    "token_symbol": disp_sym,
                    "amount": val,
                    "ts": int(tx.get("timeStamp") or 0),
                    "timestamp": ts_str,
                    "is_exchange_deposit": is_exchange,
                    "exchange_name": vasp_info["entity_name"] if vasp_info else None
                })

        detected_vasps_list = list(detected_vasps_map.values())

        # Funding sources: who sent funds INTO the suspect wallet (victim / upstream exchanges)
        funding_sources: Dict[str, Dict[str, Any]] = {}
        for t in all_collected_txs:
            if t["to"] == suspect_norm and t["from"] and not t.get("isError"):
                src = funding_sources.setdefault(t["from"], {"address": t["from"], "total": 0.0, "tx_count": 0,
                                                             "symbols": set(), "entity": None, "category": None})
                src["total"] += t["value"]; src["tx_count"] += 1; src["symbols"].add(t["token_symbol"])
                v = lookup_vasp(t["from"])
                if v:
                    src["entity"], src["category"] = v["entity_name"], v["category"]
        funding_list = sorted(({**f, "symbols": sorted(f["symbols"]), "total": round(f["total"], 4)}
                               for f in funding_sources.values()), key=lambda x: -x["tx_count"])[:15]

        # 3. Execute AI / ML Heuristic Fraud Analysis
        ai_result = ai_engine.analyze(
            suspect_address=suspect_norm,
            txs=all_collected_txs,
            detected_vasps=detected_vasps_list,
            balance_eth=suspect_balance
        )

        # Update root node risk score with AI model prediction
        nodes[0]["risk_score"] = ai_result["ai_risk_score"]

        checked = ", ".join(c["chain"] for c in chain_activity)
        if warnings:
            summary_msg = (f"Data retrieval problem: {len(warnings)} blockchain API call(s) failed (e.g. {warnings[0]}). "
                           f"Results may be incomplete - this is NOT confirmation of an empty wallet.")
        elif not active:
            summary_msg = (f"No on-chain activity found for {suspect_norm} on any scanned chain ({checked}); balance 0. "
                           f"The address is unused or the funds moved on a chain/network not covered "
                           f"(e.g. Tron, BNB Chain, Bitcoin) - verify the address/network with the victim's transaction hash.")
        elif len(edges) == 0:
            summary_msg = (f"Activity found on {chain_name} ({len(all_collected_txs)} txs) but no outbound transfers yet. "
                           f"Balance {suspect_balance}. Funds appear to still be held at the suspect wallet - "
                           f"candidate for an immediate freeze/hold request.")
        else:
            summary_msg = (f"Live tracing on {chain_name} via Etherscan V2: {len(all_collected_txs)} transactions, "
                           f"{len(nodes)-1} downstream wallets over {max_depth} hops, {len(detected_vasps_list)} off-ramp entities "
                           f"identified, {sum(1 for n in nodes if n.get('probable_service'))} probable unlabeled service wallets.")

        result = {
            "suspect_address": suspect_norm,
            "input_type": input_type,
            "public_key": public_key,
            "is_live_data": True,
            "live_balance_eth": suspect_balance,
            "risk_score": ai_result["ai_risk_score"],
            "risk_level": ai_result["threat_level"],
            "ai_confidence_score": ai_result["confidence_score"],
            "ai_features": ai_result["feature_breakdown"],
            "ai_detected_patterns": ai_result["detected_patterns"],
            "ai_recommendations": ai_result["recommendations"],
            "ai_metrics": ai_result["metrics"],
            "total_outflow_eth": round(total_eth_outflow, 4),
            "total_outflow_tokens": round(total_token_outflow, 2),
            "hops_analyzed": max_depth,
            "chain": chain_name,
            "chain_id": chain_id,
            "native_symbol": native_symbol,
            "spam_transfers": spam_count,
            "source_tx": source_tx,
            "explorer_url": explorer,
            "tx_url_base": f"{explorer}/transaction/" if chain_id == "tron" else f"{explorer}/tx/",
            "chain_activity": chain_activity,
            "funding_sources": funding_list,
            "data_warnings": warnings,
            "nodes": nodes,
            "edges": edges,
            "detected_vasps": detected_vasps_list,
            "summary": summary_msg
        }
        result["report"] = build_report(result)
        return result

blockchain_engine = BlockchainEngine()
