import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight, Zap, BarChart3, ChevronRight } from 'lucide-react';
import { psxFetch } from '../lib/api.js';
import { C } from '../theme.jsx';

const INDICES = [
  { symbol: 'KSE100', label: 'KSE 100' },
  { symbol: 'KSE30', label: 'KSE 30' },
  { symbol: 'KMI30', label: 'KMI 30' },
  { symbol: 'ALLSHR', label: 'ALL SHR' },
];

function fNum(n, d = 2) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-PK', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fVol(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function MiniSparkline({ data, color = '#16a34a', width = 120, height = 40 }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const values = data.map(d => d.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

function IndexCard({ data, klineData }) {
  if (!data) return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: C.card, border: `1px solid ${C.border}`, minHeight: 90 }} />
  );
  const positive = data.change >= 0;
  const color = positive ? C.pos : C.neg;
  return (
    <div className="rounded-2xl p-5 transition-all hover:shadow-lg" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="flex items-start justify-between">
        <div className="text-[13px] font-semibold" style={{ color: C.inkSoft }}>{data.label}</div>
        <div className="text-right">
          <div className="text-[18px] font-bold font-mono" style={{ color: C.ink }}>{fNum(data.price)}</div>
        </div>
      </div>
      <div className="flex items-end justify-between mt-2">
        <MiniSparkline data={klineData} color={positive ? '#34d399' : '#f87171'} width={100} height={32} />
        <div className="text-[12px] font-semibold flex items-center gap-1" style={{ color }}>
          {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {fNum(Math.abs(data.change))} ({(Math.abs(data.changePercent) * 100).toFixed(2)}%)
        </div>
      </div>
    </div>
  );
}

