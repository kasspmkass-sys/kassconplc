#!/usr/bin/env node
/**
 * Promote legacy `/uploads/<file>` references stored in MongoDB into the
 * persistent GridFS media store.
 *
 *   node src/scripts/migrateUploads.js            # dry run (default)
 *   node src/scripts/migrateUploads.js --apply    # write changes
 *
 * Sources used to recover each file (first hit wins):
 *   1. server/kassconbackend/src/uploads/<file>   (Render uploads dir backup)
 *   2. client/public/uploads/<file>               (committed Vercel copy)
 *   3. REMOTE_UPLOADS_BASE/<file>                 (e.g. the live Render origin)
 *
 * `/media/...` refs (committed Vercel assets) and absolute http(s) URLs are
 * left untouched — they are already permanent. Values that can't be recovered
 * are left unchanged (the frontend still maps them to the Render origin).
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { migrateMediaValues, uploadMedia } from '../services/media.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const CANDIDATE_DIRS = [
  path.resolve(__dirname, '../uploads'),
  path.join(REPO_ROOT, 'client', 'public', 'uploads'),
].filter(Boolean);
const REMOTE_BASE = (process.env.REMOTE_UPLOADS_BASE || 'https://kassconbackend.onrender.com').replace(/\/$/, '');

const apply = process.argv.includes('--apply');

async function fetchRemote(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function recover(filename) {
  const safe = path.basename(filename.replace(/[\\/]/g, '/'));
  for (const dir of CANDIDATE_DIRS) {
    try {
      const p = path.join(dir, safe);
      if (fs.existsSync(p)) return fs.readFileSync(p);
    } catch { /* try next */ }
  }
  const buf = await fetchRemote(`${REMOTE_BASE}/uploads/${encodeURIComponent(safe)}`);
  if (buf && buf.length) return buf;
  return null;
}

async function main() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error('MONGODB_URI is required.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log(`Connected. mode=${apply ? 'APPLY' : 'DRY-RUN'}`);

  const stats = { recovered: 0, skipped: 0, missing: 0, alreadyPermanent: 0 };

  await migrateMediaValues(async (value) => {
    if (!value || typeof value !== 'string') return value;
    if (/^https?:\/\//i.test(value)) {
      stats.alreadyPermanent += 1;
      return value; // absolute URLs are already permanent (GridFS/blob/etc.)
    }
    if (!/^\/?uploads\//i.test(value)) {
      stats.skipped += 1;
      return value; // /media/... committed assets — leave as-is
    }
    const filename = value.replace(/^\/?uploads\//, '');
    if (!filename) return value;
    const buf = await recover(filename);
    if (!buf) {
      stats.missing += 1;
      console.log(`  ! cannot recover: ${value}`);
      return value;
    }
    const ext = filename.match(/\.([a-zA-Z0-9]+)$/)?.[1] || 'jpg';
    const mimetype = /mp4|webm|mov|m4v/.test(ext) ? 'video/mp4' : 'image/jpeg';
    let url;
    try {
      url = await uploadMedia({ buffer: buf, originalname: filename, mimetype });
    } catch (e) {
      stats.missing += 1;
      console.log(`  ! upload failed for ${value}: ${e.message}`);
      return value;
    }
    stats.recovered += 1;
    console.log(`  ${value}  ->  ${url}`);
    return url;
  }, { dryRun: !apply });

  console.log(
    `\nDone. recovered=${stats.recovered} missing=${stats.missing} ` +
      `skipped(media/other)=${stats.skipped} alreadyAbsolute=${stats.alreadyPermanent} ` +
      `- ${apply ? 'written to DB' : 'dry run, nothing written (re-run with --apply)'}`
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});