import mongoose from 'mongoose';
import crypto from 'crypto';
import { Readable } from 'stream';
import Settings from '../models/Settings.js';
import Project from '../models/Project.js';
import Service from '../models/Service.js';
import TeamMember from '../models/Team.js';
import WhatWeBuild from '../models/WhatWeBuild.js';
import Equipment from '../models/Equipment.js';
import NewsUpdate from '../models/NewsUpdate.js';
import Document from '../models/Document.js';
import { Client, Award, Testimonial, Milestone, Gallery, Career } from '../models/Content.js';

let _bucket = null;

/** GridFSBucket lazily bound to the connected Mongo database. */
export function getBucket() {
  if (!mongoose.connection || !mongoose.connection.db) {
    throw new Error('MongoDB not connected');
  }
  if (!_bucket) {
    _bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'media',
      chunkSizeBytes: 255 * 1024,
    });
  }
  return _bucket;
}

/**
 * Parse a stored URL / token into a GridFS file id.
 * Accepts: absolute `https://host/api/media/<id>`, `/api/media/<id>`,
 * `media:<id>`, or a raw ObjectId/hex id.
 */
export function mediaIdFromUrl(url) {
  if (!url) return null;
  const s = String(url);
  const m = s.match(/(?:^|[\/:])([0-9a-fA-F]{24})(?:$|[\/?])/);
  return m ? m[1] : null;
}

/**
 * Reject file uploads whose actual content does not match the declared image /
 * video formats (magic-byte sniffing, not just the filename extension).
 */
