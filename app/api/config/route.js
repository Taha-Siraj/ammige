import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/db';

export async function GET() {
  const [brand, whatsapp, announcement, tagline] = await Promise.all([
    getSetting('brand'),
    getSetting('whatsapp'),
    getSetting('announcement'),
    getSetting('tagline'),
  ]);
  return NextResponse.json({ brand, whatsapp, announcement, tagline });
}
