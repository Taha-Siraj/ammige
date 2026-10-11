'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Branded preloader (first visit only, max ~1.4s, never traps)
 * + slim gold top progress bar on internal route transitions.
 */
export default function Preloader() {
  const [show, setShow] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [bar, setBar] = useState(false);
  const pathname = usePathname();
  const timers = useRef([]);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem('ammige_seen') === '1';
    } catch {
      seen = false;
    }
    if (seen) {
      setShow(false);
    } else {
      timers.current.push(setTimeout(() => setLeaving(true), 1000));
      timers.current.push(
        setTimeout(() => {
          setShow(false);
          try {
            sessionStorage.setItem('ammige_seen', '1');
          } catch {
            /* ignore */
          }
        }, 1450)
      );
    }
    // Hard failsafe: never trap the user behind the loader.
    timers.current.push(setTimeout(() => setShow(false), 2600));
    return () => timers.current.forEach(clearTimeout);
  }, []);

  // Slim gold progress bar on internal navigation.
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('/#') &&
        a.target !== '_blank' &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        setBar(true);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Hide the bar once the route actually changes (or after a timeout).
  useEffect(() => {
    setBar(false);
  }, [pathname]);
  useEffect(() => {
    if (!bar) return;
    const t = setTimeout(() => setBar(false), 1800);
    return () => clearTimeout(t);
  }, [bar ]);

  return (
    <>
      {show && (
        <div className={`preloader ${leaving ? 'leaving' : ''}`} aria-hidden="true">
          <div className="preloader-word">
            {'AMMIGE'.split('').map((ch, i) => (
              <span key={i} style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
                {ch}
              </span>
            ))}
          </div>
          <div className="preloader-line">
            <span />
          </div>
          <div className="preloader-sub">Carry Grace Everywhere</div>
        </div>
      )}
      {bar && (
        <div className="route-progress" aria-hidden="true">
          <span />
        </div>
      )}
    </>
  );
}
