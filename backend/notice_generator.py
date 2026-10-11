from datetime import datetime
from typing import Dict, Any, List

def generate_freeze_notice_text(
    notice_number: str,
    exchange_name: str,
    suspect_address: str,
    deposit_hashes: List[str],
    total_amount: str,
    victim_name: str = "[complainant name - to be filled by officer]",
    complaint_id: str = "[complaint ID - to be filled by officer]",
    fir_number: str = "[FIR number - to be filled by officer]",
    officer_name: str = "Insp. R. K. Sharma",
    officer_designation: str = "Investigating Officer, Cyber Crime Division",
    police_agency: str = "Special Cyber Crime Investigation Cell",
    statute: str = "Section 91 Cr.P.C. / Section 79A Information Technology Act"
) -> str:
    """Generates formal legal notice for immediate asset freeze and KYC disclosure."""
    today_str = datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")
    hashes_formatted = "\n".join([f"    • Tx Hash: {h}" for h in deposit_hashes])

    notice = f"""
========================================================================================
             FORMAL NOTICE FOR IMMEDIATE FREEZING OF CRYPTOCURRENCY ASSETS
                         AND URGENT KYC / AUDIT TRAIL PRESERVATION
                    (ISSUED UNDER {statute.upper()})
========================================================================================

NOTICE REFERENCE NO : {notice_number}
DATE & TIME OF ISSUE: {today_str}
CRIME CASE / FIR NO : {fir_number}
CYBER COMPLAINT ID  : {complaint_id}

TO:
The Compliance Officer / Head of Global Law Enforcement Liaison
Entity Name: {exchange_name}
Subject: Emergency Request to Freeze Suspect Cryptocurrency Inflows & Provide Associated Account Identifiers

----------------------------------------------------------------------------------------
1. BACKGROUND & NATURE OF OFFENCE:
----------------------------------------------------------------------------------------
This Law Enforcement Agency is investigating an active cyber-enabled financial fraud / 
money laundering case initiated pursuant to a complaint filed by {victim_name}.
Through automated forensic blockchain tracing, stolen funds originated from victim transactions 
and routed through intermediary suspect mule addresses have been confirmed to be directly 
deposited into wallets controlled or hosted by your exchange platform ({exchange_name}).

----------------------------------------------------------------------------------------
2. FORENSIC TRANSACTION TRAIL & IDENTIFIED INFLOWS:
----------------------------------------------------------------------------------------
Primary Suspect Wallet Address (Origin):
{suspect_address}

Total Illicit Funds Deposited to {exchange_name}:
{total_amount}

Deposit Transaction Identifiers (on-chain proof):
{hashes_formatted}

----------------------------------------------------------------------------------------
3. STATUTORY DIRECTIVES & MANDATORY ACTIONS:
----------------------------------------------------------------------------------------
Under the statutory powers vested under {statute}, you are hereby directed to 
COMPLY IMMEDIATELY with the following urgent measures:

1. IMMEDIATE FREEZE (WITHIN 60 MINUTES):
   Freeze and restrict all withdrawal capabilities on the recipient account(s), internal 
   UIDs, and deposit addresses associated with the above transaction hashes to prevent 
   dissipation of stolen cyber-proceeds.

2. PRESERVATION OF RECORDS & KYC DATA:
   Preserve and provide the complete Know-Your-Customer (KYC) identity documentation, 
   including government-issued IDs, registered email address, phone number, login IP access 
   logs, linked bank accounts, and fiat withdrawal destination details for the beneficiary.

3. AUDIT TRAIL OF DISSIPATED ASSETS:
   If any portion of the aforementioned funds has already undergone spot trading, conversion, 
   or downstream withdrawal, provide the complete ledger history, destination blockchain 
   addresses, or internal sub-account transfer logs.

----------------------------------------------------------------------------------------
4. COMPLIANCE TIMELINE:
----------------------------------------------------------------------------------------
Please confirm receipt and execution of the interim asset freeze within two (2) hours of 
receipt of this directive via encrypted reply or through your official Law Enforcement 
Request Portal.

ISSUED BY:
Name: {officer_name}
Designation: {officer_designation}
Agency: {police_agency}
Official Seal & Cryptographic Evidentiary Verification Hash: 
SHA256: [VERIFIED_FORENSIC_CHAIN_{notice_number}]
========================================================================================
"""
    return notice.strip()
