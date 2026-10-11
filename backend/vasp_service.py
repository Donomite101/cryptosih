import csv
import os
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from .config import settings
from .models import VASPRecord

# In-memory dictionary for ultra-fast lookup: address.lower() -> dict
VASP_CACHE: Dict[str, Dict[str, Any]] = {}

def load_vasp_database(db: Session = None):
    """Loads VASP labels from CSV file into memory cache and SQLite database."""
    global VASP_CACHE
    csv_file = settings.VASP_LABELS_FILE
    if not os.path.exists(csv_file):
        return

    count = 0
    with open(csv_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            addr = row.get("address", "").strip().lower()
            if not addr:
                continue
            item = {
                "address": addr,
                "entity_name": row.get("entity_name", "Unknown VASP"),
                "category": row.get("category", "Exchange (CEX)"),
                "risk_rating": row.get("risk_rating", "Low"),
                "jurisdiction": row.get("jurisdiction", "Global"),
                "le_contact_email": row.get("le_contact_email", ""),
                "le_portal_url": row.get("le_portal_url", ""),
                "notes": row.get("notes", "")
            }
            VASP_CACHE[addr] = item
            count += 1

            # Sync to database if session provided
            if db:
                existing = db.query(VASPRecord).filter(VASPRecord.address == addr).first()
                if not existing:
                    rec = VASPRecord(
                        address=addr,
                        entity_name=item["entity_name"],
                        category=item["category"],
                        risk_rating=item["risk_rating"],
                        jurisdiction=item["jurisdiction"],
                        le_contact_email=item["le_contact_email"],
                        le_portal_url=item["le_portal_url"],
                        notes=item["notes"]
                    )
                    db.add(rec)
    if db:
        db.commit()

def lookup_vasp(address: str) -> Optional[Dict[str, Any]]:
    """Checks whether an address belongs to a known VASP (Exchange, Mixer, DEX, Bridge)."""
    if not address:
        return None
    normalized = address.strip().lower()
    return VASP_CACHE.get(normalized, None)

def get_all_vasps() -> List[Dict[str, Any]]:
    """Returns list of all registered VASPs."""
    return list(VASP_CACHE.values())
