/**
 * HERO IMAGE VARIANT GENERATOR
 * ──────────────────────────────────────────────────────────────────────
 * The hero backdrop is the Largest Contentful Paint element, so it has to be
 * as small and as early as the browser can possibly make it. This script
 * takes the committed master (assets/hero-source.jpg) and emits, for a set of
 * widths, an AVIF / WebP / JPEG ladder into public/media/home/hero/.
 *
 * It also writes two things that must stay in step with the ladder:
 *   1. src/generated/heroAssets.js — srcset strings + an inline LQIP, so the
 *      component and the preload can never disagree about file names.
 *   2. the <link rel="preload"> block inside index.html, rewritten in place
 *      between markers.
 *
 * Everything it emits is deterministic: same master in, same bytes out. Run
 * it whenever the master changes, and commit the result.
 *
 *   npm run gen:hero
 *
 * CMS-first: if a qualifying CMS slide is available via the snapshot, it is
 * used as the source image instead of assets/hero-source.jpg.
 */
import sharp from 'sharp';
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { statSync, existsSync } from 'node:fs';
import { dirname, resolve, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const BUILD_STATUS_PATH = resolve(ROOT, '.build-status.json');

const FALLBACK_SOURCE    = resolve(ROOT, 'assets/hero-source.jpg');
const SNAPSHOT_PATH      = resolve(ROOT, 'src/data/site-snapshot.json');
const OUT_DIR            = resolve(ROOT, 'public/media/home/hero');
const BACKDROP_SOURCE    = resolve(OUT_DIR, '.backdrop-source');
const MODULE_OUT         = resolve(ROOT, 'src/generated/heroAssets.js');
const INDEX_HTML         = resolve(ROOT, 'index.html');

/* Widths in CSS px. The stage is full-bleed (100vw), so these are chosen to
   cover a 360–430 px phone at 2–3x, a tablet at 2x, and a desktop at 1x.
   Widths larger than the master are skipped rather than upscaled. */
const WIDTHS = [480, 768, 1024, 1280, 1600, 1920];

/* AVIF and WebP are both first-paint formats here, so they get a higher budget
   than JPEG — JPEG only exists as the last-resort source for very old
   browsers that support neither. */
const QUALITY = { avif: 50, webp: 66, jpeg: 74 };

/* The blur-up placeholder. Tiny enough to inline (~0.5 KB) so it costs no
   request and is available in the very first paint. */
const LQIP_WIDTH = 24;

const MARKER_START = '<!-- hero-preload:start -->';
const MARKER_END = '<!-- hero-preload:end -->';

const MIN_CMS_WIDTH = 1376;

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const pad = (n) => String(n).padStart(2, '0');

/* ── CMS source selection ─────────────────────────────────────────────── */

/**
 * Try to find a qualifying CMS slide from the snapshot.
 * Returns one of:
 *   { source: <path>, label: <string>, tier: 1 }               — fresh CMS slide
 *   { source: null, label: 'committed-ladder', tier: 2 }       — use committed ladder
 *   { source: <FALLBACK_SOURCE>, label: 'hero-source.jpg', tier: 3 }  — last resort
 */
async function resolveSource() {
  // ── Tier 1: fresh qualifying CMS slide ─────────────────────────────────
  let snapshot;
  try {
    const raw = await readFile(SNAPSHOT_PATH, 'utf8');
    snapshot = JSON.parse(raw);
  } catch (err) {
    console.warn(`[gen:hero] ⚠ Snapshot not readable: ${err.message}`);
    snapshot = null;
  }

  if (snapshot) {
    const paths = snapshot?.heroSlideLocalPaths;

    if (!Array.isArray(paths) || paths.length === 0) {
      console.warn('[gen:hero] ⚠ FALLBACK Tier 1 failed: heroSlideLocalPaths empty.');
    } else {
      const candidatePublicPath = paths[0];
      const candidateFile = resolve(ROOT, 'public' + candidatePublicPath);

      if (!existsSync(candidateFile)) {
        console.warn(`[gen:hero] ⚠ FALLBACK Tier 1 failed: local file not found: ${candidatePublicPath}`);
      } else {
        let meta;
        try {
          meta = await sharp(candidateFile).metadata();
        } catch (err) {
          console.warn(`[gen:hero] ⚠ FALLBACK Tier 1 failed: sharp error: ${err.message}`);
          meta = null;
        }

        if (!meta) {
          // fall through to tier 2
        } else if ((meta.width || 0) < MIN_CMS_WIDTH) {
          console.warn(`[gen:hero] ⚠ FALLBACK Tier 1 failed: image too narrow: ${meta.width}px < ${MIN_CMS_WIDTH}px (slide: ${candidatePublicPath})`);
        } else {
          // All checks passed — use CMS slide (Tier 1)
          console.log(`[gen:hero] Using CMS slide: ${candidateFile}`);
          return {
            source: candidateFile,
            label: `CMS slide ${basename(candidateFile)} from snapshot`,
            tier: 1,
            slideId: basename(candidateFile, extname(candidateFile)).replace(/^slide-/, ''),
            width: meta.width,
            height: meta.height,
            format: meta.format || 'webp',
          };
        }
      }
    }
  }

  // ── Tier 2: committed CMS-derived ladder ───────────────────────────────
  if (existsSync(BACKDROP_SOURCE)) {
    let backdropInfo = '(unreadable)';
    try {
      const lines = (await readFile(BACKDROP_SOURCE, 'utf8')).trim().split('\n');
      backdropInfo = lines[0] || backdropInfo;
    } catch { /* ignore */ }

    console.warn('[gen:hero] ⚠ FALLBACK Tier 2: CMS slide unavailable or too narrow.');
    console.warn('[gen:hero]   Using committed hero ladder (source recorded in .backdrop-source).');
    console.warn(`[gen:hero]   Last-good source: ${backdropInfo}`);
    return { source: null, label: 'committed-ladder', tier: 2 };
  }

  // ── Tier 3: hero-source.jpg ─────────────────────────────────────────────
  console.warn('[gen:hero] ⚠ FALLBACK Tier 3: No CMS slide and no committed ladder (.backdrop-source absent).');
  console.warn('[gen:hero]   Falling back to assets/hero-source.jpg.');
  return { source: FALLBACK_SOURCE, label: 'fallback (hero-source.jpg)', tier: 3 };
}

async function main() {
  const resolved = await resolveSource();
  const { source: SOURCE, label: sourceLabel, tier } = resolved;

  // ── Tier 2: committed ladder — skip re-generation ─────────────────────
  if (tier === 2) {
    console.log('[gen:hero] INFO BACKDROP: Using committed CMS-derived ladder (no fresh slide available)');

    // Rebuild heroAssets.js and preload block from existing files on disk
    await mkdir(OUT_DIR, { recursive: true });
    let existingFiles;
    try {
      existingFiles = await readdir(OUT_DIR);
    } catch {
      existingFiles = [];
    }

    const srcsets = { avif: [], webp: [], jpeg: [] };
    const heroWidths = [];
    let srcW = WIDTHS[WIDTHS.length - 1];
    let srcH = Math.round(srcW * 9 / 16); // safe default aspect

    // Parse existing files to reconstruct srcsets
    const widthSet = new Set();
    for (const f of existingFiles) {
      const m = f.match(/^hero-(\d+)\.(avif|webp|jpg)$/);
      if (m) widthSet.add(Number(m[1]));
    }
    const sortedWidths = [...widthSet].sort((a, b) => a - b);

    if (sortedWidths.length > 0) {
      srcW = sortedWidths[sortedWidths.length - 1];
      // Attempt to get real height from the largest webp
      try {
        const largest = resolve(OUT_DIR, `hero-${srcW}.webp`);
        if (existsSync(largest)) {
          const m2 = await sharp(largest).metadata();
          srcH = m2.height || srcH;
        }
      } catch { /* keep default */ }

      for (const w of sortedWidths) {
        heroWidths.push(w);
        srcsets.avif.push(`/media/home/hero/hero-${w}.avif ${w}w`);
        srcsets.webp.push(`/media/home/hero/hero-${w}.webp ${w}w`);
        srcsets.jpeg.push(`/media/home/hero/hero-${w}.jpg ${w}w`);
      }
    } else {
      // No existing files — nothing we can do but warn
      console.warn('[gen:hero] ⚠ Tier 2: no existing hero files found in OUT_DIR. heroAssets.js may be stale.');
      srcsets.avif = WIDTHS.map((w) => `/media/home/hero/hero-${w}.avif ${w}w`);
      srcsets.webp = WIDTHS.map((w) => `/media/home/hero/hero-${w}.webp ${w}w`);
      srcsets.jpeg = WIDTHS.map((w) => `/media/home/hero/hero-${w}.jpg ${w}w`);
    }

    // Re-read LQIP from existing generated module or regenerate tiny placeholder
    let lqipDataUri = '';
    try {
      const existing = await readFile(MODULE_OUT, 'utf8');
      const m = existing.match(/export const HERO_LQIP = "([^"]+)"/);
      if (m) lqipDataUri = m[1];
    } catch { /* keep empty */ }

    const j = (v) => JSON.stringify(v);
    await mkdir(dirname(MODULE_OUT), { recursive: true });
    await writeFile(
      MODULE_OUT,
      `/**
 * GENERATED FILE — do not edit by hand.
 * Produced by scripts/generate-hero-variants.mjs. Run \`npm run gen:hero\`
 * after replacing assets/hero-source.jpg.
 * Tier-2 rebuild: using committed CMS-derived ladder.
 */

/** Width/height of the master, used to reserve layout space (avoids CLS). */
export const HERO_WIDTH = ${srcW};
export const HERO_HEIGHT = ${srcH};

/** The stage is full-bleed, so the browser always wants the 100vw candidate. */
export const HERO_SIZES = '100vw';

export const HERO_SRCSET_AVIF = ${j(srcsets.avif.join(', '))};
export const HERO_SRCSET_WEBP = ${j(srcsets.webp.join(', '))};
export const HERO_SRCSET_JPG = ${j(srcsets.jpeg.join(', '))};

/** Inline blur-up placeholder — no extra request, painted immediately. */
export const HERO_LQIP = ${j(lqipDataUri)};

/** Smallest ladder rung; used as the plain \`src\` fallback. */
export const HERO_FALLBACK_SRC = ${j(srcsets.jpeg[0]?.split(' ')[0] || '/media/home/hero/hero-480.jpg')};
`,
      'utf8'
    );

    // Update preload block in index.html
    const html = await readFile(INDEX_HTML, 'utf8');
    const block = [
      MARKER_START,
      '    <!-- Preload the hero backdrop (the LCP element). Regenerated by',
      '         npm run gen:hero — keep in step with src/generated/heroAssets.js. -->',
      `    <link rel="preload" as="image" fetchpriority="high"`,
      `          imagesrcset="${srcsets.avif.join(', ')}"`,
      `          imagesizes="100vw" />`,
      MARKER_END,
    ].join('\n');

    if (!html.includes(MARKER_START) || !html.includes(MARKER_END)) {
      throw new Error(`index.html is missing the ${MARKER_START} / ${MARKER_END} markers`);
    }

    const next =
      html.slice(0, html.indexOf(MARKER_START)) +
      block +
      html.slice(html.indexOf(MARKER_END) + MARKER_END.length);
    if (next !== html) await writeFile(INDEX_HTML, next, 'utf8');

    console.log('[gen:hero] wrote    src/generated/heroAssets.js (from committed ladder)');
    console.log('[gen:hero] updated  index.html preload block (from committed ladder)');
    console.log(`[gen:hero] Backdrop source: ${sourceLabel}`);

    // Update .build-status.json
    try {
      let existing = {};
      try { existing = JSON.parse(await readFile(BUILD_STATUS_PATH, 'utf8')); } catch { /* ok */ }
      existing.heroVariants = { backdropSource: sourceLabel, widths: heroWidths, totalKb: 0, lqipBytes: 0 };
      await writeFile(BUILD_STATUS_PATH, JSON.stringify(existing, null, 2), 'utf8');
    } catch (err) {
      console.warn(`[gen:hero] Could not update .build-status.json: ${err.message}`);
    }
    return;
  }

  // ── Tier 1 or 3: re-generate the ladder ────────────────────────────────
  const meta = await sharp(SOURCE).metadata();
  const { width: srcW, height: srcH } = meta;

  console.log(`master   ${SOURCE}  ${srcW}x${srcH}  ${kb(statSync(SOURCE).size)}`);
  console.log('');

  const widths = WIDTHS.filter((w) => w <= srcW);
  if (widths.length < WIDTHS.length) {
    console.log(
      `note     skipping ${WIDTHS.filter((w) => w > srcW).join(', ')} — ` +
        'larger than the master, upscaling would only add bytes'
    );
  }

  await mkdir(OUT_DIR, { recursive: true });

  const srcsets = { avif: [], webp: [], jpeg: [] };
  const table = [];
  let total = 0;

  for (const width of widths) {
    const row = { width, height: Math.round((width * srcH) / srcW) };

    for (const format of ['avif', 'webp', 'jpeg']) {
      const name = `hero-${width}.${format === 'jpeg' ? 'jpg' : format}`;

      const info = await sharp(SOURCE)
        .resize({ width, withoutEnlargement: true })
        .toFormat(format, {
          quality: QUALITY[format],
          ...(format === 'jpeg' ? { progressive: true, mozjpeg: true } : {}),
          ...(format === 'avif' ? { effort: 6 } : {}),
        })
        .toFile(resolve(OUT_DIR, name));

      srcsets[format].push(`${`/media/home/hero/${name}`} ${width}w`);
      row[format] = info.size;
      total += info.size;
    }

    table.push(row);
    console.log(
      `${pad(width)}w  avif ${kb(row.avif).padStart(9)}  ` +
        `webp ${kb(row.webp).padStart(9)}  jpg ${kb(row.jpeg).padStart(9)}`
    );
  }

  /* ---- LQIP ---------------------------------------------------------- */
  const lqip = await sharp(SOURCE)
    .resize({ width: LQIP_WIDTH })
    .blur(0.6)
    .toFormat('webp', { quality: 42 })
    .toBuffer();
  const lqipDataUri = `data:image/webp;base64,${lqip.toString('base64')}`;
  console.log('');
  console.log(`lqip     inline ${LQIP_WIDTH}px webp  ${kb(lqip.length)}`);

  /* ---- Generated module ---------------------------------------------- */
  const j = (v) => JSON.stringify(v);

  await mkdir(dirname(MODULE_OUT), { recursive: true });
  await writeFile(
    MODULE_OUT,
    `/**
 * GENERATED FILE — do not edit by hand.
 * Produced by scripts/generate-hero-variants.mjs. Run \`npm run gen:hero\`
 * after replacing assets/hero-source.jpg.
 */

/** Width/height of the master, used to reserve layout space (avoids CLS). */
export const HERO_WIDTH = ${srcW};
export const HERO_HEIGHT = ${srcH};

/** The stage is full-bleed, so the browser always wants the 100vw candidate. */
export const HERO_SIZES = '100vw';

export const HERO_SRCSET_AVIF = ${j(srcsets.avif.join(', '))};
export const HERO_SRCSET_WEBP = ${j(srcsets.webp.join(', '))};
export const HERO_SRCSET_JPG = ${j(srcsets.jpeg.join(', '))};

/** Inline blur-up placeholder — no extra request, painted immediately. */
export const HERO_LQIP = ${j(lqipDataUri)};

/** Smallest ladder rung; used as the plain \`src\` fallback. */
export const HERO_FALLBACK_SRC = ${j(srcsets.jpeg[0].split(' ')[0])};
`,
    'utf8'
  );

  /* ---- index.html preload -------------------------------------------- */
  const html = await readFile(INDEX_HTML, 'utf8');
  const block = [
    MARKER_START,
    '    <!-- Preload the hero backdrop (the LCP element). Regenerated by',
    '         npm run gen:hero — keep in step with src/generated/heroAssets.js. -->',
    `    <link rel="preload" as="image" fetchpriority="high"`,
    `          imagesrcset="${srcsets.avif.join(', ')}"`,
    `          imagesizes="100vw" />`,
    MARKER_END,
  ].join('\n');

  if (!html.includes(MARKER_START) || !html.includes(MARKER_END)) {
    throw new Error(
      `index.html is missing the ${MARKER_START} / ${MARKER_END} markers`
    );
  }

  const next =
    html.slice(0, html.indexOf(MARKER_START)) +
    block +
    html.slice(html.indexOf(MARKER_END) + MARKER_END.length);

  if (next !== html) await writeFile(INDEX_HTML, next, 'utf8');

  /* ---- Write/update .backdrop-source after fresh Tier-1 generation ---- */
  if (tier === 1) {
    const slideId = resolved.slideId || basename(SOURCE, extname(SOURCE)).replace(/^slide-/, '');
    const w = resolved.width || srcW;
    const h = resolved.height || srcH;
    const fmt = resolved.format || 'webp';
    const ts = new Date().toISOString();
    await writeFile(
      BACKDROP_SOURCE,
      `slide:${slideId}\ngenerated:${ts}\nsource:CMS heroSlides[0] (${w}x${h} ${fmt.toUpperCase()})\n`,
      'utf8'
    );
    console.log('[gen:hero] .backdrop-source updated.');
  }

  /* ---- Report --------------------------------------------------------- */
  console.log('');
  console.log(`total    ${table.length} widths x 3 formats = ${kb(total)}`);
  console.log(`master   ${kb(statSync(SOURCE).size)} (source, no responsive sizing)`);
  console.log('');
  console.log(`wrote    public/media/home/hero/`);
  console.log(`wrote    src/generated/heroAssets.js`);
  console.log(`updated  index.html preload block`);
  console.log(`[gen:hero] Backdrop source: ${sourceLabel}`);

  /* ---- Update .build-status.json ------------------------------------ */
  try {
    let existing = {};
    try {
      existing = JSON.parse(await readFile(BUILD_STATUS_PATH, 'utf8'));
    } catch { /* first run — no file yet */ }
    existing.heroVariants = {
      backdropSource: sourceLabel,
      widths: widths,
      totalKb: Math.round(total / 1024),
      lqipBytes: lqip.length,
    };
    await writeFile(BUILD_STATUS_PATH, JSON.stringify(existing, null, 2), 'utf8');
    console.log('[gen:hero] .build-status.json updated with heroVariants.');
  } catch (err) {
    console.warn(`[gen:hero] Could not update .build-status.json: ${err.message}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
