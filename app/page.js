import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import EditorialHero from '@/components/EditorialHero';
import SmartImage from '@/components/SmartImage';
import { client, ready, parseProduct, COLLECTIONS, getSetting } from '@/lib/db';
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

/** Live product counts per collection — shown on the collection cards. */
async function getCollectionCounts() {
  await ready();
  const r = await client().execute(
    'SELECT collection, COUNT(*) AS n FROM products WHERE active = 1 GROUP BY collection'
  );
  const m = {};
  for (const row of r.rows) m[row.collection] = Number(row.n);
  return m;
}

/** Extract a YouTube video ID from watch / youtu.be / shorts URLs. */
function youtubeId(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes('youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = u.pathname.match(/^\/shorts\/([\w-]{6,})/);
      if (m) return m[1];
    } else if (host === 'youtu.be') {
      const m = u.pathname.match(/^\/([\w-]{6,})/);
      if (m) return m[1];
    }
  } catch {
    // not a parseable URL
  }
  return null;
}

function isDirectVideo(url) {
  return /\.(mp4|webm)(\?|#|$)/i.test(url);
}

const MARQUEE = [  'Free nationwide delivery over Rs 5,000',
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

export default async function Home() {
  const bestsellers = await getBestsellers();
  const counts = await getCollectionCounts();
  const videoUrl = (await getSetting('video_url')) || '';
  const ytVideoId = youtubeId(videoUrl);
  const showVideo = Boolean(ytVideoId || (!ytVideoId && isDirectVideo(videoUrl)));
  const marqueeHalf = MARQUEE.map((t) => (
    <span key={t}><i>◆</i>{t}</span>
  ));

  return (
    <>
      <EditorialHero />

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
              <p>Structured leather for the boardroom, embellished minis for shaadi season, and totes that survive Karachi traffic — every piece designed in Pakistan, made to be carried for years.</p>
            </div>
          </Reveal>
          <div className="collections-grid">
            {Object.values(COLLECTIONS).map((c, i) => (
              <Reveal key={c.id} delay={i === 1 ? 'rv-d1' : i === 2 ? 'rv-d2' : ''}>
                <Link href={`/shop?collection=${c.id}`} className="coll-card">
                  <SmartImage src={c.image} alt={`${c.name} — AMMIGE handbag`} fill />
                  <div className="coll-shade" />
                  <div className="coll-count">{counts[c.id] || 0} pieces</div>
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
              <p>The totes, crossbodies and minis that Lahore, Karachi and Islamabad keep reordering.</p>
            </div>
          </Reveal>
          <BestsellersCarousel items={bestsellers} />
        </div>
      </section>

      {/* SHOP BY OCCASION */}
      <section className="block" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <div className="eyebrow">Find your fit</div>
              <h2 className="display">Shop by the day you&apos;re having</h2>
            </div>
          </Reveal>
          <div className="trust-row occasion-row">
            {[
              { t: 'For work days', d: 'Structured totes & satchels that fit a 13-inch laptop and your lunch.', href: '/shop?q=tote' },
              { t: 'For shaadis', d: 'Embellished minis and clutches made for mehndis and baraats.', href: '/shop?q=clutch' },
              { t: 'For every day', d: 'Light crossbodies and hobos for university, errands and chai runs.', href: '/shop?q=crossbody' },
            ].map((x, i) => (
              <Reveal key={x.t} delay={i === 1 ? 'rv-d1' : i === 2 ? 'rv-d2' : ''}>
                <Link href={x.href} className="trust-item" style={{ textDecoration: 'none' }}>
                  <div><b>{x.t}</b><span>{x.d}</span><span style={{ color: 'var(--gold-deep)', fontWeight: 500, marginTop: 8, display: 'block' }}>Shop now →</span></div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CRAFT — dark cinematic */}
      <section className="block craft-dark" id="story">
        <div className="wrap craft-grid">
          <Reveal>
            <div className="craft-media">
              <SmartImage src="/images/products/packaging.jpg" alt="AMMIGE premium packaging set — dust bag, tissue and care cards" fill />
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

      {showVideo ? (
        <section className="block" id="film" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <Reveal>
              <div className="sec-head" style={{ marginBottom: 40 }}>
                <div className="eyebrow">In motion</div>
                <h2 className="display">The Craft, In Motion</h2>
                <p>Watch how every AMMIGE piece comes to life — from cutting table to your doorstep.</p>
              </div>
            </Reveal>
            <Reveal>
              <div className="video-frame">
                {ytVideoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytVideoId}`}
                    title="AMMIGE — The Craft, In Motion"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={videoUrl} controls playsInline preload="metadata" />
                )}
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* TRUST BADGES */}      <section className="block" style={{ paddingBottom: 0 }}>
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
              <SmartImage src={g.img} alt={`AMMIGE — ${g.label}`} fill />
              <span>{g.label}</span>
            </Link>
          ))}
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
