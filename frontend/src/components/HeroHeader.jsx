import React, { useState } from 'react';
import { Mic, ArrowRight, RefreshCw } from 'lucide-react';

export default function HeroHeader({ searchAddress, setSearchAddress, onSubmit, loading }) {
  const [activeMode, setActiveMode] = useState('trace'); // 'search' or 'trace'

  return (
    <section style={{
      textAlign: 'center',
      padding: 'clamp(20px, 4vh, 44px) 16px clamp(16px, 2.8vh, 28px) 16px',
      maxWidth: '960px',
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxSizing: 'border-box',
    }}>
      {/* Group Brand Name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'clamp(8px, 1.6vh, 16px)',
      }}>
        <span style={{
          fontSize: 'clamp(1.25rem, 2.5vw, 1.8rem)',
          fontWeight: 900,
          color: '#ea3943',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          lineHeight: 1.2,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}>
          TECH TITANS
        </span>
      </div>

      {/* Main Bold Display Headline matching screenshot */}
      <h1 style={{
        fontSize: 'clamp(2.1rem, 4.4vw, 3.8rem)',
        fontWeight: 800,
        lineHeight: 1.1,
        letterSpacing: '-0.035em',
        color: '#09090b',
        marginBottom: 'clamp(44px, 6vh, 64px)',
        maxWidth: '800px',
      }}>
        Fraud Prevention<br />
        <span style={{ color: '#09090b' }}>Reinvented</span>
      </h1>

      {/* Perfectly Centered & Responsive Search Container */}
      <div style={{
        width: '100%',
        maxWidth: 'min(680px, 94vw)',
        margin: '0 auto clamp(24px, 3.5vh, 36px) auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxSizing: 'border-box',
      }}>
        {/* Top Right Floating Tabs matching user screenshot */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '-6px',
          paddingRight: '16px',
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#e5e7eb',
            borderRadius: '12px 12px 0 0',
            padding: '3px 4px',
            gap: '2px',
          }}>
            <button
              type="button"
              onClick={() => setActiveMode('search')}
              style={{
                background: activeMode === 'search' ? '#ffffff' : 'transparent',
                color: activeMode === 'search' ? '#111827' : '#4b5563',
                border: 'none',
                borderRadius: '8px',
                padding: '5px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('trace')}
              style={{
                background: activeMode === 'trace' ? 'linear-gradient(135deg, #ff5e62, #ff9966)' : 'transparent',
                color: activeMode === 'trace' ? '#ffffff' : '#4b5563',
                border: 'none',
                borderRadius: '8px',
                padding: '5px 16px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activeMode === 'trace' ? '0 2px 8px rgba(255, 94, 98, 0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              AI Trace
            </button>
          </div>
        </div>

        {/* Main Floating Search Pill matching user screenshot */}
        <form
          onSubmit={onSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '20px',
            padding: '12px 16px',
            boxShadow: '0 10px 32px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            position: 'relative',
            zIndex: 1,
            width: '100%',
            boxSizing: 'border-box',
            gap: '12px',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#ff5e62';
            e.currentTarget.style.boxShadow = '0 12px 36px rgba(255, 94, 98, 0.18)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = '0 10px 32px -4px rgba(0, 0, 0, 0.08)';
          }}
        >
          {/* Search Input - Fully Fluid & Responsive */}
          <input
            type="text"
            placeholder="Paste suspect wallet address (0x... or T...) or a transaction ID"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            className="mono"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              color: '#111827',
              fontSize: 'clamp(0.82rem, 2vw, 0.92rem)',
              minWidth: 0,
              width: '100%',
            }}
          />

          {/* Right Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #ff5e62, #ff9966)',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(255, 94, 98, 0.35)',
                transition: 'transform 0.15s ease',
              }}
              title="Run AI Trace"
            >
              {loading ? <RefreshCw size={14} className="pulsing-dot" /> : <ArrowRight size={16} />}
            </button>
            <Mic size={19} color="#9ca3af" style={{ flexShrink: 0, cursor: 'pointer' }} />
          </div>
        </form>
      </div>
    </section>
  );
}
