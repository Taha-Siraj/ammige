import Reveal from '@/components/Reveal';

export const metadata = {
  title: 'Privacy Policy — AMMIGE',
  description: 'How AMMIGE collects, uses and protects your personal information when you shop with us. Plain words, no fine-print tricks.',
};

const SECTIONS = [
  {
    h: '1. What we collect',
    body: (
      <>
        <p>When you shop with AMMIGE, we collect only what we need to run the store:</p>
        <ul>
          <li><strong>Order details:</strong> your name, phone number, delivery address, the items you bought, the total, and your payment choice.</li>
          <li><strong>Account details (if you sign up):</strong> your name, email address and a securely hashed password. We never see or store your plain password.</li>
          <li><strong>Newsletter:</strong> your email address, only if you subscribe.</li>
          <li><strong>Messages:</strong> anything you send us on WhatsApp or through our contact form.</li>
          <li><strong>Technical data:</strong> basic, anonymised browsing info (pages visited, device type) that helps us keep the site fast and working.</li>
        </ul>
        <p>We do <strong>not</strong> collect bank or card details — all orders are Cash on Delivery.</p>
      </>
    ),
  },
  {
    h: '2. How we use it',
    body: (
      <ul>
        <li>To process, pack and deliver your order through our courier partners.</li>
        <li>To contact you about your order — confirmation, dispatch and delivery updates.</li>
        <li>To manage your account (order history, saved details) if you created one.</li>
        <li>To send new-drop updates <strong>only if you subscribed</strong> to our newsletter — unsubscribe any time with one click.</li>
        <li>To improve our products and service, using anonymised summaries — never your personal details.</li>
      </ul>
    ),
  },
  {
    h: '3. Who we share it with',
    body: (
      <p>
        Only our delivery couriers (such as TCS and Leopards), and only the details they need to
        reach your doorstep — your name, phone number and address. We <strong>never</strong> sell
        your information, and we never share it for marketing by third parties.
      </p>
    ),
  },
  {
    h: '4. Cookies',
    body: (
      <>
        <p>We use a small number of essential cookies:</p>
        <ul>
          <li><strong>Shopping bag:</strong> remembers what you added to your bag.</li>
          <li><strong>Sign-in session:</strong> keeps you logged in to your account or the admin panel.</li>
          <li><strong>Preferences:</strong> things like your chosen currency display.</li>
        </ul>
        <p>We do not use advertising trackers and we do not sell browsing data to anyone.</p>
      </>
    ),
  },
  {
    h: '5. How we protect your data',
    body: (
      <ul>
        <li>Passwords are stored as one-way secure hashes — even we cannot read them.</li>
        <li>Admin access is password-protected and rate-limited against guessing.</li>
        <li>Order and customer data is only accessible to our small operations team.</li>
      </ul>
    ),
  },
  {
    h: '6. How long we keep it',
    body: (
      <p>
        Order records are kept for 3 years for accounting and warranty purposes, then deleted.
        Newsletter emails are kept until you unsubscribe. You can ask us to delete your account
        and personal data at any time (see your rights below).
      </p>
    ),
  },
  {
    h: '7. Your rights',
    body: (
      <>
        <p>At any time, you can:</p>
        <ul>
          <li>Ask what personal information we hold about you.</li>
          <li>Ask us to correct anything that is wrong.</li>
          <li>Ask us to delete your account and personal data.</li>
          <li>Unsubscribe from the newsletter instantly.</li>
        </ul>
        <p>
          Message us on WhatsApp at <strong>+92 316 2852167</strong> or email us through the{' '}
          <a href="/contact">contact page</a> — a human being will take care of it, usually within
          2 working days.
        </p>
      </>
    ),
  },
  {
    h: "8. Children's privacy",
    body: (
      <p>
        AMMIGE is a store for adults. We do not knowingly collect information from children under
        13. If you believe a child has shared personal data with us, contact us and we will
        delete it promptly.
      </p>
    ),
  },
  {
    h: '9. Changes to this policy',
    body: (
      <p>
        If we change this policy in a meaningful way, we will post the new version here with an
        updated date and, where appropriate, notify newsletter subscribers. Continued use of the
        site after changes means you accept the updated policy.
      </p>
    ),
  },
  {
    h: '10. Contact & governing law',
    body: (
      <p>
        AMMIGE is a Pakistani business. This policy is governed by the laws of Pakistan. Questions
        about your privacy? WhatsApp us at <strong>+92 316 2852167</strong> — a human being will
        answer.
      </p>
    ),
  },
];

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
