import React, { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { C } from '../theme.jsx';
import { xirr, cagr, maxDrawdown } from '../lib/finance.js';
import { fmtPct } from '../lib/format.js';
import { Card, SectionTitle, Stat, EmptyChart } from './ui.jsx';

//NEW
import { dailyReturns, sharpe, sortino, beta, correlation, volatility, benchmarkReturns } from '../lib/statistics.js';

export default function AnalyticsTab({ state, holdings }) {
  const value = holdings.reduce((s, h) => s + h.currentValue, 0);
  const invested = holdings.reduce((s, h) => s + h.invested, 0);

  const flows = [];
  state.transactions.forEach(t => {
    const d = new Date(t.date);
    const gross = Number(t.quantity) * Number(t.price);
    const fees = Number(t.fees || 0) + Number(t.tax || 0);
    flows.push({ date: d, amount: t.type === 'BUY' ? -(gross + fees) : (gross - fees) });
  });
  if (value > 0) flows.push({ date: new Date(), amount: value });
  flows.sort((a, b) => a.date - b.date);
  const xirrVal = xirr(flows);

  const firstBuy = state.transactions
    .filter(t => t.type === 'BUY')
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const years = firstBuy ? (Date.now() - new Date(firstBuy.date)) / (365.25 * 86400000) : 0;
  const cagrVal = invested > 0 && years > 0.03 ? cagr(invested, value, years) : null;

  const mdd = maxDrawdown(state.portfolioHistory);

  const calcReturn = days => {
    const hist = state.portfolioHistory;
    if (hist.length < 2) return null;
    const now = hist[hist.length - 1].value;
    const target = Date.now() - days * 86400000;
    const past = [...hist].reverse().find(p => new Date(p.date) <= new Date(target));
    if (!past || past.value <= 0) return null;
    return ((now - past.value) / past.value) * 100;
  };

  const daily = [];
  for (let i = 1; i < state.portfolioHistory.length; i++) {
    const prev = state.portfolioHistory[i - 1].value;
    const curr = state.portfolioHistory[i].value;
    if (prev > 0) daily.push({ date: state.portfolioHistory[i].date, ret: ((curr - prev) / prev) * 100 });
  }
  const bestDay = daily.length ? daily.reduce((a, b) => b.ret > a.ret ? b : a) : null;
  const worstDay = daily.length ? daily.reduce((a, b) => b.ret < a.ret ? b : a) : null;
  const posDays = daily.filter(d => d.ret > 0).length;
  const winDayPct = daily.length ? (posDays / daily.length) * 100 : 0;


  const [compareWith, setCompareWith] = useState('kse100');
const activeBenchmark = state.benchmarks?.[compareWith] || [];
let benchmarkCompare = null;
if (activeBenchmark.length >= 2) {
  const b0 = activeBenchmark[0].value;
  const b1 = activeBenchmark[activeBenchmark.length - 1].value;
  const benchRet = ((b1 - b0) / b0) * 100;
  const portRet = invested > 0 ? ((value - invested) / invested) * 100 : 0;
  benchmarkCompare = { benchRet, portRet, alpha: portRet - benchRet };
}

  // NEW ↓↓↓
  const riskFreeRate = state.settings.riskFreeRate || 0.20;
  const portfolioReturns = dailyReturns(state.portfolioHistory);
  const benchReturns = benchmarkReturns(state.kseHistory);


  const sharpeVal = sharpe(portfolioReturns, riskFreeRate);
  const sortinoVal = sortino(portfolioReturns, riskFreeRate);
  const betaVal = beta(portfolioReturns, benchReturns);
  const corrVal = correlation(portfolioReturns, benchReturns);
  const volVal = volatility(portfolioReturns);
  const kseVol = volatility(benchReturns);

  return (
    <div>
      <SectionTitle sub="The metrics that actually matter.">Analytics</SectionTitle>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <Stat label="XIRR" value={xirrVal !== null ? fmtPct(xirrVal * 100) : '—'} sub="Annualized, time-weighted"
          tone={xirrVal > 0 ? 'pos' : xirrVal < 0 ? 'neg' : 'neutral'} />
        <Stat label="CAGR" value={cagrVal !== null ? fmtPct(cagrVal * 100) : '—'} sub={firstBuy ? `Since ${firstBuy.date}` : '—'}
          tone={cagrVal > 0 ? 'pos' : cagrVal < 0 ? 'neg' : 'neutral'} />
        <Stat label="Max Drawdown" value={fmtPct(mdd * 100)} sub="Peak-to-trough" tone="neg" />
        <Stat label="Win Days" value={`${winDayPct.toFixed(0)}%`} sub={`${posDays}/${daily.length} positive`}
          tone={winDayPct >= 50 ? 'pos' : 'neg'} />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        {[{ d: 1, l: '1 Day' }, { d: 7, l: '1 Week' }, { d: 30, l: '1 Month' }, { d: 90, l: '3 Months' }].map(({ d, l }) => {
          const r = calcReturn(d);
          return <Stat key={l} label={`${l} Return`} value={r !== null ? fmtPct(r) : '—'}
            tone={r > 0 ? 'pos' : r < 0 ? 'neg' : 'neutral'} />;
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card>
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>Best / worst days</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-medium" style={{ color: C.muted }}>Best</div>
              <div className="font-display text-[24px] font-bold mt-1" style={{ color: C.pos }}>
                {bestDay ? fmtPct(bestDay.ret) : '—'}
              </div>
              <div className="text-[11px] mt-1 font-mono" style={{ color: C.muted }}>{bestDay?.date || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium" style={{ color: C.muted }}>Worst</div>
              <div className="font-display text-[24px] font-bold mt-1" style={{ color: C.neg }}>
                {worstDay ? fmtPct(worstDay.ret) : '—'}
              </div>
              <div className="text-[11px] mt-1 font-mono" style={{ color: C.muted }}>{worstDay?.date || '—'}</div>
            </div>
          </div>
        </Card>

        
          {/* NEW */}

          <Card className="mb-4">
  <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
    Risk-adjusted metrics
  </div>
  <div className="grid grid-cols-3 gap-4 text-[12px]">
    <div>
      <div className="text-[10px] font-medium mb-1" style={{ color: C.muted }}>Sharpe ratio</div>
      <div className="font-mono text-[20px] font-bold" style={{ color: sharpeVal > 1 ? C.pos : sharpeVal < 0 ? C.neg : C.ink }}>
        {sharpeVal !== null ? sharpeVal.toFixed(2) : '—'}
      </div>
      <div className="text-[10px]" style={{ color: C.muted }}>
        {sharpeVal > 1 ? 'Good risk-adjusted return' : sharpeVal > 0.5 ? 'Acceptable' : sharpeVal > 0 ? 'Poor' : 'Losing money vs. T-bill'}
      </div>
    </div>
    <div>
      <div className="text-[10px] font-medium mb-1" style={{ color: C.muted }}>Sortino ratio</div>
      <div className="font-mono text-[20px] font-bold" style={{ color: sortinoVal > 1 ? C.pos : sortinoVal < 0 ? C.neg : C.ink }}>
        {sortinoVal !== null ? sortinoVal.toFixed(2) : '—'}
      </div>
      <div className="text-[10px]" style={{ color: C.muted }}>Downside-adjusted</div>
    </div>
    <div>
      <div className="text-[10px] font-medium mb-1" style={{ color: C.muted }}>Beta vs. KSE-100</div>
      <div className="font-mono text-[20px] font-bold" style={{ color: C.ink }}>
        {betaVal !== null ? betaVal.toFixed(2) : '—'}
      </div>
      <div className="text-[10px]" style={{ color: C.muted }}>
        {betaVal > 1.2 ? 'More volatile than market' : betaVal > 0.8 ? 'Moves with market' : betaVal > 0 ? 'Defensive' : 'Inverse to market'}
      </div>
    </div>
    <div>
      <div className="text-[10px] font-medium mb-1" style={{ color: C.muted }}>Correlation with KSE</div>
      <div className="font-mono text-[20px] font-bold" style={{ color: C.ink }}>
        {corrVal !== null ? corrVal.toFixed(2) : '—'}
      </div>
    </div>
    <div>
      <div className="text-[10px] font-medium mb-1" style={{ color: C.muted }}>Your volatility</div>
      <div className="font-mono text-[20px] font-bold" style={{ color: C.ink }}>
        {volVal !== null ? (volVal * 100).toFixed(1) + '%' : '—'}
      </div>
      <div className="text-[10px]" style={{ color: C.muted }}>Annualized</div>
    </div>
    <div>
      <div className="text-[10px] font-medium mb-1" style={{ color: C.muted }}>KSE-100 volatility</div>
      <div className="font-mono text-[20px] font-bold" style={{ color: C.ink }}>
        {kseVol !== null ? (kseVol * 100).toFixed(1) + '%' : '—'}
      </div>
      <div className="text-[10px]" style={{ color: C.muted }}>Annualized</div>
    </div>
  </div>
  <div className="text-[11px] mt-4 p-3 rounded-xl" style={{ background: C.infoSoft, color: C.info }}>
    <strong>Interpreting:</strong> Sharpe &gt; 1 means you're earning meaningful return per unit of risk. 
    Beta of 1.0 means your portfolio moves with KSE-100. Beta of 1.5 means 50% more volatile than the market (higher risk).
    These need 30+ daily snapshots to be meaningful — right now you have {portfolioReturns.length}.
  </div>
</Card>

<Card>
  <div className="flex items-center justify-between mb-3">
    <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
      Vs. benchmark
    </div>
  </div>

  <div className="flex gap-2 mb-3 flex-wrap">
    {[
      { id: 'kse100', label: 'KSE-100' },
      { id: 'kse30', label: 'KSE-30' },
      { id: 'kmi30', label: 'KMI-30' },
      { id: 'tbill', label: 'T-bill' },
      { id: 'inflation', label: 'Inflation' },
    ].map(b => (
      <button key={b.id} onClick={() => setCompareWith(b.id)}
        className="px-3 py-1.5 rounded-lg text-[11px] font-medium"
        style={{
          background: compareWith === b.id ? C.ink : C.card,
          color: compareWith === b.id ? C.bg : C.inkSoft,
          border: `1px solid ${C.border}`,
        }}>{b.label}</button>
    ))}
  </div>

  {benchmarkCompare ? (
    <div className="space-y-2.5">
      <div className="flex justify-between text-[12px]">
        <span style={{ color: C.inkSoft }}>Your return</span>
        <span className="font-mono font-semibold" style={{ color: benchmarkCompare.portRet >= 0 ? C.pos : C.neg }}>
          {fmtPct(benchmarkCompare.portRet)}
        </span>
      </div>
      <div className="flex justify-between text-[12px]">
        <span style={{ color: C.inkSoft }}>Benchmark return</span>
        <span className="font-mono font-semibold" style={{ color: benchmarkCompare.benchRet >= 0 ? C.pos : C.neg }}>
          {fmtPct(benchmarkCompare.benchRet)}
        </span>
      </div>
      <div className="flex justify-between text-[13px] pt-3 mt-1" style={{ borderTop: `1px solid ${C.border}` }}>
        <span className="uppercase tracking-wider text-[10px] font-bold" style={{ color: C.ink }}>Alpha</span>
        <span className="font-mono font-bold text-[15px]" style={{ color: benchmarkCompare.alpha >= 0 ? C.pos : C.neg }}>
          {fmtPct(benchmarkCompare.alpha)}
        </span>
      </div>
    </div>
  ) : (
    <div className="text-[11px]" style={{ color: C.whisper }}>
      Log benchmark values in Settings → Benchmarks to compare.
    </div>
  )}
</Card>
      </div>

      <Card>
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
          Daily return distribution
        </div>
        <div className="h-[240px]">
          {daily.length > 1 ? (
            <ResponsiveContainer>
              <BarChart data={daily}>
                <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 9 }} stroke={C.border} />
                <YAxis tick={{ fill: C.muted, fontSize: 10 }} stroke={C.border} tickFormatter={v => v + '%'} />
                <Tooltip contentStyle={{ background: C.cardElev, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12 }}
                  formatter={v => `${v.toFixed(2)}%`} />
                <ReferenceLine y={0} stroke={C.border} />
                <Bar dataKey="ret" radius={[3, 3, 0, 0]}>
                  {daily.map((d, i) => <Cell key={i} fill={d.ret >= 0 ? C.pos : C.neg} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart text="Need more daily snapshots — they accrue automatically." />}
        </div>
      </Card>
    </div>
  );
}