const IMAGE_SIGNATURES = [
  { name: 'jpeg', magic: [0xff, 0xd8, 0xff] },
  { name: 'png', magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { name: 'gif', magic: [0x47, 0x49, 0x46, 0x38] },
  { name: 'webp', magic: [], webp: true },
];
const VIDEO_SIGNATURES = [
  { name: 'mp4', magic: [], ftyp: true },
  { name: 'webm', magic: [0x1a, 0x45, 0xdf, 0xa3] },
];

function hasPrefix(buf, magic) {
  if (buf.length < magic.length) return false;
  return magic.every((byte, i) => buf[i] === byte);
}

function isWebp(buf) {
  return buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
}

function isFtyp(buf) {
  return buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp';
}

export function assertValidMedia({ buffer, originalname, mimetype }) {
  const ext = (originalname || '').match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase() || '';
  const has = (m) => (m.webp ? isWebp(buffer) : m.ftyp ? isFtyp(buffer) : hasPrefix(buffer, m.magic));
  const isImg = IMAGE_SIGNATURES.some((m) => has(m));
  const isVid = VIDEO_SIGNATURES.some((m) => has(m));

  // Validate by magic bytes first — these cannot be faked via filename.
  if (isImg) {
    // Accept any image extension (jpg, jpeg, png, webp, gif) or no extension,
    // and also accept when the MIME type indicates an image.
    const imgExt = !ext || /jpe?g|png|webp|gif/.test(ext);
    const imgMime = /^image\//i.test(mimetype || '');
    if (imgExt || imgMime) return;
    const err = new Error('File type mismatch: image bytes but non-image extension');
    err.status = 400;
    throw err;
  }
  if (isVid) {
    const vidExt = !ext || /mp4|webm|mov|m4v/.test(ext);
    const vidMime = /^video\//i.test(mimetype || '');
    if (vidExt || vidMime) return;
    const err = new Error('File type mismatch: video bytes but non-video extension');
    err.status = 400;
    throw err;
  }
  const err = new Error('Unsupported file type. Upload a JPG, PNG, WebP or GIF image.');
  err.status = 400;
  throw err;
}

/**
 * Upload a buffer (image or video) into GridFS.
 * Returns the permanent absolute public URL stored in the database.
 */
export async function uploadMedia({ buffer, originalname, mimetype }) {
  assertValidMedia({ buffer, originalname, mimetype });
  const bucket = getBucket();
  const ext = (originalname || '').match(/\.([a-zA-Z0-9]+)$/)?.[1] || '';
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext.toLowerCase()}`;
  const id = new mongoose.Types.ObjectId();

  await new Promise((resolve, reject) => {
    const stream = bucket.openUploadStreamWithId(id, filename, {
      contentType: mimetype || 'application/octet-stream',
      metadata: { kind: /^video\//.test(mimetype || '') ? 'video' : 'image', originalname },
    });
    stream.on('error', reject);
    stream.on('finish', resolve);
    stream.end(buffer);
  });

  return mediaUrl(id);
}

/** Build the absolute URL for a GridFS id (used as the DB value). */
export function mediaUrl(id) {
  const origin = (process.env.MEDIA_URL || process.env.SELF_URL || '').replace(/\/$/, '');
  const base = origin || 'https://kassconbackend.onrender.com';
  return `${base}/api/media/${id}`;
}

/** Stream a stored file to the response (public GET /api/media/:id). */
export function streamMedia(id, res) {
  const bucket = getBucket();
  const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
  if (!objectId) return null;
  const stream = bucket.openDownloadStream(objectId);
  stream.on('error', (err) => {
    if (/does not exist/i.test(err?.message)) {
      if (!res.headersSent) res.status(404).json({ message: 'Media not found' });
    } else if (!res.headersSent) {
      res.status(500).json({ message: err.message });
    }
  });
  stream.on('file', (file) => {
    res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  });
  stream.pipe(res);
  return stream;
}

/** Delete a stored file by GridFS id (chunks + document). */
export async function deleteMedia(id) {
  const bucket = getBucket();
  const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
  if (!objectId) return { deleted: false, reason: 'invalid id' };
  await bucket.delete(objectId);
  return { deleted: true };
}

/* ====================================================================
 *  Project image path management.
 *
 *  Project images live under stable, human-friendly paths:
 *
 *      /media/projects/<name>.jpg
 *
 *  The <name> is the project's *assigned* filename: it is recovered from
 *  whatever value the CMS currently stores (a valid path, a Windows local
 *  path, an old URL, ...) and otherwise generated deterministically from
 *  the project title + field slot. Replacing an image therefore keeps the
 *  exact same path — the old value is never kept, and nothing is ever
 *  uploaded under a random GridFS id for a project.
 * ==================================================================== */

const PROJECT_MEDIA_PREFIX = '/media/projects/';
const PROJECT_DIR = 'projects';
const STATIC_ORIGIN = (process.env.STATIC_ORIGIN || 'https://kassconcp.vercel.app').replace(/\/$/, '');

/** Same tiny non-cryptographic hash as client/src/utils/projectMedia.js (must stay in sync). */
function fnv1a(s) {
  let h = 2166136261;
  for (const ch of String(s)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function isSafeProjectBasename(name) {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}\.(jpg|jpeg|png|webp|gif)$/i.test(String(name || ''));
}

/** Legacy auto-names (timestamp-random bytes) are never treated as assigned names. */
function isRandomUploadName(name) {
  return /^\d{10,}-[a-f0-9]+\.(jpg|jpeg|png|webp|gif)$/i.test(String(name || ''));
}

function slugify(text) {
  return (
    String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'project'
  );
}

/** Deterministic generated name for a (project title, field slot) — stable across re-uploads. */
export function generatedProjectBasename({ title = '', index = 0, key = 'image' } = {}) {
  const base = slugify(title);
  return `${base}-${fnv1a(`${base}#${index}#${key}`)}.jpg`;
}

/**
 * Pull the assigned filename out of a stored value when it can be recognised:
 *  - `/media/projects/p-14.jpg`                      -> p-14.jpg
 *  - `C:\Users\...\p-14.jpg` (Windows path)          -> p-14.jpg
 *  - `https://.../media/projects/site-14.jpg` (old URL)
 *  - any other string containing a safe filename
 * Returns null when the value holds no recognisable assigned name.
 */
function recoverProjectBasename(value) {
  const s = String(value || '');
  const last = (s.split(/[\\/]/).pop() || s).split(/[?#]/)[0].trim();
  if (isSafeProjectBasename(last) && !isRandomUploadName(last)) return last.toLowerCase();
  const m = s.match(/[A-Za-z0-9][A-Za-z0-9_-]{0,63}\.(jpg|jpeg|png|webp|gif)\b/i);
  if (m && !isRandomUploadName(m[0])) return m[0].toLowerCase();
  return null;
}

/**
 * Resolve any response a project image field could hold to a canonical
 * path and the assigned filename.
 *
 * Paths are preserved as-is when they reference an existing serving
 * scheme (`/uploads/...`, `/api/media/<id>`, absolute URLs). Only broken
 * values (Windows filesystem paths, bare filenames) are normalised to
 * `/media/projects/<name>`.
 *
 * Returns `{ path, name, recovered }`:
 *  - path is null only when the input was empty (callers then keep the empty value)
 *  - name is the stable basename when a `/media/projects/` path is produced, null otherwise
 *  - recovered=true means the value was already usable or was recognisable
 *  - recovered=false means a fresh deterministic name was generated
 */
export function projectImagePath(value, { title = '', index = 0, key = 'image' } = {}) {
  if (value == null || String(value).trim() === '') {
    return { path: null, name: generatedProjectBasename({ title, index, key }), recovered: false };
  }
  const s = String(value).trim();

  // Already canonical
  if (s.startsWith(PROJECT_MEDIA_PREFIX)) {
    const name = s.slice(PROJECT_MEDIA_PREFIX.length);
    if (isSafeProjectBasename(name)) return { path: s, name, recovered: true };
  }

  // Legacy /uploads — served by backend express.static, keep as-is
  if (s.startsWith('/uploads/')) {
    return { path: s, name: null, recovered: true };
  }

  // GridFS reference — permanent and working, keep as-is
  if (s.startsWith('/api/media/') || s.startsWith('media:')) {
    return { path: s, name: null, recovered: true };
  }

  // Absolute URL — keep as-is
  if (/^https?:\/\//i.test(s)) {
    return { path: s, name: null, recovered: true };
  }

  // Windows filesystem path or contains backslashes — slugify basename
  if (/^[a-zA-Z]:[\\/]/.test(s) || s.includes('\\')) {
    const rawName = (s.split(/[\\/]/).pop() || '').split(/[?#]/)[0].trim();
    if (rawName) {
      const ext = (rawName.match(/\.([a-zA-Z0-9]+)$/) || [])[1] || 'jpg';
      const base = rawName.replace(/\.[^.]+$/, '');
      const slug = base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'project';
      const name = `${slug}.${ext}`;
      if (isSafeProjectBasename(name)) {
        return { path: `${PROJECT_MEDIA_PREFIX}${name}`, name, recovered: true };
      }
    }
  }

  // Try to recover a safe basename from any other value
  const recovered = recoverProjectBasename(s);
  if (recovered) return { path: `${PROJECT_MEDIA_PREFIX}${recovered}`, name: recovered, recovered: true };

  const name = generatedProjectBasename({ title, index, key });
  return { path: `${PROJECT_MEDIA_PREFIX}${name}`, name, recovered: false };
}

/** Normalize the image fields of a project body (also used by the CRUD sanitizer). */
export function sanitizeProjectImageFields(patch, existing) {
  const title = existing && existing.title ? existing.title : patch.title;
  const out = {};
  if (patch.coverImage != null) {
    const { path } = projectImagePath(patch.coverImage, { title, index: 0, key: 'cover' });
    out.coverImage = path === null ? '' : path;
  }
  if (Array.isArray(patch.images)) {
    out.images = patch.images
      .map((v, i) => {
        if (v == null) return null;
        const { path } = projectImagePath(v, { title, index: i, key: 'gallery' });
        return path === null ? '' : path;
      })
      .filter((v) => v !== '' && v != null);
  }
  return out;
}

/**
 * Find a GridFS project image by its assigned name, newest first
 * (a project slot can only hold one file, but be defensive).
 */
async function findProjectMediaFile(name) {
  const bucket = getBucket();
  const files = await bucket.find({ filename: `${PROJECT_DIR}/${name}` }).sort({ uploadDate: -1 }).limit(1).toArray();
  return files[0] || null;
}

/**
 * Replace/upload a project image into its stable GridFS slot.
 * Any previous copy under the same assigned name is removed first, so the
 * public path `/media/projects/<name>` always serves the newest upload.
 */
export async function upsertProjectMedia({ buffer, originalname, mimetype, name }) {
  if (!isSafeProjectBasename(name)) {
    const err = new Error('Invalid project image name');
    err.status = 400;
    throw err;
  }
  assertValidMedia({ buffer, originalname });
  const bucket = getBucket();
  const stale = await bucket.find({ filename: `${PROJECT_DIR}/${name}` }).toArray();
  for (const f of stale) {
    try {
      await bucket.delete(f._id);
    } catch {
      /* ignore non-existent copies */
    }
  }
  const id = new mongoose.Types.ObjectId();
  await new Promise((resolve, reject) => {
    const stream = bucket.openUploadStreamWithId(id, `${PROJECT_DIR}/${name}`, {
      contentType: mimetype || 'image/jpeg',
      metadata: { kind: 'image', originalname: name },
    });
    stream.on('error', reject);
    stream.on('finish', resolve);
    stream.end(buffer);
  });
  return `${PROJECT_MEDIA_PREFIX}${name}`;
}

/**
 * Public `GET /media/projects/:name`.
 * Serves the stored (replaced) image from GridFS; falls back to the committed
 * static copy on the frontend origin so established project images keep
 * working without any migration. Cache-aware: a replaced image shows within
 * a minute, never an immutable stale copy.
 */
export async function streamProjectMedia(name, res) {
  if (!isSafeProjectBasename(name)) {
    if (!res.headersSent) res.status(404).json({ message: 'Media not found' });
    return;
  }
  try {
    const file = await findProjectMediaFile(name);
    if (!file) return pipeStaticProjectMedia(name, res);
    const stream = getBucket().openDownloadStream(file._id);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).json({ message: 'Media not found' });
    });
    stream.on('file', () => {
      res.setHeader('Content-Type', file.contentType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    });
    stream.pipe(res);
  } catch {
    pipeStaticProjectMedia(name, res);
  }
}

async function pipeStaticProjectMedia(name, res) {
  try {
    const r = await fetch(`${STATIC_ORIGIN}/media/projects/${encodeURIComponent(name)}`, { redirect: 'follow' });
    if (!r.ok || !r.body) {
      if (!res.headersSent) res.status(404).json({ message: 'Media not found' });
      return;
    }
    if (!res.headersSent) {
      res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    Readable.fromWeb(r.body).pipe(res);
  } catch {
    if (!res.headersSent) res.status(404).json({ message: 'Media not found' });
  }
}

/**
 * Repair pass: walk every project and normalise coverImage + images[] to
 * canonical `/media/projects/<name>` paths. Valid assigned paths are kept
 * untouched; broken values (Windows paths, old URLs, random GridFS URLs)
 * become their recovered/assigned name or, when none exists, a deterministic
 * generated name. Idempotent — safe to run on every boot.
 */
export async function repairProjectImagePaths({ dryRun = true } = {}) {
  const report = [];
  const docs = await Project.find().lean();
  for (const doc of docs) {
    const title = doc.title;
    const originalImages = doc.images || [];
    const mappedImages = originalImages.map((v, i) =>
      v == null ? null : projectImagePath(v, { title, index: i, key: 'gallery' })
    );
    const nextImages = mappedImages.map((r) => (r ? r.path : null));
    const imagesChanged = originalImages.some((from, i) => from !== nextImages[i]);

    let cover = null;
    if (doc.coverImage) {
      const r = projectImagePath(doc.coverImage, { title, index: 0, key: 'cover' });
      if (r.path !== doc.coverImage) cover = { from: doc.coverImage, to: r.path };
    }

    if (!cover && !imagesChanged) continue;
    const patch = {};
    if (cover) patch.coverImage = cover.to;
    if (imagesChanged) patch.images = nextImages;
    if (!dryRun) await Project.updateOne({ _id: doc._id }, { $set: patch });
    report.push({
      _id: doc._id,
      title,
      cover: cover ? { from: cover.from, to: cover.to } : null,
      gallery: imagesChanged
        ? originalImages.map((from, i) => ({ from, to: nextImages[i] })).filter((x) => x.from !== x.to)
        : [],
    });
  }
  return { stats: { inspected: docs.length, changed: report.length }, report };
}

/**
 * Reference-counting delete: only remove the stored object when its URL is no
 * longer used by any CMS document. Prevents removing an image that a project,
 * service, team member or settings page still points to.
 */
function collectStringValues(value, acc, visited = new Set()) {
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && value) acc.add(value);
    return acc;
  }
  const key = String(value._id || '') + ':' + Object.keys(value).length;
  if (visited.has(key)) return acc;
  visited.add(key);
  if (Array.isArray(value)) {
    for (const v of value) collectStringValues(v, acc, visited);
  } else {
    for (const v of Object.values(value)) collectStringValues(v, acc, visited);
  }
  return acc;
}

export async function isMediaReferenced(url) {
  if (!url) return false;
  const refs = await Promise.all([
    Settings.find().lean(),
    Project.find().lean(),
    Service.find().lean(),
    TeamMember.find().lean(),
    Client.find().lean(),
    Award.find().lean(),
    Testimonial.find().lean(),
    Milestone.find().lean(),
    Gallery.find().lean(),
    Career.find().lean(),
    Equipment.find().lean(),
    NewsUpdate.find().lean(),
    Document.find().lean(),
  ]);
  const values = new Set();
  for (const docs of refs) for (const doc of docs) collectStringValues(doc, values);
  return values.has(String(url));
}

/** Resolve a dotted path (e.g. "home.careers.image") on a plain object. */
function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), obj);
}

