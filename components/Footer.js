import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link href="/" className="logo">AMMI<em style={{ color: 'var(--gold)' }}>GE</em></Link>
            <p>Premium women's handbags, crafted with love in Pakistan. Carry grace everywhere.</p>
          </div>
          <div className="foot-col">
            <h4>Shop</h4>
            <Link href="/shop?collection=everyday">Everyday Collection</Link>
            <Link href="/shop?collection=signature">Signature Collection</Link>
            <Link href="/shop?collection=leather">Leather Collection</Link>
            <Link href="/shop">All Products</Link>
          </div>
          <div className="foot-col">
            <h4>Help</h4>
            <Link href="/track">Track Your Order</Link>
            <Link href="/checkout">Checkout</Link>
          </div>
          <div className="foot-col">
            <h4>Brand</h4>
            <a href="https://instagram.com/ammige012" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://tiktok.com/@ammige012" target="_blank" rel="noopener noreferrer">TikTok</a>
            <a href="https://facebook.com/ammige012" target="_blank" rel="noopener noreferrer">Facebook</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} AMMIGE. All rights reserved.</span>
          <span>Cash on Delivery · Nationwide Shipping</span>
        </div>
      </div>
    </footer>
  );
}
