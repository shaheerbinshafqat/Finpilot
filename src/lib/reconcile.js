import { computeHoldings } from './portfolio.js';

// Compute holdings as of a specific date (replay transactions up to that date)
export function holdingsAsOf(transactions, prices, method, asOfDate) {
  const cutoff = new Date(asOfDate + 'T23:59:59');
  const filtered = transactions.filter(t => new Date(t.date) <= cutoff);
  return computeHoldings(filtered, prices, method);
}

// Compare app's holdings against broker statement
// brokerRows: [{ ticker, quantity, avgPrice? }]
export function reconcile(appHoldings, brokerRows) {
  const appMap = Object.fromEntries(appHoldings.map(h => [h.ticker, h]));
  const brokerMap = Object.fromEntries(brokerRows.map(r => [r.ticker.toUpperCase(), r]));
  const allTickers = new Set([...Object.keys(appMap), ...Object.keys(brokerMap)]);

  const rows = [];
  for (const t of allTickers) {
    const app = appMap[t];
    const broker = brokerMap[t];
    const appQty = app?.quantity || 0;
    const brokerQty = Number(broker?.quantity) || 0;
    const diff = appQty - brokerQty;
    const absDiff = Math.abs(diff);
    let status = 'match';
    if (!app) status = 'missing-in-app';
    else if (!broker) status = 'missing-in-broker';
    else if (absDiff > 0.001) status = diff > 0 ? 'app-higher' : 'app-lower';

    rows.push({
      ticker: t,
      appQty, brokerQty, diff, absDiff,
      appValue: app?.currentValue || 0,
      appAvg: app?.avgPrice || 0,
      brokerAvg: broker?.avgPrice ? Number(broker.avgPrice) : null,
      status,
    });
  }

  const summary = {
    total: rows.length,
    matching: rows.filter(r => r.status === 'match').length,
    issues: rows.filter(r => r.status !== 'match').length,
    missingInApp: rows.filter(r => r.status === 'missing-in-app').length,
    missingInBroker: rows.filter(r => r.status === 'missing-in-broker').length,
    mismatched: rows.filter(r => r.status === 'app-higher' || r.status === 'app-lower').length,
  };

  return { rows: rows.sort((a, b) => b.absDiff - a.absDiff), summary };
}

// Parse pasted broker statement (very forgiving — try multiple formats)
export function parseBrokerStatement(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const rows = [];

  // Try CSV header row
  const hasHeader = /ticker|symbol|scrip/i.test(lines[0] || '');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  for (const line of dataLines) {
    const parts = line.split(/[\s,|\t]+/).filter(Boolean);
    if (parts.length < 2) continue;
    const ticker = parts[0].toUpperCase();
    const qty = Number(String(parts[1]).replace(/[,₨]/g, ''));
    const avgPrice = parts[2] ? Number(String(parts[2]).replace(/[,₨]/g, '')) : null;
    if (ticker.length >= 2 && !isNaN(qty) && qty >= 0) {
      rows.push({ ticker, quantity: qty, avgPrice });
    }
  }
  return rows;
}