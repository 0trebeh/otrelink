import { sanitizeInvoice, invoiceCode } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { handler, json, error, readJson, requireVerifiedUser } from '@/lib/http';
import { pageInvoicing, toOwnerInvoice, newInvoiceToken } from '@/lib/invoices';

async function ownedPage(db, user, pageId) {
  const page = await db.pages.findById(String(pageId || ''));
  return page && page.userId === user.id ? page : null;
}
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

// Invoices of one of my pages.  GET ?pageId=…[&status=draft|sent|paid|void]
export const GET = handler(async (req) => {
  const user = await requireVerifiedUser();
  const q = new URL(req.url).searchParams;
  const db = await getDb();
  const page = await ownedPage(db, user, q.get('pageId'));
  if (!page) return error(404, 'page_not_found');
  const status = ['draft', 'sent', 'paid', 'void'].includes(q.get('status')) ? q.get('status') : undefined;
  return json({ invoices: (await db.invoices.list({ pageId: page.id, status })).map(toOwnerInvoice) });
});

// New invoice: { pageId, invoice?: {…} (e.g. a copy), fromOrder?: orderId }
export const POST = handler(async (req) => {
  const user = await requireVerifiedUser();
  if (!user.plan?.features?.invoices) return error(403, 'plan_required', { feature: 'invoices' });
  const body = await readJson(req);
  const db = await getDb();
  const page = await ownedPage(db, user, body.pageId);
  if (!page) return error(404, 'page_not_found');
  const s = pageInvoicing(page);
  const issueDate = today();
  let draft = {
    status: 'draft', issueDate, dueDate: Number(s.dueDays) ? addDays(issueDate, Number(s.dueDays)) : '',
    items: [{ description: '', qty: 1, price: 0 }],
    discount: 0, taxRate: s.taxRate, taxLabel: s.taxLabel, notes: s.notes, footer: '',
    client: {}, money: { currency: s.currency, currencyPosition: s.currencyPosition, numberFormat: s.numberFormat },
  };
  let orderId = '';
  if (body.fromOrder) {
    const o = await db.orders.findById(String(body.fromOrder));
    if (!o || o.pageId !== page.id) return error(404, 'order_not_found');
    orderId = o.id;
    draft = {
      ...draft,
      items: o.lines.map((l) => ({ description: `${l.name}${l.extras?.length ? ` (${l.extras.map((e) => e.name).join(', ')})` : ''}`, qty: l.qty, price: l.unit })),
      client: { name: o.name, phone: o.phone },
      money: o.money || draft.money,
      notes: [`#${o.code}`, s.notes].filter(Boolean).join('\n'),
      status: o.status === 'done' ? 'paid' : 'draft',
    };
  }
  if (body.invoice) draft = { ...draft, ...sanitizeInvoice({ ...draft, ...body.invoice }), status: 'draft', issueDate };
  const clean = sanitizeInvoice(draft);
  // Next number (retries if two invoices are created at the same moment).
  for (let i = 0; i < 5; i++) {
    const number = (await db.invoices.maxNumber(page.id)) + 1;
    try {
      const inv = await db.invoices.create({
        ...clean, userId: user.id, pageId: page.id, number, code: invoiceCode(s.prefix, number), token: newInvoiceToken(),
        ...(orderId ? { orderId } : {}), ...(clean.status === 'paid' ? { paidAt: new Date().toISOString() } : {}),
      });
      return json({ invoice: toOwnerInvoice(inv) }, { status: 201 });
    } catch (err) { if (err.code !== 'number_taken') throw err; }
  }
  return error(409, 'try_again');
});
