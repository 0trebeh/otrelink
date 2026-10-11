import { getDb } from '@/lib/db';
import { accountInfo, cleanEmail, EMAIL_RE, checkPassword, emailChange, sendEmailChange } from '@/lib/account';
import { publicOrigin } from '@/lib/origin';
import { handler, json, error, requireUser, readJson, rateLimit } from '@/lib/http';

// Change the email: { email, password }. A link goes to the new address; the
// email changes when it is opened (right away if email sending isn't set up).
export const POST = handler(async (req) => {
  const user = await requireUser();
  await rateLimit(req, 'email-change', 5, 60 * 60 * 1000, user.id);
  const body = await readJson(req);
  const email = cleanEmail(body.email);
  if (!EMAIL_RE.test(email)) return error(400, 'invalid_email');
  const db = await getDb();
  const full = await db.users.findById(user.id);
  if (!(await checkPassword(full, body.password))) return error(401, 'wrong_password');
  if (email === full.email) return error(400, 'same_email');
  if (await db.users.findByEmail(email)) return error(409, 'email_in_use');
  const change = emailChange(email);
  if (!change.direct) {
    const sent = await sendEmailChange({ to: email, oldEmail: full.email, name: full.name, token: change.token, origin: publicOrigin(req) });
    if (!sent) return error(502, 'email_failed');
  }
  const updated = await db.users.update(user.id, change.patch);
  return json({ account: accountInfo(updated), changed: Boolean(change.direct) });
});

// Cancel a pending change.
export const DELETE = handler(async () => {
  const user = await requireUser();
  const db = await getDb();
  const updated = await db.users.update(user.id, { pendingEmail: null, emailChangeTokenHash: null, emailChangeExpires: null });
  return json({ account: accountInfo(updated) });
});
