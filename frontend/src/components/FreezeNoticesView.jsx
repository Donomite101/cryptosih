import React, { useState, useEffect } from 'react';
import { AlertTriangle, Printer, Check, Copy, ShieldAlert } from 'lucide-react';
import { api } from '../api';

export default function FreezeNoticesView() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const data = await api.getFreezeNotices();
      setNotices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="clean-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={24} color="#ea3943" />
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#09090b' }}>
              Statutory Asset Freeze & Preservation Directives
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '6px' }}>
              Official registry of legal notices dispatched to exchange compliance divisions under Section 91 Cr.P.C. / IT Act.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedNotice ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* Table */}
        <div className="clean-card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #eef2f6' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Notice Ref</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Target Exchange</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Identified Deposit</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Issuing Officer</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    Loading Freeze Notice Registry...
                  </td>
                </tr>
              ) : notices.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    No statutory freeze notices issued yet. Run a trace to generate directives.
                  </td>
                </tr>
              ) : (
                notices.map((n) => (
                  <tr
                    key={n.id}
                    style={{
                      borderBottom: '1px solid #f2f4f7',
                      background: selectedNotice?.id === n.id ? '#fef2f2' : 'transparent',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedNotice(n)}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div className="mono" style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ea3943' }}>
                        {n.notice_number}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {new Date(n.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#09090b' }}>
                        {n.exchange_name}
                      </div>
                      <div className="mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {n.exchange_email || 'Nodal Desk'}
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <div className="mono" style={{ fontSize: '0.92rem', fontWeight: 800, color: '#09090b' }}>
                        {n.total_deposit_amount}
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 600 }}>
                        {n.officer_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {n.police_agency}
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <button
                        className="btn-outline-pill"
                        onClick={(e) => { e.stopPropagation(); setSelectedNotice(n); }}
                        style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                      >
                        <span>View Directive</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Notice Inspector */}
        {selectedNotice && (
          <div className="clean-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} color="#ea3943" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#09090b' }}>
                  Directive: {selectedNotice.notice_number}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn-outline-pill"
                  onClick={() => copyText(selectedNotice.notice_content)}
                  style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                >
                  {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  className="btn-outline-pill"
                  onClick={() => window.print()}
                  style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
              </div>
            </div>

            <pre
              className="mono"
              style={{
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '18px',
                color: '#f4f4f5',
                fontSize: '0.78rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                maxHeight: '440px',
                overflowY: 'auto',
              }}
            >
              {selectedNotice.notice_content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
