/**
 * PROJECTS — Searchable / filterable project register
 * Engineering card style. CMS-driven via /projects/public.
 * Never invents project data. Empty states handled cleanly.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Building2, CheckCircle2, Clock4,
  Fuel, HardHat, MapPin, Route, Search, Users, Wallet,
} from 'lucide-react';
import api, { formatETB } from '../api';
import { useSEO } from '../useSEO';
import { useSite } from '../context/SiteContext';
import { FadeIn, Stagger, item } from '../components/Motion';
import SiteImage from '../components/SiteImage';
import PageHeader from '../components/PageHeader';
import PageCta from '../components/PageCta';
import ProjectMap from '../components/ProjectMap';

const GROUPS = [
  { key: 'buildings',   label: 'Buildings',              icon: Building2, cats: ['Mixed-Use', 'Residential', 'Commercial'] },
  { key: 'roads',       label: 'Roads & Infrastructure', icon: Route,     cats: ['Infrastructure'] },
  { key: 'fuel',        label: 'Fuel Stations',          icon: Fuel,      cats: ['Fuel Station'] },
  { key: 'industrial',  label: 'Industrial',             icon: HardHat,   cats: ['Industrial'] },
  { key: 'other',       label: 'Other',                  icon: Building2, cats: ['Aviation', 'Other'] },
];

function resolveParam(value) {
  if (!value) return null;
  if (GROUPS.some((g) => g.key === value)) return value;
  if (GROUPS.some((g) => g.cats.includes(value))) return value;
  return null;
}

function StatusBadge({ project }) {
  if (project.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
        <CheckCircle2 size={10} /> Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
      <Clock4 size={10} /> {project.progress ? `${project.progress}%` : 'Ongoing'}
    </span>
  );
}

export default function Projects() {
  const { settings }   = useSite();
  const [projects, setProjects]  = useState([]);
  const [loading, setLoading]    = useState(true);
  const [searchParams]           = useSearchParams();
  const [filter, setFilter]      = useState(() => resolveParam(searchParams.get('filter')) || 'all');
  const [q, setQ]                = useState('');

  const pg           = settings?.projectsPage || {};
  const heroKicker   = pg.heroKicker    || 'Project register';
  const heroTitle    = pg.heroTitle     || 'Every KASCON project.';
  const heroLead     = pg.heroLead      || 'Completed and ongoing works — mixed-use towers, fuel stations, roads and aviation facilities, delivered for banks, energy operators, cooperatives and private developers.';
  const groupLabelMap = Object.fromEntries(
    (Array.isArray(pg.groupLabels) ? pg.groupLabels : [])
      .filter((g) => g?.category)
      .map((g) => [g.category, g.label])
  );
  const searchPlaceholder = pg.searchPlaceholder || 'Search projects…';
  const emptyState        = pg.emptyState        || 'No projects match your filters.';
  const featuredLabel     = pg.featuredLabel      || 'Featured';
  const viewLabel         = pg.viewLabel          || 'View project';
  const cardLabels        = pg.cardLabels         || {};

  useSEO(
    'Projects',
    'KASCON project register — mixed-use towers, fuel stations, roads and aviation facilities across Ethiopia.',
    'projects'
  );

  useEffect(() => {
    setLoading(true);
    api.get('/projects/public').then((r) => setProjects(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const f = resolveParam(searchParams.get('filter'));
    setFilter(f || 'all');
  }, [searchParams]);

  const matchesKey = useMemo(() => (p, key) => {
    if (key === 'all') return true;
    const group = GROUPS.find((g) => g.key === key);
    return group ? group.cats.includes(p.category) : p.category === key;
  }, []);

  const sorted = useMemo(() => [...projects].sort(
    (a, b) =>
      Number(!!b.featured) - Number(!!a.featured) ||
      (a.status === b.status ? 0 : a.status === 'completed' ? -1 : 1) ||
      (a.order ?? 0) - (b.order ?? 0) ||
      a.title.localeCompare(b.title)
  ), [projects]);

  const needle     = q.trim().toLowerCase();
  const matchesQuery = (p) =>
    !needle ||
    [p.title, p.client, p.scope, p.category, p.location].filter(Boolean).join(' ').toLowerCase().includes(needle);

  const filtered = useMemo(
    () => sorted.filter((p) => matchesKey(p, filter) && matchesQuery(p)),
    [sorted, filter, needle]
  );

  const lead      = filter === 'all' ? filtered.find((p) => p.featured) : null;
  const gridItems = filtered.filter((p) => p._id !== lead?._id);
  const countFor  = (key) => sorted.filter((p) => matchesKey(p, key) && matchesQuery(p)).length;

  const pills = [
    { key: 'all', label: 'All' },
    ...GROUPS.map((g) => ({ key: g.key, label: groupLabelMap[g.key] || g.label })),
  ];

  const stats = useMemo(() => {
    const completed = projects.filter((p) => p.status === 'completed').length;
    const ongoing   = projects.filter((p) => p.status === 'ongoing').length;
    const sectors   = new Set(projects.map((p) => p.category).filter(Boolean)).size;
    return [
      { value: projects.length, label: 'Documented works' },
      { value: completed,       label: 'Completed' },
      { value: ongoing,         label: 'Ongoing' },
      { value: sectors,         label: 'Sectors' },
    ];
  }, [projects]);

  const labels = {
    client: cardLabels.client || 'Client',
    location: cardLabels.location || 'Location',
    contract: cardLabels.contract || 'Contract',
    view: viewLabel,
    featured: featuredLabel,
  };

  return (
    <>
      <PageHeader kicker={heroKicker} title={heroTitle} lead={heroLead} />

      {/* Stats band */}
      <div className="bg-navy border-b border-white/10">
        <div className="container-pad py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border border-white/10">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`px-5 py-5 border-white/10 ${i < stats.length - 1 ? 'border-r' : ''}`}
              >
                <div className="font-display text-2xl font-bold text-white">{s.value}</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/50">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive project map — only renders when projects carry coordinates */}
      <ProjectMap
        projects={projects}
        kicker={pg.mapKicker || 'Project footprint'}
        title={pg.mapTitle || 'Where our projects stand.'}
        subtitle={pg.mapSubtitle || 'Select a marker to see the project, then open the full case study for scope, quantities and progress.'}
        emptyNote={pg.mapEmptyNote}
      />

      {/* Filter + results */}
      <section className="section bg-stone-50">
        <div className="container-pad">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between mb-10">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter projects by category">
              {pills.map((pill) => (
                <button
                  key={pill.key}
                  role="tab"
                  aria-selected={filter === pill.key}
                  onClick={() => setFilter(pill.key)}
                  className={`filter-chip ${
                    filter === pill.key ? 'filter-chip-on' : 'filter-chip-off'
                  }`}
                >
                  {pill.label}
                  <span className={`text-[10px] tabular-nums ${filter === pill.key ? 'text-white/60' : 'text-slate-400'}`}>
                    {String(countFor(pill.key)).padStart(2, '0')}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                className="input !pl-9 !rounded-none"
                placeholder={searchPlaceholder}
                aria-label="Search projects"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="border border-slate-200 bg-white overflow-hidden">
                  <div className="skeleton aspect-[4/3]" />
                  <div className="p-5 space-y-3">
                    <div className="skeleton h-5 w-2/5" />
                    <div className="skeleton h-3.5 w-full" />
                    <div className="skeleton h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Featured lead card */}
              {lead && (
                <FadeIn className="mb-8">
                  <LeadCard p={lead} labels={labels} />
                </FadeIn>
              )}

              {/* Grid */}
              {gridItems.length > 0 ? (
                <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {gridItems.map((p) => (
                    <ProjectCard key={p._id} p={p} labels={labels} />
                  ))}
                </Stagger>
              ) : !lead && (
                <div className="empty-state">
                  <p>{emptyState}</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <PageCta
        kicker="Work with us"
        title="Planning a similar project?"
        label="Request a consultation"
      />
    </>
  );
}

function ProjectCard({ p, labels }) {
  return (
    <motion.article variants={item} className="h-full">
      <Link
        to={`/projects/${p._id}`}
        className="group flex h-full flex-col bg-white border border-slate-200
          transition-all duration-200 hover:border-accent/40 hover:shadow-elevated hover:-translate-y-0.5
          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-navy">
          {p.coverImage && (
            <SiteImage
              src={p.coverImage}
              alt={p.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/15 to-transparent" />
          <span className="absolute top-3 left-3 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy">
            {p.category}
          </span>
          <div className="absolute top-3 right-3">
            <StatusBadge project={p} />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h2 className="font-display text-base font-bold leading-snug text-white line-clamp-2">
              {p.title}
            </h2>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-1 flex-col p-5">
          <dl className="space-y-2">
            {p.client && (
              <div className="flex items-center gap-3">
                <dt className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {labels.client}
                </dt>
                <dd className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-navy truncate">
                  <Users size={12} className="shrink-0 text-slate-300" aria-hidden="true" />
                  {p.client}
                </dd>
              </div>
            )}
            {p.location && (
              <div className="flex items-center gap-3">
                <dt className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {labels.location}
                </dt>
                <dd className="flex min-w-0 items-center gap-1.5 text-sm text-slate-600 truncate">
                  <MapPin size={12} className="shrink-0 text-slate-300" aria-hidden="true" />
                  {p.location}
                </dd>
              </div>
            )}
            {p.contractValue != null && (
              <div className="flex items-center gap-3">
                <dt className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {labels.contract}
                </dt>
                <dd className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-accent truncate">
                  <Wallet size={12} className="shrink-0 text-slate-300" aria-hidden="true" />
                  {formatETB(p.contractValue)}
                </dd>
              </div>
            )}
          </dl>

          {p.scope && (
            <p className="mt-3 text-sm leading-relaxed text-slate-500 line-clamp-2">{p.scope}</p>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
            <span className="text-xs font-semibold text-slate-400">{p.year || ''}</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-accent transition-colors group-hover:text-accent-dark">
              {labels.view} <ArrowRight size={11} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function LeadCard({ p, labels }) {
  return (
    <Link
      to={`/projects/${p._id}`}
      className="group grid overflow-hidden bg-white border border-slate-200
        transition-all duration-200 hover:border-accent/40 hover:shadow-elevated
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40
        lg:grid-cols-2"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[400px] overflow-hidden bg-navy">
        {p.coverImage && (
          <SiteImage
            src={p.coverImage}
            alt={p.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />
        <span className="absolute top-4 left-4 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-navy">
          {p.category}
        </span>
        <div className="absolute top-4 right-4">
          <StatusBadge project={p} />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
        <div aria-hidden="true" className="h-0.5 w-8 bg-accent mb-5" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-2">{labels.featured}</p>
        <h2 className="font-display text-2xl font-bold leading-tight text-navy sm:text-3xl">{p.title}</h2>
        {p.description && (
          <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line line-clamp-3">{p.description}</p>
        )}
        {p.scope && <p className="mt-2 text-sm text-slate-500 line-clamp-2">{p.scope}</p>}

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
          {p.client && (
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{labels.client}</dt>
              <dd className="mt-1 text-sm font-semibold text-navy">{p.client}</dd>
            </div>
          )}
          {p.location && (
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{labels.location}</dt>
              <dd className="mt-1 text-sm text-slate-600">{p.location}</dd>
            </div>
          )}
          {p.contractValue != null && (
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{labels.contract}</dt>
              <dd className="mt-1 text-sm font-bold text-accent">{formatETB(p.contractValue)}</dd>
            </div>
          )}
        </dl>

        <span className="mt-7 inline-flex items-center gap-2 bg-navy px-5 py-2.5 text-sm font-bold text-white w-fit transition-colors group-hover:bg-accent">
          {labels.view} <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
