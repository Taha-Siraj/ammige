import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/db';
import { issueSessionCookie } from '@/lib/auth';
import { checkRate } from '@/lib/rate-limit';

export async function POST(req) {
  // Brute-force protection: 8 attempts per 10 minutes per IP
  if (!checkRate(req, { windowMs: 10 * 60 * 1000, max: 8, scope: 'admin-login' })) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const { password } = body || {};
  const expected = (await getSetting('admin_password')) || process.env.AMMIGE_ADMIN_PASSWORD || 'ammige123';
  if (typeof password === 'string' && password === expected && password.length > 0) {
    const res = NextResponse.json({ ok: true });
    res.headers.set('Set-Cookie', issueSessionCookie());
    return res;
  }
  return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
}
