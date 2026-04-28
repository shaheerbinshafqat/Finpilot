import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { C } from '../theme.jsx';
import { fmtPKR, fmtPct } from '../lib/format.js';
import { computeTaxLiability } from '../lib/tax.js';
import { Card, SectionTitle, Stat, Select, Button } from './ui.jsx';

export default function TaxTab({ state }) {
  const currentYear = new Date().getFullYear();
  const [taxYear, setTaxYear] = useState(
    new Date().getMonth() >= 6 ? currentYear : currentYear - 1
  );
  const [filerStatus, setFilerStatus] = useState('filer');

  const result = computeTaxLiability(
    state.transactions, taxYear, state.settings.costBasisMethod, filerStatus
  );

  const exportCSV = () => {
    const rows = [
      ['Ticker', 'Buy Date', 'Sell Date', 'Qty', 'Cost Basis', 'Sell Price', 'Gross Gain', 'Fees', 'Net Gain', 'Holding (yrs)', 'Rate', 'Tax'],
      ...result.realizedLots.map(r => [
        r.ticker, r.buyDate, r.sellDate, r.qty,
        r.costBasis.toFixed(2), r.sellPrice.toFixed(2),
        r.grossGain.toFixed(2), r.fees.toFixed(2), r.netGain.toFixed(2),
        r.holdYears.toFixed(2), (r.rate * 100).toFixed(1) + '%', r.tax.toFixed(2),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cgt-${taxYear}-${taxYear + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const years = [];
  for (let y = currentYear; y >= currentYear - 6; y--) years.push({ value: y, label: `FY ${y}–${y + 1}` });

  return (
    <div>
      <SectionTitle sub="Lot-level CGT by Pakistani holding-period brackets. Not tax advice — verify with a CA.">
        Tax Report
      </SectionTitle>

      <div className="mb-4 p-3 rounded-xl text-[11px] leading-relaxed" style={{ background: C.warnSoft, color: C.warn }}>
        <strong>Disclaimer:</strong> CGT rates are baseline brackets from the 2024–25 budget. Rates change yearly, 
        and there are exceptions (exempt securities, zakat deductions, advance tax adjustments, Sahulat scheme, etc.) 
        not modeled here. Use this as a planning tool. For filing, consult a CA.
      </div>

      <div className="flex gap-3 mb-4 flex-wrap items-end">
        <Select label="Tax year" value={taxYear} onChange={e => setTaxYear(Number(e.target.value))} options={years} />
        <Select label="Filer status" value={filerStatus} onChange={e => setFilerStatus(e.target.value)}
          options={[{ value: 'filer', label: 'Filer' }, { value: 'nonfiler', label: 'Non-filer' }]} />
        <div className="flex items-end ml-auto">
          <Button variant="dark" onClick={exportCSV} disabled={!result.realizedLots.length}>
            <Download className="inline w-3.5 h-3.5 mr-1.5" strokeWidth={2.5} />Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <Stat label="Total realized gain" value={fmtPKR(result.totalGain)}
          sub={`${result.realizedLots.length} closed lots`}
          tone={result.totalGain >= 0 ? 'pos' : 'neg'} />
        <Stat label="Estimated CGT" value={fmtPKR(result.totalTax)}
          sub={filerStatus === 'filer' ? 'Filer rates' : 'Non-filer rates'} tone="neg" />
        <Stat label="Net after tax" value={fmtPKR(result.totalGain - result.totalTax)}
          tone={(result.totalGain - result.totalTax) >= 0 ? 'pos' : 'neg'} />
        <Stat label="Effective rate" value={result.totalGain > 0 ? fmtPct((result.totalTax / result.totalGain) * 100, 1) : '—'} />
      </div>

      {Object.keys(result.bucketed).length > 0 && (
        <Card className="mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
            Gains by holding-period bracket
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Rate', 'Lots', 'Net gain', 'Tax'].map(h =>
                  <th key={h} className="text-left px-2 py-2 text-[10px] uppercase tracking-wider font-semibold"
                    style={{ color: C.muted }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="font-mono">
              {Object.entries(result.bucketed).sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])).map(([rate, b]) => (
                <tr key={rate} style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                  <td className="px-2 py-2.5" style={{ color: C.ink, fontWeight: 600 }}>{rate}</td>
                  <td className="px-2 py-2.5" style={{ color: C.inkSoft }}>{b.count}</td>
                  <td className="px-2 py-2.5" style={{ color: b.gain >= 0 ? C.pos : C.neg }}>{fmtPKR(b.gain)}</td>
                  <td className="px-2 py-2.5" style={{ color: C.neg, fontWeight: 600 }}>{fmtPKR(b.tax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {result.realizedLots.length === 0 ? (
        <Card className="py-14 text-center">
          <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: C.whisper }} />
          <div className="text-[13px]" style={{ color: C.whisper }}>
            No closed lots in FY {taxYear}–{taxYear + 1}.
          </div>
        </Card>
      ) : (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Ticker', 'Buy', 'Sell', 'Qty', 'Cost', 'Sold @', 'Net Gain', 'Held', 'Rate', 'Tax'].map(h =>
                    <th key={h} className="text-left px-3 py-3 text-[10px] uppercase tracking-wider font-semibold"
                      style={{ color: C.muted }}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody className="font-mono">
                {result.realizedLots.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                    <td className="px-3 py-2.5" style={{ color: C.ink, fontWeight: 600 }}>{r.ticker}</td>
                    <td className="px-3 py-2.5" style={{ color: C.inkSoft }}>{r.buyDate}</td>
                    <td className="px-3 py-2.5" style={{ color: C.inkSoft }}>{r.sellDate}</td>
                    <td className="px-3 py-2.5" style={{ color: C.ink }}>{r.qty}</td>
                    <td className="px-3 py-2.5" style={{ color: C.inkSoft }}>{r.costBasis.toFixed(2)}</td>
                    <td className="px-3 py-2.5" style={{ color: C.inkSoft }}>{r.sellPrice.toFixed(2)}</td>
                    <td className="px-3 py-2.5" style={{ color: r.netGain >= 0 ? C.pos : C.neg, fontWeight: 600 }}>
                      {fmtPKR(r.netGain)}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: C.inkSoft }}>{r.holdYears.toFixed(2)}y</td>
                    <td className="px-3 py-2.5" style={{ color: C.ink }}>{(r.rate * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2.5" style={{ color: C.neg, fontWeight: 600 }}>{fmtPKR(r.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}