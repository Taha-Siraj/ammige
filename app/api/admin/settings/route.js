import { NextResponse } from 'next/server';
import {
  client, ready, getSetting, isNonEmptyString,
  sanitizeText, isWeakPassword, isValidWhatsapp,
} from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { checkOrigin } from '@/lib/csrf';
import { checkRate } from '@/lib/rate-limit';

const ALLOWED = ['admin_password', 'whatsapp', 'announcement', 'tagline', 'brand'];

function adminWriteLimit(req) {
  return checkRate(req, { windowMs: 60_000, max: 60, scope: 'admin-write' });
}

export async function GET(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  await ready();
  const out = {};
  // Never send the real admin password to the client; expose only a
  // weakness flag so the dashboard can nudge the admin to strengthen it.
  for (const k of ALLOWED) {
    if (k === 'admin_password') continue;
    out[k] = await getSetting(k);
  }
  out.password_weak = isWeakPassword(await getSetting('admin_password'));
  return NextResponse.json(out);
}

export async function PATCH(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const badOrigin = checkOrigin(req);
  if (badOrigin) return badOrigin;
  if (!adminWriteLimit(req)) {
    return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });
  }
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
  const cleaned = {};
  for (const k of keys) {
    if (k === 'admin_password') {
      if (!isNonEmptyString(b[k]) || b[k].trim().length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
      }
      cleaned[k] = b[k].trim();
    } else if (k === 'whatsapp') {
      if (!isValidWhatsapp(b[k])) {
        return NextResponse.json({ error: 'whatsapp must be a valid phone number.' }, { status: 400 });
      }
      cleaned[k] = b[k].trim();
    } else {
      const v = sanitizeText(b[k], 500);
      if (!v) {
        return NextResponse.json({ error: `${k} cannot be empty.` }, { status: 400 });
      }
      cleaned[k] = v;
    }
  }
  await ready();
  const c = client();
  for (const k of keys) {
    await c.execute({
      sql: `INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      args: [k, cleaned[k]],
    });
  }
  return NextResponse.json({ ok: true, updated: keys });
}
