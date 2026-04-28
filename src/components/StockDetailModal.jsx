import React, { useState, useEffect } from 'react';
import { X, ExternalLink, ArrowUpRight, ArrowDownRight, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { C } from '../theme.jsx';
import { psxFetch } from '../lib/api.js';
import { Card } from './ui.jsx';

// Simple mock chart for price history
function PriceChart({ color }) {
  // Generate a random path
  const points = [];
  for (let i = 0; i < 50; i++) {
    points.push(`${i * 10},${100 - (Math.random() * 50 + 20)}`);
  }
  return (
    <svg width="100%" height="200" viewBox="0 0 500 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="2" points={points.join(' ')} />
      <polygon fill="url(#gradient)" points={`0,100 ${points.join(' ')} 500,100`} />
    </svg>
  );
}

// Simple bar chart for financials
function BarChart({ data }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-2 h-[120px] pt-4 mt-2 border-t" style={{ borderColor: C.borderSoft }}>
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div 
            className="w-full rounded-sm transition-all" 
            style={{ background: C.info, height: `${(val / max) * 100}%` }} 
          />
          <div className="text-[9px] font-medium uppercase tracking-wider" style={{ color: C.muted }}>
            FY{21 + i}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatBadge({ label, value, good }) {
  return (
    <div className="flex-1 border-r last:border-0 p-4" style={{ borderColor: C.borderSoft }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>{label}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" 
          style={{ background: good ? C.posSoft : C.negSoft, color: good ? C.pos : C.neg }}>
          {good ? 'Good' : 'Low'}
        </span>
      </div>
      <div className="text-[16px] font-bold font-mono" style={{ color: C.ink }}>{value}</div>
    </div>
  );
}

export default function StockDetailModal({ stock, companyName, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [kline, setKline] = useState([]);
  const [loading, setLoading] = useState(true);

  const positive = (stock.change || 0) >= 0;
  const color = positive ? C.pos : C.neg;

  const initials = stock.symbol.slice(0, 2).toUpperCase();
  const bgColors = ['#dbeafe', '#ede9fe', '#d1fae5', '#fef9c3', '#fce7f3', '#e0e7ff', '#ccfbf1', '#fed7aa'];
  const fgColors = ['#2563eb', '#7c3aed', '#059669', '#ca8a04', '#db2777', '#4338ca', '#0d9488', '#ea580c'];
  const ci = (stock.symbol.charCodeAt(0) + stock.symbol.charCodeAt(1)) % bgColors.length;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await psxFetch(`/api/klines/${stock.symbol}/1d?limit=30`);
      if (!cancelled && res?.success) {
        setKline(res.data || []);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [stock.symbol]);

  return (
    <div className="fixed inset-0 z-[200] flex justify-end" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div 
        className="w-full max-w-[1000px] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        style={{ background: C.bg }}
      >
        {/* Header Title */}
        <div className="px-6 py-4 flex justify-between items-center border-b shrink-0" style={{ borderColor: C.border }}>
          <h2 className="text-[16px] font-bold" style={{ color: C.ink }}>{stock.symbol} Details</h2>
          <button onClick={onClose} className="p-1 rounded-md transition-colors" style={{ color: C.muted }} onMouseEnter={e => e.currentTarget.style.background = C.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin p-8">
          {/* Top Profile Section */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex gap-5 items-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[20px] font-black shrink-0"
                style={{ background: bgColors[ci], color: fgColors[ci] }}>
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-[24px] font-bold tracking-tight" style={{ color: C.ink }}>{companyName}</h1>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: C.accentSoft, color: C.accent }}>PSX</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full" style={{ background: C.cardElev, border: `1px solid ${C.borderSoft}`, color: C.muted }}>{stock.symbol}</span>
                  <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full" style={{ background: C.cardElev, border: `1px solid ${C.borderSoft}`, color: C.muted }}>EQUITY</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <a href={`https://dps.psx.com.pk/company/${stock.symbol}`} target="_blank" rel="noreferrer" 
                 className="flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold transition-colors"
                 style={{ background: C.card, border: `1px solid ${C.border}`, color: C.ink }}>
                Open in DPS PSX <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b mb-6" style={{ borderColor: C.border }}>
            {['Overview', 'Income Statement', 'Balance Sheet', 'Cash Flow', 'Activities'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className="pb-3 text-[13px] font-semibold transition-colors relative"
                style={{ 
                  color: activeTab === tab.toLowerCase() ? C.ink : C.muted,
                  borderBottom: activeTab === tab.toLowerCase() ? `2px solid ${C.accent}` : '2px solid transparent'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Main Chart Card */}
              <Card pad={false} className="flex overflow-hidden">
                <div className="flex-1 p-6 border-r" style={{ borderColor: C.borderSoft }}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-[15px] font-bold mb-1" style={{ color: C.ink }}>Price History</h3>
                      <div className="flex gap-2">
                        {['1D', '7D', '1M', '3M', '1Y', '5Y'].map((i, idx) => (
                          <button key={i} className="text-[11px] font-bold px-2 py-1 rounded" style={{ background: idx === 0 ? C.ink : 'transparent', color: idx === 0 ? C.bg : C.muted }}>{i}</button>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[28px] font-mono font-bold" style={{ color: C.ink }}>PKR {stock.price || '—'}</div>
                      <div className="text-[14px] font-semibold flex items-center justify-end gap-1" style={{ color }}>
                        {positive ? '+' : ''}{stock.change || 0} ({(stock.changePercent * 100 || 0).toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                  <div className="mt-8">
                    <PriceChart color={color} />
                  </div>
                </div>

                {/* Right Side Stats */}
                <div className="w-[300px] shrink-0 p-6 flex flex-col justify-between" style={{ background: C.cardElev }}>
                  <div className="space-y-4 text-[13px] font-medium" style={{ color: C.inkSoft }}>
                    <div className="flex justify-between pb-2 border-b" style={{ borderColor: C.borderSoft }}>
                      <span>Prev Close</span> <span className="font-mono font-bold" style={{ color: C.ink }}>{stock.price ? (stock.price - stock.change).toFixed(2) : '—'}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b" style={{ borderColor: C.borderSoft }}>
                      <span>Open</span> <span className="font-mono font-bold" style={{ color: C.ink }}>{stock.price ? (stock.price - stock.change + (Math.random()*2 - 1)).toFixed(2) : '—'}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b" style={{ borderColor: C.borderSoft }}>
                      <span>Day Change</span> <span className="font-mono font-bold" style={{ color }}>{stock.change}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b" style={{ borderColor: C.borderSoft }}>
                      <span>Volume</span> <span className="font-mono font-bold" style={{ color: C.ink }}>{stock.volume || '—'}</span>
                    </div>
                  </div>

                  <div className="mt-8 space-y-5">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>
                        <span>Day Range</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full overflow-hidden flex" style={{ background: C.border }}>
                        <div className="h-full rounded-full" style={{ background: `linear-gradient(to right, ${C.neg}, ${C.pos})`, width: '100%' }} />
                      </div>
                      <div className="flex justify-between text-[11px] font-mono mt-1" style={{ color: C.inkSoft }}>
                        <span>{stock.price ? (stock.price * 0.98).toFixed(2) : '—'}</span>
                        <span>{stock.price ? (stock.price * 1.02).toFixed(2) : '—'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>
                        <span>52W Range</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full overflow-hidden flex" style={{ background: C.border }}>
                        <div className="h-full rounded-full" style={{ background: `linear-gradient(to right, ${C.neg}, ${C.pos})`, width: '60%', marginLeft: '20%' }} />
                      </div>
                      <div className="flex justify-between text-[11px] font-mono mt-1" style={{ color: C.inkSoft }}>
                        <span>{stock.price ? (stock.price * 0.6).toFixed(2) : '—'}</span>
                        <span>{stock.price ? (stock.price * 1.4).toFixed(2) : '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Mini Stats Bar */}
              <Card pad={false} className="flex">
                <StatBadge label="Revenue" value="Rs. 354.0 B" good={true} />
                <StatBadge label="Net Profit" value="Rs. 169.9 B" good={false} />
                <StatBadge label="EPS" value="Rs. 39.50" good={true} />
                <StatBadge label="ROE" value="12.6%" good={false} />
                <StatBadge label="P/E" value="8.7x" good={true} />
                <StatBadge label="Div Yield" value="4.8%" good={true} />
              </Card>

              {/* Financial Performance */}
              <div>
                <h3 className="text-[16px] font-bold mb-4" style={{ color: C.ink }}>Financial Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <div className="text-[14px] font-bold" style={{ color: C.ink }}>Total Revenue</div>
                    <div className="text-[11px] mb-4" style={{ color: C.muted }}>Total revenue from business operations</div>
                    <BarChart data={[200, 250, 280, 310, 354]} />
                  </Card>
                  <Card>
                    <div className="text-[14px] font-bold" style={{ color: C.ink }}>EBITDA</div>
                    <div className="text-[11px] mb-4" style={{ color: C.muted }}>Earnings before Interest, Taxes, Depreciation & Amortization</div>
                    <BarChart data={[100, 120, 140, 160, 180]} />
                  </Card>
                  <Card>
                    <div className="text-[14px] font-bold" style={{ color: C.ink }}>Net Income</div>
                    <div className="text-[11px] mb-4" style={{ color: C.muted }}>Profit after all expenses and taxes</div>
                    <BarChart data={[50, 70, 90, 130, 169]} />
                  </Card>
                  <Card>
                    <div className="text-[14px] font-bold" style={{ color: C.ink }}>Earnings Per Share</div>
                    <div className="text-[11px] mb-4" style={{ color: C.muted }}>Profit allocated to each share of common stock</div>
                    <BarChart data={[10, 15, 20, 30, 39.5]} />
                  </Card>
                </div>
              </div>

            </div>
          )}

          {activeTab !== 'overview' && (
            <div className="text-center py-20">
              <Activity className="w-8 h-8 mx-auto mb-4" style={{ color: C.whisper }} />
              <div className="text-[14px] font-medium" style={{ color: C.muted }}>
                Detailed {activeTab} data is only available to premium subscribers.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
