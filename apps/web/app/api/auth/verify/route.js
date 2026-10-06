import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashToken, completeVerification } from '@/lib/verify';
import { publicOrigin } from '@/lib/origin';
import { rateLimit } from '@/lib/http';

// Link from the verification email: /api/auth/verify?token=…
export async function GET(req) {
  const origin = publicOrigin(req);
  try { await rateLimit(req, 'verify', 30, 60 * 60 * 1000); } catch { return NextResponse.redirect(`${origin}/dashboard?verified=error`); }
  const token = new URL(req.url).searchParams.get('token') || '';
  if (!/^[a-f0-9]{64}$/.test(token)) return NextResponse.redirect(`${origin}/dashboard?verified=invalid`);
  const db = await getDb();
  const user = await db.users.findByVerifyToken(hashToken(token));
  if (!user) return NextResponse.redirect(`${origin}/dashboard?verified=invalid`);
  if (new Date(user.verifyExpires) < new Date()) return NextResponse.redirect(`${origin}/dashboard?verified=expired`);
  const { pageId, slugTaken } = await completeVerification(db, user);
  if (pageId) return NextResponse.redirect(`${origin}/dashboard/${pageId}?verified=1`);
  return NextResponse.redirect(`${origin}/dashboard?verified=${slugTaken ? 'slug_taken' : '1'}`);
}
