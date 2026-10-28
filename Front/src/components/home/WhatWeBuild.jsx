/**
 * FEATURED PROJECTS — one lead case + compact grid.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, CheckCircle2, Clock4 } from 'lucide-react';
import { FadeIn, Stagger, item } from '../Motion';
import { motion } from 'framer-motion';
import SiteImage from '../SiteImage';
import { mediaUrl } from '../../api';

export const WWB_CATEGORIES = [
  'Mixed-Use', 'Residential', 'Fuel Station', 'Infrastructure',
  'Commercial', 'Aviation', 'Industrial', 'Other',
];

export default function WhatWeBuild({ settings, projects = [], loading = false }) {
  const copy = settings?.home?.projects || {};
  const kicker = copy.kicker || 'Project experience';
  const title = copy.title || 'Landmark works across Ethiopia.';
  const subtitle = copy.subtitle || 'Mixed-use towers, fuel stations, roads and aviation infrastructure.';
  const ctaLabel = copy.ctaLabel || 'View all projects';

  const featured = useMemo(() => {
    const withImages = (projects || []).filter((p) => {
      const img = p.coverImage || p.images?.[0];
      return img && mediaUrl(img);
    });
    return [...withImages]
      .sort((a, b) =>
        Number(!!b.featured) - Number(!!a.featured) ||
        (a.status === b.status ? 0 : a.status === 'ongoing' ? -1 : 1) ||
        (a.order ?? 0) - (b.order ?? 0)
      )
      .slice(0, 5);
  }, [projects]);

  const lead = featured[0];
  const rest = featured.slice(1);

  if (loading) {
    return (
      <section aria-busy="true" aria-label="Featured projects" className="section bg-navy text-white">
        <div className="container-pad">
          <div className="mb-12 max-w-2xl space-y-4">
            <div className="skeleton h-3 w-40 bg-white/10" />
            <div className="skeleton h-10 w-full bg-white/10" />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="skeleton aspect-[16/10] bg-white/5" />
            <div className="grid grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton aspect-[4/3] bg-white/5" />)}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (featured.length === 0) return null;

  return (
    <section aria-labelledby="what-we-build-heading" className="what-we-build section bg-navy text-white relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hero-blueprint opacity-20" />

      <div className="container-pad relative">
        <FadeIn>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent" id="what-we-build-heading">
                  {kicker}
                </p>
              </div>
              <h2 className="editorial-title !text-white">{title}</h2>
              <p className="mt-4 text-base text-white/65">{subtitle}</p>
            </div>
            <Link to="/projects" className="btn-outline shrink-0 hidden sm:inline-flex">
              {ctaLabel} <ArrowRight size={15} />
            </Link>
          </div>
        </FadeIn>

        <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
          {lead && (
            <FadeIn>
              <Link
                to={`/projects/${lead._id}`}
                className="group relative block overflow-hidden border border-white/10 bg-navy-800
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <div className="relative aspect-[16/11] overflow-hidden">
                  <SiteImage
                    src={lead.coverImage || lead.images?.[0]}
                    alt={lead.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
                  <span className="absolute top-4 left-4 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy">
                    {lead.category}
                  </span>
                  <span className={`absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white ${
                    lead.status === 'completed' ? 'bg-emerald-700' : 'bg-accent'
                  }`}>
                    {lead.status === 'completed'
                      ? <><CheckCircle2 size={10} /> Completed</>
                      : <><Clock4 size={10} /> {lead.progress ? `${lead.progress}%` : 'Ongoing'}</>}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="font-display text-xl sm:text-2xl font-bold leading-snug text-white">
                      {lead.title}
                    </h3>
                    <p className="mt-2 flex items-center gap-3 text-sm text-white/70">
                      {lead.client && <span>{lead.client}</span>}
                      {lead.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} aria-hidden="true" /> {lead.location}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            </FadeIn>
          )}

          {rest.length > 0 && (
            <Stagger className="grid grid-cols-2 gap-5">
              {rest.map((p) => {
                const img = p.coverImage || p.images?.[0];
                return (
                  <motion.article key={p._id} variants={item}>
                    <Link
                      to={`/projects/${p._id}`}
                      aria-label={`${p.title} — view project`}
                      className="group relative block overflow-hidden border border-white/10 bg-navy-800
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <SiteImage
                          src={img}
                          alt={p.title}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent" />
                        <span className="absolute top-2.5 left-2.5 bg-white/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-navy">
                          {p.category}
                        </span>
                        <h3 className="absolute inset-x-0 bottom-0 p-3 font-display text-sm font-bold text-white line-clamp-2">
                          {p.title}
                        </h3>
                      </div>
                    </Link>
                  </motion.article>
                );
              })}
            </Stagger>
          )}
        </div>

        <div className="mt-10 sm:hidden">
          <Link to="/projects" className="btn-outline w-full">
            {ctaLabel} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
