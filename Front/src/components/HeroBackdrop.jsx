/**
 * HERO BACKDROP
 * ──────────────────────────────────────────────────────────────────────
 * The static, build-time-known half of the hero stage, and the site's Largest
 * Contentful Paint element.
 *
 * Why this exists separately from the CMS-driven slides: the slide URLs come
 * out of /api/settings/public, so the browser cannot know the hero image URL
 * until that request has already resolved — far too late to preload it or to
 * give it fetchpriority. This component points at a committed master that is
 * turned into an AVIF/WebP/JPEG ladder by `npm run gen:hero`, which means:
 *
 *   • the URL is in the HTML, so <link rel="preload" as="image" imagesrcset>
 *     in index.html can start the fetch during head parsing;
 *   • the browser picks the smallest rung that fits the viewport and DPR
 *     instead of every device downloading one desktop-sized JPEG;
 *   • AVIF/WebP cut the bytes roughly 10-15x against the source JPEG;
 *   • an inline 24px WebP placeholder paints immediately, so the stage is
 *     never an empty grey box while the photograph arrives.
 *
 * It renders as the bottom layer of .hero-visual. The CMS slides sit above it
 * and cross-fade in over it, so the stage keeps the gradient plate underneath
 * even if both the preload and the CMS payload fail.
 *
 * `npm run gen:hero` owns the srcset strings in ../generated/heroAssets.js —
 * never hand-edit the paths here, regenerate instead.
 */
import { useState } from 'react';
import {
  HERO_FALLBACK_SRC,
  HERO_HEIGHT,
  HERO_LQIP,
  HERO_SIZES,
  HERO_SRCSET_AVIF,
  HERO_SRCSET_JPG,
  HERO_SRCSET_WEBP,
  HERO_WIDTH,
} from '../generated/heroAssets';

/**
 * @param {string} className  extra classes for the positioning wrapper
 */
export default function HeroBackdrop({ className = '' }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  /* If the ladder is unreachable the stage simply keeps its gradient plate —
     the same no-photograph state the hero already had a design for. */
  if (failed) return null;

  return (
    <div
      aria-hidden="true"
      className={`hero-backdrop${className ? ` ${className}` : ''}`}
      data-loaded={loaded ? 'true' : 'false'}
      style={{ '--hero-lqip': `url("${HERO_LQIP}")` }}
    >
      <picture>
        <source type="image/avif" srcSet={HERO_SRCSET_AVIF} sizes={HERO_SIZES} />
        <source type="image/webp" srcSet={HERO_SRCSET_WEBP} sizes={HERO_SIZES} />
        {/* The <img> carries the JPEG rung so pre-paint browsers still get a
            responsive set rather than a single file. */}
        <img
          src={HERO_FALLBACK_SRC}
          srcSet={HERO_SRCSET_JPG}
          sizes={HERO_SIZES}
          width={HERO_WIDTH}
          height={HERO_HEIGHT}
          alt=""
          /* Never lazy: this is the LCP element and lazy loading it is the
             single most common cause of a slow LCP score. */
          loading="eager"
          /* sync rather than async — this image should paint the moment it
             has decoded; deferring the decode only delays the LCP paint. */
          decoding="sync"
          fetchPriority="high"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      </picture>
    </div>
  );
}
