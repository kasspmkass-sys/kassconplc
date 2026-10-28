/**
 * KASCON Public API + Admin CMS Routes
 * ─────────────────────────────────────────────────────────────────────────
 * FRONTEND PAGE → COMPONENT → DATA → ROUTE → MODEL
 *
 * Home Hero                 → HeroSlider          → settings.heroSlides      → GET /settings/public
 * Home KPIs                 → StatsBand            → settings.home.stats      → GET /settings/public
 * Home WhoWeAre             → WhoWeAre             → settings.home.about      → GET /settings/public
 * Home WhatWeDo             → WhatWeDo             → /services/public         → Service
 * Home WhatWeBuild          → WhatWeBuild          → /projects/public         → Project
 * Home DigitalConstruction  → DigitalConstruction  → settings.about.digital   → GET /settings/public
 * Home HowWeDeliver         → HowWeDeliver         → settings.about.approach  → GET /settings/public
 * Home Safety/HSEQ          → Safety               → settings.home.safety     → GET /settings/public
 * Home Clients              → ClientLogoMarquee    → /clients/public          → Client
 * Home Owners               → Owners               → settings.ownerName/Bio   → GET /settings/public
 * Home Careers              → Careers              → settings.home.careers    → GET /settings/public
 * Home CTA                  → ReadyCta             → settings.home.finalCta   → GET /settings/public
 *
 * /about                    → About.jsx            → settings.about.*         → GET /settings/public
 *                                                   → /team/public            → TeamMember
 *                                                   → /milestones/public      → Milestone
 *                                                   → /awards/public          → Award
 *                                                   → /testimonials/public    → Testimonial
 *                                                   → /clients/public         → Client
 *
 * /services                 → Services.jsx         → /services/public         → Service
 * /services/:id             → ServiceDetail.jsx    → /services/public/:id     → Service
 * /projects                 → Projects.jsx         → /projects/public         → Project
 * /projects/:id             → ProjectDetail.jsx    → /projects/public/:id     → Project
 * /capabilities             → Capabilities.jsx     → settings.capabilitiesPage→ GET /settings/public
 * /equipment                → Equipment.jsx        → /equipment/public        → Equipment
 *                                                   + /gallery/public         → Gallery
 * /ready-mix                → ReadyMix.jsx         → settings.readyMixPage    → GET /settings/public
 * /aggregate                → Aggregate.jsx        → settings.aggregatePage   → GET /settings/public
 * /hseq                     → HSEQ.jsx             → settings.hseqPage        → GET /settings/public
 * /news                     → [future]             → /news/public             → NewsUpdate
 * /downloads                → [future]             → /documents/public        → Document
 * /careers                  → Careers.jsx          → /careers/public          → Career
 * /contact                  → Contact.jsx          → POST /contact            → Message
 * /search                   → Search.jsx           → /projects/public etc.    → multi-model
 *
 * Forms:
 *   Ready-Mix request        → POST /ready-mix-requests
 *   Aggregate request        → POST /aggregate-requests
 */

import { Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { auth } from '../middleware/auth.js';
import { upload, uploadVideo } from '../middleware/upload.js';
import Settings from '../models/Settings.js';
import Project from '../models/Project.js';
import Service from '../models/Service.js';
import TeamMember from '../models/Team.js';
import WhatWeBuild from '../models/WhatWeBuild.js';
import Equipment from '../models/Equipment.js';
import NewsUpdate from '../models/NewsUpdate.js';
import Document from '../models/Document.js';
import {
  Client, Award, Testimonial, Milestone,
  Message, Gallery, Career, Certificate,
  ReadyMixRequest, AggregateRequest,
} from '../models/Content.js';
import { getCompanyProfilePdf, getProfileStatus, invalidateProfileCache } from '../services/companyProfilePdf.js';
import { toPublicSettings } from '../services/publicSettings.js';
import {
  uploadMedia,
  streamMedia,
  deleteMedia,
  isMediaReferenced,
  mediaIdFromUrl,
  MEDIA_FIELD_MAP,
  upsertProjectMedia,
  streamProjectMedia,
  repairProjectImagePaths,
  sanitizeProjectImageFields,
  getBucket,
} from '../services/media.js';
import mongoose from 'mongoose';
import { triggerDeploy } from '../services/deployHook.js';

const router = Router();

// ── Rate limiters ─────────────────────────────────────────────────────────

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many messages. Please try again later.' },
});

