import React from 'react';
import { ShieldAlert, TrendingUp, Layers, Zap, Cpu, CheckCircle2, Key } from 'lucide-react';

export default function RiskDial({
  riskScore = 50,
  riskLevel = "Medium",
  detectedVasps = [],
  edges = [],
  aiConfidence = 94.5,
  aiPatterns = [],
  inputType = "ETHEREUM_ADDRESS",
  publicKey = null,
}) {
  const score = Math.min(Math.max(riskScore, 0), 100);

  let strokeColor = '#059669';
  let badgeClass = 'badge-emerald';
  if (score >= 85) {
    strokeColor = '#ea3943';
    badgeClass = 'badge-red';
  } else if (score >= 65) {
    strokeColor = '#d97706';
    badgeClass = 'badge-amber';
  } else if (score >= 40) {
    strokeColor = '#2563eb';
    badgeClass = 'badge-blue';
  }

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const hasMixer = detectedVasps.some((v) => v.category?.toLowerCase().includes('mixer'));
  const hasExchange = detectedVasps.some((v) => v.category?.toLowerCase().includes('exchange') || v.category?.toLowerCase().includes('cex'));
  const hasPeeling = edges.length > 2;

  return (
    <div className="clean-card" style={{ padding: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} color="#ea3943" />
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#09090b' }}>
            AI Heuristic Fraud Model Assessment
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {inputType === 'CRYPTOGRAPHIC_PUBLIC_KEY' && (
            <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Key size={11} />
              <span>PUBKEY DERIVED</span>
            </span>
          )}
          <span className={`badge ${badgeClass}`}>
            {riskLevel.toUpperCase()} THREAT
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {/* Radial Score Gauge */}
        <div style={{ position: 'relative', width: '124px', height: '124px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="124" height="124" viewBox="0 0 124 124" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="62"
              cy="62"
              r={radius}
              stroke="#f1f5f9"
              strokeWidth="9"
              fill="transparent"
            />
            <circle
              cx="62"
              cy="62"
              r={radius}
              stroke={strokeColor}
              strokeWidth="9"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.8s ease-in-out',
              }}
            />
          </svg>

          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#09090b', lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              AI Risk Index
            </div>
          </div>
        </div>

        {/* Feature Indicators */}
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #eef2f6',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#334155' }}>
              <TrendingUp size={15} color="#2563eb" />
              <span>VASP Off-Ramp Proximity</span>
            </div>
            <span className={`badge ${hasExchange ? 'badge-red' : 'badge-blue'}`}>
              {hasExchange ? 'IDENTIFIED CEX' : 'SEARCHING'}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #eef2f6',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#334155' }}>
              <Layers size={15} color="#d97706" />
              <span>Peeling Chain Dispersion</span>
            </div>
            <span className={`badge ${hasPeeling ? 'badge-amber' : 'badge-emerald'}`}>
              {hasPeeling ? 'DETECTED' : 'NORMAL'}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #eef2f6',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#334155' }}>
              <Zap size={15} color="#9333ea" />
              <span>Mixer / Privacy Hop</span>
            </div>
            <span className={`badge ${hasMixer ? 'badge-red' : 'badge-emerald'}`}>
              {hasMixer ? 'OFAC ALERT' : 'NEGATIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Discovered On-Chain Patterns */}
      {aiPatterns && aiPatterns.length > 0 && (
        <div style={{ borderTop: '1px solid #f2f4f7', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            AI Explainability & Pattern Signatures:
          </div>
          {aiPatterns.map((pat, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.78rem', color: '#334155' }}>
              <CheckCircle2 size={13} color="#ea3943" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>{pat}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
