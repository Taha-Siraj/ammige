'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCart, fmtPKR } from './CartProvider';
import { COLOR_HEX } from './colorHex';
import ProductCard from './ProductCard';
import SmartImage from './SmartImage';

// 3D viewer — client-only, code-split, never SSR'd (three.js lazy chunk).
const Product3DViewer = dynamic(() => import('./Product3DViewer'), { ssr: false });
const Spin360Viewer = dynamic(() => import('./Spin360Viewer'), { ssr: false });

function measurements(name) {
  const n = (name || '').toLowerCase();
  if (/mini/.test(n)) return '22 × 16 × 9 cm';
  if (/\blarge\b/.test(n)) return '34 × 28 × 13 cm';
  if (/tote/.test(n)) return '32 × 27 × 13 cm';
  if (/crossbody|clutch|minaudiere|flap/.test(n)) return '24 × 15 × 7 cm';
  if (/hobo|bucket|satchel|doctor/.test(n)) return '30 × 24 × 12 cm';
  return '28 × 20 × 10 cm';
}

function strapInfo(name) {
  const n = (name || '').toLowerCase();
  if (/crossbody/.test(n)) return 'Adjustable crossbody strap (drop ~58 cm) + top handles';
  if (/tote|shopper/.test(n)) return 'Twin top handles (drop ~26 cm)';
  if (/clutch|minaudiere/.test(n)) return 'Detachable chain strap (drop ~55 cm)';
  if (/hobo|shoulder/.test(n)) return 'Single shoulder strap (drop ~30 cm)';
  return 'Top handles + detachable shoulder strap';
}

function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="accordion">
      {items.map((it, i) => (
        <div key={it.title} className={`acc-item ${open === i ? 'open' : ''}`}>
          <button className="acc-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            {it.title}
            <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <div className="acc-a"><div className="acc-a-inner"><div className="acc-body">{it.body}</div></div></div>
        </div>
      ))}
    </div>
  );
}

