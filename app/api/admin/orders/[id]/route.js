import { NextResponse } from 'next/server';
import { client, ready, parseOrder, ORDER_STATUSES } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { checkOrigin } from '@/lib/csrf';
import { checkRate } from '@/lib/rate-limit';

export async function PATCH(req, { params }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const badOrigin = checkOrigin(req);
  if (badOrigin) return badOrigin;
  if (!checkRate(req, { windowMs: 60_000, max: 60, scope: 'admin-write' })) {
    return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });
  }
  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid order id.' }, { status: 400 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { status } = body || {};
  if (!ORDER_STATUSES.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${ORDER_STATUSES.join('|')}.` }, { status: 400 });
  }
  await ready();
  const c = client();
  const r = await c.execute({ sql: 'UPDATE orders SET status = ? WHERE id = ?', args: [status, id] });
  if (r.rowsAffected === 0) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  const row = await c.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [id] });
  return NextResponse.json(parseOrder(row.rows[0]));
}
