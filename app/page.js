import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import CinematicHero from '@/components/CinematicHero';
import { client, ready, parseProduct, COLLECTIONS } from '@/lib/db';
import BestsellersCarousel from '@/components/BestsellersCarousel';
import NewsletterForm from '@/components/NewsletterForm';

async function getBestsellers() {
  await ready();
  const r = await client().execute(
    "SELECT * FROM products WHERE active = 1 AND badge = 'Bestseller' ORDER BY reviews DESC LIMIT 10"
  );
  let items = r.rows.map(parseProduct);
  if (items.length < 8) {
    const r2 = await client().execute(
      'SELECT * FROM products WHERE active = 1 ORDER BY rating DESC, reviews DESC LIMIT 10'
    );
    items = r2.rows.map(parseProduct);
  }
  return items;
}

const MARQUEE = [
  'Free nationwide delivery over Rs 5,000',
  'Cash on Delivery',
  'Handcrafted in Pakistan',
  'Premium gift packaging',
  '7-day easy exchange',
];

const TRUST = [
  {
    t: 'Cash on Delivery',
    d: 'Pay at your doorstep — available in every corner of Pakistan.',
    icon: <><rect x="3" y="7" width="18" height="11" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  },
  {
    t: 'Premium Packaging',
    d: 'Every order arrives gift-ready: dust bag, tissue & care cards.',
    icon: <><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M12 9v11M4 13h16M12 9s-4.5.3-5.5-2C5.7 5.4 8 4.5 9.4 5.6 10.6 6.5 12 9 12 9zm0 0s4.5.3 5.5-2c.8-1.6-1.5-2.5-2.9-1.4C13.4 6.5 12 9 12 9z" /></>,
  },
  {
    t: '7-Day Exchange',
    d: 'Changed your mind? Easy exchange within 7 days, no questions.',
    icon: <><path d="M4 9a8 8 0 0 1 14-3l2 2M20 15a8 8 0 0 1-14 3l-2-2" /><path d="M20 4v4h-4M4 20v-4h4" /></>,
  },
  {
    t: 'Nationwide Delivery',
    d: 'TCS & Leopards courier — delivered in 2–4 working days.',
    icon: <><path d="M2 7h11v9H2zM13 10h4.5L21 13.5V16h-8" /><circle cx="6.5" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  },
];

const GALLERY = [
  { img: '/images/collection-everyday.jpg', label: 'Everyday' },
  { img: '/images/product-mini.jpg', label: 'Mini · Blush' },
  { img: '/images/collection-signature.jpg', label: 'Signature' },
  { img: '/images/product-crossbody.jpg', label: 'Crossbody · Tan' },
  { img: '/images/collection-leather.jpg', label: 'Leather' },
  { img: '/images/product-large.jpg', label: 'Large · Noir' },
];

const TESTIMONIALS = [
  {
    t: 'The Heritage Tote looks even better in person — the leather, the stitching, everything feels premium. The packaging felt like opening a gift to myself.',
    n: 'Ayesha K.', c: 'Lahore',
  },
  {
    t: 'Ordered on Monday, delivered by Thursday. I was nervous about buying a bag online, but the quality is beyond what I expected at this price.',
    n: 'Mahnoor S.', c: 'Karachi',
  },
  {
    t: 'My Sahara leather tote has aged beautifully in six months. You can tell it was made by people who actually care. Worth every rupee.',
    n: 'Fatima R.', c: 'Islamabad',
  },
];

