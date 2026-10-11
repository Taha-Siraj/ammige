import { NextResponse } from 'next/server';
import {
  client, ready, parseProduct, nowISO, isNonEmptyString, isPositiveInt,
} from '@/lib/db';
import { checkRate } from '@/lib/rate-limit';

export async function POST(req) {
  // 10 orders per IP per 10 minutes — abuse protection
  if (!checkRate(req, { windowMs: 10 * 60 * 1000, max: 10, scope: 'orders' })) {
    return NextResponse.json({ error: 'Too many orders. Please wait a few minutes.' }, { status: 429 });
  }

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

  const payment = body.payment && isNonEmptyString(body.payment)
    ? body.payment.trim().toLowerCase().slice(0, 20)
    : 'cod';

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
        JSON.stringify({
          name: customer.name.trim().slice(0, 100),
          phone: customer.phone.trim().slice(0, 30),
          address: customer.address.trim().slice(0, 300),
          city: customer.city.trim().slice(0, 60),
        }),
        JSON.stringify(lines),
        total,
        payment,
        notes && isNonEmptyString(notes) ? notes.trim().slice(0, 500) : null,
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
