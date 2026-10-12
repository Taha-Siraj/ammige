import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/orders';
import { checkRate } from '@/lib/rate-limit';
import { checkOrigin } from '@/lib/csrf';

export async function POST(req) {
  // 10 orders per IP per 10 minutes — abuse protection
  if (!checkRate(req, { windowMs: 10 * 60 * 1000, max: 10, scope: 'orders' })) {
    return NextResponse.json({ error: 'Too many orders. Please wait a few minutes.' }, { status: 429 });
  }
  const badOrigin = checkOrigin(req);
  if (badOrigin) return badOrigin;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const { order_id, subtotal, discount, shipping, total } = await createOrder({
      customer: body && body.customer,
      items: body && body.items,
      notes: body && body.notes,
      payment: body && body.payment,
      couponCode: body && body.couponCode,
      source: 'storefront',
    });
    return NextResponse.json({ order_id, subtotal, discount, shipping, total }, { status: 201 });
  } catch (e) {
    if (e && e.status) {
      return NextResponse.json({ error: e.error || 'Could not place order.' }, { status: e.status });
    }
    console.error('order failed', e);
    return NextResponse.json({ error: 'Could not place order. Please try again.' }, { status: 500 });
  }
}
