import Reveal from '@/components/Reveal';

export const metadata = {
  title: 'Terms of Service — AMMIGE',
  description: 'The terms that govern shopping with AMMIGE: orders, payment, delivery, exchanges and fair use.',
};

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
        <Reveal>
          <h2>Orders &amp; payment</h2>
          <ul>
            <li>All prices are in Pakistani Rupees (PKR) and include all applicable taxes.</li>
            <li>Payment is <strong>Cash on Delivery</strong> — you pay the courier when your order arrives.</li>
            <li>We reserve the right to cancel an order (for example, if an item is out of stock) and will inform you promptly on WhatsApp or by phone.</li>
          </ul>
        </Reveal>
        <Reveal>
          <h2>Delivery</h2>
          <ul>
            <li>Delivery takes 2–4 working days in most cities via TCS or Leopards Courier; remote areas may take longer.</li>
            <li>Delivery fee is a flat Rs 250, free on orders over Rs 5,000.</li>
            <li>Please provide a complete address and a reachable phone number — failed deliveries after 2 attempts are returned to us.</li>
          </ul>
        </Reveal>
        <Reveal>
          <h2>Exchange policy</h2>
          <ul>
            <li>7-day easy exchange on unused items with tags attached and original packaging.</li>
            <li>Damaged, defective or wrong items reported within 48 hours qualify for a free replacement or full refund.</li>
            <li>To start an exchange, message us on WhatsApp with your order ID.</li>
          </ul>
        </Reveal>
        <Reveal>
          <h2>Product images</h2>
          <p>
            We photograph every bag as honestly as we can, but colours may vary slightly between
            screens. If a bag is not what you expected, our 7-day exchange has you covered.
          </p>
        </Reveal>
        <Reveal>
          <h2>Fair use</h2>
          <p>
            Please do not misuse this website — no automated scraping, no fake orders, no
            interference with other customers&apos; shopping. We may block access that harms the store
            or its customers.
          </p>
        </Reveal>
        <Reveal>
          <h2>Contact</h2>
          <p>
            Questions about these terms? WhatsApp us at <strong>+92 316 2852167</strong> — a human
            being will answer.
          </p>
        </Reveal>
      </div>
    </>
  );
}
