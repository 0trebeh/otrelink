import { getDb } from '@/lib/db';
import { requireAdmin, toAdminUser } from '@/lib/admin';
import { handler, json } from '@/lib/http';

// Admin: list users.  ?q=email or name&plan=free|pro|business&status=active|banned|paying&page=1
export const GET = handler(async (req) => {
  requireAdmin(req);
  const q = new URL(req.url).searchParams;
  const per = 50;
  const page = Math.max(1, Number(q.get('page')) || 1);
  const db = await getDb();
  const { users, total } = await db.users.list({
    q: String(q.get('q') || '').slice(0, 100), plan: q.get('plan') || '', status: q.get('status') || '', skip: (page - 1) * per, limit: per,
  });
  const rows = await Promise.all(users.map(async (u) => toAdminUser(u, { pages: await db.pages.countByUser(u.id) })));
  return json({ users: rows, total, page, pages: Math.max(1, Math.ceil(total / per)) });
});
