/**
 * HERO — cinematic full-bleed stage.
 * Copy paints immediately from defaults; CMS values swap in when ready.
 * KPIs live in StatsBand below so the photograph stays uncluttered.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { mediaUrl } from '../api';
import SiteImage from './SiteImage';
import HeroBackdrop from './HeroBackdrop';
// Committed snapshot: used as initial copy state so React's first render
// outputs real headline/supporting text rather than skeleton bars.
// The CMS values from /settings/public replace these once they resolve.
import snapshot from '../data/site-snapshot.json';

const INTERVAL_MS = 7000;
const MIN_INTERVAL_MS = 2000;
const SWIPE_THRESHOLD_PX = 40;

const PRIMARY_CTA = { to: '/projects', label: 'View projects' };
const SECONDARY_CTA = { to: '/contact', label: 'Request a consultation' };

const DEFAULT_SLIDE_ALT =
  'Construction and infrastructure project photography from Kassa & Sons Construction PLC';
const DEFAULT_HEADLINE = 'The Result Of Unity';
const DEFAULT_SUPPORTING =
  'Grade-1 general contractor delivering building, civil, energy and infrastructure works across Ethiopia — disciplined programme, owned plant, documented quality.';
const DEFAULT_EYEBROW = 'Grade-1 General Contractor · Addis Ababa';

const pad = (n) => String(n).padStart(2, '0');

export default function HeroSlider() {
  const { settings, loading, failed } = useSite();

  const hero = settings?.hero || {};
  const slides = useMemo(
    () => (Array.isArray(settings?.heroSlides) ? settings.heroSlides : []).filter((src) => mediaUrl(src)),
    [settings]
  );

  const intervalMs =
    Number(hero.slideInterval) > MIN_INTERVAL_MS ? Number(hero.slideInterval) : INTERVAL_MS;
  const defaultSlideAlt = hero.defaultSlideAlt || DEFAULT_SLIDE_ALT;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);

  const count = slides.length;
  const hasSlider = count > 1;
  const current = count > 0 ? slides[Math.min(index, count - 1)] : null;

  useEffect(() => {
    setIndex((i) => (count > 0 ? Math.min(i, count - 1) : 0));
  }, [count]);

  const go = useCallback(
    (dir) => setIndex((i) => (i + dir + count) % count),
    [count]
  );

  const isPaused = paused || focusWithin;

  useEffect(() => {
    if (!hasSlider || isPaused) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [count, hasSlider, isPaused, intervalMs]);

  useEffect(() => {
    if (count < 2) return undefined;
    const next = mediaUrl(slides[(index + 1) % count]);
    if (!next) return undefined;
    const img = new Image();
    img.src = next;
    return undefined;
  }, [count, index, slides]);

  const onKeyDown = useCallback(
    (e) => {
      if (!hasSlider) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      }
    },
    [go, hasSlider]
  );

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e) => {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    const dx = touchDeltaX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX && count > 1) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  /* Snapshot values serve as the initial copy state so React's first render
     already outputs the real headline/supporting text.  The CMS values from
     /settings/public swap in once they resolve (copyReady === true), which
     produces no visible flash because the text is the same or an intended
     update.  The skeleton is only shown when the snapshot itself is absent
     (null snapshot — should never happen with a committed snapshot file). */
  const snapshotHeadline   = snapshot?.heroHeadline   || null;
  const snapshotSubline = snapshot?.heroSubline || null;

  const eyebrow   = settings?.heroEyebrow || settings?.companyName || DEFAULT_EYEBROW;
  const headline  = settings?.headline    || snapshotHeadline      || DEFAULT_HEADLINE;
  const supporting = settings?.heroSupporting || snapshotSubline || DEFAULT_SUPPORTING;

  /* copyReady: the text above already has real content from the snapshot,
     so we no longer need to hide it behind a skeleton while the API is in
     flight.  The skeleton is shown only when we have neither a resolved API
     response nor a snapshot value (i.e. snapshot is null and still loading). */
  const hasSnapshotCopy = Boolean(snapshotHeadline);
  const copyReady = hasSnapshotCopy || !loading;

  const visible = useMemo(() => {
    if (count === 0) return [];
    const set = new Set([index]);
    if (count > 1) {
      set.add((index + 1) % count);
      set.add((index - 1 + count) % count);
    }
    return [...set];
  }, [count, index]);

  return (
    <section
      aria-label="Company introduction"
      className="hero-slider hero-stage"
      data-empty={current ? undefined : 'true'}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setFocusWithin(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocusWithin(false);
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="hero-shell">
        <div className="hero-visual" aria-hidden="true">
          <HeroBackdrop />
          {visible.map((i) => (
            <div
              key={`${slides[i]}-${i}`}
              className={`hero-media${i === index ? ' is-active' : ''}`}
            >
              <SiteImage
                src={slides[i]}
                alt=""
                className="h-full w-full object-cover object-[center_42%]"
                draggable={false}
                /* The active slide is the one the visitor is actually looking
                   at, and it cross-fades in over HeroBackdrop. Deferring it is
                   what left the backdrop on screen well past its welcome. The
                   neighbours stay lazy — they are preloaded by the effect above
                   only once the visitor is likely to reach them. */
                loading={i === index ? 'eager' : 'lazy'}
                fetchPriority={i === index ? 'high' : 'low'}
              />
            </div>
          ))}
          <div className="hero-scrim" />
          <div className="hero-vignette" />
          <div className="hero-blueprint-fine absolute inset-0 hidden lg:block opacity-50" />
        </div>

        <div className="hero-content">
          <div className="hero-copy">
            {copyReady ? (
              <>
                <p className="hero-eyebrow">{eyebrow}</p>
                <h1 className="hero-title">{headline}</h1>
                <p className="hero-lead">{supporting}</p>
              </>
            ) : (
              /* aria-hidden: this is decorative. Announcing placeholder bars to
                 a screen reader, then the real copy a moment later, is worse
                 than silence.
                 This skeleton only renders if the snapshot is missing (no
                 committed snapshot file) AND the API has not resolved yet. */
              <div className="hero-skeleton" aria-hidden="true">
                <span className="hero-skeleton-line hero-skeleton-eyebrow" />
                <span className="hero-skeleton-line hero-skeleton-title" />
                <span className="hero-skeleton-line hero-skeleton-lead" />
                <span className="hero-skeleton-line hero-skeleton-lead hero-skeleton-lead-short" />
              </div>
            )}
            <div className="hero-cta">
              <Link to={PRIMARY_CTA.to} className="btn-hero-primary touch-manipulation">
                {PRIMARY_CTA.label} <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link to={SECONDARY_CTA.to} className="btn-hero-secondary touch-manipulation">
                <span className="sm:hidden">Get a consultation</span>
                <span className="hidden sm:inline">{SECONDARY_CTA.label}</span>
              </Link>
            </div>
          </div>
        </div>

        {hasSlider ? (
          <div className="hero-controls">
            <div className="hero-controls-row">
              <p className="hero-controls-count" aria-live="polite">
                <span className="hero-counter">{pad(index + 1)}</span>
                <span aria-hidden="true" className="hero-controls-rule" />
                <span className="hero-counter hero-counter--muted">{pad(count)}</span>
              </p>

              <div className="hero-controls-arrows">
                <button type="button" onClick={() => go(-1)} aria-label="Previous slide" className="hero-arrow touch-manipulation">
                  <ChevronLeft size={17} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Next slide" className="hero-arrow touch-manipulation">
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="hero-track" role="group" aria-label="Hero slides">
              {slides.map((src, i) => {
                const active = i === index;
                return (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    aria-label={`Show slide ${i + 1} of ${count}`}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => setIndex(i)}
                    data-active={active}
                    className="hero-seg"
                  >
                    {active && (
                      <span
                        key={`fill-${index}`}
                        aria-hidden="true"
                        className="hero-seg-fill"
                        style={{
                          animationDuration: `${intervalMs}ms`,
                          animationPlayState: isPaused ? 'paused' : 'running',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="hero-controls hero-controls-empty" aria-hidden="true" />
        )}
      </div>

      <span className="sr-only" aria-live="polite">
        {current ? defaultSlideAlt : ''}
      </span>
    </section>
  );
}
