export async function fireWebhooks(urls, payload) {
  const results = [];
  for (const url of urls.filter(Boolean)) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors',
      });
      results.push({ url, ok: r.ok, status: r.status });
    } catch {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors',
        });
        results.push({ url, ok: true, status: 'sent (opaque)' });
      } catch (err) {
        results.push({ url, ok: false, status: String(err) });
      }
    }
  }
  return results;
}
