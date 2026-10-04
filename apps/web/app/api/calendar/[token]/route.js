import { icsCalendar } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { handler, error } from '@/lib/http';

// Calendar feed for calendar apps. The secret token in the URL is the access key.
export const GET = handler(async (_req, { params }) => {
  const token = String((await params).token || '').replace(/\.ics$/, '');
  if (!/^[a-f0-9]{48}$/.test(token)) return error(404, 'not_found');
  const db = await getDb();
  const user = await db.users.findByCalendarToken(token);
  if (!user) return error(404, 'not_found');

  const from = new Date(Date.now() - 60 * 864e5).toISOString();
  const to = new Date(Date.now() + 400 * 864e5).toISOString();
  const bookings = await db.bookings.list({ userId: user.id, from, to, statuses: ['pending', 'confirmed'], limit: 2000 });
  const ics = icsCalendar(bookings.map((b) => ({
    uid: `${b.id}@otrelink`,
    start: b.start,
    end: b.end,
    title: `${b.status === 'pending' ? '[Pending] ' : ''}${b.serviceName} — ${b.name}`,
    description: [b.phone && `Phone: ${b.phone}`, `Email: ${b.email}`, b.note && `Note: ${b.note}`].filter(Boolean).join('\n'),
    status: b.status === 'pending' ? 'TENTATIVE' : 'CONFIRMED',
  })), 'Otrelink bookings');

  return new Response(ics, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Disposition': 'inline; filename="otrelink.ics"' },
  });
});
