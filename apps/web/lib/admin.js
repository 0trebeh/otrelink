// Admin API helpers. The admin dashboard (separate app: Otrelink-Admin) calls
// /api/admin/* from its server with:  Authorization: Bearer <ADMIN_API_KEY>
import crypto from 'node:crypto';
import { resolvePlan, PLAN_FEATURES, groupedFeatures } from '@otrelink/core';
import { config } from './config.js';
import { HttpError, clientIp } from './http.js';

const fails = new Map(); // ip → { n, reset }

export function requireAdmin(req) {
  if (!config.adminApiKey || config.adminApiKey.length < 24) throw new HttpError(503, 'admin_api_disabled');
  const ip = clientIp(req);
  const f = fails.get(ip);
  if (f && f.n >= 10 && f.reset > Date.now()) throw new HttpError(429, 'too_many_requests');
  const got = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(got);
  const b = Buffer.from(config.adminApiKey);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    fails.set(ip, { n: (f && f.reset > Date.now() ? f.n : 0) + 1, reset: Date.now() + 15 * 60e3 });
    throw new HttpError(401, 'unauthorized');
  }
}

/** What the admin sees about a user (never the password hash or secret tokens). */
export function toAdminUser(u, extra = {}) {
  const p = resolvePlan(u);
  const b = u.billing;
  return {
    id: u.id, email: u.email, name: u.name || '', createdAt: u.createdAt,
    plan: u.plan || null, // null = account from before plans (works as Pro)
    effectivePlan: { id: p.id, label: p.label, maxPages: p.maxPages, features: p.features },
    // Every feature a Business plan can turn on or off (the admin app shows a switch for each).
    featureLabels: Object.fromEntries(Object.entries(PLAN_FEATURES).map(([k, f]) => [k, f.label])),
    // The same features grouped by kind: [{ id, label, features: [{ key, label, free }] }].
    featureGroups: groupedFeatures(),
    limits: u.limits || null,
    banned: Boolean(u.banned), bannedAt: u.bannedAt || null, bannedReason: u.bannedReason || '',
    note: u.note || '',
    emailVerified: u.emailVerified !== false,
    billing: b ? {
      provider: b.provider, status: b.status, subscriptionId: b.subscriptionId || '', customerId: b.customerId || '',
      currentPeriodEnd: b.currentPeriodEnd || null, cancelAtPeriodEnd: Boolean(b.cancelAtPeriodEnd), endsAt: b.endsAt || null,
    } : null,
    ...extra,
  };
}
