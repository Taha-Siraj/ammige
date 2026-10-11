import { NextResponse } from 'next/server';
import { client, ready, COLLECTIONS } from '@/lib/db';
import { checkRate } from '@/lib/rate-limit';

export async function GET(req) {
  if (!checkRate(req, { windowMs: 60_000, max: 120, scope: 'public-read' })) {
    return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });
  }
  await ready();
  const out = [];
  for (const c of Object.values(COLLECTIONS)) {
    const countR = await client().execute({
      sql: 'SELECT COUNT(*) AS c FROM products WHERE collection = ? AND active = 1',
      args: [c.id],
    });
    out.push({ ...c, count: countR.rows[0].c });
  }
  return NextResponse.json(out);
}
