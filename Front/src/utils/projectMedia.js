/**
 * Client-side mirror of the backend project-image path logic
 * (server/kassconbackend/src/services/media.js). Constants and the hash
 * function MUST stay in sync, because the admin form computes the assigned
 * filename used for `/upload/project` and the server validates/re-derives it.
 */

const PROJECT_MEDIA_PREFIX = '/media/projects/';

/** Same tiny non-cryptographic hash as the backend (must stay in sync). */
function fnv1a(s) {
  let h = 2166136261;
  for (const ch of String(s)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function isSafeProjectBasename(name) {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}\.(jpg|jpeg|png|webp|gif)$/i.test(String(name || ''));
}

/** Legacy auto-names (timestamp-random bytes) are never treated as assigned names. */
function isRandomUploadName(name) {
  return /^\d{10,}-[a-f0-9]+\.(jpg|jpeg|png|webp|gif)$/i.test(String(name || ''));
}

function slugify(text) {
  return (
    String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'project'
  );
}

/** Deterministic generated name for a (project title, field slot). */
export function generatedProjectBasename({ title = '', index = 0, key = 'image' } = {}) {
  const base = slugify(title);
  return `${base}-${fnv1a(`${base}#${index}#${key}`)}.jpg`;
}

/**
 * Pull the assigned filename out of a stored value when it can be recognised:
 * handles `/media/projects/p-14.jpg`, Windows paths, URLs, any string holding
 * a safe filename. Returns null when nothing recognisable exists.
 */
function recoverProjectBasename(value) {
  const s = String(value || '');
  const last = (s.split(/[\\/]/).pop() || s).split(/[?#]/)[0].trim();
  if (isSafeProjectBasename(last) && !isRandomUploadName(last)) return last.toLowerCase();
  const m = s.match(/[A-Za-z0-9][A-Za-z0-9_-]{0,63}\.(jpg|jpeg|png|webp|gif)\b/i);
  if (m && !isRandomUploadName(m[0])) return m[0].toLowerCase();
  return null;
}

/**
 * Resolve a project image field value to a canonical path.
 * Preserves `/uploads/...`, `/api/media/<id>`, and absolute URLs as-is.
 * Only normalises broken values (Windows paths, bare filenames) to
 * `/media/projects/<name>`.
 * Returns `{ path, name, recovered }`; path is null only when the value was empty.
 */
export function projectImagePath(value, { title = '', index = 0, key = 'image' } = {}) {
  if (value == null || String(value).trim() === '') {
    return { path: null, name: generatedProjectBasename({ title, index, key }), recovered: false };
  }
  const s = String(value).trim();

  if (s.startsWith(PROJECT_MEDIA_PREFIX)) {
    const name = s.slice(PROJECT_MEDIA_PREFIX.length);
    if (isSafeProjectBasename(name)) return { path: s, name, recovered: true };
  }

  if (s.startsWith('/uploads/')) {
    return { path: s, name: null, recovered: true };
  }

  if (s.startsWith('/api/media/') || s.startsWith('media:')) {
    return { path: s, name: null, recovered: true };
  }

  if (/^https?:\/\//i.test(s)) {
    return { path: s, name: null, recovered: true };
  }

  if (/^[a-zA-Z]:[\\/]/.test(s) || s.includes('\\')) {
    const rawName = (s.split(/[\\/]/).pop() || '').split(/[?#]/)[0].trim();
    if (rawName) {
      const ext = (rawName.match(/\.([a-zA-Z0-9]+)$/) || [])[1] || 'jpg';
      const base = rawName.replace(/\.[^.]+$/, '');
      const slug = base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'project';
      const name = `${slug}.${ext}`;
      if (isSafeProjectBasename(name)) {
        return { path: `${PROJECT_MEDIA_PREFIX}${name}`, name, recovered: true };
      }
    }
  }

  const recovered = recoverProjectBasename(s);
  if (recovered) return { path: `${PROJECT_MEDIA_PREFIX}${recovered}`, name: recovered, recovered: true };

  const name = generatedProjectBasename({ title, index, key });
  return { path: `${PROJECT_MEDIA_PREFIX}${name}`, name, recovered: false };
}