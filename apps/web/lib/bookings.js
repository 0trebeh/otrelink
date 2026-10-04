// Server-side helpers for bookings (used by the public API, the owner API and the cron).
import {
  findBlock, sanitizeBlock, computeSlots, pickService, zonedDateStr, addDays, formatInZone, icsCalendar, ACTIVE_STATUSES,
} from '@otrelink/core';
import crypto from 'node:crypto';
import { sendEmail } from './notify.js';

/** Load a page + its Booking block (only if the block exists and is enabled). */
export async function loadBookingBlock(db, pageId, blockId) {
  const page = await db.pages.findById(String(pageId || '').slice(0, 64));
  if (!page) return null;
  const raw = findBlock(page.blocks || [], String(blockId || '').slice(0, 64));
  if (!raw || raw.type !== 'booking' || !raw.enabled) return null;
  const block = sanitizeBlock(raw); // fills defaults for settings added later
  return { page, block, data: block.data };
}

/** Free slots for one day, taking other bookings of the same block into account. */
export async function freeSlots(db, { data, blockId, serviceId, date, now = new Date() }) {
  const bookings = await db.bookings.list({
    blockId, statuses: ACTIVE_STATUSES,
    from: `${addDays(date, -1)}T00:00:00.000Z`, to: `${addDays(date, 2)}T00:00:00.000Z`,
  });
  return computeSlots({ data, serviceId, date, bookings, now });
}

export { pickService, zonedDateStr };

/** Secret given only to the browser that made the booking (lets the visitor cancel and see the meeting link). */
export const newCancelToken = () => crypto.randomBytes(24).toString('hex');
export function tokenMatches(b, token) {
  if (!b?.cancelToken || typeof token !== 'string' || token.length !== b.cancelToken.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(b.cancelToken));
}

/** Current settings of the Booking block a booking belongs to (null if the block was removed). */
export function blockDataFor(page, blockId) {
  const raw = findBlock(page?.blocks || [], blockId);
  return raw && raw.type === 'booking' ? sanitizeBlock(raw).data : null;
}

/** Meeting link the visitor may see for this booking ('' when none or not yet). */
export function meetingFor(data, b) {
  if (!data?.meetingUrl || b.status === 'cancelled') return '';
  if (data.meetingShow === 'confirmed' && b.status !== 'confirmed') return '';
  return data.meetingUrl;
}

/** Last moment the visitor can cancel online (null when not allowed). */
export function cancelUntil(data, b) {
  if (!data?.allowCancel || b.status === 'cancelled') return null;
  return new Date(new Date(b.start).getTime() - Number(data.cancelNotice || 0) * 3600e3).toISOString();
}

/** What the owner sees in the dashboard. */
export const toOwnerBooking = (b) => ({
  id: b.id, pageId: b.pageId, blockId: b.blockId, serviceName: b.serviceName, duration: b.duration,
  start: b.start, end: b.end, timezone: b.timezone, visitorTimezone: b.visitorTimezone || '',
  name: b.name, email: b.email, phone: b.phone || '', note: b.note || '', status: b.status, createdAt: b.createdAt,
  cancelledBy: b.cancelledBy || '',
});

/**
 * What the visitor gets back. `full` (only with the visitor's token) adds the
 * meeting link and until when they can cancel.
 */
export const toVisitorBooking = (b, data = null, full = false) => ({
  id: b.id, status: b.status, start: b.start, end: b.end, serviceName: b.serviceName,
  ...(full ? {
    meetingUrl: meetingFor(data, b),
    meetingPending: Boolean(data?.meetingUrl) && b.status === 'pending' && !meetingFor(data, b),
    cancelUntil: cancelUntil(data, b),
  } : {}),
});

export const whenText = (b, tz = b.timezone) => formatInZone(b.start, tz, { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

export function bookingIcs(b, title, meetingUrl = '') {
  return icsCalendar([{
    uid: `${b.id}@otrelink`, start: b.start, end: b.end, title: title || b.serviceName,
    location: meetingUrl, url: meetingUrl, description: meetingUrl ? `Join: ${meetingUrl}` : '',
    status: b.status === 'pending' ? 'TENTATIVE' : b.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED',
    alarms: [60],
  }], title || b.serviceName);
}

/** Emails to the visitor (only sent when email is configured on the server). */
export async function emailVisitor(kind, b, page) {
  const who = page?.profile?.title || 'Otrelink';
  const when = whenText(b, b.visitorTimezone || b.timezone);
  const subjects = {
    created: b.status === 'pending' ? `Booking request received — ${who}` : `Your appointment with ${who} is booked`,
    confirmed: `Your appointment with ${who} is confirmed`,
    cancelled: `Your appointment with ${who} was cancelled`,
    rescheduled: `Your appointment with ${who} was moved`,
    reminder: `Reminder: ${b.serviceName} with ${who}`,
  };
  const lines = {
    created: b.status === 'pending' ? `We received your request for ${b.serviceName} on ${when}. You'll get a confirmation soon.` : `${b.serviceName} on ${when}.`,
    confirmed: `${b.serviceName} on ${when} is confirmed.`,
    cancelled: b.cancelledBy === 'visitor' ? `You cancelled ${b.serviceName} on ${when}.` : `${b.serviceName} on ${when} was cancelled.`,
    rescheduled: `${b.serviceName} is now on ${when}.`,
    reminder: `This is a reminder of your appointment: ${b.serviceName} on ${when}.`,
  };
  const link = kind === 'cancelled' ? '' : meetingFor(blockDataFor(page, b.blockId), b);
  const text = `Hi ${b.name},\n\n${lines[kind]}${link ? `\n\nMeeting link: ${link}` : ''}\n\n— ${who}`;
  return sendEmail({
    to: b.email,
    subject: subjects[kind],
    text,
    ics: kind === 'cancelled' ? undefined : bookingIcs(b, `${b.serviceName} — ${who}`, link),
  });
}
