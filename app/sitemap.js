import { client, ready } from '@/lib/db';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ammige.com';

export default async function sitemap() {
  const urls = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/track`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];
  try {
    await ready();
    const r = await client().execute({
      sql: 'SELECT id FROM products WHERE active = 1 ORDER BY id DESC LIMIT 500',
    });
    for (const row of r.rows) {
      urls.push({
        url: `${SITE_URL}/product/${row.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch {
    // sitemap still works without product URLs
  }
  return urls;
}
