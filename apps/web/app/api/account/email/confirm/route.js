import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { emailChangeHash } from '@/lib/account';
import { publicOrigin } from '@/lib/origin';
import { rateLimit } from '@/lib/http';

// Link from the "confirm your new email" message: /api/account/email/confirm?token=…
export async function GET(req) {
  const origin = publicOrigin(req);
  const back = (code) => NextResponse.redirect(`${origin}/dashboard/account?email=${code}`);
  try { await rateLimit(req, 'email-confirm', 30, 60 * 60 * 1000); } catch { return back('error'); }
  const token = new URL(req.url).searchParams.get('token') || '';
  if (!/^[a-f0-9]{64}$/.test(token)) return back('invalid');
  const db = await getDb();
  const user = await db.users.findByEmailChangeToken(emailChangeHash(token));
  if (!user || !user.pendingEmail) return back('invalid');
  if (new Date(user.emailChangeExpires) < new Date()) return back('expired');
  // Someone may have signed up with that address in the meantime.
  if (await db.users.findByEmail(user.pendingEmail)) return back('taken');
  await db.users.update(user.id, {
    email: user.pendingEmail, emailVerified: true, emailVerifiedAt: new Date().toISOString(),
    pendingEmail: null, emailChangeTokenHash: null, emailChangeExpires: null,
  });
  return back('changed');
}
