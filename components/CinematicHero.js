'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Reveal from './Reveal';

/**
 * Full-viewport cinematic hero: slow Ken Burns drift on the still,
 * layered gradient overlays, gentle parallax on scroll.
 */
export default function CinematicHero() {
  const bgRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, window.innerHeight * 1.2);
        if (bgRef.current) {
          bgRef.current.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
        }
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="hero-cine">
      <div className="hero-cine-bg" ref={bgRef} aria-hidden="true">
        <img
          src="/images/hero-model.jpg"
          alt=""
          fetchPriority="high"
        />
      </div>
      <div className="hero-cine-shade" aria-hidden="true" />
      <div className="hero-cine-vignette" aria-hidden="true" />

      <div className="wrap hero-cine-content">
        <Reveal>
          <div className="eyebrow eyebrow-light">Ammige · Handcrafted in Pakistan</div>
        </Reveal>
        <Reveal delay="rv-d1">
          <h1 className="display hero-cine-title">
            Carry <em>Grace</em>
            <br />
            Everywhere
          </h1>
        </Reveal>
        <Reveal delay="rv-d2">
          <p className="hero-cine-lead">
            Handbags shaped by Pakistani artisans and finished with solid
            brass — wrapped like a gift, because it is one.
          </p>
        </Reveal>
        <Reveal delay="rv-d3">
          <div className="hero-cta">
            <Link className="btn btn-gold" href="/shop">
              Shop the Collection
            </Link>
            <Link className="btn btn-ghostlight" href="#collections">
              Explore Collections
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="hero-cine-cue" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  );
}
