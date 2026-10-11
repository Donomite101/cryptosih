import json
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .config import settings
from .database import engine, get_db, Base
from .models import VictimReport, Investigation, FreezeNotice, VASPRecord
from .vasp_service import load_vasp_database, lookup_vasp, get_all_vasps
from .blockchain_engine import blockchain_engine
from .notice_generator import generate_freeze_notice_text

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CryptoFraud Forensics & VASP Identification Platform",
    description="Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges from Victim-Reported Suspect Wallets",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    with next(get_db()) as db:
        load_vasp_database(db)

# --- Pydantic Schemas ---

class TraceRequest(BaseModel):
    address: str
    max_depth: Optional[int] = Field(default=2, ge=1, le=3)
    victim_report_id: Optional[int] = None

class VictimReportCreate(BaseModel):
    victim_name: str
    victim_email: Optional[str] = None
    victim_phone: Optional[str] = None
    suspect_address: str
    initial_tx_hash: Optional[str] = None
    amount_lost: float
    currency: Optional[str] = "USDT"
    scam_type: Optional[str] = "Investment Fraud / Pig Butchering"
    incident_date: Optional[str] = None
    police_station: Optional[str] = "Special Cyber Crime Investigation Cell"
    fir_number: Optional[str] = None
    description: Optional[str] = None

class FreezeNoticeCreate(BaseModel):
    investigation_id: Optional[int] = None
    victim_report_id: Optional[int] = None
    exchange_name: str
    exchange_email: Optional[str] = None
    exchange_portal: Optional[str] = None
    suspect_address: str
    deposit_hashes: List[str]
    total_deposit_amount: str
    statute: Optional[str] = "Section 91 Cr.P.C. / Emergency Asset Preservation Directive"
    officer_name: Optional[str] = "Insp. R. K. Sharma"
    officer_designation: Optional[str] = "Investigating Officer, Cyber Crime Division"
    police_agency: Optional[str] = "Central Cyber Crime Cell"

# --- API Routes ---

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "app_env": settings.APP_ENV,
        "vasp_cached_count": len(get_all_vasps()),
        "etherscan_api_ready": bool(settings.ETHERSCAN_API_KEY)
    }

@app.get("/api/scenarios")
def get_scenarios():
    """Returns verified on-chain addresses and real cryptographic public keys."""
    return [
        {
            "key": "live_binance_deposit",
            "title": "Wallet depositing into Binance (exchange identified at hop 1)",
            "suspect_address": "0x487cab40f6d11a278fa7c442c6741eabe44eab5d",
            "scam_type": "Exchange Off-Ramp Detection",
            "amount_lost": 1.28,
            "currency": "ETH",
            "description": "Live Ethereum wallet whose funds were deposited to a Binance hot wallet - demonstrates exchange identification and LE contact lookup."
        },
        {
            "key": "live_tron_usdt",
            "title": "Tron (TRC-20 USDT) wallet trace",
            "suspect_address": "TWRvGD71ywtp39kL3x1qfHgryb6s3dYWEd",
            "scam_type": "USDT-TRC20 Scam Flow",
            "amount_lost": 1000.0,
            "currency": "USDT",
            "description": "Tron address traced via TronGrid (USDT on Tron is the most common scam payout rail)."
        },
        {
            "key": "live_exchange_inflow",
            "title": "Live Exchange Inflow & Peeling Flow (0x4838b1...)",
            "suspect_address": "0x4838b106fce9647bdf1e7877bf73ce8b0bad5f97",
            "scam_type": "On-Chain Multi-Hop Liquidation",
            "amount_lost": 12.5,
            "currency": "ETH",
            "description": "Real live active Ethereum address transferring outbound across multi-hop counterparties."
        },
        {
            "key": "live_vitalik",
            "title": "Live Ethereum Mainnet Address (vitalik.eth)",
            "suspect_address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
            "scam_type": "Live Mainnet Query",
            "amount_lost": 5.76,
            "currency": "ETH",
            "description": "Live Ethereum Mainnet address queried dynamically using Etherscan V2 API."
        },
        {
            "key": "crypto_public_key",
            "title": "Secp256k1 Cryptographic Public Key (Keccak-256 Detection)",
            "suspect_address": "04e68acfc0253a10620dff707b0ac063d5c5724f739ee2a15edbb6138402ac48195b23e1837d303984f9245e0bd5744ec51ac366bce652b83777745b5b28ec61d5",
            "scam_type": "Public Key Address Derivation",
            "amount_lost": 0.0,
            "currency": "ETH",
            "description": "Raw uncompressed 65-byte public key. The AI engine derives the Ethereum address via Keccak-256 and analyzes on-chain status."
        }
    ]

