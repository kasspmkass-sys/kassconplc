import axios from 'axios';

/**
 * Backend origin and API base — both derived from VITE_API_URL so a single
 * env-var change in .env.production (or the Vercel project settings) is the
 * only thing needed when the backend URL changes.
 *
 * .env.production   → VITE_API_URL=https://kassconbackend.onrender.com/api
 * .env.local (dev)  → leave VITE_API_URL empty to use the Vite proxy (/api)
 *
 * Never set a raw Render URL in application code.
 */
const _rawUrl = import.meta.env.VITE_API_URL;

/**
 * API base for axios (data requests):
 * - Dev + VITE_API_URL empty  → relative /api  (Vite proxy → local backend)
 * - Dev + VITE_API_URL set    → use that value (allows pointing dev at Render)
 * - Production                → VITE_API_URL (required; build fails fast if missing)
 */
export const API_BASE = (_rawUrl || (import.meta.env.DEV ? '/api' : '')).replace(/\/$/, '');

// Origin = scheme + host only, no path.  Used by mediaUrl() to strip/prefix
// absolute backend media URLs.  Empty in dev when VITE_API_URL is unset
// (no prefix needed — the Vite proxy handles /api/media/* already).
export const API_ORIGIN = API_BASE
  ? (() => {
      try {
        const u = new URL(API_BASE);
        return `${u.protocol}//${u.host}`;
      } catch {
        return '';
      }
    })()
  : '';

const api = axios.create({ baseURL: API_BASE });

/**
 * True only when dev is genuinely routing through the Vite proxy, i.e. no
 * absolute VITE_API_URL was supplied and API_BASE is therefore relative.
 *
 * This must not be keyed on import.meta.env.DEV alone: .env.local normally sets
 * VITE_API_URL to the real backend, which sends axios straight to Render and
 * leaves the dev proxy unused. Rewriting media to relative paths in that setup
 * forces every <img> through the proxy for no benefit.
 */
const VIA_DEV_PROXY = import.meta.env.DEV && API_BASE.startsWith('/');

/**
 * Timeout for read-only GETs.
 *
 * axios defaults to `timeout: 0`, which waits forever. Render's free tier sleeps
 * after ~15 minutes idle and then needs tens of seconds to wake, so during a
 * cold start the request stays *pending* rather than *rejecting* — any retry
 * loop built on rejection never advances to its next attempt and the caller
 * waits for the whole cold start with no data and no error.
 *
 * Applied per request rather than on the instance: uploads go through the same
 * axios instance and legitimately take far longer than this.
 */
export const READ_TIMEOUT_MS = 10000;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kascon_token');
  if (token) {
    if (typeof config.headers?.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;

/**
 * Resolve any stored image/video reference to a usable <img src>.
 *
 * Storage formats the CMS produces:
 *   a) Absolute URL:          https://<backend>/api/media/<id>
 *   b) Relative media path:   /api/media/<id>
 *   c) Project image path:    /media/projects/<name>
 *   d) Legacy uploads:        /uploads/<name>
 *   e) Static public asset:   /media/home/hero.jpg  (committed, Vercel)
 *
 * In dev mode we route media through the Vite proxy ONLY when axios is also
 * using it (no VITE_API_URL set), so local-Express and Render-direct dev setups
 * both resolve the same way. When VITE_API_URL is absolute the browser talks to
 * the backend directly, exactly as axios already does.
 *
 * In production the absolute backend URL is used directly (Vercel → backend).
 */
export const mediaUrl = (path) => {
  if (!path) return '';
  const s = String(path);

  // ── Absolute URLs ──────────────────────────────────────────────────────────
  if (/^https?:\/\//i.test(s)) {
    if (VIA_DEV_PROXY && API_ORIGIN && s.startsWith(API_ORIGIN)) {
      // Convert the absolute backend URL to a relative path so the Vite proxy
      // handles it — avoids direct browser→backend requests in dev.
      return s.slice(API_ORIGIN.length) || '/';
    }
    return s;
  }

  // ── Relative paths ─────────────────────────────────────────────────────────
  // /api/media/:id and /media/projects/:name are served by the backend, so they
  // need the backend origin whenever we know it. When API_ORIGIN is empty dev
  // is on the proxy and the relative path is correct as-is.
  if (s.startsWith('/api/media/') || s.startsWith('/media/projects/')) {
    if (API_ORIGIN) {
      return `${API_ORIGIN}${s}`;
    }
    return s;
  }

  // ── Static public assets ───────────────────────────────────────────────────
  // /media/* (hero, about, services …) AND legacy /uploads/* are committed under
  // client/public/, so Vite (dev) and Vercel (prod) both serve them from the
  // same origin — no rewriting needed.
  return s;
};

/** True when the path is an absolute external URL */
export const isExternalMedia = (path) => /^https?:\/\//i.test(String(path || ''));

export const formatETB = (n) => {
  if (n == null || n === '') return '-';
  return `ETB ${Number(n).toLocaleString()}`;
};
