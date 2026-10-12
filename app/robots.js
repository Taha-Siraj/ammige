const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ammige.com';

const AI_BOTS = [
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Bytespider',
  'Applebot-Extended',
];

export default function robots() {
  return {
    rules: [
      // AI answer engines / crawlers: explicitly welcome (GEO strategy).
      ...AI_BOTS.map((ua) => ({ userAgent: ua, allow: '/' })),
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/admin'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
