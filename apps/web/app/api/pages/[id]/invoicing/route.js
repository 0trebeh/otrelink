import { sanitizeInvoiceSettings } from '@otrelink/core';
import { handler, json, readJson, requireOwnedPage } from '@/lib/http';
import { pageInvoicing } from '@/lib/invoices';

// Business details used on the page's invoices. Saved on their own (not part of the page draft).
export const GET = handler(async (_req, { params }) => {
  const { page } = await requireOwnedPage((await params).id);
  return json({ invoicing: sanitizeInvoiceSettings(page.invoicing || {}), defaults: pageInvoicing({ ...page, invoicing: {} }) });
});

export const PUT = handler(async (req, { params }) => {
  const { db, page } = await requireOwnedPage((await params).id);
  const invoicing = sanitizeInvoiceSettings(await readJson(req));
  await db.pages.update(page.id, { invoicing });
  return json({ invoicing });
});
