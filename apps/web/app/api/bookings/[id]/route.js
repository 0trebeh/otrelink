import { getDb } from '@/lib/db';
import { toOwnerBooking, emailVisitor } from '@/lib/bookings';
import { handler, json, error, readJson, requireUser } from '@/lib/http';

// Owner: confirm, cancel or reschedule a booking.
//   { status: 'confirmed' | 'cancelled' }   or   { start: ISO date }
export const PATCH = handler(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const db = await getDb();
  const booking = await db.bookings.findById(id);
  if (!booking || booking.userId !== user.id) return error(404, 'not_found');
  const body = await readJson(req);
  const page = await db.pages.findById(booking.pageId);

  let patch;
  let kind;
  if (body.status === 'confirmed' && booking.status !== 'confirmed') {
    patch = { status: 'confirmed' };
    kind = 'confirmed';
  } else if (body.status === 'cancelled' && booking.status !== 'cancelled') {
    patch = { status: 'cancelled', slotKey: null };
    kind = 'cancelled';
  } else if (body.start) {
    const start = new Date(body.start);
    if (Number.isNaN(start.getTime())) return error(400, 'invalid_date');
    const iso = start.toISOString();
    patch = {
      start: iso,
      end: new Date(start.getTime() + (booking.duration || 30) * 60e3).toISOString(),
      slotKey: booking.status === 'cancelled' ? null : `${booking.blockId}|${iso}`,
      remindersSent: [],
    };
    kind = 'rescheduled';
  } else {
    return json({ booking: toOwnerBooking(booking) });
  }

  try {
    const updated = await db.bookings.update(id, patch);
    await emailVisitor(kind, updated, page).catch(() => {});
    return json({ booking: toOwnerBooking(updated) });
  } catch (err) {
    if (err.code === 'slot_taken') return error(409, 'slot_taken');
    throw err;
  }
});
