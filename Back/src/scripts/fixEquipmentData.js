#!/usr/bin/env node
/**
 * Clean up the Equipment collection:
 *   1. Consolidate records that are the same piece of equipment (identical
 *      name + model + category) by merging their fields and summing quantity.
 *      The most complete record is kept so no image/spec data is lost.
 *   2. Renumber `order` into a gapless 1..N sequence so the admin reorder
 *      buttons and the public /equipment grid stay in a predictable order.
 *   3. Report categories that have no equipment (the public page already hides
 *      empty categories, so this is informational only — no data is invented).
 *   4. Report same-name records that are genuinely different machines, so an
 *      admin can give them distinct names instead of losing one of them.
 *   5. Flag text fields that contain leaked markup.
 *
 * Conservative by design: two records are only merged when name, model AND
 * category all match, and any record that is not an exact match is left alone.
 *
 *   node src/scripts/fixEquipmentData.js            # dry run (default)
 *   node src/scripts/fixEquipmentData.js --apply    # write to DB
 *   npm run repair:equipment
 *   npm run repair:equipment:apply
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Equipment, { EQUIPMENT_CATEGORIES_LIST } from '../models/Equipment.js';

const norm = (v) => String(v ?? '').trim().toLowerCase();

/** Identity of a physical machine: same name, model and category. */
const identity = (eq) => `${norm(eq.name)}|${norm(eq.model)}|${norm(eq.category)}`;

const isBlank = (v) => v === undefined || v === null || v === '';

/**
 * Strip LaTeX/markup that leaked into a plain-text CMS field, e.g.
 *   "1 Person cabin capacity & $9\text{ m}^3$ drum volume"
 *   -> "1 Person cabin capacity & 9 m³ drum volume"
 * Only applied when --fix-markup is passed, and always reported before/after.
 */
const SUPERSCRIPTS = { 0: '\u2070', 1: '\u00B9', 2: '\u00B2', 3: '\u00B3', 4: '\u2074' };

