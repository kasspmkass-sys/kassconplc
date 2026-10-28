/**
 * Public-safe projection of the Settings document.
 *
 * `GET /api/settings/public` is unauthenticated, so it must never return the raw
 * document. Instead we build an explicit allow-list DTO containing only the
 * fields the public React frontend actually reads.
 *
 * Anything not listed here is dropped automatically, so a future admin-only or
 * sensitive field can never leak through the public endpoint by accident.
 *
 * Admin UIs keep using `GET /api/settings` (auth required) for the full document.
 */

/** Company identity + contact details rendered in the header, footer and CTAs. */
const COMPANY_KEYS = [
  'companyName',
  'tagline',
  'headline',
  'aboutShort',
  'aboutLong',
  'mission',
  'vision',
  'values',
  'specializations',
  'historicalContent',
  'foundingStory',
  'historicalBackground',
  'phone',
  'phones',
  'email',
  'emails',
  'website',
  'address',
  'legetafoAddress',
  'poBox',
  'workingHours',
  'capital',
  'grade',
  'foundedYear',
  'yearsExperience',
  'projectCount',
  'specialists',
];

/** Media, hero and founder-owner content used by the homepage and About page. */
const MEDIA_KEYS = [
  'heroImage',
  'whoWeAreImage',
  'heroSideImage',
  'heroSlides',
  'heroEyebrow',
  'heroSupporting',
  'ownersKicker',
  'ownersTitle',
  'hero',
  'ownerName',
  'ownerTitle',
  'ownerBio',
  'ownerImage',
  'ownerQuote',
  'homeVideoUrl',
  'homeVideoPoster',
  'homeVideoTitle',
  'homeVideoSubtitle',
  'logo',
  'logoSize',
  'mapEmbed',
  'social',
];

/** Site chrome (navigation + footer) driven by the header/footer admin. */
const LAYOUT_KEYS = ['header', 'footer'];

/** Per-page copy blocks. Each is rendered by one public route. */
const PAGE_KEYS = [
  'home',
  'about',
  'servicesPage',
  'projectsPage',
  'capabilitiesPage',
  'contactPage',
  'careersPage',
  'whereWeWorkPage',
  'notFoundPage',
  'hseqPage',
  'readyMixPage',
  'aggregatePage',
  'equipmentPage',
  'newsPage',
  'downloadsPage',
  'searchPage',
];

/** SEO metadata is applied client-side by useSEO(), so it is public. */
const SEO_KEYS = ['seo'];

/** Every key the public frontend is allowed to receive from /settings/public. */
export const PUBLIC_SETTING_KEYS = Object.freeze([
  ...COMPANY_KEYS,
  ...MEDIA_KEYS,
  ...LAYOUT_KEYS,
  ...PAGE_KEYS,
  ...SEO_KEYS,
]);

const PUBLIC_KEY_SET = new Set(PUBLIC_SETTING_KEYS);

/** Mongoose bookkeeping that must never reach the public endpoint. */
const PRIVATE_META_KEYS = new Set(['_id', '__v', 'createdAt', 'updatedAt', 'id']);

/**
 * Recursively strip Mongoose metadata from a copied value.
 *
 * Top-level `_id`/`__v`/timestamps are already excluded by the allow-list above,
 * but nested subdocuments (page copy blocks, capability units, hero slides, …)
 * each carry their own generated `_id`. This deep-copies the value so the source
 * document is never mutated, and never invents or renames content fields.
 */
function stripPrivateMeta(value) {
  if (Array.isArray(value)) return value.map(stripPrivateMeta);
  if (!value || typeof value !== 'object') return value;
  /* Leave Mongoose types (Date, Buffer, ObjectId) as-is rather than flattening. */
  if (value._bsontype || value instanceof Date || Buffer.isBuffer(value)) return value;

  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (PRIVATE_META_KEYS.has(key)) continue;
    out[key] = stripPrivateMeta(child);
  }
  return out;
}

/**
 * Build the public DTO from a Settings document (or plain object).
 *
 * @param {object} doc Settings mongoose document or plain object.
 * @returns {object} New object containing only allow-listed keys.
 */
export function toPublicSettings(doc) {
  if (!doc) return {};
  const source = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const out = {};
  for (const key of PUBLIC_KEY_SET) {
    const value = source[key];
    if (value === undefined || value === null) continue;
    out[key] = stripPrivateMeta(value);
  }
  return out;
}

export default toPublicSettings;
