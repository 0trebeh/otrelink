// Public origin of this app (e.g. https://otrelink.onrender.com).
// Behind a proxy (Render, Vercel, Nginx) `req.url` is the internal address
// (http://localhost:10000), so prefer APP_URL, then the forwarded headers.
export function publicOrigin(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const h = req.headers;
  const host = (h.get('x-forwarded-host') || h.get('host') || '').split(',')[0].trim();
  const proto = (h.get('x-forwarded-proto') || '').split(',')[0].trim() || (host.startsWith('localhost') ? 'http' : 'https');
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}
