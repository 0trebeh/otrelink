import bcrypt from 'bcryptjs';
import { createDefaultPage, sanitizeSlug, sanitizePage } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { createSession, publicUser } from '@/lib/auth';
import { handler, json, error, readJson, rateLimit } from '@/lib/http';
import { newVerification, sendVerificationEmail, verificationEnabled } from '@/lib/verify';
import { publicOrigin } from '@/lib/origin';
import { recordSignup } from '@/lib/referrals';

export const POST = handler(async (req) => {
  await rateLimit(req, 'register', 15, 15 * 60 * 1000);
  // At most 5 new accounts per IP per day (stops mass sign-ups).
  await rateLimit(req, 'register-day', 5, 24 * 60 * 60 * 1000);
  const body = await readJson(req);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const slug = sanitizeSlug(body.slug);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error(400, 'invalid_email');
  if (password.length < 8) return error(400, 'weak_password');
  if (!slug) return error(400, 'invalid_slug');

  const db = await getDb();
  if (await db.users.findByEmail(email)) return error(409, 'email_taken');
  // Also taken while another new account waits to confirm its email with it.
  if (await db.pages.findBySlug(slug) || await db.users.findByPendingSlug(slug)) return error(409, 'slug_taken');

  // New accounts confirm their email before their page is shown (when email sending is set up).
  const verify = verificationEnabled() ? newVerification() : null;
  const name = String(body.name || '').slice(0, 60);
  const user = await db.users.create({
    email, name, passwordHash: await bcrypt.hash(password, 10), plan: 'free',
    emailVerified: !verify,
    // No page until the email is confirmed: keep the chosen username for then.
    ...(verify ? { ...verify.patch, pendingSlug: slug, pendingTitle: name || `@${slug}` } : {}),
  });
  // Signed up with someone's referral link (…/register?ref=CODE).
  if (body.ref) await recordSignup(db, user, body.ref);
  if (verify) {
    await sendVerificationEmail({ email, name, token: verify.token, origin: publicOrigin(req) });
    await createSession(user);
    return json({ user: publicUser({ ...user, emailVerified: false }), pageId: null, verifyEmail: true }, { status: 201 });
  }
  const content = sanitizePage(createDefaultPage({ slug, title: body.name ? String(body.name) : `@${slug}` }));
  const page = await db.pages.create({ userId: user.id, slug, ...content });

  await createSession(user);
  return json({ user: publicUser(user), pageId: page.id }, { status: 201 });
});