function setPath(obj, path, value) {
  const parts = path.split('.');
  let cursor = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!cursor[key] || typeof cursor[key] !== 'object') cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
}

/**
 * List the CMS fields that hold image/video references, in document order,
 * so the migration/repair script can walk every model uniformly.
 * Dotted paths are supported for nested (settings) documents.
 */
export const MEDIA_FIELD_MAP = [
  {
    model: Settings,
    fields: [
      'heroImage',
      'heroSideImage',
      'heroSlides',
      'whoWeAreImage',
      'ownerImage',
      'homeVideoUrl',
      'homeVideoPoster',
      'logo',
      'home.about.image',
      'home.services.image',
      'home.projects.image',
      'home.locations.image',
      'home.careers.image',
      'home.safety.image',
      'about.hero.image',
      'about.company.aboutImage',
      'about.digital.image',
      'careersPage.image',
      'whereWeWorkPage.image',
      'hseqPage.image',
      'readyMixPage.image',
      'aggregatePage.image',
    ],
  },
  { model: Project,     fields: ['images', 'coverImage'] },
  { model: WhatWeBuild, fields: ['image'] },
  { model: Service,     fields: ['image'] },
  { model: TeamMember,  fields: ['photo'] },
  { model: Client,      fields: ['logo'] },
  { model: Award,       fields: ['image'] },
  { model: Testimonial, fields: ['image'] },
  { model: Milestone,   fields: [] },
  { model: Gallery,     fields: ['image'] },
  { model: Career,      fields: [] },
  { model: Equipment,   fields: ['image'] },
  { model: NewsUpdate,  fields: ['image'] },
  { model: Document,    fields: ['thumbnail', 'fileUrl'] },
];

