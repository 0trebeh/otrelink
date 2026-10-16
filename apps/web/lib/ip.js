// Client IP of a request (kept apart from http.js so small modules can use it).

/** Best-effort client IP behind proxies (Render, Vercel, Cloudflare, Nginx). */
export function clientIp(req) {
  const h = req.headers;
  return (
    h.get('cf-connecting-ip')
    || h.get('true-client-ip')
    || (h.get('x-forwarded-for') || '').split(',')[0].trim()
    || h.get('x-real-ip')
    || 'local'
  );
}
