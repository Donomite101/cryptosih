from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class VictimReport(Base):
    __tablename__ = "victim_reports"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(50), unique=True, index=True)
    victim_name = Column(String(100), nullable=False)
    victim_email = Column(String(100), nullable=True)
    victim_phone = Column(String(50), nullable=True)
    suspect_address = Column(String(64), index=True, nullable=False)
    initial_tx_hash = Column(String(80), nullable=True)
    amount_lost = Column(Float, default=0.0)
    currency = Column(String(20), default="USDT")
    scam_type = Column(String(50), default="Investment Fraud / Pig Butchering")
    incident_date = Column(String(50), nullable=True)
    police_station = Column(String(150), default="Special Cyber Crime Cell")
    fir_number = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="Reported")
    created_at = Column(DateTime, default=datetime.utcnow)

    investigations = relationship("Investigation", back_populates="victim_report")
    freeze_notices = relationship("FreezeNotice", back_populates="victim_report")


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    victim_report_id = Column(Integer, ForeignKey("victim_reports.id"), nullable=True)
    suspect_address = Column(String(64), index=True, nullable=False)
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(20), default="Medium")
    total_outflow_eth = Column(Float, default=0.0)
    total_outflow_tokens = Column(Float, default=0.0)
    hops_analyzed = Column(Integer, default=2)
    identified_vasps_count = Column(Integer, default=0)
    graph_json = Column(Text, nullable=True)
    detected_vasps_json = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    victim_report = relationship("VictimReport", back_populates="investigations")
    freeze_notices = relationship("FreezeNotice", back_populates="investigation")


class FreezeNotice(Base):
    __tablename__ = "freeze_notices"

    id = Column(Integer, primary_key=True, index=True)
    notice_number = Column(String(50), unique=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=True)
    victim_report_id = Column(Integer, ForeignKey("victim_reports.id"), nullable=True)
    exchange_name = Column(String(100), nullable=False)
    exchange_email = Column(String(150), nullable=True)
    exchange_portal = Column(String(255), nullable=True)
    suspect_address = Column(String(64), nullable=False)
    deposit_txs_json = Column(Text, nullable=True)
    total_deposit_amount = Column(String(100), nullable=True)
    statute = Column(String(100), default="Section 91 Cr.P.C. / Emergency Crypto Preservation Directive")
    officer_name = Column(String(100), default="Inspector Cyber Operations")
    officer_designation = Column(String(100), default="Investigating Officer (Cyber Crime Division)")
    police_agency = Column(String(150), default="Central Cyber Crime Investigation Agency")
    notice_content = Column(Text, nullable=False)
    status = Column(String(50), default="Issued")
    created_at = Column(DateTime, default=datetime.utcnow)

    investigation = relationship("Investigation", back_populates="freeze_notices")
    victim_report = relationship("VictimReport", back_populates="freeze_notices")


class VASPRecord(Base):
    __tablename__ = "vasp_records"

    id = Column(Integer, primary_key=True, index=True)
    address = Column(String(64), unique=True, index=True)
    entity_name = Column(String(100), nullable=False)
    category = Column(String(50), default="Exchange (CEX)")
    risk_rating = Column(String(20), default="Low")
    jurisdiction = Column(String(100), default="Global")
    le_contact_email = Column(String(150), nullable=True)
    le_portal_url = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
