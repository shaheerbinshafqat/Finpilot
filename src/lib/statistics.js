// Compute daily returns from a portfolio history series
export function dailyReturns(series) {
  const returns = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].value;
    const curr = series[i].value;
    if (prev > 0) returns.push({ date: series[i].date, ret: (curr - prev) / prev });
  }
  return returns;
}

export function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

export function stdev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

// Sharpe ratio: annualized (risk-free rate as annual decimal, e.g. 0.20 for 20% T-bill)
export function sharpe(returns, riskFreeAnnual = 0.20) {
  if (returns.length < 10) return null;
  const rets = returns.map(r => r.ret);
  const dailyRF = riskFreeAnnual / 252;
  const excess = rets.map(r => r - dailyRF);
  const m = mean(excess);
  const s = stdev(excess);
  if (s === 0) return null;
  return (m / s) * Math.sqrt(252);
}

// Sortino ratio: only penalizes downside volatility
export function sortino(returns, riskFreeAnnual = 0.20) {
  if (returns.length < 10) return null;
  const rets = returns.map(r => r.ret);
  const dailyRF = riskFreeAnnual / 252;
  const excess = rets.map(r => r - dailyRF);
  const negatives = excess.filter(x => x < 0);
  if (negatives.length < 2) return null;
  const m = mean(excess);
  const downStdev = Math.sqrt(negatives.reduce((s, x) => s + x * x, 0) / negatives.length);
  if (downStdev === 0) return null;
  return (m / downStdev) * Math.sqrt(252);
}

// Beta vs. benchmark (simple regression)
export function beta(portfolioReturns, benchmarkReturns) {
  // Match dates
  const benchMap = Object.fromEntries(benchmarkReturns.map(r => [r.date, r.ret]));
  const pairs = portfolioReturns
    .filter(r => benchMap[r.date] !== undefined)
    .map(r => ({ p: r.ret, b: benchMap[r.date] }));
  if (pairs.length < 10) return null;

  const pArr = pairs.map(x => x.p);
  const bArr = pairs.map(x => x.b);
  const pMean = mean(pArr);
  const bMean = mean(bArr);

  let cov = 0, bVar = 0;
  for (let i = 0; i < pairs.length; i++) {
    cov += (pArr[i] - pMean) * (bArr[i] - bMean);
    bVar += (bArr[i] - bMean) ** 2;
  }
  if (bVar === 0) return null;
  return cov / bVar;
}

// Correlation
export function correlation(a, b) {
  const bMap = Object.fromEntries(b.map(r => [r.date, r.ret]));
  const pairs = a.filter(r => bMap[r.date] !== undefined).map(r => ({ a: r.ret, b: bMap[r.date] }));
  if (pairs.length < 10) return null;
  const aArr = pairs.map(x => x.a);
  const bArr = pairs.map(x => x.b);
  const aMean = mean(aArr);
  const bMean = mean(bArr);
  let num = 0, aDenom = 0, bDenom = 0;
  for (let i = 0; i < pairs.length; i++) {
    num += (aArr[i] - aMean) * (bArr[i] - bMean);
    aDenom += (aArr[i] - aMean) ** 2;
    bDenom += (bArr[i] - bMean) ** 2;
  }
  const denom = Math.sqrt(aDenom * bDenom);
  return denom === 0 ? null : num / denom;
}

// Volatility (annualized)
export function volatility(returns) {
  if (returns.length < 10) return null;
  return stdev(returns.map(r => r.ret)) * Math.sqrt(252);
}

// KSE-100 history → daily returns
export function benchmarkReturns(kseHistory) {
  return dailyReturns(kseHistory.map(k => ({ date: k.date, value: k.value })));
}