import Link from 'next/link';
import Reveal from '@/components/Reveal';

export const metadata = {
  title: 'About Us — AMMIGE',
  description: 'The AMMIGE story: premium handcrafted women\u2019s handbags from Pakistan. Designed with care, made by artisans, wrapped like a gift.',
};

const VALUES = [
  ['Crafted, not manufactured', 'Every AMMIGE bag passes through the hands of skilled Pakistani artisans — cut, stitched and finished with attention you can feel.'],
  ['Honest materials', 'Full-grain and top-grain leathers, solid brass hardware, and linings chosen to last years, not seasons.'],
  ['Wrapped like a gift', 'Tissue, dust bag, thank-you card and care guide in every box — because unboxing should feel as good as carrying.'],
];

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Reveal>
            <div className="eyebrow">Our Story</div>
            <h1 className="display">Made in Pakistan,<br />carried everywhere</h1>
            <p>AMMIGE began with a simple belief: Pakistani women deserve handbags that rival anything in the world — designed here, crafted here, loved everywhere.</p>
          </Reveal>
        </div>
      </section>

      <div className="wrap">
        <div className="story-grid" style={{ padding: '88px 0 24px' }}>
          <Reveal>
            <div>
              <div className="eyebrow">Who we are</div>
              <h2 className="display" style={{ fontSize: 'clamp(30px,3.6vw,44px)' }}>A love letter to<br />Pakistani craft</h2>
              <div className="hairline" />
              <p style={{ color: 'var(--muted)', fontWeight: 300, fontSize: 16.5 }}>
                We work directly with artisan workshops — no middlemen, no shortcuts. Each design starts
                as a sketch, becomes a prototype, and is refined over weeks until the stitching, the
                weight and the way it sits on your shoulder feel exactly right.
              </p>
              <p style={{ color: 'var(--muted)', fontWeight: 300, fontSize: 16.5, marginTop: 14 }}>
                Then it is wrapped like a gift — because when a woman in Lahore, Karachi or Islamabad
                opens an AMMIGE box, we want her to feel what we felt making it.
              </p>
            </div>
          </Reveal>
          <Reveal delay="rv-d1">
            <div className="story-img">
              <img src="/images/collection-signature.jpg" alt="AMMIGE Signature collection — Pakistani model with handbag" loading="lazy" />
            </div>
          </Reveal>
        </div>
      </div>

      <section className="block" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <div className="eyebrow">What we stand for</div>
              <h2 className="display">Three promises</h2>
            </div>
          </Reveal>
          <div className="trust-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            {VALUES.map(([b, p], i) => (
              <Reveal key={b} delay={i === 1 ? 'rv-d1' : i === 2 ? 'rv-d2' : ''}>
                <div className="trust-item" style={{ flexDirection: 'column', gap: 10 }}>
                  <b style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 500 }}>{b}</b>
                  <span>{p}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div style={{ textAlign: 'center', marginTop: 56 }}>
              <Link className="btn btn-gold" href="/shop">Shop the Collection</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
