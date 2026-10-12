import Link from 'next/link';
import Reveal from '@/components/Reveal';
import FaqAccordion from '@/components/FaqAccordion';

export const metadata = {
  title: 'FAQs — AMMIGE',
  description: 'AMMIGE frequently asked questions: cash on delivery, shipping time, exchanges, packaging and order tracking.',
};

const ITEMS = [
  {
    q: 'Do you offer Cash on Delivery?',
    a: 'Yes — COD is available all across Pakistan. You pay in cash when your order arrives at your doorstep. No advance payment needed.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Orders are dispatched within 24 hours (usually the same working day). Delivery takes 2–4 working days in most cities via TCS or Leopards Courier; remote areas may take 5–7 working days.',
  },
  {
    q: 'What are the delivery charges?',
    a: 'A flat Rs 250 nationwide — and delivery is completely free on all orders over Rs 5,000.',
  },
  {
    q: 'Can I exchange or return a bag?',
    a: 'We offer a 7-day easy exchange: if the bag is unused with tags attached, message us on WhatsApp with your order ID and we will arrange a replacement in your preferred colour or style. If the item arrived damaged or wrong, we cover all courier charges and offer a free replacement or full refund.',
  },
  {
    q: 'How do I track my order?',
    a: 'Use your order ID on our Track Order page any time. Once dispatched, you will also receive an SMS from the courier with their tracking number.',
  },
  {
    q: 'Are the leather bags genuine leather?',
    a: 'Our Leather Collection uses genuine top-grain leather that ages beautifully with use. Every product page lists the exact material, so you always know what you are getting.',
  },
  {
    q: 'What comes in the packaging?',
    a: 'Every order arrives gift-ready: your bag wrapped in tissue, a reusable branded dust bag, a thank-you card, a care guide and a brand hang tag — all sealed in a strong corrugated box.',
  },
  {
    q: 'How can I contact you?',
    a: 'The fastest way is WhatsApp at +92 316 2852167 (Mon–Sat, 10am–8pm PKT). You can also use our contact form or DM us on Instagram @ammige012.',
  },
];

export default function FaqPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ITEMS.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="page-hero">
        <div className="wrap">
          <Reveal>
            <div className="eyebrow">Help centre</div>
            <h1 className="display">Frequently asked<br />questions</h1>
            <p>Everything you might want to know before you order.</p>
          </Reveal>
        </div>
      </section>

      <div style={{ padding: '72px 28px 96px' }}>
        <Reveal>
          <FaqAccordion items={ITEMS} />
        </Reveal>
        <Reveal>
          <p style={{ textAlign: 'center', marginTop: 44, color: 'var(--muted)', fontWeight: 300 }}>
            Still curious? <Link href="/contact" style={{ color: 'var(--gold-deep)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Message us</Link> — we reply fast.
          </p>
        </Reveal>
      </div>
    </>
  );
}
