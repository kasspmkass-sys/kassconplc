/**
 * WHAT WE DO — image-forward service grid (max 6 on the homepage).
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Building, Fuel, Hammer, Layers, Forklift, Route, Settings2, Trees, Factory } from 'lucide-react';
import { FadeIn, Stagger, item } from '../Motion';
import { motion } from 'framer-motion';
import SiteImage from '../SiteImage';

const SERVICE_ICONS = {
  building: Building2,
  fuel: Fuel,
  steel: Hammer,
  wood: Trees,
  quarry: Layers,
  management: Settings2,
  crane: Forklift,
  road: Route,
  mixer: Factory,
  realestate: Building,
};

export default function WhatWeDo({ settings, services = [], loading = false }) {
  const copy = settings?.home?.services || {};
  const kicker = copy.kicker || 'Business areas';
  const title = copy.title || 'Integrated construction capabilities.';
  const subtitle = copy.subtitle || 'Buildings, energy facilities, civil works, fabrication and materials — one Grade-1 contractor.';
  const cardCtaLabel = copy.cardCtaLabel || 'Details';
  const ctaLabel = copy.ctaLabel || 'View all services';

  const shown = services.slice(0, 6);

  return (
    <section aria-labelledby="what-we-do-heading" className="what-we-do section bg-stone-50">
      <div className="container-pad">
        <FadeIn>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="editorial-eyebrow" id="what-we-do-heading">{kicker}</p>
              </div>
              <h2 className="editorial-title">{title}</h2>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">{subtitle}</p>
            </div>
            {!loading && services.length > 0 && (
              <Link to="/services" className="btn-ghost shrink-0 hidden sm:inline-flex">
                {ctaLabel} <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </FadeIn>

        {loading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-slate-200 bg-white overflow-hidden">
                <div className="skeleton aspect-[16/10]" />
                <div className="p-6 space-y-3">
                  <div className="skeleton h-5 w-2/3" />
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && shown.length > 0 && (
          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((s) => {
              const Icon = SERVICE_ICONS[s.icon] || Building2;
              return (
                <motion.article key={s._id} variants={item}>
                  <Link
                    to={`/services/${s._id}`}
                    aria-label={`${s.title} — learn more`}
                    className="group flex h-full flex-col bg-white border border-slate-200 overflow-hidden
                      transition-all duration-200 hover:border-accent/35 hover:shadow-elevated hover:-translate-y-0.5
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2"
                  >
                    {s.image ? (
                      <div className="relative aspect-[16/10] overflow-hidden bg-navy/5">
                        <SiteImage
                          src={s.image}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <div className="h-0.5 bg-slate-100 group-hover:bg-accent transition-colors" />
                    )}

                    <div className="flex flex-1 flex-col p-6">
                      <span className="flex h-10 w-10 items-center justify-center bg-navy/5 text-navy transition-colors group-hover:bg-accent group-hover:text-white">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <h3 className="mt-4 font-display text-[17px] font-bold leading-snug text-navy group-hover:text-accent transition-colors">
                        {s.title}
                      </h3>
                      {s.summary && (
                        <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">{s.summary}</p>
                      )}
                      <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[11px] font-bold uppercase tracking-widest text-accent">
                        {cardCtaLabel}
                        <ArrowRight size={11} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </Stagger>
        )}

        {!loading && services.length === 0 && (
          <div className="empty-state">
            <p>Service details are being updated.</p>
          </div>
        )}

        {!loading && services.length > 0 && (
          <div className="mt-10 sm:hidden">
            <Link to="/services" className="btn-ghost w-full">
              {ctaLabel} <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