export default function ProductDetail({ p, related }) {
  const router = useRouter();
  const { add, toggleWish, isWished } = useCart();
  const [qty, setQtyLocal] = useState(1);
  const [color, setColor] = useState(p.colors?.[0] || null);
  const [size, setSize] = useState(p.sizes?.[0] || null); // auto-select (matches color behavior)
  const [sizeHint, setSizeHint] = useState(false);
  const [viewImg, setViewImg] = useState(null); // explicit thumbnail override
  const [added, setAdded] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [viewer3d, setViewer3d] = useState(false);
  const [viewer360, setViewer360] = useState(false);
  const hasSpin = (p.spin_frames?.length || 0) >= 2;
  const [copied, setCopied] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const ctaRef = useRef(null);
  const wished = isWished(p.id);

  const discount = p.old_price ? Math.round((1 - p.price / p.old_price) * 100) : 0;
  const inst = Math.round(p.price / 3);
  const variantImg = (color && p.variant_images && p.variant_images[color]) || null;
  const mainImg = viewImg || variantImg || p.image;
  const img2 = p.image2 && p.image2 !== p.image ? p.image2 : null;
  const thumbs = [];
  for (const t of [variantImg || p.image, img2]) {
    if (t && !thumbs.includes(t)) thumbs.push(t);
  }

  const pickColor = (c) => {
    setColor(c);
    setViewImg(null); // follow the color's photo
  };

  const needSize = (p.sizes?.length || 0) > 0;

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && window.scrollY > 400), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(false); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [lightbox]);

  const handleAdd = () => {
    if (needSize && !size) {
      setSizeHint(true);
      return;
    }
    add(p.id, qty, color, size);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const handleBuyNow = () => {
    if (needSize && !size) {
      setSizeHint(true);
      return;
    }
    add(p.id, qty, color, size);
    router.push('/checkout');
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  };

  const alt = `${p.name} — ${p.material || 'premium'} handbag in ${p.colors?.[0] || 'assorted colours'}, AMMIGE Pakistan`;

  return (
    <div className="wrap">
      <nav aria-label="Breadcrumb" style={{ paddingTop: 28, fontSize: 13, color: 'var(--muted)' }}>
        <Link href="/">Home</Link> &nbsp;/&nbsp; <Link href="/shop">Shop</Link> &nbsp;/&nbsp;{' '}
        <Link href={`/shop?collection=${p.collection}`} style={{ textTransform: 'capitalize' }}>{p.collection}</Link>
        &nbsp;/&nbsp; <span className="ow-anywhere" aria-current="page">{p.name}</span>
      </nav>

      <div className="pd-grid">
        <div className="pd-gallery">
          <div className="pd-main" onClick={() => setLightbox(true)} role="button" tabIndex={0}
               aria-label="View larger image" onKeyDown={(e) => e.key === 'Enter' && setLightbox(true)}>
            <SmartImage key={mainImg} src={mainImg} alt={alt} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="pd-swap" />
            {/* Smart recolor: no real photo for this color yet -> tint the bag to the selected color */}
            {!variantImg && color && COLOR_HEX[color] && (
              <div aria-hidden="true" style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: COLOR_HEX[color], mixBlendMode: 'color', opacity: 0.92,
              }} />
            )}
            <button
              className="pd-3dbtn"
              onClick={(e) => { e.stopPropagation(); setViewer3d(true); }}
              onKeyDown={(e) => e.stopPropagation()}
              aria-label="Open 3D view"
            >
              <svg viewBox="0 0 24 24"><path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" /><path d="M3 7l9 5 9-5" /><path d="M12 12v10" /></svg>
              3D View
            </button>
            {hasSpin && (
              <button
                className="pd-3dbtn spin360-attn"
                style={{ top: 64, bottom: 'auto' }}
                onClick={(e) => { e.stopPropagation(); setViewer360(true); }}
                onKeyDown={(e) => e.stopPropagation()}
                aria-label="Open 360 degree view"
              >
                <svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" /></svg>
                360°
              </button>
            )}
          </div>
          {thumbs.length > 1 && (
            <div className="pd-thumbs">
              {thumbs.map((g, i) => (
                <button key={g} className={`pd-thumb ${g === mainImg ? 'on' : ''}`} onClick={() => setViewImg(g)} aria-label={`View image ${i + 1}`}>
                  <SmartImage src={g} alt="" fill />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pd-info min-w-0">
          <div className="eyebrow">{p.sku} · <span style={{ textTransform: 'capitalize' }}>{p.collection}</span> Collection</div>
          <h1 className="display">{p.name}</h1>
          <div className="stars" style={{ marginTop: 10 }} aria-label={`Rated ${p.rating} out of 5 from ${p.reviews} reviews`}>
            {'★'.repeat(Math.round(p.rating || 0))}
            <small> {p.rating} · {p.reviews} reviews</small>
          </div>
          <div className="pd-price">
            <b>{fmtPKR(p.price)}</b>
            {p.old_price && <s>{fmtPKR(p.old_price)}</s>}
            {discount > 0 && <span className="save">Save {discount}%</span>}
          </div>
          <div className="install-line">
            <svg viewBox="0 0 24 24" width="18" height="18" style={{ stroke: 'var(--gold-deep)', fill: 'none', strokeWidth: 1.8, flexShrink: 0 }}>
              <rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" />
            </svg>
            <span>or <b>3 × {fmtPKR(inst)}</b> easy monthly installments — no credit card needed</span>
          </div>
          <p className="pd-desc">{p.description}</p>

          {p.colors?.length > 0 && (
            <>
              <div style={{ fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Colour — <b style={{ color: 'var(--espresso)' }}>{color}</b>
              </div>
              <div className="swatches">
                {p.colors.map((c) => (
                  <button
                    key={c}
                    className={`swatch ${color === c ? 'on' : ''}`}
                    title={c}
                    aria-label={`Select colour ${c}`}
                    aria-pressed={color === c}
                    style={{ background: COLOR_HEX[c] || '#ccc' }}
                    onClick={() => pickColor(c)}
                  />
                ))}
              </div>
            </>
          )}

          {needSize && (
            <>
              <div style={{ fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 18 }}>
                Size {size ? <b style={{ color: 'var(--espresso)' }}>— {size}</b> : null}
              </div>
              <div className="size-pills" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                {p.sizes.map((s) => (
                  <button
                    key={s}
                    className={`size-pill ${size === s ? 'on' : ''}`}
                    aria-pressed={size === s}
                    onClick={() => { setSize(s); setSizeHint(false); }}
                    style={{
                      padding: '10px 20px', borderRadius: 999,
                      border: size === s ? '1.5px solid var(--gold-deep)' : '1px solid var(--line)',
                      background: size === s ? 'var(--champagne)' : '#fff',
                      fontWeight: size === s ? 600 : 400, fontSize: 14,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {sizeHint && !size && (
                <p style={{ color: '#B3402E', fontSize: 13, marginTop: 8 }}>Please select a size first.</p>
              )}
            </>
          )}

          <div className="qty-row" ref={ctaRef}>
            <div className="qty">
              <button onClick={() => setQtyLocal(Math.max(1, qty - 1))} aria-label="Decrease quantity">−</button>
              <b>{qty}</b>
              <button onClick={() => setQtyLocal(Math.min(p.stock, qty + 1))} aria-label="Increase quantity">+</button>
            </div>
            <button className="btn btn-gold" style={{ flex: 1, minWidth: 0 }} onClick={handleAdd} disabled={p.stock === 0}>
              {p.stock === 0 ? 'Out of Stock' : added ? 'Added ✓' : 'Add to Bag'}
            </button>
          </div>
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={handleBuyNow} disabled={p.stock === 0}>
            Buy Now
          </button>
          <div className="pd-wish-row">
            <button className={`wish-btn ${wished ? 'on' : ''}`} onClick={() => toggleWish(p.id)} aria-pressed={wished}>
              <svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 5 6.8 5c2 0 3.7 1.1 5.2 3 1.5-1.9 3.2-3 5.2-3 3.2 0 5.3 3 4.1 6.3-1.8 4.6-9.3 9.2-9.3 9.2z" /></svg>
              {wished ? 'Saved to Wishlist' : 'Add to Wishlist'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 24, fontSize: 13.5, color: 'var(--muted)' }}>
            <span>✓ Cash on Delivery</span>
            <span>✓ 7-day Exchange</span>
            <span>{p.stock > 0 ? `✓ In Stock (${p.stock} left)` : '✗ Out of Stock'}</span>
          </div>

          <Accordion items={[
            {
              title: 'Details & Materials',
              body: (
                <>
                  <ul>
                    <li><b>Material:</b> {p.material || 'Premium crafted'}</li>
                    <li><b>Approx. dimensions (L × H × W):</b> {measurements(p.name)}</li>
                    <li><b>Strap:</b> {strapInfo(p.name)}</li>
                    <li><b>Closure:</b> Secure zip + magnetic flap</li>
                    <li><b>Interior:</b> Cotton lining, zip pocket & slip pockets</li>
                    <li><b>SKU:</b> {p.sku}</li>
                  </ul>
                  <p style={{ marginTop: 8 }}>Wipe clean with a soft dry cloth. Store in the dust bag provided — away from direct sunlight and moisture.</p>
                </>
              ),
            },
            {
              title: 'Shipping & Exchange',
              body: (
                <ul>
                  <li>Dispatched within 24 hours from Karachi via TCS / Leopards Courier.</li>
                  <li>Delivery in 2–4 working days (5–7 for remote areas). Flat Rs 250 — <b>free over Rs 5,000</b>.</li>
                  <li>7-day easy exchange on unused pieces with tags attached — WhatsApp us your order ID.</li>
                  <li>Damaged or wrong item? We cover courier both ways + free replacement or refund.</li>
                </ul>
              ),
            },
          ]} />

          <div className="share-row">
            <span>Share:</span>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Look at this ${p.name} from AMMIGE: ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">
              <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" /></svg>
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
              <svg viewBox="0 0 24 24"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.7-1.6h1.5V4.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.7H7.8V14h2.7v8h3z" /></svg>
            </a>
            <button onClick={copyLink} aria-label="Copy product link">
              <svg viewBox="0 0 24 24" style={{ fill: 'none', stroke: 'var(--espresso)', strokeWidth: 1.8 }}>
                <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
              </svg>
            </button>
            {copied && <span style={{ color: '#1E7A46' }}>Link copied ✓</span>}
          </div>
        </div>
      </div>

      <div className={`sticky-atc ${showSticky ? 'show' : ''}`} aria-hidden={!showSticky}>
        <img src={p.image} alt="" />
        <div className="sa-info">
          <b>{p.name}</b>
          <span>{fmtPKR(p.price)}</span>
        </div>
        <button className="btn btn-gold" onClick={handleAdd} disabled={p.stock === 0}>
          {added ? 'Added ✓' : 'Add to Bag'}
        </button>
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(false)} role="dialog" aria-modal="true" aria-label="Product image enlarged">
          <button className="icon-btn" aria-label="Close" style={{ background: 'rgba(255,255,255,.12)' }}>
            <svg viewBox="0 0 24 24" style={{ stroke: '#fff' }}><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <img src={mainImg} alt={alt} />
            {!variantImg && color && COLOR_HEX[color] && (
              <div aria-hidden="true" style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: COLOR_HEX[color], mixBlendMode: 'color', opacity: 0.92,
              }} />
            )}
          </div>
        </div>
      )}

      {viewer3d && (
        <Product3DViewer image={mainImg} alt={alt} onClose={() => setViewer3d(false)} />
      )}
      {viewer360 && hasSpin && (
        <Spin360Viewer
          frames={p.spin_frames}
          alt={alt}
          onClose={() => setViewer360(false)}
          tint={!variantImg && color && COLOR_HEX[color] ? COLOR_HEX[color] : null}
          tintName={!variantImg && color ? color : null}
        />
      )}

      {related?.length > 0 && (
        <section className="block" style={{ paddingTop: 0 }} aria-label="Related products">
          <div className="sec-head">
            <div className="eyebrow">You may also love</div>
            <h2 className="display">Complete the look</h2>
          </div>
          <div className="prod-grid">
            {related.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
