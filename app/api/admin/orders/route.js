import { NextResponse } from 'next/server';
import { client, ready, parseOrder, ORDER_STATUSES } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { checkRate } from '@/lib/rate-limit';

export async function GET(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  if (!checkRate(req, { windowMs: 60_000, max: 120, scope: 'admin-read' })) {
    return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });
  }
  await ready();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  let sql = 'SELECT * FROM orders';
  const args = [];
  if (status) {
    if (!ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }
    sql += ' WHERE status = ?';
    args.push(status);
  }
  sql += ' ORDER BY id DESC LIMIT 200';
  const r = await client().execute({ sql, args });
  return NextResponse.json(r.rows.map(parseOrder));
}
