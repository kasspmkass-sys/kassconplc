/**
 * SOCIAL / PWA ASSET GENERATOR
 * ──────────────────────────────────────────────────────────────────────
 * Crawlers and home screens need images that no component currently renders:
 *
 *   public/og-image.jpg        1200x630  Open Graph / Twitter card
 *   public/apple-touch-icon.png  180x180  iOS home screen
 *   public/icon-192.png         192x192  PWA manifest
 *   public/icon-512.png         512x512  PWA manifest + JSON-LD organization logo
 *
 * Nothing here is designed or invented — every byte is a crop/resize of an
 * asset already committed under public/. The og image comes from the hero
 * master, which is the highest-resolution brand photograph on the site; the
 * square icons come from favicon.svg, which is vector, so any size is sharp.
 *
 * Outputs are deterministic: same sources in, same bytes out. Run
 *
 *   npm run gen:social
 *
 * whenever a source changes, and commit the result.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = resolve(ROOT, 'public');

/** Highest-resolution brand photograph in the repo (1280x853). */
const OG_SOURCE = resolve(PUBLIC, 'media/home/hero.jpg');

/** Vector site mark. Rasterising beats upscaling the 110x87 media/logo.png,
 *  which is below Google's 112x112 minimum for an organization logo. */
const ICON_SOURCE = resolve(PUBLIC, 'favicon.svg');

/* The Open Graph / Twitter summary_large_image ratio. */
const OG_SIZE = { width: 1200, height: 630 };

/* iOS does not letterbox apple-touch-icon and ignores transparency, so this
   one is opaque by construction (the source SVG has a full-bleed rect). */
const ICON_SIZES = [180, 192, 512];

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

async function ogImage() {
  const meta = await sharp(OG_SOURCE).metadata();
  console.log(
    `source  media/home/hero.jpg  ${meta.width}x${meta.height}  ${kb(statSync(OG_SOURCE).size)}`
  );

  if (meta.width < OG_SIZE.width || meta.height < OG_SIZE.height) {
    throw new Error(
      `media/home/hero.jpg is ${meta.width}x${meta.height}, smaller than the ` +
        `${OG_SIZE.width}x${OG_SIZE.height} og image — replace the source instead of upscaling`
    );
  }

  const out = resolve(PUBLIC, 'og-image.jpg');
  const info = await sharp(OG_SOURCE)
    .resize({ ...OG_SIZE, fit: 'cover', position: 'centre' })
    .toFormat('jpeg', { quality: 82, progressive: true, mozjpeg: true })
    .toFile(out);

  console.log(
    `og      public/og-image.jpg  ${OG_SIZE.width}x${OG_SIZE.height}  ${kb(info.size)}`
  );
}

async function icons() {
  const meta = await sharp(ICON_SOURCE).metadata();
  console.log(`source  favicon.svg  viewBox ${meta.width}x${meta.height}`);

  for (const size of ICON_SIZES) {
    const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
    const out = resolve(PUBLIC, name);

    const info = await sharp(ICON_SOURCE, { density: 384 })
      .resize({ width: size, height: size, fit: 'contain' })
      /* favicon.svg leaves its rx="12" corners transparent. iOS composites an
         alpha apple-touch-icon onto black, and both iOS and Android apply
         their own mask anyway, so the icons ship fully opaque. */
      .flatten({ background: '#0B1E33' })
      .toFormat('png', { compressionLevel: 9 })
      .toFile(out);

    console.log(`icon    public/${name}  ${size}x${size}  ${kb(info.size)}`);
  }
}

async function main() {
  await mkdir(PUBLIC, { recursive: true });
  await ogImage();
  await icons();
  console.log('');
  console.log('wrote   public/og-image.jpg');
  console.log('wrote   public/apple-touch-icon.png');
  console.log('wrote   public/icon-192.png');
  console.log('wrote   public/icon-512.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});