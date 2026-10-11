// Builds a self-contained, printable HTML report from a trace result (no dependencies).
const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const LEVEL_COLOR = { critical: '#dc2626', warning: '#d97706', nodata: '#64748b', info: '#2563eb' };

export function buildReportHtml(d) {
  const r = d.report || {};
  const v = r.verdict || { level: 'info', headline: '', detail: '' };
  const s = r.stats || {};
  const color = LEVEL_COLOR[v.level] || '#2563eb';
  const addrUrl = (a) => `${d.explorer_url}/address/${a}`;
  const txUrl = (h) => `${d.tx_url_base}${h}`;

  const exchanges = (d.detected_vasps || [])
    .map(
      (x) => `<div class="box"><b>${esc(x.entity_name)}</b> (${esc(x.category)})<br>
      Received: <b>${esc(x.total_deposited)}</b> - last deposit ${esc(x.last_deposit_time)}<br>
      Exchange wallet: <a href="${addrUrl(x.address)}">${esc(x.address)}</a><br>
      Law-enforcement contact: ${esc(x.le_contact_email || 'N/A')} ${x.le_portal_url && x.le_portal_url !== 'N/A' ? `- <a href="${esc(x.le_portal_url)}">${esc(x.le_portal_url)}</a>` : ''}<br>
      Deposit transaction(s): ${(x.deposit_hashes || []).map((h) => `<a href="${txUrl(h)}">${esc(h)}</a>`).join('<br>')}</div>`
    )
    .join('');

  const dest = (r.destinations || [])
    .map(
      (x) => `<tr><td>${esc(x.name)}<br><small><a href="${addrUrl(x.address)}">${esc(x.address)}</a></small></td>
      <td>${esc(x.kind)}</td><td>${x.hop}</td><td>${x.tx_count}</td><td>${esc(x.total_text)}</td><td>${esc(x.first_seen)}<br>${esc(x.last_seen)}</td></tr>`
    )
    .join('');

  const txs = (d.edges || [])
    .map(
      (e) => `<tr><td><a href="${txUrl(e.hash)}">${esc((e.hash || '').slice(0, 14))}...</a></td><td>${esc(e.source.slice(0, 10))}...</td>
      <td>${esc(e.target.slice(0, 10))}...</td><td>${esc(e.value)} ${esc(e.token_symbol)}</td><td>${esc(e.timestamp)}</td><td>${e.is_exchange_deposit ? esc(e.exchange_name) : ''}</td></tr>`
    )
    .join('');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Crypto trace report - ${esc(d.suspect_address)}</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;color:#0f172a;max-width:900px;margin:32px auto;padding:0 20px;line-height:1.5}
h1{font-size:1.5rem;margin:0}h2{font-size:1.1rem;margin:28px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
.verdict{border-left:6px solid ${color};background:#f8fafc;padding:14px 18px;border-radius:8px;margin:16px 0}
.verdict b{color:${color};font-size:1.15rem}.grid{display:flex;gap:12px;flex-wrap:wrap}
.stat{flex:1;min-width:140px;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px}.stat small{color:#64748b;display:block}.stat span{font-size:1.2rem;font-weight:700}
.box{border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin:8px 0;font-size:.9rem;word-break:break-all}
table{width:100%;border-collapse:collapse;font-size:.8rem}th,td{border-bottom:1px solid #e2e8f0;padding:6px 8px;text-align:left;vertical-align:top;word-break:break-all}th{background:#f8fafc}
small,.muted{color:#64748b}a{color:#2563eb}li{margin:4px 0}button{padding:8px 16px;border:1px solid #cbd5e1;background:#fff;border-radius:999px;cursor:pointer}
@media print{button{display:none}body{margin:0}}
</style></head><body>
<button onclick="window.print()">Print / Save as PDF</button>
<h1>Cryptocurrency Fraud Trace Report</h1>
<p class="muted">Generated ${esc(r.generated_at)} &middot; Network: ${esc(d.chain)}<br>Suspect wallet: <a href="${addrUrl(d.suspect_address)}">${esc(d.suspect_address)}</a></p>
<div class="verdict"><b>${esc(v.headline)}</b><p>${esc(v.detail)}</p></div>
<div class="grid">
<div class="stat"><small>Transfers out</small><span>${s.transfers ?? 0}</span></div>
<div class="stat"><small>Wallets involved</small><span>${s.wallets_involved ?? 0}</span></div>
<div class="stat"><small>Exchanges found</small><span>${s.exchanges_found ?? 0}</span></div>
<div class="stat"><small>Balance still in wallet</small><span>${esc(s.balance)} ${esc(s.native_symbol)}</span></div>
</div>
<h2>What we found</h2><ul>${(r.findings || []).map((f) => `<li>${esc(f.text)}</li>`).join('') || '<li>Nothing notable.</li>'}</ul>
${exchanges ? `<h2>Exchanges to contact</h2>${exchanges}` : ''}
<h2>Where the money went</h2>
${dest ? `<table><tr><th>Receiving wallet</th><th>Type</th><th>Step</th><th>Transfers</th><th>Total</th><th>First / last</th></tr>${dest}</table>` : '<p class="muted">No outgoing transfers.</p>'}
<h2>Recommended next steps</h2><ol>${(r.next_steps || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
<h2>All transfers</h2>
${txs ? `<table><tr><th>Transaction</th><th>From</th><th>To</th><th>Amount</th><th>Time (UTC)</th><th>Exchange</th></tr>${txs}</table>` : '<p class="muted">None.</p>'}
<h2>Key terms</h2><ul>${(r.glossary || []).map((g) => `<li><b>${esc(g.term)}:</b> ${esc(g.meaning)}</li>`).join('')}</ul>
<p class="muted"><small>${esc(r.disclaimer)}</small></p>
</body></html>`;
}

export function downloadReport(d) {
  const html = buildReportHtml(d);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fraud-trace-report-${d.suspect_address.slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
