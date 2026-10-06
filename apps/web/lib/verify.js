// Email verification for new accounts.
// It is on when email sending is configured (RESEND_API_KEY + EMAIL_FROM).
// Accounts created before this existed (no `emailVerified` field) count as verified.
import crypto from 'node:crypto';
import { createDefaultPage, sanitizePage } from '@otrelink/core';
import { sendEmail, emailConfigured } from './notify.js';

const HOURS = 48;
export const hashToken = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
export const isVerified = (u) => u?.emailVerified !== false;
export const verificationEnabled = () => emailConfigured();

/** Fields for a new or re-sent verification. Returns { token, patch }. */
export function newVerification() {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    patch: { verifyTokenHash: hashToken(token), verifyExpires: new Date(Date.now() + HOURS * 3600e3).toISOString() },
  };
}

/**
 * Mark the account as confirmed and create the page it chose when it signed up
 * (pages can't be created before). → { pageId } or { pageId: null, slugTaken }
 */
export async function completeVerification(db, user) {
  await db.users.update(user.id, {
    emailVerified: true, emailVerifiedAt: new Date().toISOString(), verifyTokenHash: null, verifyExpires: null,
    pendingSlug: null, pendingTitle: null,
  });
  if (!user.pendingSlug || (await db.pages.countByUser(user.id)) > 0) return { pageId: null };
  // Someone else may have taken the username after this reservation expired.
  if (await db.pages.findBySlug(user.pendingSlug)) return { pageId: null, slugTaken: true };
  try {
    const content = sanitizePage(createDefaultPage({ slug: user.pendingSlug, title: user.pendingTitle || `@${user.pendingSlug}` }));
    const page = await db.pages.create({ userId: user.id, slug: user.pendingSlug, ...content });
    return { pageId: page.id };
  } catch (err) {
    if (err.code === 'slug_taken') return { pageId: null, slugTaken: true };
    throw err;
  }
}

export async function sendVerificationEmail({ email, name, token, origin }) {
  const link = `${origin}/api/auth/verify?token=${token}`;
  const text = `Hi${name ? ` ${name}` : ''},

Confirm your email to publish your Otrelink page:
${link}

The link works for ${HOURS} hours. If you didn't create an Otrelink account, ignore this email.

— Otrelink`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#17171f;max-width:480px">
<p>Hi${name ? ` ${escapeHtml(name)}` : ''},</p>
<p>Confirm your email to publish your Otrelink page.</p>
<p><a href="${link}" style="display:inline-block;background:#7a2cf0;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:999px">Confirm my email</a></p>
<p style="color:#6a6a78;font-size:13px">The link works for ${HOURS} hours. If you didn't create an Otrelink account, ignore this email.</p>
</div>`;
  return sendEmail({ to: email, subject: 'Confirm your email — Otrelink', text, html });
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
