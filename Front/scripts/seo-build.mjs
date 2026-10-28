/**
 * SEO BUILD STEP
 * ──────────────────────────────────────────────────────────────────────
 * Every absolute URL the site publishes — canonical, og:url, og:image,
 * robots.txt, sitemap.xml, the JSON-LD graph and the runtime SITE_URL used by
 * useSEO — is derived from ONE constant below. Pointing the site at a custom
 * domain is a one-line change here (or a SITE_URL env var on the build
 * machine); nothing else needs to be touched.
 *
 * It writes three committed artefacts and patches index.html in place:
 *
 *   public/robots.txt
 *   public/sitemap.xml
 *   src/generated/siteConfig.js      (consumed at runtime by useSEO)
 *   index.html                      (between the seo:start / seo:end markers)
 *
 * Public routes are parsed out of src/App.jsx rather than duplicated here, so
 * a new page cannot be silently missing from the sitemap. Runs automatically
 * via `npm run prebuild`, or standalone with `npm run gen:seo`.
 *
 * The output is deterministic: no build timestamps, no lastmod guessing, so
 * re-running with an unchanged SITE_URL produces no git diff.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ── The one constant ───────────────────────────────────────────────────── */
const SITE_URL = (process.env.SITE_URL || 'https://kassconcp.vercel.app').replace(/\/+$/, '');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP_JSX = resolve(ROOT, 'src/App.jsx');
const INDEX_HTML = resolve(ROOT, 'index.html');
const SITE_CONFIG = resolve(ROOT, 'src/generated/siteConfig.js');
const ROBOTS = resolve(ROOT, 'public/robots.txt');
const SITEMAP = resolve(ROOT, 'public/sitemap.xml');

const MARKER_START = '<!-- seo:start -->';
const MARKER_END = '<!-- seo:end -->';
const LOGO_PRELOAD_START = '<!-- logo-preload:start -->';
const LOGO_PRELOAD_END = '<!-- logo-preload:end -->';

/* Crawlers see these before any JavaScript runs, so they must be sensible on
   their own. `description` is kept at 155 characters or fewer and starts with
   the literal phrase Google shows in the SERP. `useSEO` overwrites the
   og/twitter description and title per route once the app boots, which is why
   every tag it touches has to exist here first. */
const PAGE_TITLE = 'Kassa & Sons Construction PLC | KASCON — Grade-1 Contractor Ethiopia';
const PAGE_DESCRIPTION =
  'Grade-1 General Contractor in Addis Ababa, Ethiopia — building construction, ' +
  'civil engineering, roads, energy facilities and infrastructure works.';

/**
 * Crawl hints. `priority` and `changefreq` are advisory hints only — Google
 * ignores both — but they still tell other crawlers what matters most.
 * Anything not listed falls back to DEFAULT_HINT.
 */
const HINTS = {
  '/':              { priority: '1.0', changefreq: 'weekly' },
  '/services':      { priority: '0.9', changefreq: 'weekly' },
  '/projects':      { priority: '0.9', changefreq: 'weekly' },
  '/ready-mix':     { priority: '0.8', changefreq: 'monthly' },
  '/aggregate':     { priority: '0.8', changefreq: 'monthly' },
  '/about':         { priority: '0.8', changefreq: 'monthly' },
  '/contact':       { priority: '0.8', changefreq: 'monthly' },
  '/capabilities':  { priority: '0.7', changefreq: 'monthly' },
  '/equipment':     { priority: '0.7', changefreq: 'monthly' },
  '/where-we-work': { priority: '0.7', changefreq: 'monthly' },
  '/careers':       { priority: '0.7', changefreq: 'monthly' },
  '/news':          { priority: '0.6', changefreq: 'weekly' },
  '/hseq':          { priority: '0.6', changefreq: 'monthly' },
  '/downloads':     { priority: '0.5', changefreq: 'monthly' },
  '/services/':     { priority: '0.8', changefreq: 'monthly' },
  '/projects/':     { priority: '0.8', changefreq: 'monthly' },
};

const DEFAULT_HINT = { priority: '0.5', changefreq: 'monthly' };

/**
 * Routes inside the public layout that must stay out of the sitemap.
 *   /search  — client-side query results, no content of its own to index
 *   (`:param` routes are dropped separately as they are CMS-driven)
 */