@app.post("/api/trace")
def trace_address(req: TraceRequest, db: Session = Depends(get_db)):
    """Performs automated multi-hop blockchain analytics on suspect wallet."""
    if not req.address or len(req.address.strip()) < 10:
        raise HTTPException(status_code=400, detail="Invalid Ethereum wallet address format.")

    try:
        analysis = blockchain_engine.analyze_address(req.address.strip(), max_depth=req.max_depth)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"On-chain analysis error: {str(e)}")

    # Persist investigation record in SQLite
    inv = Investigation(
        victim_report_id=req.victim_report_id,
        suspect_address=req.address.strip(),
        risk_score=analysis.get("risk_score", 75),
        risk_level=analysis.get("risk_level", "High"),
        total_outflow_eth=analysis.get("total_outflow_eth", 0.0),
        total_outflow_tokens=analysis.get("total_outflow_tokens", 0.0),
        hops_analyzed=analysis.get("hops_analyzed", req.max_depth),
        identified_vasps_count=len(analysis.get("detected_vasps", [])),
        graph_json=json.dumps({"nodes": analysis.get("nodes", []), "edges": analysis.get("edges", [])}),
        detected_vasps_json=json.dumps(analysis.get("detected_vasps", [])),
        summary=analysis.get("summary", "")
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    analysis["investigation_id"] = inv.id
    return analysis

@app.post("/api/reports")
def create_victim_report(report: VictimReportCreate, db: Session = Depends(get_db)):
    """Victim/LEO files a complaint regarding fraudulent cryptocurrency loss."""
    complaint_ref = f"CYBER-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"
    new_report = VictimReport(
        complaint_id=complaint_ref,
        victim_name=report.victim_name,
        victim_email=report.victim_email,
        victim_phone=report.victim_phone,
        suspect_address=report.suspect_address.strip(),
        initial_tx_hash=report.initial_tx_hash.strip() if report.initial_tx_hash else None,
        amount_lost=report.amount_lost,
        currency=report.currency or "USDT",
        scam_type=report.scam_type or "Pig Butchering",
        incident_date=report.incident_date or datetime.utcnow().strftime("%Y-%m-%d"),
        police_station=report.police_station or "Special Cyber Crime Cell",
        fir_number=report.fir_number or f"NCR/{datetime.utcnow().year}/{uuid.uuid4().hex[:4]}",
        description=report.description,
        status="Investigating"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Automatically trigger blockchain tracing for this report
    analysis = blockchain_engine.analyze_address(new_report.suspect_address, max_depth=2)
    inv = Investigation(
        victim_report_id=new_report.id,
        suspect_address=new_report.suspect_address,
        risk_score=analysis.get("risk_score", 85),
        risk_level=analysis.get("risk_level", "High"),
        total_outflow_eth=analysis.get("total_outflow_eth", 0.0),
        total_outflow_tokens=analysis.get("total_outflow_tokens", 0.0),
        hops_analyzed=2,
        identified_vasps_count=len(analysis.get("detected_vasps", [])),
        graph_json=json.dumps({"nodes": analysis.get("nodes", []), "edges": analysis.get("edges", [])}),
        detected_vasps_json=json.dumps(analysis.get("detected_vasps", [])),
        summary=analysis.get("summary", "")
    )
    db.add(inv)
    if len(analysis.get("detected_vasps", [])) > 0:
        new_report.status = "Traced to Exchange"
    db.commit()

    return {
        "report_id": new_report.id,
        "complaint_id": new_report.complaint_id,
        "status": new_report.status,
        "investigation_id": inv.id,
        "analysis": analysis
    }

@app.get("/api/reports")
def list_reports(db: Session = Depends(get_db)):
    """Lists all reported victim cases."""
    reports = db.query(VictimReport).order_by(VictimReport.created_at.desc()).all()
    return reports

@app.get("/api/reports/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(VictimReport).filter(VictimReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    investigations = db.query(Investigation).filter(Investigation.victim_report_id == report_id).all()
    inv_data = []
    for inv in investigations:
        inv_data.append({
            "id": inv.id,
            "risk_score": inv.risk_score,
            "risk_level": inv.risk_level,
            "identified_vasps_count": inv.identified_vasps_count,
            "detected_vasps": json.loads(inv.detected_vasps_json or "[]"),
            "graph": json.loads(inv.graph_json or "{}"),
            "created_at": inv.created_at
        })

    return {
        "report": report,
        "investigations": inv_data
    }

@app.post("/api/freeze-notice")
def create_freeze_notice(req: FreezeNoticeCreate, db: Session = Depends(get_db)):
    """Generates formal Section 91 CrPC legal freeze order for identified exchange."""
    notice_num = f"LE-FREEZE-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"

    # Pull real case details (victim, complaint ID, FIR) from the linked report when available
    report_id = req.victim_report_id
    if not report_id and req.investigation_id:
        linked = db.query(Investigation).filter(Investigation.id == req.investigation_id).first()
        report_id = linked.victim_report_id if linked else None
    case = db.query(VictimReport).filter(VictimReport.id == report_id).first() if report_id else None
    case_kwargs = {}
    if case:
        case_kwargs = {"victim_name": case.victim_name, "complaint_id": case.complaint_id}
        if case.fir_number:
            case_kwargs["fir_number"] = case.fir_number

    notice_text = generate_freeze_notice_text(
        notice_number=notice_num,
        exchange_name=req.exchange_name,
        suspect_address=req.suspect_address,
        deposit_hashes=req.deposit_hashes,
        total_amount=req.total_deposit_amount,
        statute=req.statute or "Section 91 Cr.P.C. / Section 79A IT Act",
        officer_name=req.officer_name or "Insp. R. K. Sharma",
        officer_designation=req.officer_designation or "Investigating Officer, Cyber Crime Division",
        police_agency=req.police_agency or "Central Cyber Crime Cell",
        **case_kwargs
    )

    notice_rec = FreezeNotice(
        notice_number=notice_num,
        investigation_id=req.investigation_id,
        victim_report_id=report_id,
        exchange_name=req.exchange_name,
        exchange_email=req.exchange_email,
        exchange_portal=req.exchange_portal,
        suspect_address=req.suspect_address,
        deposit_txs_json=json.dumps(req.deposit_hashes),
        total_deposit_amount=req.total_deposit_amount,
        statute=req.statute,
        officer_name=req.officer_name,
        officer_designation=req.officer_designation,
        police_agency=req.police_agency,
        notice_content=notice_text,
        status="Issued"
    )
    db.add(notice_rec)
    db.commit()
    db.refresh(notice_rec)

    return notice_rec

@app.get("/api/freeze-notices")
def list_freeze_notices(db: Session = Depends(get_db)):
    return db.query(FreezeNotice).order_by(FreezeNotice.created_at.desc()).all()

@app.get("/api/vasp/directory")
def get_vasp_directory(query: Optional[str] = None):
    all_v = get_all_vasps()
    if not query:
        return all_v
    q = query.lower().strip()
    return [v for v in all_v if q in v["entity_name"].lower() or q in v["address"].lower() or q in v["category"].lower()]

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total_reports = db.query(VictimReport).count()
    total_investigations = db.query(Investigation).count()
    total_notices = db.query(FreezeNotice).count()
    vasp_count = len(get_all_vasps())

    # Real figures from the database: success = investigations that identified at least one VASP
    hits = db.query(Investigation).filter(Investigation.identified_vasps_count > 0).count()
    rate = f"{hits / total_investigations * 100:.1f}%" if total_investigations else "n/a"
    return {
        "total_cases_tracked": total_reports,
        "total_investigations": total_investigations,
        "total_freeze_notices": total_notices,
        "vasp_intelligence_records": vasp_count,
        "trace_success_rate": rate,
        "avg_trace_time_sec": "10-20s (live multi-hop)"
    }
