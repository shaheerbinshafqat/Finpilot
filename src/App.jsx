import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { ThemeContext, ThemeStyles, FontLink, C } from './theme.jsx';
import { loadState, saveState, defaultState } from './lib/storage.js';
import { computeHoldings, computeCash } from './lib/portfolio.js';
import { tryFetchPSXPrice } from './lib/prices.js';
import { psxFetch } from './lib/api.js';
import { fireWebhooks } from './lib/webhooks.js';
import { uid } from './lib/format.js';

import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import MarketTicker from './components/MarketTicker.jsx';
import Dashboard from './components/Dashboard.jsx';
import PortfolioTab from './components/PortfolioTab.jsx';
import TransactionsTab from './components/TransactionsTab.jsx';
import ExpensesTab from './components/ExpensesTab.jsx';
import JournalTab from './components/JournalTab.jsx';
import AnalyticsTab from './components/AnalyticsTab.jsx';
import AlertsTab from './components/AlertsTab.jsx';
import CashTab from './components/CashTab.jsx';
import SettingsTab from './components/SettingsTab.jsx';
import InsightsTab from './components/InsightsTab.jsx';
import StocksTab from './components/StocksTab.jsx';
import CalculatorsTab from './components/CalculatorsTab.jsx';

//NEW
import { createAuditEntry, appendAudit } from './lib/audit.js';
import AuditLogTab from './components/AuditLogTab.jsx';
import { shouldPromptBackup, downloadBackup, autoSaveToFolder } from './lib/backup.js';
import TaxTab from './components/TaxTab.jsx';
import ReconcileTab from './components/ReconcileTab.jsx';
import AuthModal from './components/Auth.jsx';
import LandingPage from './components/LandingPage.jsx';



