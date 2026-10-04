import { getDb } from '@/lib/db';
import { handler, json, readJson, requireUser } from '@/lib/http';

// Forget this device's push subscription.
export const POST = handler(async (req) => {
  const user = await requireUser();
  const { endpoint } = await readJson(req);
  const db = await getDb();
  const mine = (await db.push.listByUser(user.id)).some((s) => s.endpoint === endpoint);
  if (mine) await db.push.remove(endpoint);
  return json({ ok: true });
});
