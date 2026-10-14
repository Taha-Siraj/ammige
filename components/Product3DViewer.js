'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Product3DViewer — premium pseudo-3D product viewer (fullscreen modal).
 *
 * The product photo floats as a mounted card in a warm studio scene.
 * Drag (mouse or touch) tilts the card in 3D — clamped so it never shows
 * a thin edge — with inertia and a gentle idle sway. Honest pseudo-3D:
 * we only have flat photos, so this is tilt/parallax, not full rotation.
 *
 * Client-only: load via next/dynamic(() => import('./Product3DViewer'), { ssr: false }).
 */
export default function Product3DViewer({ image, alt, onClose }) {
  const mountRef = useRef(null);
  const apiRef = useRef(null); // { reset() } — exposed by the scene
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [hintOn, setHintOn] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  // Lock body scroll + Escape to close.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let renderer = null;
    let raf = 0;
    let disposed = false;
    const disposables = [];
    const cleanups = [];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const track = (d) => { disposables.push(d); return d; };
    const on = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      cleanups.push(() => { try { target.removeEventListener(type, fn, opts); } catch { /* noop */ } });
    };

    (async () => {
      let THREE;
      try {
        THREE = await import('three');
      } catch {
        if (!disposed) setStatus('error');
        return;
      }
      if (disposed || !mountRef.current) return;
      const mount = mountRef.current;

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();

      // Warm studio backdrop: radial ivory gradient baked to a canvas texture.
      const bgC = document.createElement('canvas');
      bgC.width = 512;
      bgC.height = 512;
      const bctx = bgC.getContext('2d');
      const bg = bctx.createRadialGradient(256, 215, 40, 256, 256, 370);
      bg.addColorStop(0, '#FBF6EA');
      bg.addColorStop(0.55, '#F1E7D2');
      bg.addColorStop(1, '#D8C5A0');
      bctx.fillStyle = bg;
      bctx.fillRect(0, 0, 512, 512);
      const bgTex = track(new THREE.CanvasTexture(bgC));
      bgTex.colorSpace = THREE.SRGBColorSpace;
      scene.background = bgTex;

      const camera = new THREE.PerspectiveCamera(
        38,
        mount.clientWidth / Math.max(mount.clientHeight, 1),
        0.1,
        60
      );
      camera.position.set(0, 0.25, 7.4);
      camera.lookAt(0, 0, 0);

      // Studio lighting: soft key + gold rim feel.
      scene.add(new THREE.HemisphereLight(0xfff6e6, 0x8a7a5f, 0.75));
      const key = new THREE.DirectionalLight(0xffffff, 1.15);
      key.position.set(3, 4, 6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xc29b4b, 0.9);
      rim.position.set(-4, 1.5, -3);
      scene.add(rim);

      // The product photo as texture.
      let tex;
      try {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        tex = await loader.loadAsync(image);
      } catch {
        if (!disposed) setStatus('error');
        return;
      }
      if (disposed) { tex.dispose(); return; }
      track(tex);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

      // Size the card to the photo's aspect, fitted to the viewport.
      const aspect = (tex.image.naturalWidth || 1) / (tex.image.naturalHeight || 1);
      const dist = 7.4;
      const vH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(38 / 2));
      const vW = vH * camera.aspect;
      const maxW = Math.min(4.9, vW * 0.86);
      const maxH = Math.min(3.6, vH * 0.78);
      let w = maxW;
      let h = w / aspect;
      if (h > maxH) { h = maxH; w = h * aspect; }

      const swayGroup = new THREE.Group(); // idle sway (outer)
      const tiltGroup = new THREE.Group(); // user drag tilt (inner)
      swayGroup.add(tiltGroup);
      scene.add(swayGroup);

      // Mounted-print frame: dark backing slightly larger than the photo.
      const frame = new THREE.Mesh(
        track(new THREE.PlaneGeometry(w + 0.14, h + 0.14)),
        track(new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.55, metalness: 0.15 }))
      );
      frame.position.z = -0.03;
      tiltGroup.add(frame);

      const card = new THREE.Mesh(
        track(new THREE.PlaneGeometry(w, h)),
        track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0.0 }))
      );
      tiltGroup.add(card);

      // Warm glow behind the card.
      const glowC = document.createElement('canvas');
      glowC.width = 128;
      glowC.height = 128;
      const gctx = glowC.getContext('2d');
      const gg = gctx.createRadialGradient(64, 64, 4, 64, 64, 64);
      gg.addColorStop(0, 'rgba(212,175,99,0.55)');
      gg.addColorStop(1, 'rgba(212,175,99,0)');
      gctx.fillStyle = gg;
      gctx.fillRect(0, 0, 128, 128);
      const glow = new THREE.Mesh(
        track(new THREE.PlaneGeometry(6.4, 6.4)),
        track(new THREE.MeshBasicMaterial({
          map: track(new THREE.CanvasTexture(glowC)),
          transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending,
        }))
      );
      glow.position.z = -0.8;
      swayGroup.add(glow);

      // Soft contact shadow: blurred ellipse on an implied floor.
      const shC = document.createElement('canvas');
      shC.width = 256;
      shC.height = 128;
      const sctx = shC.getContext('2d');
      sctx.translate(128, 64);
      sctx.scale(1, 0.5);
      const sg = sctx.createRadialGradient(0, 0, 8, 0, 0, 120);
      sg.addColorStop(0, 'rgba(40,28,16,0.5)');
      sg.addColorStop(1, 'rgba(40,28,16,0)');
      sctx.fillStyle = sg;
      sctx.beginPath();
      sctx.arc(0, 0, 120, 0, Math.PI * 2);
      sctx.fill();
      const shadow = new THREE.Mesh(
        track(new THREE.PlaneGeometry(4.4, 2.2)),
        track(new THREE.MeshBasicMaterial({
          map: track(new THREE.CanvasTexture(shC)),
          transparent: true, opacity: 0.5, depthWrite: false,
        }))
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -2.35;
      scene.add(shadow);

      // ---- drag-to-tilt interaction (clamped, with inertia) ----
      const MAX_Y = 0.55; // never shows a thin edge
      const MAX_X = 0.35;
      const st = {
        tRY: 0, tRX: 0, cRY: 0, cRX: 0,
        vY: 0, vX: 0,
        dragging: false, lx: 0, ly: 0,
        lastActive: performance.now(),
        sway: 0, hasDragged: false,
      };
      const el = renderer.domElement;
      const clampT = () => {
        st.tRY = Math.max(-MAX_Y, Math.min(MAX_Y, st.tRY));
        st.tRX = Math.max(-MAX_X, Math.min(MAX_X, st.tRX));
      };

      const onDown = (e) => {
        st.dragging = true;
        st.lx = e.clientX;
        st.ly = e.clientY;
        st.vY = 0;
        st.vX = 0;
        st.lastActive = performance.now();
        try { el.setPointerCapture(e.pointerId); } catch { /* noop */ }
        if (!st.hasDragged) { st.hasDragged = true; setHintOn(false); }
      };
      const onMove = (e) => {
        if (!st.dragging) return;
        const dx = e.clientX - st.lx;
        const dy = e.clientY - st.ly;
        st.lx = e.clientX;
        st.ly = e.clientY;
        st.tRY += dx * 0.0055;
        st.tRX += dy * 0.0045;
        clampT();
        st.vY = dx * 0.0055;
        st.vX = dy * 0.0045;
        st.lastActive = performance.now();
      };
      const onUp = () => {
        st.dragging = false;
        st.lastActive = performance.now();
      };
      const onDbl = () => {
        st.tRY = 0; st.tRX = 0; st.vY = 0; st.vX = 0;
        st.lastActive = performance.now();
      };
      apiRef.current = { reset: onDbl };

      if (!reduceMotion) {
        on(el, 'pointerdown', onDown);
        on(el, 'pointermove', onMove);
        on(el, 'pointerup', onUp);
        on(el, 'pointercancel', onUp);
        on(el, 'dblclick', onDbl);
      }

      const onResize = () => {
        if (!renderer || !mountRef.current) return;
        const w2 = mountRef.current.clientWidth;
        const h2 = mountRef.current.clientHeight;
        camera.aspect = w2 / Math.max(h2, 1);
        camera.updateProjectionMatrix();
        renderer.setSize(w2, h2);
      };
      on(window, 'resize', onResize);

      const clock = new THREE.Clock();
      const tick = () => {
        if (disposed) return;
        if (!reduceMotion) raf = requestAnimationFrame(tick);
        if (document.hidden) return;
        const t = clock.getElapsedTime();

        if (!reduceMotion) {
          // Inertia after release, damped.
          if (!st.dragging && (Math.abs(st.vY) > 0.0004 || Math.abs(st.vX) > 0.0004)) {
            st.tRY += st.vY;
            st.tRX += st.vX;
            clampT();
            st.vY *= 0.93;
            st.vX *= 0.93;
            st.lastActive = performance.now();
          }
          // Buttery lerp toward targets.
          st.cRY += (st.tRY - st.cRY) * 0.14;
          st.cRX += (st.tRX - st.cRX) * 0.14;
          tiltGroup.rotation.y = st.cRY;
          tiltGroup.rotation.x = st.cRX;
          // Gentle idle sway after 3s untouched.
          const idle = performance.now() - st.lastActive > 3000;
          st.sway += ((idle ? 1 : 0) - st.sway) * 0.03;
          swayGroup.rotation.y = Math.sin(t * 0.55) * 0.07 * st.sway;
          swayGroup.rotation.x = Math.sin(t * 0.75 + 1) * 0.035 * st.sway;
          // Shadow breathes subtly with tilt.
          shadow.material.opacity = 0.5 - Math.abs(st.cRY) * 0.25;
        }
        renderer.render(scene, camera);
      };

      setStatus('ready');
      tick();
    })();

    return () => {
      disposed = true;
      apiRef.current = null;
      cancelAnimationFrame(raf);
      for (const fn of cleanups) fn();
      for (const d of disposables) {
        if (d && typeof d.dispose === 'function') d.dispose();
      }
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer = null;
      }
    };
  }, [image, retryKey]);

  return (
    <div className="viewer3d" role="dialog" aria-modal="true" aria-label={`3D view of ${alt || 'product'}`}>
      <div className="viewer3d-top">
        <div>
          <div className="viewer3d-title">3D View</div>
          <div className="viewer3d-sub">Drag to explore</div>
        </div>
        <button className="viewer3d-close" onClick={onClose} aria-label="Close 3D view">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <div className="viewer3d-stage" ref={mountRef}>
        {status === 'loading' && (
          <div className="viewer3d-center">
            <div className="v3d-spin" aria-hidden="true" />
            <p>Loading 3D view…</p>
          </div>
        )}
        {status === 'error' && (
          <div className="viewer3d-center">
            <p className="viewer3d-err">Couldn&apos;t load the 3D view.<br />Check your connection and try again.</p>
            <button className="btn btn-gold btn-sm" onClick={() => { setStatus('loading'); setRetryKey((k) => k + 1); }}>
              Try again
            </button>
          </div>
        )}
        {status === 'ready' && (
          <div className={`viewer3d-hint${hintOn ? '' : ' off'}`} aria-hidden="true">
            Drag to explore
          </div>
        )}
        {status === 'ready' && (
          <div className="viewer3d-bar">
            <button
              className="viewer3d-chip"
              onClick={() => { if (apiRef.current) apiRef.current.reset(); }}
              aria-label="Reset 3D view"
            >
              <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
              Reset view
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