const EXCLUDED = new Set(['/search']);

const xmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Read the real public routes straight out of the router. */
async function publicRoutes() {
  const app = await readFile(APP_JSX, 'utf8');

  const start = app.indexOf('<Route element={<PublicLayout />}');
  if (start === -1) throw new Error('App.jsx: no <Route element={<PublicLayout />}> found');

  /* The public block ends where the standalone /admin routes begin. */
  const end = app.indexOf('<Route path="/admin', start);
  if (end === -1) throw new Error('App.jsx: no /admin route found to bound the public block');

  const block = app.slice(start, end);

  const paths = [];
  for (const m of block.matchAll(/<Route\s+(index|path="([^"]+)")/g)) {
    paths.push(m[1] === 'index' ? '/' : `/${m[2]}`);
  }

  /* `:id` detail pages are populated from the CMS, so their real URLs are not
     knowable from the source tree — TODO: append them from the API. `*` is the
     catch-all NotFound route and must never be advertised. */
  return paths.filter((p) => !p.includes(':') && !p.includes('*') && !EXCLUDED.has(p));
}

function robotsTxt() {
  return `# robots.txt — generated by scripts/seo-build.mjs, do not edit by hand.
# Re-generate with: npm run gen:seo

User-agent: *
Allow: /

# CMS. Also carries <meta name="robots" content="noindex, nofollow"> so the
# directive survives crawlers that ignore this file.
Disallow: /admin

# Client-side search results — nothing indexable of its own.
Disallow: /search

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

async function sitemapXml(routes) {
  const urls = routes
    .map((path) => {
      const hint = HINTS[path] ||
        (path.startsWith('/services/') ? { priority: '0.8', changefreq: 'monthly' } :
         path.startsWith('/projects/') ? { priority: '0.8', changefreq: 'monthly' } :
         DEFAULT_HINT);
      const loc = path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
      return [
        '  <url>',
        `    <loc>${xmlEscape(loc)}</loc>`,
        `    <changefreq>${hint.changefreq}</changefreq>`,
        `    <priority>${hint.priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- generated by scripts/seo-build.mjs — do not edit by hand -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

let snapshotServices = [];
let snapshotLogoLocalPath  = null;
let snapshotLogoSmallPath  = null;
let snapshotLogoWidth      = 512;
let snapshotLogoHeight     = 512;
try {
  const snap = JSON.parse(readFileSync(fileURLToPath(new URL('../src/data/site-snapshot.json', import.meta.url)), 'utf8'));
  if (Array.isArray(snap.servicesList) && snap.servicesList.length > 0) {
    snapshotServices = snap.servicesList;
  }
  if (snap.logoLocalPath) {
    snapshotLogoLocalPath = snap.logoLocalPath;
    snapshotLogoWidth     = snap.logoWidth  || 512;
    snapshotLogoHeight    = snap.logoHeight || 512;
  }
  if (snap.logoSmallPath) {
    snapshotLogoSmallPath = snap.logoSmallPath;
  }
} catch { /* fallback to defaults */ }
const CATALOG_SERVICES = snapshotServices.length > 0 ? snapshotServices : [
  'Building Construction', 'Fuel Stations & Depots', 'Structural Metal Works',
  'Woodwork & Interiors', 'Crushed Aggregates', 'Project Management',
];

/** Determine MIME type from file extension */
function mimeFromExt(filePath) {
  const e = extname(filePath).replace('.', '').toLowerCase();
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
  if (e === 'png')  return 'image/png';
  if (e === 'webp') return 'image/webp';
  if (e === 'svg')  return 'image/svg+xml';
  if (e === 'avif') return 'image/avif';
  return 'image/jpeg';
}
/**
 * The head block that has to be absolute: canonical, og:url, the share image
 * and the JSON-LD graph. Everything else in index.html is hand-authored.
 */
function seoBlock() {
  /* Contact values below are a static snapshot of the CMS `settings` seed
     (server/kassconbackend/src/seed/seed.js). They are real values already
     used by the Navbar/Footer fallbacks — not invented — but they will drift
     if an admin edits Site Settings. See the TODO list before publishing a
     custom domain. */
  const organization = {
    '@type': ['Organization', 'LocalBusiness', 'GeneralContractor'],
    '@id': `${SITE_URL}/#organization`,
    name: 'Kassa & Sons Construction PLC',
    alternateName: 'KASCON',
    url: `${SITE_URL}/`,
    logo: {
      '@type': 'ImageObject',
      url: snapshotLogoLocalPath
        ? `${SITE_URL}${snapshotLogoLocalPath}`
        : `${SITE_URL}/icon-512.png`,
      width:  snapshotLogoLocalPath ? snapshotLogoWidth  : 512,
      height: snapshotLogoLocalPath ? snapshotLogoHeight : 512,
    },
    image: `${SITE_URL}/og-image.jpg`,
    description: PAGE_DESCRIPTION,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Gurd Shola, Cheshire Services Ethiopia Building, 3rd Floor',
      addressLocality: 'Addis Ababa',
      addressCountry: 'ET',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone: '+251-907-257-134',
        email: 'kasconpl@gmail.com',
        areaServed: 'ET',
        availableLanguage: ['en'],
      },
    ],
    // TODO: restore foundingDate once the user verifies the founding year (see seo-evidence-report.md Q4)
    areaServed: 'ET',
    /* Service names sourced from server/kassconbackend/src/seed/seed.js — the
       canonical list of the 6 core specializations seeded into the database. */
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Construction Services',
      itemListElement: CATALOG_SERVICES.map((name, i) => ({
        '@type': 'Offer',
        position: i + 1,
        itemOffered: { '@type': 'Service', name },
      })),
    },
  };

  const website = {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: PAGE_TITLE,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en',
  };

  const graph = JSON.stringify({ '@context': 'https://schema.org', '@graph': [organization, website] }, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : `    ${line}`))
    .join('\n');

  return [
    MARKER_START,
    '    <!-- Canonical + share metadata. Managed by scripts/seo-build.mjs so every',
    '         absolute URL comes from one SITE_URL constant — edit it there (or set',
    '         the SITE_URL env var) and re-run `npm run gen:seo`. -->',
    `    <link rel="canonical" href="${SITE_URL}/" />`,
    '',
    '    <!-- Open Graph. og:title/og:description are re-written per route by',
    '         useSEO once the CMS settings resolve. -->',
    '    <meta property="og:type" content="website" />',
    '    <meta property="og:site_name" content="Kassa & Sons Construction PLC" />',
    `    <meta property="og:title" content="${PAGE_TITLE}" />`,
    `    <meta property="og:description" content="${PAGE_DESCRIPTION}" />`,
    `    <meta property="og:url" content="${SITE_URL}/" />`,
    `    <meta property="og:image" content="${SITE_URL}/og-image.jpg" />`,
    '    <meta property="og:image:type" content="image/jpeg" />',
    '    <meta property="og:image:width" content="1200" />',
    '    <meta property="og:image:height" content="630" />',
    '    <meta property="og:image:alt" content="Kassa &amp; Sons Construction PLC project site in Addis Ababa, Ethiopia" />',
    '    <meta property="og:locale" content="en_ET" />',
    '',
    '    <!-- Twitter Card -->',
    '    <meta name="twitter:card" content="summary_large_image" />',
    `    <meta name="twitter:title" content="${PAGE_TITLE}" />`,
    `    <meta name="twitter:description" content="${PAGE_DESCRIPTION}" />`,
    `    <meta name="twitter:image" content="${SITE_URL}/og-image.jpg" />`,
    '    <meta name="twitter:image:alt" content="Kassa &amp; Sons Construction PLC project site in Addis Ababa, Ethiopia" />',
    '',
    '    <!-- Structured data -->',
    `    <script type="application/ld+json">`,
    graph,
    '    </script>',
    MARKER_END,
  ].join('\n');
}

