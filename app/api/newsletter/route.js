import { NextResponse } from 'next/server';
import { subscribeNewsletter } from '@/lib/db';
import { checkRate } from '@/lib/rate-limit';

/**
 * Newsletter subscribe.
 * POST /api/newsletter  { email } -> { ok:true, already }
 */
export async function POST(req) {
  if (!checkRate(req, { windowMs: 60_000, max: 20, scope: 'newsletter' })) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Slow down.' }, { status: 429 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }
  try {
    const res = await subscribeNewsletter(body && body.email);
    return NextResponse.json(res);
  } catch (e) {
    const status = (e && e.status) || 500;
    const error = (e && e.error) || 'Something went wrong. Please try again.';
    return NextResponse.json({ ok: false, error }, { status });
  }
}
