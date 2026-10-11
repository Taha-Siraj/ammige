import { NextResponse } from 'next/server';
import { client, ready, parseOrder } from '@/lib/db';
import { checkRate } from '@/lib/rate-limit';

export async function GET(req, { params }) {
  if (!checkRate(req, { windowMs: 60_000, max: 30, scope: 'track' })) {
    return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });
  }
  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid order id.' }, { status: 400 });
  }
  await ready();
  const r = await client().execute({
    sql: 'SELECT id, status, total, created_at, items FROM orders WHERE id = ?',
    args: [id],
  });
  if (!r.rows.length) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  const o = parseOrder(r.rows[0]);
  return NextResponse.json({
    id: o.id, status: o.status, total: o.total,
    created_at: o.created_at, items: o.items,
  });
}
