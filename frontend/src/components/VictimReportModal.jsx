import React, { useState } from 'react';
import { X, ShieldAlert, Zap } from 'lucide-react';
import { api } from '../api';

export default function VictimReportModal({ isOpen, onClose, onReportCreated }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    victim_name: '',
    victim_email: '',
    victim_phone: '',
    suspect_address: '',
    initial_tx_hash: '',
    amount_lost: '',
    currency: 'USDT',
    scam_type: 'Investment Fraud / Pig Butchering',
    incident_date: new Date().toISOString().slice(0, 10),
    police_station: 'Cyber Crime Police Station, Headquarters',
    fir_number: '',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.victim_name || !formData.suspect_address || !formData.amount_lost) {
      setError('Please fill in Victim Name, Suspect Wallet Address, and Amount Lost.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.createVictimReport({
        ...formData,
        amount_lost: parseFloat(formData.amount_lost),
      });
      if (onReportCreated) {
        onReportCreated(res);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to file report');
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
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Header */}
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
                Victim Crime Intake & Address Registration
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Automated on-chain forensic tracing is initiated upon registration
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#344054', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Victim / Complainant Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kulkarni"
                value={formData.victim_name}
                onChange={(e) => setFormData({ ...formData, victim_name: e.target.value })}
                required
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #d0d5dd',
                  borderRadius: '8px',
                  color: '#09090b',
                  padding: '9px 12px',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#344054', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Victim Email / Phone
              </label>
              <input
                type="text"
                placeholder="e.g. victim@example.com"
                value={formData.victim_email}
                onChange={(e) => setFormData({ ...formData, victim_email: e.target.value })}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #d0d5dd',
                  borderRadius: '8px',
                  color: '#09090b',
                  padding: '9px 12px',
                  fontSize: '0.88rem',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: '#344054', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Reported Suspect Wallet Address (Ethereum Mainnet) *
            </label>
            <input
              type="text"
              placeholder="0x..."
              className="mono"
              value={formData.suspect_address}
              onChange={(e) => setFormData({ ...formData, suspect_address: e.target.value })}
              required
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #d0d5dd',
                borderRadius: '8px',
                color: '#2563eb',
                padding: '9px 12px',
                fontSize: '0.88rem',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#344054', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Stolen / Defrauded Amount *
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 50000"
                value={formData.amount_lost}
                onChange={(e) => setFormData({ ...formData, amount_lost: e.target.value })}
                required
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #d0d5dd',
                  borderRadius: '8px',
                  color: '#09090b',
                  padding: '9px 12px',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#344054', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #d0d5dd',
                  borderRadius: '8px',
                  color: '#09090b',
                  padding: '9px 12px',
                  fontSize: '0.88rem',
                }}
              >
                <option value="USDT">USDT (Tether)</option>
                <option value="USDC">USDC (USD Coin)</option>
                <option value="ETH">ETH (Ethereum)</option>
                <option value="DAI">DAI</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#344054', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Scam Classification
              </label>
              <select
                value={formData.scam_type}
                onChange={(e) => setFormData({ ...formData, scam_type: e.target.value })}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #d0d5dd',
                  borderRadius: '8px',
                  color: '#09090b',
                  padding: '9px 12px',
                  fontSize: '0.88rem',
                }}
              >
                <option value="Investment Fraud / Pig Butchering">Investment Fraud / Pig Butchering</option>
                <option value="Phishing Drainer / Permit2 Exploit">Phishing Drainer / Permit2 Exploit</option>
                <option value="Fake ICO / Token Presale">Fake ICO / Token Presale</option>
                <option value="Ransomware Extortion">Ransomware Extortion</option>
                <option value="Job Scam / Task Fraud">Job Scam / Task Fraud</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#344054', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Incident Date
              </label>
              <input
                type="date"
                value={formData.incident_date}
                onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #d0d5dd',
                  borderRadius: '8px',
                  color: '#09090b',
                  padding: '9px 12px',
                  fontSize: '0.88rem',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: '#344054', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Incident Summary & Context
            </label>
            <textarea
              rows="3"
              placeholder="Provide context regarding how victim was lured, communications, and fraudulent promises..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #d0d5dd',
                borderRadius: '8px',
                color: '#09090b',
                padding: '9px 12px',
                fontSize: '0.88rem',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Submit Button */}
          <div style={{ marginTop: '8px' }}>
            <button
              type="submit"
              className="btn-red-pill"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem',
              }}
            >
              <Zap size={18} />
              <span>{isSubmitting ? 'Registering & Running Live AI Trace...' : 'Register Complaint & Run Automated Trace'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
