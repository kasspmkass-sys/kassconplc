/**
 * POSTBUILD — Static SEO Prerender  (live-API + committed-snapshot edition)
 * ──────────────────────────────────────────────────────────────────────────
 * Injects a hidden static snapshot of key homepage content into the
 * `<div id="root">` element of dist/index.html so non-JS crawlers (Bing,
 * social bots) can read real body text without executing JavaScript.
 *
 * React 18 with createRoot (non-SSR) replaces the entire #root contents
 * on first render, so this static HTML is cleanly overwritten once React
 * boots — no hydration mismatch. The `display:none` and aria-hidden="true"
 * are belt-and-suspenders for the brief moment before React boots.
 * A <noscript> block overrides display:none for crawlers without JS.
 *
 * Content is fetched from the live API each build; if the API is
 * unreachable the last committed snapshot (src/data/site-snapshot.json)
 * is used as fallback.
 *
 * Runs automatically via `npm run postbuild`. Safe to re-run (idempotent).
 * Run with --update-snapshot to refresh the snapshot file only (no HTML).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

console.log(`[prerender] Node ${process.version}`);

const ROOT          = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_INDEX    = resolve(ROOT, 'dist/index.html');
const SNAPSHOT_DIR  = resolve(ROOT, 'src/data');
const SNAPSHOT_PATH = resolve(SNAPSHOT_DIR, 'site-snapshot.json');
const ENV_PROD_FILE = resolve(ROOT, '.env.production');

/* ── A. Resolve API base URL ─────────────────────────────────────────── */

function parseEnvFile(filePath) {
  try {
    if (!existsSync(filePath)) return '';
    const raw   = readFileSync(filePath, 'utf8');
    const match = raw.match(/^VITE_API_URL=(.+)$/m);
    return match ? match[1].trim() : '';
  } catch {
    return '';
  }
}

const apiBase = (() => {
  if (process.env.VITE_API_URL && process.env.VITE_API_URL.trim()) {
    return process.env.VITE_API_URL.trim();
  }
  const fromFile = parseEnvFile(ENV_PROD_FILE);
  if (fromFile) return fromFile;
  return 'https://kassconbackend.onrender.com/api';
})();

console.log(`[prerender] API base: ${apiBase}`);

/* ── B. Fetch with retry ─────────────────────────────────────────────── */

const TIMEOUT_MS  = 30_000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2_000;

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a URL up to MAX_RETRIES times with RETRY_DELAY between attempts.
 * Returns { ok: true, data, status } on success or { ok: false, error } on failure.
 */
