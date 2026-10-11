import { getDb } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { checkPassword, hashPassword } from '@/lib/account';
import { handler, json, error, requireUser, readJson, rateLimit } from '@/lib/http';

// Change the password: { current, next }. Every other device is signed out;
// this one gets a fresh session.
export const POST = handler(async (req) => {
  const user = await requireUser();
  await rateLimit(req, 'password-change', 10, 15 * 60 * 1000, user.id);
  const { current, next } = await readJson(req);
  const db = await getDb();
  const full = await db.users.findById(user.id);
  if (!(await checkPassword(full, current))) return error(401, 'wrong_password');
  const pw = String(next || '');
  if (pw.length < 8) return error(400, 'weak_password');
  if (pw.length > 200) return error(400, 'password_too_long');
  if (pw === String(current)) return error(400, 'same_password');
  const updated = await db.users.update(user.id, { passwordHash: await hashPassword(pw), sessionsValidAfter: new Date().toISOString() });
  await createSession(updated);
  return json({ ok: true });
});
