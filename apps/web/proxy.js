// Runs before every /api request (Next.js "proxy", formerly middleware).
//
// 1. Writes the real path and method into x-ol-path / x-ol-method, replacing
//    anything the client sent. getUser() needs them to check API tokens.
// 2. Requests with a personal API token (Authorization: Bearer otl_…) may only
//    reach the routes listed in lib/tokens.js; the rest get 403 here, before
//    any route code runs. The admin key (no otl_ prefix) is not affected.
import { NextResponse } from 'next/server';
import { bearerToken, tokenAllows } from './lib/tokens.js';

export function proxy(request) {
  const path = request.nextUrl.pathname;
  const method = request.method;
  if (bearerToken(request.headers.get('authorization'))) {
    // The scope (read / write) is checked later, once the token is looked up.
    const allowed = tokenAllows(path, method, 'write');
    if (!allowed.ok) return NextResponse.json({ error: allowed.reason }, { status: 403 });
  }
  const headers = new Headers(request.headers);
  headers.set('x-ol-path', path);
  headers.set('x-ol-method', method);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: '/api/:path*' };
