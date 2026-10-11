import { NextResponse } from 'next/server';
import {
  client, ready, parseProduct, nowISO, isNonEmptyString, isPositiveInt,
  sanitizeText,
} from '@/lib/db';
import { checkRate } from '@/lib/rate-limit';
import { checkOrigin } from '@/lib/csrf';

export async function POST(req) {
  // 10 orders per IP per 10 minutes — abuse protection
  if (!checkRate(req, { windowMs: 10 * 60 * 1000, max: 10, scope: 'orders' })) {
    return NextResponse.json({ error: 'Too many orders. Please wait a few minutes.' }, { status: 429 });
  }
  const badOrigin = checkOrigin(req);
  if (badOrigin) return badOrigin;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { customer, items, notes } = body || {};
  if (
    !customer || !isNonEmptyString(customer.name) || !isNonEmptyString(customer.phone) ||
    !isNonEmptyString(customer.address) || !isNonEmptyString(customer.city)
  ) {
    return NextResponse.json({ error: 'Name, phone, address and city are required.' }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    return NextResponse.json({ error: 'Items must be a non-empty array (max 20).' }, { status: 400 });
  }

  await ready();
  const c = client();
  const getProduct = async (id) => {
    const r = await c.execute({ sql: 'SELECT * FROM products WHERE id = ? AND active = 1', args: [id] });
    return r.rows.length ? parseProduct(r.rows[0]) : null;
  };

  const lines = [];
  let total = 0;
  for (const it of items) {
    const id = it && it.id;
    const qty = it && it.qty;
    if (!isPositiveInt(id) || !isPositiveInt(qty) || qty > 10) {
      return NextResponse.json({ error: 'Each item needs a valid id and qty (max 10).' }, { status: 400 });
    }
    const p = await getProduct(id);
    if (!p) return NextResponse.json({ error: `Product ${id} not found or unavailable.` }, { status: 400 });
    if (p.stock < qty) {
      return NextResponse.json({ error: `Only ${p.stock} left in stock for "${p.name}".` }, { status: 400 });
    }
    lines.push({ id: p.id, name: p.name, price: p.price, qty, image: p.image });
    total += p.price * qty;
  }

  const payment = body.payment === 'bank' ? 'bank' : 'cod';

  // Sanitize stored customer data (defense-in-depth for admin rendering).
  const cleanCustomer = {
    name: sanitizeText(customer.name, 100),
    phone: sanitizeText(customer.phone, 30),
    address: sanitizeText(customer.address, 300),
    city: sanitizeText(customer.city, 60),
  };
  const cleanNotes = notes && isNonEmptyString(notes) ? sanitizeText(notes, 500) : null;

  try {
    // Decrement stock for each line, then insert the order.
    for (const l of lines) {
      const upd = await c.execute({
        sql: 'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
        args: [l.qty, l.id, l.qty],
      });
      if (upd.rowsAffected === 0) {
        return NextResponse.json({ error: `Just ran out of stock for "${l.name}".` }, { status: 400 });
      }
    }
    const ins = await c.execute({
      sql: `INSERT INTO orders (customer, items, total, payment, notes, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      args: [
        JSON.stringify(cleanCustomer),
        JSON.stringify(lines),
        total,
        payment,
        cleanNotes,
        nowISO(),
      ],
    });
    const orderId = Number(ins.lastInsertRowid);
    return NextResponse.json({ order_id: orderId, total }, { status: 201 });
  } catch (e) {
    console.error('order failed', e);
    return NextResponse.json({ error: 'Could not place order. Please try again.' }, { status: 500 });
  }
}
