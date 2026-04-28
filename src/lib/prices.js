import { psxFetch } from './api.js';

const PRICE_CACHE_KEY = 'psx_price_cache';
const CACHE_TTL_MINUTES = 15;

function loadCache() {
  try { return JSON.parse(localStorage.getItem(PRICE_CACHE_KEY) || '{}'); }
  catch { return {}; }
}

function saveCache(cache) {
  try { localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(cache)); } catch { }
}

export async function tryFetchPSXPrice(ticker) {
  try {
    const res = await psxFetch(`/api/ticks/REG/${ticker}`);

    if (res?.success && res?.data) {
      const data = res.data;
      const price = Number(data.price);
      const change = Number(data.change || 0);

      const result = {
        price: price,
        volume: Number(data.volume || 0),
        prev: price - change,
        source: 'psxterminal.com',
        fetchedAt: Date.now(),
        stale: false,
      };

      const cache = loadCache();
      cache[ticker] = result;
      saveCache(cache);
      return result;
    }
  } catch (e) {
    console.error(`Price fetch failed for ${ticker}:`, e);
  }

  // Fallback to cache
  const cache = loadCache();
  const cached = cache[ticker];
  if (cached) {
    const ageMin = (Date.now() - cached.fetchedAt) / 60000;
    if (ageMin < CACHE_TTL_MINUTES * 4) {
      return { ...cached, stale: true, staleMinutes: Math.floor(ageMin) };
    }
  }
  return null;
}

export function getFetchHealth() {
  return [];
}