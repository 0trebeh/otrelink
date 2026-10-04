import crypto from 'node:crypto';
import { getDb } from '@/lib/db';
import { publicOrigin } from '@/lib/origin';
import { handler, json, requireUser } from '@/lib/http';

// Private calendar feed (.ics) with all your bookings, to subscribe from
// Google Calendar, Apple Calendar or Outlook.
const feedUrl = (req, token) => (token ? `${publicOrigin(req)}/api/calendar/${token}.ics` : null);

// Current link (or null).
export const GET = handler(async (req) => {
  const user = await requireUser();
  const db = await getDb();
  const full = await db.users.findById(user.id);
  return json({ url: feedUrl(req, full?.calendarToken) });
});

// Create a new link (the old one stops working).
export const POST = handler(async (req) => {
  const user = await requireUser();
  const db = await getDb();
  const token = crypto.randomBytes(24).toString('hex');
  await db.users.update(user.id, { calendarToken: token });
  return json({ url: feedUrl(req, token) });
});
