import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getCustomerOrders } from '@/lib/db';
import { verifyCustomerSession } from '@/lib/customer-session';
import { checkRate } from '@/lib/rate-limit';

/**
 * GET /api/auth/orders -> signed-in customer's orders, newest first.
 * Each: { id, total, status, created_at, items: [{name, qty, price, image, color?}] }
 */
export async function GET(req) {
  if (!checkRate(req, { windowMs: 60_000, max: 30, scope: 'auth-orders' })) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Slow down.' }, { status: 429 });
  }
  const cookieHeader = (await headers()).get('cookie') || '';
  const customerId = verifyCustomerSession(cookieHeader);
  if (!customerId) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  const orders = await getCustomerOrders(customerId);
  return NextResponse.json({
    ok: true,
    orders: orders.map((o) => ({
      id: o.id,
      total: o.total,
      status: o.status,
      created_at: o.created_at,
      items: (Array.isArray(o.items) ? o.items : []).map((l) => ({
        name: l.name,
        qty: l.qty,
        price: l.price,
        image: l.image || null,
        color: l.color || null,
      })),
    })),
  });
}
