import Reveal from '@/components/Reveal';

export const metadata = {
  title: 'Terms of Service — AMMIGE',
  description: 'The terms that govern shopping with AMMIGE: orders, payment, delivery, exchanges, accounts and fair use.',
};

const SECTIONS = [
  {
    h: '1. About these terms',
    body: (
      <p>
        These terms govern every purchase you make from AMMIGE (&quot;we&quot;, &quot;us&quot;),
        a women&apos;s handbags brand operating online in Pakistan. By placing an order or creating
        an account, you agree to these terms. If you do not agree, please do not use the store.
      </p>
    ),
  },
  {
    h: '2. Orders & payment',
    body: (
      <ul>
        <li>All prices are in <strong>Pakistani Rupees (PKR)</strong> and include all applicable taxes.</li>
        <li>Payment is <strong>Cash on Delivery</strong> — you pay the courier in cash when your order arrives.</li>
        <li>An order is confirmed when you receive our confirmation on WhatsApp/SMS or see it in your account. Until then, stock is not reserved.</li>
        <li>We reserve the right to cancel an order (for example, if an item is out of stock or a price was listed in error) and will inform you promptly. If you already paid, you get a full refund.</li>
        <li>If a price is obviously a mistake (e.g. a typo), we may cancel the order and offer you the correct price — you are never forced to pay the wrong one, and we are never forced to honour it.</li>
      </ul>
    ),
  },
  {
    h: '3. Delivery',
    body: (
      <ul>
        <li>Delivery takes <strong>2–4 working days</strong> in most cities via our courier partners; remote areas may take longer.</li>
        <li>Delivery fee is a flat <strong>Rs 250</strong>, <strong>free on orders over Rs 5,000</strong>.</li>
        <li>Please provide a complete address and a reachable phone number. After 2 failed delivery attempts the parcel is returned to us; re-dispatch may carry a fresh delivery fee.</li>
        <li>Delivery times are estimates, not guarantees — floods, strikes and other events beyond our control can cause delays.</li>
      </ul>
    ),
  },
  {
    h: '4. Exchange & returns',
    body: (
      <ul>
        <li><strong>7-day easy exchange</strong> on unused items with tags attached and original packaging.</li>
        <li>Damaged, defective or wrong items reported within <strong>48 hours</strong> of delivery qualify for a free replacement or a full refund.</li>
        <li>To start an exchange, message us on WhatsApp at <strong>+92 316 2852167</strong> with your order ID and a photo of the item.</li>
        <li>Refunds are issued to the original payment method (or bank transfer where COD was used) within 7 working days of us receiving the returned item.</li>
      </ul>
    ),
  },
  {
    h: '5. Product images & descriptions',
    body: (
      <p>
        We photograph every bag as honestly as we can, but colours may vary slightly between
        screens, and handmade items can differ a little from photos. If a bag is not what you
        expected, our 7-day exchange has you covered. Product availability shown on the site is
        indicative — the confirmed stock is what our team confirms on WhatsApp.
      </p>
    ),
  },
  {
    h: '6. Accounts',
    body: (
      <ul>
        <li>You must provide a valid email address and keep your password secret.</li>
        <li>You are responsible for activity under your account — tell us immediately if you suspect misuse.</li>
        <li>One account per person for order history; we may close accounts used for fraud or abuse.</li>
        <li>You may delete your account any time — see our <a href="/privacy">Privacy Policy</a>.</li>
      </ul>
    ),
  },
  {
    h: '7. Coupons & promotions',
    body: (
      <ul>
        <li>Coupon codes are subject to their stated terms (minimum order, expiry, one use per customer).</li>
        <li>We may withdraw or correct a coupon issued in error.</li>
        <li>Coupons cannot be exchanged for cash.</li>
      </ul>
    ),
  },
  {
    h: '8. Intellectual property',
    body: (
      <p>
        Everything on this site — the AMMIGE name, logo, photos, videos and text — belongs to us
        or our partners. You may browse and share links to our products, but you may not copy,
        reproduce or use our content commercially without written permission.
      </p>
    ),
  },
  {
    h: '9. Fair use',
    body: (
      <p>
        Please do not misuse this website — no automated scraping, no fake or bulk test orders,
        no attempts to disrupt the store or other customers&apos; shopping. We may block access
        that harms the store or its customers.
      </p>
    ),
  },
  {
    h: '10. Limitation of liability',
    body: (
      <p>
        To the maximum extent allowed by law, our liability for any order is limited to the amount
        you paid for that order. We are not liable for indirect losses (such as a gift arriving
        late) beyond the remedies in our exchange policy.
      </p>
    ),
  },
  {
    h: '11. Governing law & disputes',
    body: (
      <p>
        These terms are governed by the laws of <strong>Pakistan</strong>. If we cannot resolve a
        disagreement by talking (WhatsApp us first — we genuinely try), the courts of Karachi,
        Pakistan will have jurisdiction.
      </p>
    ),
  },
  {
    h: '12. Changes to these terms',
    body: (
      <p>
        We may update these terms as the business grows. The version on this page always applies
        to new orders. Material changes will be highlighted here with a new &quot;last
        updated&quot; date.
      </p>
    ),
  },
  {
    h: '13. Contact',
    body: (
      <p>
        Questions about these terms? WhatsApp us at <strong>+92 316 2852167</strong> or use the{' '}
        <a href="/contact">contact page</a> — a human being will answer.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Reveal>
            <div className="eyebrow">Legal</div>
            <h1 className="display">Terms of Service</h1>
            <p>Last updated: October 2026. The rules we both play by.</p>
          </Reveal>
        </div>
      </section>

      <div className="policy">
        {SECTIONS.map((s) => (
          <Reveal key={s.h}>
            <h2>{s.h}</h2>
            {s.body}
          </Reveal>
        ))}
      </div>
    </>
  );
}
