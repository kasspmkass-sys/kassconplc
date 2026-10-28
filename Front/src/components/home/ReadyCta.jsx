/**
 * CORPORATE CTA — bottom-of-page call to action
 * Dark navy + blueprint texture. Two primary actions:
 *   1. Request a Quote  (→ /contact)
 *   2. Download Company Profile  (PDF)
 * CMS: settings.home.finalCta
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { FadeIn } from '../Motion';
import SiteImage from '../SiteImage';
import ProfileDownloadButton from '../ProfileDownloadButton';

export default function ReadyCta({ settings = {} }) {
  const finalCta    = settings?.home?.finalCta || {};
  const customTitle = finalCta.title      || '';
  const customText  = finalCta.text       || '';
  const customBtn   = finalCta.buttonText || '';
  const image       = settings?.homeVideoPoster || null;

  return (
    <section
      aria-labelledby="cta-heading"
      className="ready-cta relative overflow-hidden bg-navy py-10 text-white md:py-18"
    >
      {image && (
        <SiteImage
          src={image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-navy/88" />
      <div aria-hidden="true" className="absolute inset-0 hero-blueprint opacity-40" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-accent" />

      <div className="relative container-pad">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            {/* Eyebrow */}
            <div className="flex items-center justify-center gap-3 mb-5">
              <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent" id="cta-heading">
                {finalCta.kicker || 'Start a conversation'}
              </p>
              <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
            </div>

            <h2 className="editorial-title !text-white">
              {customTitle || 'Ready to work together?'}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-white/65">
              {customText || 'Talk to KASCON about your next construction project — from first enquiry to final handover.'}
            </p>

            {/* Primary CTAs */}
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link to="/contact" className="btn-hero-primary w-full sm:w-auto">
                {customBtn || 'Request a Consultation'} <ArrowRight size={15} />
              </Link>
              {settings?.phone && (
                <a
                  href={`tel:${settings.phone.replace(/[^+\d]/g, '')}`}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 px-4
                    text-sm font-semibold text-white/70 transition-colors hover:text-white
                    focus:outline-none focus-visible:ring-2 focus-visible:rounded focus-visible:ring-white/60 sm:w-auto"
                >
                  <Phone size={15} className="shrink-0 text-accent" aria-hidden="true" />
                  {settings.phone}
                </a>
              )}
            </div>

            {/* Secondary: company profile download */}
            <div className="mt-5 flex justify-center">
              <ProfileDownloadButton variant="white" />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
