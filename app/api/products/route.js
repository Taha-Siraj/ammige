import { NextResponse } from 'next/server';
import {
  client, ready, parseProduct, normalizeCollection,
  isNonEmptyString, isPositiveInt,
} from '@/lib/db';

export async function GET(req) {
  await ready();
  const { searchParams } = new URL(req.url);
  const collection = searchParams.get('collection');
  const q = searchParams.get('q');
  const sort = searchParams.get('sort') || 'new';
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit'), 10) || 24));
  const offset = (page - 1) * limit;

  const where = ['active = 1'];
  const args = [];
  if (collection) {
    const slug = normalizeCollection(collection);
    if (!slug) return NextResponse.json({ error: 'Invalid collection.' }, { status: 400 });
    where.push('collection = ?');
    args.push(slug);
  }
  if (q && isNonEmptyString(q)) {
    where.push('(name LIKE ? OR sku LIKE ?)');
    args.push(`%${q.trim()}%`, `%${q.trim()}%`);
  }

  const sorts = { new: 'id DESC', price_asc: 'price ASC', price_desc: 'price DESC', rating: 'rating DESC' };
  const orderBy = sorts[sort] || sorts.new;
  const whereSQL = `WHERE ${where.join(' AND ')}`;

  const totalR = await client().execute({ sql: `SELECT COUNT(*) AS c FROM products ${whereSQL}`, args });
  const rowsR = await client().execute({
    sql: `SELECT * FROM products ${whereSQL} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  });

  return NextResponse.json({
    items: rowsR.rows.map(parseProduct),
    total: totalR.rows[0].c,
    page,
    pages: Math.max(1, Math.ceil(Number(totalR.rows[0].c) / limit)),
  });
}
