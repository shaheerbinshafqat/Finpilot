export function computeHoldings(transactions, prices, method = 'FIFO') {
  const book = {};
  const sorted = [...transactions].sort((a, b) =>
    new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00'))
  );

  for (const t of sorted) {
    const k = t.ticker;
    if (!book[k]) book[k] = {
      ticker: k, name: t.name || k, sector: t.sector || 'Other', assetType: t.assetType || 'PSX',
      lots: [], realized: 0, firstBuy: null, totalFees: 0, totalTax: 0,
      buys: 0, sells: 0, dividends: 0, bonusShares: 0,
      closedTrades: [],
    };
    const b = book[k];
    const fees = Number(t.fees || 0);
    const tax = Number(t.tax || 0);
    b.totalFees += fees;
    b.totalTax += tax;

    if (t.type === 'BUY') {
      b.lots.push({ qty: Number(t.quantity), cost: Number(t.price), date: t.date });
      b.buys += Number(t.quantity);
      if (!b.firstBuy) b.firstBuy = t.date;
    } else if (t.type === 'DIVIDEND') {
      // Dividend: cash income, doesn't touch lots. quantity field = amount in PKR, price ignored.
      const amount = Number(t.quantity) || Number(t.amount) || 0;
      b.dividends += amount - tax;
      b.realized += amount - tax;
    } else if (t.type === 'BONUS') {
      // Bonus shares: add shares at zero cost (they dilute avg cost naturally)
      const bonusQty = Number(t.quantity);
      b.lots.push({ qty: bonusQty, cost: 0, date: t.date });
      b.bonusShares += bonusQty;
    } else if (t.type === 'RIGHTS') {
      // Rights issue: add shares at the subscription price
      b.lots.push({ qty: Number(t.quantity), cost: Number(t.price), date: t.date });
    } else if (t.type === 'SELL') {
      let remaining = Number(t.quantity);
      const sellPrice = Number(t.price);
      b.sells += Number(t.quantity);

      if (method === 'AVERAGE') {
        const totalQty = b.lots.reduce((s, l) => s + l.qty, 0);
        if (totalQty > 0) {
          const totalCost = b.lots.reduce((s, l) => s + l.qty * l.cost, 0);
          const avg = totalCost / totalQty;
          const take = Math.min(remaining, totalQty);
          const pnl = (sellPrice - avg) * take;
          b.realized += pnl;
          const earliestBuy = b.lots.length ? b.lots[0].date : null;
          if (earliestBuy) b.closedTrades.push({
            buyDate: earliestBuy, sellDate: t.date, qty: take, pnl,
            pnlPct: avg > 0 ? ((sellPrice - avg) / avg) * 100 : 0,
          });
          const ratio = take / totalQty;
          b.lots = b.lots.map(l => ({ ...l, qty: l.qty * (1 - ratio) })).filter(l => l.qty > 1e-9);
        }
      } else {
        if (method === 'LIFO') b.lots.reverse();
        while (remaining > 0 && b.lots.length) {
          const lot = b.lots[0];
          const take = Math.min(lot.qty, remaining);
          const pnl = (sellPrice - lot.cost) * take;
          b.realized += pnl;
          b.closedTrades.push({
            buyDate: lot.date, sellDate: t.date, qty: take, pnl,
            pnlPct: lot.cost > 0 ? ((sellPrice - lot.cost) / lot.cost) * 100 : 0,
          });
          lot.qty -= take;
          remaining -= take;
          if (lot.qty <= 1e-9) b.lots.shift();
        }
        if (method === 'LIFO') b.lots.reverse();
      }
      b.realized -= fees + tax;
    }
  }

  return Object.values(book).map(b => {
    const qty = b.lots.reduce((s, l) => s + l.qty, 0);
    const invested = b.lots.reduce((s, l) => s + l.qty * l.cost, 0);
    const avg = qty > 0 ? invested / qty : 0;
    const priceRec = prices[b.ticker];
    const live = priceRec ? Number(priceRec.price) : avg;
    const prev = priceRec?.prev;
    const dayChange = prev && prev > 0 ? ((live - prev) / prev) * 100 : null;
    const value = qty * live;
    const unrealized = value - invested;
    const unrealizedPct = invested > 0 ? (unrealized / invested) * 100 : 0;
    const days = b.firstBuy ? Math.max(1, Math.round((Date.now() - new Date(b.firstBuy)) / 86400000)) : 0;
    // Total return includes dividends
    const totalReturn = unrealized + b.realized;
    const totalReturnPct = invested > 0 ? (totalReturn / invested) * 100 : 0;
    return {
      ticker: b.ticker, name: b.name, sector: b.sector, assetType: b.assetType,
      quantity: qty, avgPrice: avg, invested, livePrice: live, prevPrice: prev, dayChange,
      currentValue: value, unrealized, unrealizedPct, realized: b.realized,
      dividends: b.dividends, bonusShares: b.bonusShares,
      totalReturn, totalReturnPct,
      totalFees: b.totalFees, totalTax: b.totalTax,
      firstBuy: b.firstBuy, holdingDays: days, priceTimestamp: priceRec?.timestamp,
      priceStale: !priceRec,
      volume: priceRec?.volume ?? null,
      closedTrades: b.closedTrades,
    };
  });
}

export function computeCash(cashMoves, transactions) {
  let cash = 0;
  cashMoves.forEach(m => { cash += m.type === 'DEPOSIT' ? Number(m.amount) : -Number(m.amount); });
  transactions.forEach(t => {
    if (t.type === 'BUY' || t.type === 'RIGHTS') {
      const gross = Number(t.quantity) * Number(t.price);
      const fees = Number(t.fees || 0) + Number(t.tax || 0);
      cash -= (gross + fees);
    } else if (t.type === 'SELL') {
      const gross = Number(t.quantity) * Number(t.price);
      const fees = Number(t.fees || 0) + Number(t.tax || 0);
      cash += (gross - fees);
    } else if (t.type === 'DIVIDEND') {
      // Dividend: quantity field holds PKR amount
      const amount = Number(t.quantity) || Number(t.amount) || 0;
      const tax = Number(t.tax || 0);
      cash += (amount - tax);
    }
    // BONUS adds shares without touching cash
  });
  return cash;
}