import { NextResponse } from 'next/server';
import {
  client, ready, parseProduct, normalizeCollection,
  isNonEmptyString, isPositiveInt,
} from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

const ALLOWED = ['sku', 'name', 'collection', 'price', 'old_price', 'colors', 'material',
  'description', 'image', 'rating', 'reviews', 'badge', 'stock', 'active'];

function clean(k, v, existing) {
  switch (k) {
    case 'sku': return isNonEmptyString(v) ? v.trim().slice(0, 40) : existing.sku;
    case 'name': return v.trim().slice(0, 200);
    case 'collection': return v;
    case 'price': return v;
    case 'old_price': return isPositiveInt(v) ? v : null;
    case 'colors': return JSON.stringify(Array.isArray(v) ? v.slice(0, 12) : []);
    case 'material': return isNonEmptyString(v) ? v.trim().slice(0, 120) : null;
    case 'description': return isNonEmptyString(v) ? v.trim().slice(0, 2000) : null;
    case 'image': return isNonEmptyString(v) ? v.trim().slice(0, 300) : null;
    case 'rating': return typeof v === 'number' ? Math.min(5, Math.max(0, v)) : existing.rating;
    case 'reviews': return isPositiveInt(v) ? v : 0;
    case 'badge': return isNonEmptyString(v) ? v.trim().slice(0, 20) : null;
    case 'stock': return v;
    case 'active': return v ? 1 : 0;
    default: return v;
  }
}

export async function PATCH(req, { params }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });
  }
  let b;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  await ready();
  const c = client();
  const ex = await c.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
  if (!ex.rows.length) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  const existing = ex.rows[0];

  const updates = {};
  for (const k of ALLOWED) if (k in b) updates[k] = b[k];
  if ('collection' in updates) {
    const slug = normalizeCollection(updates.collection);
    if (!slug) return NextResponse.json({ error: 'collection must be everyday|signature|leather.' }, { status: 400 });
    updates.collection = slug;
  }
  if ('price' in updates && !isPositiveInt(updates.price)) {
    return NextResponse.json({ error: 'price must be a positive integer (PKR).' }, { status: 400 });
  }
  if ('name' in updates && !isNonEmptyString(updates.name)) {
    return NextResponse.json({ error: 'name cannot be empty.' }, { status: 400 });
  }
  if ('colors' in updates && !Array.isArray(updates.colors)) {
    return NextResponse.json({ error: 'colors must be an array.' }, { status: 400 });
  }
  if ('stock' in updates && (!Number.isInteger(updates.stock) || updates.stock < 0)) {
    return NextResponse.json({ error: 'stock must be a non-negative integer.' }, { status: 400 });
  }

  const keys = Object.keys(updates);
  if (keys.length === 0) return NextResponse.json(parseProduct(existing));

  try {
    await c.execute({
      sql: `UPDATE products SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
      args: [...keys.map((k) => clean(k, updates[k], existing)), id],
    });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return NextResponse.json({ error: 'SKU already exists.' }, { status: 400 });
    }
    throw e;
  }
  const r = await c.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
  return NextResponse.json(parseProduct(r.rows[0]));
}

export async function DELETE(req, { params }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });
  }
  await ready();
  const r = await client().execute({ sql: 'UPDATE products SET active = 0 WHERE id = ?', args: [id] });
  if (r.rowsAffected === 0) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, id });
}
