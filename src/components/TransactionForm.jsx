import React, { useState } from 'react';
import { BookMarked, AlertCircle } from 'lucide-react';
import { C } from '../theme.jsx';
import {
  SECTORS, ASSET_TYPES, STRATEGIES, EMOTIONS, SENTIMENTS,
  POPULAR_TICKERS, TICKER_BY_SYMBOL,
} from '../constants.js';
import { fmtPKR } from '../lib/format.js';
import { Input, Select, Textarea, Button } from './ui.jsx';

export default function TransactionForm({ initial, settings, holdings = [], allSymbols = [], onSubmit }) {
  const [f, setF] = useState(() => initial || {
    type: 'BUY', ticker: '', name: '', sector: 'Other', assetType: 'PSX',
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    quantity: '', price: '', fees: '', tax: '',
    strategy: 'Long-term', entryReason: '', exitReason: '', emotion: 'Analytical',
    outcome: '', lessons: '', sentiment: 'Neutral', news: '',
    accountId: settings.activeAccountId || 'default',
  });
  const [validationErrors, setValidationErrors] = useState([]);
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));


  const suggestTicker = val => {
    const match = TICKER_BY_SYMBOL[val.toUpperCase()];
    if (match) setF(prev => ({ ...prev, ticker: match.symbol, name: match.name, sector: match.sector }));
    else set('ticker', val.toUpperCase());
  };

  const gross = Number(f.quantity || 0) * Number(f.price || 0);
  const fees = Number(f.fees || 0);
  const tax = Number(f.tax || 0);
  const net = f.type === 'BUY' ? gross + fees + tax : gross - fees - tax;

  const autoFees = () => {
    if (gross > 0) set('fees', ((gross * (settings.defaultFees || 0)) / 100).toFixed(2));
  };