async function writeIfChanged(file, next) {
  let current = null;
  try {
    current = await readFile(file, 'utf8');
  } catch {
    /* new file */
  }
  if (current === next) return false;
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, next, 'utf8');
  return true;
}

async function main() {
  const routes = await publicRoutes();

  const API_BASE = (process.env.VITE_API_URL || 'https://kassconbackend.onrender.com/api').replace(/\/+$/, '');

  async function fetchSlugs(endpoint) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(`${API_BASE}/${endpoint}`, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) return [];
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
      return items.map(i => i?.slug || i?._id || i?.id).filter(Boolean);
    } catch { return []; }
  }

  let serviceSlugs = [], projectSlugs = [];
  try {
    [serviceSlugs, projectSlugs] = await Promise.all([
      fetchSlugs('services/public'),
      fetchSlugs('projects/public'),
    ]);
  } catch {
    console.warn('[sitemap] dynamic URL fetch failed — skipping detail pages');
  }

  const detailRoutes = [
    ...serviceSlugs.map(s => `/services/${s}`),
    ...projectSlugs.map(s => `/projects/${s}`),
  ];

  const html = await readFile(INDEX_HTML, 'utf8');
  if (!html.includes(MARKER_START) || !html.includes(MARKER_END)) {
    throw new Error(`index.html is missing the ${MARKER_START} / ${MARKER_END} markers`);
  }
  let nextHtml =
    html.slice(0, html.indexOf(MARKER_START)) +
    seoBlock() +
    html.slice(html.indexOf(MARKER_END) + MARKER_END.length);

  // Write logo-preload block between markers (if present)
  if (nextHtml.includes(LOGO_PRELOAD_START) && nextHtml.includes(LOGO_PRELOAD_END)) {
    let logoPreloadContent;
    if (snapshotLogoLocalPath) {
      const logoPreloadPath = snapshotLogoSmallPath || snapshotLogoLocalPath;
      const logoPreloadMime = mimeFromExt(logoPreloadPath);
      logoPreloadContent =
        `${LOGO_PRELOAD_START}\n` +
        `    <link rel="preload" as="image" href="${logoPreloadPath}" type="${logoPreloadMime}" fetchpriority="low">\n` +
        `${LOGO_PRELOAD_END}`;
      console.log(`logo-preload: ${logoPreloadPath} (${logoPreloadMime}) fetchpriority=low`);
    } else {
      console.warn('[seo-build] WARNING: logoLocalPath not in snapshot — writing placeholder logo-preload comment');
      logoPreloadContent =
        `${LOGO_PRELOAD_START}\n` +
        `    <!-- logo preload: logoLocalPath not available — run download:media -->\n` +
        `${LOGO_PRELOAD_END}`;
    }
    nextHtml =
      nextHtml.slice(0, nextHtml.indexOf(LOGO_PRELOAD_START)) +
      logoPreloadContent +
      nextHtml.slice(nextHtml.indexOf(LOGO_PRELOAD_END) + LOGO_PRELOAD_END.length);
  } else {
    console.warn('[seo-build] WARNING: logo-preload markers not found in index.html — skipping logo preload injection');
  }

  await writeIfChanged(INDEX_HTML, nextHtml);
  await writeIfChanged(ROBOTS, robotsTxt());
  await writeIfChanged(SITEMAP, await sitemapXml([...routes, ...detailRoutes]));
  await writeIfChanged(
    SITE_CONFIG,
    `/**
 * GENERATED FILE — do not edit by hand.
 * Produced by scripts/seo-build.mjs. Every absolute URL the runtime needs
 * comes from the SITE_URL constant in that script.
 */

/** Origin only, no trailing slash. */
export const SITE_URL = ${JSON.stringify(SITE_URL)};

/** Absolute URL for a site-relative path, e.g. absUrl('/og-image.jpg'). */
export const absUrl = (path) =>
  \`\${SITE_URL}\${path.startsWith('/') ? path : \`/\${path}\`}\`;
`
  );

  console.log(`site    ${SITE_URL}`);
  console.log(`routes  ${routes.length} public routes parsed from src/App.jsx`);
  for (const r of routes) console.log(`          ${r}`);
  console.log('');
  console.log('wrote   public/robots.txt');
  console.log('wrote   public/sitemap.xml');
  console.log('wrote   src/generated/siteConfig.js');
  console.log('updated index.html seo block');
  if (snapshotLogoLocalPath) {
    console.log(`updated index.html logo-preload: ${snapshotLogoSmallPath || snapshotLogoLocalPath}`);
    console.log(`JSON-LD logo: ${SITE_URL}${snapshotLogoLocalPath}`);
  } else {
    console.log('JSON-LD logo: fallback (icon-512.png)');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});