import React, { useState } from 'react';
import { Shield, Newspaper } from 'lucide-react';
import { C } from '../theme.jsx';
import { SENTIMENTS } from '../constants.js';
import { fmtPKR, fmtNum, fmtPct } from '../lib/format.js';
import { Card, SectionTitle, Input, Select, Textarea, Button, Modal, Pill } from './ui.jsx';

function RiskEditor({ risk, onSave }) {
  const [stopLoss, setStopLoss] = useState(risk.stopLoss || '');
  const [target, setTarget] = useState(risk.target || '');
  const [maxWeight, setMaxWeight] = useState(risk.maxWeight || '');
  return (
    <div className="space-y-3">
      <Input label="Stop-Loss Price (₨)" type="number" step="0.01" value={stopLoss} onChange={e => setStopLoss(e.target.value)} />
      <Input label="Target Price (₨)" type="number" step="0.01" value={target} onChange={e => setTarget(e.target.value)} />
      <Input label="Max Portfolio Weight (%)" type="number" step="0.1" value={maxWeight} onChange={e => setMaxWeight(e.target.value)} />
      <p className="text-[11px] leading-relaxed" style={{ color: C.muted }}>
        When the live price crosses these thresholds, flags appear on the portfolio row and dashboard.
      </p>
      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={() => onSave({
          stopLoss: stopLoss ? Number(stopLoss) : null,
          target: target ? Number(target) : null,
          maxWeight: maxWeight ? Number(maxWeight) : null,
        })}>Save</Button>
      </div>
    </div>
  );
}

