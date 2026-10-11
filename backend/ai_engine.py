import math
from typing import List, Dict, Any

class AIFraudAnalysisEngine:
    """
    AI / Machine Learning Heuristic Fraud Detection Engine.
    Analyzes real live on-chain transaction graph features to calculate
    an explainable fraud probability, peeling chain detection, and risk score.
    """

    def analyze(self, suspect_address: str, txs: List[Dict[str, Any]], detected_vasps: List[Dict[str, Any]], balance_eth: float) -> Dict[str, Any]:
        suspect = suspect_address.lower()
        outbound_txs = [t for t in txs if t.get("from", "").lower() == suspect]
        inbound_txs = [t for t in txs if t.get("to", "").lower() == suspect]

        total_tx_count = len(txs)
        outbound_count = len(outbound_txs)
        inbound_count = len(inbound_txs)

        patterns = []
        feature_scores = {}

        # 1. Feature: Anonymizing Mixer Interaction (Severe Penalty)
        has_mixer = any("mixer" in v.get("category", "").lower() for v in detected_vasps)
        mixer_score = 100 if has_mixer else 0
        feature_scores["mixer_interaction"] = mixer_score
        if has_mixer:
            patterns.append("Interaction with Anonymizing Privacy Mixer / Tumbler detected (High OFAC Sanction Risk).")

        # 2. Feature: Known Exchange Off-Ramp Proximity
        has_exchange = any("exchange" in v.get("category", "").lower() or "cex" in v.get("category", "").lower() for v in detected_vasps)
        exchange_score = 85 if has_exchange else (40 if len(detected_vasps) > 0 else 15)
        feature_scores["vasp_proximity"] = exchange_score
        if has_exchange:
            ex_names = ", ".join([v.get("entity_name") for v in detected_vasps if "exchange" in v.get("category", "").lower() or "cex" in v.get("category", "").lower()])
            patterns.append(f"Confirmed dissipation into Centralized Exchange deposit wallets ({ex_names}).")

        # 3. Feature: Rapid Fund Forwarding / Velocity Anomaly
        velocity_score = 20
        rapid_moves = 0
        if len(txs) >= 2:
            sorted_txs = sorted(txs, key=lambda x: int(x.get("timeStamp", 0) or 0))
            time_deltas = []
            for i in range(1, len(sorted_txs)):
                t1 = int(sorted_txs[i-1].get("timeStamp", 0) or 0)
                t2 = int(sorted_txs[i].get("timeStamp", 0) or 0)
                if t1 > 0 and t2 > 0:
                    diff_sec = abs(t2 - t1)
                    time_deltas.append(diff_sec)
                    if diff_sec < 3600: # Transferred within 1 hour
                        rapid_moves += 1

            if rapid_moves >= 2:
                velocity_score = 88
                patterns.append("High Transaction Velocity: Funds forwarded within under 60 minutes of receipt.")
            elif rapid_moves == 1:
                velocity_score = 65
                patterns.append("Moderate velocity fund dissipation detected.")
        feature_scores["fund_velocity"] = velocity_score

        # 4. Feature: Outflow Liquidation Ratio (Wallet Drain Rate)
        total_out_eth = sum(t.get("value", 0) for t in outbound_txs if t.get("token_symbol") == "ETH")
        total_in_eth = sum(t.get("value", 0) for t in inbound_txs if t.get("token_symbol") == "ETH")
        total_out_tokens = sum(t.get("value", 0) for t in outbound_txs if t.get("token_symbol") != "ETH")

        drain_score = 30
        if total_in_eth > 0:
            out_ratio = total_out_eth / total_in_eth
            if out_ratio >= 0.85 and balance_eth < 0.1:
                drain_score = 90
                patterns.append("Disposable Mule Behavior: Wallet completely drained (>85% outflow, minimal residual balance).")
            elif out_ratio >= 0.6:
                drain_score = 60
        elif total_out_tokens > 1000 and balance_eth < 0.2:
            drain_score = 80
            patterns.append("High-volume ERC-20 token outflow with near-zero residual gas balance.")
        feature_scores["liquidation_rate"] = drain_score

        # 5. Feature: Destination Dispersion / Peeling Chain Entropy
        distinct_recipients = set(t.get("to", "").lower() for t in outbound_txs if t.get("to"))
        peeling_score = 25
        if len(distinct_recipients) >= 3:
            peeling_score = 82
            patterns.append(f"Peeling Chain Pattern: Funds distributed across {len(distinct_recipients)} distinct downstream recipient addresses.")
        elif len(distinct_recipients) == 2:
            peeling_score = 60
        feature_scores["dispersion_entropy"] = peeling_score

        # 6. Composite AI Risk Calculation
        # Weighted formula
        if total_tx_count == 0:
            ai_risk = 10
            threat_level = "Low"
            conf = 98.0
            patterns.append("No active historical transactions found on-chain for this address.")
        else:
            weighted_sum = (
                mixer_score * 0.35 +
                exchange_score * 0.25 +
                velocity_score * 0.15 +
                drain_score * 0.15 +
                peeling_score * 0.10
            )
            ai_risk = int(round(weighted_sum))
            ai_risk = min(max(ai_risk, 15), 99)

            if ai_risk >= 85:
                threat_level = "Severe"
            elif ai_risk >= 65:
                threat_level = "High"
            elif ai_risk >= 40:
                threat_level = "Medium"
            else:
                threat_level = "Low"

            conf = round(min(80 + (total_tx_count * 1.5) + (len(detected_vasps) * 4), 98.5), 1)

        recommendations = []
        if has_exchange:
            recommendations.append("Immediate issuance of Section 91 Cr.P.C. / Law Enforcement Freeze Order to identified exchange compliance portals.")
        if has_mixer:
            recommendations.append("Submit suspicious transaction report (STR) to Financial Intelligence Unit (FIU-IND) citing OFAC mixer interaction.")
        if ai_risk >= 65 and not has_exchange:
            recommendations.append("Trace further hops (Hop 2/3) to uncover downstream off-ramps or cold storage destination.")

        return {
            "ai_risk_score": ai_risk,
            "threat_level": threat_level,
            "confidence_score": conf,
            "feature_breakdown": feature_scores,
            "detected_patterns": patterns,
            "recommendations": recommendations,
            "metrics": {
                "total_analyzed_txs": total_tx_count,
                "outbound_count": outbound_count,
                "inbound_count": inbound_count,
                "distinct_counterparties": len(distinct_recipients),
                "total_outflow_eth": round(total_out_eth, 4),
                "total_outflow_tokens": round(total_out_tokens, 2),
            }
        }

ai_engine = AIFraudAnalysisEngine()
