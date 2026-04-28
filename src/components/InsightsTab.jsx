import React, { useMemo } from 'react';
import {
  Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Target,
  PieChart as PieIcon, Clock, Award, ShieldAlert, Sparkles, BarChart3,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { C, CHART_COLORS } from '../theme.jsx';
import { fmtPKR, fmtPct } from '../lib/format.js';
import { Card, SectionTitle } from './ui.jsx';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';

function InsightCard({ icon: Icon, iconColor, title, description, tone = 'neutral' }) {
  const bgMap = { pos: C.posSoft, neg: C.negSoft, warn: C.warnSoft, info: C.infoSoft, neutral: C.hover, accent: C.accentSoft };
  const fgMap = { pos: C.pos, neg: C.neg, warn: C.warn, info: C.info, neutral: C.inkSoft, accent: C.accent };
  return (
    <div
      className="rounded-xl p-4 flex gap-3 items-start transition-all"
      style={{ background: bgMap[tone], border: `1px solid transparent` }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${fgMap[tone]}15` }}>
        <Icon className="w-4.5 h-4.5" style={{ color: iconColor || fgMap[tone] }} />
      </div>
      <div>
        <div className="text-[13px] font-semibold mb-0.5" style={{ color: C.ink }}>{title}</div>
        <div className="text-[12px] leading-relaxed" style={{ color: C.inkSoft }}>{description}</div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, sub, tone = 'neutral' }) {
  const color = { pos: C.pos, neg: C.neg, neutral: C.ink, accent: C.accent }[tone];
  return (
    <Card>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>{label}</div>
      <div className="text-[24px] font-bold font-display leading-none" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] mt-1.5 font-medium" style={{ color: C.muted }}>{sub}</div>}
    </Card>
  );
}

export default function InsightsTab({ state, holdings, cash }) {
  const insights = useMemo(() => {
    const result = [];
    const value = holdings.reduce((s, h) => s + h.currentValue, 0);
    const invested = holdings.reduce((s, h) => s + h.invested, 0);
    const total = value + cash;
    const limit = state.settings.concentrationLimit || 25;

    // ── CONCENTRATION RISK ──
    holdings.forEach(h => {
      if (value > 0 && (h.currentValue / value) * 100 > limit) {
        result.push({
          icon: ShieldAlert, tone: 'warn',
          title: `High concentration: ${h.ticker}`,
          description: `${h.ticker} represents ${((h.currentValue / value) * 100).toFixed(1)}% of your portfolio — above your ${limit}% limit. Consider diversifying.`,
        });
      }
    });

    // ── UNDERPERFORMERS ──
    holdings.forEach(h => {
      if (h.holdingDays > 60 && h.unrealizedPct < -10) {
        result.push({
          icon: TrendingDown, tone: 'neg',
          title: `${h.ticker} underperforming`,
          description: `Down ${Math.abs(h.unrealizedPct).toFixed(1)}% over ${h.holdingDays} days. Time to revisit your thesis — has the fundamentals changed?`,
        });
      }
    });

    // ── PROFIT-TAKING ──
    holdings.forEach(h => {
      if (h.unrealizedPct > 50) {
        result.push({
          icon: Award, tone: 'pos',
          title: `${h.ticker} — consider booking profits`,
          description: `Up ${h.unrealizedPct.toFixed(1)}%. Consider partial profit-booking or setting a trailing stop to protect gains.`,
        });
      }
    });

    // ── CASH POSITION ──
    if (total > 0) {
      const cashPct = (cash / total) * 100;
      if (cashPct > 40) result.push({
        icon: Target, tone: 'info',
        title: 'High cash allocation',
        description: `You're holding ${cashPct.toFixed(0)}% in cash. Good for opportunities, but inflation erodes idle PKR over time.`,
      });
      if (cashPct < 5 && holdings.length > 0) result.push({
        icon: AlertTriangle, tone: 'warn',
        title: 'Very low cash reserves',
        description: `Only ${cashPct.toFixed(1)}% cash — limited dry powder for corrections or emergencies.`,
      });
    }

    // ── MARKET COMPARISON ──
    const kse = state.kseHistory || [];
    if (kse.length >= 2 && invested > 0) {
      const first = kse[0].value;
      const last = kse[kse.length - 1].value;
      const kseRet = ((last - first) / first) * 100;
      const portRet = ((value - invested) / invested) * 100;
      const diff = portRet - kseRet;
      result.push({
        icon: BarChart3, tone: diff >= 0 ? 'pos' : 'warn',
        title: diff >= 0 ? 'Beating the market' : 'Trailing the market',
        description: `Your return: ${portRet.toFixed(1)}% vs KSE-100: ${kseRet.toFixed(1)}%. You're ${diff >= 0 ? 'outperforming' : 'underperforming'} by ${Math.abs(diff).toFixed(1)}%.`,
      });
    }

    // ── STRATEGY ANALYSIS ──
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
      result.push({
        icon: Award, tone: 'pos',
        title: `Best strategy: "${best[0]}"`,
        description: `${wr.toFixed(0)}% win rate over ${best[1].wins + best[1].losses} closed trades. Your long-term strategies tend to pay off.`,
      });
    }

    // ── HOLDING DURATION ──
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
        const worst = bucketStats.sort((a, b) => a.avg - b.avg)[0];
        result.push({
          icon: Clock, tone: 'info',
          title: `Best holding window: ${best.bucket}`,
          description: `Avg return of ${best.avg >= 0 ? '+' : ''}${best.avg.toFixed(1)}% over ${best.n} trades. Worst: ${worst.bucket} at ${worst.avg.toFixed(1)}%.`,
        });
      }
    }

    // ── EXPENSE INSIGHT ──
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const catMap = {};
    state.expenses.filter(e => e.date.startsWith(thisMonth)).forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
    });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      result.push({
        icon: PieIcon, tone: 'info',
        title: `Top spending: ${topCat[0]}`,
        description: `${fmtPKR(topCat[1])} spent on ${topCat[0]} this month. Track this to stay on budget.`,
      });
    }

    return result;
  }, [state, holdings, cash]);

  // Metrics
  const value = holdings.reduce((s, h) => s + h.currentValue, 0);
  const invested = holdings.reduce((s, h) => s + h.invested, 0);
  const unrealized = value - invested;
  const realized = holdings.reduce((s, h) => s + h.realized, 0);
  const returnPct = invested > 0 ? (unrealized / invested) * 100 : 0;

  // Sector allocation for the donut
  const sectorMap = {};
  holdings.forEach(h => {
    sectorMap[h.sector || 'Other'] = (sectorMap[h.sector || 'Other'] || 0) + h.currentValue;
  });
  const sectorData = Object.entries(sectorMap)
    .map(([name, v]) => ({ name, value: v, pct: value > 0 ? (v / value) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);

  // Win rate
  const sells = state.transactions.filter(t => t.type === 'SELL');
  const wins = sells.filter(t => t.outcome === 'Win').length;
  const losses = sells.filter(t => t.outcome === 'Loss').length;
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : null;

  return (
    <div>
      <SectionTitle
        sub="Understand your money. Improve your decisions."
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-7 h-7" style={{ color: C.accent }} />
          Insights
        </div>
      </SectionTitle>

      {/* ── QUICK METRICS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatBlock label="Total Return" value={fmtPct(returnPct)} sub={fmtPKR(unrealized)} tone={unrealized >= 0 ? 'pos' : 'neg'} />
        <StatBlock label="Realized P/L" value={fmtPKR(realized)} tone={realized >= 0 ? 'pos' : 'neg'} />
        <StatBlock label="Positions" value={holdings.length} sub={`${sectorData.length} sectors`} />
        <StatBlock label="Win Rate" value={winRate !== null ? `${winRate.toFixed(0)}%` : '—'} sub={`${wins}W / ${losses}L`} tone={winRate >= 50 ? 'pos' : winRate !== null ? 'neg' : 'neutral'} />
        <StatBlock label="Cash Reserve" value={fmtPKR(cash)} sub={`${value + cash > 0 ? ((cash / (value + cash)) * 100).toFixed(0) : 0}% of net worth`} />
      </div>

      {/* ── INSIGHTS + ALLOCATION ── */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        {/* Insights */}
        <div className="col-span-12 lg:col-span-8">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4" style={{ color: C.accent }} />
              <div className="font-semibold text-[14px]" style={{ color: C.ink }}>
                Smart Insights
                <span className="text-[11px] font-normal ml-2" style={{ color: C.muted }}>
                  {insights.length} recommendation{insights.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            {insights.length === 0 ? (
              <div className="text-[13px] py-10 text-center" style={{ color: C.whisper }}>
                As you log trades and expenses, personalized insights will appear here.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto scroll-thin pr-1">
                {insights.map((ins, i) => (
                  <InsightCard key={i} {...ins} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sector Allocation */}
        <div className="col-span-12 lg:col-span-4">
          <Card>
            <div className="font-semibold text-[14px] mb-1" style={{ color: C.ink }}>Sector Allocation</div>
            <div className="text-[11px] mb-3" style={{ color: C.muted }}>{sectorData.length} sectors</div>
            <div className="h-[180px]">
              {sectorData.length ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={sectorData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {sectorData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke={C.card} strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: C.cardElev, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12, color: C.ink }}
                      formatter={(v, n) => [fmtPKR(v), n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[12px]" style={{ color: C.whisper }}>
                  No holdings yet
                </div>
              )}
            </div>
            <div className="space-y-1.5 mt-2">
              {sectorData.slice(0, 5).map((s, i) => (
                <div key={s.name} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="truncate" style={{ color: C.inkSoft }}>{s.name}</span>
                  </div>
                  <span className="font-mono font-semibold" style={{ color: C.ink }}>{s.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
