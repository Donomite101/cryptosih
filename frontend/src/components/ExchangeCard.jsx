import React from 'react';
import { ExternalLink, FileText } from 'lucide-react';

export default function ExchangeCard({ vasp, txUrlBase, onCreateFreeze }) {
  const isMixer = vasp.category?.toLowerCase().includes('mixer');
  const hasContact = vasp.le_contact_email && vasp.le_contact_email !== 'N/A';
  const hasPortal = vasp.le_portal_url && vasp.le_portal_url !== 'N/A';

  return (
    <div className="clean-card simple-card" style={{ borderTop: `3px solid ${isMixer ? '#9333ea' : '#2563eb'}` }}>
      <div className="row-between">
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{vasp.entity_name}</h4>
        <span className={`badge ${isMixer ? 'badge-purple' : 'badge-blue'}`}>{isMixer ? 'Privacy mixer' : 'Exchange'}</span>
      </div>

      <p className="muted" style={{ margin: '10px 0' }}>
        Received <strong style={{ color: '#09090b' }}>{vasp.total_deposited}</strong> from this trail
        {vasp.hop_distance > 1 ? ` (${vasp.hop_distance} steps after the suspect)` : ' directly from the suspect'}.
        <br />Last deposit: {vasp.last_deposit_time}
      </p>

      <div className="muted" style={{ fontSize: '0.82rem', marginBottom: '12px' }}>
        <div>
          <strong style={{ color: '#334155' }}>Contact police desk: </strong>
          {hasContact ? <span className="mono">{vasp.le_contact_email}</span> : 'not in our list (search the exchange\'s law-enforcement page)'}
        </div>
        {hasPortal && (
          <div>
            <a href={vasp.le_portal_url} target="_blank" rel="noreferrer">Open their law-enforcement request page</a>
          </div>
        )}
        <div style={{ marginTop: '6px' }}>
          Proof:{' '}
          {(vasp.deposit_hashes || []).slice(0, 3).map((h, i) => (
            <a key={h} href={`${txUrlBase}${h}`} target="_blank" rel="noreferrer" style={{ marginRight: '8px' }}>
              transaction {i + 1} <ExternalLink size={11} style={{ verticalAlign: '-1px' }} />
            </a>
          ))}
          {(vasp.deposit_hashes || []).length > 3 && <span>+{vasp.deposit_hashes.length - 3} more</span>}
        </div>
      </div>

      {!isMixer && (
        <button className="btn-red-pill" onClick={() => onCreateFreeze(vasp)} style={{ width: '100%' }}>
          <FileText size={16} />
          <span>Create freeze request letter</span>
        </button>
      )}
    </div>
  );
}
