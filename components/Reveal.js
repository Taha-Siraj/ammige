'use client';

import { useEffect } from 'react';

/** Wraps children in a scroll-reveal animation. */
export default function Reveal({ children, className = '', delay = '' }) {
  useEffect(() => {
    const els = document.querySelectorAll('.rv:not(.in)');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return <div className={`rv ${delay} ${className}`}>{children}</div>;
}
