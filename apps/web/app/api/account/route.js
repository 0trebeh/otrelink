import { getDb } from '@/lib/db';
import { destroySession } from '@/lib/auth';
import { accountInfo, cleanName, checkPassword, cancelBillingNow } from '@/lib/account';
import { handler, json, error, requireUser, readJson, rateLimit } from '@/lib/http';

// The signed-in user's account (Dashboard → Account).
export const GET = handler(async () => {
  const user = await requireUser();
  const db = await getDb();
  return json({ account: accountInfo(await db.users.findById(user.id)) });
});

// { name }
export const PATCH = handler(async (req) => {
  const user = await requireUser();
  const body = await readJson(req);
  const db = await getDb();
  const patch = {};
  if (body.name !== undefined) patch.name = cleanName(body.name);
  const updated = await db.users.update(user.id, patch);
  return json({ account: accountInfo(updated) });
});

// Delete the account and everything in it. { password, confirmEmail }
// A paid subscription is cancelled first (no refund); if that fails, nothing is deleted.
export const DELETE = handler(async (req) => {
  const user = await requireUser();
  await rateLimit(req, 'account-delete', 5, 60 * 60 * 1000, user.id);
  const { password, confirmEmail } = await readJson(req);
  const db = await getDb();
  const full = await db.users.findById(user.id);
  if (String(confirmEmail || '').trim().toLowerCase() !== full.email) return error(400, 'confirm_email_mismatch');
  if (!(await checkPassword(full, password))) return error(401, 'wrong_password');
  try { await cancelBillingNow(full); } catch (err) {
    console.error('[otrelink] account delete: cancel failed:', err.message);
    return error(502, 'cancel_failed');
  }
  await db.users.remove(user.id);
  await destroySession();
  return json({ ok: true });
});
