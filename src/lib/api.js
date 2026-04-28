// Centralized API helper for psxterminal.com with CORS proxy fallback

const PROXIES = [
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` // fallback only
];

export async function psxFetch(path) {
  const directUrl = `https://psxterminal.com${path}`;

  // In a browser, directUrl will always fail CORS. So go straight to proxy.
  for (const proxy of PROXIES) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000); // 5s timeout
      const r = await fetch(proxy(directUrl), { signal: ctrl.signal });
      clearTimeout(timer);
      if (r.ok) {
        const data = await r.json();
        if (data?.success !== undefined) return data;
      }
    } catch {}
  }

  return { success: false, data: null };
}