async function fetchWithRetry(url) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[prerender] Attempt ${attempt}/${MAX_RETRIES}: GET ${url} ...`);
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      console.log(`[prerender] ✓ ${url} → OK`);
      return { ok: true, data, status: res.status };
    } catch (err) {
      lastErr = err;
      console.warn(`[prerender] ✗ Attempt ${attempt} failed: ${err.message}`);
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY);
    }
  }
  return { ok: false, error: lastErr };
}

/* ── Helper: safely read a nested path from an object ───────────────── */
function deepGet(obj, ...keys) {
  return keys.reduce(
    (cur, k) => (cur != null && typeof cur === 'object' ? cur[k] : undefined),
    obj
  );
}

/* ── B2. Fetch live data ─────────────────────────────────────────────── */

async function fetchLiveData() {
  // Fetch /settings/public — primary source for all copy
  const settingsResult = await fetchWithRetry(`${apiBase}/settings/public`);

  // Fetch /services/public — the actual service cards live here, not in
  // settings.services. This is the same endpoint Home.jsx calls at runtime.
  const servicesPublicResult = await fetchWithRetry(`${apiBase}/services/public`);

  if (!settingsResult.ok) {
    return { ok: false, which: 'settings' };
  }

  // The API may wrap the document in { settings: {...} } or { data: {...} }
  // or return the flat object directly.
  const sd = settingsResult.data;
  const s  = sd?.settings ?? sd?.data ?? sd;

  // Hero headline — settings.headline is the canonical single headline field
  const heroHeadline =
    deepGet(s,  'headline') ||
    deepGet(sd, 'headline') ||
    null;

  // Simplified: heroHeadlineFinal comes from /settings/public only
  const heroHeadlineFinal = heroHeadline;

  // Hero supporting subline
  const heroSubline =
    deepGet(s,  'heroSupporting') ||
    deepGet(sd, 'heroSupporting') ||
    null;

  // Logo URL
  const logoUrl =
    deepGet(s,  'logo') ||
    deepGet(sd, 'logo') ||
    null;

  // Logo size
  const logoSize =
    deepGet(s,  'logoSize') ||
    deepGet(sd, 'logoSize') ||
    38;

  // Company description — settings.home.about.description
  const companyDescription =
    deepGet(s,  'home', 'about', 'description') ||
    deepGet(sd, 'home', 'about', 'description') ||
    deepGet(s,  'aboutShort') ||
    deepGet(sd, 'aboutShort') ||
    null;

  // Company name
  const companyName =
    deepGet(s,  'companyName') ||
    deepGet(sd, 'companyName') ||
    deepGet(s,  'name') ||
    deepGet(sd, 'name') ||
    null;

  // Services section copy
  const servicesTitle =
    deepGet(s,  'home', 'services', 'title') ||
    deepGet(sd, 'home', 'services', 'title') ||
    null;

  const servicesSubtitle =
    deepGet(s,  'home', 'services', 'subtitle') ||
    deepGet(sd, 'home', 'services', 'subtitle') ||
    null;

  // Services list — prefer /services/public (same endpoint Home.jsx uses).
  // Fall back to settings.services if the dedicated endpoint fails.
  let servicesList = [];
  if (servicesPublicResult.ok) {
    const rawServices = servicesPublicResult.data;
    if (Array.isArray(rawServices)) {
      servicesList = rawServices
        .map((sv) => (typeof sv === 'string' ? sv : sv?.title || sv?.name || ''))
        .filter(Boolean);
      console.log(`[prerender] /services/public returned ${servicesList.length} services.`);
    }
  } else {
    // Fallback: try settings.services (may be absent or empty on most deployments)
    console.warn('[prerender] /services/public failed — trying settings.services fallback ...');
    const rawServices =
      deepGet(s,  'services') ||
      deepGet(sd, 'services');
    if (Array.isArray(rawServices)) {
      servicesList = rawServices
        .map((sv) => (typeof sv === 'string' ? sv : sv?.title || sv?.name || ''))
        .filter(Boolean);
    }
  }

  return {
    ok:                 true,
    heroHeadline:       heroHeadlineFinal,
    heroSubline,
    logoUrl,
    logoSize,
    companyName,
    companyDescription,
    servicesTitle,
    servicesSubtitle,
    servicesList,
  };
}

/* ── C. Write snapshot ───────────────────────────────────────────────── */

async function writeSnapshot(data, source = 'live-api') {
  await mkdir(SNAPSHOT_DIR, { recursive: true });

  // Preserve CMS media fields written by download-cms-media.mjs — prerender
  // only refreshes the text content, not the downloaded binary paths.
  let existing = {};
  try {
    const raw = await readFile(SNAPSHOT_PATH, 'utf8');
    existing = JSON.parse(raw);
  } catch { /* first run — no existing snapshot */ }

  const snapshot = {
    _comment:
      'This file is the prerender fallback snapshot. Commit it. Never delete it.' +
      ' Regenerate with: node scripts/prerender.mjs --update-snapshot',
    _generated: new Date().toISOString(),
    _source:    source,
    heroHeadline:       data.heroHeadline,
    heroSubline:        data.heroSubline,
    logoUrl:            data.logoUrl,
    logoSize:           data.logoSize,
    companyName:        data.companyName || existing.companyName || null,
    companyDescription: data.companyDescription,
    servicesTitle:      data.servicesTitle,
    servicesSubtitle:   data.servicesSubtitle,
    servicesList:       data.servicesList,
    // Preserve CMS download fields (set by download-cms-media.mjs)
    ...(existing.logoLocalPath       != null ? { logoLocalPath:       existing.logoLocalPath       } : {}),
    ...(existing.logoWidth           != null ? { logoWidth:           existing.logoWidth           } : {}),
    ...(existing.logoHeight          != null ? { logoHeight:          existing.logoHeight          } : {}),
    ...(existing.logoSmallPath       != null ? { logoSmallPath:       existing.logoSmallPath       } : {}),
    ...(existing.logoSmallWidth      != null ? { logoSmallWidth:      existing.logoSmallWidth      } : {}),
    ...(existing.logoSmallHeight     != null ? { logoSmallHeight:     existing.logoSmallHeight     } : {}),
    ...(existing.logoSmallSize       != null ? { logoSmallSize:       existing.logoSmallSize       } : {}),
    ...(existing.heroSlideLocalPaths != null ? { heroSlideLocalPaths: existing.heroSlideLocalPaths } : {}),
  };
  await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), 'utf8');
  return snapshot;
}

/* ── D. Read snapshot fallback ───────────────────────────────────────── */

async function readSnapshot() {
  try {
    const raw = await readFile(SNAPSHOT_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* ── F. Simple line-by-line diff ─────────────────────────────────────── */

function printDiff(oldText, newText) {
  if (!oldText) {
    console.log('[prerender] diff: no existing seo-prerender block found (first injection)');
    return;
  }
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const oldSet   = new Set(oldLines);
  const newSet   = new Set(newLines);
  const removed  = oldLines.filter((l) => !newSet.has(l));
  const added    = newLines.filter((l) => !oldSet.has(l));
  if (removed.length === 0 && added.length === 0) {
    console.log('[prerender] diff: content unchanged');
    return;
  }
  console.log('[prerender] diff:');
  removed.forEach((l) => console.log(`  - ${l}`));
  added.forEach((l)   => console.log(`  + ${l}`));
}

/* ── G. Build static HTML block ─────────────────────────────────────── */

const PRERENDER_ID = 'seo-prerender';
const BUILD_STATUS_PATH = resolve(ROOT, '.build-status.json');

// Read real HERO_LQIP from src/generated/heroAssets.js at runtime
const HERO_ASSETS_PATH = resolve(ROOT, 'src/generated/heroAssets.js');

function readHeroLqip() {
  try {
    const src = readFileSync(HERO_ASSETS_PATH, 'utf8');
    const m = src.match(/export const HERO_LQIP\s*=\s*"([^"]+)"/);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

// Module-level flag set by buildStaticBlock
let _lqipWasInjected = false;

// Hero image constants — build-time values from src/generated/heroAssets.js
// (regenerated by npm run gen:hero; hardcoded here so prerender works offline)
const HERO_SRCSET_AVIF =
  '/media/home/hero/hero-480.avif 480w, /media/home/hero/hero-768.avif 768w, /media/home/hero/hero-1024.avif 1024w, /media/home/hero/hero-1280.avif 1280w, /media/home/hero/hero-1600.avif 1600w, /media/home/hero/hero-1920.avif 1920w';
const HERO_SRCSET_WEBP =
  '/media/home/hero/hero-480.webp 480w, /media/home/hero/hero-768.webp 768w, /media/home/hero/hero-1024.webp 1024w, /media/home/hero/hero-1280.webp 1280w, /media/home/hero/hero-1600.webp 1600w, /media/home/hero/hero-1920.webp 1920w';
const HERO_SRCSET_JPG =
  '/media/home/hero/hero-480.jpg 480w, /media/home/hero/hero-768.jpg 768w, /media/home/hero/hero-1024.jpg 1024w, /media/home/hero/hero-1280.jpg 1280w, /media/home/hero/hero-1600.jpg 1600w, /media/home/hero/hero-1920.jpg 1920w';
const HERO_FALLBACK_SRC = '/media/home/hero/hero-480.jpg';
const HERO_WIDTH  = 1920;
const HERO_HEIGHT = 960;

function escape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildStaticBlock(snap) {
  const {
    heroHeadline, heroSubline, companyDescription,
    servicesTitle, servicesSubtitle, servicesList,
  } = snap;

  // Eyebrow: use snap.heroEyebrow if present, else default
  const eyebrow = snap.heroEyebrow || 'Grade-1 General Contractor · Addis Ababa';

  // Read real HERO_LQIP from generated file
  const heroLqip = readHeroLqip();
  if (heroLqip) _lqipWasInjected = true;

  // ── Static navbar logo block ─────────────────────────────────────────
  const logoSrc = snap.logoSmallPath || snap.logoLocalPath || null;
  const logoSize = snap.logoSize != null ? Number(snap.logoSize) : 38;
  const logoDisplayH = Math.min(Math.max(logoSize, 36), 52);

  const brandName = snap.companyName || 'Kassa & Sons Construction PLC';
  const brandMatch = brandName.trim().match(
    /^(.+?)\s+(Construction\s+(?:PLC|P\.L\.C\.?)|Construction|PLC|P\.L\.C\.?|Inc\.?|Ltd\.?|S\.C\.?)$/i
  );
  const brandStem = brandMatch ? brandMatch[1] : brandName.trim();
  const brandTail = brandMatch ? brandMatch[2] : '';

  const logoImgHtml = logoSrc
    ? `<img src="${logoSrc}" alt="" class="site-nav-logo" width="${logoDisplayH}" height="${logoDisplayH}" loading="eager" fetchpriority="low" decoding="async">`
    : `<span class="site-nav-logo-fallback" aria-hidden="true">KS</span>`;

  const staticNavbar =
    `<header class="site-nav site-nav--over" aria-hidden="true">` +
    `<div class="container-pad" style="display:flex;align-items:center;height:var(--header-h)">` +
    `<a href="/" class="site-nav-brand">` +
    logoImgHtml +
    `<span class="site-nav-brand-text">` +
    `<span class="site-nav-brand-name">${escape(brandStem)}</span>` +
    (brandTail ? `<span class="site-nav-brand-tail">${escape(brandTail)}</span>` : '') +
    `</span>` +
    `</a>` +
    `</div>` +
    `</header>`;

  // Hero backdrop picture element (matches HeroBackdrop.jsx render exactly)
  const heroPicture =
    `<picture>` +
    `<source type="image/avif" srcset="${HERO_SRCSET_AVIF}" sizes="100vw">` +
    `<source type="image/webp" srcset="${HERO_SRCSET_WEBP}" sizes="100vw">` +
    `<img src="${HERO_FALLBACK_SRC}" srcset="${HERO_SRCSET_JPG}" sizes="100vw" alt="" width="${HERO_WIDTH}" height="${HERO_HEIGHT}" loading="eager" fetchpriority="high" decoding="sync" style="width:100%;height:100%;object-fit:cover;object-position:center 42%">` +
    `</picture>`;

  // Visual layer — matches HeroSlider's div.hero-visual structure
  const heroVisual =
    `<div class="hero-visual" aria-hidden="true">` +
    `<div class="hero-backdrop" data-loaded="true" style="--hero-lqip:url('${heroLqip}')">` +
    heroPicture +
    `</div>` +
    `<div class="hero-scrim"></div>` +
    `<div class="hero-vignette"></div>` +
    `</div>`;

  // Hero content — matches HeroSlider's div.hero-content → div.hero-copy
  const heroContent =
    `<div class="hero-content"><div class="hero-copy">` +
    `<p class="hero-eyebrow">${escape(eyebrow)}</p>` +
    `<h1 class="hero-title">${escape(heroHeadline || '')}</h1>` +
    (heroSubline ? `<p class="hero-lead">${escape(heroSubline)}</p>` : '') +
    `</div></div>`;

  // Controls placeholder (no-slides case) — matches HeroSlider when hasSlider=false
  const heroControls = `<div class="hero-controls hero-controls-empty" aria-hidden="true"></div>`;

  // SEO supplemental text — hidden from sighted users, readable by crawlers
  let seoExtra = '';
  if (companyDescription || servicesTitle || servicesSubtitle ||
      (Array.isArray(servicesList) && servicesList.length > 0)) {
    let seoInner = '';
    if (companyDescription) seoInner += `<p>${escape(companyDescription)}</p>`;
    if (servicesTitle)       seoInner += `<h2>${escape(servicesTitle)}</h2>`;
    if (servicesSubtitle)    seoInner += `<p>${escape(servicesSubtitle)}</p>`;
    if (Array.isArray(servicesList) && servicesList.length > 0) {
      seoInner +=
        `<ul>${servicesList.map((s) => `<li>${escape(s)}</li>`).join('')}</ul>`;
    }
    seoExtra = `<div class="sr-only">${seoInner}</div>`;
  }

  // Inner section matches HeroSlider.jsx render exactly:
  // section.hero-slider.hero-stage > div.hero-shell > (visual + content + controls)
  const heroSection =
    `<section class="hero-slider hero-stage" aria-label="Company introduction">` +
    `<div class="hero-shell">` +
    heroVisual +
    heroContent +
    heroControls +
    `</div>` +
    `</section>`;

  // Outer wrapper: NO display:none, NO aria-hidden — hero is visible from first paint
  const block =
    `<div id="${PRERENDER_ID}">` +
    staticNavbar +
    heroSection +
    seoExtra +
    `</div>`;

  // No noscript override needed — hero is always visible
  return block;
}

/* ── G2. Inject block into dist/index.html ───────────────────────────── */

async function injectIntoHtml(snap) {
  let html;
  try {
    html = await readFile(DIST_INDEX, 'utf8');
  } catch {
    console.error(
      `[prerender] ERROR: dist/index.html not found at ${DIST_INDEX}\n` +
        '  Run `npm run build` before this script, or check that the Vite outDir is "dist".'
    );
    process.exit(1);
  }

  const STATIC_BLOCK = buildStaticBlock(snap);

  // Extract existing block text for diff (before any replacement).
  // Match the seo-prerender div (and optionally any preceding noscript from old builds).
  // Count <div> depth to find the exact matching </div> regardless of nesting.
  const OPEN_TAG = `<div id="${PRERENDER_ID}"`;
  let oldBlockText = null;
  let blockStart = -1;
  let blockEnd = -1;

  const openIdx = html.indexOf(OPEN_TAG);
  if (openIdx !== -1) {
    // Check for preceding noscript
    const preceding = html.slice(0, openIdx);
    const noscriptMatch = preceding.match(/<noscript>[\s\S]*?<\/noscript>\s*$/);
    blockStart = noscriptMatch ? openIdx - noscriptMatch[0].length : openIdx;

    // Walk forward counting <div> depth to find matching </div>
    let depth = 0;
    let i = openIdx;
    while (i < html.length) {
      if (html[i] === '<') {
        if (html.startsWith('<div', i) && (html[i + 4] === ' ' || html[i + 4] === '>')) depth++;
        else if (html.startsWith('</div>', i)) {
          depth--;
          if (depth === 0) { blockEnd = i + 6; break; }
        }
      }
      i++;
    }

    if (blockEnd !== -1) {
      oldBlockText = html.slice(blockStart, blockEnd);
    }
  }

  printDiff(oldBlockText, STATIC_BLOCK);

  if (blockStart !== -1 && blockEnd !== -1) {
    // Idempotent update — replace existing block (including any preceding noscript)
    html = html.slice(0, blockStart) + STATIC_BLOCK + html.slice(blockEnd);
    await writeFile(DIST_INDEX, html, 'utf8');
    console.log('[prerender] Static homepage snapshot updated in dist/index.html.');
    return;
  }

  // First injection — find the empty root div
  const EMPTY_ROOT_RE = /<div id="root"(\s*\/?)?><\/div>|<div id="root"(\s*\/?)>/;

  if (!EMPTY_ROOT_RE.test(html)) {
    if (!html.includes('<div id="root"></div>')) {
      console.warn(
        '[prerender] WARNING: could not find <div id="root"></div> in dist/index.html.\n' +
          '  The static snapshot was NOT injected. Check the Vite output structure.'
      );
      return;
    }
    html = html.replace('<div id="root"></div>', `<div id="root">${STATIC_BLOCK}</div>`);
  } else {
    html = html.replace(EMPTY_ROOT_RE, `<div id="root">${STATIC_BLOCK}</div>`);
  }

  await writeFile(DIST_INDEX, html, 'utf8');
  console.log('[prerender] Static homepage snapshot injected into dist/index.html.');
}

/* ── Main ────────────────────────────────────────────────────────────── */

async function main() {
  const updateOnly = process.argv.includes('--update-snapshot');

  // Try to fetch live data from the API
  const live = await fetchLiveData();

  let snap;

  if (live.ok) {
    console.log('\n[prerender] Live API fetch succeeded — writing snapshot ...');
    snap = await writeSnapshot(live);
    console.log('[prerender] Snapshot written to:', SNAPSHOT_PATH);
    console.log(JSON.stringify(snap, null, 2));
  } else {
    console.error(
      '\n⚠️  PRERENDER WARNING: API fetch failed after 3 retries. Using last committed snapshot.\n'
    );
    snap = await readSnapshot();
    if (!snap) {
      console.error(
        'PRERENDER ERROR: no snapshot available and API is unreachable.\n' +
          'Commit a snapshot first by running: node scripts/prerender.mjs --update-snapshot'
      );
      process.exit(1);
    }
    console.log('[prerender] Using snapshot from:', SNAPSHOT_PATH);
  }

  // E. --update-snapshot flag: exit without touching dist/index.html
  if (updateOnly) {
    console.log(
      '\n[prerender] --update-snapshot complete. Exiting without modifying dist/index.html.'
    );
    return;
  }

  // G. Inject static block into the built HTML
  await injectIntoHtml(snap);

  // ── Build summary box ────────────────────────────────────────────────
  try {
    let bs = {};
    try {
      bs = JSON.parse(await readFile(BUILD_STATUS_PATH, 'utf8'));
    } catch { /* no build-status yet */ }

    const line = (label, value) =>
      `  ${label.padEnd(18)} ${value}`;

    const logoLine = bs.logo?.status === 'downloaded'
      ? `${bs.logo.path}  (small: ${bs.logo.smallPath || 'n/a'})`
      : `UNAVAILABLE — using snapshot fallback`;

    const slidesLine = bs.slides?.status === 'downloaded'
      ? `${bs.slides.count} slide(s)`
      : `UNAVAILABLE — hero using committed variants`;

    const backdropLine = bs.heroVariants?.backdropSource || 'unknown';
    const snapSource = live.ok
      ? 'live-api (this build)'
      : 'committed snapshot (backend unreachable, generated: ' + snap._generated + ')';

    console.log('');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  KASCON BUILD SUMMARY                                   │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(line('Logo:', logoLine));
    console.log(line('Slides:', slidesLine));
    console.log(line('Backdrop source:', backdropLine));
    console.log(line('Snapshot source:', snapSource));
    console.log(line('LQIP injected:', _lqipWasInjected ? 'yes' : 'no'));
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('');
  } catch (err) {
    console.warn(`[prerender] Could not print build summary: ${err.message}`);
  }
}

main().catch((err) => {
  console.error('[prerender] FATAL:', err);
  process.exit(1);
});
