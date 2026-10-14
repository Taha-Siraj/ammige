import { NextResponse } from 'next/server';
import {
  client, ready, parseProduct, normalizeCollection,
  isNonEmptyString, isPositiveInt,
  sanitizeText, sanitizeStringArray, isSafeImageUrl,
} from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { checkOrigin } from '@/lib/csrf';
import { checkRate } from '@/lib/rate-limit';

const ALLOWED = ['sku', 'name', 'collection', 'price', 'old_price', 'colors', 'material',
  'description', 'image', 'image2', 'variant_images', 'sizes', 'rating', 'reviews', 'badge', 'stock', 'active'];

function adminWriteLimit(req) {
  return checkRate(req, { windowMs: 60_000, max: 60, scope: 'admin-write' });
}

function clean(k, v, existing) {
  switch (k) {
    case 'sku': return sanitizeText(v, 40) || existing.sku;
    case 'name': return sanitizeText(v, 200);
    case 'collection': return v;
    case 'price': return v;
    case 'old_price': return isPositiveInt(v) ? v : null;
    case 'colors': return JSON.stringify(sanitizeStringArray(v));
    case 'material': return sanitizeText(v, 120) || null;
    case 'description': return sanitizeText(v, 2000) || null;
    case 'image':
    case 'image2': {
      const s = sanitizeText(v, 300);
      return s && isSafeImageUrl(s) ? s : null;
    }
    case 'variant_images': {
      if (v == null) return '{}';
      if (typeof v !== 'object' || Array.isArray(v)) return '{}';
      const out = {};
      for (const k of Object.keys(v).slice(0, 12)) {
        const color = sanitizeText(k, 40);
        const url = sanitizeText(v[k], 300);
        if (color && url && isSafeImageUrl(url)) out[color] = url;
      }
      return JSON.stringify(out);
    }
    case 'sizes': return JSON.stringify(sanitizeStringArray(v));
    case 'rating': return typeof v === 'number' ? Math.min(5, Math.max(0, v)) : existing.rating;
    case 'reviews': return isPositiveInt(v) ? v : 0;
    case 'badge': return sanitizeText(v, 20) || null;
    case 'stock': return v;
    case 'active': return v ? 1 : 0;
    default: return v;
  }
}

export async function PATCH(req, { params }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const badOrigin = checkOrigin(req);
  if (badOrigin) return badOrigin;
  if (!adminWriteLimit(req)) {
    return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });
  }
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
  if ('name' in updates && !sanitizeText(updates.name, 200)) {
    return NextResponse.json({ error: 'name cannot be empty.' }, { status: 400 });
  }
  if ('colors' in updates && !Array.isArray(updates.colors)) {
    return NextResponse.json({ error: 'colors must be an array.' }, { status: 400 });
  }
  if ('sizes' in updates && !Array.isArray(updates.sizes)) {
    return NextResponse.json({ error: 'sizes must be an array.' }, { status: 400 });
  }
  if ('variant_images' in updates && updates.variant_images != null &&
      (typeof updates.variant_images !== 'object' || Array.isArray(updates.variant_images))) {
    return NextResponse.json({ error: 'variant_images must be an object.' }, { status: 400 });
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
    if (String(e && e.message).includes('UNIQUE')) {
      return NextResponse.json({ error: 'SKU already exists.' }, { status: 400 });
    }
    console.error('admin product update failed', e);
    return NextResponse.json({ error: 'Could not update product.' }, { status: 500 });
  }
  const r = await c.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
  return NextResponse.json(parseProduct(r.rows[0]));
}

export async function DELETE(req, { params }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const badOrigin = checkOrigin(req);
  if (badOrigin) return badOrigin;
  if (!adminWriteLimit(req)) {
    return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });
  }
  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });
  }
  await ready();
  const r = await client().execute({ sql: 'UPDATE products SET active = 0 WHERE id = ?', args: [id] });
  if (r.rowsAffected === 0) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, id });
}
