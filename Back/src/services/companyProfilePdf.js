/**
 * KASCON Company Profile PDF — A4 portrait, international tender standard.
 * Detailed professional edition (~18–22 pages). Live CMS content.
 * Brand: navy #153464 · accent #8B1E35 · ink #0b1e33
 */
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import Settings from '../models/Settings.js';
import Project from '../models/Project.js';
import Service from '../models/Service.js';
import TeamMember from '../models/Team.js';
import Equipment from '../models/Equipment.js';
import WhatWeBuild from '../models/WhatWeBuild.js';
import { Client, Award, Testimonial, Milestone, Gallery } from '../models/Content.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CACHE_DIR = path.join(ROOT, 'cache');
const CACHE_PDF = path.join(CACHE_DIR, 'company-profile.pdf');
const CACHE_META = path.join(CACHE_DIR, 'company-profile.meta.json');
const UPLOADS = path.join(ROOT, 'uploads');

const LOCAL_PUBLIC_CANDIDATES = [
  process.env.CLIENT_PUBLIC_DIR,
  path.resolve(ROOT, '../front_end_v93/public'),
  path.resolve(ROOT, '../website/client/public'),
  path.resolve(ROOT, '../client/public'),
  path.resolve(ROOT, 'public'),
].filter(Boolean);

const PUBLIC_MEDIA_URL = (process.env.PUBLIC_MEDIA_URL || '').replace(/\/$/, '');
const REMOTE_BASES = [
  PUBLIC_MEDIA_URL,
  (process.env.MEDIA_URL || '').replace(/\/$/, ''),
  (process.env.SELF_URL || '').replace(/\/$/, ''),
  'https://kassconbackend.onrender.com',
].filter(Boolean);

/* ── Brand ─────────────────────────────────────────────────── */
const NAVY = '#153464';
const INK = '#0b1e33';
const ACCENT = '#8B1E35';
const ACCENT_SOFT = '#f0a8b4';
const BLUE = '#1e5aa8'; /* geometric accent — sample royal blue */
const BLUE_DEEP = '#0f3a75';
const TEXT = '#1e2530';
const MUTED = '#64748b';
const LINE = '#e2e8f0';
const SOFT = '#f4f7fb';
const WHITE = '#ffffff';
const SLATE = '#334155';

/* A4 portrait */
const W = 595.28;
const H = 841.89;
const MX = 48;
const MY = 44;
const CW = W - MX * 2;
const FOOTER_H = 34;
const HEADER_H = 30;
const CONTENT_BOTTOM = H - FOOTER_H - 16;
const CONTENT_TOP = HEADER_H + 28;

const YEAR = new Date().getFullYear();
const PROFILE_VERSION = 'portrait-v8-aligned';

const _imgCache = new Map();
let _buildPromise = null;
let _dataCache = { at: 0, data: null };
const DATA_TTL_MS = 60_000;

