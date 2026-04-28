// Pakistani CGT brackets by holding period (years)
// Update these when the federal budget changes
export const CGT_BRACKETS_FILER = [
  { maxYears: 1, rate: 0.15 },
  { maxYears: 2, rate: 0.125 },
  { maxYears: 3, rate: 0.10 },
  { maxYears: 4, rate: 0.075 },
  { maxYears: 5, rate: 0.05 },
  { maxYears: 6, rate: 0.025 },
  { maxYears: Infinity, rate: 0 },
];

export const CGT_BRACKETS_NONFILER = [
  { maxYears: 1, rate: 0.30 },
  { maxYears: 2, rate: 0.25 },
  { maxYears: 3, rate: 0.20 },
  { maxYears: 4, rate: 0.15 },
  { maxYears: 5, rate: 0.10 },
  { maxYears: 6, rate: 0.05 },
  { maxYears: Infinity, rate: 0 },
];

export function cgtRateForHolding(years, filer = true) {
  const brackets = filer ? CGT_BRACKETS_FILER : CGT_BRACKETS_NONFILER;
  const b = brackets.find(x => years <= x.maxYears);
  return b ? b.rate : 0;
}

// Compute lot-level CGT for a tax year (July 1 – June 30 in Pakistan)
export function computeTaxLiability(transactions, taxYear, costBasisMethod, filerStatus) {
  // taxYear = e.g. 2024 means FY 2024-25 = July 1 2024 → June 30 2025
  const startDate = new Date(Date.UTC(taxYear, 6, 1));  // July 1
  const endDate = new Date(Date.UTC(taxYear + 1, 5, 30, 23, 59, 59));  // June 30

  // Replay all transactions up to tax-year-end, tracking lots
  const book = {};
  const realizedInYear = [];  // closed-lot pairs with sell date in tax year

  const sorted = [...transactions].sort((a, b) =>
    new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00'))
  );

  for (const t of sorted) {
    const txnDate = new Date(t.date);
    if (txnDate > endDate) break;

    const k = t.ticker;
    if (!book[k]) book[k] = { lots: [] };
    const b = book[k];

    if (t.type === 'BUY' || t.type === 'RIGHTS') {
      b.lots.push({ qty: Number(t.quantity), cost: Number(t.price), date: t.date });
    } else if (t.type === 'BONUS') {
      b.lots.push({ qty: Number(t.quantity), cost: 0, date: t.date });
    } else if (t.type === 'SELL') {
      let remaining = Number(t.quantity);
      const sellPrice = Number(t.price);
      const sellDate = new Date(t.date);
      const inTaxYear = sellDate >= startDate && sellDate <= endDate;
      const sellFees = Number(t.fees || 0) + Number(t.tax || 0);

      if (costBasisMethod === 'LIFO') b.lots.reverse();

      while (remaining > 0 && b.lots.length) {
        const lot = b.lots[0];
        const take = Math.min(lot.qty, remaining);
        const gain = (sellPrice - lot.cost) * take;
        const feesApportioned = sellFees * (take / Number(t.quantity));
        const netGain = gain - feesApportioned;

        if (inTaxYear && netGain > 0) {
          const holdYears = (sellDate - new Date(lot.date)) / (365.25 * 86400000);
          const rate = cgtRateForHolding(holdYears, filerStatus === 'filer');
          realizedInYear.push({
            ticker: k, buyDate: lot.date, sellDate: t.date, qty: take,
            costBasis: lot.cost, sellPrice,
            grossGain: gain, fees: feesApportioned, netGain,
            holdYears, rate, tax: netGain * rate,
          });
        }
        lot.qty -= take;
        remaining -= take;
        if (lot.qty <= 1e-9) b.lots.shift();
      }

      if (costBasisMethod === 'LIFO') b.lots.reverse();
    }
  }

  const totalGain = realizedInYear.reduce((s, r) => s + r.netGain, 0);
  const totalTax = realizedInYear.reduce((s, r) => s + r.tax, 0);

  // Bucket by bracket for display
  const bucketed = {};
  realizedInYear.forEach(r => {
    const key = `${(r.rate * 100).toFixed(1)}%`;
    if (!bucketed[key]) bucketed[key] = { gain: 0, tax: 0, count: 0 };
    bucketed[key].gain += r.netGain;
    bucketed[key].tax += r.tax;
    bucketed[key].count++;
  });

  return {
    taxYear, filerStatus, costBasisMethod,
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
    realizedLots: realizedInYear,
    totalGain, totalTax,
    bucketed,
  };
}