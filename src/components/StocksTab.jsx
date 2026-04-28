import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { C } from '../theme.jsx';
import { psxFetch } from '../lib/api.js';
import { Card, SectionTitle } from './ui.jsx';
import StockDetailModal from './StockDetailModal.jsx';

const COMPANY_NAMES = {
  LUCK: 'Lucky Cement', ENGRO: 'Engro Corporation', OGDC: 'Oil & Gas Dev. Co.', PPL: 'Pakistan Petroleum',
  HBL: 'Habib Bank', UBL: 'United Bank', MCB: 'MCB Bank', MEBL: 'Meezan Bank',
  FFC: 'Fauji Fertilizer', EFERT: 'Engro Fertilizers', HUBC: 'Hub Power Company', PSO: 'Pakistan State Oil',
  MARI: 'Mari Petroleum', POL: 'Pakistan Oilfields', BAHL: 'Bank Al Habib', SYSTEMS: 'Systems Limited',
  TRG: 'TRG Pakistan', NESTLE: 'Nestlé Pakistan', SEARL: 'The Searle Company', INDU: 'Indus Motor',
  DGKC: 'D.G. Khan Cement', MLCF: 'Maple Leaf Cement', KEL: 'K-Electric', FCCL: 'Fauji Cement',
  APL: 'Attock Petroleum', PIOC: 'Pioneer Cement', PAEL: 'Pak Elektron', NETSOL: 'NetSol Technologies',
  PSMC: 'Pak Suzuki Motor', COLG: 'Colgate-Palmolive', GLAXO: 'GlaxoSmithKline', HCAR: 'Honda Atlas',
  ATRL: 'Attock Refinery', FATIMA: 'Fatima Fertilizer', LOTCHEM: 'Lotte Chemical',
  SNGP: 'Sui Northern Gas', SSGC: 'Sui Southern Gas', MUGHAL: 'Mughal Iron & Steel',
  UNITY: 'Unity Foods', PAKT: 'Pak Tobacco', ISL: 'International Steels', KAPCO: 'Kot Addu Power',
  NBP: 'National Bank', BAFL: 'Bank Alfalah', DAWH: 'Dawood Hercules', ICI: 'ICI Pakistan',
  ABOT: 'Abbott Laboratories', AGP: 'AGP Limited', AIRLINK: 'Airlink Communication',
  AKBL: 'Askari Bank', ANL: 'Analysts Limited', ASC: 'Al-Shaheer Corporation',
  AVN: 'Avanceon Limited', BAFS: 'Bata Pakistan', BOP: 'Bank of Punjab',
  CHCC: 'Cherat Cement', CNERGY: 'Cnergy', CEPB: 'Central Depository',
  DCR: 'Dolmen City', EPCL: 'Engro Polymer', FHAM: 'Ferozsons Labs',
  GATM: 'Gatron Industries', GGL: 'Ghani Glass', GHNI: 'Ghani Global Holdings',
  GHNL: 'Ghani Value Glass', HASCOL: 'Hascol Petroleum', HINOON: 'Hinoon Limited',
  HPL: 'Hala Enterprises', IGIHL: 'IGI Holdings', JSBL: 'JS Bank',
  KOHC: 'Kohat Cement', KTML: 'K-Electric', LPCL: 'Loads Limited',
  MTL: 'Media Times', NRSL: 'NRL', NML: 'Nishat Mills',
  OGTI: 'Oil & Gas Investments', PIAA: 'PIA', POWER: 'Pak Power',
  SANSM: 'Sanofi-aventis', SML: 'Service Fabrics', SNBL: 'Soneri Bank',
  SPWL: 'Sazgar Engineering', STCL: 'Security Papers', THALL: 'Thal Limited',
  TOMCL: 'Total Parco Marketing', TPL: 'TPL Properties', TREET: 'Treet Corporation',
  YOUW: 'YouWiFi', SILK: 'Silkbank',
};

