import React, { useState, useEffect } from 'react';
import { Building2, Search, ExternalLink, Copy, Check, Globe } from 'lucide-react';
import { api } from '../api';

export default function VaspDirectoryView() {
  const [vasps, setVasps] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(null);

  useEffect(() => {
    loadDirectory();
  }, [query]);

  const loadDirectory = async () => {
    setLoading(true);
    try {
      const data = await api.getVaspDirectory(query);
      setVasps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getRiskBadge = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'severe':
        return <span className="badge badge-red">SEVERE RISK</span>;
      case 'high':
        return <span className="badge badge-amber">HIGH RISK</span>;
      case 'medium':
        return <span className="badge badge-blue">MEDIUM RISK</span>;
      default:
        return <span className="badge badge-emerald">COMPLIANT VASP</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Search */}
      <div className="clean-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={24} color="#ea3943" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#09090b' }}>
                Known VASP & Exchange Intelligence Directory
              </h2>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '6px' }}>
              Curated repository of registered Virtual Asset Service Providers, exchange hot wallets, and mixers for immediate identification.
            </p>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '9999px',
            padding: '8px 18px',
            fontSize: '0.82rem',
            color: '#344054',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
          }}>
            <Globe size={16} color="#ea3943" />
            <span>{vasps.length} Verified Entity Hot Wallets</span>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={18} color="#64748b" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by Exchange name (Binance, Bybit...), Ethereum address (0x...), or Category (CEX, Mixer)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1px solid #d0d5dd',
              borderRadius: '9999px',
              padding: '12px 18px 12px 46px',
              color: '#09090b',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Directory Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '20px',
      }}>
        {loading ? (
          <div style={{ color: '#64748b', padding: '32px', gridColumn: '1 / -1', textAlign: 'center' }}>
            Searching VASP Intelligence Database...
          </div>
        ) : vasps.length === 0 ? (
          <div style={{ color: '#64748b', padding: '32px', gridColumn: '1 / -1', textAlign: 'center' }}>
            No VASP records matched your query.
          </div>
        ) : (
          vasps.map((v) => (
            <div key={v.address} className="clean-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#09090b' }}>
                      {v.entity_name}
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {v.category} • {v.jurisdiction}
                    </span>
                  </div>
                  {getRiskBadge(v.risk_rating)}
                </div>

                <div style={{
                  background: '#f8fafc',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #eef2f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  margin: '12px 0',
                }}>
                  <span className="mono" style={{ fontSize: '0.78rem', color: '#334155' }}>
                    {v.address.substring(0, 10)}...{v.address.substring(v.address.length - 8)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => copyAddress(v.address)}
                      style={{ background: 'none', border: 'none', color: copiedAddress === v.address ? '#059669' : '#64748b', cursor: 'pointer' }}
                      title="Copy Address"
                    >
                      {copiedAddress === v.address ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <a
                      href={`https://etherscan.io/address/${v.address}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#2563eb' }}
                      title="View on Etherscan"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                {v.notes && (
                  <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px' }}>
                    {v.notes}
                  </p>
                )}
              </div>

              <div style={{ borderTop: '1px solid #f2f4f7', paddingTop: '12px', fontSize: '0.78rem', color: '#64748b' }}>
                <div>
                  <strong style={{ color: '#334155' }}>LE Nodal Email:</strong>{' '}
                  <span className="mono" style={{ color: '#2563eb' }}>{v.le_contact_email || 'N/A'}</span>
                </div>
                {v.le_portal_url && v.le_portal_url !== 'N/A' && (
                  <div style={{ marginTop: '4px' }}>
                    <a href={v.le_portal_url} target="_blank" rel="noreferrer" style={{ color: '#ea3943', textDecoration: 'underline', fontWeight: 600 }}>
                      Official Law Enforcement Portal
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
