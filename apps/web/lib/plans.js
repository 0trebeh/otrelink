// Server helpers for plans (see packages/core/src/plans.js for what each plan allows).
import { resolvePlan, allowsBlock, featureForBlock, PLAN_FEATURES } from '@otrelink/core';
import { HttpError } from './http.js';

/** Plan summary sent to the dashboard. */
export const planSummary = (user) => {
  const p = resolvePlan(user);
  return { id: p.id, label: p.label, maxPages: p.maxPages, features: p.features, custom: Boolean(p.custom) };
};

/**
 * Plan of a page's owner. null = the page must not be shown (owner missing,
 * banned, or a new account that hasn't confirmed its email yet).
 */
export async function ownerPlan(db, page) {
  const owner = page?.userId ? await db.users.findById(page.userId) : null;
  if (!owner || owner.banned || owner.emailVerified === false) return null;
  return resolvePlan(owner);
}

/**
 * Throw 403 plan_required when the page owner's plan doesn't include the block
 * type (used by the public booking / survey / reviews endpoints).
 */
export async function requireBlockAllowed(db, page, type) {
  const plan = await ownerPlan(db, page);
  if (!plan) throw new HttpError(404, 'not_found');
  if (!allowsBlock(plan, type)) throw Object.assign(new HttpError(403, 'plan_required'), { feature: featureForBlock(type) });
  return plan;
}

export const featureLabel = (key) => PLAN_FEATURES[key]?.label || key;
