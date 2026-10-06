// Small helpers for route handlers.
import { NextResponse } from 'next/server';
import { getUser } from './auth.js';
import { getDb } from './db/index.js';
import { config } from './config.js';

export const json = (data, init = {}) => NextResponse.json(data, init);
export const error = (status, code, extra = {}) => NextResponse.json({ error: code, ...extra }, { status });

/** Wrap a handler: catches errors and returns JSON 500s. */
export function handler(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        const res = error(err.status, err.code, err.retryAfter ? { retryAfter: err.retryAfter } : {});
        if (err.retryAfter) res.headers.set('Retry-After', String(err.retryAfter));
        return res;
      }
      console.error(`[otrelink] ${req?.method} ${req?.url ? new URL(req.url).pathname : ''} failed:`, err);
      return error(500, 'internal_error');
    }
  };
}

/** Run a call to Stripe/PayPal; turn their failures into a clear 502. */
export async function provider(fn) {
  try { return await fn(); } catch (err) {
    console.error('[otrelink] payment provider error:', err.message);
    throw Object.assign(new HttpError(502, 'payment_provider_error'), { cause: err });
  }
}

export class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new HttpError(401, 'unauthorized');
  return user;
}

/** Load a page and make sure the current user owns it. */
export async function requireOwnedPage(id) {
  const user = await requireUser();
  const db = await getDb();
  const page = await db.pages.findById(id);
  if (!page || page.userId !== user.id) throw new HttpError(404, 'page_not_found');
  return { user, db, page };
}

export async function readJson(req) {
  try { return await req.json(); } catch { throw new HttpError(400, 'invalid_json'); }
}

/** CORS headers for the public API (used by the separate link page app). */
export function corsHeaders(req) {
  const origin = req.headers.get('origin') || '';
  const allowed = config.corsOrigins.includes('*') ? '*' : config.corsOrigins.includes(origin) ? origin : '';
  return allowed
    ? { 'Access-Control-Allow-Origin': allowed, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
    : {};
}

// Very small in-memory rate limiter (per process). Good enough for a single
// server; swap for Redis/Upstash if you scale horizontally.
// Note: buckets live in memory, so a restart/redeploy resets them.
const buckets = new Map();

/** Best-effort client IP behind proxies (Render, Vercel, Cloudflare, Nginx). */
export function clientIp(req) {
  const h = req.headers;
  return (
    h.get('cf-connecting-ip')
    || h.get('true-client-ip')
    || (h.get('x-forwarded-for') || '').split(',')[0].trim()
    || h.get('x-real-ip')
    || 'local'
  );
}

export function rateLimit(req, name, limit, windowMs) {
  const key = `${name}:${clientIp(req)}`;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return;
  }
  if (++b.count > limit) {
    const err = new HttpError(429, 'too_many_requests');
    err.retryAfter = Math.ceil((b.reset - now) / 1000);
    throw err;
  }
}
