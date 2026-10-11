import './globals.css';
import { CartProvider } from '@/components/CartProvider';
import Header, { WhatsAppFloat, CartDrawer } from '@/components/Header';
import Footer from '@/components/Footer';
import { getSetting } from '@/lib/db';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ammige.com';

export async function generateMetadata() {
  const brand = (await getSetting('brand')) || 'AMMIGE';
  const tagline = (await getSetting('tagline')) || 'Carry Grace Everywhere';
  const title = `${brand} — Premium Women's Handbags in Pakistan | ${tagline}`;
  const description =
    'AMMIGE — premium handcrafted women\u2019s handbags from Pakistan. Everyday, Signature and Leather collections with cash on delivery nationwide and premium gift packaging.';
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords: ['handbags Pakistan', 'women bags', 'leather handbags', 'AMMIGE', 'ladies bags online Pakistan', 'clutch', 'tote bag'],
    openGraph: {
      type: 'website',
      url: SITE_URL,
      siteName: brand,
      title,
      description,
      images: [{ url: '/images/hero-model.jpg', width: 1200, height: 800, alt: 'AMMIGE premium handbag' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/images/hero-model.jpg'] },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }) {
  const announcement = (await getSetting('announcement')) || '';
  const whatsapp = (await getSetting('whatsapp')) || '';

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AMMIGE',
    url: SITE_URL,
    logo: `${SITE_URL}/images/hero-model.jpg`,
    sameAs: [
      'https://instagram.com/ammige012',
      'https://tiktok.com/@ammige012',
      'https://facebook.com/ammige012',
    ],
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <CartProvider>
          <Header announcement={announcement} />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
          <WhatsAppFloat number={whatsapp} />
        </CartProvider>
      </body>
    </html>
  );
}
