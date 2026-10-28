import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import { useSEO, useNoindex } from '../useSEO';
import { useSite } from '../context/SiteContext';

export default function NotFound() {
  const { settings } = useSite();
  const notFoundPage = settings?.notFoundPage || {};
  const title = notFoundPage.title || 'Page not found';
  const body = notFoundPage.body || 'The page you requested does not exist or has moved.';
  const ctaLabel = notFoundPage.ctaLabel || 'Back to home';

  useSEO('Page Not Found', 'The page you requested could not be found on the Kassa & Sons construction website.', 'notFound');
  useNoindex();

  return (
    <section className="relative isolate overflow-hidden bg-navy-900 min-h-[70vh] flex items-center">
      <div aria-hidden="true" className="absolute inset-0 hero-blueprint-fine opacity-40" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />
      <div className="container-pad relative py-32 text-center">
        <p className="font-display text-6xl sm:text-8xl font-bold text-white/10 tabular-nums">404</p>
        <div className="flex items-center justify-center gap-3 mt-2 mb-5">
          <span aria-hidden="true" className="h-0.5 w-8 bg-accent" />
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Unavailable</p>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">{title}</h1>
        <p className="mt-4 text-white/60 max-w-md mx-auto leading-relaxed">{body}</p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="btn-hero-primary">
            {ctaLabel} <ArrowRight size={16} />
          </Link>
          <Link to="/contact" className="btn-hero-secondary">
            <Compass size={15} aria-hidden="true" /> Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
