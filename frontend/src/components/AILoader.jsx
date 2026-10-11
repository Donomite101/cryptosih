import React, { useState, useEffect } from 'react';

const PHASES = [
  {
    step: 'STEP 01',
    title: 'Resolving',
    desc: 'RESOLVING ON-CHAIN IDENTITY & CRYPTOGRAPHIC PUBLIC KEY',
  },
  {
    step: 'STEP 02',
    title: 'Tracing',
    desc: 'ANALYZING LIVE MULTI-HOP OUTFLOWS & ON-CHAIN TRANSACTIONS',
  },
  {
    step: 'STEP 03',
    title: 'Attributing',
    desc: 'CROSS-MATCHING DESTINATIONS WITH VERIFIED EXCHANGE CLUSTERS',
  },
  {
    step: 'STEP 04',
    title: 'Expose',
    desc: 'SUSPECT FUND FLOW IDENTIFIED ACROSS ON-CHAIN HOPS & TRANSACTIONS',
  },
];

export default function AILoader({ targetInput }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [fadeState, setFadeState] = useState(true);

  // Smooth Apple-style phase progression
  useEffect(() => {
    const timer = setInterval(() => {
      setFadeState(false);
      setTimeout(() => {
        setPhaseIdx((prev) => (prev < PHASES.length - 1 ? prev + 1 : prev));
        setFadeState(true);
      }, 180);
    }, 800);

    return () => clearInterval(timer);
  }, []);

  const current = PHASES[phaseIdx];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes appleSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes softBreathe {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 12px 32px rgba(234, 57, 67, 0.28);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 16px 40px rgba(234, 57, 67, 0.38);
          }
        }
      `}</style>

      {/* Main Apple Minimal Circular Frame */}
      <div
        style={{
          position: 'relative',
          width: 'min(420px, 68vh)',
          height: 'min(420px, 68vh)',
          maxWidth: '86vw',
          maxHeight: '86vh',
          borderRadius: '50%',
          border: '1.2px solid #ea3943',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          boxSizing: 'border-box',
          padding: 'clamp(20px, 3.8vh, 36px)',
          textAlign: 'center',
        }}
      >
        {/* Cardinal Red Square Anchors matching exact reference image */}
        <div
          style={{
            position: 'absolute',
            top: '-3.5px',
            left: 'calc(50% - 3.5px)',
            width: '7px',
            height: '7px',
            background: '#ea3943',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-3.5px',
            left: 'calc(50% - 3.5px)',
            width: '7px',
            height: '7px',
            background: '#ea3943',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '-3.5px',
            top: 'calc(50% - 3.5px)',
            width: '7px',
            height: '7px',
            background: '#ea3943',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '-3.5px',
            top: 'calc(50% - 3.5px)',
            width: '7px',
            height: '7px',
            background: '#ea3943',
          }}
        />

        {/* Delicate, Whisper-Smooth Circular Tracer Ring */}
        <svg
          style={{
            position: 'absolute',
            inset: '-1px',
            width: 'calc(100% + 2px)',
            height: 'calc(100% + 2px)',
            pointerEvents: 'none',
            borderRadius: '50%',
            animation: 'appleSpin 3s linear infinite',
          }}
          viewBox="0 0 442 442"
        >
          <circle
            cx="221"
            cy="221"
            r="220"
            fill="none"
            stroke="url(#appleGlowGradient)"
            strokeWidth="2"
            strokeDasharray="180 1200"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="appleGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ea3943" stopOpacity="0" />
              <stop offset="100%" stopColor="#ea3943" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Step Badge at top matching screenshot */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(24px, 5vh, 42px)',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            padding: '2px 10px',
            fontSize: 'clamp(0.62rem, 1vh, 0.68rem)',
            fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
            letterSpacing: '0.14em',
            color: '#64748b',
            fontWeight: 600,
            background: '#ffffff',
            transition: 'opacity 0.2s ease',
            opacity: fadeState ? 1 : 0.4,
          }}
        >
          {current.step}
        </div>

        {/* Center Glowing Coral Dollar Icon Badge matching screenshot */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(58px, 9.5vh, 72px)',
            height: 'clamp(58px, 9.5vh, 72px)',
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #ff6b6b 0%, #ea3943 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'clamp(10px, 1.8vh, 18px)',
            animation: 'softBreathe 2.4s ease-in-out infinite',
          }}
        >
          <span
            style={{
              fontSize: 'clamp(1.7rem, 2.8vh, 2.1rem)',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1,
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Plus Jakarta Sans', sans-serif",
            }}
          >
            $
          </span>
        </div>

        {/* Big Clean Headline with smooth Apple fade */}
        <h2
          style={{
            fontSize: 'clamp(1.8rem, 3.4vh, 2.3rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#09090b',
            lineHeight: 1.1,
            margin: '0 0 clamp(6px, 1.2vh, 10px) 0',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Plus Jakarta Sans', sans-serif",
            transition: 'opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: fadeState ? 1 : 0,
            transform: fadeState ? 'translateY(0)' : 'translateY(4px)',
          }}
        >
          {current.title}
        </h2>

        {/* Technical Description in Monospace uppercase matching screenshot */}
        <div
          style={{
            fontSize: 'clamp(0.6rem, 1vh, 0.68rem)',
            lineHeight: 1.45,
            color: '#64748b',
            letterSpacing: '0.05em',
            maxWidth: 'min(280px, 75%)',
            margin: '0 auto',
            fontWeight: 500,
            textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
            transition: 'opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: fadeState ? 1 : 0,
          }}
        >
          {current.desc}
        </div>
      </div>
    </div>
  );
}
