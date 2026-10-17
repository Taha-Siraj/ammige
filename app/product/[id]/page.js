import { notFound } from 'next/navigation';
import { client, ready, parseProduct } from '@/lib/db';
import ProductDetail from '@/components/ProductDetail';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ammige.com';

async function getProduct(id) {
  await ready();
  const r = await client().execute({
    sql: 'SELECT * FROM products WHERE id = ? AND active = 1',
    args: [id],
  });
  return r.rows.length ? parseProduct(r.rows[0]) : null;
}

async function getRelated(p) {
  await ready();
  const r = await client().execute({
    sql: 'SELECT * FROM products WHERE collection = ? AND id != ? AND active = 1 ORDER BY rating DESC LIMIT 4',
    args: [p.collection, p.id],
  });
  return r.rows.map(parseProduct);
}

export async function generateMetadata({ params }) {
  const p = await getProduct(Number(params.id));
  if (!p) return { title: 'Product not found — AMMIGE' };
  const title = `${p.name} — AMMIGE`;
  const description = `${p.name}. ${p.material || ''} Price Rs ${p.price.toLocaleString('en-PK')} with cash on delivery across Pakistan.`;
  return {
    title,
    description,
    openGraph: {
      title, description, type: 'website',
      url: `${SITE_URL}/product/${p.id}`,
      images: [{ url: p.image, alt: p.name }],
    },
  };
}

export default async function ProductPage({ params }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const p = await getProduct(id);
  if (!p) notFound();
  const related = await getRelated(p);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.sku,
    image: `${SITE_URL}${p.image}`,
    description: p.description,
    brand: { '@type': 'Brand', name: 'AMMIGE' },
    material: p.material,
    aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviews },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${p.id}`,
      priceCurrency: 'PKR',
      price: p.price,
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
      { '@type': 'ListItem', position: 3, name: p.name, item: `${SITE_URL}/product/${p.id}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ProductDetail p={p} related={related} />
    </>
  );
}