/* ── Helpers ───────────────────────────────────────────────── */
function clean(s, max = 0) {
  if (s == null) return '';
  let t = String(s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\uFFFD/g, '—')
    .replace(/Company editorial image[\s\S]*$/i, '')
    .replace(/\bDescription:\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (max > 0 && t.length > max) t = `${t.slice(0, max - 1).trim()}…`;
  return t;
}

function etb(n) {
  if (n == null || n === '') return '—';
  const num = Number(n);
  if (!Number.isFinite(num)) return clean(String(n), 28);
  return `ETB ${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function moneyShort(n) {
  if (n == null || n === '') return '—';
  const num = Number(n);
  if (!Number.isFinite(num)) return clean(String(n), 20);
  if (num >= 1_000_000) return `ETB ${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1)}M`;
  if (num >= 1_000) return `ETB ${(num / 1_000).toFixed(0)}K`;
  return etb(num);
}

async function fetchBuffer(url, timeoutMs = 20000, attempts = 2) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) {
          if (res.status === 404 || res.status === 410) return null;
          throw new Error(`HTTP ${res.status}`);
        }
        const buf = Buffer.from(await res.arrayBuffer());
        return buf?.length ? buf : null;
      } finally {
        clearTimeout(timer);
      }
    } catch (e) {
      if (attempt === attempts) {
        console.warn(`[PDF] fetch failed: ${url} (${e?.message})`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 600 * attempt));
    }
  }
  return null;
}

async function resolveImage(url) {
  if (!url) return null;
  const key = String(url);
  if (_imgCache.has(key)) return _imgCache.get(key);
  let result = null;
  try {
    if (/^https?:\/\//i.test(url)) {
      result = await fetchBuffer(url, 20000, 2);
    } else {
      let rel = url.replace(/\\/g, '/').replace(/^\/+/, '');
      rel = rel.replace(/^uploads\/?/, '').replace(/^media\/?/, '');
      const b0 = path.basename(url.replace(/\\/g, '/'));
      const candidates = [path.join(UPLOADS, rel), path.join(UPLOADS, b0)];
      for (const base of LOCAL_PUBLIC_CANDIDATES) {
        candidates.push(
          path.join(base, rel),
          path.join(base, 'media', rel),
          path.join(base, b0),
          path.join(base, 'media', b0),
          path.join(base, url.replace(/^\//, ''))
        );
      }
      for (const c of candidates) {
        try {
          if (fs.existsSync(c)) {
            result = c;
            break;
          }
        } catch {
          /* next */
        }
      }
      if (!result) {
        for (const base of REMOTE_BASES) {
          if (!base) continue;
          const remote = `${base}${url.startsWith('/') ? url : `/${url}`}`;
          if (remote === url) continue;
          const buf = await fetchBuffer(remote, 20000, 2);
          if (buf?.length) {
            result = buf;
            break;
          }
        }
      }
    }
  } catch (e) {
    console.warn('[PDF] image resolve failed:', e?.message);
  }
  _imgCache.set(key, result);
  return result;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length || 1) }, async () => {
    while (true) {
      const idx = cursor;
      cursor += 1;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

/** Rounded rectangle path (modern card / media clip). */
function roundedPath(doc, x, y, w, h, r = 10) {
  const radius = Math.min(r, w / 2, h / 2);
  doc.moveTo(x + radius, y);
  doc.lineTo(x + w - radius, y);
  doc.quadraticCurveTo(x + w, y, x + w, y + radius);
  doc.lineTo(x + w, y + h - radius);
  doc.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  doc.lineTo(x + radius, y + h);
  doc.quadraticCurveTo(x, y + h, x, y + h - radius);
  doc.lineTo(x, y + radius);
  doc.quadraticCurveTo(x, y, x + radius, y);
  doc.closePath();
}

function roundedFill(doc, x, y, w, h, color, r = 10) {
  doc.save();
  roundedPath(doc, x, y, w, h, r);
  doc.fill(color);
  doc.restore();
}

function roundedStroke(doc, x, y, w, h, color = LINE, r = 10, lw = 0.6) {
  doc.save();
  roundedPath(doc, x, y, w, h, r);
  doc.lineWidth(lw).strokeColor(color).stroke();
  doc.restore();
}

/** Soft page texture — fine diagonal grain (print-safe, low ink). */
function drawPageTexture(doc, color = NAVY, opacity = 0.035) {
  doc.save();
  doc.strokeColor(color).lineWidth(0.35);
  doc.opacity(opacity);
  for (let i = -H; i < W + H; i += 14) {
    doc.moveTo(i, 0).lineTo(i + H, H).stroke();
  }
  doc.restore();
  doc.opacity(1);
}

/** Dot-grid texture like the sample. */
function drawDotGrid(doc, x, y, cols, rows, gap = 7, color = '#c5ced9') {
  doc.save();
  doc.fillColor(color);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      doc.circle(x + c * gap, y + r * gap, 0.7).fill();
    }
  }
  doc.restore();
}

/** Pointy-top hexagon path. */
function hexPath(doc, cx, cy, r) {
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 180) * (60 * i - 90);
    const px = cx + r * Math.cos(a);
    const py = cy + r * Math.sin(a);
    if (i === 0) doc.moveTo(px, py);
    else doc.lineTo(px, py);
  }
  doc.closePath();
}

/** Hexagonal framed image (sample style — thick blue border). */
function drawHexImage(doc, file, cx, cy, r, opts = {}) {
  const border = opts.border ?? 10;
  const stroke = opts.stroke ?? BLUE;

  // Soft shadow
  doc.save();
  doc.fillOpacity(0.1);
  hexPath(doc, cx + 2, cy + 3, r + 2);
  doc.fill('#000000');
  doc.restore();
  doc.fillOpacity(1);

  // Outer border fill
  hexPath(doc, cx, cy, r);
  doc.fill(stroke);

  // Inner image clip
  const inner = Math.max(r - border, 8);
  doc.save();
  hexPath(doc, cx, cy, inner);
  doc.clip();
  if (file) {
    try {
      const side = inner * 2;
      doc.image(file, cx - inner, cy - inner, {
        cover: [side, side],
        align: 'center',
        valign: 'center',
      });
    } catch {
      doc.rect(cx - inner, cy - inner, inner * 2, inner * 2).fill('#dbe4f0');
    }
  } else {
    doc.rect(cx - inner, cy - inner, inner * 2, inner * 2).fill('#dbe4f0');
  }
  doc.restore();

  // Crisp outer stroke
  hexPath(doc, cx, cy, r);
  doc.lineWidth(1.2).strokeColor(stroke).stroke();
}

/**
 * Sample-style angular corner geometry (layered navy + royal blue).
 * corner: 'tr' | 'bl' | 'tl' | 'br'
 */
function drawCornerGeo(doc, corner, scale = 1) {
  doc.save();
  if (corner === 'tr') {
    // Large navy wedge
    doc
      .moveTo(W, 0)
      .lineTo(W, 210 * scale)
      .lineTo(W - 70 * scale, 250 * scale)
      .lineTo(W - 210 * scale, 0)
      .fill(NAVY);
    // Blue overlay facet
    doc
      .moveTo(W, 0)
      .lineTo(W, 150 * scale)
      .lineTo(W - 40 * scale, 175 * scale)
      .lineTo(W - 145 * scale, 0)
      .fill(BLUE);
    // Thin accent edge
    doc
      .moveTo(W - 145 * scale, 0)
      .lineTo(W - 40 * scale, 175 * scale)
      .lineTo(W - 52 * scale, 188 * scale)
      .lineTo(W - 160 * scale, 0)
      .fill(BLUE_DEEP);
  } else if (corner === 'bl') {
    doc
      .moveTo(0, H)
      .lineTo(0, H - 200 * scale)
      .lineTo(65 * scale, H - 240 * scale)
      .lineTo(200 * scale, H)
      .fill(NAVY);
    doc
      .moveTo(0, H)
      .lineTo(0, H - 145 * scale)
      .lineTo(38 * scale, H - 168 * scale)
      .lineTo(140 * scale, H)
      .fill(BLUE);
    doc
      .moveTo(140 * scale, H)
      .lineTo(38 * scale, H - 168 * scale)
      .lineTo(50 * scale, H - 180 * scale)
      .lineTo(155 * scale, H)
      .fill(BLUE_DEEP);
  } else if (corner === 'tr-small') {
    doc
      .moveTo(W, 0)
      .lineTo(W, 56)
      .lineTo(W - 70, 0)
      .fill(NAVY);
    doc
      .moveTo(W, 0)
      .lineTo(W, 36)
      .lineTo(W - 42, 0)
      .fill(BLUE);
  } else if (corner === 'bl-small') {
    doc
      .moveTo(0, H)
      .lineTo(0, H - FOOTER_H - 28)
      .lineTo(48, H)
      .fill(NAVY);
  }
  doc.restore();
}

/** Image clipped to rounded rect with optional white ring / shadow. */
function drawShapedImage(doc, file, x, y, w, h, opts = {}) {
  const { radius = 14, ring = true, shadow = true, ringColor = WHITE } = opts;
  if (shadow) {
    doc.save();
    doc.fillOpacity(0.1);
    roundedFill(doc, x + 3, y + 4, w, h, '#000000', radius);
    doc.restore();
    doc.fillOpacity(1);
  }
  roundedFill(doc, x, y, w, h, '#dbe4f0', radius);
  if (file) {
    try {
      doc.save();
      roundedPath(doc, x, y, w, h, radius);
      doc.clip();
      doc.image(file, x, y, { cover: [w, h], align: 'center', valign: 'center' });
      doc.restore();
    } catch {
      try {
        doc.restore();
      } catch {
        /* ignore */
      }
    }
  }
  if (ring) {
    roundedStroke(doc, x, y, w, h, ringColor, radius, 2.4);
  }
}

/** Circular image with ring — for cover collage accents. */
function drawCircleImage(doc, file, cx, cy, r, opts = {}) {
  const { ring = 4, ringColor = WHITE, accent = BLUE } = opts;
  doc.save();
  doc.fillOpacity(0.12);
  doc.circle(cx + 2, cy + 3, r + 2).fill('#000000');
  doc.restore();
  doc.fillOpacity(1);

  doc.circle(cx, cy, r + ring + 2).fill(accent);
  doc.circle(cx, cy, r + ring).fill(ringColor);

  doc.save();
  doc.circle(cx, cy, r).clip();
  if (file) {
    try {
      doc.image(file, cx - r, cy - r, { cover: [r * 2, r * 2], align: 'center', valign: 'center' });
    } catch {
      doc.circle(cx, cy, r).fill('#dbe4f0');
    }
  } else {
    doc.circle(cx, cy, r).fill('#dbe4f0');
  }
  doc.restore();
}

/**
 * Modern media block: soft shadow, rounded clip, optional gradient caption.
 */
function drawMedia(doc, file, x, y, w, h, opts = {}) {
  const {
    radius = 12,
    shadow = true,
    caption = '',
    kicker = '',
    accent = true,
    overlay = true,
  } = opts;

  if (shadow) {
    doc.save();
    doc.fillOpacity(0.07);
    roundedFill(doc, x + 2.5, y + 3.5, w, h, '#0b1e33', radius);
    doc.restore();
    doc.fillOpacity(1);
  }

  roundedFill(doc, x, y, w, h, SOFT, radius);

  let ok = false;
  if (file) {
    try {
      doc.save();
      roundedPath(doc, x, y, w, h, radius);
      doc.clip();
      doc.image(file, x, y, { cover: [w, h], align: 'center', valign: 'center' });
      doc.restore();
      ok = true;
    } catch {
      try {
        doc.restore();
      } catch {
        /* ignore */
      }
      ok = false;
    }
  }

  if (!ok) {
    roundedFill(doc, x, y, w, h, '#e8eef6', radius);
    doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(9);
    doc.text('KASCON', x, y + h / 2 - 6, { width: w, align: 'center' });
  }

  if (overlay && (caption || kicker)) {
    const band = Math.min(56, h * 0.38);
    doc.save();
    roundedPath(doc, x, y, w, h, radius);
    doc.clip();
    doc.fillOpacity(0.55);
    doc.rect(x, y + h - band, w, band).fill(INK);
    doc.fillOpacity(0.28);
    doc.rect(x, y + h - band * 1.55, w, band * 0.55).fill(INK);
    doc.restore();
    doc.fillOpacity(1);

    if (kicker) {
      doc.fillColor(ACCENT_SOFT).font('Helvetica-Bold').fontSize(6.5);
      doc.text(clean(kicker, 36).toUpperCase(), x + 12, y + h - band + 10, {
        width: w - 24,
        characterSpacing: 0.8,
        lineBreak: false,
      });
    }
    if (caption) {
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9);
      doc.text(clean(caption, 48), x + 12, y + h - band + (kicker ? 22 : 14), {
        width: w - 24,
        lineBreak: false,
      });
    }
  }

  if (accent) {
    doc.rect(x + 10, y + 10, 18, 2.2).fill(BLUE);
    doc.rect(x + 10, y + 10, 2.2, 18).fill(BLUE);
  }

  return ok;
}

/** Circular / soft portrait for leadership. */
function drawAvatar(doc, file, x, y, size, opts = {}) {
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;

  doc.circle(cx, cy, r + 3).fill('#eef2f7');
  doc.circle(cx, cy, r + 1.2).fill(BLUE);

  doc.save();
  doc.circle(cx, cy, r).clip();
  if (file) {
    try {
      doc.image(file, x, y, { cover: [size, size], align: 'center', valign: 'center' });
    } catch {
      doc.circle(cx, cy, r).fill(SOFT);
    }
  } else {
    doc.circle(cx, cy, r).fill(SOFT);
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(size * 0.32);
    doc.text(clean(opts.initials || 'K', 2), x, cy - size * 0.16, { width: size, align: 'center' });
  }
  doc.restore();
}

function drawImage(doc, file, x, y, w, h) {
  return drawMedia(doc, file, x, y, w, h, { caption: '', kicker: '', overlay: false, accent: false, radius: 10 });
}

function drawHeader(doc, company) {
  doc.save();
  doc.rect(0, 0, W, HEADER_H).fill(WHITE);
  doc.rect(0, HEADER_H - 1, W, 1).fill(LINE);
  // Geometric mini accent
  doc.moveTo(W - 48, 0).lineTo(W, 0).lineTo(W, 18).fill(NAVY);
  doc.moveTo(W - 28, 0).lineTo(W, 0).lineTo(W, 10).fill(BLUE);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(7);
  doc.text(clean(company, 42).toUpperCase(), MX, 10, { width: CW * 0.55, lineBreak: false });
  doc.fillColor(MUTED).font('Helvetica').fontSize(6.5);
  doc.text(`COMPANY PROFILE  ·  ${YEAR}`, MX, 10, {
    width: CW - 36,
    align: 'right',
    lineBreak: false,
  });
  doc.restore();
}

function drawFooter(doc, pageNo, total, tagline, phone, website) {
  doc.save();
  doc.rect(0, H - FOOTER_H, W, FOOTER_H).fill(NAVY);
  // Blue facet on footer edge
  doc.moveTo(0, H - FOOTER_H).lineTo(36, H - FOOTER_H).lineTo(0, H - FOOTER_H + 16).fill(BLUE);
  doc.fillColor('#94a3b8').font('Helvetica').fontSize(6.5);
  doc.text(clean(tagline || 'The Result Of Unity', 36), MX, H - 20, {
    width: CW * 0.32,
    lineBreak: false,
  });
  if (phone || website) {
    doc.fillColor(WHITE).font('Helvetica').fontSize(6.5);
    doc.text([clean(phone, 22), clean(website, 28)].filter(Boolean).join('   ·   '), MX + CW * 0.34, H - 20, {
      width: CW * 0.4,
      lineBreak: false,
    });
  }
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8);
  doc.text(`${String(pageNo).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, MX, H - 20, {
    width: CW,
    align: 'right',
    lineBreak: false,
  });
  doc.restore();
}

function sectionHead(doc, kicker, title, y, lead = '') {
  // Geometric eyebrow
  doc.rect(MX, y + 3, 12, 3).fill(BLUE);
  doc.rect(MX + 14, y + 3, 6, 3).fill(NAVY);
  doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(7);
  doc.text(clean(kicker, 56).toUpperCase(), MX + 26, y, { characterSpacing: 1.2 });
  y += 18;

  doc.fillColor(INK).font('Helvetica-Bold').fontSize(20);
  const th = doc.heightOfString(clean(title, 90), { width: CW * 0.9, lineGap: 1 });
  doc.text(clean(title, 90), MX, y, { width: CW * 0.9, lineGap: 1 });
  y += th + 8;
  doc.rect(MX, y, 32, 3).fill(BLUE);
  doc.rect(MX + 34, y, 10, 3).fill(NAVY);
  y += 14;
  if (lead) {
    doc.fillColor(MUTED).font('Helvetica').fontSize(9);
    const lh = doc.heightOfString(clean(lead, 320), { width: CW * 0.92, lineGap: 2.4 });
    doc.text(clean(lead, 320), MX, y, { width: CW * 0.92, lineGap: 2.4 });
    y += lh + 16;
  }
  return y;
}