function fNum(n, d = 2) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-PK', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function StockRow({ stock, idx, onClick }) {
  const positive = (stock.change || 0) >= 0;
  const color = positive ? C.pos : C.neg;
  const name = COMPANY_NAMES[stock.symbol] || stock.symbol;
  
  const initials = stock.symbol.slice(0, 2).toUpperCase();
  const bgColors = ['#dbeafe', '#ede9fe', '#d1fae5', '#fef9c3', '#fce7f3', '#e0e7ff', '#ccfbf1', '#fed7aa'];
  const fgColors = ['#2563eb', '#7c3aed', '#059669', '#ca8a04', '#db2777', '#4338ca', '#0d9488', '#ea580c'];
  const ci = (stock.symbol.charCodeAt(0) + stock.symbol.charCodeAt(1)) % bgColors.length;

  return (
    <div
      onClick={() => onClick(stock)}
      className="flex items-center px-6 py-4 transition-colors group cursor-pointer"
      style={{ borderBottom: `1px solid ${C.borderSoft}` }}
      onMouseEnter={e => e.currentTarget.style.background = C.hover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Name Column */}
      <div className="flex items-center gap-4 w-[28%] shrink-0 pr-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
          style={{ background: bgColors[ci], color: fgColors[ci] }}>
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-bold tracking-tight flex items-center gap-1.5" style={{ color: C.ink }}>
            {stock.symbol}
            {positive ? <ArrowUpRight className="w-3.5 h-3.5" style={{ color: C.pos }} /> : <ArrowDownRight className="w-3.5 h-3.5" style={{ color: C.neg }} />}
          </div>
          <div className="text-[12px] truncate" style={{ color: C.muted }}>{name}</div>
        </div>
      </div>

      {/* Price Column */}
      <div className="w-[18%] shrink-0 text-right pr-6">
        <div className="text-[14px] font-mono font-bold" style={{ color: color }}>
          {stock.price ? `Rs ${fNum(stock.price)}` : '—'}
        </div>
        <div className="text-[12px] font-semibold" style={{ color: color }}>
          {stock.changePercent != null ? `${positive ? '+' : ''}${(stock.changePercent * 100).toFixed(2)}%` : '—'}
        </div>
      </div>

      {/* Volume Column */}
      <div className="w-[18%] shrink-0 text-right pr-6">
        <div className="text-[14px] font-mono" style={{ color: C.ink }}>
          {stock.volume ? fNum(stock.volume, 0) : '—'}
        </div>
      </div>
      
      {/* Placeholders for Market Cap, P/E, Yield since API doesn't provide them yet but UI matches Ticker Analysts */}
      <div className="w-[18%] shrink-0 text-right pr-6 text-[14px] font-mono" style={{ color: C.ink }}>—</div>
      <div className="w-[18%] shrink-0 text-right text-[14px] font-mono" style={{ color: C.ink }}>—</div>
    </div>
  );
}

