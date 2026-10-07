import { getDb } from '@/lib/db';
import { handler, error, requireUser } from '@/lib/http';
import { paymentInvoiceDoc, paymentCode } from '@/lib/invoices';
import { buildInvoicePdf, pdfResponse } from '@/lib/invoice-pdf';

// PDF invoice of one of my subscription payments. ?lang=es for Spanish, ?download=1 to save it.
export const GET = handler(async (req, { params }) => {
  const user = await requireUser();
  const db = await getDb();
  const p = await db.payments.findById(String((await params).id || ''));
  if (!p || p.userId !== user.id) return error(404, 'not_found');
  const q = new URL(req.url).searchParams;
  const bytes = await buildInvoicePdf(await paymentInvoiceDoc(db, user, p, q.get('lang') === 'es' ? 'es' : 'en'));
  return pdfResponse(bytes, `${paymentCode(p)}.pdf`, q.has('download'));
});
