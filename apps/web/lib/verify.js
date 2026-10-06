// Email verification for new accounts.
// It is on when email sending is configured (RESEND_API_KEY + EMAIL_FROM).
// Accounts created before this existed (no `emailVerified` field) count as verified.
import crypto from 'node:crypto';
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
