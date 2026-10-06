import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { handler, json } from '@/lib/http';

// Admin: totals, users per plan, paying users and sign-ups of the last 30 days.
export const GET = handler(async (req) => {
  requireAdmin(req);
  const db = await getDb();
  const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  return json(await db.users.stats(since));
});
