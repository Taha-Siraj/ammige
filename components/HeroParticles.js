'use client';

import { useEffect, useRef } from 'react';

/**
 * HeroParticles — gold-dust particle field rendered with Three.js.
 * Sits above the hero image (additive glow) and below the text content.
 * Subtle luxury: slow upward drift, gentle sway, twinkle, mouse parallax.
 * Fully skipped when prefers-reduced-motion is set.
 */
export default function HeroParticles() {
  const mountRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let renderer = null;
    let raf = 0;
    let disposed = false;
    const disposables = [];

    const mouse = { tx: 0, ty: 0, x: 0, y: 0 };

    const onMouseMove = (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 1.4;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 0.9;
    };

    const onResize = () => {
      if (!renderer || !mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      renderer.setSize(w, h);
    };

    (async () => {
      let THREE;
      try {
        THREE = await import('three');
      } catch {
        return;
      }
      if (disposed || !mountRef.current) return;

      const mount = mountRef.current;
      const isMobile = window.innerWidth < 768;
      const COUNT = isMobile ? 110 : 220;

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.domElement.setAttribute('aria-hidden', 'true');
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        60,
        mount.clientWidth / Math.max(mount.clientHeight, 1),
        0.1,
        100
      );
      camera.position.z = 8;

      // Soft circular sprite generated procedurally — no external assets.
      const spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = 64;
      spriteCanvas.height = 64;
      const sctx = spriteCanvas.getContext('2d');
      const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 64, 64);
      const spriteTex = new THREE.CanvasTexture(spriteCanvas);
      disposables.push(spriteTex);

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(COUNT * 3);
      const aSize = new Float32Array(COUNT);
      const aPhase = new Float32Array(COUNT);
      const aColor = new Float32Array(COUNT * 3);
      const speeds = new Float32Array(COUNT);
      const swayAmp = new Float32Array(COUNT);

      const palette = [0xc29b4b, 0xe8dcc6, 0xfff6e6, 0xd9b36a];
      const tmp = new THREE.Color();
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 17;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 11;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
        aPhase[i] = Math.random() * Math.PI * 2;
        aSize[i] = 0.05 + Math.random() * 0.15;
        speeds[i] = 0.06 + Math.random() * 0.2;
        swayAmp[i] = 0.15 + Math.random() * 0.5;
        tmp.setHex(palette[(Math.random() * palette.length) | 0]);
        aColor[i * 3] = tmp.r;
        aColor[i * 3 + 1] = tmp.g;
        aColor[i * 3 + 2] = tmp.b;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
      geometry.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
      geometry.setAttribute('aColor', new THREE.BufferAttribute(aColor, 3));
      disposables.push(geometry);

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMap: { value: spriteTex },
        },
        vertexShader: `
          attribute float aSize;
          attribute float aPhase;
          attribute vec3 aColor;
          varying vec3 vColor;
          varying float vAlpha;
          uniform float uTime;
          void main() {
            vColor = aColor;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float tw = 0.5 + 0.5 * sin(uTime * 1.3 + aPhase);
            vAlpha = 0.25 + 0.75 * tw;
            gl_PointSize = aSize * (0.7 + 0.6 * tw) * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform sampler2D uMap;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vec4 tex = texture2D(uMap, gl_PointCoord);
            gl_FragColor = vec4(vColor, tex.a * vAlpha * 0.85);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      disposables.push(material);

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const clock = new THREE.Clock();
      const posAttr = geometry.getAttribute('position');

      const tick = () => {
        if (disposed) return;
        raf = requestAnimationFrame(tick);
        if (document.hidden) return;

        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        material.uniforms.uTime.value = t;

        // Slow upward drift + gentle sway; wrap vertically.
        const arr = posAttr.array;
        for (let i = 0; i < COUNT; i++) {
          const j = i * 3;
          arr[j + 1] += speeds[i] * dt;
          arr[j] += Math.sin(t * 0.6 + aPhase[i]) * swayAmp[i] * dt * 0.35;
          if (arr[j + 1] > 5.8) {
            arr[j + 1] = -5.8;
            arr[j] = (Math.random() - 0.5) * 17;
          }
        }
        posAttr.needsUpdate = true;

        // Mouse parallax with lerp — whole field drifts toward cursor.
        mouse.x += (mouse.tx - mouse.x) * 0.04;
        mouse.y += (mouse.ty - mouse.y) * 0.04;
        points.position.x = mouse.x;
        points.position.y = -mouse.y * 0.6;
        points.rotation.y = mouse.x * 0.06;

        renderer.render(scene, camera);
      };
      tick();

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('resize', onResize);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
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
  }, []);

  return <div ref={mountRef} className="hero-particles" aria-hidden="true" />;
}
