import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FadeIn } from './Motion';

export default function PageCta({
  kicker = 'Work with us',
  title = 'Ready to discuss your project?',
  text,
  to = '/contact',
  label = 'Request a consultation',
  secondaryTo,
  secondaryLabel,
  variant = 'dark',
}) {
  const dark = variant === 'dark';

  return (
    <section
      className={
        dark
          ? 'relative overflow-hidden bg-navy text-white section-compact'
          : 'bg-white section-compact border-t-2 border-accent'
      }
    >
      {dark && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hero-blueprint opacity-20" />
      )}
      <div className="container-pad relative">
        <FadeIn className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            {kicker && (
              <p
                className={`mb-2 text-[11px] font-bold uppercase tracking-[0.22em] ${
                  dark ? 'text-accent' : 'text-accent'
                }`}
              >
                {kicker}
              </p>
            )}
            <h2
              className={`font-display text-2xl font-bold tracking-tight sm:text-3xl ${
                dark ? 'text-white' : 'text-navy'
              }`}
            >
              {title}
            </h2>
            {text && (
              <p className={`mt-3 max-w-xl text-sm leading-relaxed sm:text-base ${dark ? 'text-white/60' : 'text-slate-500'}`}>
                {text}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
            <Link to={to} className={dark ? 'btn-hero-primary' : 'btn-primary'}>
              {label} <ArrowRight size={15} aria-hidden="true" />
            </Link>
            {secondaryTo && secondaryLabel && (
              <Link
                to={secondaryTo}
                className={
                  dark
                    ? 'inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white/70 transition-colors hover:text-white'
                    : 'btn-ghost'
                }
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
