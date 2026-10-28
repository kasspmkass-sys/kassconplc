#!/usr/bin/env node
/**
 * Populate the page-level CMS copy blocks so the admin CMS is the primary source
 * for page text instead of the hardcoded English fallbacks in the React pages.
 *
 * Every value below is copied verbatim from the verified fallback copy that
 * already ships in the frontend, so nothing new is invented and the rendered page
 * is unchanged. Frontend fallbacks are kept as safety defaults.
 *
 * Idempotent: only fields that are currently empty are written, so admin edits
 * are never overwritten. Use --force to overwrite anyway.
 *
 *   node src/scripts/seedPageContent.js            # dry run (default)
 *   node src/scripts/seedPageContent.js --apply    # write to DB
 *   node src/scripts/seedPageContent.js --apply --force
 *   npm run cms:pages
 *   npm run cms:pages -- --apply
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Settings from '../models/Settings.js';

const PAGE_DEFAULTS = {
  servicesPage: {
    kicker: 'Business areas',
    title: 'Nine integrated construction capabilities.',
    lead: 'Grade-1 delivery across buildings, energy facilities, civil works, fabrication and materials.',
    emptyState: 'Service details are being updated. Please check back shortly.',
    detail: {
      notFoundTitle: 'Service not found',
      allServicesLabel: 'All services',
      overviewLabel: 'Overview',
      noDescription: 'Details available on request.',
      capabilitiesLabel: 'Capabilities',
      processLabel: 'How we deliver',
      qualityLabel: 'Quality & compliance',
      equipmentLabel: 'Equipment & resources',
      galleryLabel: 'Gallery',
      enquiryCta: 'Enquire about this service',
    },
  },

  capabilitiesPage: {
    heroKicker: 'Capabilities',
    heroTitle: 'Owned capacity & physical resources.',
    heroLead:
      'KASCON operates its own concrete batching plant, stone crushing plant, steel fabrication workshop, heavy fleet and auto shop — delivering self-performed capacity that most contractors must outsource.',
    whyKicker: 'Why clients choose us',
    whyTitle: 'Self-performed plant & fabrication.',
    units: [
      {
        title: 'Concrete Batching Plant',
        icon: 'factory',
        anchor: 'concrete-batching',
        description:
          'Industrial ready-mix with documented transit mixers, vibrators and generators. Typical grades C-20 to C-30. Supplies both internal projects and external clients.',
        specs: [
          'Ready-mix concrete supply',
          'C-20 to C-30 grades',
          'Transit mixer fleet',
          'Concrete pump available',
        ],
      },
      {
        title: 'Stone Crushing Plant',
        icon: 'warehouse',
        anchor: 'stone-crushing',
        description:
          'Quarry and aggregate production — primary jaw crushing, secondary screening and dispatch for company projects and external supply.',
        specs: [
          'Primary jaw crusher',
          'Aggregate screening',
          'Various sizes produced',
          'Stock and dispatch facility',
        ],
      },
      {
        title: 'Steel Fabrication',
        icon: 'wrench',
        anchor: 'steel-fabrication',
        description:
          'Structural frames, canopies, shop and site welding aligned to EBCS / AISC practice and AWS D1.1 procedures.',
        specs: [
          'Structural steel fabrication',
          'Canopy & frame works',
          'Shop & site welding',
          'EBCS / AISC standards',
        ],
      },
      {
        title: 'Fleet & Auto Shop',
        icon: 'truck',
        anchor: 'fleet-auto-shop',
        description:
          'Owned transit mixers, loaders, dump trucks, mobile crane and in-house preventive maintenance for reliable uptime across all sites.',
        specs: [
          'Transit mixer fleet',
          'Heavy earthmoving plant',
          'Dump trucks & loaders',
          'Mobile crane',
          'In-house maintenance',
        ],
      },
    ],
    hseq: [
      {
        title: 'Safety Management System',
        description:
          'Structured safety programme with daily toolbox meetings, PPE enforcement, site inductions and incident reporting across all active projects.',
      },
      {
        title: 'Quality Assurance',
        description:
          'Material testing, mix-design verification, dimensional checks and documented quality records at every stage of construction.',
      },
      {
        title: 'Environmental Controls',
        description:
          'Responsible site practices protecting employees, neighbouring communities and the environment during construction.',
      },
      {
        title: 'Registrations & Compliance',
        description:
          'Grade-1 contractor licence, trade licence, TIN, VAT and environmental compliance — all active and current.',
      },
    ],
  },

  readyMixPage: {
    heroKicker: 'Ready-Mix Concrete',
    heroTitle: 'Batching plant with full QA documentation.',
    heroLead:
      "KASCON's concrete batching plant supplies C-15 to C-35 ready-mix concrete for building, civil and energy projects — with transit mixers, pump options and complete quality records.",
    plantKicker: 'Plant capabilities',
    plantTitle: 'Controlled batching. Verified quality.',
    plantFacts: [
      { label: 'Concrete Grades', value: 'C-15 to C-35' },
      { label: 'Transit Mixer Fleet', value: 'Multiple units' },
      { label: 'Pump Availability', value: 'On request' },
      { label: 'Laboratory Testing', value: 'Slump test · Cube test · Strength verification' },
      { label: 'Mix Design', value: 'Controlled batching per approved mix design' },
      { label: 'Quality Records', value: 'Full QA documentation' },
    ],
    /* capacityFacts intentionally left empty — no verified output figures exist. */
    concreteGrades: ['C-15', 'C-20', 'C-25', 'C-30', 'C-35'],
    qualityKicker: 'Quality control process',
    qualityTitle: 'From material inspection to quality record.',
    qualitySteps: [
      'Material Inspection',
      'Mix Design Approval',
      'Controlled Batching',
      'Slump Test',
      'Sampling',
      'Cube Test',
      'Strength Verification',
      'Quality Record',
    ],
    formKicker: 'Request a quotation',
    formTitle: 'Ready-Mix Concrete Request',
    formLead:
      'Complete this form and our team will respond with availability, pricing and programme.',
    successToast: 'Your request has been sent. We will respond shortly.',
    failToast: 'Failed to send. Please try again or call us directly.',
  },

  aggregatePage: {
    heroKicker: 'Aggregate Supply',
    heroTitle: 'Quarry & stone crushing plant.',
    heroLead:
      "KASCON's stone crushing plant produces coarse, medium and fine aggregates for building, road and civil engineering projects — with own transport fleet and stock facility for prompt dispatch.",
    plantKicker: 'Plant specifications',
    plantTitle: 'Primary crushing through to dispatch.',
    plantFacts: [
      { label: 'Crusher type', value: 'Primary jaw crusher' },
      { label: 'Screening', value: 'Multi-deck aggregate screening' },
      { label: 'Aggregate sizes', value: '¼" to ¾" and crusher dust' },
      { label: 'Stock facility', value: 'On-site stockpile for immediate dispatch' },
      { label: 'Loading', value: 'Front-end loader dispatch' },
      { label: 'Transport', value: 'Own dump truck fleet' },
    ],
    /* capacityFacts and products intentionally left empty — no verified figures exist. */
    aggregateSizes: [
      '¾" (19mm) — Coarse aggregate',
      '½" (12.5mm) — Medium aggregate',
      '¼" (6mm) — Fine aggregate / chips',
      'Crusher dust — Fine fill',
      'River sand — Where available',
    ],
    formKicker: 'Request a quotation',
    formTitle: 'Aggregate Supply Request',
    successToast: 'Your aggregate request has been sent. We will respond shortly.',
    failToast: 'Failed to send. Please try again or call us directly.',
  },

  equipmentPage: {
    heroKicker: 'Equipment & Fleet',
    heroTitle: 'Owned plant, machinery and fleet.',
    heroLead:
      'KASCON operates its own fleet of earthmoving equipment, transit mixers, transport vehicles, lifting gear and support machinery — enabling self-performed construction without subcontracting critical plant.',
    filterLabel: 'Filter equipment by category',
    searchPlaceholder: 'Search equipment…',
    emptyState: 'Equipment details are being added. Please check back shortly.',
    ctaKicker: 'Equipment rental & deployment',
    ctaTitle: 'Need specific plant or machinery?',
    ctaText:
      'Contact KASCON to discuss equipment availability, specifications and rental or deployment for your project.',
  },
};