export default function StocksTab({ allSymbols }) {
  const [query, setQuery] = useState('');
  const [liveData, setLiveData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  // Build the symbol list
  const symbolList = useMemo(() => {
    if (allSymbols && allSymbols.length) {
      return allSymbols.map(s => typeof s === 'string' ? s : s.symbol || s).filter(Boolean);
    }
    return Object.keys(COMPANY_NAMES);
  }, [allSymbols]);

  // Filter symbols by search
  const filtered = useMemo(() => {
    if (!query.trim()) return symbolList.slice(0, 30);
    const q = query.trim().toLowerCase();
    return symbolList.filter(s => {
      const name = (COMPANY_NAMES[s] || '').toLowerCase();
      return s.toLowerCase().includes(q) || name.includes(q);
    }).slice(0, 30);
  }, [query, symbolList]);

  // Parallel fetch for speed
  useEffect(() => {
    const toFetch = filtered.filter(s => !liveData[s]);
    if (!toFetch.length) return;

    let cancelled = false;
    setLoading(true);

    const fetchBatch = async () => {
      // Chunk requests to avoid blowing up the proxy
      const chunkSize = 10;
      for (let i = 0; i < toFetch.length; i += chunkSize) {
        if (cancelled) break;
        const chunk = toFetch.slice(i, i + chunkSize);
        await Promise.allSettled(chunk.map(async t => {
          try {
            const res = await psxFetch(`/api/ticks/REG/${t}`);
            if (!cancelled && res?.success && res?.data) {
              setLiveData(prev => ({ ...prev, [t]: res.data }));
            }
          } catch (e) {}
        }));
      }
      if (!cancelled) setLoading(false);
    };

    fetchBatch();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.join(',')]);

  return (
    <div className="pb-10">
      <SectionTitle 
        sub="Discover and analyze PSX stocks in real-time"
        action={
          <div className="flex gap-2 text-[12px] font-semibold">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors" style={{ color: C.inkSoft, border: `1px solid ${C.border}` }}>
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </button>
          </div>
        }
      >
        Stock Screener
      </SectionTitle>

      {/* Search */}
      <div className="relative mb-6 max-w-lg">
        <Search className="w-4.5 h-4.5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter stocks..."
          className="w-full pl-11 pr-4 py-3 rounded-xl text-[13px] font-medium focus:outline-none transition-colors"
          style={{
            background: C.bg,
            border: `1px solid ${C.border}`,
            color: C.ink,
          }}
          onFocus={e => e.target.style.borderColor = C.accent}
          onBlur={e => e.target.style.borderColor = C.border}
        />
      </div>

      {/* Results Table */}
      <Card pad={false} className="overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center px-6 py-4 text-[12px] font-semibold" style={{ color: C.muted, borderBottom: `1px solid ${C.borderSoft}`, background: C.hover }}>
          <div className="w-[28%] shrink-0 pr-4 flex items-center gap-1 cursor-pointer">Stock <ArrowUpDown className="w-3 h-3" /></div>
          <div className="w-[18%] shrink-0 text-right pr-6 flex items-center justify-end gap-1 cursor-pointer">Price <ArrowUpDown className="w-3 h-3" /></div>
          <div className="w-[18%] shrink-0 text-right pr-6 flex items-center justify-end gap-1 cursor-pointer">Volume <ArrowUpDown className="w-3 h-3" /></div>
          <div className="w-[18%] shrink-0 text-right pr-6 flex items-center justify-end gap-1 cursor-pointer">Market Cap <ArrowUpDown className="w-3 h-3" /></div>
          <div className="w-[18%] shrink-0 text-right flex items-center justify-end gap-1 cursor-pointer">P/E Ratio <ArrowUpDown className="w-3 h-3" /></div>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[13px]" style={{ color: C.muted }}>
            No stocks found matching "{query}"
          </div>
        ) : (
          <div className="min-h-[400px]">
            {filtered.map((symbol, idx) => (
              <StockRow
                key={symbol}
                idx={idx}
                stock={{ symbol, ...(liveData[symbol] || {}) }}
                onClick={(s) => setSelectedStock(s)}
              />
            ))}
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between mt-4">
        <div className="text-[12px]" style={{ color: C.muted }}>
          Showing {filtered.length} of {symbolList.length} total active tickers.
        </div>
        {loading && (
          <div className="text-[12px] flex items-center gap-2" style={{ color: C.accent }}>
            <div className="animate-spin inline-block w-3.5 h-3.5 border-2 rounded-full" style={{ borderColor: `${C.accent}40`, borderTopColor: C.accent }} />
            Syncing live market data...
          </div>
        )}
      </div>

      {selectedStock && (
        <StockDetailModal 
          stock={selectedStock} 
          companyName={COMPANY_NAMES[selectedStock.symbol] || selectedStock.symbol}
          onClose={() => setSelectedStock(null)} 
        />
      )}
    </div>
  );
}
