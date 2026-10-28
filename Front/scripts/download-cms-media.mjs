/**
 * CMS MEDIA DOWNLOADER
 * ──────────────────────────────────────────────────────────────────────
 * Downloads the logo and hero-slide images from the CMS backend at build
 * time so they can be served from Vercel's CDN rather than the Render API.
 *
 * Reads:   https://kassconbackend.onrender.com/api/settings/public
 * Writes:  public/media/cms/logo-{hash}.{ext}
 *          public/media/cms/slides/slide-{hash}.{ext}
 * Updates: src/data/site-snapshot.json   (logoLocalPath, logoWidth,
 *                                         logoHeight, heroSlideLocalPaths)
 *
 * Runs automatically via `npm run prebuild` (before gen:hero and gen:seo).
 * Every failure is recoverable — the build never fails because of this step.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT          = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = resolve(ROOT, 'src/data/site-snapshot.json');
const LOGO_DIR      = resolve(ROOT, 'public/media/cms');
const SLIDES_DIR    = resolve(ROOT, 'public/media/cms/slides');
const BUILD_STATUS_PATH = resolve(ROOT, '.build-status.json');

// CMS_API_URL env var overrides the default. Set it in .env or the Vercel build environment
// when the backend moves away from the default Render.com URL.
const CMS_API_BASE = (process.env.CMS_API_URL || 'https://kassconbackend.onrender.com/api').replace(/\/+$/, '');
const API_URL      = `${CMS_API_BASE}/settings/public`;
// Per-attempt timeouts for fetchSettings() (cold-start allowance on first attempt)
const FIRST_ATTEMPT_TIMEOUT_MS = 30_000;
const RETRY_TIMEOUT_MS         = 10_000;
// Per-attempt timeout for fetchToBuffer() (logo/slides — full URL, no cold-start needed)
const TIMEOUT_MS          = 10_000;
const MAX_RETRIES         = 2;
const RETRY_DELAY         = 1_000;
const OVERALL_DEADLINE_MS = 60_000;

const MIN_LOGO_WIDTH  = 76;  // logoSize 38 * 2x
const MIN_SLIDE_WIDTH = 1376;

/* ── Helpers ─────────────────────────────────────────────────────────── */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function md5(buf) {
  return createHash('md5').update(buf).digest('hex');
}

function extFromContentType(ct) {
  if (!ct) return null;
  if (ct.includes('image/jpeg'))   return 'jpg';
  if (ct.includes('image/png'))    return 'png';
  if (ct.includes('image/webp'))   return 'webp';
  if (ct.includes('image/svg+xml')) return 'svg';
  if (ct.includes('image/avif'))   return 'avif';
  if (ct.includes('image/gif'))    return 'gif';
  return null;
}

function extFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const e = extname(pathname).replace('.', '').toLowerCase();
    if (['jpg','jpeg','png','webp','svg','avif','gif'].includes(e)) {
      return e === 'jpeg' ? 'jpg' : e;
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Fetch a URL to a Buffer with timeout. Retries up to MAX_RETRIES.
 * Returns { ok: true, buffer, contentType } or { ok: false, error }.
 */
async function fetchToBuffer(url) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const contentType = res.headers.get('content-type') || '';
      return { ok: true, buffer, contentType };
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      console.warn(`[download:media] Attempt ${attempt}/${MAX_RETRIES} failed for ${url}: ${err.message}`);
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY);
    }
  }
  return { ok: false, error: lastErr };
}

/**
 * Fetch settings/public with retry. Returns parsed JSON or null.
 */
async function fetchSettings() {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // First attempt: 30s to allow a cold-start Render backend to wake up.
    // Retry: 10s — if it didn't respond in 30s it won't respond quickly.
    const timeoutMs = attempt === 1 ? FIRST_ATTEMPT_TIMEOUT_MS : RETRY_TIMEOUT_MS;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    console.log(`[download:media] Attempt ${attempt}/${MAX_RETRIES} settings fetch (timeout ${timeoutMs / 1000}s): ${API_URL}`);
    try {
      const res = await fetch(API_URL, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const data = await res.json();
      return data;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      console.warn(`[download:media] Attempt ${attempt}/${MAX_RETRIES} settings fetch failed: ${err.message}`);
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY);
    }
  }
  console.error(`\n⚠️  DOWNLOAD WARNING: failed to fetch settings — ${lastErr?.message}.\n`);
  return null;
}

/* ── Logo download ───────────────────────────────────────────────────── */

