'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/**
 * Spin360Viewer v2 — buttery 360° product spin.
 * - Canvas rendering with crossfade between frames (no popping)
 * - Drag with momentum/inertia, gentle auto-rotate when idle
 * - Pinch-to-zoom + double-tap zoom + pan while zoomed (mobile friendly)
 * - Frame preloading with progress, GSAP open/close choreography
 */
export default function Spin360Viewer({ frames, alt, onClose, tint, tintName }) {
  const n = frames.length;
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [auto, setAuto] = useState(true);

  const S = useRef({
    imgs: [], pos: 0, vel: 0, dragging: false,
    lastX: 0, lastY: 0, lastT: 0, startX: 0, startPos: 0, moved: false,
    zoom: 1, panX: 0, panY: 0, pinch: null, touches: null,
    auto: true, idleTimer: 0, lastTap: 0, raf: 0,
  });

  const readyAll = loaded >= n && n > 0;

  // ---------- preload ----------
  useEffect(() => {
    let dead = false;
    setLoaded(0); setReady(false);
    const st = S.current;
    st.imgs = []; st.pos = 0; st.vel = 0; st.zoom = 1; st.panX = 0; st.panY = 0;
    let done = 0;
    frames.forEach((src, i) => {
      const im = new Image();
      im.onload = im.onerror = () => {
        if (dead) return;
        done += 1;
        setLoaded(done);
        if (done >= n) setReady(true);
      };
      im.src = src;
      st.imgs[i] = im;
    });
    return () => { dead = true; };
  }, [frames, n]);

  // ---------- canvas paint ----------
  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const st = S.current;
    if (!canvas || !st.imgs.length) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const pos = ((st.pos % n) + n) % n;
    const i0 = Math.floor(pos) % n;
    const i1 = (i0 + 1) % n;
    const f = pos - Math.floor(pos);

    const draw = (img, alpha) => {
      if (!img || !img.complete || !img.naturalWidth) return;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const s = Math.min(w / iw, h / ih) * st.zoom;
      const dw = iw * s, dh = ih * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (w - dw) / 2 + st.panX, (h - dh) / 2 + st.panY, dw, dh);
      ctx.globalAlpha = 1;
    };
    const speedBlend = Math.min(Math.abs(st.vel) * 14, 0.5) * Math.min(f * 5, 1);
    draw(st.imgs[i0], 1);
    if (speedBlend > 0.03) draw(st.imgs[i1], speedBlend);
    // Color-aware: tint every angle to the selected color, so the viewer
    // shows THAT color's product from all sides (matches the PDP tint).
    if (tint) {
      ctx.save();
      ctx.globalCompositeOperation = 'color';
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }, [n, tint]);

  // light UI ticker for dots + counter
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 140);
    return () => clearInterval(id);
  }, []);

  // ---------- motion loop ----------
  useEffect(() => {
    const st = S.current;
    let last = performance.now();
    const loop = (t) => {
      const dt = Math.min((t - last) / 1000, 0.05); last = t;
      if (readyAll && !st.dragging && !st.pinch) {
        if (Math.abs(st.vel) > 0.02) {
          st.pos += st.vel * dt * 60;
          st.vel *= Math.pow(0.05, dt);
        } else if (st.auto && st.zoom <= 1.02) {
          st.pos += dt * 4.5; // gentle turntable
        }
      }
      paint();
      st.raf = requestAnimationFrame(loop);
    };
    st.raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(st.raf);
  }, [paint, readyAll]);

  const pokeIdle = useCallback(() => {
    const st = S.current;
    st.auto = false; setAuto(false);
    clearTimeout(st.idleTimer);
    st.idleTimer = setTimeout(() => { st.auto = true; setAuto(true); }, 3500);
  }, []);

  // ---------- gestures ----------
  const onPointerDown = (e) => {
    const st = S.current;
    try { canvasRef.current?.setPointerCapture(e.pointerId); } catch {}
    if (!st.touches) st.touches = new Map();
    st.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (st.touches.size === 2) {
      const [a, b] = [...st.touches.values()];
      st.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), z0: st.zoom };
      st.dragging = false;
      pokeIdle();
      return;
    }
    const now = performance.now();
    if (now - st.lastTap < 320) {
      // double-tap: toggle zoom
      st.lastTap = 0;
      st.touches.clear(); st.dragging = false;
      const to = st.zoom > 1.2 ? 1 : 2.2;
      gsap.to(st, {
        zoom: to, panX: 0, panY: 0, duration: 0.45, ease: 'power3.out',
        onUpdate: paint, onComplete: () => setZoomed(to > 1.2),
      });
      pokeIdle();
      return;
    }
    st.lastTap = now;
    st.dragging = true;
    st.startX = e.clientX; st.startPos = st.pos;
    st.lastX = e.clientX; st.lastY = e.clientY; st.lastT = now;
    st.vel = 0; st.moved = false;
    pokeIdle();
  };

  const onPointerMove = (e) => {
    const st = S.current;
    if (!st.touches?.has(e.pointerId)) return;
    st.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (st.touches.size === 2 && st.pinch) {
      const [a, b] = [...st.touches.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const z = Math.min(3.2, Math.max(1, st.pinch.z0 * (d / Math.max(st.pinch.d0, 1))));
      st.zoom = z;
      setZoomed(z > 1.15);
      paint();
      return;
    }
    if (!st.dragging) return;
    const w = canvasRef.current?.clientWidth || 320;
    const dx = e.clientX - st.startX;
    if (Math.abs(dx) > 6) st.moved = true;
    if (st.zoom > 1.15) {
      st.panX += (e.clientX - st.lastX) * 1.3;
      st.panY += (e.clientY - st.lastY) * 1.3;
      const lim = 170 * st.zoom;
      st.panX = Math.max(-lim, Math.min(lim, st.panX));
      st.panY = Math.max(-lim, Math.min(lim, st.panY));
      st.vel = 0;
    } else {
      st.pos = st.startPos - (dx / w) * n * 1.35;
      const now = performance.now();
      const dt = Math.max(now - st.lastT, 1);
      // velocity in frames per 60fps tick
      st.vel = -((e.clientX - st.lastX) / dt) * 16.667 * 1.35 / w;
      st.lastT = now;
    }
    st.lastX = e.clientX; st.lastY = e.clientY;
    paint();
  };

  const onPointerUp = (e) => {
    const st = S.current;
    st.touches?.delete(e.pointerId);
    if ((st.touches?.size || 0) < 2) st.pinch = null;
    if ((st.touches?.size || 0) === 0) st.dragging = false;
  };

  // ---------- open/close ----------
  useEffect(() => {
    const root = rootRef.current;
    document.body.style.overflow = 'hidden';
    gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    gsap.fromTo('.spin360-card',
      { scale: 0.9, y: 30, opacity: 0 },
      { scale: 1, y: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
    const onKey = (ev) => { if (ev.key === 'Escape') doClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      clearTimeout(S.current.idleTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doClose = useCallback(() => {
    gsap.to('.spin360-card', { scale: 0.93, y: 20, opacity: 0, duration: 0.28, ease: 'power3.in' });
    gsap.to(rootRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: onClose });
  }, [onClose]);

  const pos = ((S.current.pos % n) + n) % n;
  const curFrame = Math.round(pos) % n;
  const pct = Math.round((loaded / Math.max(n, 1)) * 100);

  return (
    <div ref={rootRef} className="spin360" role="dialog" aria-modal="true"
      aria-label={`360 degree view of ${alt || 'product'}`}>
      <div className="spin360-card">
        <div className="spin360-top">
          <div>
            <div className="spin360-title"><span className="spin360-ico">⟳</span> 360° View{tintName ? ` — ${tintName}` : ''}</div>
            <div className="spin360-sub">
              {readyAll
                ? (auto ? 'auto-rotating — drag to take control' : 'drag to spin · pinch or double-tap to zoom')
                : `loading angles… ${pct}%`}
            </div>
          </div>
          <div className="spin360-count">{readyAll ? `${curFrame + 1} / ${n}` : '···'}</div>
          <button className="spin360-close" onClick={doClose} aria-label="Close 360 view">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="spin360-stage">
          {!readyAll && (
            <div className="spin360-loader">
              <div className="spin360-ring" style={{ '--p': pct }} />
              <span>{pct}%</span>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="spin360-canvas"
            style={{ touchAction: 'none', opacity: readyAll ? 1 : 0 }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          {readyAll && !zoomed && (
            <div className="spin360-hint"><span>⇔</span> drag to rotate</div>
          )}
        </div>

        <div className="spin360-dots" aria-hidden="true">
          {frames.map((f, i) => (
            <span key={`${f}-${i}`} className={i === curFrame ? 'on' : ''} />
          ))}
        </div>
      </div>
    </div>
  );
}