const isEmpty = (v) =>
  v === undefined ||
  v === null ||
  v === '' ||
  (Array.isArray(v) && v.length === 0);

/* Stable deep-link ids for the known capability units, keyed by title. These are
   the anchors the Navbar, Footer and header admin already link to, so they must
   survive any later title edit. */
const UNIT_ANCHORS = new Map(
  PAGE_DEFAULTS.capabilitiesPage.units.map((u) => [u.title.toLowerCase(), u.anchor])
);

const slugify = (v) =>
  String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * Backfill `anchor` onto capability units that predate the field.
 *
 * Runs even when `capabilitiesPage.units` already has content (the normal
 * fill-empty pass skips non-empty arrays). It only ADDS a missing anchor — no
 * existing title, description, spec or icon is touched or removed.
 */
function collectAnchorWrites(units, prefix, out) {
  if (!Array.isArray(units)) return;
  units.forEach((unit, i) => {
    if (!unit || typeof unit !== 'object') return;
    if (!isEmpty(unit.anchor)) return;
    const anchor = UNIT_ANCHORS.get(String(unit.title || '').toLowerCase()) || slugify(unit.title);
    if (!anchor) return;
    out.push({ path: `${prefix}.${i}.anchor`, value: anchor, index: i });
  });
}

function collectWrites(target, defaults, prefix, out) {
  for (const [key, value] of Object.entries(defaults)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const current = target?.[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      collectWrites(current, value, path, out);
    } else if (isEmpty(current)) {
      out.push({ path, value });
    }
  }
}

