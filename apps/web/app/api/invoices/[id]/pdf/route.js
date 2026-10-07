import { getDb } from '@/lib/db';
import { handler, error, requireVerifiedUser } from '@/lib/http';
import { ownerInvoiceDoc } from '@/lib/invoices';
import { buildInvoicePdf, pdfResponse } from '@/lib/invoice-pdf';

// The invoice as a PDF, for its owner. ?download=1 saves it instead of opening it.
export const GET = handler(async (req, { params }) => {
  const user = await requireVerifiedUser();
  const db = await getDb();
  const inv = await db.invoices.findById(String((await params).id || ''));
  if (!inv || inv.userId !== user.id) return error(404, 'not_found');
  const page = await db.pages.findById(inv.pageId);
  if (!page) return error(404, 'not_found');
  const bytes = await buildInvoicePdf(await ownerInvoiceDoc(db, page, inv));
  return pdfResponse(bytes, `${inv.code}.pdf`, new URL(req.url).searchParams.has('download'));
});