function StockRow({ stock, idx }) {
  const positive = stock.change >= 0;
  const color = positive ? C.pos : C.neg;
  const initials = stock.symbol.slice(0, 2).toUpperCase();
  const bgColors = ['#dbeafe', '#ede9fe', '#d1fae5', '#fef9c3', '#fce7f3', '#e0e7ff', '#ccfbf1', '#fed7aa'];
  const fgColors = ['#2563eb', '#7c3aed', '#059669', '#ca8a04', '#db2777', '#4338ca', '#0d9488', '#ea580c'];
  const ci = idx % bgColors.length;
  return (
    <div
      className="flex items-center px-5 py-4 transition-colors"
      style={{ borderBottom: `1px solid ${C.border}` }}
      onMouseEnter={e => e.currentTarget.style.background = C.hover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold mr-4 shrink-0"
        style={{ background: bgColors[ci], color: fgColors[ci] }}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>{stock.name || stock.symbol}</div>
        <div className="text-[12px] font-medium" style={{ color: C.muted }}>{stock.symbol}</div>
      </div>
      <div className="text-right ml-4 shrink-0 w-24">
        <div className="text-[14px] font-mono font-semibold" style={{ color: C.ink }}>{fNum(stock.price)}</div>
      </div>
      <div className="text-right ml-4 shrink-0 w-28">
        <div className="text-[12px] font-semibold flex items-center justify-end gap-1" style={{ color }}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {(Math.abs(stock.changePercent) * 100).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

// Company name lookup for well known tickers
const COMPANY_NAMES = {
  LUCK: 'Lucky Cement Limited', ENGRO: 'Engro Corporation', OGDC: 'Oil & Gas Dev. Co.', PPL: 'Pakistan Petroleum',
  HBL: 'Habib Bank Limited', UBL: 'United Bank Limited', MCB: 'MCB Bank Limited', MEBL: 'Meezan Bank',
  FFC: 'Fauji Fertilizer Company', EFERT: 'Engro Fertilizers', HUBC: 'Hub Power Company', PSO: 'Pakistan State Oil',
  MARI: 'Mari Petroleum', POL: 'Pakistan Oilfields', BAHL: 'Bank Al Habib', SYSTEMS: 'Systems Limited',
  TRG: 'TRG Pakistan', NESTLE: 'Nestlé Pakistan', SEARL: 'The Searle Company', INDU: 'Indus Motor Co.',
  DGKC: 'D.G. Khan Cement', MLCF: 'Maple Leaf Cement', KEL: 'K-Electric', FCCL: 'Fauji Cement Co.',
  APL: 'Attock Petroleum', PIOC: 'Pioneer Cement', PAEL: 'Pak Elektron', NETSOL: 'NetSol Technologies',
  PSMC: 'Pak Suzuki Motor', COLG: 'Colgate-Palmolive', GLAXO: 'GlaxoSmithKline', HCAR: 'Honda Atlas Cars',
  ATRL: 'Attock Refinery', TPLL: 'TPL Life Insurance', MSCL: 'Metropolitan Steel Corporation', ASHT: 'Ashfaq Textile Mills',
  PREMA: 'At-Tahur Limited', TRSM: 'Tarseel Mills', FCEPL: 'Fauji Cement Equipment', CRTM: 'Creative Mills',
  PMRS: 'Premier Sugar Mills', ARPAK: 'Arpa', UDLI: 'UDLI', FNEL: 'Feroze1888 Mills',
  KPUS: 'Khyber Pakhtunkhwa US$', FSWL: 'Frontier Sugar Works', ZAHID: 'Zahid Jee Textile',
  KOIL: 'Khalid Industries', AMBL: 'AMBL', SASML: 'SASML', POWERPS: 'Pak Power',
  FATIMA: 'Fatima Fertilizer', LOTCHEM: 'Lotte Chemical', SNGP: 'Sui Northern Gas', SSGC: 'Sui Southern Gas',
  MUGHAL: 'Mughal Iron & Steel', UNITY: 'Unity Foods', PAKT: 'Pak Tobacco', ISL: 'International Steels',
  KAPCO: 'Kot Addu Power', NBP: 'National Bank', BAFL: 'Bank Alfalah',
};
// Module-level cache to persist data across mounts
let _cachedIndices = null;
let _cachedKlines = null;
let _cachedStats = null;
let _lastLandingFetch = 0;

export default function LandingPage({ onLogin, onSignup }) {
  const [indices, setIndices] = useState(_cachedIndices || {});
  const [klines, setKlines] = useState(_cachedKlines || {});
  const [stats, setStats] = useState(_cachedStats);
  const [activeTab, setActiveTab] = useState('gainers');
  const [loading, setLoading] = useState(!_cachedStats);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        // Fetch indices
        const idxResults = await Promise.all(
          INDICES.map(idx =>
            psxFetch(`/api/ticks/IDX/${idx.symbol}`)
              .then(res => res.success ? { ...res.data, label: idx.label } : null)
              .catch(() => null)
          )
        );
        if (cancelled) return;
        const idxMap = {};
        INDICES.forEach((idx, i) => { if (idxResults[i]) idxMap[idx.symbol] = idxResults[i]; });
        _cachedIndices = idxMap;
        setIndices(idxMap);

        // Fetch klines for sparklines
        const klineResults = await Promise.all(
          INDICES.map(idx =>
            psxFetch(`/api/klines/${idx.symbol}/1d?limit=30`)
              .then(res => res.success ? res.data : [])
              .catch(() => [])
          )
        );
        if (cancelled) return;
        const klMap = {};
        INDICES.forEach((idx, i) => { klMap[idx.symbol] = klineResults[i]; });
        _cachedKlines = klMap;
        setKlines(klMap);

        // Fetch market stats
        const statsRes = await psxFetch('/api/stats/REG');
        if (cancelled) return;
        if (statsRes.success) {
          _cachedStats = statsRes.data;
          setStats(statsRes.data);
        }
        _lastLandingFetch = Date.now();
      } catch (e) {
        console.error('Landing data fetch error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const stockList = useMemo(() => {
    if (!stats) return [];
    const source = activeTab === 'gainers' ? stats.topGainers
      : activeTab === 'losers' ? stats.topLosers
      : [...(stats.topGainers || []), ...(stats.topLosers || [])].sort((a, b) => b.volume - a.volume).slice(0, 10);
    return (source || []).map(s => ({
      ...s,
      name: COMPANY_NAMES[s.symbol] || s.symbol,
    }));
  }, [stats, activeTab]);

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: `${C.bg}ee`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.accent }}>
              <span className="text-[16px] font-black" style={{ color: C.accentInk }}>F</span>
            </div>
            <div>
              <div className="text-[16px] font-bold tracking-tight" style={{ color: C.ink }}>FinPilot</div>
              <div className="text-[9px] font-medium uppercase tracking-wider" style={{ color: C.muted }}>Intelligence</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
              style={{ color: C.inkSoft, border: `1px solid ${C.border}` }}
              onMouseEnter={e => e.currentTarget.style.background = C.hover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Sign In
            </button>
            <button
              onClick={onSignup}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:opacity-90"
              style={{ background: C.accent, color: C.accentInk }}
            >
              Create Account
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[32px] font-bold" style={{ color: C.ink }}>Live market</h1>
          {stats && (
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
              <span className="w-2 h-2 rounded-full animate-pulse live-dot" style={{ background: C.pos }} />
              Live data
            </div>
          )}
        </div>
        {stats && (
          <div className="flex items-center gap-5 text-[13px] mb-8">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: C.pos }} />
              <span style={{ color: C.pos }} className="font-semibold">{stats.gainers} advancing</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: C.neg }} />
              <span style={{ color: C.neg }} className="font-semibold">{stats.losers} declining</span>
            </span>
            <span style={{ color: C.muted }}>Vol {fVol(stats.totalVolume)}</span>
          </div>
        )}

        {/* ─── INDEX CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {INDICES.map(idx => (
            <IndexCard
              key={idx.symbol}
              data={indices[idx.symbol]}
              klineData={klines[idx.symbol]}
            />
          ))}
        </div>

        {/* ─── TODAY'S STOCKS ─── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h2 className="text-[20px] font-bold" style={{ color: C.ink }}>Today's stocks</h2>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-2 px-6 pb-4">
            {[
              { id: 'gainers', label: 'Gainers', Icon: TrendingUp },
              { id: 'losers', label: 'Losers', Icon: TrendingDown },
              { id: 'active', label: 'Most Active', Icon: Activity },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all"
                style={{
                  background: activeTab === t.id ? (t.id === 'gainers' ? C.posSoft : t.id === 'losers' ? C.negSoft : C.hover) : 'transparent',
                  color: activeTab === t.id ? (t.id === 'gainers' ? C.pos : t.id === 'losers' ? C.neg : C.inkSoft) : C.muted,
                  border: activeTab === t.id ? 'none' : `1px solid ${C.border}`,
                }}
              >
                <t.Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Table Header */}
          <div className="flex items-center px-5 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted, borderTop: `1px solid ${C.border}` }}>
            <div className="w-10 mr-4" />
            <div className="flex-1">Stocks</div>
            <div className="w-24 text-right">Price</div>
            <div className="w-28 text-right">Change</div>
          </div>

          {/* Stock rows */}
          {loading ? (
            <div className="p-10 text-center text-[14px]" style={{ color: C.muted }}>
              <div className="animate-spin inline-block w-6 h-6 border-2 rounded-full mb-3" style={{ borderColor: C.border, borderTopColor: C.accent }} />
              <div>Fetching live market data…</div>
            </div>
          ) : stockList.length === 0 ? (
            <div className="p-10 text-center text-[14px]" style={{ color: C.muted }}>
              No data available
            </div>
          ) : (
            stockList.map((stock, i) => <StockRow key={stock.symbol} stock={stock} idx={i} />)
          )}
        </div>

        {/* ─── MARKET STATS BAR ─── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 mb-10">
            {[
              { label: 'Total Volume', value: fVol(stats.totalVolume) },
              { label: 'Total Value', value: '₨ ' + fVol(stats.totalValue) },
              { label: 'Total Trades', value: fNum(stats.totalTrades, 0) },
              { label: 'Listed Symbols', value: stats.symbolCount },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>{s.label}</div>
                <div className="text-[20px] font-bold font-mono" style={{ color: C.ink }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ─── CTA ─── */}
        <div className="rounded-2xl p-8 mb-10 text-center" style={{ background: C.accentSoft, border: `1px solid ${C.border}` }}>
          <h3 className="text-[24px] font-bold mb-2" style={{ color: C.ink }}>Understand your money. Improve your decisions.</h3>
          <p className="text-[14px] mb-6" style={{ color: C.muted }}>
            Create a free account to access portfolio intelligence, insights, alerts, and more.
          </p>
          <button
            onClick={onSignup}
            className="px-8 py-3 rounded-xl text-[14px] font-semibold transition-all hover:opacity-90"
            style={{ background: C.accent, color: C.accentInk }}
          >
            Get Started — it's free
          </button>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="py-6 text-center text-[12px]" style={{ color: C.whisper, borderTop: `1px solid ${C.border}` }}>
        FinPilot · Live data from <a href="https://psxterminal.com" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: C.muted }}>psxterminal.com</a> · All data stays in your browser
      </footer>
    </div>
  );
}
