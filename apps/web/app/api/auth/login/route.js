import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { createSession, publicUser } from '@/lib/auth';
import { handler, json, error, readJson, rateLimit, checkLimit } from '@/lib/http';

const FAILS = 8; // wrong passwords per account…
const WINDOW = 15 * 60 * 1000; // …within 15 minutes lock that account for the rest of the window

export const POST = handler(async (req) => {
  await rateLimit(req, 'login', 20, 15 * 60 * 1000);
  const { email, password } = await readJson(req);
  const address = String(email || '').trim().toLowerCase().slice(0, 254);
  // Per-account lock: many wrong passwords from any IPs block that account for a while.
  await checkLimit('login-fail', address, FAILS, WINDOW);
  const db = await getDb();
  const user = await db.users.findByEmail(address);
  const ok = user && (await bcrypt.compare(String(password || ''), user.passwordHash || ''));
  if (!ok) {
    await rateLimit(req, 'login-fail', 1000, WINDOW, address).catch(() => {}); // count the failure
    return error(401, 'invalid_credentials');
  }
  if (user.banned) return error(403, 'account_banned');
  await createSession(user);
  return json({ user: publicUser(user) });
});
