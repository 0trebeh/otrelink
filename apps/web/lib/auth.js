// Session auth: a signed JWT in an httpOnly cookie.
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { config } from './config.js';
import { getDb } from './db/index.js';
import { resolvePlan } from '@otrelink/core';
import { isVerified } from './verify.js';
import { jwtSecretProblem } from './auth-check.js';

const COOKIE = 'ol_session';

export { jwtSecretProblem };
function signingKey() {
  if (process.env.NODE_ENV === 'production' && jwtSecretProblem()) {
    throw new Error(`[otrelink] ${jwtSecretProblem()}. Refusing to sign or read sessions.`);
  }
  return new TextEncoder().encode(config.jwtSecret);
}
const key = { get current() { return signingKey(); } };
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function createSession(user) {
  const token = await new SignJWT({ sub: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key.current);
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
    const { payload } = await jwtVerify(token, key.current);
    const db = await getDb();
    const user = await db.users.findById(payload.sub);
    // Banned accounts lose their sessions right away.
    return user && !user.banned ? publicUser(user) : null;
  } catch {
    return null;
  }
}

export function publicUser(u) {
  const p = resolvePlan(u);
  return {
    id: u.id, email: u.email, name: u.name || '', emailVerified: isVerified(u),
    plan: { id: p.id, label: p.label, maxPages: p.maxPages, features: p.features, custom: Boolean(p.custom) },
    billing: u.billing ? { provider: u.billing.provider, status: u.billing.status, currentPeriodEnd: u.billing.currentPeriodEnd || null } : null,
  };
}
