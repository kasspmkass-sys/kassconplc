/**
 * CAREERS — Home section
 * No fake job listings, benefits or salaries.
 * Grounded in verified workforce facts from settings.specialists.
 */
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FadeIn } from '../Motion';
import SiteImage from '../SiteImage';

export default function Careers({ settings }) {
  const specialists  = settings?.specialists || '108';
  const homeCareers  = settings?.home?.careers || {};
  const kicker       = homeCareers.kicker    || 'Careers';
  const customTitle  = homeCareers.title      || '';
  const lead         = homeCareers.text       || '';
  const ctaLabel     = homeCareers.ctaLabel   || 'Explore careers';
  const image        = homeCareers.image      || null;
  const imageCaption = homeCareers.caption    || 'People · Plant · Practice';

  const defaultLead =
    'Kassa & Sons is built on people — an experienced workforce of engineers, site managers and skilled crews ' +
    'delivering major construction projects across Ethiopia. Our teams grow through hands-on responsibility on ' +
    'real work, guided by a founder-led tradition of mentorship.';

  const pillars = Array.isArray(homeCareers.pillars) && homeCareers.pillars.length
    ? homeCareers.pillars
    : [
        'Construction careers across building, civil and energy works',
        'Roles for engineers, site managers, technicians and skilled crews',
        'Hands-on growth on live projects and mentorship from senior practitioners',
        'Commercial, fuel, steel and civil engineering project experience',
      ];

  return (
    <section aria-labelledby="careers-hp-heading" className="careers section bg-white">
      <div className="container-pad">
        <FadeIn>
          <div className={`grid items-center gap-12 lg:gap-20 ${image ? 'lg:grid-cols-2' : ''}`}>

            {/* Copy */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="editorial-eyebrow" id="careers-hp-heading">{kicker}</p>
              </div>
              <h2 className="editorial-title">
                {customTitle || (
                  <>Build your career{' '}
                    <span className="text-accent">with KASCON.</span>
                  </>
                )}
              </h2>
              <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 max-w-xl">
                {lead || defaultLead}
              </p>

              <ul className="mt-7 space-y-3">
                {pillars.map((p, i) => (
                  <li key={`${i}-${p}`} className="flex items-start gap-3 text-sm sm:text-[15px] text-slate-600">
                    <span aria-hidden="true" className="mt-2 h-0.5 w-5 shrink-0 bg-accent" />
                    {p}
                  </li>
                ))}
              </ul>

              <div className="mt-9">
                <Link to="/careers" className="btn-primary">
                  {ctaLabel} <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Image */}
            {image && (
              <div>
                <figure>
                  <div className="relative overflow-hidden border border-slate-200">
                    <SiteImage
                      src={image}
                      alt={homeCareers.imageAlt || 'KASCON construction team on site'}
                      className="aspect-[4/3] w-full object-cover object-center"
                    />
                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy/25 via-transparent to-transparent" />
                    <span aria-hidden="true" className="absolute bottom-0 left-0 h-0.5 w-16 bg-accent" />
                  </div>
                  <figcaption className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                    <span className="text-[11px] uppercase tracking-widest text-slate-400">{imageCaption}</span>
                    <span className="text-[11px] font-bold text-navy">{specialists}+ specialists</span>
                  </figcaption>
                </figure>
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
