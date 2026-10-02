// Session auth: a signed JWT in an httpOnly cookie.
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { config } from './config.js';
import { getDb } from './db/index.js';

const COOKIE = 'ol_session';
const key = new TextEncoder().encode(config.jwtSecret);
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function createSession(user) {
  const token = await new SignJWT({ sub: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Returns { id, email, name } or null. */
export async function getUser() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    const db = await getDb();
    const user = await db.users.findById(payload.sub);
    return user ? publicUser(user) : null;
  } catch {
    return null;
  }
}

export function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name || '' };
}
