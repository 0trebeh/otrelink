import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { pushToUser } from '@/lib/notify';
import { toVisitorBooking, blockDataFor, cancelUntil, tokenMatches, whenText, emailVisitor } from '@/lib/bookings';
import { handler, corsHeaders, rateLimit, HttpError } from '@/lib/http';

// A visitor cancels their own appointment from the public page.
// Body: { pageId, id, token } — the token was given only to the browser that booked.
export const POST = handler(async (req) => {
  await rateLimit(req, 'booking-cancel', 20, 60 * 60 * 1000);
  const headers = corsHeaders(req);
  const fail = (status, code) => NextResponse.json({ error: code }, { status, headers });
  let body;
  try { body = JSON.parse(await req.text()); } catch { throw new HttpError(400, 'invalid_json'); }

  const db = await getDb();
  const booking = await db.bookings.findById(String(body.id || '').slice(0, 64));
  if (!booking || booking.pageId !== String(body.pageId || '') || !tokenMatches(booking, body.token)) return fail(404, 'not_found');
  const page = await db.pages.findById(booking.pageId);
  const data = blockDataFor(page, booking.blockId);

  if (booking.status === 'cancelled') return NextResponse.json({ booking: toVisitorBooking(booking, data, true) }, { headers });
  const until = cancelUntil(data, booking);
  if (!until) return fail(403, 'not_allowed');
  if (Date.now() > new Date(until).getTime()) return fail(409, 'too_late');

  const updated = await db.bookings.update(booking.id, {
    status: 'cancelled', slotKey: null, cancelledBy: 'visitor', cancelledAt: new Date().toISOString(),
  });

  await Promise.allSettled([
    pushToUser(page.userId, {
      title: 'Booking cancelled',
      body: `${updated.name} cancelled · ${updated.serviceName} · ${whenText(updated)}`,
      url: `/dashboard/${page.id}#agenda`,
      tag: `booking-${updated.id}`,
    }),
    emailVisitor('cancelled', updated, page),
  ]);
  return NextResponse.json({ booking: toVisitorBooking(updated, data, true) }, { headers });
});

export const OPTIONS = (req) => new Response(null, { status: 204, headers: corsHeaders(req) });
