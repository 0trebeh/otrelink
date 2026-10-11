// The user's own account: name, email, password, sessions and deleting it.
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { sendEmail, emailConfigured } from './notify.js';
import * as stripe from './billing/stripe.js';
import * as paypal from './billing/paypal.js';
import { ACTIVE } from './billing/index.js';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const cleanEmail = (v) => String(v || '').trim().toLowerCase().slice(0, 254);
export const cleanName = (v) => String(v || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 80);
export const checkPassword = (user, password) => bcrypt.compare(String(password || ''), user?.passwordHash || '');
export const hashPassword = (password) => bcrypt.hash(String(password), 10);
const sha = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
const HOURS = 48;

/** What the account page shows. */
export const accountInfo = (u) => ({
  name: u.name || '', email: u.email, createdAt: u.createdAt || null,
  pendingEmail: u.pendingEmail && u.emailChangeExpires && new Date(u.emailChangeExpires) > new Date() ? u.pendingEmail : null,
});

/**
 * Start changing the email. With email sending configured, a link goes to the
 * new address and nothing changes until it is opened. Without it (local
 * installs), the email changes right away. → { patch, token? }
 */
export function emailChange(email) {
  if (!emailConfigured()) return { patch: { email, pendingEmail: null, emailChangeTokenHash: null, emailChangeExpires: null }, direct: true };
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    patch: { pendingEmail: email, emailChangeTokenHash: sha(token), emailChangeExpires: new Date(Date.now() + HOURS * 3600e3).toISOString() },
  };
}
export const emailChangeHash = sha;

export async function sendEmailChange({ to, oldEmail, name, token, origin }) {
  const link = `${origin}/api/account/email/confirm?token=${token}`;
  const hi = `Hi${name ? ` ${name}` : ''},`;
  const text = `${hi}\n\nConfirm ${to} as the new email of your Otrelink account (now ${oldEmail}):\n${link}\n\nThe link works for ${HOURS} hours. If you didn't ask for this, ignore this email.\n\n— Otrelink`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#17171f;max-width:480px">
<p>${esc(hi)}</p><p>Confirm <b>${esc(to)}</b> as the new email of your Otrelink account (now ${esc(oldEmail)}).</p>
<p><a href="${link}" style="display:inline-block;background:#7a2cf0;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:999px">Confirm new email</a></p>
<p style="color:#6a6a78;font-size:13px">The link works for ${HOURS} hours. If you didn't ask for this, ignore this email.</p></div>`;
  const sent = await sendEmail({ to, subject: 'Confirm your new email — Otrelink', text, html });
  // Heads-up to the current address (in case someone else is doing it).
  await sendEmail({
    to: oldEmail,
    subject: 'Your Otrelink email is being changed',
    text: `${hi}\n\nSomeone signed in to your Otrelink account asked to change its email to ${to}. If it wasn't you, change your password now.\n\n— Otrelink`,
  }).catch(() => null);
  return sent;
}

/** Stop charging right away (deleting the account). Returns the new billing or null. */
export async function cancelBillingNow(user, reason = 'Account deleted') {
  const b = user.billing;
  if (!b?.subscriptionId || !ACTIVE.includes(b.status)) return null;
  if (b.provider === 'stripe') await stripe.cancelSubscription(b.subscriptionId);
  else if (b.provider === 'paypal') await paypal.cancelSubscription(b.subscriptionId, reason);
  return { ...b, status: 'canceled', endsAt: new Date().toISOString(), downgraded: true };
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
