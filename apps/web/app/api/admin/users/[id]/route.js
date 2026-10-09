import { PLAN_IDS, sanitizeLimits } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { config } from '@/lib/config';
import { requireAdmin, toAdminUser } from '@/lib/admin';
import { completeVerification } from '@/lib/verify';
import * as stripe from '@/lib/billing/stripe';
import * as paypal from '@/lib/billing/paypal';
import { handler, json, error, readJson } from '@/lib/http';
import { qualifyReferral } from '@/lib/referrals';

async function load(params) {
  const db = await getDb();
  const user = await db.users.findById(String((await params).id || ''));
  return { db, user };
}

async function details(db, user) {
  const pages = await db.pages.listByUser(user.id);
  return toAdminUser(user, {
    pages: pages.map((p) => ({
      id: p.id, slug: p.slug, title: p.profile?.title || '', published: Boolean(p.settings?.published),
      blocks: (p.blocks || []).length, updatedAt: p.updatedAt, url: `${config.pageUrl}/${p.slug}`,
    })),
  });
}

/** Stop charging a user (used when the admin asks for it). */
async function cancelBilling(user) {
  const b = user.billing;
  if (!b?.subscriptionId || !['active', 'past_due'].includes(b.status)) return null;
  if (b.provider === 'stripe') await stripe.cancelSubscription(b.subscriptionId);
  else if (b.provider === 'paypal') await paypal.cancelSubscription(b.subscriptionId, 'Cancelled by the administrator');
  return { ...b, status: 'canceled', endsAt: new Date().toISOString(), downgraded: true, cancelledByAdmin: true };
}

export const GET = handler(async (req, { params }) => {
  requireAdmin(req);
  const { db, user } = await load(params);
  if (!user) return error(404, 'not_found');
  return json({ user: await details(db, user) });
});

// { plan?, limits?, banned?, bannedReason?, note?, cancelSubscription? }
export const PATCH = handler(async (req, { params }) => {
  requireAdmin(req);
  const { db, user } = await load(params);
  if (!user) return error(404, 'not_found');
  const body = await readJson(req);
  const patch = {};
  if (body.plan !== undefined) {
    if (!PLAN_IDS.includes(body.plan)) return error(400, 'invalid_plan');
    patch.plan = body.plan;
    // A plan set by hand replaces free Pro from referrals.
    if (user.proTrial) patch.proTrial = null;
  }
  if (body.limits !== undefined) patch.limits = sanitizeLimits(body.limits);
  if (body.banned !== undefined) {
    patch.banned = Boolean(body.banned);
    patch.bannedAt = patch.banned ? (user.bannedAt || new Date().toISOString()) : null;
    patch.bannedReason = patch.banned ? String(body.bannedReason ?? user.bannedReason ?? '').slice(0, 300) : '';
  } else if (body.bannedReason !== undefined) patch.bannedReason = String(body.bannedReason).slice(0, 300);
  if (body.note !== undefined) patch.note = String(body.note).slice(0, 2000);
  if (body.emailVerified === true && user.emailVerified === false) await completeVerification(db, user);
  if (body.cancelSubscription) {
    try {
      const billing = await cancelBilling(user);
      if (billing) patch.billing = billing;
    } catch (err) {
      return error(502, 'cancel_failed', { message: err.message });
    }
  }
  const updated = await db.users.update(user.id, patch);
  // Moving a referred account to Business counts as subscribing.
  if (patch.plan === 'business' && user.plan !== 'business') await qualifyReferral(db, user.id, 'admin').catch((err) => console.error('[otrelink] referral qualify failed:', err));
  return json({ user: await details(db, updated) });
});

// Delete the account and everything it owns. Body: { confirmEmail } must match.
export const DELETE = handler(async (req, { params }) => {
  requireAdmin(req);
  const { db, user } = await load(params);
  if (!user) return error(404, 'not_found');
  const { confirmEmail, cancelSubscription } = await readJson(req);
  if (String(confirmEmail || '').toLowerCase() !== user.email) return error(400, 'confirm_email_mismatch');
  if (cancelSubscription) await cancelBilling(user).catch(() => null);
  await db.users.remove(user.id);
  return json({ ok: true });
});
