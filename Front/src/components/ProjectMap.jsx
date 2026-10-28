/**
 * INTERACTIVE PROJECT MAP — presentation review §9.
 *
 * A dependency-free schematic map of Ethiopia. Projects that have latitude and
 * longitude set in the CMS (Projects admin) are plotted as selectable markers.
 *
 * Design decisions:
 *  - Plain SVG, no mapping library. Keeps the bundle small and the page fast,
 *    which the review explicitly asks for.
 *  - Only projects with coordinates are plotted. The component renders nothing
 *    when no project has coordinates, so an unconfigured CMS never shows an
 *    empty map.
 *  - Clicking or focusing a marker reveals a summary card with the project
 *    photo, client, status, scope and a link to the full project page.
 *  - Region filter chips narrow both the map and the summary list.
 *
 * The outline is a deliberately simplified national border used as a spatial
 * reference only; it is not a survey or administrative boundary map.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Clock4, MapPin, X } from 'lucide-react';
import { FadeIn } from './Motion';
import SiteImage from './SiteImage';

/* Geographic bounds used to normalise lat/lng into the viewBox. */
const BOUNDS = { minLat: 3.5, maxLat: 15.2, minLng: 32.8, maxLng: 48.5 };
const VB_W = 1000;
const VB_H = 1000;

/* Simplified Ethiopia outline, in [lng, lat] pairs. Schematic reference only. */
const OUTLINE = [
  [37.9, 14.9], [38.4, 14.6], [39.2, 14.5], [39.8, 14.2], [40.4, 13.9],
  [41.2, 13.6], [41.8, 13.4], [42.4, 13.1], [42.7, 12.6], [42.6, 12.1],
  [42.9, 11.6], [43.1, 11.4], [43.5, 11.3], [44.0, 11.0], [44.5, 10.4],
  [45.0, 9.5], [45.5, 8.8], [46.3, 8.0], [47.0, 7.6], [47.4, 6.8],
  [46.8, 6.0], [46.0, 5.4], [45.5, 4.8], [44.5, 4.3], [43.5, 4.5],
  [42.5, 4.2], [41.5, 4.6], [40.5, 4.5], [39.8, 5.0], [39.0, 5.8],
  [38.5, 6.5], [37.5, 7.5], [36.5, 8.3], [35.5, 9.0], [34.6, 9.8],
  [33.9, 10.8], [34.5, 11.6], [35.5, 12.2], [36.3, 13.0], [36.5, 13.8],
  [37.2, 14.4],
];

const project = ([lng, lat]) => {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * VB_W;
  const y = VB_H - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * VB_H;
  return [x, y];
};

const OUTLINE_PATH = `${OUTLINE.map((p, i) => `${i === 0 ? 'M' : 'L'}${project(p).join(' ')}`).join(' ')} Z`;

const hasCoords = (p) =>
  Number.isFinite(Number(p?.lat)) && Number.isFinite(Number(p?.lng)) &&
  Math.abs(Number(p.lat)) <= 90 && Math.abs(Number(p.lng)) <= 180;

