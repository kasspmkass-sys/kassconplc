/**
 * CAREERS PAGE
 * CMS-driven via /careers/public. No fake vacancies.
 * Engineering style: sharp cards, dark-red accents.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Building2, CalendarClock, Clock3, MapPin } from 'lucide-react';
import { FadeIn } from '../components/Motion';
import api from '../api';
import { useSite } from '../context/SiteContext';
import { useSEO } from '../useSEO';
import PageHeader from '../components/PageHeader';
import PageCta from '../components/PageCta';

export default function Careers() {
  const { settings } = useSite();
  const [jobs, setJobs] = useState(null);

  const pg          = settings?.careersPage || {};
  const heroKicker  = pg.heroKicker  || 'Careers';
  const heroTitle   = pg.heroTitle   || 'Build your future with KASCON.';
  const heroLead    = pg.heroLead    ||
    'Kassa & Sons is built on people — experienced engineers, site managers and skilled crews working together to deliver challenging projects across Ethiopia.';
  const heroImage   = pg.image       || null;
  const heroAlt     = pg.alt         || 'KASCON construction team on site';
  const emptyState  = pg.emptyState  ||
    'No open positions right now. Send us your CV and we will keep you in mind for upcoming roles.';
  const applyLabel  = pg.applyLabel  || 'Apply for this role';
  const openRolesKicker = pg.openRolesKicker || 'Open roles';
  const openRolesTitle  = pg.openRolesTitle  || 'Join the KASCON team.';
  const trainingKicker  = pg.trainingKicker  || 'Training & development';
  const trainingTitle   = pg.trainingTitle   || 'Investing in people';
  const trainingLead    = pg.trainingLead    ||
    'We invest in skills, safety training and career development to help our teams grow with the company.';
  const trainingItems   = Array.isArray(pg.trainingItems) ? pg.trainingItems : [];

  useSEO(
    'Careers',
    'Build your future with KASCON — construction careers for engineers, site managers and skilled crews across Ethiopia.',
    'careers'
  );

  useEffect(() => {
    api.get('/careers/public')
      .then((r) => setJobs(r.data || []))
      .catch(() => setJobs([]));
  }, []);

  return (
    <>
      <PageHeader kicker={heroKicker} title={heroTitle} lead={heroLead} image={heroImage} alt={heroAlt} />

      {/* Open roles */}
      <section aria-labelledby="open-roles-heading" className="section bg-stone-50">
        <div className="container-pad">
          <FadeIn className="max-w-3xl mb-12">
            <div className="flex items-center gap-3 mb-5">
              <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
              <p className="editorial-eyebrow" id="open-roles-heading">{openRolesKicker}</p>
            </div>
            <h2 className="editorial-title">{openRolesTitle}</h2>
          </FadeIn>

          {jobs === null ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {[1,2,3].map((i) => <div key={i} className="border border-slate-200 p-6 skeleton h-36" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <Briefcase size={32} className="mx-auto text-slate-300 mb-4" aria-hidden="true" />
              <p className="max-w-md mx-auto">{emptyState}</p>
              <Link to="/contact" className="btn-primary mt-8">
                Send your CV <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {jobs.map((j) => (
                <FadeIn key={j._id}>
                  <article className="flex h-full flex-col bg-white border border-slate-200 transition-all duration-200 hover:border-accent/40 hover:shadow-elevated">
                    <div aria-hidden="true" className="h-0.5 bg-slate-100 hover:bg-accent transition-colors duration-200" />
                    <div className="flex flex-1 flex-col p-7">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-display text-xl font-bold text-navy">{j.title}</h3>
                          <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-accent">
                            {[j.department, j.type].filter(Boolean).join(' · ') || 'Career opportunity'}
                          </p>
                        </div>
                        <span className="shrink-0 bg-navy px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                          {j.location || 'Ethiopia'}
                        </span>
                      </div>

                      {j.summary && <p className="mt-4 text-sm leading-relaxed text-slate-600">{j.summary}</p>}
                      {j.description && (
                        <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-3 whitespace-pre-line">
                          {j.description}
                        </p>
                      )}

                      {j.requirements?.length > 0 && (
                        <ul className="mt-4 space-y-1.5">
                          {j.requirements.slice(0, 4).map((r) => (
                            <li key={r} className="flex items-start gap-2.5 text-xs text-slate-500">
                              <span aria-hidden="true" className="mt-1.5 h-0.5 w-4 shrink-0 bg-accent" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-400">
                        {j.department && (
                          <span className="inline-flex items-center gap-1.5">
                            <Building2 size={12} aria-hidden="true" /> {j.department}
                          </span>
                        )}
                        {j.type && (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 size={12} aria-hidden="true" /> {j.type}
                          </span>
                        )}
                        {j.deadline && (
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarClock size={12} aria-hidden="true" /> Apply by {j.deadline}
                          </span>
                        )}
                        {!j.department && !j.type && !j.deadline && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={12} aria-hidden="true" /> {j.location || 'Ethiopia'}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto pt-5">
                        <Link to="/contact" className="btn-primary w-full">
                          {applyLabel} <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>
                  </article>
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Training & development */}
      {trainingItems.length > 0 && (
        <section aria-labelledby="training-heading" className="section bg-white">
          <div className="container-pad">
            <FadeIn className="max-w-3xl mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="editorial-eyebrow" id="training-heading">{trainingKicker}</p>
              </div>
              <h2 className="editorial-title">{trainingTitle}</h2>
              {trainingLead && (
                <p className="mt-4 text-base leading-relaxed text-slate-600">{trainingLead}</p>
              )}
            </FadeIn>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trainingItems.filter((t) => t && t.title).map((t, i) => (
                <FadeIn key={t.title || i}>
                  <div className="h-full border border-slate-200 bg-stone-50 p-6">
                    <p className="font-display text-sm font-bold text-navy">{t.title}</p>
                    {t.desc && (
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.desc}</p>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      <PageCta
        kicker="Join the team"
        title="Send your CV to KASCON."
        text="We review applications for engineering, site and skilled trades roles across Ethiopia."
        label="Get in touch"
      />
    </>
  );
}
