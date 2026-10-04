import { getDb } from '@/lib/db';
import { handler, json, error, requireUser } from '@/lib/http';

// Owner: delete one survey response.
export const DELETE = handler(async (_req, { params }) => {
  const user = await requireUser();
  const db = await getDb();
  const r = await db.responses.findById((await params).id);
  if (!r || r.userId !== user.id) return error(404, 'not_found');
  await db.responses.remove(r.id);
  return json({ ok: true });
});
