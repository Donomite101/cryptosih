import React, { useState, useEffect } from 'react';
import { FileText, Eye, PlusCircle } from 'lucide-react';
import { api } from '../api';

export default function VictimCasesView({ onLoadCaseInTracer, onOpenReportModal }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = reports.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status?.toUpperCase() === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Traced to Exchange':
        return <span className="badge badge-red">TRACED TO CEX</span>;
      case 'Freeze Requested':
        return <span className="badge badge-amber">FREEZE DIRECTED</span>;
      default:
        return <span className="badge badge-blue">UNDER INVESTIGATION</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div className="clean-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={24} color="#ea3943" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#09090b' }}>
                Victim Crime Complaints & Case Management
              </h2>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '6px' }}>
              Registry of reported suspect cryptocurrency addresses with automated forensic tracking status.
            </p>
          </div>

          <button
            className="btn-red-pill"
            onClick={onOpenReportModal}
          >
            <PlusCircle size={16} />
            <span>Register New Complaint</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
          {['ALL', 'TRACED TO EXCHANGE', 'INVESTIGATING'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? '#ea3943' : '#ffffff',
                color: filter === f ? '#ffffff' : '#64748b',
                border: filter === f ? '1px solid #ea3943' : '1px solid #d0d5dd',
                padding: '6px 16px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Table */}
      <div className="clean-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #eef2f6' }}>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Complaint ID & FIR</th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Victim Complainant</th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Reported Suspect Wallet</th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Amount Stolen</th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Fraud Category</th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Loading Victim Case Registry...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  No complaint records found.
                </td>
              </tr>
            ) : (
              filtered.map((rep) => (
                <tr
                  key={rep.id}
                  style={{
                    borderBottom: '1px solid #f2f4f7',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbfc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <div className="mono" style={{ fontSize: '0.86rem', fontWeight: 700, color: '#09090b' }}>
                      {rep.complaint_id}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {rep.fir_number || 'Direct Online Report'}
                    </div>
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#09090b' }}>
                      {rep.victim_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {rep.victim_email || rep.victim_phone || 'N/A'}
                    </div>
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <div className="mono" style={{ fontSize: '0.82rem', color: '#2563eb' }}>
                      {rep.suspect_address.substring(0, 10)}...{rep.suspect_address.substring(rep.suspect_address.length - 8)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Incident: {rep.incident_date || 'Recent'}
                    </div>
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <div className="mono" style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ea3943' }}>
                      {rep.amount_lost.toLocaleString()} {rep.currency}
                    </div>
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '0.82rem', color: '#475467' }}>
                      {rep.scam_type}
                    </div>
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    {getStatusBadge(rep.status)}
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <button
                      className="btn-outline-pill"
                      onClick={() => onLoadCaseInTracer(rep.suspect_address, rep.id)}
                      style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                    >
                      <Eye size={13} color="#ea3943" />
                      <span>Trace Flow</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
