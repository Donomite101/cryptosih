import React, { useState } from 'react';
import { ExternalLink, ArrowLeft, Download, Copy, Check, AlertTriangle, Info, SearchX } from 'lucide-react';
import HeroHeader from './HeroHeader';
import GraphCanvas from './GraphCanvas';
import ExchangeCard from './ExchangeCard';
import AILoader from './AILoader';
import { downloadReport } from '../reportExport';

const VERDICT = {
  critical: { color: '#dc2626', bg: '#fef2f2', Icon: AlertTriangle, tag: 'Action needed' },
  warning: { color: '#d97706', bg: '#fffbeb', Icon: AlertTriangle, tag: 'Needs attention' },
  info: { color: '#2563eb', bg: '#eff6ff', Icon: Info, tag: 'For information' },
  nodata: { color: '#64748b', bg: '#f8fafc', Icon: SearchX, tag: 'Nothing found' },
};

const short = (a) => (a && a.length > 18 ? `${a.slice(0, 8)}...${a.slice(-6)}` : a);

function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="icon-btn"
      title="Copy"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check size={14} color="#059669" /> : <Copy size={14} />}
    </button>
  );
}

export default function TracerView({
  searchAddress,
  setSearchAddress,
  traceData,
  loading,
  error,
  onRunTrace,
  onClear,
  onOpenFreezeModal,
}) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAllTx, setShowAllTx] = useState(false);
  const [showAllDest, setShowAllDest] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchAddress && searchAddress.trim()) {
      onRunTrace(searchAddress.trim(), 2);
    }
  };

  if (loading) {
    return <AILoader targetInput={searchAddress} />;
  }

  if (!traceData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        {error && (
          <div className="error-banner" role="alert">
            <AlertTriangle size={18} />
            <div>
              <strong>We could not run that search.</strong>
              <div>{error}</div>
            </div>
          </div>
        )}
        <HeroHeader
          searchAddress={searchAddress}
          setSearchAddress={setSearchAddress}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    );
  }

  const d = traceData;
  const report = d.report;
  const nodes = d.nodes || [];
  const edges = d.edges || [];
  const vasps = d.detected_vasps || [];
  const addrUrl = (a) => `${d.explorer_url}/address/${a}`;
  const txUrl = (h) => `${d.tx_url_base}${h}`;

  // Older saved results (e.g. loaded from a past case) may not have the plain-English report
  if (!report) {
    return (
      <div className="page">
        <button onClick={onClear} className="btn-outline-pill"><ArrowLeft size={16} /><span>New search</span></button>
        <div className="clean-card simple-card">
          <p>{d.summary}</p>
          <p className="muted">Run the search again to get the full report.</p>
        </div>
      </div>
    );
  }

  const v = VERDICT[report.verdict.level] || VERDICT.info;
  const s = report.stats;
  const visibleEdges = showAllTx ? edges : edges.slice(0, 10);

  return (
    <div className="page">
      {/* ---- Top bar ---- */}
      <div className="row-between wrap" style={{ gap: '12px' }}>
        <button onClick={onClear} className="btn-outline-pill">
          <ArrowLeft size={16} />
          <span>New search</span>
        </button>
        <button onClick={() => downloadReport(d)} className="btn-red-pill">
          <Download size={16} />
          <span>Download report</span>
        </button>
      </div>

      <div>
        <h2 className="h-title">Investigation report</h2>
        <div className="muted" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span className="mono" style={{ wordBreak: 'break-all' }}>{d.suspect_address}</span>
          <CopyButton text={d.suspect_address} />
          <span className="badge badge-blue">{d.chain} network</span>
        </div>
        {d.source_tx && (
          <div className="muted" style={{ fontSize: '0.82rem', marginTop: '4px' }}>
            You entered a transaction ID. It paid this wallet on {d.source_tx.chain}
            {d.source_tx.token_contract ? ' (a token transfer)' : ''}, so we investigated the receiving wallet.
          </div>
        )}
        {d.input_type === 'CRYPTOGRAPHIC_PUBLIC_KEY' && (
          <div className="muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            You entered a public key. We converted it to this wallet address.
          </div>
        )}
      </div>

      {/* ---- 1. Verdict ---- */}
      <div className="verdict-card" style={{ borderColor: v.color, background: v.bg }}>
        <div className="verdict-icon" style={{ background: v.color }}>
          <v.Icon size={22} color="#fff" />
        </div>
        <div>
          <div className="verdict-tag" style={{ color: v.color }}>{v.tag}</div>
          <h3 className="verdict-head">{report.verdict.headline}</h3>
          <p className="verdict-detail">{report.verdict.detail}</p>
        </div>
      </div>

      {/* ---- 2. Key numbers ---- */}
      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-label">Transfers out</div>
          <div className="stat-value">{s.transfers}</div>
          <div className="stat-hint">payments sent from the suspect trail</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Wallets involved</div>
          <div className="stat-value">{s.wallets_involved}</div>
          <div className="stat-hint">other wallets that received money</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Exchanges found</div>
          <div className="stat-value" style={{ color: s.exchanges_found ? '#2563eb' : undefined }}>{s.exchanges_found}</div>
          <div className="stat-hint">companies that can freeze funds</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Still in wallet</div>
          <div className="stat-value">{s.balance} <span style={{ fontSize: '0.9rem' }}>{s.native_symbol}</span></div>
          <div className="stat-hint">current balance of suspect wallet</div>
        </div>
      </div>

      {/* ---- 3. Findings + next steps ---- */}
      <div className="two-col">
        <div className="clean-card simple-card">
          <h3 className="h-sec">What we found</h3>
          {report.findings.length === 0 && <p className="muted">Nothing notable.</p>}
          <ul className="plain-list">
            {report.findings.map((f, i) => (
              <li key={i}>
                <span className="dot" style={{ background: f.level === 'critical' ? '#dc2626' : f.level === 'warning' ? '#d97706' : '#94a3b8' }} />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="clean-card simple-card">
          <h3 className="h-sec">What to do next</h3>
          <ol className="steps">
            {report.next_steps.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </div>
      </div>

      {/* ---- 4. Exchanges ---- */}
      {vasps.length > 0 && (
        <div>
          <h3 className="h-sec">Exchanges that received the money</h3>
          <p className="muted" style={{ marginBottom: '12px' }}>
            Exchanges verify their customers' identity. Police can ask them to freeze the funds and share the account holder's details.
          </p>
          <div className="card-grid">
            {vasps.map((x) => (
              <ExchangeCard
                key={x.entity_name}
                vasp={x}
                txUrlBase={d.tx_url_base}
                onCreateFreeze={(vv) => onOpenFreezeModal(vv, d.suspect_address, d.investigation_id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ---- 5. Money flow ---- */}
      {edges.length > 0 && (
        <div className="clean-card simple-card">
          <h3 className="h-sec">Follow the money</h3>
          <p className="muted" style={{ marginBottom: '12px' }}>
            Each circle is a wallet. Each arrow shows money moving from one wallet to the next, with how many payments and how much in total. Click a circle for details.
          </p>
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            onSelectNode={(n) => setSelectedNode(n)}
            selectedNodeId={selectedNode?.id}
          />
          {selectedNode && (
            <div className="inspector">
              <div className="row-between">
                <strong>{selectedNode.type === 'SUSPECT' ? 'Suspect wallet' : selectedNode.entity || 'Wallet'}</strong>
                <button className="link-btn" onClick={() => setSelectedNode(null)}>Close</button>
              </div>
              <div className="mono" style={{ fontSize: '0.78rem', wordBreak: 'break-all', margin: '6px 0' }}>
                {selectedNode.id} <CopyButton text={selectedNode.id} />
              </div>
              <div className="muted" style={{ fontSize: '0.84rem' }}>
                Step {selectedNode.hop_level} from the suspect
                {selectedNode.category && selectedNode.category !== 'Wallet' ? ` - ${selectedNode.category}` : ''}
                {typeof selectedNode.balance_eth === 'number' ? ` - balance ${selectedNode.balance_eth} ${d.native_symbol}` : ''}
              </div>
              <a href={addrUrl(selectedNode.id)} target="_blank" rel="noreferrer" style={{ fontSize: '0.84rem' }}>
                View on {d.chain} explorer <ExternalLink size={12} style={{ verticalAlign: '-1px' }} />
              </a>
            </div>
          )}
        </div>
      )}

      {/* ---- 6. Where the money went ---- */}
      {report.destinations.length > 0 && (
        <div className="clean-card simple-card">
          <h3 className="h-sec">Where the money went</h3>
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr><th>Receiving wallet</th><th>Who</th><th>Payments</th><th>Total received</th><th>Period</th></tr>
              </thead>
              <tbody>
                {(showAllDest ? report.destinations : report.destinations.slice(0, 10)).map((x) => (
                  <tr key={x.address}>
                    <td>
                      <a className="mono" href={addrUrl(x.address)} target="_blank" rel="noreferrer">{short(x.address)}</a>
                      <div className="muted" style={{ fontSize: '0.74rem' }}>Step {x.hop}</div>
                    </td>
                    <td>
                      <strong>{x.name}</strong>
                      <div>
                        <span className={`badge ${x.type === 'EXCHANGE' ? 'badge-blue' : x.type === 'MIXER' ? 'badge-purple' : 'badge-amber'}`}>{x.kind}</span>
                      </div>
                    </td>
                    <td>{x.tx_count}</td>
                    <td className="mono"><strong>{x.total_text}</strong></td>
                    <td className="muted" style={{ fontSize: '0.78rem' }}>{x.first_seen}<br />to {x.last_seen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {report.destinations.length > 10 && (
            <button className="link-btn" style={{ marginTop: '10px' }} onClick={() => setShowAllDest((x) => !x)}>
              {showAllDest ? 'Show fewer' : `Show all ${report.destinations.length} wallets`}
            </button>
          )}
        </div>
      )}

      {/* ---- 7. Details (collapsed) ---- */}
      {edges.length > 0 && (
        <details className="fold clean-card">
          <summary>All individual transfers ({edges.length})</summary>
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr><th>Transaction</th><th>From</th><th>To</th><th>Amount</th><th>Time (UTC)</th></tr>
              </thead>
              <tbody>
                {visibleEdges.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <a className="mono" href={txUrl(e.hash)} target="_blank" rel="noreferrer">{(e.hash || '').slice(0, 10)}...</a>
                    </td>
                    <td className="mono">{short(e.source)}</td>
                    <td className="mono">
                      {short(e.target)}
                      {e.is_exchange_deposit && <span className="badge badge-blue" style={{ marginLeft: '6px' }}>{e.exchange_name}</span>}
                    </td>
                    <td className="mono"><strong>{e.value} {e.token_symbol}</strong></td>
                    <td className="muted" style={{ fontSize: '0.78rem' }}>{e.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {edges.length > 10 && (
            <button className="link-btn" style={{ margin: '10px 16px' }} onClick={() => setShowAllTx((x) => !x)}>
              {showAllTx ? 'Show fewer' : `Show all ${edges.length}`}
            </button>
          )}
        </details>
      )}

      <details className="fold clean-card">
        <summary>Technical details (for investigators)</summary>
        <div style={{ padding: '4px 20px 18px' }}>
          <p className="muted" style={{ marginBottom: '10px' }}>
            Risk score <strong>{d.risk_score}/100 ({d.risk_level})</strong>, a rough pattern-based estimate (quick forwarding, many recipients, mixers, exchange links). It is a guide, not proof.
          </p>
          <h4 className="h-small">Networks checked</h4>
          {(d.chain_activity || []).map((c) => (
            <div key={c.chain_id} className="row-between" style={{ fontSize: '0.84rem', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
              <a href={c.explorer} target="_blank" rel="noreferrer">{c.chain}</a>
              <span style={{ color: c.has_activity ? '#16a34a' : '#64748b' }}>
                {c.has_activity ? `active - balance ${c.balance}` : 'no activity'}
              </span>
            </div>
          ))}
          <h4 className="h-small" style={{ marginTop: '14px' }}>Who sent money to the suspect wallet</h4>
          {(d.funding_sources || []).length === 0 && <p className="muted">No incoming transfers seen.</p>}
          {(d.funding_sources || []).slice(0, 8).map((f) => (
            <div key={f.address} className="row-between" style={{ fontSize: '0.82rem', padding: '4px 0', borderBottom: '1px solid #f1f5f9', gap: '8px' }}>
              <a className="mono" href={addrUrl(f.address)} target="_blank" rel="noreferrer">{short(f.address)}</a>
              <span>{f.entity ? <strong>{f.entity}</strong> : 'unknown'} - {f.tx_count} payment(s), {f.total} {f.symbols.join('/')}</span>
            </div>
          ))}
          {d.data_warnings?.length > 0 && (
            <p style={{ color: '#b42318', fontSize: '0.82rem', marginTop: '12px' }}>Data warnings: {d.data_warnings.slice(0, 3).join(' | ')}</p>
          )}
        </div>
      </details>

      <details className="fold clean-card">
        <summary>New to crypto? Key terms explained</summary>
        <dl className="glossary">
          {report.glossary.map((g) => (
            <div key={g.term}>
              <dt>{g.term}</dt>
              <dd>{g.meaning}</dd>
            </div>
          ))}
        </dl>
      </details>

      <p className="muted" style={{ fontSize: '0.76rem', textAlign: 'center' }}>{report.disclaimer}</p>
    </div>
  );
}
