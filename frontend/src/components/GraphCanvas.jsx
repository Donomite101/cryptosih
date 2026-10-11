import React, { useState, useMemo } from 'react';
import { ExternalLink, Copy, Check, RefreshCw } from 'lucide-react';

const MAX_UNKNOWN_PER_HOP = 5;

export default function GraphCanvas({ nodes: allNodes = [], edges: allEdges = [], onSelectNode, selectedNodeId }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Keep the picture readable: always show the suspect and every identified entity,
  // but only the largest unknown wallets per step. Everything is still listed in the tables.
  const { nodes, edges, hiddenCount } = useMemo(() => {
    const received = {};
    allEdges.forEach((e) => {
      const k = e.target.toLowerCase();
      received[k] = (received[k] || 0) + (e.amount ?? 0);
    });
    const keep = new Set();
    const unknownByHop = {};
    allNodes.forEach((n) => {
      if (n.type !== 'MULE' || n.type === 'SUSPECT') keep.add(n.id.toLowerCase());
      else (unknownByHop[n.hop_level] = unknownByHop[n.hop_level] || []).push(n);
    });
    Object.values(unknownByHop).forEach((list) => {
      list
        .sort((a, b) => (received[b.id.toLowerCase()] || 0) - (received[a.id.toLowerCase()] || 0))
        .slice(0, MAX_UNKNOWN_PER_HOP)
        .forEach((n) => keep.add(n.id.toLowerCase()));
    });
    const vn = allNodes.filter((n) => keep.has(n.id.toLowerCase()));
    const ve = allEdges.filter((e) => keep.has(e.source.toLowerCase()) && keep.has(e.target.toLowerCase()));
    return { nodes: vn, edges: ve, hiddenCount: allNodes.length - vn.length };
  }, [allNodes, allEdges]);

  // Group nodes by hop level for crisp multi-hop layout
  const layoutNodes = useMemo(() => {
    if (!nodes || nodes.length === 0) return [];

    const hops = {};
    nodes.forEach((n) => {
      const hop = n.hop_level || 0;
      if (!hops[hop]) hops[hop] = [];
      hops[hop].push(n);
    });

    const maxHop = Math.max(...Object.keys(hops).map(Number), 0);
    const canvasWidth = 920;
    const canvasHeight = 440;

    const positioned = [];
    Object.keys(hops).forEach((hopStr) => {
      const hop = Number(hopStr);
      const hopNodes = hops[hop];
      const count = hopNodes.length;

      const x = maxHop === 0 ? canvasWidth / 2 : 130 + (hop / Math.max(maxHop, 1)) * (canvasWidth - 280);

      hopNodes.forEach((node, idx) => {
        const y = canvasHeight / 2 + (idx - (count - 1) / 2) * (canvasHeight / Math.max(count + 1, 3));
        positioned.push({
          ...node,
          x,
          y,
        });
      });
    });

    return positioned;
  }, [nodes]);

  const nodeMap = useMemo(() => {
    const map = {};
    layoutNodes.forEach((n) => {
      map[n.id.toLowerCase()] = n;
    });
    return map;
  }, [layoutNodes]);

  // One arrow per sender->receiver pair (many transfers collapse into "N transfers - total")
  const groupedEdges = useMemo(() => {
    const groups = {};
    edges.forEach((e) => {
      const key = `${e.source.toLowerCase()}>${e.target.toLowerCase()}`;
      if (!groups[key]) groups[key] = { key, source: e.source, target: e.target, count: 0, totals: {}, isDeposit: false };
      const g = groups[key];
      g.count += 1;
      g.totals[e.token_symbol] = (g.totals[e.token_symbol] || 0) + (e.amount ?? parseFloat(String(e.value).replace(/,/g, '')) ?? 0);
      if (e.is_exchange_deposit) g.isDeposit = true;
    });
    const fmt = (v) => (v >= 100 ? v.toLocaleString(undefined, { maximumFractionDigits: 0 }) : v >= 1 ? v.toFixed(2) : v.toFixed(4));
    return Object.values(groups).map((g) => {
      const top = Object.entries(g.totals).sort((x, y) => y[1] - x[1]);
      const more = top.length > 1 ? ` +${top.length - 1} more` : '';
      return { ...g, amountText: top.length ? `${fmt(top[0][1])} ${top[0][0]}${more}` : '' };
    });
  }, [edges]);

  const nodeLabel = (n) => {
    if (n.type === 'SUSPECT') return 'Suspect wallet';
    if (n.type === 'EXCHANGE' || n.type === 'MIXER' || n.type === 'DEX' || n.type === 'BRIDGE') return n.entity;
    if (n.probable_service) return 'Likely exchange';
    return `${n.id.slice(0, 6)}...${n.id.slice(-4)}`;
  };

  const getNodeTheme = (type) => {
    switch (type) {
      case 'SUSPECT':
        return { fill: '#ea3943', stroke: '#b91c1c', text: '#ffffff', glow: 'rgba(234, 57, 67, 0.2)' };
      case 'EXCHANGE':
        return { fill: '#2563eb', stroke: '#1d4ed8', text: '#ffffff', glow: 'rgba(37, 99, 235, 0.2)' };
      case 'MIXER':
        return { fill: '#9333ea', stroke: '#7e22ce', text: '#ffffff', glow: 'rgba(147, 51, 234, 0.2)' };
      case 'DEX':
        return { fill: '#059669', stroke: '#047857', text: '#ffffff', glow: 'rgba(5, 150, 105, 0.2)' };
      default:
        return { fill: '#f59e0b', stroke: '#d97706', text: '#ffffff', glow: 'rgba(245, 158, 11, 0.2)' };
    }
  };

  return (
    <div className="graph-container-clean">
      <div className="graph-clean-grid" />

      {/* Graph Toolbar */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        zIndex: 10,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '9999px',
        padding: '3px 8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
      }}>
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 1.8))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: '2px 6px', color: '#475467' }}
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: '2px 6px', color: '#475467' }}
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', color: '#475467' }}
          title="Reset"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Legend Badge Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        zIndex: 10,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '9999px',
        padding: '6px 16px',
        fontSize: '0.75rem',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ea3943' }} />
          <span style={{ color: '#09090b', fontWeight: 600 }}>Suspect Wallet</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
          <span style={{ color: '#475467' }}>Other wallet</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
          <span style={{ color: '#2563eb', fontWeight: 600 }}>Known exchange</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9333ea' }} />
          <span style={{ color: '#9333ea', fontWeight: 600 }}>Privacy mixer</span>
        </div>
      </div>

      {hiddenCount > 0 && (
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '9999px', padding: '4px 12px', fontSize: '0.74rem', color: '#64748b' }}>
          Showing the largest wallets. {hiddenCount} smaller wallet{hiddenCount > 1 ? 's' : ''} hidden here, listed in the table below.
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        style={{
          width: '100%',
          height: '100%',
          cursor: 'grab',
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease-out',
        }}
        viewBox="0 0 920 450"
      >
        <defs>
          <marker
            id="arrow-clean"
            viewBox="0 0 10 10"
            refX="28"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
          </marker>
        </defs>

        {/* Render Edges (grouped) */}
        {groupedEdges.map((edge) => {
          const source = nodeMap[edge.source.toLowerCase()];
          const target = nodeMap[edge.target.toLowerCase()];
          if (!source || !target || source === target) return null;

          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          const isDeposit = edge.isDeposit;
          const label = `${edge.count} transfer${edge.count > 1 ? 's' : ''} - ${edge.amountText}`;
          const w = Math.max(label.length * 5.6 + 16, 80);

          return (
            <g key={edge.key}>
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={isDeposit ? '#2563eb' : '#94a3b8'}
                strokeWidth={Math.min(1.5 + Math.log2(edge.count + 1), 5)}
                markerEnd="url(#arrow-clean)"
              />
              <g transform={`translate(${midX}, ${midY})`}>
                <rect x={-w / 2} y="-11" width={w} height="22" rx="11" fill="#ffffff" stroke={isDeposit ? '#2563eb' : '#cbd5e1'} strokeWidth="1" />
                <text x="0" y="4" textAnchor="middle" fill={isDeposit ? '#1d4ed8' : '#334155'} fontSize="10" fontWeight="600">
                  {label}
                </text>
              </g>
            </g>
          );
        })}

        {/* Render Nodes */}
        {layoutNodes.map((node) => {
          const theme = getNodeTheme(node.type);
          const isSelected = selectedNodeId && selectedNodeId.toLowerCase() === node.id.toLowerCase();
          const isSuspect = node.type === 'SUSPECT';
          const isExchange = node.type === 'EXCHANGE';
          const isMixer = node.type === 'MIXER';

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => onSelectNode && onSelectNode(node)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                r={isSelected ? 30 : 25}
                fill={theme.glow}
              />

              <circle
                r={isSelected ? 24 : 20}
                fill={theme.fill}
                stroke={isSelected ? '#09090b' : theme.stroke}
                strokeWidth={isSelected ? 3 : 2}
                style={{
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                }}
              />

              <text
                x="0"
                y="5"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="700"
              >
                {isSuspect ? '⚠️' : isExchange ? '🏦' : isMixer ? '🌪️' : `H${node.hop_level}`}
              </text>

              {/* Node Label Below */}
              <g transform="translate(0, 34)">
                <rect
                  x="-65"
                  y="-10"
                  width="130"
                  height="20"
                  rx="10"
                  fill="#ffffff"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill="#09090b"
                  fontSize="10"
                  fontWeight="600"
                >
                  {nodeLabel(node)}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
