import { getDb } from '@/lib/db';
import { deviceFromUA, osFromUA, browserFromUA, referrerHost, cleanVisit } from '@/lib/analytics';
import { handler, corsHeaders, rateLimit, HttpError } from '@/lib/http';

// Analytics beacon from the public page: { pageId, type: 'view'|'click', target?, referrer?, visitor?,
//   tz?, lang?, hour?, wd?, cc?, region?, city?, lat?, lon? }  (location is approximate, by IP, never the IP)
export const POST = handler(async (req) => {
  await rateLimit(req, 'track', 120, 60 * 1000);
  const headers = corsHeaders(req);
  let body;
  try { body = JSON.parse(await req.text()); } catch { throw new HttpError(400, 'invalid_json'); }
  const type = body.type === 'click' ? 'click' : body.type === 'view' ? 'view' : null;
  const pageId = String(body.pageId || '').slice(0, 64);
  if (!type || !pageId) return new Response(null, { status: 400, headers });

  const ua = req.headers.get('user-agent') || '';
  const device = deviceFromUA(ua);
  if (device === 'bot') return new Response(null, { status: 204, headers });

  const db = await getDb();
  const page = await db.pages.findById(pageId);
  if (!page) return new Response(null, { status: 404, headers });

  await db.events.insert({
    pageId,
    type,
    target: type === 'click' ? String(body.target || '').slice(0, 80) : undefined,
    referrer: type === 'view' ? referrerHost(String(body.referrer || '')) : undefined,
    visitor: String(body.visitor || '').slice(0, 40) || undefined,
    device,
    os: osFromUA(ua),
    browser: browserFromUA(ua),
    // Country set by most hosts/CDNs (Vercel, Cloudflare, Netlify), used when the page sent none.
    country: (req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || req.headers.get('x-country') || '').slice(0, 2).toUpperCase() || undefined,
    ...cleanVisit(body),
  });
  return new Response(null, { status: 204, headers });
});

export const OPTIONS = (req) => new Response(null, { status: 204, headers: corsHeaders(req) });
