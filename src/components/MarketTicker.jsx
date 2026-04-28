import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { C } from '../theme.jsx';
import { psxFetch } from '../lib/api.js';

const INDICES = [
  { symbol: 'KSE100', label: 'KSE 100' },
  { symbol: 'KSE30', label: 'KSE 30' },
  { symbol: 'KMI30', label: 'KMI 30' },
  { symbol: 'ALLSHR', label: 'ALL SHR' },
];

// Module-level cache so data persists across mounts
let cachedData = null;
let lastFetch = 0;
const CACHE_TTL = 30000; // 30 seconds

function fNum(n) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MarketTicker() {
  const [data, setData] = useState(cachedData || {});
  const intervalRef = useRef(null);

  useEffect(() => {
    async function fetchIndices() {
      // Skip if cached data is recent
      if (cachedData && Date.now() - lastFetch < CACHE_TTL) {
        setData(cachedData);
        return;
      }

      try {
        const results = await Promise.all(
          INDICES.map(idx =>
            psxFetch(`/api/ticks/IDX/${idx.symbol}`)
              .then(res => res.success ? { ...res.data, label: idx.label } : null)
              .catch(() => null)
          )
        );
        const map = {};
        INDICES.forEach((idx, i) => { if (results[i]) map[idx.symbol] = results[i]; });

        if (Object.keys(map).length) {
          cachedData = map;
          lastFetch = Date.now();
          setData(map);
        }
      } catch (e) {
        console.error('Market ticker fetch error:', e);
      }
    }

    fetchIndices();
    intervalRef.current = setInterval(fetchIndices, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const indices = INDICES.map(idx => data[idx.symbol]).filter(Boolean);

  if (!indices.length) return null;

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        background: C.card,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div className="max-w-[1480px] mx-auto px-6 py-2 flex items-center gap-0">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 mr-5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: C.pos }} />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Market</span>
        </div>

        {/* Index items */}
        <div className="flex items-center gap-0 flex-1 overflow-x-auto scroll-thin" style={{ scrollbarWidth: 'none' }}>
          {indices.map((idx, i) => {
            const positive = idx.change >= 0;
            const color = positive ? C.pos : C.neg;
            return (
              <div key={idx.symbol} className="flex items-center shrink-0">
                {i > 0 && <div className="w-px h-5 mx-4" style={{ background: C.border }} />}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold" style={{ color: C.inkSoft }}>{idx.label}</span>
                  <span className="text-[12px] font-mono font-bold" style={{ color: C.ink }}>{fNum(idx.price)}</span>
                  <span className="text-[11px] font-semibold flex items-center gap-0.5" style={{ color }}>
                    {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {fNum(Math.abs(idx.change))}
                    <span className="text-[10px] ml-0.5">({(Math.abs(idx.changePercent) * 100).toFixed(2)}%)</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
