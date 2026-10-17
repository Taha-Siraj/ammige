'use client';

import Image from 'next/image';
import { useState } from 'react';

/**
 * SmartImage — uses Next.js <Image> (auto WebP/AVIF, lazy-load,
 * responsive srcset) for normal URLs, and falls back to a plain
 * <img> for data: URLs (admin uploads) which the optimizer can't handle.
 *
 * Smooth fade-in on load for a premium feel.
 *
 * Props mirror next/image: src, alt, fill, width, height, sizes,
 * priority, className, style. Pass `eager` instead of priority if you like.
 * Set `noFade` when the image's opacity is controlled by CSS (e.g. hover crossfade).
 */
export default function SmartImage({
  src,
  alt = '',
  fill = false,
  width,
  height,
  sizes,
  priority = false,
  eager = false,
  noFade = false,
  className,
  style,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const isData = typeof src === 'string' && src.startsWith('data:');
  const isPriority = priority || eager;
  const fade = noFade ? {} : {
    opacity: loaded || isPriority ? 1 : 0,
    transition: 'opacity .6s ease',
  };

  if (isData || !src) {
    // Data URLs can't be optimized — plain img, still lazy unless priority.
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          ...(fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } : {}),
          ...fade,
          ...style,
        }}
        loading={isPriority ? 'eager' : 'lazy'}
        onLoad={() => setLoaded(true)}
        {...(isPriority ? { fetchPriority: 'high' } : {})}
        {...rest}
      />
    );
  }

  const imgProps = {
    src,
    alt,
    sizes,
    priority: isPriority,
    className,
    style: { ...fade, ...style },
    onLoad: () => setLoaded(true),
    ...rest,
  };

  if (fill) {
    return (
      <Image
        {...imgProps}
        fill
        sizes={sizes || '(max-width: 720px) 50vw, (max-width: 1024px) 33vw, 25vw'}
      />
    );
  }

  return (
    <Image
      {...imgProps}
      width={width || 800}
      height={height || 1000}
    />
  );
}
