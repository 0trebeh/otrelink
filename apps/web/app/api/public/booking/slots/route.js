import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { loadBookingBlock, freeSlots, pickService } from '@/lib/bookings';
import { handler, corsHeaders, rateLimit } from '@/lib/http';

// Free times for a Booking block on one day. Public (used by the link page).
export const GET = handler(async (req) => {
  rateLimit(req, 'slots', 240, 60 * 1000);
  const headers = { ...corsHeaders(req), 'Cache-Control': 'no-store' };
  const q = new URL(req.url).searchParams;
  const db = await getDb();
  const ctx = await loadBookingBlock(db, q.get('pageId'), q.get('blockId'));
  if (!ctx || !ctx.page.settings?.published) return NextResponse.json({ error: 'not_found' }, { status: 404, headers });
  const date = String(q.get('date') || '');
  const service = pickService(ctx.data, q.get('serviceId'));
  if (!service || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'invalid' }, { status: 400, headers });
  const slots = await freeSlots(db, { data: ctx.data, blockId: ctx.block.id, serviceId: service.id, date });
  return NextResponse.json({ timezone: ctx.data.timezone, slots }, { headers });
});

export const OPTIONS = (req) => new Response(null, { status: 204, headers: corsHeaders(req) });
