import { NextResponse } from 'next/server';
import {
  findCustomerByEmail, createCustomer, sanitizeText, cleanCustomerEmail,
} from '@/lib/db';
import { hashPassword } from '@/lib/customer-auth';
import { issueCustomerSessionCookie } from '@/lib/customer-session';
import { checkRate } from '@/lib/rate-limit';
import { checkOrigin } from '@/lib/csrf';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * POST /api/auth/signup { name, email, password, phone? }
 * -> { ok:true, customer:{ id, name, email } } + session cookie
 */
export async function POST(req) {
  if (!checkRate(req, { windowMs: 60_000, max: 10, scope: 'auth-signup' })) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Please try again shortly.' }, { status: 429 });
  }
  const badOrigin = checkOrigin(req);
  if (badOrigin) return badOrigin;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = cleanCustomerEmail(body?.email);
  const password = typeof body?.password === 'string' ? body.password : '';
  const phoneRaw = typeof body?.phone === 'string' ? body.phone.trim() : '';

  if (name.length < 2 || name.length > 60) {
    return NextResponse.json({ ok: false, error: 'Please enter your name (2–60 characters).' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 120) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ ok: false, error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  let phone = null;
  if (phoneRaw) {
    const digits = phoneRaw.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) {
      return NextResponse.json({ ok: false, error: 'Please enter a valid phone number.' }, { status: 400 });
    }
    phone = sanitizeText(phoneRaw, 30);
  }

  const existing = await findCustomerByEmail(email);
  if (existing) {
    return NextResponse.json(
      { ok: false, error: 'An account with this email already exists. Please log in.' },
      { status: 409 }
    );
  }

  const password_hash = await hashPassword(password);
  const customer = await createCustomer({ name, email, phone, password_hash });

  const res = NextResponse.json({
    ok: true,
    customer: { id: customer.id, name: customer.name, email: customer.email },
  });
  res.headers.set('Set-Cookie', issueCustomerSessionCookie(customer.id));
  return res;
}
