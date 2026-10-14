import { NextResponse } from 'next/server';
import { clearCustomerSessionCookie } from '@/lib/customer-session';

/** POST /api/auth/logout -> clears the customer session cookie. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', clearCustomerSessionCookie());
  return res;
}
