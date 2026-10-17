import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { checkRate } from '@/lib/rate-limit';
import { checkOrigin } from '@/lib/csrf';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 3 * 1024 * 1024; // 3MB (admin UI resizes before upload)

/**
 * POST /api/admin/upload — direct image upload for the admin panel.
 * Accepts multipart/form-data with a `file` field, validates it, and
 * returns a data URL that can be saved straight into product fields.
 * (No image links/URLs needed anymore.)
 */
export async function POST(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  if (!checkRate(req, { windowMs: 60_000, max: 30, scope: 'admin-upload' })) {
    return NextResponse.json({ error: 'Too many uploads. Slow down.' }, { status: 429 });
  }
  const badOrigin = checkOrigin(req);
  if (badOrigin) return badOrigin;

  let form;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  }
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WEBP or GIF images.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image too large (max 3MB).' }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const url = `data:${file.type};base64,${buf.toString('base64')}`;
  return NextResponse.json({ ok: true, url, size: file.size, type: file.type });
}