export default async function Home() {
  const bestsellers = await getBestsellers();
  const marqueeHalf = MARQUEE.map((t) => (
    <span key={t}><i>◆</i>{t}</span>
  ));

  return (
    <>
      <CinematicHero />

      {/* MARQUEE */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">{marqueeHalf}{marqueeHalf}</div>
      </div>

      {/* COLLECTIONS */}
      <section className="block" id="collections">
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <div className="eyebrow">Our Collections</div>
              <h2 className="display">Three worlds, one signature</h2>
              <p>From daily companions to couture statements — every AMMIGE piece is designed to be carried for years.</p>
            </div>
          </Reveal>
          <div className="collections-grid">
            {Object.values(COLLECTIONS).map((c, i) => (
              <Reveal key={c.id} delay={i === 1 ? 'rv-d1' : i === 2 ? 'rv-d2' : ''}>
                <Link href={`/shop?collection=${c.id}`} className="coll-card">
                  <img src={c.image} alt={`${c.name} — Pakistani model with AMMIGE handbag`} loading="lazy" />
                  <div className="coll-shade" />
                  <div className="coll-info">
                    <div className="eyebrow">Collection 0{i + 1}</div>
                    <h3>{c.name.replace(' Collection', '')}</h3>
                    <p>{c.tagline}</p>
                    <span className="coll-link">
                      Shop now
                      <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BESTSELLERS */}
      <section className="block" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <div className="eyebrow">Most loved</div>
              <h2 className="display">Bestsellers</h2>
              <p>The pieces our customers reach for again and again.</p>
            </div>
          </Reveal>
          <BestsellersCarousel items={bestsellers} />
        </div>
      </section>

      {/* CRAFT — dark cinematic */}
      <section className="block craft-dark" id="story">
        <div className="wrap craft-grid">
          <Reveal>
            <div className="craft-media">
              <img src="/images/products/packaging.jpg" alt="AMMIGE premium packaging set — dust bag, tissue and care cards" loading="lazy" />
            </div>
          </Reveal>
          <div>
            <Reveal>
              <div className="eyebrow">Our Craft</div>
              <h2 className="display">Wrapped like a gift,<br />because it is one</h2>
            </Reveal>
            <Reveal delay="rv-d1">
              <p className="lead-dark">
                Every AMMIGE order leaves our studio in a complete premium packaging set —
                tissue, dust bag, thank-you card and care guide, sealed in a strong corrugated box.
              </p>
            </Reveal>
            <div className="craft-steps">
              {[
                ['Wrapped with care', 'Your bag is wrapped in tissue with handles and hardware protected.'],
                ['Premium dust bag', 'Placed in a re-usable branded dust bag for lifelong storage.'],
                ['Thank-you & care cards', 'A hand-feel thank-you card, care guide and brand hang tag inside.'],
                ['Secure shipping box', 'Sealed in a strong corrugated box with protective fillers.'],
              ].map(([b, p], i) => (
                <Reveal key={b} delay={i === 1 ? 'rv-d1' : i === 2 ? 'rv-d2' : i === 3 ? 'rv-d3' : ''}>
                  <div className="craft-step">
                    <span className="n">{i + 1}</span>
                    <div><b>{b}</b><p>{p}</p></div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="block" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <Reveal>
            <div className="sec-head" style={{ marginBottom: 44 }}>
              <div className="eyebrow">Shop with confidence</div>
              <h2 className="display">The AMMIGE promise</h2>
            </div>
          </Reveal>
          <div className="trust-row">
            {TRUST.map((x, i) => (
              <Reveal key={x.t} delay={i === 1 ? 'rv-d1' : i === 2 ? 'rv-d2' : i === 3 ? 'rv-d3' : ''}>
                <div className="trust-item">
                  <div className="trust-ic"><svg viewBox="0 0 24 24">{x.icon}</svg></div>
                  <div><b>{x.t}</b><span>{x.d}</span></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY STRIP */}
      <section className="gallery-bleed">
        <div className="wrap">
          <Reveal>
            <div className="sec-head" style={{ marginBottom: 40 }}>
              <div className="eyebrow">The lookbook</div>
              <h2 className="display">Carried by women like you</h2>
            </div>
          </Reveal>
        </div>
        <div className="gallery-strip">
          {GALLERY.map((g) => (
            <Link key={g.img} href="/shop" className="gallery-item">
              <img src={g.img} alt={`AMMIGE — ${g.label}`} loading="lazy" />
              <span>{g.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="block">
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <div className="eyebrow">Customer love</div>
              <h2 className="display">Carried &amp; cherished</h2>
              <p>Real words from real customers across Pakistan.</p>
            </div>
          </Reveal>
          <div className="testi-grid">
            {TESTIMONIALS.map((x, i) => (
              <Reveal key={x.n} delay={i === 1 ? 'rv-d1' : i === 2 ? 'rv-d2' : ''}>
                <div className="testi">
                  <div className="stars">{'★'.repeat(5)}</div>
                  <p>“{x.t}”</p>
                  <div className="who">
                    <span className="avatar">{x.n.charAt(0)}</span>
                    <div><b>{x.n}</b><span>{x.c}</span></div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="block" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <div className="newsletter">
              <div className="eyebrow" style={{ color: 'var(--gold)' }}>The Ammige Circle</div>
              <h2 className="display">First to know, first to carry</h2>
              <p>New drops, private previews and members-only prices — straight to your inbox.</p>
              <NewsletterForm />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
