import React, { useState } from 'react';
import { Building2, ExternalLink, Copy, Check, ShieldAlert } from 'lucide-react';

export default function VaspCard({ vasp, onGenerateFreezeNotice }) {
  const [copiedHash, setCopiedHash] = useState(null);

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const isMixer = vasp.category?.toLowerCase().includes('mixer');

  return (
    <div
      className="clean-card"
      style={{
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderTop: isMixer ? '3px solid #9333ea' : '3px solid #ea3943',
      }}
    >
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} color={isMixer ? '#9333ea' : '#ea3943'} />
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#09090b' }}>
                {vasp.entity_name}
              </h4>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {vasp.category} • Hop Distance: {vasp.hop_distance || 2}
            </span>
          </div>

          <span className={`badge ${isMixer ? 'badge-red' : 'badge-blue'}`}>
            {isMixer ? 'SEVERE SANCTION' : 'IDENTIFIED CEX'}
          </span>
        </div>

        {/* Deposit Summary Box */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '12px 16px',
          border: '1px solid #eef2f6',
          marginBottom: '14px',
        }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Confirmed Inflow Deposit
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#09090b', margin: '3px 0' }} className="mono">
            {vasp.total_deposited}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Last Deposit: {vasp.last_deposit_time || 'Recent Transaction'}
          </div>
        </div>

        {/* Deposit Hashes */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '0.75rem', color: '#475467', marginBottom: '6px', fontWeight: 600 }}>
            Forensic Deposit Transaction Identifiers:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(vasp.deposit_hashes || []).map((hash) => (
              <div
                key={hash}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.78rem',
                }}
              >
                <span className="mono" style={{ color: '#334155' }}>
                  {hash.substring(0, 14)}...{hash.substring(hash.length - 8)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => copyHash(hash)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedHash === hash ? '#059669' : '#64748b',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                    title="Copy Tx Hash"
                  >
                    {copiedHash === hash ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <a
                    href={`https://etherscan.io/tx/${hash}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'none' }}
                    title="View on Etherscan"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Law Enforcement Contact Info */}
        <div style={{
          fontSize: '0.78rem',
          color: '#64748b',
          marginBottom: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <div>
            <strong style={{ color: '#334155' }}>LE Compliance Email:</strong>{' '}
            <span className="mono" style={{ color: '#2563eb' }}>{vasp.le_contact_email || 'case@exchange.com'}</span>
          </div>
          {vasp.le_portal_url && vasp.le_portal_url !== 'N/A' && (
            <div>
              <strong style={{ color: '#334155' }}>Law Enforcement Portal:</strong>{' '}
              <a
                href={vasp.le_portal_url}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#ea3943', textDecoration: 'underline', fontWeight: 600 }}
              >
                Open Official LE Portal
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        className="btn-red-pill"
        onClick={() => onGenerateFreezeNotice(vasp)}
        style={{ width: '100%' }}
      >
        <ShieldAlert size={16} />
        <span>Generate Sec 91 CrPC Freeze Order</span>
      </button>
    </div>
  );
}
