/**
 * EQUIPMENT & FLEET
 * Uses the dedicated /equipment/public CMS endpoint (Equipment model).
 * Displays name, model, category, capacity, quantity, main use, image.
 * Admin manages via /admin/equipment.
 */
import { useEffect, useMemo, useState } from 'react';
import { Search, ZoomIn } from 'lucide-react';
import api from '../api';
import { useSite } from '../context/SiteContext';
import { useSEO } from '../useSEO';
import { Stagger, item } from '../components/Motion';
import { motion } from 'framer-motion';
import SiteImage from '../components/SiteImage';
import PageHeader from '../components/PageHeader';
import PageCta from '../components/PageCta';
import Lightbox from '../components/Lightbox';

const CATEGORIES = [
  'All',
  'Earthmoving',
  'Transport',
  'Concrete',
  'Lifting',
  'Crushing',
  'Support Equipment',
];

export default function Equipment() {
  const { settings }  = useSite();
  const pg            = settings?.equipmentPage || {};
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const [q, setQ]               = useState('');
  const [lightbox, setLightbox] = useState(null);
  /* Ids whose image failed to load, so the card falls back to the placeholder. */
  const [brokenImages, setBrokenImages] = useState(() => new Set());
  const markImageBroken = (id) =>
    setBrokenImages((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));

  const heroKicker = pg.heroKicker   || 'Equipment & Fleet';
  const heroTitle  = pg.heroTitle    || 'Owned plant, machinery and fleet.';
  const heroLead   = pg.heroLead     ||
    'KASCON operates its own fleet of earthmoving equipment, transit mixers, transport vehicles, lifting gear and support machinery — enabling self-performed construction without subcontracting critical plant.';
  const searchPlaceholder = pg.searchPlaceholder || 'Search equipment…';
  const filterLabel       = pg.filterLabel       || 'Filter equipment by category';
  const emptyState        = pg.emptyState        || 'Equipment details are being added. Please check back shortly.';
  const ctaTitle          = pg.ctaTitle          || 'Need specific plant or machinery?';
  const ctaText           = pg.ctaText           ||
    'Contact KASCON to discuss equipment availability, specifications and rental or deployment for your project.';

  useSEO(
    'Equipment & Fleet',
    'KASCON owned equipment — earthmoving, transport, concrete, lifting, crushing and support fleet for construction project delivery.',
    'equipment'
  );

  useEffect(() => {
    setLoading(true);
    api.get('/equipment/public')
      .then((r) => setItems(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  /* Build active category list from CMS data so empty categories are hidden */
  const activeCategories = useMemo(() => {
    const present = new Set(items.map((i) => i.category).filter(Boolean));
    return CATEGORIES.filter((c) => c === 'All' || present.has(c));
  }, [items]);

  const needle   = q.trim().toLowerCase();
  const filtered = useMemo(() =>
    items.filter((i) =>
      (filter === 'All' || i.category === filter) &&
      (!needle ||
        [i.name, i.model, i.category, i.mainUse, i.description]
          .filter(Boolean).join(' ').toLowerCase().includes(needle))
    ),
    [items, filter, needle]
  );

  return (
    <>
      <PageHeader kicker={heroKicker} title={heroTitle} lead={heroLead} />

      {/* Filter bar */}
      <div className="bg-navy border-b border-white/10">
        <div className="container-pad py-5">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label={filterLabel}>
              {activeCategories.map((cat) => (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={filter === cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
                    filter === cat
                      ? 'bg-accent text-white border border-accent'
                      : 'bg-white/10 text-white/70 border border-white/15 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" aria-hidden="true" />
              <input
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/35
                  text-sm px-4 pl-9 py-2.5 outline-none focus:border-white/50 transition-colors"
                placeholder={searchPlaceholder}
                aria-label="Search equipment"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="section bg-stone-50">
        <div className="container-pad">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1,2,3,4,5,6,7,8].map((i) => (
                <div key={i} className="border border-slate-200 bg-white overflow-hidden">
                  <div className="skeleton aspect-[4/3]" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-dashed border-slate-300 py-24 text-center">
              <p className="text-slate-400">
                {items.length === 0 ? emptyState : 'No equipment matches your filter.'}
              </p>
            </div>
          ) : (
            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((eq) => (
                <motion.article key={eq._id} variants={item}>
                  <div className="group h-full flex flex-col bg-white border border-slate-200
                    transition-all duration-200 hover:border-accent/40 hover:shadow-elevated hover:-translate-y-0.5">

                    <div aria-hidden="true" className="h-0.5 bg-slate-100 group-hover:bg-accent transition-colors duration-200" />

                    {/* Image — a failed image falls back to the static
                        placeholder so we never show an empty clickable
                        "zoom" button that opens an empty lightbox. */}
                    {eq.image && !brokenImages.has(eq._id) ? (
                      <button
                        className="relative aspect-[4/3] overflow-hidden bg-navy/5 w-full cursor-zoom-in
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        onClick={() => setLightbox(eq.image)}
                        aria-label={`View ${eq.name}`}
                      >
                        <SiteImage
                          src={eq.image}
                          alt={eq.name}
                          onError={() => markImageBroken(eq._id)}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div aria-hidden="true" className="absolute inset-0 bg-navy/0 group-hover:bg-navy/20 transition-all duration-300 flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-navy/70 p-2">
                            <ZoomIn size={16} className="text-white" />
                          </span>
                        </div>
                        {eq.category && (
                          <span className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy">
                            {eq.category}
                          </span>
                        )}
                      </button>
                    ) : (
                      <div className="aspect-[4/3] bg-navy/5 flex items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {eq.category || 'Equipment'}
                        </span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex flex-col flex-1 p-4">
                      <h2 className="font-display text-sm font-bold text-navy group-hover:text-accent transition-colors duration-200">
                        {eq.name}
                      </h2>
                      {eq.model && (
                        <p className="mt-0.5 text-xs text-slate-500">{eq.model}</p>
                      )}

                      {/* Specs */}
                      {(eq.capacity || eq.quantity != null || eq.mainUse) && (
                        <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                          {eq.capacity && (
                            <div className="flex items-center gap-2 text-xs">
                              <dt className="text-slate-400 shrink-0">Capacity</dt>
                              <dd className="font-semibold text-navy">{eq.capacity}</dd>
                            </div>
                          )}
                          {eq.quantity != null && eq.quantity > 0 && (
                            <div className="flex items-center gap-2 text-xs">
                              <dt className="text-slate-400 shrink-0">Qty</dt>
                              <dd className="font-semibold text-navy">{eq.quantity}</dd>
                            </div>
                          )}
                          {eq.mainUse && (
                            <div className="flex items-start gap-2 text-xs">
                              <dt className="text-slate-400 shrink-0">Use</dt>
                              <dd className="text-slate-600 line-clamp-2">{eq.mainUse}</dd>
                            </div>
                          )}
                        </dl>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </Stagger>
          )}
        </div>
      </section>

      <Lightbox src={lightbox} alt="Equipment" onClose={() => setLightbox(null)} />

      <PageCta
        kicker={pg.ctaKicker || 'Equipment rental & deployment'}
        title={ctaTitle}
        text={ctaText}
        label="Request equipment"
      />
    </>
  );
}
