function xnpv(rate, flows) {
  if (rate <= -1) return NaN;
  const t0 = flows[0].date;
  return flows.reduce((s, cf) => {
    const y = (cf.date - t0) / (365.25 * 86400000);
    return s + cf.amount / Math.pow(1 + rate, y);
  }, 0);
}

export function xirr(flows, guess = 0.1) {
  if (!flows || flows.length < 2) return null;
  const hasPos = flows.some(f => f.amount > 0);
  const hasNeg = flows.some(f => f.amount < 0);
  if (!hasPos || !hasNeg) return null;
  let rate = guess;
  for (let i = 0; i < 200; i++) {
    const f = xnpv(rate, flows);
    const t0 = flows[0].date;
    const df = flows.reduce((s, cf) => {
      const y = (cf.date - t0) / (365.25 * 86400000);
      return s - (y * cf.amount) / Math.pow(1 + rate, y + 1);
    }, 0);
    if (!isFinite(df) || Math.abs(df) < 1e-12) return null;
    const next = rate - f / df;
    if (!isFinite(next)) return null;
    if (Math.abs(next - rate) < 1e-8) return next;
    rate = Math.max(next, -0.9999);
  }
  return rate;
}

export function cagr(start, end, years) {
  if (start <= 0 || years <= 0) return null;
  return Math.pow(end / start, 1 / years) - 1;
}

export function maxDrawdown(series) {
  if (!series || series.length < 2) return 0;
  let peak = series[0].value;
  let mdd = 0;
  series.forEach(p => {
    if (p.value > peak) peak = p.value;
    const dd = peak > 0 ? (p.value - peak) / peak : 0;
    if (dd < mdd) mdd = dd;
  });
  return mdd;
}
