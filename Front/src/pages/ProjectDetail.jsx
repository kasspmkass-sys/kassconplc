/**
 * PROJECT DETAIL
 * Engineering layout with strong imagery, metadata, gallery, related projects.
 * Only shows verified data. Progress bar only when status === 'ongoing'.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Building2, Calendar,
  CheckCircle2, Clock4, FolderKanban, HardHat, MapPin, PlayCircle, Ruler, Wallet, ZoomIn,
} from 'lucide-react';
import api, { formatETB } from '../api';
import { useSEO } from '../useSEO';
import { useSite } from '../context/SiteContext';
import { FadeIn } from '../components/Motion';
import Lightbox from '../components/Lightbox';
import SiteImage from '../components/SiteImage';
import PageCta from '../components/PageCta';

export default function ProjectDetail() {
  const { settings } = useSite();
  const { id }       = useParams();
  const [project, setProject] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  const detail           = settings?.projectsPage?.detail || {};
  const factLabels       = detail.factLabels       || {};
  const notFoundTitle    = detail.notFoundTitle    || 'Project not found';
  const backLabel        = detail.backLabel        || 'All projects';
  const overviewLabel    = detail.overviewLabel    || 'Overview';
  const scopeLabel       = detail.scopeLabel       || 'Scope of works';
  const progressLabel    = detail.progressLabel    || 'Completion progress';
  const galleryLabel     = detail.galleryLabel     || 'Project gallery';
  const informationLabel = detail.informationLabel || 'Project information';
  const enquiriesLabel   = detail.enquiriesLabel   || 'Enquire about similar work';
  const relatedKicker    = detail.relatedKicker    || 'More from the portfolio';
  const relatedTitle     = detail.relatedTitle     || 'Related projects';
  const relatedViewAll   = detail.relatedViewAll   || 'View all projects';
  const ctaKicker        = detail.ctaKicker        || 'Work with us';
  const ctaTitle         = detail.ctaTitle         || 'Planning a similar project?';
  const ctaText          = detail.ctaText          ||
    'From fuel stations and mixed-use buildings to roads and industrial works — KASCON delivers Grade-1 construction across Ethiopia.';
  const ctaPrimary       = detail.ctaPrimary       || 'Discuss your project';
  const ctaSecondary     = detail.ctaSecondary     || 'Back to all projects';

  useSEO(project?.title, project?.scope || project?.description || 'KASCON project', 'projectDetail');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/projects/public/${id}`),
      api.get('/projects/public'),
    ])
      .then(([p, all]) => {
        setProject(p.data);
        const others = (all.data || []).filter((x) => x._id !== p.data._id && x.coverImage);
        const ranked = others
          .map((x) => ({
            x,
            score: (x.category === p.data.category ? 2 : 0) + (x.featured ? 1 : 0),
          }))
          .sort((a, b) => b.score - a.score)
          .map((r) => r.x)
          .slice(0, 4);
        setRelated(ranked);
      })
      .catch(() => setError(notFoundTitle))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="pt-20">
        <div className="skeleton h-[46vh]" />
        <div className="container-pad py-10 grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
          <div className="skeleton h-64" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="pt-32 pb-20 container-pad text-center">
        <p className="text-slate-500 mb-6">{error || notFoundTitle}</p>
        <Link to="/projects" className="btn-primary">
          <ArrowLeft size={15} /> {backLabel}
        </Link>
      </div>
    );
  }

  const formatDate = (v) => {
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const startStr = formatDate(project.startDate);
  const endStr   = formatDate(project.completionDate);

  const timeline = [
    { key: 'start', label: 'Start', value: startStr },
    {
      key: 'end',
      label: project.status === 'ongoing' ? 'Expected completion' : 'Completed',
      value: endStr || (project.status === 'ongoing' ? null : project.year || null),
    },
  ].filter((t) => t.value);

  const quantitySource = project.majorQuantities || project.quantities || '';
  const quantities = quantitySource
    .split(/[\n,;•]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const phases = [
    { key: 'before', label: 'Before', images: [] },
    { key: 'during', label: 'During', images: [] },
    { key: 'after', label: 'After', images: [] },
  ];
  (Array.isArray(project.phases) ? project.phases : []).forEach((src, i) => {
    if (src && phases[i]) phases[i].images.push(src);
  });
  const activePhases = phases.filter((p) => p.images.length > 0);

  const gallery = [project.coverImage, ...(project.images || [])].filter(Boolean);
  const overview = project.description || [
    project.title
      ? `${project.title} is a ${(project.category || 'construction').toLowerCase()} project`
      : null,
    project.client ? `delivered for ${project.client}` : null,
    project.status === 'completed'
      ? project.year ? `, completed in ${project.year}.` : ', delivered to completion.'
      : project.year ? `, underway since ${project.year}.` : ', currently underway.',
  ].filter(Boolean).join(' ');

  return (
    <div className="pt-20">
      {/* ── Hero ── */}
      <section className="relative min-h-[46vh] flex items-end overflow-hidden bg-navy">
        {project.coverImage && (
          <div className="absolute inset-0 opacity-40">
            <SiteImage
              src={project.coverImage}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy via-navy/55 to-transparent" />
        <div aria-hidden="true" className="absolute inset-0 hero-blueprint opacity-30" />

        <div className="container-pad relative z-10 pb-12 pt-32 w-full">
          <nav className="mb-6" aria-label="Breadcrumb">
            <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
              <ArrowLeft size={14} /> {backLabel}
            </Link>
          </nav>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white ${
              project.status === 'completed' ? 'bg-emerald-700' : 'bg-accent'
            }`}>
              {project.status === 'completed'
                ? <><CheckCircle2 size={10} /> Completed</>
                : <><Clock4 size={10} /> {project.progress ? `${project.progress}%` : 'Ongoing'}</>
              }
            </span>
            {project.category && (
              <span className="bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                {project.category}
              </span>
            )}
            {project.year && (
              <span className="bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                {project.year}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl md:text-5xl font-bold text-white max-w-4xl leading-tight">
            {project.title}
          </h1>
          {project.client && (
            <p className="mt-3 text-white/65 text-lg max-w-2xl">{project.client}</p>
          )}
        </div>
      </section>

      {/* ── Body ── */}
      <section className="section bg-white">
        <div className="container-pad grid lg:grid-cols-3 gap-10 lg:gap-14">

          {/* Main */}
          <FadeIn className="lg:col-span-2 space-y-10">

            {/* Overview */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="editorial-eyebrow">{overviewLabel}</p>
              </div>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line text-base sm:text-lg">{overview}</p>
            </div>

            {/* Scope */}
            {project.scope && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                  <p className="editorial-eyebrow">{scopeLabel}</p>
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{project.scope}</p>
              </div>
            )}

            {/* Key facts — start/completion dates and major quantities */}
            {(timeline.length > 0 || quantities.length > 0) && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                  <p className="editorial-eyebrow">Key facts</p>
                </div>

                {timeline.length > 0 && (
                  <dl className="grid grid-cols-2 gap-px border border-slate-200 bg-slate-200">
                    {timeline.map((t) => (
                      <div key={t.key} className="bg-white p-4">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          {t.label}
                        </dt>
                        <dd className="mt-1 font-display text-sm font-bold text-navy">{t.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {quantities.length > 0 && (
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {quantities.map((q, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 border border-slate-200 bg-stone-50 p-3.5"
                      >
                        <Ruler
                          size={15}
                          className="mt-0.5 shrink-0 text-accent"
                          aria-hidden="true"
                        />
                        <span className="text-sm text-slate-700">{q}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Progress (only if ongoing) */}
            {project.status === 'ongoing' && (
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-bold text-navy">{progressLabel}</span>
                  <span className="font-bold text-accent">{project.progress || 0}%</span>
                </div>
                <div className="h-2 bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${project.progress || 0}%` }}
                    role="progressbar"
                    aria-valuenow={project.progress || 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                  <p className="editorial-eyebrow">{galleryLabel}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {gallery.map((src, i) => (
                    <button
                      key={`${src}-${i}`}
                      onClick={() => setLightbox(src)}
                      className="group relative overflow-hidden aspect-[16/10] bg-slate-100 cursor-pointer border border-slate-200 hover:border-accent/40 transition-colors duration-200"
                      aria-label={`View image ${i + 1}`}
                    >
                      <SiteImage
                        src={src}
                        alt={`${project.title} — image ${i + 1}`}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/30 transition-all duration-300 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-navy/70 p-2.5">
                          <ZoomIn size={18} className="text-white" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Before / During / After — only for projects that have phase photos */}
            {activePhases.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                  <p className="editorial-eyebrow">Before, during &amp; after</p>
                </div>
                <div
                  className={`grid gap-4 ${
                    activePhases.length === 1 ? '' : 'sm:grid-cols-3'
                  }`}
                >
                  {activePhases.map((p) => (
                    <figure key={p.key} className="border border-slate-200">
                      <p className="bg-navy px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        {p.label}
                      </p>
                      {p.images.map((src, i) => (
                        <button
                          key={`${src}-${i}`}
                          type="button"
                          onClick={() => setLightbox(src)}
                          className="group relative block w-full cursor-pointer overflow-hidden bg-slate-100"
                          aria-label={`View ${p.label.toLowerCase()} photo`}
                        >
                          <SiteImage
                            src={src}
                            alt={`${project.title} — ${p.label.toLowerCase()}`}
                            loading="lazy"
                            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <span className="absolute inset-0 grid place-items-center bg-navy/0 transition-colors duration-200 group-hover:bg-navy/30">
                            <ZoomIn
                              size={18}
                              className="scale-0 text-white transition-transform duration-200 group-hover:scale-100"
                            />
                          </span>
                        </button>
                      ))}
                    </figure>
                  ))}
                </div>
              </div>
            )}

            <Lightbox src={lightbox} alt={project.title || ''} onClose={() => setLightbox(null)} />
          </FadeIn>

          {/* Sidebar */}
          <FadeIn delay={0.1} className="space-y-4">
            <div className="border-t-2 border-accent border border-slate-200 p-6 space-y-4 bg-stone-50">
              <h2 className="font-display font-bold text-navy text-base">{informationLabel}</h2>
              <FactRow icon={Building2}   label={factLabels.client   || 'Client'}         value={project.client} />
              <FactRow icon={MapPin}       label={factLabels.location || 'Location'}       value={project.location} />
              <FactRow icon={Calendar}     label={factLabels.year     || 'Year'}           value={project.year} />
              {startStr && (
                <FactRow icon={PlayCircle}  label="Start date"                               value={startStr} />
              )}
              {endStr && (
                <FactRow
                  icon={CheckCircle2}
                  label={project.status === 'ongoing' ? 'Expected completion' : 'Completed'}
                  value={endStr}
                />
              )}
              <FactRow icon={FolderKanban} label={factLabels.category || 'Project type'}   value={project.category} />
              <FactRow icon={HardHat}      label={factLabels.status   || 'Status'}
                value={project.status === 'completed' ? 'Completed' : project.progress ? `${project.progress}% ongoing` : 'Ongoing'} />
              <FactRow icon={Wallet}       label={factLabels.contract || 'Contract value'}
                value={project.contractValue != null ? formatETB(project.contractValue) : null} />
            </div>
            <Link to="/contact" className="btn-primary w-full">
              {enquiriesLabel} <ArrowRight size={15} />
            </Link>
            <Link to="/projects" className="btn-ghost w-full">
              <ArrowLeft size={14} /> {backLabel}
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Related projects ── */}
      {related.length > 0 && (
        <section className="bg-stone-50 section-compact">
          <div className="container-pad">
            <FadeIn>
              <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                    <p className="editorial-eyebrow">{relatedKicker}</p>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-navy">{relatedTitle}</h2>
                </div>
                <Link to="/projects" className="btn-ghost hidden sm:inline-flex">
                  {relatedViewAll} <ArrowRight size={14} />
                </Link>
              </div>
            </FadeIn>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((rp, i) => (
                <FadeIn key={rp._id} delay={i * 0.05}>
                  <Link
                    to={`/projects/${rp._id}`}
                    className="group block overflow-hidden bg-white border border-slate-200
                      transition-all duration-200 hover:border-accent/40 hover:shadow-elevated hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-navy">
                      <SiteImage
                        src={rp.coverImage}
                        alt={rp.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/10 to-transparent" />
                      <span className={`absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${
                        rp.status === 'completed' ? 'bg-emerald-700' : 'bg-accent'
                      }`}>
                        {rp.status === 'completed' ? 'Completed' : 'Ongoing'}
                      </span>
                      <span className="absolute top-3 left-3 bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                        {rp.category}
                      </span>
                      <span className="absolute bottom-3 left-3 right-3 block font-display text-sm font-bold text-white line-clamp-2">
                        {rp.title}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-slate-500 truncate">{rp.client || rp.location || ''}</p>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      <PageCta
        kicker={ctaKicker}
        title={ctaTitle}
        text={ctaText}
        label={ctaPrimary}
        secondaryTo="/projects"
        secondaryLabel={ctaSecondary}
      />
    </div>
  );
}

function FactRow({ icon: Icon, label, value }) {
  if (!value || value === '-') return null;
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 bg-navy/5 text-navy grid place-items-center shrink-0">
        <Icon size={14} aria-hidden="true" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">{label}</div>
        <div className="text-sm text-navy font-semibold">{value}</div>
      </div>
    </div>
  );
}
