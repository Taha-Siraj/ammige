import { NextResponse } from 'next/server';
import {
  client, ready, parseProduct, normalizeCollection,
  isNonEmptyString, isPositiveInt,
} from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

const SKU_PREFIX = { everyday: 'ED', signature: 'SG', leather: 'LT' };

export async function GET(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  await ready();
  const { searchParams } = new URL(req.url);
  const collection = searchParams.get('collection');
  const q = searchParams.get('q');
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);
  const limit = 24;
  const offset = (page - 1) * limit;

  const where = [];
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
  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const totalR = await client().execute({ sql: `SELECT COUNT(*) AS c FROM products ${whereSQL}`, args });
  const rowsR = await client().execute({
    sql: `SELECT * FROM products ${whereSQL} ORDER BY id DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  });
  const total = Number(totalR.rows[0].c);
  return NextResponse.json({
    items: rowsR.rows.map(parseProduct),
    total, page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function POST(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  let b;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!isNonEmptyString(b.name)) return NextResponse.json({ error: 'name is required.' }, { status: 400 });
  const collectionSlug = normalizeCollection(b.collection);
  if (!collectionSlug) {
    return NextResponse.json({ error: 'collection must be everyday|signature|leather.' }, { status: 400 });
  }
  if (!isPositiveInt(b.price)) {
    return NextResponse.json({ error: 'price must be a positive integer (PKR).' }, { status: 400 });
  }

  await ready();
  const c = client();
  let sku = isNonEmptyString(b.sku) ? b.sku.trim().slice(0, 40) : null;
  if (!sku) {
    const m = await c.execute('SELECT COALESCE(MAX(id),0) AS v FROM products');
    const nextId = Number(m.rows[0].v) + 1;
    sku = `AM-${SKU_PREFIX[collectionSlug]}-${String(nextId).padStart(4, '0')}`;
  }

  try {
    const ins = await c.execute({
      sql: `INSERT INTO products (sku, name, collection, price, old_price, colors, material,
              description, image, rating, reviews, badge, stock, active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        sku,
        b.name.trim().slice(0, 200),
        collectionSlug,
        b.price,
        isPositiveInt(b.old_price) ? b.old_price : null,
        JSON.stringify(Array.isArray(b.colors) ? b.colors.slice(0, 12) : []),
        isNonEmptyString(b.material) ? b.material.trim().slice(0, 120) : null,
        isNonEmptyString(b.description) ? b.description.trim().slice(0, 2000) : null,
        isNonEmptyString(b.image) ? b.image.trim().slice(0, 300) : null,
        typeof b.rating === 'number' ? Math.min(5, Math.max(0, b.rating)) : 0,
        isPositiveInt(b.reviews) ? b.reviews : 0,
        isNonEmptyString(b.badge) ? b.badge.trim().slice(0, 20) : null,
        Number.isInteger(b.stock) && b.stock >= 0 ? b.stock : 50,
        b.active === 0 || b.active === false ? 0 : 1,
        new Date().toISOString(),
      ],
    });
    const r = await c.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [Number(ins.lastInsertRowid)] });
    return NextResponse.json(parseProduct(r.rows[0]), { status: 201 });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return NextResponse.json({ error: 'SKU already exists.' }, { status: 400 });
    }
    throw e;
  }
}
