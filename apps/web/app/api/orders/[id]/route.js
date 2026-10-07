import { getDb } from '@/lib/db';
import { handler, json, error, readJson, requireVerifiedUser } from '@/lib/http';
import { toOwnerOrder, ORDER_STATUSES } from '@/lib/orders';

// Change the status of an order: { status: 'preparing' | 'ready' | 'done' | 'cancelled' | 'new' }
export const PATCH = handler(async (req, { params }) => {
  const user = await requireVerifiedUser();
  const db = await getDb();
  const order = await db.orders.findById(String((await params).id || ''));
  if (!order || order.userId !== user.id) return error(404, 'not_found');
  const { status } = await readJson(req);
  if (!ORDER_STATUSES.includes(status)) return error(400, 'invalid_status');
  if (status === order.status) return json({ order: toOwnerOrder(order) });
  const history = [...(order.history || []), { status, at: new Date().toISOString() }].slice(-20);
  const updated = await db.orders.update(order.id, { status, history });
  return json({ order: toOwnerOrder(updated) });
});
