export const SECTORS = [
  'Commercial Banks', 'Cement', 'Oil & Gas Exploration', 'Oil & Gas Marketing',
  'Fertilizer', 'Power Generation', 'Textile', 'Technology & Communication',
  'Pharmaceuticals', 'Food & Personal Care', 'Automobile Assembler', 'Chemical',
  'Engineering', 'Insurance', 'Tobacco', 'Refinery', 'Paper & Board', 'Other',
];

export const TXN_TYPES = ['BUY', 'SELL', 'DIVIDEND', 'BONUS', 'RIGHTS'];

export const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Bills & Utilities', 'Shopping', 'Rent', 'Health', 'Entertainment', 'Education', 'Groceries', 'Travel', 'Subscriptions', 'Other'];
export const PAYMENT_METHODS = ['Cash', 'Bank Debit', 'Credit Card', 'JazzCash', 'Easypaisa', 'SadaPay', 'NayaPay', 'Other'];
export const ASSET_TYPES = ['PSX', 'Crypto', 'Forex', 'Intl. Stocks', 'Other'];
export const STRATEGIES = ['Long-term', 'Swing', 'Intraday', 'Positional', 'Dividend', 'Arbitrage'];
export const EMOTIONS = ['Confident', 'Analytical', 'FOMO', 'Fear', 'Greed', 'Panic', 'Neutral', 'Regret'];
export const SENTIMENTS = ['Positive', 'Neutral', 'Negative'];

export const COST_BASIS_METHODS = [
  { value: 'FIFO', label: 'FIFO — First in, first out' },
  { value: 'LIFO', label: 'LIFO — Last in, first out' },
  { value: 'AVERAGE', label: 'Average — Weighted avg per sell' },
];

export const POPULAR_TICKERS = [
  { symbol: 'LUCK', name: 'Lucky Cement', sector: 'Cement' },
  { symbol: 'ENGRO', name: 'Engro Corporation', sector: 'Chemical' },
  { symbol: 'OGDC', name: 'Oil & Gas Dev. Co.', sector: 'Oil & Gas Exploration' },
  { symbol: 'PPL', name: 'Pakistan Petroleum', sector: 'Oil & Gas Exploration' },
  { symbol: 'POL', name: 'Pakistan Oilfields', sector: 'Oil & Gas Exploration' },
  { symbol: 'HBL', name: 'Habib Bank', sector: 'Commercial Banks' },
  { symbol: 'UBL', name: 'United Bank', sector: 'Commercial Banks' },
  { symbol: 'MCB', name: 'MCB Bank', sector: 'Commercial Banks' },
  { symbol: 'MEBL', name: 'Meezan Bank', sector: 'Commercial Banks' },
  { symbol: 'BAHL', name: 'Bank Al Habib', sector: 'Commercial Banks' },
  { symbol: 'FFC', name: 'Fauji Fertilizer', sector: 'Fertilizer' },
  { symbol: 'EFERT', name: 'Engro Fertilizers', sector: 'Fertilizer' },
  { symbol: 'FFBL', name: 'Fauji Fertilizer Bin Qasim', sector: 'Fertilizer' },
  { symbol: 'HUBC', name: 'Hub Power', sector: 'Power Generation' },
  { symbol: 'KEL', name: 'K-Electric', sector: 'Power Generation' },
  { symbol: 'PSO', name: 'Pakistan State Oil', sector: 'Oil & Gas Marketing' },
  { symbol: 'APL', name: 'Attock Petroleum', sector: 'Oil & Gas Marketing' },
  { symbol: 'SYSTEMS', name: 'Systems Ltd.', sector: 'Technology & Communication' },
  { symbol: 'TRG', name: 'TRG Pakistan', sector: 'Technology & Communication' },
  { symbol: 'NETSOL', name: 'NetSol Technologies', sector: 'Technology & Communication' },
  { symbol: 'DGKC', name: 'D.G. Khan Cement', sector: 'Cement' },
  { symbol: 'MLCF', name: 'Maple Leaf Cement', sector: 'Cement' },
  { symbol: 'PIOC', name: 'Pioneer Cement', sector: 'Cement' },
  { symbol: 'PAEL', name: 'Pak Elektron', sector: 'Engineering' },
  { symbol: 'NESTLE', name: 'Nestlé Pakistan', sector: 'Food & Personal Care' },
  { symbol: 'SEARL', name: 'Searle Company', sector: 'Pharmaceuticals' },
  { symbol: 'INDU', name: 'Indus Motor', sector: 'Automobile Assembler' },
  { symbol: 'PSMC', name: 'Pak Suzuki Motor', sector: 'Automobile Assembler' },
];

export const TICKER_BY_SYMBOL = Object.fromEntries(POPULAR_TICKERS.map(t => [t.symbol, t]));

export const CSV_FIELDS = [
  { key: 'date', label: 'Date *', required: true },
  { key: 'type', label: 'Type *', required: true },
  { key: 'ticker', label: 'Ticker *', required: true },
  { key: 'quantity', label: 'Quantity *', required: true },
  { key: 'price', label: 'Price *', required: true },
  { key: 'fees', label: 'Fees' },
  { key: 'tax', label: 'Tax' },
  { key: 'time', label: 'Time' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'entryReason', label: 'Notes' },
];

export const BROKER_PRESETS = {
  generic: { label: 'Generic CSV', map: { date: 'date', type: 'type', ticker: 'ticker', quantity: 'quantity', price: 'price', fees: 'fees' } },
  psx_portal: { label: 'PSX Portal Export', map: { date: 'Trade Date', type: 'Transaction', ticker: 'Symbol', quantity: 'Quantity', price: 'Rate', fees: 'Commission' } },
  akd: { label: 'AKD / Taurus style', map: { date: 'Date', type: 'B/S', ticker: 'Scrip', quantity: 'Volume', price: 'Rate', fees: 'Brokerage', tax: 'CVT' } },
  custom: { label: 'Custom — map manually', map: {} },
};
