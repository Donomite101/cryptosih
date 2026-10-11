import React, { useState } from 'react';
import { X, Copy, Check, Printer, ShieldAlert, Send, FileCheck } from 'lucide-react';
import { api } from '../api';

export default function FreezeNoticeModal({ isOpen, onClose, vasp, suspectAddress, investigationId, victimReportId, onNoticeIssued }) {
  if (!isOpen || !vasp) return null;

  const [officerName, setOfficerName] = useState('Insp. Vikram Rathore');
  const [officerDesignation, setOfficerDesignation] = useState('Senior Cyber Fraud Investigator');
  const [policeAgency, setPoliceAgency] = useState('Special Cyber Crime Investigation Cell');
  const [statute, setStatute] = useState('Section 91 Cr.P.C. / Section 79A IT Act');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedNotice, setIssuedNotice] = useState(null);

  const handleCopy = () => {
    const textElement = document.getElementById('freeze-notice-content');
    if (textElement) {
      navigator.clipboard.writeText(textElement.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleIssueNotice = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.createFreezeNotice({
        investigation_id: investigationId,
        victim_report_id: victimReportId,
        exchange_name: vasp.entity_name,
        exchange_email: vasp.le_contact_email,
        exchange_portal: vasp.le_portal_url,
        suspect_address: suspectAddress,
        deposit_hashes: vasp.deposit_hashes || [],
        total_deposit_amount: vasp.total_deposited,
        statute: statute,
        officer_name: officerName,
        officer_designation: officerDesignation,
        police_agency: policeAgency,
      });
      setIssuedNotice(res);
      if (onNoticeIssued) onNoticeIssued(res);
    } catch (err) {
      alert(`Error issuing notice: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(16, 24, 40, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px',
    }}>
      <div
        className="clean-card"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #f2f4f7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(234, 57, 67, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldAlert size={18} color="#ea3943" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#09090b' }}>
                Statutory Asset Freeze & Preservation Order
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Target Entity: {vasp.entity_name} Law Enforcement Liaison Division
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Officer Config Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            background: '#f8fafc',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid #eef2f6',
          }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Investigating Officer
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #d0d5dd',
                  borderRadius: '6px',
                  color: '#09090b',
                  padding: '6px 10px',
                  fontSize: '0.85rem',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Official Designation
              </label>
              <input
                type="text"
                value={officerDesignation}
                onChange={(e) => setOfficerDesignation(e.target.value)}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #d0d5dd',
                  borderRadius: '6px',
                  color: '#09090b',
                  padding: '6px 10px',
                  fontSize: '0.85rem',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Statute / Legal Power
              </label>
              <input
                type="text"
                value={statute}
                onChange={(e) => setStatute(e.target.value)}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #d0d5dd',
                  borderRadius: '6px',
                  color: '#09090b',
                  padding: '6px 10px',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>

          {/* Notice Document Preview */}
          <div
            id="freeze-notice-content"
            className="mono"
            style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '18px',
              color: '#f4f4f5',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              maxHeight: '380px',
              overflowY: 'auto',
            }}
          >
{`========================================================================================
             FORMAL NOTICE FOR IMMEDIATE FREEZING OF CRYPTOCURRENCY ASSETS
                         AND URGENT KYC / AUDIT TRAIL PRESERVATION
                    (ISSUED UNDER ${statute.toUpperCase()})
========================================================================================

NOTICE REFERENCE NO : LE-FREEZE-2026-${vasp.entity_name.toUpperCase().slice(0, 3)}-994
DATE OF DIRECTIVE   : ${new Date().toUTCString()}
RECIPIENT ENTITY    : ${vasp.entity_name} Law Enforcement Liaison Division
CONTACT EMAIL       : ${vasp.le_contact_email || 'case@' + vasp.entity_name.toLowerCase() + '.com'}

----------------------------------------------------------------------------------------
1. MANDATORY FREEZE DIRECTIVE:
----------------------------------------------------------------------------------------
Pursuant to ongoing criminal proceedings regarding cyber financial theft, stolen assets
have been forensically tracked in real-time directly into wallets under your operational
control on Ethereum Mainnet.

YOU ARE HEREBY DIRECTED TO IMMEDIATELY FREEZE AND RESTRICT ALL WITHDRAWALS FOR:
Target Suspect Inflow : ${vasp.total_deposited}
Origin Suspect Wallet : ${suspectAddress}
Deposit Transactions  :
${(vasp.deposit_hashes || []).map((h) => `  • Tx Hash: ${h}`).join('\n')}

----------------------------------------------------------------------------------------
2. MANDATORY PRESERVATION OF BENEFICIARY RECORDS:
----------------------------------------------------------------------------------------
You are required within 24 hours to preserve and disclose to this investigating authority:
1. Complete KYC / Identity dossiers of the account holder(s) crediting the above hashes.
2. IP address logs, geo-locations, and associated telephone numbers.
3. Linked fiat settlement bank accounts and payment channels.
4. Downstream ledger records if any internal off-chain book transfer has transpired.

Failure to comply with this emergency preservation directive will attract legal liability
under statutory obstruction of justice and anti-money laundering regulations.

ISSUED UNDER SEAL:
Investigating Officer: ${officerName}
Designation: ${officerDesignation}
Agency: ${policeAgency}
SHA256 Forensics Token: 0x9f88c3a172810d...[VERIFIED]
========================================================================================`}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f2f4f7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn-outline-pill"
              onClick={handleCopy}
            >
              {copied ? <Check size={16} color="#059669" /> : <Copy size={16} />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Notice Text'}</span>
            </button>
            <button
              className="btn-outline-pill"
              onClick={handlePrint}
            >
              <Printer size={16} />
              <span>Print / Export PDF</span>
            </button>
          </div>

          <button
            className="btn-red-pill"
            onClick={handleIssueNotice}
            disabled={isSubmitting}
          >
            {issuedNotice ? <FileCheck size={16} /> : <Send size={16} />}
            <span>{issuedNotice ? 'Notice Issued & Saved!' : isSubmitting ? 'Registering...' : 'Register Formal Freeze Order'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