/**
 * Migration / repair helper: walk every CMS document and run `transform`
 * over each stored media value so legacy `/uploads/...` and `/media/...`
 * references can be promoted to permanent URLs.
 */
export async function migrateMediaValues(transform, { dryRun = true } = {}) {
  const stats = { inspected: 0, changed: 0, docsWritten: 0 };
  for (const { model, fields } of MEDIA_FIELD_MAP) {
    const docs = await model.find().lean();
    for (const doc of docs) {
      let dirty = false;
      const patch = {};
      for (const field of fields) {
        const raw = getPath(doc, field);
        let next;
        if (Array.isArray(raw)) {
          next = [];
          for (const v of raw) {
            const t = await transform(v);
            next.push(t);
            if (t !== v) dirty = true;
          }
          if (dirty || next.some((v, i) => v !== raw[i])) setPath(patch, field, next);
        } else if (typeof raw === 'string' && raw) {
          const t = await transform(raw);
          if (t !== raw) {
            setPath(patch, field, t);
            dirty = true;
          }
        }
      }
      stats.inspected += 1;
      if (dirty) {
        stats.changed += 1;
        if (!dryRun) {
          await model.updateOne({ _id: doc._id }, { $set: patch });
          stats.docsWritten += 1;
        }
      }
    }
  }
  return stats;
}