import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { C } from '../theme.jsx';
import { CSV_FIELDS, BROKER_PRESETS, TICKER_BY_SYMBOL } from '../constants.js';
import { Label, Textarea, Select, Button } from './ui.jsx';

export default function CSVImport({ onImport }) {
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState(null);
  const [preset, setPreset] = useState('custom');
  const [mapping, setMapping] = useState({});
  const [dateFormat, setDateFormat] = useState('auto');
  const [step, setStep] = useState(1);

  const parse = () => {
    if (!raw.trim()) return;
    const out = Papa.parse(raw.trim(), { header: true, skipEmptyLines: true });
    if (!out.data.length) return alert('No rows detected.');
    setParsed({ data: out.data, headers: out.meta.fields || [] });
    const autoMap = {};
    const headers = out.meta.fields || [];
    const lower = headers.map(h => h.toLowerCase());
    const find = needle => {
      const i = lower.findIndex(h => h.includes(needle));
      return i >= 0 ? headers[i] : '';
    };
    autoMap.date = find('date') || find('trade');
    autoMap.type = find('type') || find('b/s') || find('side') || find('transaction');
    autoMap.ticker = find('ticker') || find('symbol') || find('scrip');
    autoMap.quantity = find('qty') || find('quantity') || find('volume');
    autoMap.price = find('price') || find('rate');
    autoMap.fees = find('fee') || find('commission') || find('brokerage');
    autoMap.tax = find('tax') || find('cvt') || find('cgt');
    autoMap.time = find('time');
    autoMap.strategy = find('strategy');
    autoMap.entryReason = find('note') || find('reason') || find('remarks');
    setMapping(autoMap);
    setStep(2);
  };

  const applyPreset = p => {
    setPreset(p);
    if (p !== 'custom') setMapping(BROKER_PRESETS[p].map);
  };

  const parseDate = s => {
    if (!s) return null;
    s = String(s).trim();
    if (dateFormat === 'dd/mm/yyyy' || (dateFormat === 'auto' && /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(s))) {
      const [d, m, y] = s.split(/[/-]/);
      const yr = y.length === 2 ? `20${y}` : y;
      return `${yr}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    if (dateFormat === 'mm/dd/yyyy') {
      const [m, d, y] = s.split(/[/-]/);
      const yr = y.length === 2 ? `20${y}` : y;
      return `${yr}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    const d = new Date(s);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    return null;
  };

  const normType = v => {
    if (!v) return null;
    const s = String(v).trim().toUpperCase();
    if (['BUY', 'B', 'PURCHASE', 'BOT'].includes(s)) return 'BUY';
    if (['SELL', 'S', 'SALE', 'SLD'].includes(s)) return 'SELL';
    return null;
  };

  const numClean = v => {
    if (v === null || v === undefined || v === '') return 0;
    const n = Number(String(v).replace(/[,₨\s]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const mapped = useMemo(() => {
    if (!parsed) return [];
    return parsed.data.map((row, i) => {
      const get = k => mapping[k] ? row[mapping[k]] : '';
      const date = parseDate(get('date'));
      const type = normType(get('type'));
      const ticker = String(get('ticker') || '').trim().toUpperCase();
      const quantity = numClean(get('quantity'));
      const price = numClean(get('price'));
      const fees = numClean(get('fees'));
      const tax = numClean(get('tax'));
      const suggest = TICKER_BY_SYMBOL[ticker];
      const valid = date && type && ticker && quantity > 0 && price > 0;
      return {
        _row: i + 1,
        valid,
        errors: [
          !date && 'invalid date',
          !type && 'missing type (BUY/SELL)',
          !ticker && 'missing ticker',
          quantity <= 0 && 'quantity ≤ 0',
          price <= 0 && 'price ≤ 0',
        ].filter(Boolean),
        data: {
          date, type, ticker, quantity, price, fees, tax,
          time: String(get('time') || '').trim() || '00:00',
          name: suggest?.name || ticker,
          sector: suggest?.sector || 'Other',
          assetType: 'PSX',
          strategy: String(get('strategy') || '').trim() || 'Long-term',
          entryReason: type === 'BUY' ? String(get('entryReason') || '').trim() : '',
          exitReason: type === 'SELL' ? String(get('entryReason') || '').trim() : '',
          emotion: 'Analytical',
        },
      };
    });
  }, [parsed, mapping, dateFormat]);

  const validCount = mapped.filter(m => m.valid).length;
  const invalidCount = mapped.length - validCount;

  return (
    <div>
      {step === 1 && (
        <div>
          <div className="mb-4">
            <Label>Broker preset (optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BROKER_PRESETS).map(([k, p]) => (
                <button
                  key={k}
                  onClick={() => setPreset(k)}
                  className="text-left px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all"
                  style={{
                    background: preset === k ? C.accent : C.bg,
                    color: preset === k ? C.accentInk : C.inkSoft,
                    border: `1px solid ${preset === k ? C.accent : C.border}`,
                  }}
                >{p.label}</button>
              ))}
            </div>
          </div>
          <Textarea
            label="Paste CSV (include header row)"
            rows={10}
            value={raw}
            onChange={e => setRaw(e.target.value)}
            placeholder={'Date,Type,Ticker,Quantity,Price,Fees\n2025-03-12,BUY,LUCK,100,845.50,12.68'}
          />
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="dark" onClick={parse}>Parse & Preview →</Button>
          </div>
        </div>
      )}

      {step === 2 && parsed && (
        <div>
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <Select label="Date format" value={dateFormat} onChange={e => setDateFormat(e.target.value)}
              options={[
                { value: 'auto', label: 'Auto-detect' },
                { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD' },
                { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY' },
                { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY' },
              ]} />
            <Select label="Preset" value={preset} onChange={e => applyPreset(e.target.value)}
              options={Object.entries(BROKER_PRESETS).map(([k, p]) => ({ value: k, label: p.label }))} />
          </div>

          <div className="mb-4">
            <Label>Column Mapping</Label>
            <div className="grid grid-cols-3 gap-3 mt-1">
              {CSV_FIELDS.map(field => (
                <div key={field.key}>
                  <div className="text-[10px] mb-1 font-medium" style={{ color: field.required ? C.neg : C.muted }}>
                    {field.label}
                  </div>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={e => setMapping({ ...mapping, [field.key]: e.target.value })}
                    className="w-full rounded-lg px-3 py-1.5 text-[12px] focus:outline-none"
                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.ink }}
                  >
                    <option value="">— none —</option>
                    {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4 flex items-center gap-6 text-[12px]">
            <div>
              <span style={{ color: C.pos, fontWeight: 600 }}>✓ {validCount}</span>{' '}
              <span style={{ color: C.muted }}>valid</span>
            </div>
            <div>
              <span style={{ color: C.neg, fontWeight: 600 }}>✗ {invalidCount}</span>{' '}
              <span style={{ color: C.muted }}>invalid</span>
            </div>
            <div style={{ color: C.muted }}>Preview shows first 8 rows</div>
          </div>

          <div className="rounded-xl overflow-auto max-h-[320px] scroll-thin" style={{ border: `1px solid ${C.border}` }}>
            <table className="w-full text-[11px] font-mono">
              <thead style={{ background: C.bg }}>
                <tr>
                  {['#', 'Date', 'Type', 'Ticker', 'Qty', 'Price', 'Fees', 'Status'].map(h =>
                    <th key={h} className="text-left px-2 py-2 font-semibold text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {mapped.slice(0, 8).map(m => (
                  <tr key={m._row} style={{
                    borderTop: `1px solid ${C.borderSoft}`,
                    background: m.valid ? 'transparent' : C.negSoft,
                  }}>
                    <td className="px-2 py-1.5" style={{ color: C.muted }}>{m._row}</td>
                    <td className="px-2 py-1.5" style={{ color: C.inkSoft }}>{m.data.date || '?'}</td>
                    <td className="px-2 py-1.5" style={{ color: C.inkSoft }}>{m.data.type || '?'}</td>
                    <td className="px-2 py-1.5" style={{ color: C.ink, fontWeight: 600 }}>{m.data.ticker || '?'}</td>
                    <td className="px-2 py-1.5" style={{ color: C.inkSoft }}>{m.data.quantity || '?'}</td>
                    <td className="px-2 py-1.5" style={{ color: C.inkSoft }}>{m.data.price || '?'}</td>
                    <td className="px-2 py-1.5" style={{ color: C.inkSoft }}>{m.data.fees || '0'}</td>
                    <td className="px-2 py-1.5 text-[10px] font-medium" style={{
                      color: m.valid ? C.pos : C.neg, fontFamily: 'Inter',
                    }}>
                      {m.valid ? 'OK' : m.errors.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
            <div className="flex gap-2 items-center">
              {invalidCount > 0 && <span className="text-[11px]" style={{ color: C.muted }}>Invalid rows will be skipped</span>}
              <Button variant="dark" onClick={() => onImport(mapped.filter(m => m.valid).map(m => m.data))} disabled={validCount === 0}>
                Import {validCount} Transaction{validCount === 1 ? '' : 's'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
