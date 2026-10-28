import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import { streamProjectMedia, repairProjectImagePaths } from './services/media.js';
import { getCompanyProfilePdf, invalidateProfileCache } from './services/companyProfilePdf.js';

// ── Eagerly import every model so Mongoose registers the schemas before any
//    query runs — prevents "Schema hasn't been registered" errors on first
//    request after a cold start.
import './models/Admin.js';
import './models/Settings.js';
import './models/Project.js';
import './models/Service.js';
import './models/Team.js';
import './models/WhatWeBuild.js';
import './models/Equipment.js';
import './models/NewsUpdate.js';
import './models/Document.js';
import './models/Content.js';  // Client, Award, Testimonial, Milestone, Message, Gallery, Career, ReadyMixRequest, AggregateRequest

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Render / Vercel sit behind a proxy — without this the rate limiters key on
// the proxy IP and every visitor shares one bucket (false blocks).
app.set('trust proxy', 1);

// ── CORS ──────────────────────────────────────────────────────────────────
// Build the allow-list from the configured env vars (ALLOWED_ORIGIN,
// FRONTEND_URL, SITE_URL) plus the legacy CLIENT_URL. Each configured origin is
// expanded to its HTTP/HTTPS and www/non-www variants so the live frontend
// works on every scheme/subdomain combination (http://kasconplc.com,
// https://kasconplc.com, http://www.kasconplc.com, https://www.kasconplc.com).
// `*` is intentionally never used — credentials are enabled, so the spec
// requires reflecting the specific request origin.
function expandOrigin(raw) {
  const clean = String(raw).trim().replace(/\/$/, '');
  const variants = new Set([clean]);
  const m = clean.match(/^https?:\/\/([^/:?#]+)/i);
  if (!m) return variants;
  const bare = m[1].toLowerCase().replace(/^www\./, '');
  for (const h of new Set([bare, `www.${bare}`])) {
    variants.add(`http://${h}`);
    variants.add(`https://${h}`);
  }
  return variants;
}

const allowedOrigins = [...new Set(
  [
    process.env.ALLOWED_ORIGIN,
    process.env.FRONTEND_URL,
    process.env.SITE_URL,
    process.env.CLIENT_URL,
    'https://kassconcp.vercel.app',
  ]
    .flatMap((v) => (v || '').split(/[\s,]+/))
    .map((o) => o.trim())
    .filter(Boolean)
    .flatMap((o) => [...expandOrigin(o)])
)];

app.use(
  cors({
    origin(origin, cb) {
      // No Origin header → same-origin / server-to-server / curl: allow.
      if (!origin) return cb(null, true);
      // Allow any localhost / 127.0.0.1 origin in development
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, origin);
      if (allowedOrigins.includes(origin)) return cb(null, origin);
      return cb(null, false);
    },
    credentials: true,
  })
);

console.log('[cors] allowed origins:', allowedOrigins.join(', ') || '(none)');

// ── Security headers ──────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  next();
});

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Project media route ───────────────────────────────────────────────────
// Stable public path for project images.
// GridFS stored (replaced) images take priority over static committed copies.
app.get('/media/projects/:name', (req, res) => {
  streamProjectMedia(req.params.name, res);
});

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, company: 'Kascon PLC', version: '2.0.0' })
);

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// ── Global error handler ──────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[server error]', err);
  res.status(500).json({ message: err.message || 'Server error' });
});

// ── MongoDB connection + startup tasks ───────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI?.trim();

if (!MONGODB_URI) {
  console.error('MONGODB_URI is required. Set the live Atlas connection string in .env / Render.');
  process.exit(1);
}

if (/localhost|127\.0\.0\.1/i.test(MONGODB_URI)) {
  console.error('Local MongoDB is not allowed. Use the live Atlas MONGODB_URI only.');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    const host = MONGODB_URI.replace(/\/\/.*@/, '//***@').split('?')[0];
    console.log(`[mongo] connected: ${host}`);

    app.listen(PORT, () =>
      console.log(`[server] Kascon API v2.0 running on http://localhost:${PORT}`)
    );

    // ── Boot-time project image path repair ──────────────────────────────
    try {
      const { stats, report } = await repairProjectImagePaths({ dryRun: false });
      if (report.length) {
        console.log(`[project-image-repair] fixed ${report.length} of ${stats.inspected} project(s)`);
        for (const p of report) {
          if (p.cover) console.log(`  "${p.title}" cover: ${p.cover.from} → ${p.cover.to}`);
          for (const g of p.gallery) console.log(`  "${p.title}" gallery: ${g.from} → ${g.to}`);
        }
      } else {
        console.log(`[project-image-repair] all ${stats.inspected} project(s) on canonical paths`);
      }
    } catch (e) {
      console.error('[project-image-repair] failed:', e.message);
    }

    // ── Warm company-profile PDF cache ────────────────────────────────────
    // Clear stale cache on deploy so the A4 portrait template is always used.
    invalidateProfileCache();
    console.log('[company-profile] old cache cleared — will rebuild on first request');

    setTimeout(() => {
      getCompanyProfilePdf()
        .then(() => console.log('[company-profile] PDF cache ready (A4 portrait)'))
        .catch((e) => console.error('[company-profile] warm-up failed:', e.message));
    }, 3000);
  })
  .catch((e) => {
    console.error('[mongo] connection failed:', e.message);
    process.exit(1);
  });
