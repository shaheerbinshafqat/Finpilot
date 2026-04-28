import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, XCircle, GitCompare } from 'lucide-react';
import { C } from '../theme.jsx';
import { fmtNum, fmtPKR } from '../lib/format.js';
import { holdingsAsOf, reconcile, parseBrokerStatement } from '../lib/reconcile.js';
import { Card, SectionTitle, Stat, Input, Textarea, Button, Pill } from './ui.jsx';

export default function ReconcileTab({ state }) {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [brokerText, setBrokerText] = useState('');
  const [result, setResult] = useState(null);

  const run = () => {
    const brokerRows = parseBrokerStatement(brokerText);
    if (!brokerRows.length) return alert('No valid rows parsed from broker statement');
    const app = holdingsAsOf(state.transactions, state.prices, state.settings.costBasisMethod, asOfDate);
    setResult(reconcile(app, brokerRows));
  };

  const iconFor = s => ({
    match: <CheckCircle2 className="w-3.5 h-3.5" style={{ color: C.pos }} />,
    'missing-in-app': <XCircle className="w-3.5 h-3.5" style={{ color: C.neg }} />,
    'missing-in-broker': <AlertCircle className="w-3.5 h-3.5" style={{ color: C.warn }} />,
    'app-higher': <AlertCircle className="w-3.5 h-3.5" style={{ color: C.warn }} />,
    'app-lower': <AlertCircle className="w-3.5 h-3.5" style={{ color: C.warn }} />,
  })[s];

  const toneFor = s => ({
    match: 'pos',
    'missing-in-app': 'neg',
    'missing-in-broker': 'warn',
    'app-higher': 'warn',
    'app-lower': 'warn',
  })[s];

  const labelFor = s => ({
    match: 'Match',
    'missing-in-app': 'Not in app',
    'missing-in-broker': 'Not at broker',
    'app-higher': 'App > broker',
    'app-lower': 'App < broker',
  })[s];

  return (
    <div>
      <SectionTitle sub="Paste your broker statement. App highlights mismatches so you can hunt down missing trades.">
        Reconcile
      </SectionTitle>

      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <Input label="As of date (broker statement date)" type="date" value={asOfDate}
            onChange={e => setAsOfDate(e.target.value)} />
          <div className="flex items-end">
            <Button variant="dark" onClick={run} className="w-full">
              <GitCompare className="inline w-3.5 h-3.5 mr-1.5" strokeWidth={2.5} />Run reconciliation
            </Button>
          </div>
        </div>
        <Textarea
          label="Broker statement (one per line: TICKER QUANTITY [AVG_PRICE])"
          rows={8}
          value={brokerText}
          onChange={e => setBrokerText(e.target.value)}
          placeholder={'LUCK 100 845.50\nOGDC 500 178.20\nHBL 200\nMEBL, 150, 224.75'}
        />
        <div className="text-[11px] mt-2" style={{ color: C.muted }}>
          Avg price column is optional. Download your CDC/broker holding statement and paste the rows here.
        </div>
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-5 gap-4 mb-4">
            <Stat label="Total tickers" value={result.summary.total} />
            <Stat label="Matching" value={result.summary.matching} tone="pos" />
            <Stat label="Missing in app" value={result.summary.missingInApp}
              tone={result.summary.missingInApp ? 'neg' : 'neutral'} sub="Buys you forgot to log" />
            <Stat label="Missing at broker" value={result.summary.missingInBroker}
              tone={result.summary.missingInBroker ? 'warn' : 'neutral'} sub="Sold but not recorded?" />
            <Stat label="Qty mismatch" value={result.summary.mismatched}
              tone={result.summary.mismatched ? 'warn' : 'neutral'} />
          </div>

          <Card pad={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['', 'Ticker', 'App qty', 'Broker qty', 'Difference', 'Status', 'Notes'].map(h =>
                      <th key={h} className="text-left px-3 py-3 text-[10px] uppercase tracking-wider font-semibold"
                        style={{ color: C.muted }}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {result.rows.map(r => (
                    <tr key={r.ticker} style={{
                      borderBottom: `1px solid ${C.borderSoft}`,
                      background: r.status === 'match' ? 'transparent' : C.warnSoft,
                    }}>
                      <td className="px-3 py-2.5">{iconFor(r.status)}</td>
                      <td className="px-3 py-2.5" style={{ color: C.ink, fontWeight: 600 }}>{r.ticker}</td>
                      <td className="px-3 py-2.5" style={{ color: C.inkSoft }}>{fmtNum(r.appQty, 0)}</td>
                      <td className="px-3 py-2.5" style={{ color: C.inkSoft }}>{fmtNum(r.brokerQty, 0)}</td>
                      <td className="px-3 py-2.5" style={{ color: r.diff === 0 ? C.muted : C.neg, fontWeight: 600 }}>
                        {r.diff === 0 ? '—' : (r.diff > 0 ? '+' : '') + fmtNum(r.diff, 0)}
                      </td>
                      <td className="px-3 py-2.5"><Pill tone={toneFor(r.status)}>{labelFor(r.status)}</Pill></td>
                      <td className="px-3 py-2.5 text-[11px]" style={{ color: C.muted, fontFamily: 'Inter' }}>
                        {r.status === 'missing-in-app' && 'Add a BUY transaction'}
                        {r.status === 'missing-in-broker' && 'Check if you sold but forgot to log'}
                        {r.status === 'app-higher' && `App thinks you own ${Math.abs(r.diff)} extra — missing SELL?`}
                        {r.status === 'app-lower' && `Broker shows ${Math.abs(r.diff)} more — missing BUY/BONUS?`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}