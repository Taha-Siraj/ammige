import { NextResponse } from 'next/server';
import { client, ready, parseProduct } from '@/lib/db';

export async function GET(req, { params }) {
  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });
  }
  await ready();
  const r = await client().execute({
    sql: 'SELECT * FROM products WHERE id = ? AND active = 1',
    args: [id],
  });
  if (!r.rows.length) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  return NextResponse.json(parseProduct(r.rows[0]));
}
