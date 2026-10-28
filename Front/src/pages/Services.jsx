/**
 * SERVICES — 9 KASCON Business Areas
 * Engineering card grid. CMS-driven via /services/public.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Building, Forklift, Fuel, Hammer,
  Layers, Route, Settings2, Trees, Factory, ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';
import { useSEO } from '../useSEO';
import { useSite } from '../context/SiteContext';
import { Stagger, item } from '../components/Motion';
import SiteImage from '../components/SiteImage';
import PageHeader from '../components/PageHeader';
import PageCta from '../components/PageCta';

const ICONS = {
  building: Building2, fuel: Fuel, steel: Hammer, wood: Trees,
  quarry: Layers, management: Settings2, crane: Forklift,
  road: Route, mixer: Factory, realestate: Building,
};

export default function Services() {
  const { settings } = useSite();
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  /* Ids whose image failed to load, so the aspect-ratio frame is removed too. */
  const [brokenImages, setBrokenImages] = useState(() => new Set());
  const markImageBroken = (id) =>
    setBrokenImages((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));

  const pg          = settings?.servicesPage || {};
  const introKicker = pg.kicker      || 'Business areas';
  const introTitle  = pg.title       || 'Nine integrated construction capabilities.';
  const introLead   = pg.lead        || 'Grade-1 delivery across buildings, energy facilities, civil works, fabrication and materials.';
  const emptyState  = pg.emptyState  || 'Service details are being updated. Please check back shortly.';

  useSEO(
    'Services',
    'Nine integrated construction capabilities — buildings, energy facilities, civil works, fabrication and materials. KASCON Grade-1.',
    'services'
  );

  useEffect(() => {
    setLoading(true);
    api
      .get('/services/public')
      /* Guard against a non-array payload so the grid never crashes. */
      .then((r) => setServices(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader kicker={introKicker} title={introTitle} lead={introLead} />

      <section className="section bg-stone-50">
        <div className="container-pad">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="border border-slate-200 bg-white overflow-hidden">
                  <div className="aspect-[16/9] skeleton" />
                  <div className="p-6 space-y-3">
                    <div className="skeleton h-5 w-1/2" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="empty-state">
              <p>{emptyState}</p>
            </div>
          ) : (
            <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s, i) => {
                const Icon = ICONS[s.icon] || Building2;
                return (
                  <motion.article key={s._id} variants={item}>
                    <Link
                      to={`/services/${s._id}`}
                      className="group flex h-full flex-col bg-white border border-slate-200
                        transition-all duration-200 hover:border-accent/35 hover:shadow-elevated hover:-translate-y-0.5
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2"
                    >
                      {/* Accent top bar */}
                      <div aria-hidden="true" className="h-0.5 bg-slate-100 group-hover:bg-accent transition-colors duration-200" />

                      {/* Service image — the frame is dropped entirely when the
                          image is missing or fails, so no empty box is left. */}
                      {s.image && !brokenImages.has(s._id) && (
                        <div className="overflow-hidden aspect-[16/9] bg-slate-100">
                          <SiteImage
                            src={s.image}
                            alt={s.title}
                            onError={() => markImageBroken(s._id)}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}

                      <div className="flex flex-1 flex-col p-6 sm:p-7">
                        <div className="flex items-start justify-between gap-4">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-navy/5 text-navy transition-all duration-200 group-hover:bg-accent group-hover:text-white">
                            <Icon size={20} aria-hidden="true" />
                          </span>
                          <span aria-hidden="true" className="font-display text-3xl font-bold text-slate-100 transition-colors duration-200 group-hover:text-accent/20">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                        </div>

                        <h2 className="mt-5 font-display text-lg font-bold leading-snug text-navy group-hover:text-accent transition-colors duration-200">
                          {s.title}
                        </h2>
                        {s.summary && (
                          <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-3">{s.summary}</p>
                        )}

                        {s.features?.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {s.features.slice(0, 3).map((f) => (
                              <span key={f} className="inline-flex items-center rounded bg-navy/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy/70">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}

                        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[11px] font-bold uppercase tracking-widest text-accent">
                          Details <ArrowRight size={11} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                );
              })}
            </Stagger>
          )}
        </div>
      </section>

      <PageCta
        kicker="Work with us"
        title="Ready to discuss your project?"
        label="Request a consultation"
      />
    </>
  );
}
