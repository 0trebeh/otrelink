import { sanitizeInvoice } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { handler, json, error, readJson, requireVerifiedUser } from '@/lib/http';
import { toOwnerInvoice, newInvoiceToken } from '@/lib/invoices';

async function load(params) {
  const user = await requireVerifiedUser();
  const db = await getDb();
  const inv = await db.invoices.findById(String((await params).id || ''));
  return { user, db, inv: inv && inv.userId === user.id ? inv : null };
}

export const GET = handler(async (req, { params }) => {
  const { inv } = await load(params);
  if (!inv) return error(404, 'not_found');
  const origin = new URL(req.url).origin;
  // Link the client can open to download the PDF (no account needed).
  return json({ invoice: toOwnerInvoice(inv), link: `${origin}/api/public/invoices/${inv.id}?token=${inv.token}` });
});

// Save the whole invoice (the number never changes).
export const PUT = handler(async (req, { params }) => {
  const { user, db, inv } = await load(params);
  if (!inv) return error(404, 'not_found');
  if (!user.plan?.features?.invoices) return error(403, 'plan_required', { feature: 'invoices' });
  const clean = sanitizeInvoice(await readJson(req));
  const paidAt = clean.status === 'paid' ? inv.paidAt || new Date().toISOString() : null;
  const updated = await db.invoices.update(inv.id, { ...clean, paidAt });
  return json({ invoice: toOwnerInvoice(updated) });
});

export const DELETE = handler(async (_req, { params }) => {
  const { db, inv } = await load(params);
  if (!inv) return error(404, 'not_found');
  await db.invoices.remove(inv.id);
  return json({ ok: true });
});

// New client link (the old one stops working): POST { action: 'newLink' }
export const POST = handler(async (req, { params }) => {
  const { db, inv } = await load(params);
  if (!inv) return error(404, 'not_found');
  const { action } = await readJson(req);
  if (action !== 'newLink') return error(400, 'invalid_action');
  await db.invoices.update(inv.id, { token: newInvoiceToken() });
  return json({ ok: true });
});
