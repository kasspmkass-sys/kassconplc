/**
 * GENERATED FILE — do not edit by hand.
 * Produced by scripts/seo-build.mjs. Every absolute URL the runtime needs
 * comes from the SITE_URL constant in that script.
 */

/** Origin only, no trailing slash. */
export const SITE_URL = "https://kassconcp.vercel.app";

/** Absolute URL for a site-relative path, e.g. absUrl('/og-image.jpg'). */
export const absUrl = (path) =>
  `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
