import { NextResponse } from 'next/server';
import { client, ready } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { checkRate } from '@/lib/rate-limit';

export async function GET(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  if (!checkRate(req, { windowMs: 60_000, max: 120, scope: 'admin-read' })) {
    return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });
  }
  await ready();
  const c = client();
  const q = async (sql, args = []) => (await c.execute({ sql, args })).rows[0];
  const revenue = await q("SELECT COALESCE(SUM(total),0) AS v FROM orders WHERE status != 'cancelled'");
  const orders_count = await q('SELECT COUNT(*) AS v FROM orders');
  const products_count = await q('SELECT COUNT(*) AS v FROM products WHERE active = 1');
  const pending_orders = await q("SELECT COUNT(*) AS v FROM orders WHERE status = 'pending'");
  return NextResponse.json({
    revenue: revenue.v,
    orders_count: orders_count.v,
    products_count: products_count.v,
    pending_orders: pending_orders.v,
  });
}
