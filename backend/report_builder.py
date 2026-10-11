"""Turns raw trace results into a plain-English report for non-technical users."""
from datetime import datetime
from typing import Any, Dict, List

NODE_KIND = {
    "SUSPECT": "Suspect wallet",
    "EXCHANGE": "Crypto exchange",
    "MIXER": "Privacy mixer",
    "DEX": "Swap service",
    "BRIDGE": "Cross-chain bridge",
    "MULE": "Unknown wallet",
}

GLOSSARY = [
    ("Wallet address", "Like a bank account number for crypto. Anyone can create one for free, and it does not show a name."),
    ("Transaction (Tx)", "One transfer of crypto from one wallet to another. Every transaction is permanently public."),
    ("Exchange", "A company (such as Binance or Coinbase) where people convert crypto to cash. Exchanges know the real identity of their customers (KYC), so this is where a scammer can be identified."),
    ("Freeze request", "A legal letter from police asking an exchange to hold the funds and keep the account holder's details."),
    ("Mixer", "A service that blends many people's crypto together to hide where it came from. Money passing through one is a strong warning sign."),
    ("Hop", "One step in the money trail. Hop 1 is the wallet the scammer sent to directly, hop 2 is where that wallet sent it next."),
    ("Unknown wallet", "A wallet that is not linked to any known company. It may be a personal wallet used to pass money along."),
]


def _fmt_ts(ts: int) -> str:
    return datetime.utcfromtimestamp(ts).strftime("%d %b %Y, %H:%M UTC") if ts else "unknown"


def _fmt_totals(totals: Dict[str, float]) -> str:
    parts = []
    for sym, val in sorted(totals.items(), key=lambda kv: -kv[1]):
        parts.append(f"{val:,.2f} {sym}" if val >= 1 else f"{val:,.4f} {sym}")
    return " + ".join(parts) if parts else "0"


def build_destinations(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]], suspect: str = "") -> List[Dict[str, Any]]:
    """Groups the many individual transfers into one row per receiving wallet."""
    node_by_id = {n["id"]: n for n in nodes}
    groups: Dict[str, Dict[str, Any]] = {}
    for e in edges:
        g = groups.setdefault(e["target"], {"address": e["target"], "tx_count": 0, "totals": {}, "first": 0, "last": 0, "senders": set()})
        g["tx_count"] += 1
        g["totals"][e["token_symbol"]] = g["totals"].get(e["token_symbol"], 0.0) + e.get("amount", 0.0)
        ts = e.get("ts") or 0
        if ts:
            g["first"] = ts if not g["first"] else min(g["first"], ts)
            g["last"] = max(g["last"], ts)
        g["senders"].add(e["source"])

    rows = []
    for addr, g in groups.items():
        if addr == suspect:
            continue
        n = node_by_id.get(addr, {})
        ntype = n.get("type", "MULE")
        rows.append({
            "address": addr,
            "name": ("Likely exchange / service wallet" if n.get("probable_service")
                     else (n.get("entity") if ntype != "MULE" else f"Wallet {addr[:6]}...{addr[-4:]}")),
            "type": ntype,
            "kind": NODE_KIND.get(ntype, "Unknown wallet"),
            "hop": n.get("hop_level", 1),
            "tx_count": g["tx_count"],
            "total_text": _fmt_totals(g["totals"]),
            "total_value": sum(g["totals"].values()),
            "first_seen": _fmt_ts(g["first"]),
            "last_seen": _fmt_ts(g["last"]),
            "probable_service": bool(n.get("probable_service")),
        })
    order = {"EXCHANGE": 0, "MIXER": 1, "BRIDGE": 2, "DEX": 3, "MULE": 4}
    rows.sort(key=lambda r: (order.get(r["type"], 5), -r["total_value"]))
    return rows


