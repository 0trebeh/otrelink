// Personal API tokens (Business plan, feature "api"). A token lets a script or
// an MCP server act as its owner on a small set of routes:
//
//   Authorization: Bearer otl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//
// Only a SHA-256 hash of the token is stored; the token itself is shown once
// when it is created. This file has no Next.js or database imports so the
// proxy (proxy.js) can use the route list too.
import crypto from 'node:crypto';

export const TOKEN_PREFIX = 'otl_';
export const MAX_TOKENS = 10;
export const TOKEN_SCOPES = ['read', 'write'];
/** Days until a token expires (0 = never). */
export const TOKEN_EXPIRY_DAYS = [30, 90, 365, 0];
/** Requests per minute for one token. */
export const TOKEN_RATE_LIMIT = 120;

/**
 * Routes a token may call, with the methods. Everything else (account, billing,
 * admin, the token routes themselves, orders, bookings…) needs the browser session.
 * `write` tokens may use every method listed; `read` tokens only GET.
 */
export const TOKEN_ROUTES = [
  { path: /^\/api\/auth\/me$/, methods: ['GET'], label: 'GET /api/auth/me' },
  { path: /^\/api\/pages$/, methods: ['GET', 'POST'], label: 'GET, POST /api/pages' },
  { path: /^\/api\/pages\/[^/]+$/, methods: ['GET', 'PUT', 'DELETE'], label: 'GET, PUT, DELETE /api/pages/:id' },
  { path: /^\/api\/pages\/[^/]+\/today$/, methods: ['GET', 'PATCH'], label: 'GET, PATCH /api/pages/:id/today' },
  { path: /^\/api\/pages\/[^/]+\/analytics$/, methods: ['GET'], label: 'GET /api/pages/:id/analytics' },
  { path: /^\/api\/slug-check$/, methods: ['GET'], label: 'GET /api/slug-check' },
  { path: /^\/api\/assets$/, methods: ['POST'], label: 'POST /api/assets' },
];

/** Whether a token may call `method path`. `scope` = 'read' | 'write'. */
export function tokenAllows(path, method, scope = 'write') {
  const m = String(method || 'GET').toUpperCase();
  const route = TOKEN_ROUTES.find((r) => r.path.test(path));
  if (!route) return { ok: false, reason: 'token_route_not_allowed' };
  if (m === 'OPTIONS' || m === 'HEAD') return { ok: true };
  if (!route.methods.includes(m)) return { ok: false, reason: 'token_route_not_allowed' };
  if (scope !== 'write' && m !== 'GET') return { ok: false, reason: 'token_read_only' };
  return { ok: true };
}

export const looksLikeToken = (s) => typeof s === 'string' && /^otl_[A-Za-z0-9_-]{43}$/.test(s);

/** The token from an Authorization header, or '' (only Otrelink tokens, not the admin key). */
export function bearerToken(header) {
  const m = String(header || '').match(/^Bearer\s+(\S+)$/i);
  return m && m[1].startsWith(TOKEN_PREFIX) ? m[1] : '';
}

export const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

/** A new token: { token (show once), hash (store), hint ("otl_AbCd…wxyz") }. */
export function newToken() {
  const token = TOKEN_PREFIX + crypto.randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token), hint: `${token.slice(0, 8)}…${token.slice(-4)}` };
}

/** Clean what the dashboard sends when creating a token. */
export function sanitizeTokenInput(body = {}) {
  const name = String(body.name || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 60) || 'API token';
  const scope = TOKEN_SCOPES.includes(body.scope) ? body.scope : 'write';
  const days = TOKEN_EXPIRY_DAYS.includes(Number(body.expiresInDays)) ? Number(body.expiresInDays) : 90;
  const expiresAt = days ? new Date(Date.now() + days * 864e5).toISOString() : null;
  return { name, scope, expiresAt };
}

export const tokenExpired = (t, now = Date.now()) => Boolean(t?.expiresAt) && Date.parse(t.expiresAt) <= now;

/** What the dashboard sees (never the hash). */
export const toPublicToken = (t) => ({
  id: t.id, name: t.name, scope: t.scope, hint: t.hint,
  createdAt: t.createdAt, lastUsedAt: t.lastUsedAt || null, expiresAt: t.expiresAt || null,
  expired: tokenExpired(t),
});
