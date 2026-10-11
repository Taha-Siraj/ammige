import Reveal from '@/components/Reveal';

export const metadata = {
  title: 'Privacy Policy — AMMIGE',
  description: 'How AMMIGE collects, uses and protects your personal information when you shop with us.',
};

export default function PrivacyPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Reveal>
            <div className="eyebrow">Legal</div>
            <h1 className="display">Privacy Policy</h1>
            <p>Last updated: October 2026. Plain words, no fine-print tricks.</p>
          </Reveal>
        </div>
      </section>

      <div className="policy">
        <Reveal>
          <h2>What we collect</h2>
          <p>When you place an order, we collect only what we need to deliver it:</p>
          <ul>
            <li><strong>Contact details:</strong> your name, phone number and delivery address.</li>
            <li><strong>Order details:</strong> the items you bought, the total, and your payment choice.</li>
            <li><strong>Messages:</strong> anything you send us on WhatsApp or through our contact form.</li>
          </ul>
          <p>We do not collect bank or card details — all orders are Cash on Delivery.</p>
        </Reveal>
        <Reveal>
          <h2>How we use it</h2>
          <ul>
            <li>To process, pack and deliver your order via our courier partners (TCS, Leopards).</li>
            <li>To contact you about your order — confirmation, dispatch and delivery updates.</li>
            <li>To improve our products and service, using anonymised summaries.</li>
            <li>To send you new-drop updates <strong>only if you subscribed</strong> to our newsletter.</li>
          </ul>
        </Reveal>
        <Reveal>
          <h2>Who we share it with</h2>
          <p>
            Only our delivery couriers (so they can reach your doorstep) and only the details they
            need. We never sell your information, and we never share it for marketing by third parties.
          </p>
        </Reveal>
        <Reveal>
          <h2>Your rights</h2>
          <p>
            You can ask us at any time what information we hold about you, ask us to correct it, or
            ask us to delete it. Message us on WhatsApp at <strong>+92 316 2852167</strong> and we
            will take care of it.
          </p>
        </Reveal>
        <Reveal>
          <h2>Cookies</h2>
          <p>
            We use a small, essential cookie to keep you signed in to the admin panel and to remember
            your shopping bag. Nothing for advertising, nothing sold to anyone.
          </p>
        </Reveal>
      </div>
    </>
  );
}
