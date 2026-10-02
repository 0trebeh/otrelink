import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { createSession, publicUser } from '@/lib/auth';
import { handler, json, error, readJson, rateLimit } from '@/lib/http';

export const POST = handler(async (req) => {
  rateLimit(req, 'login', 20, 15 * 60 * 1000);
  const { email, password } = await readJson(req);
  const db = await getDb();
  const user = await db.users.findByEmail(String(email || '').trim().toLowerCase());
  const ok = user && (await bcrypt.compare(String(password || ''), user.passwordHash || ''));
  if (!ok) return error(401, 'invalid_credentials');
  await createSession(user);
  return json({ user: publicUser(user) });
});
