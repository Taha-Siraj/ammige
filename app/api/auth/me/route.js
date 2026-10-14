import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { findCustomerById } from '@/lib/db';
import { verifyCustomerSession } from '@/lib/customer-session';

/** GET /api/auth/me -> current customer or 401. */
export async function GET() {
  const cookieHeader = (await headers()).get('cookie') || '';
  const customerId = verifyCustomerSession(cookieHeader);
  if (!customerId) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  const customer = await findCustomerById(customerId);
  if (!customer) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
  });
}
