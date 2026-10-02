// Turns raw events into the numbers shown on the Analytics screen.

export function deviceFromUA(ua = '') {
  if (/bot|crawl|spider|preview|facebookexternalhit|slurp/i.test(ua)) return 'bot';
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobi|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function referrerHost(ref = '') {
  try { return ref ? new URL(ref).hostname.replace(/^www\./, '') : 'direct'; } catch { return 'direct'; }
}

const top = (map, n = 8) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, count]) => ({ key, count }));
const inc = (map, k) => { map[k] = (map[k] || 0) + 1; };

export function summarize(events, days) {
  const byDay = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    byDay[d] = { date: d, views: 0, clicks: 0 };
  }
  const blocks = {}, devices = {}, referrers = {}, countries = {}, socials = {};
  let views = 0, clicks = 0;
  const visitors = new Set();

  for (const e of events) {
    const day = byDay[String(e.ts).slice(0, 10)];
    if (e.type === 'view') {
      views++;
      if (day) day.views++;
      if (e.visitor) visitors.add(e.visitor);
      inc(devices, e.device || 'unknown');
      inc(referrers, e.referrer || 'direct');
      if (e.country) inc(countries, e.country);
    } else if (e.type === 'click') {
      clicks++;
      if (day) day.clicks++;
      if (String(e.target).startsWith('social:')) inc(socials, e.target.slice(7));
      else if (e.target) inc(blocks, e.target);
    }
  }

  return {
    days,
    totals: { views, clicks, visitors: visitors.size, ctr: views ? clicks / views : 0 },
    series: Object.values(byDay),
    blocks,
    socials: top(socials, 20),
    devices: top(devices),
    referrers: top(referrers),
    countries: top(countries),
  };
}
