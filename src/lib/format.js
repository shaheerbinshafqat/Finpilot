export const fmtPKR = (n, d = 0) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Number(n));
  if (abs >= 1e7) return `${sign}₨${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}₨${(abs / 1e5).toFixed(2)}L`;
  return `${sign}₨${abs.toLocaleString('en-PK', { maximumFractionDigits: d, minimumFractionDigits: d })}`;
};

export const fmtNum = (n, d = 2) =>
  n === null || n === undefined || isNaN(n)
    ? '—'
    : Number(n).toLocaleString('en-PK', { maximumFractionDigits: d, minimumFractionDigits: d });

export const fmtPct = (n, d = 2) =>
  n === null || n === undefined || isNaN(n)
    ? '—'
    : `${n >= 0 ? '+' : ''}${Number(n).toFixed(d)}%`;

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
