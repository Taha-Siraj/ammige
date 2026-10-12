import { NextResponse } from 'next/server';
import { getCouponByCode, checkCoupon, isNonEmptyString, isPositiveInt } from '@/lib/db';
import { checkRate } from '@/lib/rate-limit';

/**
 * Public coupon validation.
 * POST /api/coupons/validate  { code, subtotal } ->
 *   { ok:true, coupon:{ code, type, value, discount } }
 *   { ok:false, error }
 */
export async function POST(req) {
  if (!checkRate(req, { windowMs: 60_000, max: 30, scope: 'coupon-validate' })) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Slow down.' }, { status: 429 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }
  const { code, subtotal } = body || {};
  if (!isNonEmptyString(code)) {
    return NextResponse.json({ ok: false, error: 'Coupon code is required.' }, { status: 400 });
  }
  const sub = Number(subtotal);
  if (!Number.isFinite(sub) || sub < 0) {
    return NextResponse.json({ ok: false, error: 'Invalid subtotal.' }, { status: 400 });
  }
  const coupon = await getCouponByCode(code);
  const chk = checkCoupon(coupon, sub);
  if (!chk.ok) return NextResponse.json({ ok: false, error: chk.error });
  return NextResponse.json({
    ok: true,
    coupon: { code: coupon.code, type: coupon.type, value: coupon.value, discount: chk.discount },
  });
}