const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

const pdfLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many profile downloads. Please try again later.' },
});

// ── Security helpers ──────────────────────────────────────────────────────

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function sanitizeBody(value) {
  if (Array.isArray(value)) return value.map(sanitizeBody);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (DANGEROUS_KEYS.has(key) || key.startsWith('$')) continue;
      const clean = sanitizeBody(val);
      if (clean !== undefined) out[key] = clean;
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }
  return value;
}

function parseFilter(raw, res) {
  try {
    const body = raw ? JSON.parse(raw) : {};
    if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
    const safe = sanitizeBody(body);
    return safe || {};
  } catch {
    res.status(400).json({ message: 'Invalid filter parameter' });
    return null;
  }
}

function mediaFieldNames(Model) {
  return MEDIA_FIELD_MAP.find((m) => m.model === Model)?.fields || [];
}

function getPath(obj, path) {
  return path.split('.').reduce(
    (acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined),
    obj
  );
}

async function cleanupReplacedMedia(prev, next, Model) {
  const fields = mediaFieldNames(Model);
  if (!fields.length || !prev) return;
  const current = new Map(
    (next
      ? fields.flatMap((f) => {
          const val = getPath(next, f);
          return Array.isArray(val) ? val : val ? [val] : [];
        })
      : []
    ).map((v) => [String(v), true])
  );
  for (const field of fields) {
    const oldVal = getPath(prev, field);
    const oldVals = Array.isArray(oldVal) ? oldVal : oldVal ? [oldVal] : [];
    for (const v of oldVals) {
      if (!v || current.has(String(v))) continue;
      try {
        const id = mediaIdFromUrl(v);
        if (!id) continue;
        if (await isMediaReferenced(v)) continue;
        await deleteMedia(id);
        console.log(`[media] cleaned up unreferenced media ${v}`);
      } catch (e) {
        if (!/does not exist/i.test(e?.message)) console.error('[media] cleanup failed:', e.message);
      }
    }
  }
}

// ── Generic CRUD factory ──────────────────────────────────────────────────

/**
 * Guard an `:id` route param before it reaches the database.
 *
 * Without this, a malformed id (e.g. `/services/public/not-an-id`) makes
 * Mongoose throw a CastError and the route answers 500, which misreports a
 * client mistake as a server fault. Returns true when the id is usable.
 */
function isValidObjectId(res, id) {
  if (id && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
    return true;
  }
  res.status(400).json({ message: 'Invalid id' });
  return false;
}