function bodyText(doc, str, x, y, width, opts = {}) {
  const size = opts.size || 9.2;
  const color = opts.color || SLATE;
  const align = opts.align || 'left';
  const maxH = opts.maxH || 999;
  const font = opts.bold ? 'Helvetica-Bold' : opts.italic ? 'Helvetica-Oblique' : 'Helvetica';
  doc.fillColor(color).font(font).fontSize(size);
  const t = clean(str);
  if (!t) return y;
  const h = Math.min(doc.heightOfString(t, { width, align, lineGap: opts.lineGap ?? 2.8 }), maxH);
  doc.text(t, x, y, { width, align, lineGap: opts.lineGap ?? 2.8, height: maxH, ellipsis: true });
  return y + h;
}

function factPair(doc, rows, startY, cols = 2) {
  let y = startY;
  const colW = (CW - (cols - 1) * 14) / cols;
  rows.forEach((row, i) => {
    const col = i % cols;
    const rowI = Math.floor(i / cols);
    const x = MX + col * (colW + 14);
    const yy = startY + rowI * 40;
    doc.fillColor(MUTED).font('Helvetica').fontSize(6.5).text(String(row[0]).toUpperCase(), x, yy, {
      characterSpacing: 0.6,
    });
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(8.5).text(clean(row[1], 78), x, yy + 11, {
      width: colW,
    });
    y = Math.max(y, yy + 36);
  });
  return y;
}

function rule(doc, y) {
  doc.strokeColor(LINE).lineWidth(0.6);
  doc.moveTo(MX, y).lineTo(MX + CW, y).stroke();
  return y + 12;
}

/* ── Data ──────────────────────────────────────────────────── */
async function loadData() {
  const [settings, projects, services, team, clients, awards, testimonials, milestones, gallery, equipment, whatWeBuild] =
    await Promise.all([
      Settings.findOne().lean(),
      Project.find({ published: true }).sort({ featured: -1, order: 1, createdAt: -1 }).lean(),
      Service.find({ published: true }).sort({ order: 1 }).lean(),
      TeamMember.find({ published: true }).sort({ order: 1 }).lean(),
      Client.find({ published: true }).sort({ order: 1 }).lean(),
      Award.find({ published: true }).sort({ order: 1 }).lean(),
      Testimonial.find({ published: true }).sort({ order: 1 }).lean(),
      Milestone.find({ published: true }).sort({ order: 1 }).lean(),
      Gallery.find({ published: true }).sort({ order: 1 }).lean(),
      Equipment.find({ published: true }).sort({ order: 1, category: 1 }).lean(),
      WhatWeBuild.find({ published: true }).sort({ order: 1 }).lean(),
    ]);
  return {
    settings: settings || {},
    projects: projects || [],
    services: services || [],
    team: team || [],
    clients: clients || [],
    awards: awards || [],
    testimonials: testimonials || [],
    milestones: milestones || [],
    gallery: gallery || [],
    equipment: equipment || [],
    whatWeBuild: whatWeBuild || [],
  };
}

async function loadDataCached() {
  const now = Date.now();
  if (_dataCache.data && now - _dataCache.at < DATA_TTL_MS) return _dataCache.data;
  const data = await loadData();
  _dataCache = { at: now, data };
  return data;
}

function contentFingerprint(data) {
  const stamp = [
    PROFILE_VERSION,
    data.settings?.updatedAt,
    data.settings?.aboutLong,
    data.settings?.aboutShort,
    data.settings?.foundingStory,
    data.settings?.mission,
    data.settings?.vision,
    ...data.projects.map((p) => `${p._id}${p.updatedAt}${p.status}${p.contractValue}`),
    ...data.services.map((s) => `${s._id}${s.updatedAt}`),
    ...data.team.map((t) => `${t._id}${t.updatedAt}`),
    ...data.clients.map((c) => `${c._id}${c.updatedAt}`),
    ...data.awards.map((a) => `${a._id}${a.updatedAt}`),
    ...data.testimonials.map((t) => `${t._id}${t.updatedAt}`),
    ...data.milestones.map((m) => `${m._id}${m.updatedAt}`),
    ...data.equipment.map((e) => `${e._id}${e.updatedAt}`),
    ...data.whatWeBuild.map((w) => `${w._id}${w.updatedAt}`),
  ].join('|');
  return crypto.createHash('sha1').update(stamp).digest('hex');
}

export async function getProfileStatus() {
  if (!fs.existsSync(CACHE_META)) return { cached: false, hash: null, generatedAt: null };
  try {
    const meta = JSON.parse(fs.readFileSync(CACHE_META, 'utf8'));
    const data = await loadDataCached();
    const currentHash = contentFingerprint(data);
    return {
      cached: true,
      hash: meta.hash,
      currentHash,
      upToDate: meta.hash === currentHash,
      generatedAt: meta.generatedAt,
      version: meta.version || PROFILE_VERSION,
      fileSize: fs.existsSync(CACHE_PDF) ? fs.statSync(CACHE_PDF).size : 0,
    };
  } catch {
    return { cached: false, hash: null, generatedAt: null };
  }
}

export function invalidateProfileCache() {
  try {
    if (fs.existsSync(CACHE_META)) fs.unlinkSync(CACHE_META);
    if (fs.existsSync(CACHE_PDF)) fs.unlinkSync(CACHE_PDF);
  } catch {
    /* ignore */
  }
  _dataCache = { at: 0, data: null };
  _imgCache.clear();
}

/* ── Defaults (used when CMS fields empty) ─────────────────── */
const DEFAULT_ABOUT =
  'Kassa & Sons Construction PLC (KASCON) is a Grade-1 general contractor founded in 1980. For more than four decades the company has delivered building, fuel-station, infrastructure and industrial works across Ethiopia. With owned plant, experienced technical teams and documented HSEQ controls, KASCON combines self-performed production capacity with disciplined programme and cost management for public and private clients.';

const DEFAULT_HISTORY =
  'Established in 1980 by Ato Kassa G/Tsadik, the firm grew from a family construction enterprise into a multidisciplinary Grade-1 contractor. Over successive decades KASCON invested in ready-mix production, aggregate processing, steel fabrication and a heavy-equipment fleet — enabling reliable self-performance on complex multi-discipline contracts.';

const DEFAULT_APPROACH = [
  {
    title: 'Planning & mobilisation',
    description: 'Early constructability review, method statements, resource loading and clear programme baselines before site start.',
  },
  {
    title: 'Self-performed works',
    description: 'Owned batching, aggregates, steel and plant reduce dependency on third parties and protect quality and schedule.',
  },
  {
    title: 'Controls & reporting',
    description: 'Progress measurement, variation control, quality records and transparent client reporting throughout delivery.',
  },
  {
    title: 'Handover & close-out',
    description: 'Snagging, as-built documentation, training where required, and orderly demobilisation of plant and personnel.',
  },
];

const DEFAULT_HSEQ = [
  {
    t: 'Occupational safety',
    d: 'Site inductions, toolbox talks, PPE enforcement, permit-to-work discipline and incident reporting on every active project.',
  },
  {
    t: 'Quality assurance',
    d: 'Material testing, mix-design verification, dimensional checks, inspection & test plans and documented quality records.',
  },
  {
    t: 'Environmental care',
    d: 'Responsible site practices for spoil, dust, noise and waste — protecting workers, neighbours and the environment.',
  },
  {
    t: 'Regulatory compliance',
    d: 'Grade-1 contractor licence, trade licence, TIN, VAT registration and environmental compliance kept current.',
  },
];

const DEFAULT_SERVICES = [
  {
    title: 'Building Construction',
    summary:
      'Residential, commercial, institutional and mixed-use buildings — from foundations and structure through finishes and external works.',
  },
  {
    title: 'Fuel Stations & Depots',
    summary: 'Retail fuel stations, tank farms, depots and aviation fuel facilities delivered to operator and HSEQ standards.',
  },
  {
    title: 'Roads & Infrastructure',
    summary: 'Earthworks, drainage, access roads, paving and supporting civil infrastructure for urban and industrial sites.',
  },
  {
    title: 'Structural Steel',
    summary: 'Workshop fabrication, site erection, canopies, frames and technical metal works coordinated with civil packages.',
  },
  {
    title: 'Ready-Mix Concrete',
    summary: 'Owned batching plant production with transit-mixer delivery and coordinated supply to KASCON and third-party sites.',
  },
  {
    title: 'Aggregates & Materials',
    summary: 'Quarry and crusher production of graded aggregates and bulk construction materials for concrete and road works.',
  },
];

