import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/db';
import { checkRate } from '@/lib/rate-limit';

export async function GET(req) {
  if (!checkRate(req, { windowMs: 60_000, max: 120, scope: 'public-read' })) {
    return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });
  }
  const [brand, whatsapp, announcement, tagline, video_url] = await Promise.all([
    getSetting('brand'),
    getSetting('whatsapp'),
    getSetting('announcement'),
    getSetting('tagline'),
    getSetting('video_url'),
  ]);
  return NextResponse.json({ brand, whatsapp, announcement, tagline, video_url });
}