export default function ProjectMap({ projects = [], kicker, title, subtitle, emptyNote }) {
  const [region, setRegion] = useState('all');
  const [activeId, setActiveId] = useState(null);

  const mapped = useMemo(
    () => (projects || []).filter(hasCoords),
    [projects]
  );

  const regions = useMemo(() => {
    const set = new Set();
    mapped.forEach((p) => set.add(p.mapRegion || 'Other'));
    return Array.from(set).sort();
  }, [mapped]);

  const shown = useMemo(
    () => (region === 'all' ? mapped : mapped.filter((p) => (p.mapRegion || 'Other') === region)),
    [mapped, region]
  );

  const active = useMemo(
    () => shown.find((p) => p._id === activeId) || null,
    [shown, activeId]
  );

  /* Nothing plotted yet — do not show an empty frame. */
  if (mapped.length === 0) {
    if (!emptyNote) return null;
    return (
      <section className="section bg-stone-50">
        <div className="container-pad">
          <p className="border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
            {emptyNote}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="project-map-heading" className="section bg-stone-50">
      <div className="container-pad">
        <FadeIn>
          <div className="grid items-end gap-6 lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="editorial-eyebrow">{kicker || 'Project footprint'}</p>
              </div>
              <h2 id="project-map-heading" className="editorial-title">
                {title || 'Where our projects stand.'}
              </h2>
            </div>
            {subtitle && (
              <p className="text-base leading-relaxed text-slate-600 lg:text-right">
                {subtitle}
              </p>
            )}
          </div>
        </FadeIn>

        {/* Region filter */}
        {regions.length > 1 && (
          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter projects by region">
            {[{ key: 'all', label: 'All regions' }, ...regions.map((r) => ({ key: r, label: r }))].map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => { setRegion(r.key); setActiveId(null); }}
                aria-pressed={region === r.key}
                className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
                  region === r.key
                    ? 'border border-navy bg-navy text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-navy hover:text-navy'
                }`}
              >
                {r.label}
                <span className={`ml-2 text-[10px] tabular-nums ${region === r.key ? 'text-white/60' : 'text-slate-400'}`}>
                  {String(r.key === 'all' ? mapped.length : mapped.filter((p) => (p.mapRegion || 'Other') === r.key).length).padStart(2, '0')}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Map */}
          <div className="lg:col-span-7">
            <div className="relative border border-slate-200 bg-white">
              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="block h-auto w-full"
                role="img"
                aria-label={`Schematic map of Ethiopia showing ${shown.length} project locations`}
              >
                <defs>
                  <pattern id="pm-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M50 0H0V50" fill="none" stroke="#153464" strokeWidth="0.4" opacity="0.1" />
                  </pattern>
                </defs>

                <rect width={VB_W} height={VB_H} fill="url(#pm-grid)" />

                <path
                  d={OUTLINE_PATH}
                  fill="#f2f0ed"
                  stroke="#153464"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />

                {shown.map((p) => {
                  const [x, y] = project([Number(p.lng), Number(p.lat)]);
                  const isActive = p._id === activeId;
                  const done = p.status === 'completed';
                  return (
                    <g
                      key={p._id}
                      transform={`translate(${x} ${y})`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${p.mapLabel || p.title}${p.location ? `, ${p.location}` : ''}`}
                      onClick={() => setActiveId(isActive ? null : p._id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveId(isActive ? null : p._id);
                        }
                      }}
                      className="focus:outline-none focus-visible:[&>circle:last-of-type]:stroke-accent"
                      style={{ cursor: 'pointer' }}
                    >
                      {isActive && (
                        <circle r="34" fill="#8B1E35" opacity="0.12" className="pm-pulse" />
                      )}
                      <circle
                        r={isActive ? 15 : 12}
                        fill={done ? '#153464' : '#8B1E35'}
                        stroke="#ffffff"
                        strokeWidth="3"
                        style={{ transition: 'r 180ms ease' }}
                      />
                      {/* Generous invisible hit area for touch. */}
                      <circle r="34" fill="transparent" />
                      <title>{p.mapLabel || p.title}</title>
                    </g>
                  );
                })}
              </svg>

              <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-4 bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-navy" /> Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" /> Ongoing
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Schematic reference outline. {shown.length} of {mapped.length} project
              {mapped.length === 1 ? '' : 's'} plotted.
            </p>
          </div>

          {/* Detail / list */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait" initial={false}>
              {active ? (
                <motion.div
                  key={active._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="border-t-2 border-accent border border-slate-200 bg-white"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent">
                        <MapPin size={12} aria-hidden="true" />
                        {active.mapRegion || active.location || 'Ethiopia'}
                      </p>
                      <h3 className="mt-1.5 font-display text-lg font-bold leading-snug text-navy">
                        {active.mapLabel || active.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveId(null)}
                      aria-label="Close project summary"
                      className="shrink-0 p-1 text-slate-300 transition-colors hover:text-accent"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {active.coverImage && (
                    <Link to={`/projects/${active._id}`} className="block overflow-hidden">
                      <SiteImage
                        src={active.coverImage}
                        alt={active.title}
                        loading="lazy"
                        className="aspect-[16/9] w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </Link>
                  )}

                  <div className="p-5">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${
                          active.status === 'completed' ? 'bg-emerald-700' : 'bg-accent'
                        }`}
                      >
                        {active.status === 'completed' ? (
                          <><CheckCircle2 size={10} /> Completed</>
                        ) : (
                          <><Clock4 size={10} /> {active.progress ? `${active.progress}%` : 'Ongoing'}</>
                        )}
                      </span>
                      {active.category && (
                        <span className="bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                          {active.category}
                        </span>
                      )}
                      {active.year && (
                        <span className="bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                          {active.year}
                        </span>
                      )}
                    </div>

                    <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
                      {active.client && (
                        <div className="flex gap-3">
                          <dt className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Client</dt>
                          <dd className="text-sm font-semibold text-navy">{active.client}</dd>
                        </div>
                      )}
                      {active.location && (
                        <div className="flex gap-3">
                          <dt className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</dt>
                          <dd className="text-sm text-slate-600">{active.location}</dd>
                        </div>
                      )}
                    </dl>

                    {active.scope && (
                      <p className="mt-4 text-sm leading-relaxed text-slate-600 line-clamp-4">
                        {active.scope}
                      </p>
                    )}

                    <Link to={`/projects/${active._id}`} className="btn-primary mt-5 w-full">
                      View project <ArrowRight size={15} />
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.ul
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="max-h-[520px] divide-y divide-slate-100 overflow-y-auto border border-slate-200 bg-white"
                >
                  {shown.map((p) => (
                    <li key={p._id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(p._id)}
                        className="group flex w-full items-center gap-3.5 p-4 text-left transition-colors hover:bg-stone-50"
                      >
                        <span
                          aria-hidden="true"
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            p.status === 'completed' ? 'bg-navy' : 'bg-accent'
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-navy">{p.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-slate-400">
                            {[p.location, p.client].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        <ArrowRight
                          size={14}
                          className="shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