function cleanMarkup(value) {
  return String(value)
    .replace(/\\text\s*\{([^}]*)\}/g, '$1')
    .replace(/\\mathrm\s*\{([^}]*)\}/g, '$1')
    .replace(/\^\{?([0-9])\}?/g, (_, d) => SUPERSCRIPTS[d] ?? d)
    .replace(/\$+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Merge `source` into `target`, preferring values that are already set. */
function mergeInto(target, source) {
  for (const field of ['model', 'capacity', 'mainUse', 'description', 'image']) {
    if (isBlank(target[field]) && !isBlank(source[field])) target[field] = source[field];
  }
  const qty = [target.quantity, source.quantity]
    .map((q) => Number(q))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (qty.length) target.quantity = qty.reduce((a, b) => a + b, 0);
  /* Never let consolidating a duplicate hide the item entirely. */
  target.published = Boolean(target.published || source.published);
}

async function main() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error('MONGODB_URI is required.');
    process.exit(1);
  }
  const apply = process.argv.includes('--apply');
  const fixMarkup = process.argv.includes('--fix-markup');

  await mongoose.connect(uri);
  console.log(`Connected. mode=${apply ? 'APPLY' : 'DRY-RUN (add --apply to write)'}`);

  const items = await Equipment.find().sort({ order: 1, createdAt: 1 });
  console.log(`Found ${items.length} equipment record(s).\n`);

  /* ── 1. Consolidate duplicates ─────────────────────────────────────────── */
  const groups = new Map();
  for (const eq of items) {
    const key = identity(eq);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(eq);
  }

  const toDelete = [];
  for (const [key, group] of groups) {
    if (group.length < 2) continue;
    // Keep the most complete record so its image/specs survive.
    const score = (e) =>
      ['image', 'capacity', 'mainUse', 'description', 'model'].filter((f) => !isBlank(e[f])).length;
    const sorted = [...group].sort((a, b) => score(b) - score(a) || a.createdAt - b.createdAt);
    const keeper = sorted[0];
    const extras = sorted.slice(1);

    console.log(`Duplicate group: ${key}`);
    for (const e of extras) {
      const before = {
        quantity: e.quantity, capacity: e.capacity, image: e.image ? 'yes' : 'no',
      };
      mergeInto(keeper, e);
      toDelete.push(e);
      console.log(
        `  merging ${e._id} (qty=${before.quantity ?? '-'} cap=${before.capacity || '-'} img=${before.image}) ` +
        `-> into ${keeper._id} (new qty=${keeper.quantity ?? '-'})`
      );
    }
    await keeper.save();
    console.log('');
  }

  /* ── 2. Renumber order gapless ─────────────────────────────────────────── */
  const all = await Equipment.find().sort({ order: 1, createdAt: 1 });
  let changed = 0;
  for (let i = 0; i < all.length; i++) {
    if (all[i].order !== i + 1) {
      console.log(`  order: ${all[i].name} ${all[i].order} -> ${i + 1}`);
      all[i].order = i + 1;
      changed++;
    }
  }

  /* ── 3. Report empty categories ────────────────────────────────────────── */
  const used = new Set(all.map((e) => e.category).filter(Boolean));
  const empty = EQUIPMENT_CATEGORIES_LIST.filter((c) => !used.has(c));
  if (empty.length) {
    console.log(`\nCategories with no equipment: ${empty.join(', ')}`);
    console.log('The public page already hides empty categories. Add real inventory in');
    console.log('Admin -> Equipment; this script will not invent equipment records.');
  }

  /* ── 4. Report same-name records that are genuinely different machines ─── */
  const byName = new Map();
  for (const e of all) {
    const key = norm(e.name);
    if (!key) continue;
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(e);
  }
  for (const [name, group] of byName) {
    if (group.length < 2) continue;
    const distinct = new Set(group.map(identity));
    if (distinct.size > 1) {
      console.log(`\n"${group[0].name}" appears ${group.length}x but these are different machines — NOT merged:`);
      for (const e of group) {
        console.log(`  - model=${e.model || '-'} capacity=${e.capacity || '-'} qty=${e.quantity ?? '-'}`);
      }
      console.log('  Give each a distinct Name in Admin -> Equipment so the public grid is unambiguous.');
    }
  }

  /* ── 5. Flag text that looks like leaked markup ───────────────────────── */
  const markup = /(\$[^$]*\\|\{\{|\[\[|<\/?[a-z]+>)/i;
  const fixes = [];
  for (const e of all) {
    for (const f of ['name', 'model', 'capacity', 'mainUse', 'description']) {
      const value = String(e[f] || '');
      if (!markup.test(value)) continue;
      console.log(`\nSuspicious markup in ${e.name} -> ${f}: ${value}`);
      const cleaned = cleanMarkup(value);
      if (cleaned !== value) {
        console.log(`  would become: ${cleaned}`);
        fixes.push({ doc: e, field: f, cleaned });
      }
    }
  }

  if (apply && fixMarkup && fixes.length) {
    /* A record can have several dirty fields, so group by document: Mongoose
       refuses to save() the same doc twice in parallel. */
    const dirty = new Map();
    for (const f of fixes) {
      f.doc[f.field] = f.cleaned;
      dirty.set(String(f.doc._id), f.doc);
    }
    for (const doc of dirty.values()) await doc.save();
    console.log(`\nCleaned markup in ${fixes.length} field(s) across ${dirty.size} record(s).`);
  } else if (fixes.length) {
    console.log(`\nAdd --fix-markup --apply to rewrite these ${fixes.length} field(s).`);
  }

  if (apply) {
    if (toDelete.length) await Equipment.deleteMany({ _id: { $in: toDelete.map((e) => e._id) } });
    if (changed) for (const e of all) await e.save();
    console.log(
      `\nDone. merged=${toDelete.length} deleted, order renumbered on ${changed} record(s). Written to DB.`
    );
  } else {
    console.log(
      `\nDone. would merge ${toDelete.length} duplicate(s) and renumber ${changed} record(s). Nothing written (dry run).`
    );
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
