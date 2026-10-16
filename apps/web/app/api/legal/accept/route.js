// An existing account accepts the current Terms and Privacy Policy (dashboard banner).
import { getUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { handler, json, error, rateLimit } from '@/lib/http';
import { recordConsent } from '@/lib/legal';

export const POST = handler(async (req) => {
  const user = await getUser();
  if (!user) return error(401, 'unauthorized');
  await rateLimit(req, 'legal-accept', 20, 60 * 60 * 1000);
  const db = await getDb();
  const patch = await recordConsent(db, req, { userId: user.id, email: user.email, method: 'update' });
  await db.users.update(user.id, patch);
  return json({ ok: true, legal: patch.legal });
});