/* ── Build ─────────────────────────────────────────────────── */
async function buildPdf(data, outPath) {
  const s = data.settings;
  const company = clean(s.companyName) || 'Kassa & Sons Construction PLC';
  const tagline = clean(s.tagline) || 'The Result Of Unity';
  const grade = clean(s.grade) || 'Grade-1 General Contractor';
  const founded = clean(s.foundedYear) || '1980';
  const years = clean(s.yearsExperience) || '46+';
  const specialists = clean(s.specialists) || '108';
  const projectCount = clean(s.projectCount) || String(Math.max(data.projects.length, 37));
  const capital = clean(s.capital) || 'ETB 25.493 million';
  const phone = clean(s.phone || (Array.isArray(s.phones) ? s.phones[0] : '')) || '+251 911 203 874';
  const email = clean(s.email || (Array.isArray(s.emails) ? s.emails[0] : '')) || 'kasconpl@gmail.com';
  const website = clean(s.website) || 'www.kasconplc.com';
  const address =
    clean(s.address) || 'Gurd Shola, Cheshire Services Ethiopia Building, 3rd Floor, Addis Ababa';
  const ops =
    clean(s.legetafoAddress || s.operationsAddress || s.plantAddress) || 'Legetafo City, Ethiopia';
  const about = clean(s.aboutLong || s.aboutShort, 2200) || DEFAULT_ABOUT;
  const history = clean(s.foundingStory || s.historicalBackground, 1600) || DEFAULT_HISTORY;
  const mission = clean(s.mission, 700);
  const vision = clean(s.vision, 700);
  const values = Array.isArray(s.values) ? s.values.filter((v) => v?.title).slice(0, 6) : [];
  const specializations = Array.isArray(s.specializations)
    ? s.specializations.filter((v) => v?.title).slice(0, 8)
    : [];
  const historicalContent = Array.isArray(s.historicalContent)
    ? s.historicalContent.filter((v) => v?.title).slice(0, 6)
    : [];
  const headline =
    clean(s.headline, 110) || 'Building Ethiopia with integrity, capacity and disciplined delivery.';
  const ownerName = clean(s.ownerName) || 'Ato Kassa G/Tsadik';
  const ownerTitle = clean(s.ownerTitle) || 'Founder & Chairman';
  const ownerBio = clean(s.ownerBio, 900);
  const ownerQuote = clean(s.ownerQuote, 280);

  const hseqPage = s.hseqPage || {};
  const capacityCopy = s.home?.capacity || {};
  const approachItems =
    (Array.isArray(s.about?.approach?.items) && s.about.approach.items.filter((i) => i?.title).length
      ? s.about.approach.items
      : DEFAULT_APPROACH
    ).slice(0, 4);

  const hseqItems =
    (Array.isArray(hseqPage.safetyCommitments) && hseqPage.safetyCommitments.length
      ? hseqPage.safetyCommitments.map((c) => ({ t: c.title, d: c.desc }))
      : Array.isArray(s.capabilitiesPage?.hseq) && s.capabilitiesPage.hseq.length
        ? s.capabilitiesPage.hseq.map((c) => ({ t: c.title, d: c.description }))
        : DEFAULT_HSEQ
    ).slice(0, 6);

  const registrations =
    (Array.isArray(hseqPage.registrations) && hseqPage.registrations.length
      ? hseqPage.registrations
      : [
          { label: 'Contractor grade', value: grade },
          { label: 'Registered capital', value: capital },
          { label: 'Founded', value: founded },
          { label: 'Trade & tax', value: 'Trade licence · TIN · VAT — current' },
        ]
    ).slice(0, 8);

  const plantFacts =
    (Array.isArray(s.readyMixPage?.plantFacts) && s.readyMixPage.plantFacts.length
      ? s.readyMixPage.plantFacts
      : [
          { label: 'Ready-mix plant', value: 'Owned batching capacity' },
          { label: 'Aggregates', value: 'Crusher & graded products' },
          { label: 'Steel workshop', value: 'Fabrication & erection' },
          { label: 'Fleet', value: 'Transit mixers & heavy plant' },
        ]
    ).slice(0, 8);

  const completed = data.projects.filter((p) => String(p.status || '').toLowerCase() === 'completed');
  const ongoing = data.projects.filter((p) => String(p.status || '').toLowerCase() === 'ongoing');
  const featured = data.projects.filter((p) => p.featured).slice(0, 8);
  const showFeatured = (featured.length ? featured : data.projects).slice(0, 6);
  const detailProjects = (featured.length ? featured : completed).slice(0, 6);
  const services = (data.services.length ? data.services : DEFAULT_SERVICES).slice(0, 9);
  const team = data.team.slice(0, 10);
  const clients = data.clients.slice(0, 18);
  const awards = data.awards.slice(0, 8);
  const testimonials = data.testimonials.filter((t) => clean(t.quote)).slice(0, 4);
  const milestones = data.milestones.slice(0, 10);
  const equipment = data.equipment.slice(0, 24);
  const sectors = data.whatWeBuild.length
    ? data.whatWeBuild.map((w) => w.category)
    : [...new Set(data.projects.map((p) => p.category).filter(Boolean))];

  const totalValue = data.projects.reduce((sum, p) => sum + (Number(p.contractValue) || 0), 0);

  // Pre-resolve images
  const urlSet = new Set(
    [
      s.heroImage,
      s.whoWeAreImage,
      s.logo,
      s.ownerImage,
      s.about?.company?.aboutImage,
      hseqPage.image,
      '/media/home/hero.jpg',
      '/media/home/brand-2.jpg',
      '/media/about/site.jpg',
      '/media/about/about-2.jpg',
      '/media/about/plant.jpg',
      '/media/projects/p-01.jpg',
      '/media/projects/p-02.jpg',
      '/media/projects/p-03.jpg',
      '/media/logo.png',
      '/media/founder/kass.jpg',
      ...showFeatured.map((p) => p.coverImage),
      ...detailProjects.map((p) => p.coverImage),
      ...team.slice(0, 8).map((m) => m.photo),
      ...equipment.slice(0, 8).map((e) => e.image),
    ].filter(Boolean)
  );
  const urls = [...urlSet];
  const resolved = await mapLimit(urls, 6, (u) => resolveImage(u).catch(() => null));
  const img = Object.fromEntries(urls.map((u, i) => [u, resolved[i]]));
  const pick = (...keys) => {
    for (const k of keys) {
      if (k && img[k]) return img[k];
    }
    return null;
  };

  const heroImg = pick(s.heroImage, '/media/home/hero.jpg', '/media/about/site.jpg');
  const aboutImg = pick(
    s.whoWeAreImage,
    s.about?.company?.aboutImage,
    '/media/about/about-2.jpg',
    '/media/about/plant.jpg'
  );
  const logo = pick(s.logo, '/media/logo.png');
  const ownerImg = pick(s.ownerImage, '/media/founder/kass.jpg');
  const plantImg = pick(hseqPage.image, '/media/about/plant.jpg', '/media/about/site.jpg');

  // Three distinct cover collage images (site / build / plant)
  const coverImg1 = pick(
    s.heroImage,
    '/media/home/hero.jpg',
    '/media/projects/p-01.jpg',
    '/media/about/site.jpg'
  );
  const coverImg2 = pick(
    s.whoWeAreImage,
    '/media/about/about-2.jpg',
    '/media/home/brand-2.jpg',
    '/media/projects/p-02.jpg',
    aboutImg
  );
  const coverImg3 = pick(
    plantImg,
    '/media/about/plant.jpg',
    '/media/about/site.jpg',
    '/media/projects/p-03.jpg',
    coverImg1
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margin: 0,
      bufferPages: true,
      info: {
        Title: 'KASCON Company Profile',
        Author: company,
        Subject: 'Corporate company profile for tenders and prequalification',
        Keywords: 'construction, Ethiopia, Grade-1, KASCON, contractor',
      },
    });

    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);
    stream.on('finish', () => resolve(outPath));
    stream.on('error', reject);
    doc.on('error', reject);

    let y = 0;

    const newContentPage = () => {
      doc.addPage({ size: 'A4', layout: 'portrait', margin: 0 });
      doc.rect(0, 0, W, H).fill(WHITE);
      // Minimal corner accent — does not collide with content
      doc.moveTo(W, 0).lineTo(W, 42).lineTo(W - 52, 0).fill(NAVY);
      doc.moveTo(W, 0).lineTo(W, 26).lineTo(W - 30, 0).fill(BLUE);
      drawHeader(doc, company);
      return CONTENT_TOP;
    };

    const need = (minH) => {
      if (y + minH > CONTENT_BOTTOM) y = newContentPage();
    };

    /* ========== 1. COVER — clean editorial grid (no overlaps) ========== */
    /*
      Grid (A4):
      - Top brand bar
      - Title + intro column (left) | media mosaic (right)
      - Stats row (4 equal cards)
      - Contact footer
    */
    doc.rect(0, 0, W, H).fill(WHITE);

    // Top-right geometric accent only (kept clear of text/images)
    doc.moveTo(W, 0).lineTo(W, 168).lineTo(W - 48, 188).lineTo(W - 168, 0).fill(NAVY);
    doc.moveTo(W, 0).lineTo(W, 118).lineTo(W - 28, 132).lineTo(W - 112, 0).fill(BLUE);

    /* --- Brand --- */
    const brandY = 34;
    if (logo) {
      try {
        doc.image(logo, MX, brandY, { height: 34 });
      } catch {
        roundedFill(doc, MX, brandY, 34, 34, BLUE, 8);
        doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11).text('KS', MX, brandY + 10, {
          width: 34,
          align: 'center',
        });
      }
    } else {
      roundedFill(doc, MX, brandY, 34, 34, BLUE, 8);
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11).text('KS', MX, brandY + 10, {
        width: 34,
        align: 'center',
      });
    }
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10);
    doc.text('KASSA & SONS', MX + 44, brandY + 4);
    doc.fillColor(MUTED).font('Helvetica').fontSize(7.5);
    doc.text('CONSTRUCTION PLC', MX + 44, brandY + 18);
    doc.fillColor(MUTED).font('Helvetica').fontSize(7);
    doc.text(`EDITION ${YEAR}`, MX, brandY + 10, { width: CW, align: 'right' });

    /* --- Title block (left column) --- */
    const colL = MX;
    const colLW = 200;
    const colR = colL + colLW + 18; // media start
    const colRW = W - colR - MX;

    doc.fillColor(INK).font('Helvetica-Bold').fontSize(32);
    doc.text('COMPANY', colL, 96, { width: colLW, characterSpacing: 0.6 });
    doc.text('PROFILE', colL, 132, { width: colLW, characterSpacing: 0.6 });

    doc.rect(colL, 178, 40, 3).fill(BLUE);
    doc.rect(colL + 44, 178, 12, 3).fill(NAVY);

    doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(7.5);
    doc.text(grade.toUpperCase(), colL, 192, { width: colLW, characterSpacing: 1.1 });

    doc.fillColor(SLATE).font('Helvetica').fontSize(10);
    doc.text(headline || 'Leading with Integrity. Delivering with Purpose.', colL, 218, {
      width: colLW,
      lineGap: 3,
    });

    doc.fillColor(MUTED).font('Helvetica').fontSize(6.5);
    doc.text('PRESENTED BY', colL, 290, { characterSpacing: 1.3 });
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(10);
    doc.text((ownerName || 'KASCON').toUpperCase(), colL, 304, { width: colLW });
    doc.fillColor(ACCENT).font('Helvetica-Oblique').fontSize(9.5);
    doc.text(`“${tagline}”`, colL, 324, { width: colLW });

    // Left column secondary facts (fills space beside lower images)
    doc.rect(colL, 360, 28, 2).fill(LINE);
    const leftFacts = [
      ['Founded', founded],
      ['Capital', capital],
      ['Head office', 'Addis Ababa'],
      ['Operations', 'Legetafo'],
    ];
    leftFacts.forEach((f, i) => {
      const yy = 378 + i * 36;
      doc.fillColor(MUTED).font('Helvetica').fontSize(6.5).text(f[0].toUpperCase(), colL, yy, {
        characterSpacing: 0.6,
      });
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(9).text(clean(f[1], 28), colL, yy + 12, {
        width: colLW,
      });
    });

    // Vertical rule separating columns
    doc.strokeColor(LINE).lineWidth(0.8);
    doc.moveTo(colR - 9, 96).lineTo(colR - 9, 526).stroke();

    /* --- Media mosaic (right) — 3 rounded frames, zero overlap --- */
    const mTop = 96;
    const gap = 10;
    const topH = 268;
    const botH = 152;

    // Top hero image
    drawShapedImage(doc, coverImg1, colR, mTop, colRW, topH, {
      radius: 14,
      ring: true,
      ringColor: WHITE,
      shadow: true,
    });
    // Caption chip on hero
    roundedFill(doc, colR + 12, mTop + topH - 28, 72, 16, NAVY, 8);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(6).text('PROJECTS', colR + 20, mTop + topH - 23);

    // Bottom pair
    const halfW = (colRW - gap) / 2;
    const botY = mTop + topH + gap;
    drawShapedImage(doc, coverImg2, colR, botY, halfW, botH, {
      radius: 12,
      ring: true,
      ringColor: WHITE,
      shadow: true,
    });
    drawShapedImage(doc, coverImg3, colR + halfW + gap, botY, halfW, botH, {
      radius: 12,
      ring: true,
      ringColor: WHITE,
      shadow: true,
    });
    roundedFill(doc, colR + 8, botY + botH - 24, 54, 14, BLUE, 7);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(5.5).text('DELIVERY', colR + 14, botY + botH - 20);
    roundedFill(doc, colR + halfW + gap + 8, botY + botH - 24, 48, 14, NAVY, 7);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(5.5).text('PLANT', colR + halfW + gap + 16, botY + botH - 20);

    const mosaicBottom = botY + botH; // ~526

    /* --- Feature band --- */
    const bandY = mosaicBottom + 18;
    roundedFill(doc, MX, bandY, CW, 56, SOFT, 12);
    doc.rect(MX, bandY, 4, 56).fill(BLUE);
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9);
    doc.text('Grade-1 contractor  ·  Owned plant  ·  Multi-discipline delivery', MX + 18, bandY + 14, {
      width: CW - 36,
    });
    doc.fillColor(MUTED).font('Helvetica').fontSize(8);
    doc.text(
      'Prepared for tenders, joint ventures and prequalification committees across Ethiopia.',
      MX + 18,
      bandY + 32,
      { width: CW - 36 }
    );

    /* --- Stats row — equal cards --- */
    const statsY = bandY + 72;
    const coverStats = [
      [years, 'Years experience'],
      [projectCount, 'Projects delivered'],
      [specialists, 'Specialists'],
      ['G1', 'Contractor grade'],
    ];
    const sGap = 10;
    const sW = (CW - sGap * 3) / 4;
    coverStats.forEach((st, i) => {
      const x = MX + i * (sW + sGap);
      roundedFill(doc, x, statsY, sW, 74, i % 2 === 0 ? NAVY : WHITE, 12);
      if (i % 2 !== 0) roundedStroke(doc, x, statsY, sW, 74, LINE, 12, 0.7);
      doc.rect(x + 12, statsY + 12, 16, 2.5).fill(i % 2 === 0 ? BLUE : ACCENT);
      doc.fillColor(i % 2 === 0 ? WHITE : INK).font('Helvetica-Bold').fontSize(15);
      doc.text(clean(st[0], 10), x + 12, statsY + 24, { width: sW - 24 });
      doc.fillColor(i % 2 === 0 ? '#94a3b8' : MUTED).font('Helvetica').fontSize(6.5);
      doc.text(st[1].toUpperCase(), x + 12, statsY + 50, { width: sW - 24 });
    });

    /* --- Contact footer --- */
    doc.rect(0, H - 52, W, 52).fill(NAVY);
    doc.moveTo(0, H - 52).lineTo(40, H - 52).lineTo(0, H - 32).fill(BLUE);
    doc.fillColor(WHITE).font('Helvetica').fontSize(9);
    doc.text(phone, MX, H - 30);
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(7.5);
    doc.text(`Official edition  ·  ${YEAR}`, MX, H - 30, { width: CW, align: 'center' });
    doc.fillColor(WHITE).font('Helvetica').fontSize(9);
    doc.text(website, MX, H - 30, { width: CW, align: 'right' });

    /* ========== 2. CONTENTS ========== */
    y = newContentPage();
    y = sectionHead(
      doc,
      'Document guide',
      'Contents',
      y,
      'A structured corporate profile for clients, consultants and evaluating committees.'
    );

    const toc = [
      ['01', 'Chairman’s message'],
      ['02', 'About KASCON'],
      ['03', 'History & milestones'],
      ['04', 'Vision, mission & values'],
      ['05', 'Company at a glance'],
      ['06', 'Sectors & specialisations'],
      ['07', 'Services'],
      ['08', 'Selected projects'],
      ['09', 'Project register'],
      ['10', 'Leadership'],
      ['11', 'Plant, equipment & capacity'],
      ['12', 'HSEQ & compliance'],
      ['13', 'Clients & references'],
      ['14', 'Contact'],
    ];
    toc.forEach((row, i) => {
      const yy = y + i * 28;
      if (i % 2 === 0) roundedFill(doc, MX, yy - 5, CW, 26, SOFT, 6);
      doc.rect(MX + 6, yy + 2, 4, 12).fill(i % 3 === 0 ? BLUE : NAVY);
      doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(9).text(row[0], MX + 16, yy + 2);
      doc.fillColor(TEXT).font('Helvetica').fontSize(10).text(row[1], MX + 48, yy + 2);
      doc.strokeColor(LINE).lineWidth(0.4);
      doc
        .moveTo(MX + 230, yy + 10)
        .lineTo(MX + CW - 8, yy + 10)
        .dash(1.2, { space: 2.2 })
        .stroke()
        .undash();
    });

    /* ========== 3. CHAIRMAN ========== */
    y = newContentPage();
    y = sectionHead(doc, '01  Leadership voice', 'Chairman’s message', y);

    // Modern quote card with circular portrait
    roundedFill(doc, MX, y, CW, 188, WHITE, 14);
    roundedStroke(doc, MX, y, CW, 188, LINE, 14, 0.5);
    drawAvatar(doc, ownerImg, MX + 18, y + 24, 112, {
      initials: (ownerName || 'K').charAt(0),
    });

    const cx = MX + 150;
    const cw = CW - 168;
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(14).text(ownerName, cx, y + 28);
    doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(7.5).text(ownerTitle.toUpperCase(), cx, y + 48, {
      characterSpacing: 0.9,
    });

    const chairLetter =
      ownerBio ||
      `Since founding this company in ${founded}, our purpose has remained constant: deliver construction that stands the test of time, protect the people who build it, and honour every commitment made to our clients. Grade-1 status is not a title we wear lightly — it is a daily discipline of planning, plant, people and integrity.`;

    bodyText(doc, chairLetter, cx, y + 66, cw, { size: 9, maxH: 78, color: SLATE });

    if (ownerQuote) {
      roundedFill(doc, cx, y + 148, cw, 28, '#f3e6e9', 8);
      doc.fillColor(ACCENT).font('Helvetica-Oblique').fontSize(8);
      doc.text(`“${ownerQuote}”`, cx + 10, y + 156, { width: cw - 20, height: 16, ellipsis: true });
    }

    y += 206;
    y = rule(doc, y);
    doc.fillColor(MUTED).font('Helvetica').fontSize(8.5);
    doc.text(
      'This profile summarises capability, selected delivery record and assurance systems for use in tenders, joint ventures and prequalification reviews.',
      MX,
      y,
      { width: CW, lineGap: 2.5 }
    );

    /* ========== 4. ABOUT ========== */
    y = newContentPage();
    y = sectionHead(
      doc,
      '02  Company',
      'About KASCON',
      y,
      'An established Grade-1 Ethiopian contractor with owned production capacity and multi-discipline delivery experience.'
    );

    // Asymmetric editorial image — offset accent frame
    if (aboutImg) {
      doc.save();
      doc.fillOpacity(0.12);
      roundedFill(doc, MX + 10, y + 10, CW - 10, 168, ACCENT, 14);
      doc.restore();
      doc.fillOpacity(1);
      drawMedia(doc, aboutImg, MX, y, CW - 10, 168, {
        radius: 14,
        kicker: 'KASCON',
        caption: 'Building Ethiopia since 1980',
        accent: true,
      });
      y += 188;
    }

    // Split about into paragraphs if long
    const aboutParts = about.split(/(?<=\.)\s+/).filter(Boolean);
    let aboutBlock = '';
    aboutParts.forEach((p) => {
      if ((aboutBlock + ' ' + p).length < 1100) aboutBlock += (aboutBlock ? ' ' : '') + p;
    });
    y = bodyText(doc, aboutBlock || about, MX, y, CW, { size: 9.3, maxH: 160, color: SLATE });
    y += 18;

    doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text('Corporate identity', MX, y);
    y += 14;
    y = factPair(
      doc,
      [
        ['Legal name', company],
        ['Trading name', 'KASCON'],
        ['Contractor grade', grade],
        ['Year founded', founded],
        ['Registered capital', capital],
        ['Experience', `${years} years`],
        ['Technical specialists', specialists],
        ['Projects delivered', projectCount],
        ['Head office', address],
        ['Operations / plant', ops],
        ['Telephone', phone],
        ['Email', email],
      ],
      y,
      2
    );

    /* ========== 5. HISTORY ========== */
    y = newContentPage();
    y = sectionHead(
      doc,
      '03  Heritage',
      'History & milestones',
      y,
      'From a family enterprise in 1980 to a Grade-1 contractor with integrated plant and nationwide delivery.'
    );

    y = bodyText(doc, history, MX, y, CW, { size: 9.3, maxH: 120, color: SLATE });
    y += 16;

    if (historicalContent.length) {
      historicalContent.forEach((item) => {
        need(52);
        doc.rect(MX, y, 3, 40).fill(ACCENT);
        doc.fillColor(INK).font('Helvetica-Bold').fontSize(9.5).text(clean(item.title, 60), MX + 12, y);
        doc.fillColor(MUTED).font('Helvetica').fontSize(8.5);
        doc.text(clean(item.description, 220), MX + 12, y + 14, { width: CW - 16, height: 28, ellipsis: true });
        y += 48;
      });
      y += 6;
    }

    doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text('Key milestones', MX, y);
    y += 14;

    const ms =
      milestones.length > 0
        ? milestones
        : [
            { year: '1980', title: 'Company founded', description: 'Ato Kassa G/Tsadik establishes the firm.' },
            { year: '2000s', title: 'Plant investment', description: 'Expansion into ready-mix, aggregates and steel.' },
            { year: '2010', title: 'Grade-1 licence', description: 'Recognised among Ethiopia’s top contractor grades.' },
            { year: String(YEAR), title: 'Continuing delivery', description: 'Active contracts across buildings, energy and infrastructure.' },
          ];

    ms.slice(0, 8).forEach((m, i) => {
      need(36);
      const yy = y;
      doc.circle(MX + 8, yy + 6, 3.5).fill(i === 0 ? ACCENT : NAVY);
      if (i < ms.slice(0, 8).length - 1) {
        doc.strokeColor(LINE).lineWidth(1);
        doc.moveTo(MX + 8, yy + 12).lineTo(MX + 8, yy + 34).stroke();
      }
      doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(9).text(clean(m.year, 12), MX + 22, yy, {
        width: 56,
      });
      doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9).text(clean(m.title, 50), MX + 80, yy, {
        width: CW - 80,
      });
      if (m.description) {
        doc.fillColor(MUTED).font('Helvetica').fontSize(8);
        doc.text(clean(m.description, 140), MX + 80, yy + 12, { width: CW - 80, height: 16, ellipsis: true });
      }
      y += 34;
    });

    /* ========== 6. VISION / MISSION / VALUES ========== */
    y = newContentPage();
    y = sectionHead(doc, '04  Principles', 'Vision, mission & values', y);

    const half = (CW - 12) / 2;
    doc.rect(MX, y, half, 148).fill(INK);
    doc.fillColor(ACCENT_SOFT).font('Helvetica-Bold').fontSize(7.5).text('VISION', MX + 14, y + 14, {
      characterSpacing: 1,
    });
    doc.fillColor(WHITE).font('Helvetica').fontSize(9);
    doc.text(
      vision || 'To be Ethiopia’s most trusted construction partner — recognised for excellence, safety and lasting value.',
      MX + 14,
      y + 34,
      { width: half - 28, lineGap: 2.8, height: 100, ellipsis: true }
    );

    doc.rect(MX + half + 12, y, half, 148).fill(SOFT);
    doc.rect(MX + half + 12, y, 3, 148).fill(ACCENT);
    doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(7.5).text('MISSION', MX + half + 26, y + 14, {
      characterSpacing: 1,
    });
    doc.fillColor(TEXT).font('Helvetica').fontSize(9);
    doc.text(
      mission ||
        'To deliver safe, high-quality construction through skilled people, owned plant, modern systems and uncompromising integrity.',
      MX + half + 26,
      y + 34,
      { width: half - 40, lineGap: 2.8, height: 100, ellipsis: true }
    );
    y += 164;

    doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text('Core values', MX, y);
    y += 14;

    const vals = values.length
      ? values
      : [
          { title: 'Safety & Quality', description: 'Protect people first; build work that lasts.' },
          { title: 'Integrity', description: 'Transparent decisions and accountable delivery.' },
          { title: 'Excellence', description: 'Modern methods and continuous improvement.' },
          { title: 'Teamwork', description: 'Disciplined collaboration across every site.' },
          { title: 'Reliability', description: 'Programmes and commitments clients can trust.' },
          { title: 'Stewardship', description: 'Responsible use of plant, materials and environments.' },
        ];

    vals.slice(0, 6).forEach((v, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const boxW = (CW - 12) / 2;
      const x = MX + col * (boxW + 12);
      const yy = y + row * 68;
      doc.rect(x, yy, boxW, 60).strokeColor(LINE).lineWidth(0.7).stroke();
      doc.rect(x, yy, 3, 60).fill(ACCENT);
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(9).text(clean(v.title, 36), x + 12, yy + 10, {
        width: boxW - 24,
      });
      doc.fillColor(MUTED).font('Helvetica').fontSize(8);
      doc.text(clean(v.description, 150), x + 12, yy + 26, {
        width: boxW - 24,
        height: 28,
        ellipsis: true,
        lineGap: 1.5,
      });
    });
    y += Math.ceil(Math.min(vals.length, 6) / 2) * 68 + 16;

    need(160);
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text('Delivery approach', MX, y);
    y += 14;
    approachItems.forEach((item, i) => {
      need(48);
      doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(9).text(String(i + 1).padStart(2, '0'), MX, y);
      doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9).text(clean(item.title, 48), MX + 28, y);
      doc.fillColor(MUTED).font('Helvetica').fontSize(8);
      doc.text(clean(item.description, 200), MX + 28, y + 13, { width: CW - 28, height: 24, ellipsis: true });
      y += 42;
    });

    /* ========== 7. AT A GLANCE ========== */
    y = newContentPage();
    y = sectionHead(
      doc,
      '05  Snapshot',
      'Company at a glance',
      y,
      'Key indicators for evaluating committees — capacity, scale and active delivery.'
    );

    const glance = [
      [years, 'Years of delivery'],
      [projectCount, 'Projects delivered'],
      [specialists, 'Technical specialists'],
      [grade.replace(/General Contractor/i, '').trim() || 'G1', 'Contractor licence'],
      [String(completed.length || '—'), 'Completed (on record)'],
      [String(ongoing.length || '—'), 'Active contracts'],
      [String(services.length), 'Service lines'],
      [totalValue ? moneyShort(totalValue) : capital, 'Portfolio value*'],
    ];
    glance.forEach((g, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const boxW = (CW - 24) / 4;
      const x = MX + col * (boxW + 8);
      const yy = y + row * 86;
      const dark = i % 2 === 0;
      roundedFill(doc, x, yy, boxW, 76, dark ? INK : WHITE, 12);
      if (!dark) roundedStroke(doc, x, yy, boxW, 76, LINE, 12, 0.5);
      doc.rect(x + 10, yy + 10, 16, 2.5).fill(ACCENT);
      doc.fillColor(dark ? WHITE : INK).font('Helvetica-Bold').fontSize(12);
      doc.text(clean(g[0], 18), x + 10, yy + 22, { width: boxW - 20 });
      doc.fillColor(dark ? '#94a3b8' : MUTED).font('Helvetica').fontSize(6.5);
      doc.text(g[1].toUpperCase(), x + 10, yy + 52, { width: boxW - 20 });
    });
    y += 190;

    doc.fillColor(MUTED).font('Helvetica').fontSize(7);
    doc.text('* Portfolio value sums recorded contract amounts in the CMS where available.', MX, y);
    y += 16;

    doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text('Registrations & standing', MX, y);
    y += 14;
    registrations.forEach((r, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const boxW = (CW - 12) / 2;
      const x = MX + col * (boxW + 12);
      const yy = y + row * 44;
      doc.rect(x, yy, boxW, 38).fill(SOFT);
      doc.fillColor(MUTED).font('Helvetica').fontSize(6.5).text(clean(r.label, 40).toUpperCase(), x + 10, yy + 8);
      doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9).text(clean(r.value, 50), x + 10, yy + 20, {
        width: boxW - 20,
      });
    });
    y += Math.ceil(registrations.length / 2) * 44 + 10;

    /* ========== 8. SECTORS ========== */
    y = newContentPage();
    y = sectionHead(
      doc,
      '06  Markets',
      'Sectors & specialisations',
      y,
      'Primary markets where KASCON has demonstrated repeatable delivery.'
    );

    const sectorList =
      sectors.length > 0
        ? sectors
        : ['Mixed-Use', 'Residential', 'Commercial', 'Fuel Station', 'Infrastructure', 'Industrial'];

    sectorList.slice(0, 8).forEach((sec, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const boxW = (CW - 24) / 4;
      const x = MX + col * (boxW + 8);
      const yy = y + row * 56;
      roundedFill(doc, x, yy, boxW, 48, WHITE, 10);
      roundedStroke(doc, x, yy, boxW, 48, LINE, 10, 0.5);
      doc.rect(x + 10, yy + 10, 14, 2.2).fill(ACCENT);
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(8.5).text(clean(sec, 22), x + 10, yy + 22, {
        width: boxW - 20,
      });
    });
    y += Math.ceil(Math.min(sectorList.length, 8) / 4) * 56 + 20;

    const specs = specializations.length
      ? specializations
      : [
          {
            title: 'Complex building works',
            description: 'Multi-storey and mixed-use packages with coordinated MEP interfaces.',
          },
          {
            title: 'Energy retail facilities',
            description: 'Fuel stations and depots executed to operator brand and safety standards.',
          },
          {
            title: 'Civil & earthworks',
            description: 'Site formation, drainage, roads and supporting infrastructure.',
          },
          {
            title: 'Integrated materials supply',
            description: 'Ready-mix and aggregates supporting programme certainty.',
          },
        ];

    doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text('Areas of specialisation', MX, y);
    y += 14;
    specs.slice(0, 8).forEach((sp, i) => {
      need(50);
      doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(8).text(String(i + 1).padStart(2, '0'), MX, y);
      doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9.5).text(clean(sp.title, 48), MX + 30, y);
      doc.fillColor(MUTED).font('Helvetica').fontSize(8.5);
      doc.text(clean(sp.description, 220), MX + 30, y + 14, { width: CW - 30, height: 26, ellipsis: true });
      y += 46;
    });

    /* ========== 9. SERVICES ========== */
    y = newContentPage();
    y = sectionHead(
      doc,
      '07  Capability',
      'Services',
      y,
      'Integrated construction services delivered with owned plant, experienced teams and documented controls.'
    );

    services.slice(0, 9).forEach((svc, i) => {
      need(78);
      const boxH = 70;
      roundedFill(doc, MX, y, CW, boxH, WHITE, 12);
      roundedStroke(doc, MX, y, CW, boxH, LINE, 12, 0.5);
      roundedFill(doc, MX + 12, y + 14, 28, 28, '#f3e6e9', 8);
      doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(9).text(String(i + 1).padStart(2, '0'), MX + 12, y + 23, {
        width: 28,
        align: 'center',
      });
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text(clean(svc.title, 55), MX + 52, y + 14, {
        width: CW - 68,
      });
      doc.fillColor(MUTED).font('Helvetica').fontSize(8.5);
      doc.text(clean(svc.summary || svc.description, 280), MX + 52, y + 32, {
        width: CW - 68,
        height: 30,
        ellipsis: true,
        lineGap: 1.8,
      });
      y += boxH + 10;
    });

    /* ========== 10. FEATURED PROJECTS — magazine cards ========== */
    y = newContentPage();
    y = sectionHead(
      doc,
      '08  Portfolio',
      'Selected projects',
      y,
      'Representative works illustrating sector range, scale and delivery discipline.'
    );

    // Hero featured project (first) — full-bleed media card
    if (detailProjects[0]) {
      const hero = detailProjects[0];
      need(210);
      drawMedia(doc, pick(hero.coverImage), MX, y, CW, 168, {
        radius: 14,
        kicker: clean(hero.category || hero.sector || 'Project', 28),
        caption: clean(hero.title, 42),
        accent: true,
      });
      y += 180;
      doc.fillColor(MUTED).font('Helvetica').fontSize(8);
      const heroMeta = [
        clean(hero.client, 32) && `Client: ${clean(hero.client, 32)}`,
        clean(hero.location, 28) && clean(hero.location, 28),
        clean(hero.year, 8),
        etb(hero.contractValue) !== '—' && etb(hero.contractValue),
      ]
        .filter(Boolean)
        .join('   ·   ');
      doc.text(heroMeta, MX, y, { width: CW });
      y += 12;
      doc.fillColor(SLATE).font('Helvetica').fontSize(8.5);
      doc.text(clean(hero.description || hero.scope, 320) || 'Delivered under KASCON project controls.', MX, y, {
        width: CW,
        height: 28,
        ellipsis: true,
      });
      y += 40;
    }

    // Remaining as 2-col modern media tiles
    const restProjects = detailProjects.slice(1);
    for (let i = 0; i < restProjects.length; i += 2) {
      need(168);
      const pair = restProjects.slice(i, i + 2);
      pair.forEach((p, j) => {
        const boxW = (CW - 12) / 2;
        const x = MX + j * (boxW + 12);
        drawMedia(doc, pick(p.coverImage), x, y, boxW, 110, {
          radius: 12,
          kicker: clean(p.category || p.status, 18),
          caption: clean(p.title, 28),
          accent: false,
        });
        doc.fillColor(MUTED).font('Helvetica').fontSize(7);
        doc.text(
          [clean(p.client, 20), moneyShort(p.contractValue)].filter(Boolean).join('  ·  '),
          x,
          y + 118,
          { width: boxW, lineBreak: false }
        );
      });
      y += 142;
    }

    /* ========== 11. PROJECT REGISTER ========== */
    y = newContentPage();
    y = sectionHead(
      doc,
      '09  Record',
      'Project register',
      y,
      'Summary of completed and active contracts recorded in the company information system.'
    );

    const drawTableHeader = (labels, widths) => {
      doc.rect(MX, y, CW, 18).fill(INK);
      let x = MX + 4;
      labels.forEach((lab, i) => {
        doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(6.5).text(lab.toUpperCase(), x, y + 5, {
          width: widths[i] - 4,
        });
        x += widths[i];
      });
      y += 18;
    };

    const widths = [18, 145, 105, 70, 55, CW - 18 - 145 - 105 - 70 - 55];
    drawTableHeader(['#', 'Project', 'Client', 'Sector', 'Status', 'Value'], widths);

    const register = [...completed.slice(0, 16), ...ongoing.slice(0, 6)];
    register.forEach((p, i) => {
      need(18);
      if (y === CONTENT_TOP) {
        // restarted page — redraw header
        doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text('Project register (continued)', MX, y);
        y += 16;
        drawTableHeader(['#', 'Project', 'Client', 'Sector', 'Status', 'Value'], widths);
      }
      if (i % 2 === 0) doc.rect(MX, y, CW, 16).fill(SOFT);
      let x = MX + 4;
      const cells = [
        String(i + 1),
        clean(p.title, 34),
        clean(p.client, 24),
        clean(p.category || p.sector, 14),
        clean(p.status, 10),
        moneyShort(p.contractValue),
      ];
      cells.forEach((cell, ci) => {
        doc.fillColor(TEXT).font('Helvetica').fontSize(6.5).text(cell, x, y + 4, {
          width: widths[ci] - 4,
          lineBreak: false,
        });
        x += widths[ci];
      });
      y += 16;
    });

    if (ongoing.length) {
      y += 14;
      need(40);
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(9).text('Active contracts — progress snapshot', MX, y);
      y += 12;
      ongoing.slice(0, 8).forEach((p, i) => {
        need(16);
        const prog = p.progress != null ? `${p.progress}%` : 'In progress';
        doc.fillColor(MUTED).font('Helvetica').fontSize(7.5);
        doc.text(
          `${i + 1}.  ${clean(p.title, 42)}  ·  ${clean(p.client, 22)}  ·  ${prog}  ·  ${etb(p.contractValue)}`,
          MX,
          y,
          { width: CW, lineBreak: false }
        );
        y += 14;
      });
    }

    /* ========== 12. LEADERSHIP ========== */
    y = newContentPage();
    y = sectionHead(
      doc,
      '10  People',
      'Leadership & key personnel',
      y,
      'Governance and operational leadership accountable for delivery performance.'
    );

    // Founder feature card
    roundedFill(doc, MX, y, CW, 128, WHITE, 14);
    roundedStroke(doc, MX, y, CW, 128, LINE, 14, 0.5);
    drawAvatar(doc, ownerImg, MX + 16, y + 18, 92, { initials: (ownerName || 'K').charAt(0) });
    {
      const tx = MX + 128;
      const tw = CW - 148;
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(13).text(ownerName, tx, y + 22);
      doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(7.5).text(ownerTitle.toUpperCase(), tx, y + 40, {
        characterSpacing: 0.8,
      });
      doc.fillColor(MUTED).font('Helvetica').fontSize(8.5);
      doc.text(
        ownerBio ||
          `Founded the company in ${founded}. Provides strategic direction spanning generations of construction excellence in Ethiopia.`,
        tx,
        y + 56,
        { width: tw, height: 56, ellipsis: true, lineGap: 2.2 }
      );
    }
    y += 144;

    doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text('Management team', MX, y);
    y += 14;

    const people = team.length
      ? team
      : [
          {
            name: 'Ato Getahun Kassa',
            role: 'General Manager',
            bio: 'B.Sc. Civil Engineering; 25+ years directing construction delivery.',
          },
          {
            name: 'Ato Alemayehu Kassa',
            role: 'Deputy General Manager',
            bio: 'Operations, project oversight and inter-department coordination.',
          },
        ];

    people.slice(0, 8).forEach((m) => {
      need(64);
      const photo = pick(m.photo);
      roundedFill(doc, MX, y, CW, 56, WHITE, 12);
      roundedStroke(doc, MX, y, CW, 56, LINE, 12, 0.5);
      drawAvatar(doc, photo, MX + 10, y + 8, 40, { initials: clean(m.name, 1).charAt(0) || 'K' });
      const px = MX + 62;
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(9.5).text(clean(m.name, 40), px, y + 10, {
        width: CW - 78,
      });
      doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(7).text(clean(m.role, 50).toUpperCase(), px, y + 24, {
        width: CW - 78,
      });
      doc.fillColor(MUTED).font('Helvetica').fontSize(7.5);
      doc.text(clean(m.bio || m.qualification || m.experience, 160), px, y + 36, {
        width: CW - 78,
        height: 14,
        ellipsis: true,
      });
      y += 64;
    });

    /* ========== 13. PLANT & EQUIPMENT ========== */
    y = newContentPage();
    y = sectionHead(
      doc,
      '11  Resources',
      'Plant, equipment & capacity',
      y,
      clean(capacityCopy.subtitle, 280) ||
        'KASCON owns and operates batching, crushing, steel fabrication and a heavy-equipment fleet — enabling direct delivery control.'
    );

    if (plantImg) {
      drawMedia(doc, plantImg, MX, y, CW, 150, {
        radius: 14,
        kicker: 'Production',
        caption: 'Owned plant & materials capacity',
        accent: true,
      });
      y += 166;
    }

    plantFacts.forEach((f, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const boxW = (CW - 24) / 4;
      const x = MX + col * (boxW + 8);
      const yy = y + row * 58;
      const dark = i % 2 === 0;
      roundedFill(doc, x, yy, boxW, 50, dark ? INK : WHITE, 10);
      if (!dark) roundedStroke(doc, x, yy, boxW, 50, LINE, 10, 0.5);
      doc.fillColor(dark ? '#94a3b8' : MUTED).font('Helvetica').fontSize(6.5);
      doc.text(clean(f.label, 24).toUpperCase(), x + 10, yy + 10, { width: boxW - 20 });
      doc.fillColor(dark ? WHITE : INK).font('Helvetica-Bold').fontSize(8);
      doc.text(clean(f.value, 28), x + 10, yy + 26, { width: boxW - 20 });
    });
    y += Math.ceil(Math.max(plantFacts.length, 1) / 4) * 58 + 16;

    if (equipment.length) {
      need(40);
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text('Equipment register (selected)', MX, y);
      y += 12;

      const eqW = [150, 90, 80, 50, CW - 150 - 90 - 80 - 50];
      doc.rect(MX, y, CW, 16).fill(INK);
      let ex = MX + 4;
      ['Equipment', 'Category', 'Capacity', 'Qty', 'Primary use'].forEach((lab, i) => {
        doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(6.5).text(lab.toUpperCase(), ex, y + 4, {
          width: eqW[i] - 4,
        });
        ex += eqW[i];
      });
      y += 16;

      equipment.slice(0, 16).forEach((e, i) => {
        need(16);
        if (i % 2 === 0) doc.rect(MX, y, CW, 15).fill(SOFT);
        let x = MX + 4;
        const cells = [
          clean(e.name || e.model, 32),
          clean(e.category, 16),
          clean(e.capacity, 14),
          e.quantity != null ? String(e.quantity) : '—',
          clean(e.mainUse || e.description, 36),
        ];
        cells.forEach((cell, ci) => {
          doc.fillColor(TEXT).font('Helvetica').fontSize(6.5).text(cell, x, y + 3, {
            width: eqW[ci] - 4,
            lineBreak: false,
          });
          x += eqW[ci];
        });
        y += 15;
      });
    } else {
      need(80);
      const fallbackEq = [
        ['Batching plant', 'Concrete', 'Owned production'],
        ['Stone crusher', 'Crushing', 'Graded aggregates'],
        ['Transit mixers', 'Transport', 'Site supply'],
        ['Excavators & loaders', 'Earthmoving', 'Site formation'],
        ['Steel workshop', 'Support', 'Fabrication'],
        ['Cranes & lifting', 'Lifting', 'Erection support'],
      ];
      fallbackEq.forEach((row, i) => {
        const col = i % 3;
        const r = Math.floor(i / 3);
        const boxW = (CW - 16) / 3;
        const x = MX + col * (boxW + 8);
        const yy = y + r * 58;
        doc.rect(x, yy, boxW, 50).strokeColor(LINE).lineWidth(0.6).stroke();
        doc.rect(x, yy, 3, 50).fill(ACCENT);
        doc.fillColor(INK).font('Helvetica-Bold').fontSize(8.5).text(row[0], x + 10, yy + 10, {
          width: boxW - 16,
        });
        doc.fillColor(MUTED).font('Helvetica').fontSize(7.5).text(`${row[1]}  ·  ${row[2]}`, x + 10, yy + 28, {
          width: boxW - 16,
        });
      });
      y += 130;
    }

    /* ========== 14. HSEQ ========== */
    y = newContentPage();
    y = sectionHead(
      doc,
      '12  Assurance',
      'HSEQ & compliance',
      y,
      clean(hseqPage.heroLead, 280) ||
        'Health, safety, quality and environmental controls embedded in every mobilisation and handover.'
    );

    for (let i = 0; i < Math.min(hseqItems.length, 6); i += 2) {
      need(86);
      const pair = hseqItems.slice(i, i + 2);
      pair.forEach((item, j) => {
        const boxW = (CW - 12) / 2;
        const x = MX + j * (boxW + 12);
        roundedFill(doc, x, y, boxW, 78, WHITE, 12);
        roundedStroke(doc, x, y, boxW, 78, LINE, 12, 0.5);
        roundedFill(doc, x + 12, y + 12, 8, 8, ACCENT, 4);
        doc.fillColor(INK).font('Helvetica-Bold').fontSize(9.5).text(clean(item.t || item.title, 40), x + 28, y + 12, {
          width: boxW - 40,
        });
        doc.fillColor(MUTED).font('Helvetica').fontSize(8);
        doc.text(clean(item.d || item.description || item.desc, 200), x + 12, y + 32, {
          width: boxW - 24,
          height: 38,
          ellipsis: true,
          lineGap: 1.6,
        });
      });
      y += 88;
    }

    if (awards.length) {
      need(40);
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text('Awards & recognition', MX, y);
      y += 12;
      awards.forEach((a) => {
        need(28);
        doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(8.5).text(clean(a.year, 12), MX, y, { width: 48 });
        doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9).text(clean(a.title, 55), MX + 52, y, {
          width: CW - 52,
        });
        y += 12;
        if (a.issuer) {
          doc.fillColor(MUTED).font('Helvetica').fontSize(7.5).text(clean(a.issuer, 70), MX + 52, y);
          y += 14;
        } else y += 8;
      });
    }

    /* ========== 15. CLIENTS ========== */
    y = newContentPage();
    y = sectionHead(
      doc,
      '13  Trust',
      'Clients & references',
      y,
      'Organisations that rely on KASCON for disciplined construction delivery.'
    );

    if (clients.length) {
      clients.slice(0, 18).forEach((c, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const boxW = (CW - 16) / 3;
        const x = MX + col * (boxW + 8);
        const yy = y + row * 36;
        roundedFill(doc, x, yy, boxW, 30, WHITE, 8);
        roundedStroke(doc, x, yy, boxW, 30, LINE, 8, 0.5);
        doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(7.5).text(clean(c.name || c.title, 30), x + 10, yy + 10, {
          width: boxW - 20,
          lineBreak: false,
        });
      });
      y += Math.ceil(Math.min(clients.length, 18) / 3) * 36 + 20;
    } else {
      doc.fillColor(MUTED).font('Helvetica').fontSize(9);
      doc.text('Client references available on request for prequalification packages.', MX, y);
      y += 24;
    }

    if (testimonials.length) {
      need(40);
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text('What clients say', MX, y);
      y += 12;
      testimonials.forEach((t) => {
        need(78);
        roundedFill(doc, MX, y, CW, 70, WHITE, 12);
        roundedStroke(doc, MX, y, CW, 70, LINE, 12, 0.5);
        roundedFill(doc, MX + 12, y + 12, 22, 22, '#f3e6e9', 11);
        doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(16).text('“', MX + 12, y + 12, {
          width: 22,
          align: 'center',
        });
        doc.fillColor(TEXT).font('Helvetica-Oblique').fontSize(8.5);
        doc.text(clean(t.quote, 280), MX + 42, y + 14, { width: CW - 58, height: 34, ellipsis: true, lineGap: 1.8 });
        doc.fillColor(INK).font('Helvetica-Bold').fontSize(8);
        doc.text(
          [clean(t.author || t.name, 32), clean(t.role || t.company || t.organization, 40)]
            .filter(Boolean)
            .join('  ·  '),
          MX + 42,
          y + 52,
          { width: CW - 58 }
        );
        y += 80;
      });
    }

    /* ========== 16. CONTACT ========== */
    y = newContentPage();
    y = sectionHead(
      doc,
      '14  Engage',
      'Contact & next steps',
      y,
      'Partner with KASCON for tendering, joint ventures and delivery programmes.'
    );

    roundedFill(doc, MX, y, CW, 310, INK, 16);
    doc.rect(MX, y, 5, 310).fill(ACCENT);

    doc.fillColor(ACCENT_SOFT).font('Helvetica-Bold').fontSize(8).text('KASSA & SONS CONSTRUCTION PLC', MX + 22, y + 22, {
      characterSpacing: 1,
    });
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(15).text('We welcome your enquiry', MX + 22, y + 42);

    const contactRows = [
      ['Head office', address],
      ['Operations / plant', ops],
      ['Telephone', phone],
      ['Email', email],
      ['Website', website],
      ['P.O. Box', clean(s.poBox) || 'P.O. Box 31219, Addis Ababa'],
      ['Working hours', clean(s.workingHours) || 'Monday – Saturday, business hours'],
    ];
    contactRows.forEach((r, i) => {
      const yy = y + 78 + i * 30;
      doc.fillColor(ACCENT_SOFT).font('Helvetica-Bold').fontSize(6.5).text(r[0].toUpperCase(), MX + 22, yy, {
        characterSpacing: 0.5,
      });
      doc.fillColor(WHITE).font('Helvetica').fontSize(9.5).text(clean(r[1], 90), MX + 22, yy + 11, {
        width: CW - 48,
      });
    });

    y += 328;
    doc.fillColor(MUTED).font('Helvetica').fontSize(7.5);
    doc.text(
      `Generated from verified KASCON CMS content · ${YEAR} · For official tenders and prequalification use only.`,
      MX,
      y,
      { width: CW, align: 'center' }
    );
    y += 14;
    doc.fillColor(ACCENT).font('Helvetica-Oblique').fontSize(9);
    doc.text(`“${tagline}”`, MX, y, { width: CW, align: 'center' });

    /* Page numbers (skip cover) */
    const range = doc.bufferedPageRange();
    const totalContent = Math.max(range.count - 1, 1);
    for (let i = 1; i < range.count; i += 1) {
      doc.switchToPage(i);
      drawFooter(doc, i, totalContent, tagline, phone, website);
    }

    doc.end();
  });
}