async function downloadLogo(logoUrl, existingSnapshot) {
  console.log(`[download:media] Downloading logo: ${logoUrl}`);
  const result = await fetchToBuffer(logoUrl);

  if (!result.ok) {
    const msg = result.error?.message || String(result.error);
    console.error(`\n⚠️  DOWNLOAD WARNING: failed to download logo — ${msg}. Using previous local copy / original URL.\n`);
    // Keep existing logoLocalPath if available
    if (existingSnapshot?.logoLocalPath) {
      return {
        logoLocalPath: existingSnapshot.logoLocalPath,
        logoWidth:     existingSnapshot.logoWidth,
        logoHeight:    existingSnapshot.logoHeight,
        logoSmallPath:   existingSnapshot.logoSmallPath   || null,
        logoSmallWidth:  existingSnapshot.logoSmallWidth  || null,
        logoSmallHeight: existingSnapshot.logoSmallHeight || null,
        logoSmallSize:   existingSnapshot.logoSmallSize   || null,
      };
    }
    return {};
  }

  const { buffer, contentType } = result;
  const ext = extFromContentType(contentType) || extFromUrl(logoUrl) || 'jpg';
  const hash = md5(buffer);
  const filename = `logo-${hash}.${ext}`;
  const filePath = resolve(LOGO_DIR, filename);
  const publicPath = `/media/cms/${filename}`;

  // Get dimensions via sharp
  let logoWidth = null;
  let logoHeight = null;
  try {
    const meta = await sharp(buffer).metadata();
    logoWidth  = meta.width  || null;
    logoHeight = meta.height || null;

    if (logoWidth !== null && logoWidth < MIN_LOGO_WIDTH) {
      console.warn(
        `\n⚠️  LOGO WARNING: logo natural width is ${logoWidth}px — blurry at 2×. Re-upload a ≥${MIN_LOGO_WIDTH}px version.\n`
      );
    }
  } catch (err) {
    console.warn(`[download:media] sharp metadata failed for logo: ${err.message}`);
  }

  await mkdir(LOGO_DIR, { recursive: true });
  await writeFile(filePath, buffer);
  console.log(`[download:media] Logo saved: ${publicPath} (${logoWidth}×${logoHeight})`);

  // Generate 160px-wide WebP thumbnail for prerender/navbar static block
  let logoSmallPath = null;
  let logoSmallWidth = null;
  let logoSmallHeight = null;
  let logoSmallSize = null;
  try {
    const smResult = await sharp(buffer)
      .resize({ width: 160, withoutEnlargement: false })
      .toFormat('webp', { quality: 85 })
      .toBuffer({ resolveWithObject: true });
    const smFilename = `logo-${hash}-sm.webp`;
    const smFilePath = resolve(LOGO_DIR, smFilename);
    await writeFile(smFilePath, smResult.data);
    logoSmallPath   = `/media/cms/${smFilename}`;
    logoSmallWidth  = smResult.info.width;
    logoSmallHeight = smResult.info.height;
    logoSmallSize   = smResult.info.size;
    console.log(`[download:media] Logo thumbnail saved: ${logoSmallPath} (${logoSmallWidth}×${logoSmallHeight}, ${logoSmallSize} bytes)`);
    console.log(`[download:media] Logo size: original ${buffer.length} bytes → small ${logoSmallSize} bytes (ratio: ${(logoSmallSize / buffer.length * 100).toFixed(1)}%)`);
  } catch (err) {
    console.warn(`[download:media] Could not generate logo thumbnail: ${err.message}`);
  }

  return { logoLocalPath: publicPath, logoWidth, logoHeight, logoSmallPath, logoSmallWidth, logoSmallHeight, logoSmallSize };
}

/* ── Slide download ──────────────────────────────────────────────────── */

async function downloadSlides(slideUrls, overallDeadline) {
  if (!Array.isArray(slideUrls) || slideUrls.length === 0) {
    console.log('[download:media] No hero slides to download.');
    return [];
  }

  await mkdir(SLIDES_DIR, { recursive: true });
  const localPaths = [];

  for (const url of slideUrls) {
    if (Date.now() > overallDeadline) {
      console.warn('[download:media] ⚠ Overall 60s deadline reached — skipping remaining slides.');
      break;
    }

    console.log(`[download:media] Downloading slide: ${url}`);
    const result = await fetchToBuffer(url);

    if (!result.ok) {
      const msg = result.error?.message || String(result.error);
      console.warn(`\n⚠️  DOWNLOAD WARNING: failed to download slide ${url} — ${msg}. Skipping.\n`);
      continue;
    }

    const { buffer, contentType } = result;

    // Verify width with sharp
    let slideWidth = null;
    try {
      const meta = await sharp(buffer).metadata();
      slideWidth = meta.width || 0;
    } catch (err) {
      console.warn(`[download:media] sharp metadata failed for slide ${url}: ${err.message}. Skipping.`);
      continue;
    }

    if (slideWidth < MIN_SLIDE_WIDTH) {
      console.warn(
        `\n⚠️  PRERENDER WARNING: slide ${url} rejected — natural width ${slideWidth}px < ${MIN_SLIDE_WIDTH}px minimum. Using fallback.\n`
      );
      continue;
    }

    const ext = extFromContentType(contentType) || extFromUrl(url) || 'jpg';
    const hash = md5(buffer);
    const filename = `slide-${hash}.${ext}`;
    const filePath = resolve(SLIDES_DIR, filename);
    const publicPath = `/media/cms/slides/${filename}`;

    await writeFile(filePath, buffer);
    console.log(`[download:media] Slide saved: ${publicPath} (${slideWidth}px wide)`);
    localPaths.push(publicPath);
  }

  return localPaths;
}