function crud(Model, opts = {}) {
  const r = Router();
  const pubFilter  = opts.publicFilter  || ((q) => ({ ...q, published: true }));
  const normalizeBody = opts.normalizeBody;

  // Public list
  r.get('/public', async (req, res) => {
    try {
      const filter = parseFilter(req.query.filter, res);
      if (filter === null) return;
      const items = await Model.find(pubFilter(filter))
        .sort(opts.sort || { order: 1, createdAt: -1 });
      res.json(items);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // Public single
  r.get('/public/:id', async (req, res) => {
    try {
      if (!isValidObjectId(res, req.params.id)) return;
      const item = await Model.findOne({ _id: req.params.id, published: true });
      if (!item) return res.status(404).json({ message: 'Not found' });
      res.json(item);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // Admin list
  r.get('/', auth, async (_req, res) => {
    try {
      const items = await Model.find().sort(opts.sort || { order: 1, createdAt: -1 });
      res.json(items);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // Admin single
  r.get('/:id', auth, async (req, res) => {
    try {
      if (!isValidObjectId(res, req.params.id)) return;
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Not found' });
      res.json(item);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // Create
  r.post('/', auth, async (req, res) => {
    try {
      const body  = sanitizeBody(req.body);
      const clean = normalizeBody ? normalizeBody(body, null) : body;
      const item  = await Model.create(clean);
      if (opts.onMutate) opts.onMutate('create', item);
      res.status(201).json(item);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  });

  // Update
  r.put('/:id', auth, async (req, res) => {
    try {
      if (!isValidObjectId(res, req.params.id)) return;
      const prev  = await Model.findById(req.params.id);
      const body  = sanitizeBody(req.body);
      const clean = normalizeBody ? normalizeBody(body, prev) : body;
      const item  = await Model.findByIdAndUpdate(req.params.id, clean, { new: true });
      if (!item) return res.status(404).json({ message: 'Not found' });
      await cleanupReplacedMedia(prev, item, Model);
      if (opts.onMutate) opts.onMutate('update', item);
      res.json(item);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  });

  // Delete
  r.delete('/:id', auth, async (req, res) => {
    try {
      if (!isValidObjectId(res, req.params.id)) return;
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (doc) await cleanupReplacedMedia(doc, null, Model);
      if (doc && opts.onMutate) opts.onMutate('delete', doc);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  return r;
}

// ── Collection routes ─────────────────────────────────────────────────────

router.use('/projects', crud(Project, {
  sort: { featured: -1, order: 1, createdAt: -1 },
  normalizeBody: (patch, existing) => sanitizeProjectImageFields(patch, existing),
  onMutate: () => triggerDeploy('projects-changed'),
}));

// One-shot project image path repair
router.post('/projects/repair-paths', auth, async (_req, res) => {
  try {
    const result = await repairProjectImagePaths({ dryRun: false });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.use('/what-we-build', crud(WhatWeBuild, { sort: { order: 1, category: 1 } }));
router.use('/services',      crud(Service, { onMutate: () => triggerDeploy('services-changed') }));
router.use('/team',          crud(TeamMember));
router.use('/clients',       crud(Client));
router.use('/awards',        crud(Award));
router.use('/testimonials',  crud(Testimonial));
router.use('/milestones',    crud(Milestone,   { sort: { order: 1 } }));
router.use('/gallery',       crud(Gallery));
router.use('/careers',       crud(Career,      {
  publicFilter: (q) => ({ ...q, published: true, status: 'open' }),
}));

// HSEQ certificates shown on /hseq with name, issuer, number and validity.
router.use('/certificates',  crud(Certificate, { sort: { order: 1, issuedYear: -1 } }));

// ── Equipment ─────────────────────────────────────────────────────────────
router.use('/equipment', crud(Equipment, { sort: { order: 1, category: 1 } }));

// ── News / Updates ────────────────────────────────────────────────────────
router.use('/news', crud(NewsUpdate, {
  sort: { featured: -1, date: -1, createdAt: -1 },
}));

// ── Document library ──────────────────────────────────────────────────────
// Public endpoint only returns public: true documents.
router.use('/documents', crud(Document, {
  publicFilter: (q) => ({ ...q, published: true, public: true }),
  sort: { order: 1, type: 1 },
}));

// ── Settings ──────────────────────────────────────────────────────────────

// Unauthenticated, so it returns a public-safe projection (allow-list DTO) and
// never the raw Settings document. Admins use GET /settings below.
//
// Reads must never write: if no document exists yet we answer with the empty
// public DTO so the frontend falls back to its built-in defaults, instead of
// creating a document as a side effect of a GET.
router.get('/settings/public', async (_req, res) => {
  try {
    const s = await Settings.findOne();
    res.json(toPublicSettings(s));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Admin read. Returns an unsaved, empty document when the collection is empty so
// the admin form can render and be saved through PUT — again, no write on GET.
router.get('/settings', auth, async (_req, res) => {
  try {
    const s = await Settings.findOne();
    res.json(s || new Settings());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/settings', auth, async (req, res) => {
  try {
    const patch = sanitizeBody(req.body) || {};

    /* Optimistic concurrency. The admin form posts back the __v it loaded; if the
       stored version has moved on, another editor saved first and we must not
       silently overwrite them. */
    const clientVersion = patch.__v;
    delete patch.__v;
    /* Never let a client assign identity or audit fields. */
    delete patch._id;
    delete patch.createdAt;
    delete patch.updatedAt;

    let s = await Settings.findOne();
    if (!s) {
      s = await Settings.create(patch);
      triggerDeploy('settings-saved');
    } else {
      if (clientVersion !== undefined && Number(clientVersion) !== Number(s.__v)) {
        return res.status(409).json({
          message:
            'Settings were changed by someone else while you were editing. Reload the page and reapply your changes.',
        });
      }
      const prev = s.toObject();
      Object.assign(s, patch);
      await s.save();
      triggerDeploy('settings-saved');
      await cleanupReplacedMedia(prev, s.toObject(), Settings);
    }
    res.json(s);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// ── Contact form ──────────────────────────────────────────────────────────

router.post('/contact', contactLimiter, async (req, res) => {
  const { name, email, phone, subject, message, formType } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email and message are required' });
  }
  try {
    const msg = await Message.create({ name, email, phone, subject, message, formType: formType || 'general' });
    res.status(201).json({ ok: true, id: msg._id });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// ── Ready-Mix quotation requests ──────────────────────────────────────────

router.post('/ready-mix-requests', formLimiter, async (req, res) => {
  const { projectName, location, contactPerson, phone } = req.body;
  if (!projectName || !location || !contactPerson || !phone) {
    return res.status(400).json({ message: 'Project name, location, contact person and phone are required' });
  }
  try {
    const doc = await ReadyMixRequest.create(sanitizeBody(req.body));
    res.status(201).json({ ok: true, id: doc._id });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get('/ready-mix-requests', auth, async (_req, res) => {
  try {
    const items = await ReadyMixRequest.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/ready-mix-requests/:id/status', auth, async (req, res) => {
  try {
    const { status, read } = req.body;
    const update = {};
    if (status) update.status = status;
    if (read !== undefined) update.read = read;
    const doc = await ReadyMixRequest.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete('/ready-mix-requests/:id', auth, async (req, res) => {
  try {
    await ReadyMixRequest.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── Aggregate quotation requests ──────────────────────────────────────────

router.post('/aggregate-requests', formLimiter, async (req, res) => {
  const { projectName, location, contactPerson, phone } = req.body;
  if (!projectName || !location || !contactPerson || !phone) {
    return res.status(400).json({ message: 'Project name, location, contact person and phone are required' });
  }
  try {
    const doc = await AggregateRequest.create(sanitizeBody(req.body));
    res.status(201).json({ ok: true, id: doc._id });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get('/aggregate-requests', auth, async (_req, res) => {
  try {
    const items = await AggregateRequest.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/aggregate-requests/:id/status', auth, async (req, res) => {
  try {
    const { status, read } = req.body;
    const update = {};
    if (status) update.status = status;
    if (read !== undefined) update.read = read;
    const doc = await AggregateRequest.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete('/aggregate-requests/:id', auth, async (req, res) => {
  try {
    await AggregateRequest.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── Messages (general contact) ────────────────────────────────────────────

router.get('/messages', auth, async (_req, res) => {
  try {
    res.json(await Message.find().sort({ createdAt: -1 }));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/messages/:id/read', auth, async (req, res) => {
  try {
    if (!isValidObjectId(res, req.params.id)) return;
    const m = await Message.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!m) return res.status(404).json({ message: 'Not found' });
    res.json(m);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/messages/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(res, req.params.id)) return;
    await Message.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── Dashboard stats ───────────────────────────────────────────────────────

router.get('/stats', auth, async (_req, res) => {
  try {
    const [
      projects, ongoing, messages, unread,
      services, clients,
      equipment, news, documents,
      readyMixNew, aggregateNew,
    ] = await Promise.all([
      Project.countDocuments({ status: 'completed' }),
      Project.countDocuments({ status: 'ongoing' }),
      Message.countDocuments(),
      Message.countDocuments({ read: false }),
      Service.countDocuments(),
      Client.countDocuments(),
      Equipment.countDocuments(),
      NewsUpdate.countDocuments({ published: true }),
      Document.countDocuments({ published: true }),
      ReadyMixRequest.countDocuments({ status: 'new' }),
      AggregateRequest.countDocuments({ status: 'new' }),
    ]);
    res.json({
      projects, ongoing, messages, unread,
      services, clients,
      equipment, news, documents,
      readyMixNew, aggregateNew,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── Media upload ──────────────────────────────────────────────────────────

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' });
  try {
    const url = await uploadMedia({
      buffer:       req.file.buffer,
      originalname: req.file.originalname,
      mimetype:     req.file.mimetype,
    });
    res.json({ url });
  } catch (e) {
    console.error('[upload] failed:', e);
    res.status(e.status || 500).json({ message: e.message || 'Upload failed' });
  }
});

router.post('/upload/video', auth, uploadVideo.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' });
  try {
    const url = await uploadMedia({
      buffer:       req.file.buffer,
      originalname: req.file.originalname,
      mimetype:     req.file.mimetype,
    });
    res.json({ url });
  } catch (e) {
    console.error('[upload/video] failed:', e);
    res.status(e.status || 500).json({ message: e.message || 'Upload failed' });
  }
});

// Project image — stable /media/projects/<name> slot
router.post('/upload/project', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' });
  const name = String(req.body?.name || '').trim();
  try {
    const url = await upsertProjectMedia({
      buffer:       req.file.buffer,
      originalname: req.file.originalname,
      mimetype:     req.file.mimetype,
      name,
    });
    res.json({ url });
  } catch (e) {
    console.error('[upload/project] failed:', e);
    res.status(e.status || 500).json({ message: e.message || 'Upload failed' });
  }
});

// Document upload — accepts PDF + images, larger limit
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB for PDFs
  fileFilter: (_req, file, cb) => {
    const ok = /^(application\/pdf|image\/)/.test(file.mimetype);
    cb(ok ? null : new Error('Only PDF and image files are accepted for documents.'), ok);
  },
});

router.post('/upload/document', auth, documentUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' });
  try {
    const bucket = getBucket();
    const newId  = new mongoose.Types.ObjectId();
    const ext    = (req.file.originalname || '').match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase() || 'pdf';
    const filename = `docs/${Date.now()}-${newId}.${ext}`;
    await new Promise((resolve, reject) => {
      const stream = bucket.openUploadStreamWithId(newId, filename, {
        contentType: req.file.mimetype,
        metadata: { kind: 'document', originalname: req.file.originalname },
      });
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(req.file.buffer);
    });
    const origin = (process.env.MEDIA_URL || process.env.SELF_URL || 'https://kassconbackend.onrender.com').replace(/\/$/, '');
    res.json({ url: `${origin}/api/media/${newId}`, filename: req.file.originalname, size: req.file.size });
  } catch (e) {
    console.error('[upload/document] failed:', e);
    res.status(e.status || 500).json({ message: e.message || 'Upload failed' });
  }
});

// ── Media browser (admin) ─────────────────────────────────────────────────
// Returns paginated list of all uploaded GridFS files.
// Admin can select existing files to reuse them without re-uploading.

router.get('/media', auth, async (req, res) => {
  try {
    const bucket = getBucket();
    const limit   = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const skip    = parseInt(req.query.skip || '0', 10);
    const kind    = req.query.kind || null; // 'image' | 'video' | 'document' | null (all)
    const search  = req.query.search ? String(req.query.search).trim() : null;

    const matchFilter = {};
    if (kind)   matchFilter['metadata.kind'] = kind;
    if (search) matchFilter.filename = { $regex: search, $options: 'i' };

    const [files, total] = await Promise.all([
      bucket.find(matchFilter).sort({ uploadDate: -1 }).skip(skip).limit(limit).toArray(),
      bucket.find(matchFilter).count(),
    ]);

    const origin = (process.env.MEDIA_URL || process.env.SELF_URL || 'https://kassconbackend.onrender.com').replace(/\/$/, '');
    res.json({
      total,
      skip,
      limit,
      files: files.map((f) => ({
        _id:          f._id,
        filename:     f.filename,
        contentType:  f.contentType,
        length:       f.length,
        uploadDate:   f.uploadDate,
        kind:         f.metadata?.kind || 'image',
        originalname: f.metadata?.originalname || f.filename,
        url:          `${origin}/api/media/${f._id}`,
      })),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Stream a stored media file by id (public)
router.get('/media/:id([0-9a-fA-F]{24})', (req, res) => {
  streamMedia(req.params.id, res);
});

// Delete a stored media file (only if unreferenced)
router.post('/media/delete', auth, async (req, res) => {
  const { url } = req.body || {};
  const id = mediaIdFromUrl(url);
  if (!id) return res.status(400).json({ message: 'Invalid media id' });
  try {
    const referenced = await isMediaReferenced(url);
    if (referenced) return res.json({ deleted: false, reason: 'referenced' });
    const result = await deleteMedia(id);
    res.json(result);
  } catch (e) {
    if (/does not exist/i.test(e?.message)) return res.json({ deleted: false, reason: 'not found' });
    res.status(500).json({ message: e.message });
  }
});

// Force-delete regardless of references (admin explicit action)
router.delete('/media/:id([0-9a-fA-F]{24})', auth, async (req, res) => {
  try {
    const result = await deleteMedia(req.params.id);
    res.json(result);
  } catch (e) {
    if (/does not exist/i.test(e?.message)) return res.json({ deleted: false, reason: 'not found' });
    res.status(500).json({ message: e.message });
  }
});

// ── Company Profile PDF ───────────────────────────────────────────────────

// Admin: get cache/generation status
router.get('/admin/company-profile/status', auth, async (_req, res) => {
  try {
    const status = await getProfileStatus();
    res.json(status);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Admin: force-regenerate (invalidates cache, builds immediately)
router.post('/admin/company-profile/regenerate', auth, async (_req, res) => {
  try {
    invalidateProfileCache();
    const filePath = await getCompanyProfilePdf({ force: true });
    const stat = fs.statSync(filePath);
    res.json({ ok: true, fileSize: stat.size, generatedAt: new Date().toISOString() });
  } catch (e) {
    console.error('[PDF] regeneration failed:', e);
    res.status(500).json({ message: e.message || 'Regeneration failed' });
  }
});

// Admin: preview (same as download but inline for browser viewer)
router.get('/admin/company-profile/preview', auth, async (req, res) => {
  try {
    const force    = req.query.refresh === '1';
    const filePath = await getCompanyProfilePdf({ force });
    const stat     = fs.statSync(filePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', 'inline; filename="KASCON-Company-Profile-Preview.pdf"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    console.error('[PDF] preview failed:', e);
    res.status(500).json({ message: e.message || 'Preview failed' });
  }
});

// Public: download company profile PDF
router.get('/company-profile.pdf', pdfLimiter, async (req, res) => {
  try {
    const force    = req.query.refresh === '1';
    const filePath = await getCompanyProfilePdf({ force });
    const stat     = fs.statSync(filePath);
    const year     = new Date().getFullYear();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="KASCON_Company_Profile_${year}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    console.error('[PDF] generation failed:', e);
    res.status(500).json({ message: e.message || 'Failed to generate company profile PDF' });
  }
});

// ── Upload error handler ──────────────────────────────────────────────────

router.use((err, _req, res, next) => {
  if (!err) return next();
  if (res.headersSent) return next(err);
  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large (8 MB max for images, 20 MB for documents, 120 MB for video).'
        : `Upload error: ${err.code || err.message}`;
    return res.status(400).json({ message });
  }
  res.status(err.status || 500).json({ message: err.message || 'Upload failed' });
});

export default router;
