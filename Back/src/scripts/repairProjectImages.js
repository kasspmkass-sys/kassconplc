#!/usr/bin/env node
/**
 * Repair every project's image paths to canonical `/media/projects/<name>` values.
 * Recovers assigned filenames from Windows paths / old URLs / valid paths and
 * generates deterministic names for broken or empty values.
 *
 *   node src/scripts/repairProjectImages.js            # dry run (default)
 *   node src/scripts/repairProjectImages.js --apply    # write to DB
 *   npm run repair:projects                            # dry run
 *   npm run repair:projects -- --apply                 # write to DB
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { repairProjectImagePaths } from '../services/media.js';

async function main() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error('MONGODB_URI is required.');
    process.exit(1);
  }
  const apply = process.argv.includes('--apply');
  await mongoose.connect(uri);
  console.log(`Connected. mode=${apply ? 'APPLY' : 'DRY-RUN (add --apply to write)'}`);
  const { stats, report } = await repairProjectImagePaths({ dryRun: !apply });
  if (!report.length) {
    console.log(`All ${stats.inspected} project(s) are already on canonical paths.`);
  } else {
    for (const p of report) {
      if (p.cover) console.log(`"${p.title}" cover: ${p.cover.from}  ->  ${p.cover.to}`);
      for (const g of p.gallery) console.log(`"${p.title}" gallery: ${g.from}  ->  ${g.to}`);
    }
  }
  console.log(`\nDone. inspected=${stats.inspected} changed=${stats.changed} ${apply ? 'written to DB' : 'dry run, nothing written'}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});