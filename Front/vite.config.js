import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Backend target for the Vite dev proxy.
// • LOCAL_API  → use when `node src/index.js` is running locally on port 5000.
// • RENDER_API → use when you just want to browse/test without a local server.
// VITE_BACKEND_URL in .env.local wins over both. It is read with loadEnv
// because plain `process.env` here never sees .env* files — only real shell
// environment variables — so reading it directly would silently fall through
// to Render.
const RENDER_API = 'https://kassconbackend.onrender.com';
const LOCAL_API  = 'https://kassconbackend.onrender.com';

// Default to Render so `npm run dev` works out-of-the-box without a local
// backend. Set VITE_BACKEND_URL=http://localhost:5000 in .env.local when
// running the Express server locally.
export default defineConfig(({ mode }) => {
  const BACKEND = loadEnv(mode, process.cwd()).VITE_BACKEND_URL || RENDER_API;

  return {
    plugins: [react()],
    build: {
      // Target es2018 so optional chaining / nullish coalescing are transpiled
      // and the bundle works on older browsers that support ES modules but not
      // full ES2020 syntax parsing.
      target: 'es2018',
    },
    server: {
      port: 5173,
      proxy: {
        // All /api/* calls go to the backend (auth, data, GridFS media).
        // /uploads/* is deliberately absent — see the note below.
        '/api': {
          target: BACKEND,
          changeOrigin: true,
        },
        // NOTE: other /media/* (e.g. /media/home/hero.jpg) is intentionally NOT
        // proxied — those static images under public/media/ are served by Vite.
        // /uploads/* is NOT proxied either: those legacy files are committed
        // under public/uploads/ and Vite already serves them. The backend has no
        // uploads/ directory, so proxying it here only ever produced 404s.
        // Caveat: for a /uploads/ file that is genuinely missing, Vite's SPA
        // fallback answers 200 text/html rather than 404, so a broken CMS
        // reference looks "ok" in dev but 404s in production. Check naturalWidth
        // on the image element, not just the network status.
        // Project media (/media/projects/<name>) are GridFS-stored replacements
        // served by the backend — proxy them so dev resolves like production.
        '/media/projects': {
          target: BACKEND,
          changeOrigin: true,
        },
      },
    },
  };
});
