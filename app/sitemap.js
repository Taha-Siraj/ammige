import { client, ready } from '@/lib/db';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ammige.com';

export default async function sitemap() {
  const urls = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/shipping`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/track`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];
  try {
    await ready();
    const r = await client().execute({
      sql: 'SELECT id, name, image FROM products WHERE active = 1 ORDER BY id DESC LIMIT 500',
    });
    for (const row of r.rows) {
      const entry = {
        url: `${SITE_URL}/product/${row.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      };
      if (row.image) {
        const img = String(row.image).startsWith('http')
          ? row.image
          : `${SITE_URL}${row.image.startsWith('/') ? row.image : `/${row.image}`}`;
        entry.images = [img];
      }
      urls.push(entry);
    }
  } catch {
    // sitemap still works without product URLs
  }
  return urls;
}