export async function getCompanyProfilePdf({ force = false } = {}) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

  const data = await loadDataCached();
  const hash = contentFingerprint(data);

  if (!force && fs.existsSync(CACHE_PDF) && fs.existsSync(CACHE_META)) {
    try {
      const meta = JSON.parse(fs.readFileSync(CACHE_META, 'utf8'));
      if (meta.hash === hash && fs.statSync(CACHE_PDF).size > 1000) return CACHE_PDF;
    } catch {
      /* regenerate */
    }
  }

  if (_buildPromise) return _buildPromise;

  _buildPromise = (async () => {
    _imgCache.clear();
    const tmp = path.join(CACHE_DIR, `company-profile.${process.pid}.${Date.now()}.tmp`);
    try {
      await buildPdf(data, tmp);
      if (!fs.existsSync(tmp) || fs.statSync(tmp).size === 0) {
        throw new Error('PDF build produced an empty file');
      }
      fs.renameSync(tmp, CACHE_PDF);
      fs.writeFileSync(
        CACHE_META,
        JSON.stringify(
          { hash, generatedAt: new Date().toISOString(), version: PROFILE_VERSION },
          null,
          2
        )
      );
      return CACHE_PDF;
    } catch (e) {
      try {
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      } catch {
        /* ignore */
      }
      throw e;
    } finally {
      _buildPromise = null;
    }
  })();

  return _buildPromise;
}
