import './globals.css';
import { Poppins, Roboto } from 'next/font/google';
import { headers } from 'next/headers';
import { CartProvider } from '@/components/CartProvider';
import Header, { WhatsAppFloat, CartDrawer } from '@/components/Header';
import Footer from '@/components/Footer';
import Preloader from '@/components/Preloader';
import { getSetting } from '@/lib/db';

// next/font: self-hosted, no render-blocking Google Fonts request.
const poppins = Poppins({ weight: ['500', '600', '700'], subsets: ['latin'], display: 'swap', variable: '--font-d' });
const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'], display: 'swap', variable: '--font-b' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ammige.com';

export async function generateMetadata() {
  const brand = (await getSetting('brand')) || 'AMMIGE';
  const tagline = (await getSetting('tagline')) || 'Carry Grace Everywhere';
  const title = `${brand} — Premium Women's Handbags in Pakistan | ${tagline}`;
  const description =
    'Shop AMMIGE premium handcrafted women\u2019s handbags online in Pakistan — Everyday, Signature and Leather collections. Cash on delivery nationwide, 7-day easy exchange, premium gift packaging.';
  return {
    // metadataBase lets Next.js resolve canonical + OG URLs to absolute URLs.
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: '%s | AMMIGE — Premium Handbags Pakistan',
    },
    description,
    keywords: [
      'handbags Pakistan',
      'women bags Pakistan',
      'leather handbags Pakistan',
      'ladies bags online Pakistan',
      'tote bag Pakistan',
      'clutch bags Pakistan',
      'AMMIGE',
      'handbag price in Pakistan',
      'cash on delivery handbags',
    ],
    openGraph: {
      type: 'website',
      url: SITE_URL,
      siteName: brand,
      title,
      description,
      images: [{ url: '/images/hero-model.jpg', width: 1200, height: 800, alt: 'AMMIGE premium handbag carried by model — Pakistan' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/hero-model.jpg'],
    },
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
    slogan: 'Carry Grace Everywhere',
    description: "AMMIGE is a Pakistani women's handbags brand. Everyday, Signature and Leather collections. Prices in PKR, Cash on Delivery nationwide, 7-day easy exchange.",
    sameAs: [
      'https://www.instagram.com/ammige012',
      'https://www.tiktok.com/@ammige012',
      'https://www.facebook.com/share/1KZiNXEgJi/',
    ],
    // speakable: lets voice assistants & AI answer engines quote key facts directly (GEO/AEO).
    speakable: {
      '@type': 'SpeakableSpecification',
      xpath: ["/html/head/title", "/html/head/meta[@name='description']/@content"],
    },
  };

  // The admin panel (/admin) renders WITHOUT any storefront chrome —
  // no header, footer, cart drawer, preloader or WhatsApp button — so it
  // stays completely separated from the public site. The middleware sets
  // the x-pathname header on every pass-through request.
  const pathname = (await headers()).get('x-pathname') || '';
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');

  return (
    <html lang="en" className={`${poppins.variable} ${roboto.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {isAdmin ? (
          <main>{children}</main>
        ) : (
          <CartProvider>
            <Preloader />
            <Header announcement={announcement} />
            <main>{children}</main>
            <Footer />
            <CartDrawer />
            <WhatsAppFloat number={whatsapp} />
          </CartProvider>
        )}
      </body>
    </html>
  );
}
