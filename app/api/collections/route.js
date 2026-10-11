import { NextResponse } from 'next/server';
import { client, ready, COLLECTIONS } from '@/lib/db';

export async function GET() {
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