def build_report(a: Dict[str, Any]) -> Dict[str, Any]:
    nodes, edges = a.get("nodes", []), a.get("edges", [])
    vasps = a.get("detected_vasps", [])
    exchanges = [v for v in vasps if "exchange" in v.get("category", "").lower() or "cex" in v.get("category", "").lower()]
    mixers = [v for v in vasps if "mixer" in v.get("category", "").lower()]
    chain = a.get("chain", "Ethereum")
    balance = a.get("live_balance_eth", 0)
    warnings = a.get("data_warnings", [])
    active = any(c["has_activity"] for c in a.get("chain_activity", []))
    probable = [n for n in nodes if n.get("probable_service")]
    destinations = build_destinations(nodes, edges, a.get("suspect_address", ""))

    stamps = [e["ts"] for e in edges if e.get("ts")]
    first_ts, last_ts = (min(stamps), max(stamps)) if stamps else (0, 0)

    # ---- Verdict -------------------------------------------------------
    if warnings:
        level = "warning"
        headline = "We could not fully check this address"
        detail = ("Some blockchain data could not be loaded (usually a temporary limit). "
                  "Please search again in a minute. This does NOT mean the wallet is clean.")
    elif not active:
        level = "nodata"
        headline = "No crypto activity found for this address"
        detail = (f"We checked Ethereum, Polygon, Arbitrum and Linea (or Tron for T-addresses) and found no transfers and no balance. "
                  "The address may be mistyped, unused, or the money may have been sent on a network we do not cover "
                  "(for example Bitcoin or BNB Chain). Ask the victim for the transaction ID (hash) from their payment to confirm the right address and network.")
    elif exchanges:
        names = ", ".join(sorted({v["entity_name"] for v in exchanges}))
        level = "critical"
        headline = f"Money reached a known exchange: {names}"
        detail = (f"The stolen funds were sent on to a wallet that belongs to {names}. Exchanges keep identity records "
                  "of their customers, so police can ask them to freeze the money and reveal who owns the account. "
                  "Time matters: the sooner the request is sent, the more likely the funds are still there.")
    elif mixers:
        level = "critical"
        headline = "Money passed through a privacy mixer"
        detail = ("Part of the money went through a mixing service designed to hide the trail. "
                  "This makes tracing much harder and is a strong sign of deliberate laundering.")
    elif edges:
        level = "warning"
        headline = "Money was moved on, but no exchange found yet"
        detail = (f"The funds were passed through {len(nodes) - 1} other wallet(s) but have not reached a known exchange "
                  "within the steps we followed. They may still be sitting in a personal wallet, or may reach an exchange later. "
                  "Re-run this check in a few days.")
    elif balance and balance > 0:
        level = "warning"
        headline = "Money is still sitting in the suspect wallet"
        detail = (f"The wallet holds {balance} {a.get('native_symbol', 'ETH')} and has not sent it anywhere yet. "
                  "This is the best moment to act: report it quickly so the receiving platform or authorities can be alerted.")
    else:
        level = "info"
        headline = "Activity found, but no outgoing payments"
        detail = "The wallet has received funds but has not sent any out, and has no balance left to track."

    # ---- Findings (plain language) --------------------------------------
    findings: List[Dict[str, str]] = []
    if active:
        findings.append({"level": "info", "text": f"Activity was found on the {chain} network."})
    if edges:
        findings.append({"level": "info",
                         "text": f"The suspect wallet sent money to {len(destinations)} different wallet(s) in {len(edges)} transfer(s)"
                                 + (f", between {_fmt_ts(first_ts)} and {_fmt_ts(last_ts)}." if first_ts else ".")})
    if a.get("spam_transfers"):
        findings.append({"level": "info",
                         "text": f"{a['spam_transfers']} worthless 'lookalike' token transfers were ignored. Scammers send fake tokens "
                                 "that imitate ETH or USDT to clutter wallets (a trick called address poisoning). They are not real money."})
    for v in exchanges:
        findings.append({"level": "critical",
                         "text": f"{v['entity_name']}: {v['total_deposited']} was sent to a wallet labeled as {v['entity_name']} "
                                 f"({v['hop_distance']} step(s) from the suspect)."})
    for v in mixers:
        findings.append({"level": "critical", "text": f"A transfer went to {v['entity_name']}, a privacy mixer."})
    if probable:
        findings.append({"level": "warning",
                         "text": f"{len(probable)} wallet(s) receive money from many different senders. That is typical of an exchange "
                                 "or payment service even though they are not on our list. These are good places to look for the platform "
                                 "that can identify the account holder."})
    for src in a.get("funding_sources", [])[:3]:
        if src.get("entity"):
            findings.append({"level": "info", "text": f"The suspect wallet was funded by {src['entity']} ({src['total']} {'/'.join(src['symbols'])})."})
    plain = {
        "High Transaction Velocity": "Money was forwarded within an hour of arriving. Scam wallets typically cash out this fast.",
        "Moderate velocity": "Some money was forwarded shortly after arriving.",
        "Disposable Mule Behavior": "The wallet was almost completely emptied, which is typical of a throwaway scam wallet.",
        "High-volume ERC-20": "A large amount of tokens was moved out, leaving almost nothing behind.",
    }
    for p in a.get("ai_detected_patterns", []):
        if p.startswith(("No active", "Confirmed dissipation", "Interaction with Anonymizing")):
            continue  # already covered by the exchange / mixer findings
        if p.startswith("Peeling Chain"):
            n = p.split("across ")[1].split(" ")[0]
            findings.append({"level": "warning", "text": f"Money was split across {n} different wallets, a common way to make a trail harder to follow."})
            continue
        findings.append({"level": "warning", "text": next((v for k, v in plain.items() if p.startswith(k)), p)})
    if balance and balance > 0 and edges:
        findings.append({"level": "warning", "text": f"The suspect wallet still holds {balance} of native coin that could be frozen."})

    # ---- Next steps ------------------------------------------------------
    steps: List[str] = []
    if level == "nodata":
        steps += ["Double-check the wallet address with the victim (one wrong character gives a different wallet).",
                  "Get the transaction ID (hash) of the victim's payment and look it up on the matching blockchain explorer to find the real receiving address and network.",
                  "If the payment was on Bitcoin, BNB Chain, Base or similar, this tool cannot trace it yet."]
    elif level == "warning" and warnings:
        steps += ["Wait a minute and run the search again."]
    else:
        steps.append("Download this report and keep it with the case file. Also keep the victim's screenshots, chats and payment receipts.")
        steps.append("Report the fraud on the National Cyber Crime Portal (cybercrime.gov.in) or call 1930, and get a complaint/FIR number.")
        if exchanges:
            steps.append("Click 'Create freeze request' under each exchange below. Send it to the exchange's law-enforcement contact quickly, asking them to hold the funds and preserve the account holder's KYC details.")
        elif edges:
            steps.append("Re-run this check every few days. If the money lands at an exchange later, a freeze request can be created then.")
        if mixers:
            steps.append("Mention the mixer in the complaint. Authorities can escalate to the financial intelligence unit.")
        if balance and balance > 0:
            steps.append("Tell investigators that the suspect wallet still holds funds so it can be flagged immediately.")
        steps.append("Remember: a wallet address alone does not reveal a person. Only the exchange (or police via the exchange) can link it to a real identity.")

    stats = {
        "wallets_involved": max(len(nodes) - 1, 0),
        "transfers": len(edges),
        "exchanges_found": len(exchanges),
        "balance": balance,
        "native_symbol": a.get("native_symbol", "ETH"),
        "total_out_native": a.get("total_outflow_eth", 0),
        "total_out_tokens": a.get("total_outflow_tokens", 0),
        "first_activity": _fmt_ts(first_ts) if first_ts else None,
        "last_activity": _fmt_ts(last_ts) if last_ts else None,
    }

    return {
        "verdict": {"level": level, "headline": headline, "detail": detail},
        "findings": findings,
        "next_steps": steps,
        "destinations": destinations,
        "stats": stats,
        "glossary": [{"term": t, "meaning": m} for t, m in GLOSSARY],
        "generated_at": datetime.utcnow().strftime("%d %b %Y, %H:%M UTC"),
        "disclaimer": ("This report is generated automatically from public blockchain data and a list of known exchange wallets. "
                       "It is an investigative lead, not legal proof. Verify with the explorer links before acting."),
    }