// Helper — check how many shares user currently holds of this ticker
const existingQty = (ticker) => {
  if (!ticker || !holdings) return null;
  const h = holdings.find(x => x.ticker === ticker.toUpperCase());
  return h ? h.quantity : 0;
};

  const submit = () => {
  const errors = [];
  if (!f.ticker || f.ticker.length < 2) errors.push('Ticker required (min 2 chars)');
  if (!f.date) errors.push('Date required');
  
  // Date sanity
  const txnDate = new Date(f.date);
  const now = new Date();
  const tenYearsAgo = new Date(now.getFullYear() - 10, 0, 1);
  if (txnDate > now) errors.push('Date cannot be in the future');
  if (txnDate < tenYearsAgo) errors.push('Date is more than 10 years ago — please verify');
  
  // Numeric validations
  const qty = Number(f.quantity);
  const price = Number(f.price);
  const fees = Number(f.fees || 0);
  const tax = Number(f.tax || 0);
  
  if (f.type === 'BONUS') {
    if (!qty || qty <= 0) errors.push('Bonus share quantity must be > 0');
  } else if (f.type === 'DIVIDEND') {
    if (!qty || qty <= 0) errors.push('Dividend amount must be > 0');
    if (qty > 10_000_000) errors.push(`Dividend amount ₨${qty.toLocaleString()} seems very high — please verify`);
  } else {
    if (!qty || qty <= 0) errors.push('Quantity must be > 0');
    if (!price || price <= 0) errors.push('Price must be > 0');
    if (price > 100_000) errors.push(`Price ₨${price} seems very high for a PSX stock — please verify`);
    if (qty > 10_000_000) errors.push('Quantity seems very high — please verify');
  }
  
  if (fees < 0 || tax < 0) errors.push('Fees and tax cannot be negative');
  
  // Fees sanity: shouldn't exceed 5% of gross
  if (f.type === 'BUY' || f.type === 'SELL') {
    const gross = qty * price;
    if (gross > 0 && (fees + tax) > gross * 0.05) {
      errors.push(`Fees+Tax (₨${(fees+tax).toFixed(0)}) exceed 5% of gross — please verify`);
    }
  }
  
  // Overselling check for SELL
  if (f.type === 'SELL') {
    const existingHoldings = existingQty(f.ticker);
    if (existingHoldings !== null && qty > existingHoldings + 0.001) {
      errors.push(`Cannot sell ${qty} — you only hold ${existingHoldings} of ${f.ticker}`);
    }
  }
  
  if (errors.length) {
    setValidationErrors(errors);
    return;
  }
  
  setValidationErrors([]);
  onSubmit({
    ...f, ticker: f.ticker.toUpperCase(), quantity: qty,
    price: Number(f.price || 0), fees, tax,
  });
};

  {settings.accounts && settings.accounts.length > 1 && (
  <Select label="Account" value={f.accountId} onChange={e => set('accountId', e.target.value)}
    options={settings.accounts.map(a => ({ value: a.id, label: a.name }))} />
)}

  return (
    <div className="space-y-4">
      {validationErrors.length > 0 && (
        <div className="rounded-xl p-4 flex gap-3 text-[13px] font-medium" style={{ background: C.negSoft, color: C.neg, border: `1px solid ${C.neg}40` }}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <ul className="space-y-1 list-disc pl-2">
            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-5 gap-2">
       {[
        { t: 'BUY', label: 'Buy', bg: C.ink, fg: C.bg },
        { t: 'SELL', label: 'Sell', bg: C.neg, fg: '#FFF' },
        { t: 'DIVIDEND', label: 'Dividend', bg: C.pos, fg: '#FFF' },
        { t: 'BONUS', label: 'Bonus', bg: C.info, fg: '#FFF' },
        { t: 'RIGHTS', label: 'Rights', bg: C.warn, fg: '#FFF' },
          ].map(({ t, label, bg, fg }) => (
      <button
      key={t}
      onClick={() => set('type', t)}
      className="px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
      style={{
        background: f.type === t ? bg : C.card,
        color: f.type === t ? fg : C.inkSoft,
        border: `1px solid ${f.type === t ? 'transparent' : C.border}`,
         }}
       >{label}</button>
      ))}
</div>

      <div className="grid grid-cols-3 gap-3">
        <Input label="Ticker" value={f.ticker} onChange={e => suggestTicker(e.target.value)} placeholder="LUCK" list="tickers" />
        <datalist id="tickers">
          {POPULAR_TICKERS.map(t => <option key={t.symbol} value={t.symbol}>{t.name}</option>)}
          {allSymbols.filter(s => !POPULAR_TICKERS.find(pt => pt.symbol === s)).map(s => <option key={s} value={s}>{s}</option>)}
        </datalist>
        <Input label="Name" value={f.name} onChange={e => set('name', e.target.value)} />
        <Select label="Sector" value={f.sector} onChange={e => set('sector', e.target.value)} options={SECTORS} />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Select label="Asset Type" value={f.assetType} onChange={e => set('assetType', e.target.value)} options={ASSET_TYPES} />
        <Input label="Date" type="date" value={f.date} onChange={e => set('date', e.target.value)} />
        <Input label="Time" type="time" value={f.time} onChange={e => set('time', e.target.value)} />
        <Select label="Strategy" value={f.strategy} onChange={e => set('strategy', e.target.value)} options={STRATEGIES} />
      </div>

      <div className="grid grid-cols-4 gap-3">
  <Input
    label={f.type === 'DIVIDEND' ? 'Amount (₨)' : f.type === 'BONUS' ? 'Bonus shares' : 'Quantity'}
    type="number" step="any" value={f.quantity}
    onChange={e => set('quantity', e.target.value)}
  />
  {f.type !== 'DIVIDEND' && f.type !== 'BONUS' && (
    <Input label="Price (₨)" type="number" step="0.01" value={f.price} onChange={e => set('price', e.target.value)} />
  )}
  {f.type !== 'BONUS' && (
    <div>
      <Input label="Fees (₨)" type="number" step="0.01" value={f.fees} onChange={e => set('fees', e.target.value)} />
      <button onClick={autoFees} className="text-[10px] mt-1 font-medium" style={{ color: C.accent }}>
        auto ({settings.defaultFees}%)
      </button>
    </div>
  )}
  {f.type !== 'BONUS' && (
    <Input label={f.type === 'DIVIDEND' ? 'Withholding Tax (₨)' : 'Tax (₨)'}
      type="number" step="0.01" value={f.tax} onChange={e => set('tax', e.target.value)} />
  )}
</div>

      <div className="rounded-xl p-3.5 text-[12px] font-mono flex gap-6 flex-wrap" style={{ background: C.bg, color: C.inkSoft }}>
        <span>Gross: <span style={{ color: C.ink, fontWeight: 600 }}>{fmtPKR(gross, 2)}</span></span>
        <span>Fees+Tax: <span style={{ color: C.neg }}>{fmtPKR(fees + tax, 2)}</span></span>
        <span>Net {f.type === 'BUY' ? 'Outflow' : 'Proceeds'}: <span style={{ color: C.ink, fontWeight: 600 }}>{fmtPKR(net, 2)}</span></span>
      </div>

      <details className="rounded-xl" style={{ border: `1px solid ${C.border}` }}>
        <summary className="cursor-pointer px-4 py-3 text-[13px] flex items-center gap-2 font-semibold" style={{ color: C.ink }}>
          <BookMarked className="w-4 h-4" /> Trade Journal — reasoning, emotion, lessons
        </summary>
        <div className="p-4 space-y-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Emotion" value={f.emotion} onChange={e => set('emotion', e.target.value)} options={EMOTIONS} />
            {f.type === 'SELL' && (
              <Select label="Outcome" value={f.outcome} onChange={e => set('outcome', e.target.value)} options={['', 'Win', 'Loss', 'Breakeven']} />
            )}
            {f.type === 'BUY' && (
              <Select label="Sentiment" value={f.sentiment} onChange={e => set('sentiment', e.target.value)} options={SENTIMENTS} />
            )}
          </div>
          <Textarea
            label={f.type === 'BUY' ? 'Entry Reason' : 'Exit Reason'}
            rows={2}
            value={f.type === 'BUY' ? f.entryReason : f.exitReason}
            onChange={e => set(f.type === 'BUY' ? 'entryReason' : 'exitReason', e.target.value)}
            placeholder="Thesis, setup, catalyst…"
          />
          <Textarea
            label="News / Lessons"
            rows={2}
            value={f.type === 'BUY' ? f.news : f.lessons}
            onChange={e => set(f.type === 'BUY' ? 'news' : 'lessons', e.target.value)}
          />
        </div>
      </details>

      <div className="flex justify-end pt-2">
        <Button variant="dark" onClick={submit}>{initial ? 'Update' : 'Record'} Transaction</Button>
      </div>
    </div>
  );
}
