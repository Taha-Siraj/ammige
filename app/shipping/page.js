import Link from 'next/link';
import Reveal from '@/components/Reveal';

export const metadata = {
  title: 'Shipping & Exchange — AMMIGE',
  description: 'AMMIGE shipping across Pakistan: COD nationwide, TCS/Leopards delivery in 2–4 working days, and a 7-day easy exchange policy.',
};

export default function ShippingPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Reveal>
            <div className="eyebrow">Good to know</div>
            <h1 className="display">Shipping &amp; Exchange</h1>
            <p>How your order reaches you — and what happens if you change your mind.</p>
          </Reveal>
        </div>
      </section>

      <div className="policy">
        <Reveal>
          <h2>Delivery across Pakistan</h2>
          <p className="lead">We deliver to every city and town in Pakistan via trusted couriers.</p>
          <ul>
            <li><strong>Courier partners:</strong> TCS and Leopards Courier — whichever reaches you fastest.</li>
            <li><strong>Delivery time:</strong> 2–4 working days for most cities; remote areas can take 5–7 working days.</li>
            <li><strong>Delivery fee:</strong> Flat Rs 250 nationwide — <strong>free</strong> on all orders over Rs 5,000.</li>
            <li><strong>Cash on Delivery:</strong> Pay in cash when your order arrives. Please keep the exact amount ready if you can.</li>
          </ul>
        </Reveal>
        <Reveal>
          <h2>How shipping works</h2>
          <ul>
            <li>Orders placed before 3pm are usually dispatched the <strong>same working day</strong>.</li>
            <li>You will receive an SMS from the courier with a tracking number once your parcel is picked up.</li>
            <li>You can also follow your order right here: <Link href="/track">Track Your Order</Link>.</li>
            <li>If the courier cannot reach you after 2 attempts, the parcel returns to us — message us on <Link href="/contact">WhatsApp</Link> and we will resend it.</li>
          </ul>
        </Reveal>
        <Reveal>
          <h2>7-day easy exchange</h2>
          <p className="lead">Changed your mind? No stress — exchange it within 7 days of delivery.</p>
          <ul>
            <li>The bag must be <strong>unused</strong>, with tags attached and original packaging.</li>
            <li>Message us on <Link href="/contact">WhatsApp</Link> with your order ID and a photo of the bag.</li>
            <li>We will arrange a replacement in your preferred colour or style (subject to availability).</li>
            <li>Return courier charges are paid by the customer, except when the item arrived <strong>damaged or wrong</strong> — then we cover everything and make it right immediately.</li>
          </ul>
        </Reveal>
        <Reveal>
          <h2>Damaged or wrong item?</h2>
          <p>
            If your order arrives damaged, defective, or simply not what you ordered, tell us within
            48 hours with photos. We will ship a free replacement or refund you in full — your choice.
          </p>
        </Reveal>
      </div>
    </>
  );
}
