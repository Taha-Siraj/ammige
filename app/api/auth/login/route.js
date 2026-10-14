import { NextResponse } from 'next/server';
import { getCustomerCredentials, findCustomerById, cleanCustomerEmail } from '@/lib/db';
import { verifyPassword } from '@/lib/customer-auth';
import { issueCustomerSessionCookie } from '@/lib/customer-session';
import { checkRate } from '@/lib/rate-limit';
import { checkOrigin } from '@/lib/csrf';

const GENERIC_FAIL = 'Invalid email or password.';

/**
 * POST /api/auth/login { email, password }
 * -> { ok:true, customer:{ id, name, email } } + session cookie
 * Every failure returns the same 401 — no user enumeration.
 */
export async function POST(req) {
  if (!checkRate(req, { windowMs: 60_000, max: 10, scope: 'auth-login' })) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Please try again shortly.' }, { status: 429 });
  }
  const badOrigin = checkOrigin(req);
  if (badOrigin) return badOrigin;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: GENERIC_FAIL }, { status: 401 });
  }

  const email = cleanCustomerEmail(body?.email);
  const password = typeof body?.password === 'string' ? body.password : '';

  const creds = await getCustomerCredentials(email);
  const ok = creds ? await verifyPassword(password, creds.password_hash) : false;
  if (!ok || !creds) {
    return NextResponse.json({ ok: false, error: GENERIC_FAIL }, { status: 401 });
  }

  const customer = await findCustomerById(creds.id);
  if (!customer) {
    return NextResponse.json({ ok: false, error: GENERIC_FAIL }, { status: 401 });
  }

  const res = NextResponse.json({
    ok: true,
    customer: { id: customer.id, name: customer.name, email: customer.email },
  });
  res.headers.set('Set-Cookie', issueCustomerSessionCookie(customer.id));
  return res;
}
