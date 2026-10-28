import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FadeIn } from '../Motion';
import SiteImage from '../SiteImage';

const DEFAULT_ABOUT =
  'Kassa & Sons Construction PLC is an Ethiopian multidisciplinary construction company headquartered in Addis Ababa — a licensed Grade-1 General Contractor trusted across building, civil and energy works since 1980.';

export default function WhoWeAre({ settings }) {
  const homeAbout = settings?.home?.about || {};
  const story = homeAbout.description || settings?.aboutShort || settings?.aboutLong || DEFAULT_ABOUT;
  const kicker = homeAbout.kicker || 'Who we are';
  const customTitle = homeAbout.title || '';
  const image = homeAbout.image || settings?.whoWeAreImage || null;
  const specializations = Array.isArray(settings?.specializations)
    ? settings.specializations.slice(0, 4)
    : [];
  const primaryCtaLabel = homeAbout.primaryCtaLabel || 'About KASCON';
  const secondaryCtaLabel = homeAbout.secondaryCtaLabel || 'History & values';
  const imageAlt = homeAbout.imageAlt || 'Kassa & Sons construction site in Addis Ababa, Ethiopia';
  const cautionText = homeAbout.cautionText || '';
  const cautionAuthor = homeAbout.cautionAuthor || '';
  const grade = settings?.grade || 'Grade-1 General Contractor';
  const founded = settings?.foundedYear || '1980';

  return (
    <section aria-labelledby="who-we-are-heading" className="who-we-are section overflow-hidden bg-white">
      <div className="container-pad">
        <FadeIn>
          <div className={`grid items-center gap-12 lg:gap-20 ${image ? 'lg:grid-cols-12' : ''}`}>
            <div className={image ? 'lg:col-span-6' : ''}>
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="editorial-eyebrow" id="who-we-are-heading">{kicker}</p>
              </div>

              <h2 className="editorial-title">
                {customTitle || (
                  <>An established Ethiopian contractor,{' '}
                    <span className="text-accent">built on modern delivery.</span>
                  </>
                )}
              </h2>

              <div className="mt-6 flex flex-wrap gap-2">
                {grade && (
                  <span className="inline-flex items-center bg-navy px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
                    {grade}
                  </span>
                )}
                {founded && (
                  <span className="inline-flex items-center border border-slate-200 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Est. {founded}
                  </span>
                )}
              </div>

              <p className="mt-7 text-base sm:text-lg leading-relaxed text-slate-600 max-w-xl whitespace-pre-line line-clamp-6">
                {story}
              </p>

              {cautionText && (
                <blockquote className="mt-8 max-w-xl border-l-2 border-accent pl-5">
                  <p className="text-base font-semibold leading-snug text-navy">{cautionText}</p>
                  {cautionAuthor && (
                    <footer className="mt-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      {cautionAuthor}
                    </footer>
                  )}
                </blockquote>
              )}

              {specializations.length > 0 && (
                <ul className="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-3 max-w-2xl">
                  {specializations.map((s, i) => (
                    <li key={`${s.title}-${i}`} className="flex items-start gap-3">
                      <span aria-hidden="true" className="mt-2 h-0.5 w-5 shrink-0 bg-accent" />
                      <p className="text-sm font-semibold text-navy">{s.title}</p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-7">
                <Link to="/about" className="btn-primary">
                  {primaryCtaLabel} <ArrowRight size={15} />
                </Link>
                <Link
                  to="/about#company"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-dark"
                >
                  {secondaryCtaLabel} <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>

            {image && (
              <div className="lg:col-span-6">
                <figure className="relative">
                  <span aria-hidden="true" className="absolute -left-3 -top-3 hidden h-16 w-16 border-l-2 border-t-2 border-accent sm:block" />
                  <div className="relative overflow-hidden border border-slate-200">
                    <SiteImage
                      src={image}
                      alt={imageAlt}
                      className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
                    />
                  </div>
                  <figcaption className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                    <span className="text-[11px] uppercase tracking-widest text-slate-400">
                      {settings?.companyName || 'Kassa & Sons Construction PLC'}
                    </span>
                    <span className="text-[11px] font-bold text-accent uppercase tracking-widest">
                      {settings?.yearsExperience || '46+'} yrs
                    </span>
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