export default function App() {
  const [state, setState] = useState(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [theme, setThemeState] = useState('dark');
  const [user, setUser] = useState(() => localStorage.getItem('active_user') || null);
  const [allSymbols, setAllSymbols] = useState([]);
  const [authMode, setAuthMode] = useState(null); // null | 'login' | 'signup'

useEffect(() => {
  const s = loadState();
  if (s) {
    const merged = {
      ...defaultState,
      ...s,
      tickerNotes: s.tickerNotes || {},
      settings: {
        ...defaultState.settings,
        ...(s.settings || {}),
        webhookUrls: s.settings?.webhookUrls || ['', ''],
        webhookEvents: {
          ...defaultState.settings.webhookEvents,
          ...(s.settings?.webhookEvents || {}),
        },
      },
    };

    // NEW
    // Migrate legacy kseHistory into benchmarks.kse100
    if (merged.kseHistory?.length && !merged.benchmarks?.kse100?.length) {
      merged.benchmarks = {
        ...merged.benchmarks,
        kse100: merged.kseHistory,
      };
    }

    setState(merged);
    setThemeState(merged.settings.theme || 'light');
  }
  setLoaded(true);
}, []);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist state
  useEffect(() => {
    if (loaded) saveState(state);
  }, [state, loaded]);

  const showToast = (msg, kind = 'info') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    setState(s => ({ ...s, settings: { ...s.settings, theme: next } }));
  };

  const updater = {
    
    addTxn: t => setState(s => {
  const newTxn = { ...t, id: uid() };
  const entry = createAuditEntry('create', 'transaction', newTxn.id, null, newTxn);
  return { ...s, transactions: [...s.transactions, newTxn], auditLog: appendAudit(s.auditLog, entry) };
}),

    addTxnBulk: ts => setState(s => ({ ...s, transactions: [...s.transactions, ...ts.map(t => ({ ...t, id: uid() }))] })),
    
    deleteTxn: id => setState(s => {
  const txn = s.transactions.find(t => t.id === id);
  if (!txn) return s;
  const entry = createAuditEntry('delete', 'transaction', id, txn, null);
  return {
    ...s,
    transactions: s.transactions.filter(t => t.id !== id),
    deletedItems: [...s.deletedItems, { ...txn, _entityType: 'transaction', _deletedAt: Date.now() }],
    auditLog: appendAudit(s.auditLog, entry),
  };
}),
    
    updateTxn: (id, patch) => setState(s => {
  const before = s.transactions.find(t => t.id === id);
  const after = { ...before, ...patch };
  const entry = createAuditEntry('update', 'transaction', id, before, after);
  return {
    ...s,
    transactions: s.transactions.map(t => t.id === id ? after : t),
    auditLog: appendAudit(s.auditLog, entry),
  };
}),

    addExpense: e => setState(s => ({ ...s, expenses: [...s.expenses, { ...e, id: uid() }] })),
    
    deleteExpense: id => setState(s => {
  const exp = s.expenses.find(e => e.id === id);
  if (!exp) return s;
  const entry = createAuditEntry('delete', 'expense', id, exp, null);
  return {
    ...s,
    expenses: s.expenses.filter(e => e.id !== id),
    deletedItems: [...s.deletedItems, { ...exp, _entityType: 'expense', _deletedAt: Date.now() }],
    auditLog: appendAudit(s.auditLog, entry),
  };
}),    

    addCash: m => setState(s => ({ ...s, cashMoves: [...s.cashMoves, { ...m, id: uid() }] })),
    
    deleteCash: id => setState(s => {
  const cm = s.cashMoves.find(m => m.id === id);
  if (!cm) return s;
  const entry = createAuditEntry('delete', 'cashMove', id, cm, null);
  return {
    ...s,
    cashMoves: s.cashMoves.filter(m => m.id !== id),
    deletedItems: [...s.deletedItems, { ...cm, _entityType: 'cashMove', _deletedAt: Date.now() }],
    auditLog: appendAudit(s.auditLog, entry),
  };
}),

    setPrices: prices => setState(s => ({
      ...s,
      prices: { ...s.prices, ...prices },
      settings: { ...s.settings, lastPriceUpdate: Date.now() },
    })),
    addAlert: a => setState(s => ({
      ...s, alerts: [...s.alerts, { ...a, id: uid(), active: true, triggered: false }],
    })),
    
    deleteAlert: id => setState(s => {
  const a = s.alerts.find(x => x.id === id);
  if (!a) return s;
  const entry = createAuditEntry('delete', 'alert', id, a, null);
  return {
    ...s,
    alerts: s.alerts.filter(x => x.id !== id),
    deletedItems: [...s.deletedItems, { ...a, _entityType: 'alert', _deletedAt: Date.now() }],
    auditLog: appendAudit(s.auditLog, entry),
  };
}),

    setRisk: (ticker, patch) => setState(s => ({
      ...s, risk: { ...s.risk, [ticker]: { ...(s.risk[ticker] || {}), ...patch } },
    })),
    setTickerNote: (ticker, note) => setState(s => ({
      ...s,
      tickerNotes: {
        ...s.tickerNotes,
        [ticker]: { ...(s.tickerNotes[ticker] || {}), ...note, updatedAt: Date.now() },
      },
    })),

    // NEW methods:
restoreDeleted: (id) => setState(s => {
  const item = s.deletedItems.find(x => x.id === id);
  if (!item) return s;
  const { _entityType, _deletedAt, ...clean } = item;
  const entry = createAuditEntry('restore', _entityType, id, null, clean);
  const collectionKey = {
    transaction: 'transactions', expense: 'expenses',
    cashMove: 'cashMoves', alert: 'alerts',
  }[_entityType];
  return {
    ...s,
    [collectionKey]: [...s[collectionKey], clean],
    deletedItems: s.deletedItems.filter(x => x.id !== id),
    auditLog: appendAudit(s.auditLog, entry),
  };
}),
purgeDeleted: () => setState(s => {
  const cutoff = Date.now() - (s.settings.auditRetentionDays || 30) * 86400000;
  return { ...s, deletedItems: s.deletedItems.filter(x => x._deletedAt > cutoff) };
}),

//NEW
// Add to updater:
addAccount: a => setState(s => ({
  ...s, accounts: [...s.accounts, { ...a, id: uid() }],
})),
deleteAccount: id => setState(s => {
  if (id === 'default' || s.accounts.length <= 1) return s;
  return {
    ...s,
    accounts: s.accounts.filter(a => a.id !== id),
    activeAccountId: s.activeAccountId === id ? 'default' : s.activeAccountId,
  };
}),
updateAccount: (id, patch) => setState(s => ({
  ...s, accounts: s.accounts.map(a => a.id === id ? { ...a, ...patch } : a),
})),
setActiveAccount: id => setState(s => ({ ...s, activeAccountId: id })),


addBenchmarkValue: (benchmarkId, value) => setState(s => {
  const today = new Date().toISOString().slice(0, 10);
  const existing = s.benchmarks?.[benchmarkId] || [];
  const filtered = existing.filter(p => p.date !== today);
  return {
    ...s,
    benchmarks: {
      ...s.benchmarks,
      [benchmarkId]: [...filtered, { date: today, value: Number(value) }],
    },
  };
}),



snapshot: () => setState(s => {
      const holdings = computeHoldings(s.transactions, s.prices, s.settings.costBasisMethod);
      const val = holdings.reduce((x, h) => x + h.currentValue, 0);
      const inv = holdings.reduce((x, h) => x + h.invested, 0);
      const today = new Date().toISOString().slice(0, 10);
      const hist = s.portfolioHistory.filter(p => p.date !== today);
      return { ...s, portfolioHistory: [...hist, { date: today, value: val, invested: inv }] };
    }),
    addKSE: v => setState(s => {
      const today = new Date().toISOString().slice(0, 10);
      const h = s.kseHistory.filter(p => p.date !== today);
      return { ...s, kseHistory: [...h, { date: today, value: Number(v) }] };
    }),
    updateSetting: (k, v) => setState(s => ({ ...s, settings: { ...s.settings, [k]: v } })),
    updateWebhookUrl: (idx, v) => setState(s => {
      const urls = [...(s.settings.webhookUrls || ['', ''])];
      urls[idx] = v;
      return { ...s, settings: { ...s.settings, webhookUrls: urls } };
    }),
    reset: () => { setState(defaultState); saveState(defaultState); },
    replaceAll: newState => { setState(newState); saveState(newState); },
  };

// Filter transactions, expenses, cashMoves by active account
const activeAccountId = state.activeAccountId || 'default';
const filterByAccount = (arr) => activeAccountId === 'all'
  ? arr
  : arr.filter(x => (x.accountId || 'default') === activeAccountId);

const filteredTransactions = useMemo(
  () => filterByAccount(state.transactions),
  [state.transactions, activeAccountId]
);
const filteredExpenses = useMemo(
  () => filterByAccount(state.expenses),
  [state.expenses, activeAccountId]
);
const filteredCashMoves = useMemo(
  () => filterByAccount(state.cashMoves),
  [state.cashMoves, activeAccountId]
);

const holdings = useMemo(
  () => computeHoldings(filteredTransactions, state.prices, state.settings.costBasisMethod),
  [filteredTransactions, state.prices, state.settings.costBasisMethod]
);
const cash = useMemo(
  () => computeCash(filteredCashMoves, filteredTransactions),
  [filteredCashMoves, filteredTransactions]
);
  
  // Daily snapshot
  useEffect(() => {
    if (!loaded) return;
    const today = new Date().toISOString().slice(0, 10);
    const hasToday = state.portfolioHistory.some(p => p.date === today);
    if (!hasToday && holdings.length) updater.snapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, holdings.length]);

  // Alert checker
  useEffect(() => {
    if (!loaded) return;
    const newlyTriggered = [];
    state.alerts.forEach(a => {
      if (!a.active || a.triggered) return;
      const rec = state.prices[a.ticker];
      if (!rec) return;
      const p = rec.price;
      const prev = rec.prev;
      let hit = false;
      if (a.type === 'target' && p >= a.value) hit = true;
      if (a.type === 'stoploss' && p <= a.value) hit = true;
      if (a.type === 'bigmove' && prev && prev > 0) {
        const chg = ((p - prev) / prev) * 100;
        if (Math.abs(chg) >= a.value) hit = true;
      }
      if (a.type === 'volspike' && rec.volume && a.avgVolume && a.avgVolume > 0) {
        if (rec.volume / a.avgVolume >= a.value) hit = true;
      }
      if (hit) newlyTriggered.push({
        alert: a, currentPrice: p, volume: rec.volume,
        dayChange: prev ? ((p - prev) / prev) * 100 : null,
      });
    });
    if (newlyTriggered.length) {
      const ids = newlyTriggered.map(x => x.alert.id);
      setState(s => ({
        ...s,
        alerts: s.alerts.map(a => ids.includes(a.id) ? { ...a, triggered: true, triggeredAt: Date.now() } : a),
      }));
      showToast(`${newlyTriggered.length} alert${newlyTriggered.length > 1 ? 's' : ''} triggered`, 'warn');
      if (state.settings.webhookEvents?.alerts) {
        newlyTriggered.forEach(({ alert, currentPrice, volume, dayChange }) => {
          fireWebhooks(state.settings.webhookUrls || [], {
            event: 'alert_triggered',
            alertType: alert.type,
            ticker: alert.ticker,
            targetPrice: alert.value,
            currentPrice,
            dayChange,
            volume,
            note: alert.note || '',
            timestamp: new Date().toISOString(),
            source: 'FinPilot',
          });
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.prices]);

  // Fetch all symbols and auto-refresh prices
  useEffect(() => {
    if (!loaded) return;
    
    // Fetch all symbols
    psxFetch('/api/symbols')
      .then(data => {
        if (data?.success && data?.data) {
          setAllSymbols(data.data);
        }
      })
      .catch(console.error);

    if (!state.settings.autoFetchEnabled) return;

    // Poll prices every 60 seconds for held tickers
    const tick = async () => {
      const tickers = [...new Set(holdings.map(h => h.ticker).filter(Boolean))];
      if (!tickers.length) return;
      const results = {};
      for (const t of tickers) {
        const r = await tryFetchPSXPrice(t);
        if (r) results[t] = {
          price: r.price, prev: r.prev, volume: r.volume,
          timestamp: Date.now(), source: r.source,
        };
      }
      if (Object.keys(results).length) updater.setPrices(results);
    };

    // Initial fetch
    tick();

    const id = setInterval(tick, 60 * 1000); // every 60 seconds
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, state.settings.autoFetchEnabled, holdings.map(h => h.ticker).join(',')]);

  
useEffect(() => {
  if (!loaded) return;
  if (!shouldPromptBackup()) return;
  if (!state.transactions.length) return;

  // Try silent save to user's chosen folder first
  autoSaveToFolder(state).then(success => {
    if (success) {
      showToast('Auto-backup saved to your folder', 'success');
    } else {
      // Fall back to download prompt
      showToast('Weekly backup — check your Downloads folder', 'info');
      setTimeout(() => downloadBackup(state, 'auto-weekly'), 2000);
    }
  }).catch(() => {
    downloadBackup(state, 'auto-weekly');
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [loaded]);

  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalInvested = holdings.reduce((s, h) => s + h.invested, 0);
  const totalUnrealized = totalValue - totalInvested;

  if (!loaded) {
    return (
      <ThemeContext.Provider value={{ theme, setTheme: toggleTheme }}>
        <ThemeStyles />
        <div style={{ background: C.bg, color: C.ink, fontFamily: "'Inter', sans-serif" }}
          className="min-h-screen flex items-center justify-center">
          <div style={{ color: C.muted }}>Loading your command center…</div>
        </div>
      </ThemeContext.Provider>
    );
  }
  
  const viewState = {
  ...state,
  transactions: filteredTransactions,
  expenses: filteredExpenses,
  cashMoves: filteredCashMoves,
};

  if (!user) {
    return (
      <>
        <FontLink />
        <LandingPage
          onLogin={() => {
            setUser('user');
            localStorage.setItem('active_user', 'user');
          }}
          onSignup={() => {
            setUser('user');
            localStorage.setItem('active_user', 'user');
          }}
        />
      </>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: toggleTheme }}>
      <ThemeStyles />
      <FontLink />
      <div className="min-h-screen" style={{
        background: C.bg, color: C.ink, fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div className="flex min-h-screen">
          <Sidebar 
            tab={tab} 
            setTab={setTab} 
            onSignOut={() => {
              setUser(null);
              localStorage.removeItem('active_user');
            }}
          />
          <main className="flex-1 flex flex-col min-w-0">
            <TopBar
              totalValue={totalValue}
              cash={cash}
              unrealized={totalUnrealized}
              holdings={holdings}
              state={state}
              updater={updater}
              showToast={showToast}
              setTab={setTab}
            />
            <MarketTicker />
            <div className="flex-1 overflow-y-auto scroll-thin">
              <div className="max-w-[1480px] mx-auto px-6 py-6">
                {tab === 'dashboard' && <Dashboard state={viewState} holdings={holdings} cash={cash} setTab={setTab} />}
                {tab === 'portfolio' && <PortfolioTab state={viewState} holdings={holdings} updater={updater} showToast={showToast} />}
                {tab === 'transactions' && <TransactionsTab state={viewState} holdings={holdings} allSymbols={allSymbols} updater={updater} showToast={showToast} />}
                {tab === 'expenses' && <ExpensesTab state={viewState} updater={updater} showToast={showToast} />}
                {tab === 'journal' && <JournalTab state={viewState} />}
                {tab === 'insights' && <InsightsTab state={viewState} holdings={holdings} cash={cash} />}
                {tab === 'stocks' && <StocksTab allSymbols={allSymbols} />}
                {tab === 'calculators' && <CalculatorsTab />}
                {tab === 'analytics' && <AnalyticsTab state={viewState} holdings={holdings} />}
                {tab === 'alerts' && <AlertsTab state={viewState} holdings={holdings} updater={updater} showToast={showToast} />}
                {tab === 'cash' && <CashTab state={viewState} cash={cash} updater={updater} showToast={showToast} />}
                {tab === 'settings' && <SettingsTab state={viewState} updater={updater} showToast={showToast} />}
              
                {tab === 'audit' && <AuditLogTab state={viewState} updater={updater} showToast={showToast} />}
                {tab === 'tax' && <TaxTab state={viewState} />}
                {tab === 'reconcile' && <ReconcileTab state={viewState} />}


              </div>
            </div>
          </main>
        </div>

        {toast && (
          <div
            className="fixed bottom-6 right-6 z-[150]"
            style={{ animation: 'slideInUp 0.35s cubic-bezier(0.16,1,0.3,1)' }}
          >
            <div
              className="px-5 py-4 rounded-2xl text-[13px] flex items-center gap-3 font-medium backdrop-blur-xl min-w-[280px]"
              style={{
                background: toast.kind === 'warn' ? 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.08))'
                  : toast.kind === 'error' ? 'linear-gradient(135deg, rgba(248,113,113,0.15), rgba(248,113,113,0.08))'
                  : toast.kind === 'success' ? 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(52,211,153,0.08))'
                  : `linear-gradient(135deg, ${C.card}, ${C.bg})`,
                color: toast.kind === 'warn' ? '#fbbf24'
                  : toast.kind === 'error' ? '#f87171'
                  : toast.kind === 'success' ? '#34d399'
                  : C.ink,
                boxShadow: '0 20px 40px -12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
                border: `1px solid ${
                  toast.kind === 'warn' ? 'rgba(251,191,36,0.2)'
                  : toast.kind === 'error' ? 'rgba(248,113,113,0.2)'
                  : toast.kind === 'success' ? 'rgba(52,211,153,0.2)'
                  : C.border
                }`,
              }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{
                background: toast.kind === 'warn' ? '#f59e0b20'
                  : toast.kind === 'error' ? '#ef444420'
                  : toast.kind === 'success' ? '#22c55e20'
                  : C.hover,
              }}>
                {toast.kind === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {toast.kind === 'warn' && <AlertTriangle className="w-4 h-4" />}
                {toast.kind === 'error' && <AlertCircle className="w-4 h-4" />}
                {!['success','warn','error'].includes(toast.kind) && <CheckCircle2 className="w-4 h-4" />}
              </div>
              <span>{toast.msg}</span>
            </div>
            {/* Progress bar */}
            <div className="mt-1 mx-4 h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  background: toast.kind === 'warn' ? '#f59e0b'
                    : toast.kind === 'error' ? '#ef4444'
                    : toast.kind === 'success' ? '#22c55e'
                    : C.accent,
                  animation: 'shrinkWidth 3.5s linear forwards',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </ThemeContext.Provider>
  );
}
