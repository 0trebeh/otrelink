import { getDb } from '@/lib/db';
import { handler, json, error, requireVerifiedUser } from '@/lib/http';
import { toOwnerOrder, ACTIVE_ORDER_STATUSES } from '@/lib/orders';

// Orders of one of my pages.
//   GET ?pageId=…&scope=active|done[&count=1]
//   count=1 → { pending } (new orders, for the badge)
export const GET = handler(async (req) => {
  const user = await requireVerifiedUser();
  const q = new URL(req.url).searchParams;
  const db = await getDb();
  const page = await db.pages.findById(String(q.get('pageId') || ''));
  if (!page || page.userId !== user.id) return error(404, 'page_not_found');
  if (q.get('count')) return json({ pending: await db.orders.count({ pageId: page.id, statuses: ['new'] }) });
  const active = q.get('scope') !== 'done';
  const list = await db.orders.list({
    pageId: page.id,
    statuses: active ? ACTIVE_ORDER_STATUSES : ['done', 'cancelled'],
    limit: active ? 200 : 100,
  });
  return json({ orders: list.map(toOwnerOrder) });
});
