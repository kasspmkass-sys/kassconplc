import { useEffect } from 'react';
import { useSite } from './context/SiteContext';
import { SITE_URL as BUILD_SITE_URL } from './generated/siteConfig';

const DEFAULT_SITE_NAME = 'Kassa & Sons Construction PLC | Kascon';
const DEFAULT_SITE_URL = BUILD_SITE_URL;
const DEFAULT_DESCRIPTION =
  'Kassa & Sons Construction PLC (KASCON) - Grade-1 general contractor in Ethiopia ' +
  'delivering building, civil, energy and infrastructure projects with quality and integrity.';

const INDEXABLE = 'index, follow';
const NOINDEX = 'noindex, nofollow';

/* Set (or create) the robots meta tag. Written on every public route so that
   client-side navigation away from /admin restores the indexable directive —
   an SPA never reloads the document, so nothing else would undo it. */
function setRobotsMeta(directive) {
  let tag = document.querySelector('meta[name="robots"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'robots');
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', directive);
}

/** Keep a route out of the index. Used by /admin and /search. */
export function useNoindex() {
  useEffect(() => {
    setRobotsMeta(NOINDEX);
  }, []);
}

/**
 * Resolve SEO from the CMS first (settings.seo.pages[pageKey]), falling back to
 * the page-level title/description passed in, then to global defaults.
 */
export function useSEO(title, description, pageKey) {
  const { settings } = useSite();
  const seo = settings?.seo || {};
  const page = (seo.pages && seo.pages[pageKey]) || {};
  const siteName = seo.siteName || DEFAULT_SITE_NAME;
  const siteUrl = seo.siteUrl || DEFAULT_SITE_URL;

  const finalTitle = page.title || title || siteName;
  const finalDescription =
    page.description || description || seo.defaultDescription || DEFAULT_DESCRIPTION;

  useEffect(() => {
    const fullTitle =
      finalTitle === siteName || `${finalTitle} | ${siteName}` === finalTitle
        ? finalTitle
        : `${finalTitle} | ${siteName}`;
    document.title = fullTitle;

    // Per-route canonical + social URL so interior pages don't all claim the homepage.
    const path = window.location.pathname;
    const url = path && path !== '/' ? siteUrl.replace(/\/+$/, '') + path.replace(/\/+$/, '') : siteUrl;

    const desc = document.querySelector('meta[name="description"]');
    if (finalDescription && desc) desc.setAttribute('content', finalDescription);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', url);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', url);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (finalDescription && ogDesc) ogDesc.setAttribute('content', finalDescription);

    // Keep Twitter card meta in sync with OG for every page navigation.
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', fullTitle);

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (finalDescription && twDesc) twDesc.setAttribute('content', finalDescription);

    // Public routes are indexable. This is what resets the tag after a
    // visitor has been inside /admin.
    setRobotsMeta(INDEXABLE);
  }, [finalTitle, finalDescription, siteName, siteUrl]);
}
