import Link from 'next/link';
import NewsletterForm from './NewsletterForm';

const SOCIALS = [
  {
    name: 'Instagram',
    href: 'https://instagram.com/ammige012',
    icon: <><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1.1" fill="#fff" stroke="none" /></>,
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com/@ammige012',
    icon: <path d="M14.5 4v9.8a3.9 3.9 0 1 1-3.1-3.8M14.5 4c.4 2.3 1.9 3.8 4.2 4" />,
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com/ammige012',
    icon: <path d="M14 8.5V7c0-.8.2-1.5 1.6-1.5H17V2.5h-2.6C11.7 2.5 11 4.3 11 6.7v1.8H8.5V12H11v9.5h3V12h2.4l.6-3.5H14z" />,
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        {/* newsletter band */}
        <div className="foot-news">
          <div>
            <h3>Join the Ammige Circle</h3>
            <p>New drops, private previews and members-only prices — straight to your inbox.</p>
          </div>
          <NewsletterForm />
        </div>

        <div className="foot-grid">
          <div className="foot-brand">
            <Link href="/" className="logo">AMMI<em style={{ color: 'var(--gold)' }}>GE</em></Link>
            <p>Premium women&apos;s handbags, handcrafted in Pakistan. Cash on delivery nationwide, wrapped like a gift.</p>
            <div className="socials">
              {SOCIALS.map((s) => (
                <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                </a>
              ))}
            </div>
          </div>
          <div className="foot-col">
            <h4>Shop</h4>
            <Link href="/shop?collection=everyday">Everyday Collection</Link>
            <Link href="/shop?collection=signature">Signature Collection</Link>
            <Link href="/shop?collection=leather">Leather Collection</Link>
            <Link href="/shop">All Products</Link>
          </div>
          <div className="foot-col">
            <h4>Company</h4>
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact Us</Link>
            <Link href="/faq">FAQs</Link>
            <Link href="/track">Track Your Order</Link>
          </div>
          <div className="foot-col">
            <h4>Customer Care</h4>
            <Link href="/shipping">Shipping &amp; Exchange</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/checkout">Checkout</Link>
          </div>
        </div>

        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} AMMIGE. All rights reserved.</span>
          <span>Cash on Delivery · Nationwide Shipping · @ammige012</span>
        </div>
      </div>
    </footer>
  );
}
