'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Reveal from './Reveal';

// Three.js gold-dust particles — client-only, code-split, never SSR'd.
const HeroParticles = dynamic(() => import('./HeroParticles'), { ssr: false });

/**
 * Full-viewport cinematic hero: slow Ken Burns drift on the still,
 * layered gradient overlays, gentle parallax on scroll,
 * Three.js gold-dust particles + mouse parallax on the headline.
 */
export default function CinematicHero() {
  const bgRef = useRef(null);
  const contentRef = useRef(null);

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

  // Subtle mouse parallax on the headline block (desktop, fine pointer only).
  useEffect(() => {
    const el = contentRef.current;
    if (!el || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const st = { x: 0, y: 0, tx: 0, ty: 0, raf: 0, running: false };
    const loop = () => {
      st.x += (st.tx - st.x) * 0.06;
      st.y += (st.ty - st.y) * 0.06;
      el.style.transform = `translate3d(${st.x.toFixed(1)}px, ${st.y.toFixed(1)}px, 0)`;
      if (Math.abs(st.tx - st.x) > 0.05 || Math.abs(st.ty - st.y) > 0.05) {
        st.raf = requestAnimationFrame(loop);
      } else {
        st.running = false;
      }
    };
    const onMove = (e) => {
      st.tx = (0.5 - e.clientX / window.innerWidth) * 20;
      st.ty = (0.5 - e.clientY / window.innerHeight) * 14;
      if (!st.running) {
        st.running = true;
        st.raf = requestAnimationFrame(loop);
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(st.raf);
      el.style.transform = '';
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
      <HeroParticles />

      <div className="wrap hero-cine-content" ref={contentRef}>
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
