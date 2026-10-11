const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ammige.com';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/admin'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
