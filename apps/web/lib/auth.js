// Session auth: a signed JWT in an httpOnly cookie.
import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import { config } from './config.js';
import { getDb } from './db/index.js';
import { resolvePlan } from '@otrelink/core';
import { isVerified } from './verify.js';
import { jwtSecretProblem } from './auth-check.js';
import { bearerToken, hashToken, tokenAllows, tokenExpired, TOKEN_RATE_LIMIT } from './tokens.js';

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

/**
 * The signed-in user, or null. Browsers use the session cookie; scripts and
 * MCP servers send a personal API token (Authorization: Bearer otl_…), which
 * only works on the routes in lib/tokens.js and only on the Business plan.
 * A request with a token never falls back to the cookie.
 */
export async function getUser() {
  const h = await headers();
  const token = bearerToken(h.get('authorization'));
  if (token) return userFromToken(token, h);
  const store = await cookies();
  const session = store.get(COOKIE)?.value;
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, key.current);
    const db = await getDb();
    const user = await db.users.findById(payload.sub);
    // Banned accounts lose their sessions right away.
    return user && !user.banned ? publicUser(user) : null;
  } catch {
    return null;
  }
}

/** Reasons a token was refused, so the client can show something useful. */
export class TokenError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; this.isHttp = true; }
}

async function userFromToken(token, h) {
  // proxy.js always sets these from the real request (any value sent by the client is replaced).
  const path = h.get('x-ol-path');
  const method = h.get('x-ol-method');
  // Pages outside /api (dashboard…) never accept tokens.
  if (!path || !method) return null;
  const db = await getDb();
  const t = await db.tokens.findByHash(hashToken(token));
  if (!t) throw new TokenError(401, 'invalid_token');
  if (tokenExpired(t)) throw new TokenError(401, 'token_expired');
  const allowed = tokenAllows(path, method, t.scope);
  if (!allowed.ok) throw new TokenError(403, allowed.reason);
  const user = await db.users.findById(t.userId);
  if (!user || user.banned) throw new TokenError(401, 'invalid_token');
  const pub = publicUser(user);
  if (!pub.plan.features.api) throw new TokenError(403, 'api_not_in_plan');
  const { rateLimitKey } = await import('./http.js');
  await rateLimitKey('token', t.id, TOKEN_RATE_LIMIT, 60_000);
  // "Last used" is saved at most once a minute.
  if (!t.lastUsedAt || Date.now() - Date.parse(t.lastUsedAt) > 60_000) db.tokens.touch(t.id).catch(() => {});
  return { ...pub, auth: { type: 'token', tokenId: t.id, scope: t.scope } };
}

export function publicUser(u) {
  const p = resolvePlan(u);
  return {
    id: u.id, email: u.email, name: u.name || '', emailVerified: isVerified(u),
    plan: { id: p.id, label: p.label, maxPages: p.maxPages, features: p.features, custom: Boolean(p.custom) },
    // Pro for free from referrals (until this date), when not paying for it.
    proTrialUntil: u.plan === 'pro' && u.proTrial?.until && new Date(u.proTrial.until) > new Date() && !['active', 'past_due'].includes(u.billing?.status) ? u.proTrial.until : null,
    billing: u.billing ? { provider: u.billing.provider, status: u.billing.status, currentPeriodEnd: u.billing.currentPeriodEnd || null } : null,
  };
}