/* ── Snapshot update ─────────────────────────────────────────────────── */

async function readSnapshot() {
  try {
    const raw = await readFile(SNAPSHOT_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function updateSnapshot(patch) {
  const existing = await readSnapshot();
  const merged = { ...existing, ...patch };
  await writeFile(SNAPSHOT_PATH, JSON.stringify(merged, null, 2), 'utf8');
  console.log('[download:media] Snapshot updated:', SNAPSHOT_PATH);
}

/* ── Main ────────────────────────────────────────────────────────────── */

async function main() {
  const overallDeadline = Date.now() + OVERALL_DEADLINE_MS;
  console.log('[download:media] Fetching CMS settings...');
  const settingsData = await fetchSettings();

  if (!settingsData) {
    console.warn('[download:media] No settings data — skipping media download. Using existing snapshot values.');
    return;
  }

  // Unwrap the settings object (may be wrapped in { settings: {} } or { data: {} })
  const s = settingsData?.settings ?? settingsData?.data ?? settingsData;

  const logoUrl    = s?.logo || null;
  const slideUrls  = Array.isArray(s?.heroSlides) ? s.heroSlides : [];

  console.log(`[download:media] Logo URL: ${logoUrl}`);
  console.log(`[download:media] Slide count: ${slideUrls.length}`);

  const existingSnapshot = await readSnapshot();
  const patch = {};

  // Download logo
  if (Date.now() > overallDeadline) {
    console.warn('[download:media] ⚠ Overall 60s deadline reached before logo download — skipping.');
  } else if (logoUrl) {
    const logoResult = await downloadLogo(logoUrl, existingSnapshot);
    if (logoResult.logoLocalPath) {
      patch.logoLocalPath = logoResult.logoLocalPath;
      if (logoResult.logoWidth  != null) patch.logoWidth  = logoResult.logoWidth;
      if (logoResult.logoHeight != null) patch.logoHeight = logoResult.logoHeight;
      if (logoResult.logoSmallPath   != null) patch.logoSmallPath   = logoResult.logoSmallPath;
      if (logoResult.logoSmallWidth  != null) patch.logoSmallWidth  = logoResult.logoSmallWidth;
      if (logoResult.logoSmallHeight != null) patch.logoSmallHeight = logoResult.logoSmallHeight;
      if (logoResult.logoSmallSize   != null) patch.logoSmallSize   = logoResult.logoSmallSize;
    }
  } else {
    console.warn('[download:media] No logo URL in settings — skipping logo download.');
  }

  // Download slides
  const heroSlideLocalPaths = await downloadSlides(slideUrls, overallDeadline);
  patch.heroSlideLocalPaths = heroSlideLocalPaths;

  // Merge into snapshot
  await updateSnapshot(patch);

  // Write .build-status.json
  const buildStatus = {
    logo: patch.logoLocalPath
      ? {
          path: patch.logoLocalPath,
          smallPath: patch.logoSmallPath || null,
          width: patch.logoWidth || null,
          height: patch.logoHeight || null,
          smallWidth: patch.logoSmallWidth || null,
          smallHeight: patch.logoSmallHeight || null,
          smallSize: patch.logoSmallSize || null,
          status: 'downloaded',
        }
      : { path: null, status: 'unavailable' },
    slides: {
      count: heroSlideLocalPaths.length,
      paths: heroSlideLocalPaths,
      status: heroSlideLocalPaths.length > 0 ? 'downloaded' : 'unavailable',
    },
  };
  await writeFile(BUILD_STATUS_PATH, JSON.stringify(buildStatus, null, 2), 'utf8');
  console.log('[download:media] .build-status.json written.');

  console.log('[download:media] Done.');
  if (patch.logoLocalPath) console.log(`  logo:   ${patch.logoLocalPath}`);
  console.log(`  slides: ${heroSlideLocalPaths.length} qualifying slides`);
}

main().catch((err) => {
  // Never fail the build — print the error and exit cleanly
  console.error(`\n⚠️  DOWNLOAD WARNING: download-cms-media.mjs encountered an error: ${err.message}\n`);
  console.error(err);
  process.exit(0);
});
