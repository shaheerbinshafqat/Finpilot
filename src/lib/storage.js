const STORE_KEY = 'psx_cc_v3';

export const defaultState = {
  transactions: [],
  prices: {},
  expenses: [],
  cashMoves: [],
  alerts: [],
  risk: {},
  tickerNotes: {},
  portfolioHistory: [],
  kseHistory: [],
  auditLog: [],          // NEW
  deletedItems: [],      // NEW — soft-deleted rows live here for 30 days
  accounts: [
    { id: 'default', name: 'Main Account', type: 'CDC', color: '#BBF547' },
  ],
  
  //NEW
  benchmarks: {
  kse100: [],
  kse30: [],
  kmi30: [],
  tbill: [],
  inflation: [],
},
// keep kseHistory for backward compat — it maps to benchmarks.kse100

  settings: {
    // ...existing settings unchanged...
    currency: 'PKR',
    defaultFees: 0.15,
    defaultCGT: 12.5,
    concentrationLimit: 25,
    lastPriceUpdate: null,
    autoFetchEnabled: true,
    costBasisMethod: 'FIFO',
    theme: 'light',
    webhookUrls: ['', ''],
    webhookEvents: { alerts: true, bigMove: false, dailySummary: false },
    bigMoveThreshold: 5,
    volSpikeThreshold: 2,
    auditRetentionDays: 30,   // NEW — how long soft-deleted items stick around
    activeAccountId: 'default', 
  },
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('saveState failed', e);
  }
}
