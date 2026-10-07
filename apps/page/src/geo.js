// Approximate visitor location by IP, for Analytics (based on the tinyURL project).
// Free services without an API key: GeoJS and ipwho.is in parallel, ipapi.co as
// a fallback. The IP itself is never stored; coordinates are rounded (~1 km).
// If every service is blocked (ad blockers, Brave…) the dashboard estimates the
// country and city from the visitor's time zone.

const PROVIDERS = [
  {
    name: 'geojs',
    url: 'https://get.geojs.io/v1/ip/geo.json',
    map: (g) => ({ cc: g.country_code, region: g.region, city: g.city, lat: g.latitude, lon: g.longitude }),
  },
  {
    name: 'ipwho.is',
    url: 'https://ipwho.is/?fields=success,country_code,region,city,latitude,longitude',
    map: (g) => (g.success === false ? null : { cc: g.country_code, region: g.region, city: g.city, lat: g.latitude, lon: g.longitude }),
  },
  {
    name: 'ipapi.co',
    url: 'https://ipapi.co/json/',
    map: (g) => (g.error ? null : { cc: g.country_code, region: g.region, city: g.city, lat: g.latitude, lon: g.longitude }),
  },
];

const CACHE = 'ol_geo';
const CACHE_MS = 60 * 60 * 1000; // one lookup per hour per browser

async function fetchJson(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(timer); }
}

async function tryProvider(p, ms) {
  const g = p.map(await fetchJson(p.url, ms));
  const lat = Number(g?.lat);
  const lon = Number(g?.lon);
  if (!g || !Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) throw new Error(`${p.name}: no data`);
  return {
    cc: String(g.cc || '').toUpperCase().slice(0, 2),
    region: String(g.region || '').slice(0, 80),
    city: String(g.city || '').slice(0, 80),
    lat: Math.round(lat * 100) / 100,
    lon: Math.round(lon * 100) / 100,
  };
}

/** Approximate location, or null. Never throws. */
export async function getGeo() {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE) || 'null');
    if (c && Date.now() - c.t < CACHE_MS) return c.geo;
  } catch { /* storage blocked */ }
  let geo = null;
  try {
    geo = await Promise.any(PROVIDERS.slice(0, 2).map((p) => tryProvider(p, 2500)));
  } catch {
    try { geo = await tryProvider(PROVIDERS[2], 2000); } catch { geo = null; }
  }
  try { sessionStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), geo })); } catch { /* ignore */ }
  return geo;
}

/** Time context of the visit, in the visitor's own time zone. */
export function visitContext() {
  const now = new Date();
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { /* old browser */ }
  return { tz: tz.slice(0, 50), lang: (navigator.language || '').slice(0, 20), hour: now.getHours(), wd: now.getDay() };
}
