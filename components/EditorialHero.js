'use client';

import Link from 'next/link';
import Reveal from './Reveal';
import SmartImage from './SmartImage';

/**
 * Editorial split hero — light, product-first, magazine style.
 * Replaces the dark "cinematic" hero: no particles, no stock-model
 * full-bleed. The bag is the star, framed like a fashion editorial.
 */
export default function EditorialHero() {
  return (
    <section className="hero-ed">
      <div className="wrap hero-ed-grid">
        <div className="hero-ed-copy">
          <Reveal>
            <div className="eyebrow">New drop · Everyday Collection</div>
          </Reveal>
          <Reveal delay="rv-d1">
            <h1 className="display hero-ed-title">
              The tote that
              <br />
              carries <span className="hero-ed-accent">your whole day.</span>
            </h1>
          </Reveal>
          <Reveal delay="rv-d2">
            <p className="hero-ed-lead">
              Made in Pakistan, finished with solid brass, and packed like a
              gift — because it is one. Cash on delivery, anywhere in the country.
            </p>
          </Reveal>
          <Reveal delay="rv-d3">
            <div className="hero-ed-meta">
              <span className="hero-ed-price">From <b>Rs 4,990</b></span>
              <span className="hero-ed-rating" aria-label="Rated 4.9 out of 5">
                <span className="stars" aria-hidden="true">★★★★★</span> 4.9 · 2,300+ reviews
              </span>
            </div>
            <div className="hero-cta">
              <Link className="btn btn-gold" href="/shop">
                Shop Bestsellers
              </Link>
              <Link className="btn btn-outline" href="#collections">
                Explore Collections
              </Link>
            </div>
            <ul className="hero-ed-trust">
              <li>Cash on Delivery</li>
              <li>Free delivery over Rs 5,000</li>
              <li>7-day easy exchange</li>
            </ul>
          </Reveal>
        </div>

        <div className="hero-ed-visual">
          <Reveal delay="rv-d1">
            <div className="hero-ed-frame">
              <SmartImage
                src="/images/product-medium.jpg"
                alt="AMMIGE Everyday tote handbag"
                fill
                priority
                sizes="(max-width: 960px) 88vw, 420px"
              />
              <div className="hero-ed-badge hero-ed-badge-top">
                <b>4.9 ★</b>
                <span>2,300+ happy customers</span>
              </div>
              <div className="hero-ed-badge hero-ed-badge-bottom">
                <b>COD</b>
                <span>Cash on Delivery nationwide</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
