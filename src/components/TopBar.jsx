import React, { useState } from 'react';
import { Search, Bell, Sun, Moon, RefreshCw, FileSpreadsheet, User } from 'lucide-react';
import { C, useTheme } from '../theme.jsx';
import { fmtPKR } from '../lib/format.js';
import { tryFetchPSXPrice } from '../lib/prices.js';
import { Button, Modal, IconButton } from './ui.jsx';

function TopMetric({ label, value, color }) {
  return (
    <div>
      <div className="uppercase tracking-wider text-[9px] font-semibold" style={{ color: C.muted }}>{label}</div>
      <div className="font-mono text-[13px] mt-0.5 font-semibold" style={{ color: color || C.ink }}>{value}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-8 w-px" style={{ background: C.border }} />;
}

export default function TopBar({ totalValue, cash, unrealized, holdings, state, updater, showToast, setTab }) {
  const { theme, setTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulk, setBulk] = useState('');
  const [search, setSearch] = useState('');

  const refresh = async () => {
    const tickers = [...new Set(holdings.map(h => h.ticker))];
    if (!tickers.length) return showToast('Add a holding first', 'info');
    setRefreshing(true);
    let ok = 0, fail = 0;
    const results = {};
    for (const t of tickers) {
      const r = await tryFetchPSXPrice(t);
      if (r) {
        results[t] = { price: r.price, prev: r.prev, volume: r.volume, timestamp: Date.now(), source: r.source };
        ok++;
      } else fail++;
    }
    if (Object.keys(results).length) updater.setPrices(results);
    setRefreshing(false);
    showToast(
      `Fetched ${ok}/${tickers.length}${fail ? ' — use paste for the rest' : ''}`,
      ok === 0 ? 'warn' : 'success'
    );
  };

  const applyBulk = () => {
    const lines = bulk.split('\n').map(l => l.trim()).filter(Boolean);
    const out = {};
    for (const ln of lines) {
      const parts = ln.split(/[\s,|\t]+/).filter(Boolean);
      if (parts.length < 2) continue;
      const t = parts[0].toUpperCase();
      const p = Number(parts[1].replace(/[,₨]/g, ''));
      if (!isNaN(p) && p > 0) out[t] = {
        price: p, prev: state.prices[t]?.price ?? null, timestamp: Date.now(), source: 'manual',
      };
    }
    const n = Object.keys(out).length;
    if (!n) return showToast('No valid rows parsed', 'error');
    updater.setPrices(out);
    setBulk('');
    setShowBulk(false);
    showToast(`Updated ${n} price${n > 1 ? 's' : ''}`, 'success');
  };

  const lastUpd = state.settings.lastPriceUpdate;
  const lastAgo = lastUpd ? Math.floor((Date.now() - lastUpd) / 60000) : null;
  const activeAlerts = state.alerts.filter(a => a.active && !a.triggered).length;

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: `${C.bg}ee`, borderBottom: `1px solid ${C.border}` }}>
      <div className="max-w-[1480px] mx-auto px-6 py-3 flex items-center gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
          <input
            placeholder="Search holdings, tickers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl text-[13px] focus:outline-none"
            style={{ background: C.card, border: `1px solid ${C.border}`, color: C.ink }}
          />
        </div>

        {/* Quick Stats */}
        <div className="hidden xl:flex items-center gap-4 text-[11px]">
          <TopMetric label="Net Worth" value={fmtPKR(totalValue + cash)} />
          <Divider />
          <TopMetric label="Invested" value={fmtPKR(totalValue)} />
          <Divider />
          <TopMetric
            label="P/L"
            value={`${unrealized >= 0 ? '+' : ''}${fmtPKR(unrealized)}`}
            color={unrealized >= 0 ? C.pos : C.neg}
          />
          <Divider />
          <TopMetric label="Cash" value={fmtPKR(cash)} />
        </div>

        {/* Account Switcher */}
        {state.accounts && state.accounts.length > 1 && (
          <select
            value={state.activeAccountId}
            onChange={e => updater.setActiveAccount(e.target.value)}
            className="px-3 py-2 rounded-xl text-[12px] font-medium focus:outline-none cursor-pointer"
            style={{ background: C.card, border: `1px solid ${C.border}`, color: C.ink }}
          >
            <option value="all">All accounts</option>
            {state.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="text-[10px] text-right hidden md:block" style={{ color: C.muted }}>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: C.pos }} />
              <span className="uppercase tracking-wider font-semibold">Live</span>
            </div>
            <div className="mt-0.5">
              {lastAgo === null ? 'never' : lastAgo < 1 ? 'just now' : `${lastAgo}m ago`}
            </div>
          </div>

          <IconButton onClick={() => setShowBulk(true)} label="Paste prices">
            <FileSpreadsheet className="w-4 h-4" />
          </IconButton>

          <IconButton onClick={() => setTab('alerts')} label="Alerts">
            <div className="relative">
              <Bell className="w-4 h-4" />
              {activeAlerts > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ background: C.accent, color: C.accentInk }}
                >
                  {activeAlerts}
                </span>
              )}
            </div>
          </IconButton>

          <IconButton onClick={setTheme} label="Toggle theme">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </IconButton>

          <button
            onClick={refresh}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-60 flex items-center gap-2"
            style={{ background: C.accent, color: C.accentInk }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentHover}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={2.5} />
            {refreshing ? 'Fetching…' : 'Refresh'}
          </button>
        </div>
      </div>

      {showBulk && (
        <Modal onClose={() => setShowBulk(false)} title="Paste Prices">
          <p className="text-[13px] mb-3 leading-relaxed" style={{ color: C.inkSoft }}>
            One per line: <span className="font-mono font-semibold" style={{ color: C.ink }}>TICKER price</span>.
          </p>
          <textarea
            value={bulk}
            onChange={e => setBulk(e.target.value)}
            placeholder={'LUCK 1245.50\nOGDC 178.20\nMEBL 224.75'}
            rows={10}
            className="w-full rounded-xl px-3 py-2.5 text-[13px] font-mono focus:outline-none"
            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.ink }}
          />
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="ghost" onClick={() => setShowBulk(false)}>Cancel</Button>
            <Button onClick={applyBulk}>Apply</Button>
          </div>
        </Modal>
      )}
    </header>
  );
}
