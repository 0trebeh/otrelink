import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { pushToUser } from '@/lib/notify';
import {
  loadBookingBlock, freeSlots, pickService, zonedDateStr, toVisitorBooking, whenText, emailVisitor,
} from '@/lib/bookings';
import { handler, corsHeaders, rateLimit, HttpError } from '@/lib/http';

const clean = (v, max) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

// A visitor books an appointment. Public (used by the link page).
export const POST = handler(async (req) => {
  rateLimit(req, 'booking', 10, 60 * 60 * 1000);
  const headers = corsHeaders(req);
  const fail = (status, code) => NextResponse.json({ error: code }, { status, headers });
  let body;
  try { body = JSON.parse(await req.text()); } catch { throw new HttpError(400, 'invalid_json'); }

  // Honeypot: real people never fill the hidden "website" field.
  if (body.website) return fail(400, 'invalid');

  const name = clean(body.name, 80);
  const email = clean(body.email, 254).toLowerCase();
  const phone = clean(body.phone, 32).replace(/[^\d+()\-\s]/g, '');
  const note = String(body.note ?? '').trim().slice(0, 500);
  if (!name || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) return fail(400, 'invalid_details');

  const db = await getDb();
  const ctx = await loadBookingBlock(db, body.pageId, body.blockId);
  if (!ctx || !ctx.page.settings?.published) return fail(404, 'not_found');
  const { page, block, data } = ctx;

  const service = pickService(data, body.serviceId);
  const start = new Date(body.start);
  if (!service || Number.isNaN(start.getTime())) return fail(400, 'invalid');

  // The time must still be free (checked again here, not trusted from the browser).
  const iso = start.toISOString();
  const slots = await freeSlots(db, { data, blockId: block.id, serviceId: service.id, date: zonedDateStr(start, data.timezone) });
  if (!slots.includes(iso)) return fail(409, 'slot_taken');

  const duration = Number(service.duration) || 30;
  let booking;
  try {
    booking = await db.bookings.create({
      userId: page.userId,
      pageId: page.id,
      blockId: block.id,
      serviceId: service.id,
      serviceName: service.name,
      duration,
      start: iso,
      end: new Date(start.getTime() + duration * 60e3).toISOString(),
      timezone: data.timezone,
      visitorTimezone: clean(body.visitorTimezone, 64),
      name, email, phone, note,
      status: data.confirmMode === 'manual' ? 'pending' : 'confirmed',
      // Unique per block + start: two visitors can't take the same time.
      slotKey: `${block.id}|${iso}`,
    });
  } catch (err) {
    if (err.code === 'slot_taken') return fail(409, 'slot_taken');
    throw err;
  }

  // Notify the owner and the visitor. Failures here never break the booking.
  await Promise.allSettled([
    pushToUser(page.userId, {
      title: booking.status === 'pending' ? 'New booking request' : 'New booking',
      body: `${booking.name} · ${booking.serviceName} · ${whenText(booking)}`,
      url: `/dashboard/${page.id}#agenda`,
      tag: `booking-${booking.id}`,
    }),
    emailVisitor('created', booking, page),
  ]);

  return NextResponse.json({ booking: toVisitorBooking(booking) }, { status: 201, headers });
});

export const OPTIONS = (req) => new Response(null, { status: 204, headers: corsHeaders(req) });
