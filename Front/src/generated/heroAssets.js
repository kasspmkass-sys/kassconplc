/**
 * GENERATED FILE — do not edit by hand.
 * Produced by scripts/generate-hero-variants.mjs. Run `npm run gen:hero`
 * after replacing assets/hero-source.jpg.
 * Tier-2 rebuild: using committed CMS-derived ladder.
 */

/** Width/height of the master, used to reserve layout space (avoids CLS). */
export const HERO_WIDTH = 1920;
export const HERO_HEIGHT = 960;

/** The stage is full-bleed, so the browser always wants the 100vw candidate. */
export const HERO_SIZES = '100vw';

export const HERO_SRCSET_AVIF = "/media/home/hero/hero-480.avif 480w, /media/home/hero/hero-768.avif 768w, /media/home/hero/hero-1024.avif 1024w, /media/home/hero/hero-1280.avif 1280w, /media/home/hero/hero-1600.avif 1600w, /media/home/hero/hero-1920.avif 1920w";
export const HERO_SRCSET_WEBP = "/media/home/hero/hero-480.webp 480w, /media/home/hero/hero-768.webp 768w, /media/home/hero/hero-1024.webp 1024w, /media/home/hero/hero-1280.webp 1280w, /media/home/hero/hero-1600.webp 1600w, /media/home/hero/hero-1920.webp 1920w";
export const HERO_SRCSET_JPG = "/media/home/hero/hero-480.jpg 480w, /media/home/hero/hero-768.jpg 768w, /media/home/hero/hero-1024.jpg 1024w, /media/home/hero/hero-1280.jpg 1280w, /media/home/hero/hero-1600.jpg 1600w, /media/home/hero/hero-1920.jpg 1920w";

/** Inline blur-up placeholder — no extra request, painted immediately. */
export const HERO_LQIP = "data:image/webp;base64,UklGRmwAAABXRUJQVlA4IGAAAAAQBACdASoYAAwAPuleqE0pJSQiMAgBIB0JaACdMoABKaO9GwChSCaPAAD+FJdMEijkxmbX7AB8sQxJ0aHxbJQNNt+HS/tFyDJd7XcznWtrrj9U9tC1pXI1vCk4xO8gAAA=";

/** Smallest ladder rung; used as the plain `src` fallback. */
export const HERO_FALLBACK_SRC = "/media/home/hero/hero-480.jpg";
