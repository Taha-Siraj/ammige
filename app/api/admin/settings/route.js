import { NextResponse } from 'next/server';
import { client, ready, getSetting, isNonEmptyString } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

const ALLOWED = ['admin_password', 'whatsapp', 'announcement', 'tagline', 'brand'];

export async function GET(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  await ready();
  const out = {};
  for (const k of ALLOWED) out[k] = await getSetting(k);
  return NextResponse.json(out);
}

export async function PATCH(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  let b;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const keys = Object.keys(b || {}).filter((k) => ALLOWED.includes(k));
  if (keys.length === 0) {
    return NextResponse.json({ error: `Nothing to update. Allowed: ${ALLOWED.join(', ')}.` }, { status: 400 });
  }
  for (const k of keys) {
    if (!isNonEmptyString(b[k])) {
      return NextResponse.json({ error: `${k} cannot be empty.` }, { status: 400 });
    }
    if (k === 'admin_password' && b[k].trim().length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }
  }
  await ready();
  const c = client();
  for (const k of keys) {
    await c.execute({
      sql: `INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      args: [k, b[k].trim()],
    });
  }
  return NextResponse.json({ ok: true, updated: keys });
}