function NewsEditor({ note, onSave }) {
  const [news, setNews] = useState(note.news || '');
  const [sentiment, setSentiment] = useState(note.sentiment || 'Neutral');
  return (
    <div className="space-y-3">
      <Select label="Market Sentiment" value={sentiment} onChange={e => setSentiment(e.target.value)} options={SENTIMENTS} />
      <Textarea label="News / Thesis / Notes" rows={6} value={news} onChange={e => setNews(e.target.value)}
        placeholder="Latest catalyst, earnings note, regulatory update, your current thesis…" />
      {note.updatedAt && (
        <div className="text-[10px]" style={{ color: C.muted }}>
          Last updated: {new Date(note.updatedAt).toLocaleString()}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={() => onSave({ news, sentiment })}>Save</Button>
      </div>
    </div>
  );
}

export default function PortfolioTab({ state, holdings, updater, showToast }) {
  const [filter, setFilter] = useState('');
  const [sector, setSector] = useState('All');
  const [sortKey, setSortKey] = useState('currentValue');
  const [sortDir, setSortDir] = useState('desc');
  const [riskEditor, setRiskEditor] = useState(null);
  const [newsEditor, setNewsEditor] = useState(null);

  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);

  const filtered = holdings
    .filter(h => (filter
      ? (h.ticker.toLowerCase().includes(filter.toLowerCase()) || (h.name || '').toLowerCase().includes(filter.toLowerCase()))
      : true))
    .filter(h => sector === 'All' || h.sector === sector)
    .map(h => ({ ...h, weight: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0 }))
    .sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1;
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'string') return mul * va.localeCompare(vb);
      return mul * ((va ?? 0) - (vb ?? 0));
    });

  const setSort = k => {
    if (sortKey === k) setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    else { setSortKey(k); setSortDir('desc'); }
  };
  const sectorsInBook = ['All', ...new Set(holdings.map(h => h.sector))];

  return (
    <div>
      <SectionTitle sub={`${holdings.length} position${holdings.length === 1 ? '' : 's'} · ${state.settings.costBasisMethod} cost basis`}>
        Portfolio
      </SectionTitle>

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <Input placeholder="Search ticker or name…" value={filter} onChange={e => setFilter(e.target.value)} className="max-w-[260px]" />
        <Select value={sector} onChange={e => setSector(e.target.value)} options={sectorsInBook} />
      </div>

      {holdings.length === 0 ? (
        <Card className="py-14 text-center">
          <div className="text-[14px] font-semibold mb-2" style={{ color: C.ink }}>No positions yet</div>
          <div className="text-[12px]" style={{ color: C.muted }}>
            Add a BUY transaction — or import from your broker — to begin.
          </div>
        </Card>
      ) : (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {[
                    ['ticker', 'Ticker'], ['sector', 'Sector'], ['quantity', 'Qty'], ['avgPrice', 'Avg'],
                    ['livePrice', 'Live'], ['dayChange', 'Day %'], ['invested', 'Invested'], ['currentValue', 'Value'],
                    ['unrealized', 'P&L'], ['unrealizedPct', '%'], ['weight', 'Wt'], ['holdingDays', 'Held'],
                  ].map(([k, lbl]) => (
                    <th key={k} onClick={() => setSort(k)}
                      className="text-left px-3 py-3 text-[10px] uppercase tracking-wider font-semibold cursor-pointer"
                      style={{ color: C.muted }}>
                      {lbl}{sortKey === k && <span className="ml-1" style={{ color: C.accent }}>{sortDir === 'desc' ? '↓' : '↑'}</span>}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.muted }}>Actions</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {filtered.map(h => {
                  const risk = state.risk[h.ticker];
                  const note = state.tickerNotes?.[h.ticker];
                  const overLimit = risk?.maxWeight && h.weight > risk.maxWeight;
                  const hitStop = risk?.stopLoss && h.livePrice <= risk.stopLoss;
                  const hitTarget = risk?.target && h.livePrice >= risk.target;
                  return (
                    <tr key={h.ticker} style={{ borderBottom: `1px solid ${C.borderSoft}` }} className="transition-colors"
                      onMouseEnter={e => e.currentTarget.style.background = C.hover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span style={{ color: C.ink, fontWeight: 600 }}>{h.ticker}</span>
                          {h.priceStale && <span title="Stale" style={{ color: C.warn, fontSize: 8 }}>●</span>}
                          {hitStop && <Pill tone="neg">Stop</Pill>}
                          {hitTarget && <Pill tone="pos">Target</Pill>}
                          {overLimit && <Pill tone="warn">Over</Pill>}
                          {note?.sentiment && (
                            <Pill tone={note.sentiment === 'Positive' ? 'pos' : note.sentiment === 'Negative' ? 'neg' : 'neutral'}>
                              {note.sentiment}
                            </Pill>
                          )}
                        </div>
                        <div className="text-[11px] mt-0.5 truncate max-w-[160px]" style={{ fontFamily: 'Inter', color: C.muted }}>
                          {h.name}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-[11px]" style={{ color: C.inkSoft, fontFamily: 'Inter' }}>{h.sector}</td>
                      <td className="px-3 py-3.5" style={{ color: C.ink }}>{fmtNum(h.quantity, 0)}</td>
                      <td className="px-3 py-3.5" style={{ color: C.inkSoft }}>{fmtNum(h.avgPrice, 2)}</td>
                      <td className="px-3 py-3.5" style={{ color: C.ink, fontWeight: 600 }}>{fmtNum(h.livePrice, 2)}</td>
                      <td className="px-3 py-3.5" style={{ color: h.dayChange === null ? C.muted : h.dayChange >= 0 ? C.pos : C.neg }}>
                        {h.dayChange === null ? '—' : fmtPct(h.dayChange)}
                      </td>
                      <td className="px-3 py-3.5" style={{ color: C.inkSoft }}>{fmtPKR(h.invested)}</td>
                      <td className="px-3 py-3.5" style={{ color: C.ink, fontWeight: 600 }}>{fmtPKR(h.currentValue)}</td>
                      <td className="px-3 py-3.5" style={{ color: h.unrealized >= 0 ? C.pos : C.neg }}>{fmtPKR(h.unrealized)}</td>
                      <td className="px-3 py-3.5" style={{ color: h.unrealizedPct >= 0 ? C.pos : C.neg, fontWeight: 600 }}>
                        {fmtPct(h.unrealizedPct)}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <span style={{ color: C.inkSoft }}>{h.weight.toFixed(1)}%</span>
                          <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: C.borderSoft }}>
                            <div className="h-full" style={{ width: `${Math.min(100, h.weight)}%`, background: C.accent }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5" style={{ color: C.inkSoft }}>{h.holdingDays}d</td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setRiskEditor(h.ticker)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            title="Risk rules" style={{ color: C.muted }}
                            onMouseEnter={e => { e.currentTarget.style.background = C.hover; e.currentTarget.style.color = C.ink; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}>
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setNewsEditor(h.ticker)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors relative"
                            title="News & sentiment"
                            style={{ color: note?.news ? C.accent : C.muted }}
                            onMouseEnter={e => { e.currentTarget.style.background = C.hover; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                            <Newspaper className="w-3.5 h-3.5" />
                            {note?.news && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: C.accent }} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {riskEditor && (
        <Modal onClose={() => setRiskEditor(null)} title={`Risk rules — ${riskEditor}`}>
          <RiskEditor
            risk={state.risk[riskEditor] || {}}
            onSave={patch => {
              updater.setRisk(riskEditor, patch);
              showToast('Risk rules saved', 'success');
              setRiskEditor(null);
            }}
          />
        </Modal>
      )}

      {newsEditor && (
        <Modal onClose={() => setNewsEditor(null)} title={`News & sentiment — ${newsEditor}`}>
          <NewsEditor
            note={state.tickerNotes?.[newsEditor] || {}}
            onSave={patch => {
              updater.setTickerNote(newsEditor, patch);
              showToast('Notes saved', 'success');
              setNewsEditor(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
