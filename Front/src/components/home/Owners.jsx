/**
 * LEADERSHIP — Founder / Owners section
 * CMS-driven from settings.ownerName/ownerTitle/ownerBio/ownerImage/ownerQuote.
 * Only renders what the CMS actually supplies.
 */
import { FadeIn } from '../Motion';
import SiteImage from '../SiteImage';

export default function Owners({ settings }) {
  const owner = {
    name:  settings?.ownerName  || 'Ato Kassa G/Tsadik',
    title: settings?.ownerTitle || 'Founder & Chairman',
    bio:   settings?.ownerBio   || null,
    image: settings?.ownerImage || null,
    quote: settings?.ownerQuote || null,
  };

  const kicker       = settings?.ownersKicker || 'Leadership';
  const customTitle  = settings?.ownersTitle  || '';

  // Don't render section if there's nothing real to show
  if (!owner.bio && !owner.quote && !owner.image) return null;

  return (
    <section aria-labelledby="owners-heading" className="our-owners section bg-white">
      <div className="container-pad">
        <FadeIn>
          <div className="flex items-center gap-3 mb-5">
            <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
            <p className="editorial-eyebrow" id="owners-heading">{kicker}</p>
          </div>
          <h2 className="editorial-title max-w-3xl">
            {customTitle || (
              <>The people{' '}
                <span className="text-accent">behind KASCON.</span>
              </>
            )}
          </h2>

          <div className={`mt-10 grid items-center gap-12 lg:mt-12 lg:gap-20 ${owner.image ? 'lg:grid-cols-2' : ''}`}>

            {/* Image */}
            {owner.image && (
              <div>
                <figure className="relative">
                  {/* Accent corners */}
                  <span aria-hidden="true" className="absolute -left-2 -top-2 z-10 block h-8 w-8 border-l-2 border-t-2 border-accent" />
                  <div className="relative overflow-hidden border border-slate-200">
                    <SiteImage
                      src={owner.image}
                      alt={owner.name}
                      className="aspect-[4/3] w-full object-cover object-top lg:aspect-[4/5]"
                    />
                  </div>
                  <figcaption className="mt-4 border border-slate-200 bg-stone-50 px-5 py-4">
                    <h3 className="font-display text-base font-bold text-navy">{owner.name}</h3>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-accent">{owner.title}</p>
                  </figcaption>
                </figure>
              </div>
            )}

            {/* Copy */}
            <div>
              {!owner.image && (
                <div className="mb-6 border-l-2 border-accent pl-5">
                  <h3 className="font-display text-xl font-bold text-navy">{owner.name}</h3>
                  <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-accent">{owner.title}</p>
                </div>
              )}

              {owner.bio && (
                <div className="border-t border-slate-200 pt-7">
                  <p className="text-base sm:text-lg leading-relaxed text-slate-600 whitespace-pre-line max-w-2xl">
                    {owner.bio}
                  </p>
                </div>
              )}

              {owner.quote && (
                <blockquote className="mt-9 max-w-2xl border-l-2 border-accent pl-6 sm:pl-8">
                  <span aria-hidden="true" className="font-display text-4xl leading-none text-accent/15 select-none block">
                    &ldquo;
                  </span>
                  <p className="-mt-3 font-display text-xl font-bold leading-snug text-navy sm:text-2xl">
                    {owner.quote}
                  </p>
                  <footer className="mt-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {owner.name} &middot; {owner.title}
                  </footer>
                </blockquote>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
