import { getDb } from '@/lib/db';
import { toOwnerBooking } from '@/lib/bookings';
import { handler, json, requireOwnedPage } from '@/lib/http';

// Owner: list bookings of a page.
//   ?pageId=…&view=upcoming|pending|past|cancelled
//   ?pageId=…&count=1  → { pending } (number of upcoming bookings waiting for confirmation)
export const GET = handler(async (req) => {
  const q = new URL(req.url).searchParams;
  const { page } = await requireOwnedPage(q.get('pageId'));
  const db = await getDb();
  const now = new Date().toISOString();

  if (q.get('count')) {
    const pending = await db.bookings.list({ pageId: page.id, statuses: ['pending'], from: now, limit: 1000 });
    return json({ pending: pending.length });
  }

  const view = q.get('view') || 'upcoming';
  const filters = {
    upcoming: { from: now, statuses: ['pending', 'confirmed'] },
    pending: { from: now, statuses: ['pending'] },
    past: { to: now, statuses: ['pending', 'confirmed'], desc: true, limit: 200 },
    cancelled: { statuses: ['cancelled'], desc: true, limit: 200 },
  }[view] || {};
  const list = await db.bookings.list({ pageId: page.id, ...filters });
  return json({ bookings: list.map(toOwnerBooking) });
});
