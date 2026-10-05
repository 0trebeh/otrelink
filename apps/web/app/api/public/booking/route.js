import { NextResponse } from 'next/server';
import { serviceMinutes } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { pushToUser } from '@/lib/notify';
import {
  loadBookingBlock, freeSlots, pickService, zonedDateStr, toVisitorBooking, whenText, emailVisitor,
  newCancelToken, tokenMatches, blockDataFor,
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

  const duration = serviceMinutes(data, service);
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
      cancelToken: newCancelToken(),
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

  // The token is only sent here, to the browser that booked.
  return NextResponse.json({ booking: { ...toVisitorBooking(booking, data, true), token: booking.cancelToken } }, { status: 201, headers });
});

// A returning visitor checks the appointments saved in their browser.
//   ?pageId=…&items=id~token,id~token   (the token unlocks the meeting link and cancelling)
//   ?pageId=…&ids=id,id                 (older saved data: basic info only)
// Ids are random UUIDs and no personal data is returned.
export const GET = handler(async (req) => {
  rateLimit(req, 'booking-status', 60, 60 * 1000);
  const headers = corsHeaders(req);
  const q = new URL(req.url).searchParams;
  const pageId = String(q.get('pageId') || '');
  const items = String(q.get('items') || q.get('ids') || '').split(',').slice(0, 10)
    .map((s) => { const [id, token = ''] = s.trim().split('~'); return { id, token }; })
    .filter((x) => /^[\w-]{8,64}$/.test(x.id));
  const db = await getDb();
  const page = await db.pages.findById(pageId.slice(0, 64));
  const bookings = [];
  if (page) {
    for (const { id, token } of items) {
      const b = await db.bookings.findById(id);
      if (!b || b.pageId !== page.id) continue;
      bookings.push(toVisitorBooking(b, blockDataFor(page, b.blockId), tokenMatches(b, token)));
    }
  }
  return NextResponse.json({ bookings }, { headers: { ...headers, 'Cache-Control': 'no-store' } });
});

export const OPTIONS = (req) => new Response(null, { status: 204, headers: corsHeaders(req) });
