import { getDb } from '@/lib/db';
import { handler, json, requireUser } from '@/lib/http';
import { paymentCode } from '@/lib/invoices';

// My subscription payments to Otrelink (each one has a PDF invoice).
export const GET = handler(async () => {
  const user = await requireUser();
  const db = await getDb();
  const list = await db.payments.listByUser(user.id);
  return json({
    invoices: list.map((p) => ({
      id: p.id, code: paymentCode(p), date: p.createdAt, amount: p.amount, currency: p.currency,
      provider: p.provider, periodStart: p.periodStart || null, periodEnd: p.periodEnd || null, refunded: Boolean(p.refunded),
    })),
  });
});
