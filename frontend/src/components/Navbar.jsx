import React from 'react';
import { Shield, ArrowUpRight, PlusCircle, Search, FileText, AlertTriangle, Building2 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenReportModal }) {
  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #f2f4f7',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '14px 32px',
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
      }}>
        {/* Brand Mark (matching screenshot logo mark style) */}
        <div
          onClick={() => setActiveTab('tracer')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            {/* Geometric Red Brand Icon */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="11" width="24" height="6" rx="3" fill="#ea3943" />
              <rect x="11" y="2" width="6" height="24" rx="3" fill="#ea3943" />
              <circle cx="14" cy="14" r="3" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              lineHeight: 1.1,
              color: '#09090b',
              textTransform: 'uppercase',
            }}>
              Fraud Intelligence
            </div>
            <div style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: '#ea3943',
              textTransform: 'uppercase',
            }}>
              Tech Titans
            </div>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <button
            onClick={() => setActiveTab('tracer')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'tracer' ? 700 : 500,
              color: activeTab === 'tracer' ? '#ea3943' : '#475467',
              cursor: 'pointer',
              padding: '6px 0',
              borderBottom: activeTab === 'tracer' ? '2px solid #ea3943' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            Forensic Tracer
          </button>

          <button
            onClick={() => setActiveTab('cases')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'cases' ? 700 : 500,
              color: activeTab === 'cases' ? '#ea3943' : '#475467',
              cursor: 'pointer',
              padding: '6px 0',
              borderBottom: activeTab === 'cases' ? '2px solid #ea3943' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            Victim Complaints
          </button>

          <button
            onClick={() => setActiveTab('notices')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'notices' ? 700 : 500,
              color: activeTab === 'notices' ? '#ea3943' : '#475467',
              cursor: 'pointer',
              padding: '6px 0',
              borderBottom: activeTab === 'notices' ? '2px solid #ea3943' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            Sec 91 Freeze Orders
          </button>

          <button
            onClick={() => setActiveTab('vasp')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'vasp' ? 700 : 500,
              color: activeTab === 'vasp' ? '#ea3943' : '#475467',
              cursor: 'pointer',
              padding: '6px 0',
              borderBottom: activeTab === 'vasp' ? '2px solid #ea3943' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            VASP Database
          </button>
        </nav>

        {/* Right CTA Area (matching screenshot: Documentation, Log in, Red Get Started pill) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a
            href="http://localhost:8001/docs"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '0.86rem',
              color: '#475467',
              textDecoration: 'none',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>API Docs</span>
            <ArrowUpRight size={13} />
          </a>

          <button
            className="btn-red-pill"
            onClick={onOpenReportModal}
          >
            <span>Report Incident</span>
          </button>
        </div>
      </div>
    </header>
  );
}
