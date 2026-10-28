/**
 * QUALITY & HSEQ — editorial split. CMS-driven. No invented stats.
 */
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FadeIn } from '../Motion';
import SiteImage from '../SiteImage';

const DEFAULT_HSEQ =
  'Kassa & Sons operates a disciplined HSEQ system on every site — from structured safety inductions and toolbox meetings to material testing, mix-design verification and documented quality records.';

const DEFAULT_COMMITMENTS = [
  'Dedicated HSEQ leadership across all projects',
  'Site safety training and PPE enforcement',
  'Toolbox meetings before every work shift',
  'Equipment pre-use safety inspections',
  'Material testing and quality records',
  'Environmental controls and community protection',
];

export default function Safety({ settings }) {
  const homeSafety = settings?.home?.safety || {};
  const safetyValue = (settings?.values || []).find((v) => (v.title || '').toLowerCase() === 'safety');

  const kicker = homeSafety.kicker || 'Quality & HSEQ';
  const customTitle = homeSafety.title || '';
  const lead = homeSafety.lead || safetyValue?.description || DEFAULT_HSEQ;
  const image = homeSafety.image || null;
  const caption = homeSafety.caption || 'Health · Safety · Environment · Quality';
  const badge = homeSafety.badge || 'HSEQ';
  const ctaLabel = homeSafety.ctaLabel || 'Our HSEQ system';

  const commitments =
    Array.isArray(homeSafety.commitments) && homeSafety.commitments.length
      ? homeSafety.commitments
      : DEFAULT_COMMITMENTS;

  return (
    <section aria-labelledby="safety-heading" className="safety section bg-stone-50">
      <div className="container-pad">
        <div className={`grid items-center gap-12 lg:gap-20 ${image ? 'lg:grid-cols-2' : ''}`}>
          {image && (
            <FadeIn className="order-last lg:order-first">
              <figure>
                <div className="relative overflow-hidden border border-slate-200">
                  <SiteImage
                    src={image}
                    alt={homeSafety.imageAlt || 'KASCON site workers in PPE'}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <span aria-hidden="true" className="absolute bottom-0 left-0 h-1 w-16 bg-accent" />
                </div>
                <figcaption className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
                  <span className="text-[11px] uppercase tracking-widest text-slate-400">{caption}</span>
                  <span className="text-[11px] font-bold text-navy uppercase tracking-widest">{badge}</span>
                </figcaption>
              </figure>
            </FadeIn>
          )}

          <FadeIn>
            <div className="flex items-center gap-3 mb-5">
              <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
              <p className="editorial-eyebrow" id="safety-heading">{kicker}</p>
            </div>
            <h2 className="editorial-title max-w-2xl">
              {customTitle || (
                <>Safety and quality are{' '}
                  <span className="text-accent">non-negotiable.</span>
                </>
              )}
            </h2>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 max-w-xl">{lead}</p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {commitments.map((c, i) => (
                <li key={`${i}-${c}`} className="flex items-start gap-3 text-sm text-slate-600 sm:text-[15px]">
                  <span aria-hidden="true" className="mt-2 h-0.5 w-5 shrink-0 bg-accent" />
                  {c}
                </li>
              ))}
            </ul>

            <div className="mt-9">
              <Link to="/hseq" className="btn-primary">
                {ctaLabel} <ArrowRight size={15} />
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
