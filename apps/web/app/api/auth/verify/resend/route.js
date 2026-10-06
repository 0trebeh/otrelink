import { getDb } from '@/lib/db';
import { newVerification, sendVerificationEmail, isVerified, verificationEnabled } from '@/lib/verify';
import { publicOrigin } from '@/lib/origin';
import { handler, json, error, requireUser, rateLimit } from '@/lib/http';

// Send the verification email again (max 3 per hour per account).
export const POST = handler(async (req) => {
  const user = await requireUser();
  await rateLimit(req, 'verify-resend', 3, 60 * 60 * 1000, user.id);
  const db = await getDb();
  const dbUser = await db.users.findById(user.id);
  if (isVerified(dbUser)) return json({ ok: true, alreadyVerified: true });
  if (!verificationEnabled()) return error(503, 'email_not_configured');
  const { token, patch } = newVerification();
  await db.users.update(user.id, patch);
  const sent = await sendVerificationEmail({ email: dbUser.email, name: dbUser.name, token, origin: publicOrigin(req) });
  if (!sent) return error(502, 'email_failed');
  return json({ ok: true });
});
