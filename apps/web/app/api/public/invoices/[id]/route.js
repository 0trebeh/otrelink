import { getDb } from '@/lib/db';
import { handler, error, rateLimit } from '@/lib/http';
import { ownerInvoiceDoc } from '@/lib/invoices';
import { tokenMatches } from '@/lib/orders';
import { buildInvoicePdf, pdfResponse } from '@/lib/invoice-pdf';

// An invoice for the client it was made for: /api/public/invoices/<id>?token=…
export const GET = handler(async (req, { params }) => {
  await rateLimit(req, 'invoice-public', 60, 60 * 1000);
  const q = new URL(req.url).searchParams;
  const db = await getDb();
  const inv = await db.invoices.findById(String((await params).id || '').slice(0, 64));
  if (!inv || inv.status === 'draft' || !tokenMatches(inv.token, q.get('token') || '')) return error(404, 'not_found');
  const page = await db.pages.findById(inv.pageId);
  if (!page) return error(404, 'not_found');
  const bytes = await buildInvoicePdf(await ownerInvoiceDoc(db, page, inv));
  return pdfResponse(bytes, `${inv.code}.pdf`, q.has('download'));
});
