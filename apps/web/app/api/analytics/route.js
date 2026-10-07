import { getDb } from '@/lib/db';
import { summarize } from '@/lib/analytics';
import { handler, json, requireVerifiedUser } from '@/lib/http';

// Simple analytics for all the pages of the signed-in user (dashboard home).
export const GET = handler(async (req) => {
  const user = await requireVerifiedUser();
  const q = new URL(req.url).searchParams;
  const days = Math.min(365, Math.max(1, Number(q.get('days')) || 30));
  const tz = String(q.get('tz') || '').slice(0, 50);
  const since = new Date(Date.now() - (days - 1) * 864e5);
  since.setUTCHours(0, 0, 0, 0);

  const db = await getDb();
  const pages = await db.pages.listByUser(user.id);
  const all = [];
  const perPage = [];
  for (const p of pages) {
    const events = await db.events.listForPage(p.id, since);
    all.push(...events);
    const t = summarize(events, days, { tz }).totals;
    perPage.push({ id: p.id, slug: p.slug, title: p.profile?.title || '', published: Boolean(p.settings?.published), views: t.views, clicks: t.clicks, visitors: t.visitors, ctr: t.ctr });
  }
  const s = summarize(all, days, { tz });
  const peak = (arr) => { const max = Math.max(...arr); return max > 0 ? arr.indexOf(max) : null; };
  return json({
    days,
    totals: s.totals,
    series: s.series,
    pages: perPage.sort((a, b) => b.views - a.views || b.clicks - a.clicks),
    countries: s.countries.views.slice(0, 6),
    referrers: s.referrers.slice(0, 6),
    devices: s.devices,
    busiestHour: peak(s.hours.views),
    busiestDay: peak(s.weekdays.views),
  });
});