async function main() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error('MONGODB_URI is required.');
    process.exit(1);
  }
  const apply = process.argv.includes('--apply');
  const force = process.argv.includes('--force');

  await mongoose.connect(uri);
  console.log(`Connected. mode=${apply ? 'APPLY' : 'DRY-RUN (add --apply to write)'}${force ? ' force=yes' : ''}`);

  const settings = (await Settings.findOne()) || (await Settings.create({}));
  const doc = settings.toObject();
  const writes = [];
  collectWrites(doc, PAGE_DEFAULTS, '', writes);
  /* Anchor backfill also runs against an already-populated units array. */
  collectAnchorWrites(doc?.capabilitiesPage?.units, 'capabilitiesPage.units', writes);

  for (const w of writes) {
    if (Number.isInteger(w.index)) {
      const unit = doc.capabilitiesPage.units[w.index];
      unit.anchor = w.value;
      console.log(`  set ${w.path}`);
      continue;
    }
    const keys = w.path.split('.');
    let cur = doc;
    for (let i = 0; i < keys.length - 1; i++) {
      if (typeof cur[keys[i]] !== 'object' || cur[keys[i]] === null) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = w.value;
    console.log(`  set ${w.path}`);
  }

  if (!writes.length) {
    console.log('Nothing to populate — every page-copy field already has a value.');
  } else if (apply) {
    const { _id, __v, createdAt, updatedAt, ...patch } = doc;
    settings.set(patch);
    await settings.save();
    console.log(`\nDone. wrote ${writes.length} field(s) to the Settings document.`);
  } else {
    console.log(`\nDone. ${writes.length} field(s) would be written. Nothing changed (dry run).`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
