import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Target,
  DollarSign, Receipt, Plus, Sparkles, AlertTriangle,
} from 'lucide-react';
import { C, CHART_COLORS } from '../theme.jsx';
import { fmtPKR, fmtPct, fmtNum } from '../lib/format.js';
import { Card, SectionTitle, Stat, Button, EmptyChart } from './ui.jsx';

function FeatureCard({ stock, kind }) {
  if (!stock) return (
    <Card>
      <div
        className="text-[11px] font-semibold uppercase tracking-wider mb-1"
        style={{ color: C.muted }}
      >
        {kind === 'best' ? 'Top performer' : 'Biggest laggard'}
      </div>
      <div className="text-[13px] py-8 text-center" style={{ color: C.whisper }}>
        No holdings to feature
      </div>
    </Card>
  );
  const isUp = stock.unrealizedPct >= 0;
  const accent = kind === 'best' ? C.pos : C.neg;
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5"
            style={{ color: accent }}
          >
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {kind === 'best' ? 'Top performer' : 'Biggest laggard'}
          </div>
          <div className="font-display text-[24px] font-bold leading-none" style={{ color: C.ink }}>
            {stock.ticker}
          </div>
          <div className="text-[11px] mt-1 truncate max-w-[180px]" style={{ color: C.muted }}>
            {stock.name}
          </div>
        </div>
        <div className="text-right">
          <div
            className="font-mono text-[18px] font-bold"
            style={{ color: isUp ? C.pos : C.neg }}
          >{fmtPct(stock.unrealizedPct)}</div>
          <div className="font-mono text-[11px] mt-0.5" style={{ color: C.muted }}>
            {fmtPKR(stock.unrealized)}
          </div>
        </div>
      </div>
      <div
        className="flex items-center gap-4 pt-3"
        style={{ borderTop: `1px solid ${C.borderSoft}` }}
      >
        <div>
          <div className="text-[10px] font-medium" style={{ color: C.muted }}>Qty</div>
          <div className="font-mono text-[12px] font-semibold" style={{ color: C.ink }}>
            {fmtNum(stock.quantity, 0)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium" style={{ color: C.muted }}>Avg cost</div>
          <div className="font-mono text-[12px] font-semibold" style={{ color: C.ink }}>
            {fmtNum(stock.avgPrice, 2)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium" style={{ color: C.muted }}>Held</div>
          <div className="font-mono text-[12px] font-semibold" style={{ color: C.ink }}>
            {stock.holdingDays}d
          </div>
        </div>
      </div>
    </Card>
  );
}

function SmartInsights({ state, holdings, cash }) {
  const insights = [];
  const value = holdings.reduce((s, h) => s + h.currentValue, 0);
  const invested = holdings.reduce((s, h) => s + h.invested, 0);
  const total = value + cash;
  const limit = state.settings.concentrationLimit || 25;

  holdings.forEach(h => {
    if (value > 0 && (h.currentValue / value) * 100 > limit) {
      insights.push({
        tone: 'warn',
        text: `${h.ticker} is ${((h.currentValue / value) * 100).toFixed(1)}% of your portfolio — above your ${limit}% limit.`,
      });
    }
    if (h.holdingDays > 60 && h.unrealizedPct < -10) {
      insights.push({
        tone: 'warn',
        text: `${h.ticker} down ${h.unrealizedPct.toFixed(1)}% for ${h.holdingDays} days. Revisit your thesis.`,
      });
    }
    if (h.unrealizedPct > 50) {
      insights.push({
        tone: 'pos',
        text: `${h.ticker} is up ${h.unrealizedPct.toFixed(1)}%. Consider partial profit-booking or a trailing stop.`,
      });
    }
  });

  if (total > 0) {
    const cashPct = (cash / total) * 100;
    if (cashPct > 40) insights.push({
      tone: 'info',
      text: `Holding ${cashPct.toFixed(0)}% cash — good for opportunities, but inflation erodes idle PKR.`,
    });
    if (cashPct < 5 && holdings.length > 0) insights.push({
      tone: 'info',
      text: `Only ${cashPct.toFixed(1)}% cash — limited dry powder for corrections.`,
    });
  }

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const catMap = {};
  state.expenses.filter(e => e.date.startsWith(thisMonth)).forEach(e => {
    catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
  });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  if (topCat) insights.push({
    tone: 'info',
    text: `Biggest expense category this month: ${topCat[0]} (${fmtPKR(topCat[1])}).`,
  });

  const kse = state.kseHistory;
  if (kse.length >= 2 && invested > 0) {
    const first = kse[0].value;
    const last = kse[kse.length - 1].value;
    const kseRet = ((last - first) / first) * 100;
    const portRet = ((value - invested) / invested) * 100;
    const diff = portRet - kseRet;
    insights.push({
      tone: diff >= 0 ? 'pos' : 'warn',
      text: `You're ${diff >= 0 ? 'beating' : 'trailing'} KSE-100 by ${Math.abs(diff).toFixed(1)}% (You: ${portRet.toFixed(1)}% vs. KSE: ${kseRet.toFixed(1)}%).`,
    });
  }

  const closedByStrategy = {};
  state.transactions.filter(t => t.type === 'SELL' && t.strategy).forEach(t => {
    if (!closedByStrategy[t.strategy]) closedByStrategy[t.strategy] = { wins: 0, losses: 0 };
    if (t.outcome === 'Win') closedByStrategy[t.strategy].wins++;
    else if (t.outcome === 'Loss') closedByStrategy[t.strategy].losses++;
  });
  const stratEntries = Object.entries(closedByStrategy).filter(([, v]) => v.wins + v.losses >= 3);
  if (stratEntries.length) {
    const best = stratEntries.sort(
      (a, b) => (b[1].wins / (b[1].wins + b[1].losses)) - (a[1].wins / (a[1].wins + a[1].losses))
    )[0];
    const wr = (best[1].wins / (best[1].wins + best[1].losses)) * 100;
    insights.push({
      tone: 'pos',
      text: `Most profitable strategy: "${best[0]}" at ${wr.toFixed(0)}% win rate over ${best[1].wins + best[1].losses} closed trades.`,
    });
  }

  // Holding-duration pattern
  const allClosed = holdings.flatMap(h => h.closedTrades || []);
  if (allClosed.length >= 4) {
    const buckets = { '0-7d': [], '8-30d': [], '31-90d': [], '90d+': [] };
    allClosed.forEach(t => {
      const days = Math.round((new Date(t.sellDate) - new Date(t.buyDate)) / 86400000);
      const b = days <= 7 ? '0-7d' : days <= 30 ? '8-30d' : days <= 90 ? '31-90d' : '90d+';
      buckets[b].push(t.pnlPct);
    });
    const bucketStats = Object.entries(buckets)
      .filter(([, arr]) => arr.length >= 2)
      .map(([k, arr]) => ({ bucket: k, avg: arr.reduce((s, x) => s + x, 0) / arr.length, n: arr.length }));
    if (bucketStats.length >= 2) {
      const best = bucketStats.sort((a, b) => b.avg - a.avg)[0];
      insights.push({
        tone: 'info',
        text: `Best holding window: ${best.bucket} (${best.avg >= 0 ? '+' : ''}${best.avg.toFixed(1)}% avg over ${best.n} closed trades).`,
      });
    }
  }

  if (!insights.length) {
    return (
      <div className="text-[13px] py-6 text-center" style={{ color: C.whisper }}>
        As you log trades and expenses, insights will appear here.
      </div>
    );
  }

  const tones = {
    warn: { bg: C.warnSoft, fg: C.warn, Icon: AlertTriangle },
    pos: { bg: C.posSoft, fg: C.pos, Icon: TrendingUp },
    info: { bg: C.infoSoft, fg: C.info, Icon: Sparkles },
  };

  return (
    <div className="space-y-2 max-h-[180px] overflow-y-auto scroll-thin pr-1">
      {insights.slice(0, 8).map((ins, i) => {
        const t = tones[ins.tone];
        const Icon = t.Icon;
        return (
          <div
            key={i}
            className="text-[12.5px] leading-snug px-3 py-2.5 rounded-xl flex gap-2.5 items-start"
            style={{ background: t.bg }}
          >
            <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: t.fg }} />
            <span style={{ color: C.ink }}>{ins.text}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard({ state, holdings, cash, setTab }) {
  const invested = holdings.reduce((s, h) => s + h.invested, 0);
  const value = holdings.reduce((s, h) => s + h.currentValue, 0);
  const unrealized = value - invested;
  const realized = holdings.reduce((s, h) => s + h.realized, 0);
  const returnPct = invested > 0 ? (unrealized / invested) * 100 : 0;

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthExpenses = state.expenses
    .filter(e => e.date.startsWith(thisMonth))
    .reduce((s, e) => s + Number(e.amount), 0);
  const deposits = state.cashMoves
    .filter(m => m.type === 'DEPOSIT' && m.date.startsWith(thisMonth))
    .reduce((s, m) => s + Number(m.amount), 0);
  const netSavings = deposits - monthExpenses;

  const bestStock = holdings.length
    ? [...holdings].sort((a, b) => b.unrealizedPct - a.unrealizedPct)[0]
    : null;
  const worstStock = holdings.length
    ? [...holdings].sort((a, b) => a.unrealizedPct - b.unrealizedPct)[0]
    : null;

  const sectorMap = {};
  holdings.forEach(h => {
    sectorMap[h.sector || 'Other'] = (sectorMap[h.sector || 'Other'] || 0) + h.currentValue;
  });
  const sectorData = Object.entries(sectorMap)
    .map(([name, v]) => ({ name, value: v, pct: value > 0 ? (v / value) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);

  const history = state.portfolioHistory.slice(-90).map(p => ({ ...p, label: p.date.slice(5) }));

  const catMap = {};
  state.expenses.filter(e => e.date.startsWith(thisMonth)).forEach(e => {
    catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
  });
  const expenseData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <SectionTitle sub={`${holdings.length} position${holdings.length === 1 ? '' : 's'} · ${state.settings.costBasisMethod}`}>
        Overview
      </SectionTitle>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <Card className="col-span-12 lg:col-span-7">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[11px] font-medium mb-1" style={{ color: C.muted }}>
                Portfolio Value
              </div>
              <div
                className="font-display text-[44px] font-bold leading-none tracking-tight"
                style={{ color: C.ink }}
              >
                {fmtPKR(value)}
              </div>
              <div className="mt-2 flex items-center gap-2 text-[12px]">
                <span
                  className="font-semibold inline-flex items-center gap-1"
                  style={{ color: unrealized >= 0 ? C.pos : C.neg }}
                >
                  {unrealized >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {fmtPct(returnPct)}
                </span>
                <span style={{ color: C.muted }}>
                  {unrealized >= 0 ? '+' : ''}{fmtPKR(unrealized)} overall
                </span>
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: C.muted }}
            >
              <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: C.pos }} />
              Live
            </div>
          </div>
          <div className="h-[220px]">
            {history.length > 1 ? (
              <ResponsiveContainer>
                <AreaChart data={history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPortfolio" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.accent} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 10 }} stroke={C.border} />
                  <YAxis tick={{ fill: C.muted, fontSize: 10 }} stroke={C.border} width={60} tickFormatter={v => fmtPKR(v)} />
                  <Tooltip
                    contentStyle={{
                      background: C.cardElev, border: `1px solid ${C.border}`, borderRadius: 12,
                      fontSize: 12, color: C.ink, boxShadow: 'var(--shadow-elev)',
                    }}
                    labelStyle={{ color: C.muted, fontSize: 11 }}
                    formatter={v => fmtPKR(v)}
                  />
                  <Area type="monotone" dataKey="value" stroke={C.accent} fill="url(#gradPortfolio)" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="invested" stroke={C.muted} strokeWidth={1} strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="Chart fills in as daily snapshots accrue." />}
          </div>
        </Card>

        <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-4">
          <Stat label="Net Worth" value={fmtPKR(value + cash)} sub="Portfolio + cash" icon={<Wallet className="w-4 h-4" style={{ color: C.muted }} />} />
          <Stat label="Unrealized P&L" value={fmtPKR(unrealized)} sub={fmtPct(returnPct)} tone={unrealized >= 0 ? 'pos' : 'neg'} icon={<TrendingUp className="w-4 h-4" style={{ color: C.muted }} />} />
          <Stat label="Realized P&L" value={fmtPKR(realized)} sub={`via ${state.settings.costBasisMethod}`} tone={realized >= 0 ? 'pos' : 'neg'} icon={<Target className="w-4 h-4" style={{ color: C.muted }} />} />
          <Stat label="Cash" value={fmtPKR(cash)} sub="Dry powder" icon={<DollarSign className="w-4 h-4" style={{ color: C.muted }} />} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <Stat label="Expenses — This Month" value={fmtPKR(monthExpenses)} sub={`${state.expenses.filter(e => e.date.startsWith(thisMonth)).length} transactions`} tone="neg" icon={<Receipt className="w-4 h-4" style={{ color: C.muted }} />} className="col-span-6 lg:col-span-3" />
        <Stat label="Deposits — This Month" value={fmtPKR(deposits)} sub="Capital in" tone="pos" className="col-span-6 lg:col-span-3" />
        <Stat label="Net Savings" value={fmtPKR(netSavings)} sub="Deposits − Expenses" tone={netSavings >= 0 ? 'pos' : 'neg'} className="col-span-6 lg:col-span-3" />
        <Stat label="Invested / Total" value={`${value + cash > 0 ? ((value / (value + cash)) * 100).toFixed(0) : 0}%`} sub="Deployment ratio" tone="accent" className="col-span-6 lg:col-span-3" />
      </div>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-4">
          <FeatureCard stock={bestStock} kind="best" />
          <FeatureCard stock={worstStock} kind="worst" />
        </div>

        <Card className="col-span-12 lg:col-span-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-[14px]" style={{ color: C.ink }}>Sector allocation</div>
            <span className="text-[11px]" style={{ color: C.muted }}>{sectorData.length} sectors</span>
          </div>
          <div className="h-[170px]">
            {sectorData.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={sectorData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {sectorData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke={C.card} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: C.cardElev, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12 }}
                    formatter={(v, n) => [fmtPKR(v), n]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="No holdings" small />}
          </div>
          <div className="space-y-1.5 mt-2">
            {sectorData.slice(0, 4).map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="truncate" style={{ color: C.inkSoft }}>{s.name}</span>
                </div>
                <span className="font-mono font-semibold" style={{ color: C.ink }}>
                  {s.pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <Card className="col-span-12 lg:col-span-4">
          <div className="font-semibold text-[14px] mb-1" style={{ color: C.ink }}>Spending mix</div>
          <div className="text-[11px] mb-2" style={{ color: C.muted }}>This month, by category</div>
          <div className="h-[180px]">
            {expenseData.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={expenseData} dataKey="value" nameKey="name" outerRadius={70} paddingAngle={3}>
                    {expenseData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke={C.card} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: C.cardElev, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12 }}
                    formatter={(v, n) => [fmtPKR(v), n]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart text="Log expenses to see" small />}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" style={{ color: C.accent }} fill={C.accent} />
            <div className="font-semibold text-[14px]" style={{ color: C.ink }}>Smart insights</div>
          </div>
          <SmartInsights state={state} holdings={holdings} cash={cash} />
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant="dark" onClick={() => setTab('transactions')}>
          <Plus className="inline w-3.5 h-3.5 mr-1.5" strokeWidth={2.5} />New Transaction
        </Button>
        <Button variant="ghost" onClick={() => setTab('expenses')}>Log Expense</Button>
        <Button variant="ghost" onClick={() => setTab('alerts')}>Set Alert</Button>
        <Button variant="ghost" onClick={() => setTab('analytics')}>View Analytics</Button>
      </div>
    </div>
  );
}
