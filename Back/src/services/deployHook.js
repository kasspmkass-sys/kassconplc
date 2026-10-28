/**
 * Vercel deploy hook — triggers a frontend rebuild when CMS content changes.
 * Debounced 15 s so rapid admin saves collapse into a single build.
 * Safe to call from any route handler: never throws, never blocks the response.
 * No-op when VERCEL_DEPLOY_HOOK_URL is not set.
 * The hook URL is read exclusively from process.env — never logged.
 */
import https from 'https';
import http from 'http';

let debounceTimer = null;
const _testMs = process.env.TEST_DEBOUNCE_MS ? parseInt(process.env.TEST_DEBOUNCE_MS, 10) : NaN;
// Guard: NaN, zero, or negative from a bad TEST_DEBOUNCE_MS value fall back to the
// production default rather than creating an accidental zero-debounce in production.
const DEBOUNCE_MS = (!process.env.TEST_DEBOUNCE_MS || !Number.isFinite(_testMs) || _testMs < 1)
  ? 15_000
  : _testMs;

export function triggerDeploy(reason) {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) {
    console.log('[deployHook] VERCEL_DEPLOY_HOOK_URL not set — skipping rebuild trigger');
    return;
  }
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    let parsed;
    try { parsed = new URL(url); } catch {
      console.error('[deployHook] VERCEL_DEPLOY_HOOK_URL is not a valid URL — skipping');
      return;
    }
    // Use http or https based on the URL protocol (https in production, http allowed for tests)
    const transport = parsed.protocol === 'http:' ? http : https;
    const req = transport.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || undefined,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: { 'Content-Length': 0 },
      },
      (res) => {
        console.log(`[deployHook] rebuild triggered (${reason}) — responded ${res.statusCode}`);
        res.resume();
      }
    );
    req.on('error', (e) => console.error(`[deployHook] request failed: ${e.message}`));
    req.end();
  }, DEBOUNCE_MS);
}
