import { summarize } from '@/lib/analytics';
import { handler, json, requireOwnedPage } from '@/lib/http';

export const GET = handler(async (req, { params }) => {
  const { db, page } = await requireOwnedPage((await params).id);
  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get('days')) || 30));
  const since = new Date(Date.now() - (days - 1) * 864e5);
  since.setUTCHours(0, 0, 0, 0);
  const events = await db.events.listForPage(page.id, since);
  // Owner's time zone: hour / weekday of old visits that didn't send their local time.
  const tz = String(new URL(req.url).searchParams.get('tz') || '').slice(0, 50);
  return json(summarize(events, days, { tz }));
});
