import { getDb } from '@/lib/db';
import { handler, json, error, readJson, requireUser } from '@/lib/http';

// Save this device's push subscription for the current user.
export const POST = handler(async (req) => {
  const user = await requireUser();
  const { subscription } = await readJson(req);
  const endpoint = String(subscription?.endpoint || '');
  const keys = subscription?.keys || {};
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !keys.p256dh || !keys.auth) return error(400, 'invalid_subscription');
  const db = await getDb();
  await db.push.save(user.id, { endpoint, keys: { p256dh: String(keys.p256dh).slice(0, 200), auth: String(keys.auth).slice(0, 100) } });
  return json({ ok: true });
});
