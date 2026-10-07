// Turns raw events into the numbers shown on the Analytics screen.
import { geoFromTimeZone } from './geo-tz.js';

export function deviceFromUA(ua = '') {
  if (/bot|crawl|spider|preview|facebookexternalhit|slurp/i.test(ua)) return 'bot';
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobi|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function osFromUA(ua = '') {
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/android/i.test(ua)) return 'Android';
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac os x|macintosh/i.test(ua)) return 'macOS';
  if (/cros/i.test(ua)) return 'ChromeOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Other';
}

export function browserFromUA(ua = '') {
  if (/instagram/i.test(ua)) return 'Instagram';
  if (/fban|fbav/i.test(ua)) return 'Facebook';
  if (/tiktok|musical_ly|bytedance/i.test(ua)) return 'TikTok';
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/samsungbrowser/i.test(ua)) return 'Samsung Internet';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua)) return 'Safari';
  return 'Other';
}

export function referrerHost(ref = '') {
  try { return ref ? new URL(ref).hostname.replace(/^www\./, '') : 'direct'; } catch { return 'direct'; }
}

const str = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n) : '');
const int = (v, min, max) => (Number.isInteger(v) && v >= min && v <= max ? v : undefined);

/** Visit details sent by the page (location by IP + local time), cleaned. */
export function cleanVisit(b = {}) {
  const out = {};
  const tz = str(b.tz, 50);
  if (/^(UTC|[A-Za-z_]+(\/[A-Za-z0-9_+-]+){1,2})$/.test(tz)) out.tz = tz;
  const lang = str(b.lang, 20);
  if (/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(lang)) out.lang = lang;
  out.hour = int(b.hour, 0, 23);
  out.wd = int(b.wd, 0, 6);
  const cc = str(b.cc, 3).toUpperCase();
  if (/^[A-Z]{2}$/.test(cc)) out.cc = cc;
  const lat = Number(b.lat);
  const lon = Number(b.lon);
  if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0)) {
    out.lat = Math.round(lat * 100) / 100; // ~1 km
    out.lon = Math.round(lon * 100) / 100;
    const region = str(b.region, 80);
    const city = str(b.city, 80);
    if (region) out.region = region;
    if (city) out.city = city;
  }
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}

const top = (map, n = 8) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, count]) => ({ key, count }));
const inc = (map, k) => { map[k] = (map[k] || 0) + 1; };

/** Hour (0-23) and weekday (0 = Sunday) of an event: the visitor's local time, else the owner's. */
function localTime(e, fallbackTz) {
  if (Number.isInteger(e.hour) && Number.isInteger(e.wd)) return { hour: e.hour, wd: e.wd };
  const d = new Date(e.ts);
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: e.tz || fallbackTz || 'UTC', hour: 'numeric', hourCycle: 'h23', weekday: 'short' }).formatToParts(d);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value) % 24;
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.find((p) => p.type === 'weekday')?.value);
    return { hour, wd };
  } catch { return { hour: d.getUTCHours(), wd: d.getUTCDay() }; }
}

/** Location of an event: by IP, or estimated from its time zone (approx). */
function locationOf(e) {
  if (typeof e.lat === 'number' && typeof e.lon === 'number') return { cc: e.cc || e.country, city: e.city || '', region: e.region || '', lat: e.lat, lon: e.lon, approx: false };
  const g = e.tz ? geoFromTimeZone(e.tz) : null;
  if (g) return { ...g, region: '', approx: true };
  return e.country || e.cc ? { cc: e.cc || e.country, city: '', region: '', lat: null, lon: null, approx: false } : null;
}

export function summarize(events, days, { tz } = {}) {
  const byDay = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    byDay[d] = { date: d, views: 0, clicks: 0 };
  }
  const blocks = {}, devices = {}, referrers = {}, socials = {}, os = {}, browsers = {};
  const countries = { views: {}, clicks: {} };
  const cities = { views: {}, clicks: {} };
  const hours = { views: Array(24).fill(0), clicks: Array(24).fill(0) };
  const weekdays = { views: Array(7).fill(0), clicks: Array(7).fill(0) };
  const points = new Map(); // "lat,lon" → { lat, lon, city, region, cc, views, clicks, approx }
  const recent = [];
  let views = 0, clicks = 0, located = 0, approx = 0;
  const visitors = new Set();

  for (const e of events) {
    const kind = e.type === 'view' ? 'views' : e.type === 'click' ? 'clicks' : null;
    if (!kind) continue;
    const day = byDay[new Date(e.ts).toISOString().slice(0, 10)];
    if (day) day[kind]++;
    const t = localTime(e, tz);
    if (t.hour >= 0) hours[kind][t.hour]++;
    if (t.wd >= 0) weekdays[kind][t.wd]++;

    const loc = locationOf(e);
    if (loc?.cc) inc(countries[kind], loc.cc);
    if (loc?.city) inc(cities[kind], `${loc.city}|${loc.cc || ''}`);
    if (loc && loc.lat !== null) {
      const k = `${loc.lat.toFixed(2)},${loc.lon.toFixed(2)}`;
      if (!points.has(k)) points.set(k, { lat: loc.lat, lon: loc.lon, city: loc.city, region: loc.region, cc: loc.cc || '', views: 0, clicks: 0, approx: loc.approx });
      points.get(k)[kind]++;
    }

    if (kind === 'views') {
      views++;
      if (e.visitor) visitors.add(e.visitor);
      inc(devices, e.device || 'unknown');
      inc(referrers, e.referrer || 'direct');
      if (e.os) inc(os, e.os);
      if (e.browser) inc(browsers, e.browser);
      if (loc && loc.lat !== null) { located++; if (loc.approx) approx++; }
      recent.push({
        ts: e.ts, city: loc?.city || '', region: loc?.region || '', cc: loc?.cc || '', approx: Boolean(loc?.approx),
        device: e.device || '', os: e.os || '', browser: e.browser || '', referrer: e.referrer || 'direct', returning: false, visitor: e.visitor || '',
      });
    } else {
      clicks++;
      if (String(e.target).startsWith('social:')) inc(socials, e.target.slice(7));
      else if (e.target) inc(blocks, e.target);
    }
  }

  // Latest visits first; mark visitors seen before in the range.
  recent.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  const seen = {};
  for (const v of recent) if (v.visitor) seen[v.visitor] = (seen[v.visitor] || 0) + 1;
  const latest = recent.slice(0, 30).map(({ visitor, ...v }) => ({ ...v, returning: Boolean(visitor && seen[visitor] > 1) }));

  const pick = (m) => ({ views: top(m.views, 50), clicks: top(m.clicks, 50) });
  return {
    days,
    totals: { views, clicks, visitors: visitors.size, ctr: views ? clicks / views : 0, located, approx },
    series: Object.values(byDay),
    blocks,
    socials: top(socials, 20),
    devices: top(devices),
    referrers: top(referrers),
    os: top(os),
    browsers: top(browsers),
    countries: pick(countries),
    cities: pick(cities),
    hours,
    weekdays,
    points: [...points.values()].sort((a, b) => (b.views + b.clicks) - (a.views + a.clicks)).slice(0, 500),
    recent: latest,
  };
}
