import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
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

const LOOKBOOK = [
  { img: '/images/product-mini.jpg', label: 'Mini · Blush Pink' },
  { img: '/images/product-medium.jpg', label: 'Medium · Cognac' },
  { img: '/images/product-large.jpg', label: 'Large · Classic Black' },
  { img: '/images/product-crossbody.jpg', label: 'Crossbody · Tan' },
];

export default async function Home() {
  const bestsellers = await getBestsellers();
  const marqueeHalf = MARQUEE.map((t) => (
    <span key={t}><i>◆</i>{t}</span>
  ));

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <Reveal><div className="eyebrow">Ammige · Handcrafted in Pakistan</div></Reveal>
            <Reveal delay="rv-d1">
              <h1 className="display">Carry <em>Grace</em><br />Everywhere</h1>
            </Reveal>
            <Reveal delay="rv-d2">
              <div className="hairline" />
              <p className="lead">
                Handbags shaped by artisans and finished with solid brass —
                wrapped like a gift, because it is one.
              </p>
            </Reveal>
            <Reveal delay="rv-d3">
              <div className="hero-cta">
                <Link className="btn btn-gold" href="/shop">Shop the Collection</Link>
                <Link className="btn btn-outline" href="#collections">Explore Collections</Link>
              </div>
              <div className="hero-meta">
                <div><strong>260+</strong><span>Curated Styles</span></div>
                <div><strong>4.8</strong><span>Average Rating</span></div>
                <div><strong>COD</strong><span>Cash on Delivery</span></div>
              </div>
            </Reveal>
          </div>
          <div className="hero-media">
            <Reveal delay="rv-d1">
              <div className="hero-frame">
                <img src="/images/hero-model.jpg" alt="Pakistani model carrying an AMMIGE cognac leather handbag" fetchPriority="high" />
              </div>
            </Reveal>
            <div className="hero-badge">
              <b>The Signature Edit</b>
              <span>New Season · 2026</span>
            </div>
            <div className="float-card" style={{ top: 36, right: -14 }}>
              <span className="fc-dot" />
              <div><b>2,400+ orders</b><span>delivered this month</span></div>
            </div>
          </div>
        </div>
      </section>

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

      {/* LOOKBOOK — sizes */}
      <section className="block" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <div className="eyebrow">Find your fit</div>
              <h2 className="display">Every size, every mood</h2>
              <p>From minis to maxis — carried by women like you.</p>
            </div>
          </Reveal>
          <div className="look-grid">
            {LOOKBOOK.map((l, i) => (
              <Reveal key={l.img} delay={i === 1 ? 'rv-d1' : i === 2 ? 'rv-d2' : i === 3 ? 'rv-d3' : ''}>
                <Link href="/shop" className="look-card">
                  <img src={l.img} alt={`Pakistani model with AMMIGE bag — ${l.label}`} loading="lazy" />
                  <span>{l.label}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CRAFT */}
      <section className="block" id="story" style={{ background: '#fff' }}>
        <div className="wrap story-grid">
          <Reveal>
            <div>
              <div className="eyebrow">Our Craft</div>
              <h2 className="display" style={{ fontSize: 'clamp(30px,3.6vw,44px)' }}>
                Wrapped like a gift,<br />because it is one
              </h2>
              <div className="hairline" />
              <p style={{ color: 'var(--muted)' }}>
                Every AMMIGE order leaves our studio in a complete premium packaging set —
                tissue, dust bag, thank-you card and care guide, sealed in a strong corrugated box.
              </p>
              <div className="steps">
                <div className="step"><span className="n">1</span><div><b>Wrapped with care</b><p>Your bag is wrapped in tissue with handles and hardware protected.</p></div></div>
                <div className="step"><span className="n">2</span><div><b>Premium dust bag</b><p>Placed in a re-usable branded dust bag for lifelong storage.</p></div></div>
                <div className="step"><span className="n">3</span><div><b>Thank-you &amp; care cards</b><p>A hand-feel thank-you card, care guide and brand hang tag inside.</p></div></div>
                <div className="step"><span className="n">4</span><div><b>Secure shipping box</b><p>Sealed in a strong corrugated box with protective fillers.</p></div></div>
              </div>
            </div>
          </Reveal>
          <Reveal delay="rv-d1">
            <div className="story-img">
              <img src="/images/products/packaging.jpg" alt="AMMIGE premium packaging set" loading="lazy" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="block">
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <div className="eyebrow">Customer love</div>
              <h2 className="display">Carried &amp; cherished</h2>
            </div>
          </Reveal>
          <div className="testi-grid">
            {[
              { t: 'The Heritage Tote looks even better in person. The packaging felt like opening a gift to myself.', n: 'Mahnoor S.', c: 'Lahore' },
              { t: 'Ordered on Monday, delivered by Thursday. The quality is beyond what I expected at this price.', n: 'Areeba K.', c: 'Karachi' },
              { t: 'My Sahara leather tote has aged beautifully in six months. Worth every rupee.', n: 'Fatima R.', c: 'Islamabad' },
            ].map((x, i) => (
              <Reveal key={x.n} delay={i === 1 ? 'rv-d1' : i === 2 ? 'rv-d2' : ''}>
                <div className="testi">
                  <p>“{x.t}”</p>
                  <div className="who"><b>{x.n}</b><span>{x.c}</span></div>
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
