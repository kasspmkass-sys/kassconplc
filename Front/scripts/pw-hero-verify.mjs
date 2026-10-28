/**
 * Playwright hero verification script.
 * Starts vite preview, then:
 *   1. Checks that the seo-prerender block is in the HTML source
 *   2. Simulates a 20s delayed /settings/public response
 *   3. Takes screenshots at 0.5s, 1s, 2s, 5s on hard refresh
 *   4. Confirms hero text + first image are visible throughout
 *
 * Run: node scripts/pw-hero-verify.mjs
 */
import { chromium } from 'playwright';
import { spawn }    from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT   = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT   = 4174;
const BASE   = `http://localhost:${PORT}`;
const SS_DIR = resolve(ROOT, 'scripts/pw-screenshots');

/* ── Helpers ───────────────────────────────────────────────────────────── */

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function startPreview() {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
      cwd: ROOT,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let ready = false;
    const onData = (chunk) => {
      const line = chunk.toString();
      if (!ready && line.includes('localhost')) {
        ready = true;
        resolve(proc);
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('error', reject);
    // Fallback timeout — server should start well under 5s
    setTimeout(() => {
      if (!ready) { ready = true; resolve(proc); }
    }, 5000);
  });
}

/* ── Main ─────────────────────────────────────────────────────────────── */

async function main() {
  // Make screenshot dir
  const { mkdir } = await import('node:fs/promises');
  await mkdir(SS_DIR, { recursive: true });

  console.log('\n[pw] Starting vite preview …');
  const srv = await startPreview();
  await sleep(2000); // let the server fully stabilise

  console.log('[pw] Launching Chromium …');
  const browser = await chromium.launch({ headless: true });

  try {
    /* ── Test 1: plain load, confirm seo-prerender block ─────────────── */
    {
      const ctx  = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage();
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });
      const prerenderBlock = await page.evaluate(() => {
        const el = document.getElementById('seo-prerender');
        return el ? el.innerHTML : null;
      });
      console.log('\n[pw] seo-prerender block (domcontentloaded):', prerenderBlock ? '✓ present' : '✗ MISSING');
      if (prerenderBlock) {
        console.log('[pw]   content excerpt:', prerenderBlock.slice(0, 120));
      }
      await ctx.close();
    }

    /* ── Test 2: delayed /settings/public (20 s) ─────────────────────── */
    console.log('\n[pw] Running delayed-API test (20s delay on /settings/public) …');
    {
      const ctx  = await browser.newContext({
        viewport: { width: 1280, height: 800 },
      });
      const page = await ctx.newPage();

      // Intercept and delay /settings/public
      await page.route('**/api/settings/public', async (route) => {
        await sleep(20_000);
        await route.continue();
      });

      const t0 = Date.now();
      page.goto(BASE).catch(() => {}); // fire and forget
      await sleep(300); // let navigation start

      const timestamps = [500, 1000, 2000, 5000];
      for (const ms of timestamps) {
        const wait = ms - (Date.now() - t0);
        if (wait > 0) await sleep(wait);
        const elapsed = Date.now() - t0;

        const ssPath = resolve(SS_DIR, `hero-delayed-${ms}ms.png`);
        await page.screenshot({ path: ssPath, fullPage: false });

        // Check that hero text and backdrop image are visible
        const heroTitle = await page.evaluate(() => {
          const el = document.querySelector('.hero-title');
          return el ? el.textContent?.trim() : null;
        });
        const heroBackdropVisible = await page.evaluate(() => {
          const img = document.querySelector('.hero-backdrop img');
          if (!img) return false;
          const rect = img.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        console.log(`[pw] t=${elapsed}ms  hero-title="${heroTitle || '(none)'}"`
          + `  backdrop=${heroBackdropVisible ? '✓ visible' : '✗ NOT visible'}`
          + `  screenshot: ${ssPath}`);
      }

      await ctx.close();
    }

    /* ── Test 3: failed /settings/public ─────────────────────────────── */
    console.log('\n[pw] Running failed-API test …');
    {
      const ctx  = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage();

      await page.route('**/api/settings/public', (route) => route.abort('failed'));

      const t0 = Date.now();
      page.goto(BASE).catch(() => {});
      await sleep(300);

      for (const ms of [500, 1000, 2000, 5000]) {
        const wait = ms - (Date.now() - t0);
        if (wait > 0) await sleep(wait);
        const elapsed = Date.now() - t0;

        const ssPath = resolve(SS_DIR, `hero-failed-api-${ms}ms.png`);
        await page.screenshot({ path: ssPath, fullPage: false });

        const heroTitle = await page.evaluate(() => {
          const el = document.querySelector('.hero-title');
          return el ? el.textContent?.trim() : null;
        });
        const backdropVisible = await page.evaluate(() => {
          const img = document.querySelector('.hero-backdrop img');
          if (!img) return false;
          const rect = img.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        console.log(`[pw] t=${elapsed}ms  hero-title="${heroTitle || '(none)'}"`
          + `  backdrop=${backdropVisible ? '✓ visible' : '✗ NOT visible'}`
          + `  screenshot: ${ssPath}`);
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
    srv.kill();
    console.log('\n[pw] Done. Screenshots saved to:', SS_DIR);
  }
}

main().catch((err) => {
  console.error('[pw] FATAL:', err);
  process.exit(1);
});
