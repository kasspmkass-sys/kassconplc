/**
 * WHERE WE WORK — locations / facilities
 * Uses real registered addresses only. No invented coverage claims.
 */
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { FadeIn } from '../Motion';
import SiteImage from '../SiteImage';

export default function WhereWeWork({ settings, compact = false }) {
  const homeLocations    = settings?.home?.locations || {};
  const kicker           = homeLocations.kicker           || 'Where we work';
  const customTitle      = homeLocations.title             || '';
  const text             = homeLocations.text              || '';
  const facilitiesEyebrow = homeLocations.facilitiesEyebrow || 'Registered facilities';
  const primaryCtaLabel  = homeLocations.primaryCtaLabel   || 'Explore our projects';
  const secondaryCtaLabel = homeLocations.secondaryCtaLabel || 'Contact our offices';
  const image            = homeLocations.image             || null;
  const imageAlt         = homeLocations.imageAlt          || 'KASCON operations overview';

  const defaultText =
    'Headquartered in Addis Ababa, with plant and operations in Legetafo City, Kassa & Sons delivers ' +
    'building construction, civil engineering, roads, energy facilities and aviation infrastructure.';

  const facilities = Array.isArray(homeLocations.facilities) && homeLocations.facilities.length
    ? homeLocations.facilities.map((f, i) => ({
        index: String(i + 1).padStart(2, '0'),
        tag: f.tag,
        city: f.city || f.title,
        address: f.address,
        extra: f.extra || null,
      }))
    : [
        {
          index: '01',
          tag: 'Head Office',
          city: 'Addis Ababa',
          address: settings?.address || 'Gurd Shola, Cheshire Services Ethiopia Building, 3rd Floor',
          extra: settings?.poBox || null,
        },
        {
          index: '02',
          tag: 'Operations & Plant',
          city: 'Legetafo',
          address: settings?.legetafoAddress || 'Legetafo City, approx. 500 m from Ropack Real Estate road',
          extra: null,
        },
      ];

  return (
    <section
      aria-labelledby={compact ? undefined : 'where-we-work-heading'}
      aria-label={compact ? 'Registered facilities' : undefined}
      className="where-we-work section bg-stone-50"
    >
      <div className="container-pad">
        <FadeIn>
          <div className={`grid items-start gap-12 ${compact ? '' : 'lg:grid-cols-2 lg:gap-20'}`}>

            {/* Copy column */}
            {!compact && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="editorial-eyebrow" id="where-we-work-heading">{kicker}</p>
              </div>

              <h2 className="editorial-title">
                {customTitle || (
                  <>Delivering construction{' '}
                    <span className="text-accent">across Ethiopia.</span>
                  </>
                )}
              </h2>

              <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 max-w-xl">
                {text || defaultText}
              </p>

              {image && (
                <div className="mt-8 overflow-hidden border border-slate-200">
                  <SiteImage src={image} alt={imageAlt} className="w-full object-cover aspect-[16/9]" />
                </div>
              )}

              <div className="mt-9 flex flex-wrap gap-3">
                <Link to="/projects" className="btn-primary">
                  {primaryCtaLabel} <ArrowRight size={15} />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent
                    transition-colors hover:text-accent-dark focus:outline-none focus-visible:ring-2
                    focus-visible:rounded focus-visible:ring-accent/40"
                >
                  {secondaryCtaLabel} <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
            )}

            {/* Facilities column */}
            <div>
              <p className="mb-5 text-[11px] uppercase tracking-widest text-slate-400">{facilitiesEyebrow}</p>
              <div className={`grid gap-4 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'}`}>
                {facilities.map((f) => (
                  <div
                    key={`${f.index}-${f.city}`}
                    className="group flex flex-col border border-slate-200 bg-white p-6
                      transition-all duration-200 hover:border-accent/40 hover:shadow-card hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-10 w-10 items-center justify-center border border-slate-200 text-navy transition-all duration-200 group-hover:border-accent/40 group-hover:bg-accent/5">
                        <MapPin size={18} aria-hidden="true" />
                      </span>
                      <span aria-hidden="true" className="font-display text-3xl font-bold leading-none text-slate-100 transition-colors duration-200 group-hover:text-accent/20">
                        {f.index}
                      </span>
                    </div>

                    <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-accent">{f.tag}</p>
                    <h3 className="mt-1 font-display text-xl font-bold text-navy">{f.city}</h3>

                    <div className="mt-3 flex-1 border-t border-slate-100 pt-3">
                      <p className="text-sm leading-relaxed text-slate-600">{f.address}</p>
                      {f.extra && (
                        <p className="mt-2 text-xs uppercase tracking-wider text-slate-400">{f.extra}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
