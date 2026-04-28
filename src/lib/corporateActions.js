// Apply split to all historical transactions for a ticker
// ratio 2 means 2-for-1 split (price halves, qty doubles)
export function applySplit(transactions, ticker, ratio, effectiveDate) {
  return transactions.map(t => {
    if (t.ticker !== ticker) return t;
    if (new Date(t.date) > new Date(effectiveDate)) return t;
    if (t.type === 'BUY' || t.type === 'SELL' || t.type === 'RIGHTS') {
      return {
        ...t,
        quantity: Number(t.quantity) * ratio,
        price: Number(t.price) / ratio,
        _splitAdjusted: [...(t._splitAdjusted || []), { date: effectiveDate, ratio }],
      };
    }
    return t;
  });
}