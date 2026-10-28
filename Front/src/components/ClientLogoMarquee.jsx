/**
 * CLIENT LOGO MARQUEE
 * CMS-driven via /clients/public. Shows only approved client logos.
 * Section heading from settings.home.clients.label.
 * Autoplays on every breakpoint (mobile included) so the strip feels the same
 * on all devices; it pauses on hover, on keyboard focus and while a finger is
 * down on it. Respects prefers-reduced-motion.
 * Admin manages via /admin/clients.
 */
import { useEffect, useRef, useState } from 'react';
import api from '../api';
import SiteImage from './SiteImage';

/* Tile shell: lift + tinted frame on hover, press feedback on click/tap. */
const TILE_BASE = [
  'group/logo relative flex shrink-0 items-center justify-center',
  'h-14 w-24 sm:h-16 sm:w-32 md:h-20 md:w-40',
  'rounded-md border border-slate-200/80 bg-white',
  'transition-[transform,box-shadow,border-color] duration-500 ease-out-soft',
  'hover:-translate-y-1 hover:scale-[1.06] hover:border-brand/30',
  'hover:shadow-[0_18px_40px_-14px_rgba(13,48,161,0.45)]',
  'active:scale-[0.96]',
  'motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 motion-reduce:active:scale-100',
].join(' ');

const LINK_EXTRA =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:focus-visible:ring-0';

function LogoItem({ client, interactive = true }) {
  const [ripple, setRipple] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handlePointerDown = () => {
    if (!interactive) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    setRipple(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setRipple(false), 640);
  };

  const body = (
    <>
      {/* Tint wash behind the logo */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-md bg-gradient-to-br
          from-brand-soft via-white to-accent-light opacity-0
          transition-opacity duration-500 ease-out-soft group-hover/logo:opacity-100"
      />

      {/* Hairline that sweeps open from the centre on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-0 h-px origin-center scale-x-0
          bg-gradient-to-r from-transparent via-brand to-transparent
          transition-transform duration-500 ease-out-soft group-hover/logo:scale-x-100"
      />

      <SiteImage
        src={client.logo}
        alt=""
        className="relative z-10 max-h-[68%] max-w-[76%] object-contain
          opacity-100 grayscale-0 transition-[transform,opacity,filter] duration-500 ease-out-soft
          group-hover/logo:scale-110 group-hover/logo:opacity-100 group-hover/logo:grayscale-0
          motion-reduce:group-hover/logo:scale-100"
      />

      {/* Name reveal on hover / focus */}
      <span
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center
          rounded-md bg-gradient-to-t from-navy/92 via-navy/85 to-navy/70 px-2
          text-center text-[10px] font-semibold uppercase leading-tight tracking-[0.12em]
          text-blue opacity-0 translate-y-2 
          transition-all duration-500 ease-out-soft
          group-hover/logo:translate-y-0 group-hover/logo:opacity-100
          motion-reduce:translate-y-0"
      >
      
      </span>

      {/* Click / tap ripple */}
      {ripple && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-md border border-brand/60
            animate-logo-ripple"
        />
      )}
    </>
  );

  if (!interactive) {
    return (
      <span className={TILE_BASE} aria-hidden="true">
        {body}
      </span>
    );
  }

  if (client.website && /^https?:\/\//i.test(client.website)) {
    return (
      <a
        href={client.website}
        target="_blank"
        rel="noreferrer"
        aria-label={client.name}
        className={`${TILE_BASE} ${LINK_EXTRA}`}
        onPointerDown={handlePointerDown}
      >
        {body}
      </a>
    );
  }

  return (
    <span className={TILE_BASE} onPointerDown={handlePointerDown}>
      {body}
    </span>
  );
}

export default function ClientLogoMarquee({ settings, clients: clientsProp, loading: loadingProp }) {
  const passed = Array.isArray(clientsProp);
  const [local, setLocal] = useState([]);
  const [localLoading, setLocalLoading] = useState(!passed);
  const [stops, setStops] = useState({ hover: false, touch: false, focus: false });

  const lu = settings?.home?.clients || {};
  const label = lu.label || 'Trusted by leading organisations';

  useEffect(() => {
    if (passed) return undefined;
    let active = true;
    api.get('/clients/public')
      .then((r) => {
        if (active) setLocal((Array.isArray(r.data) ? r.data : []).filter((c) => c && c.logo));
      })
      .catch(() => { if (active) setLocal([]); })
      .finally(() => { if (active) setLocalLoading(false); });
    return () => { active = false; };
  }, [passed]);

  /* Pause the scroll on hover (mouse/pen), while touching, and while a
     keyboard user is inside the strip so the target can stay still. */
  const setStop = (key, value) =>
    setStops((s) => (s[key] === value ? s : { ...s, [key]: value }));

  const paused = stops.hover || stops.touch || stops.focus;

  const loading = passed ? Boolean(loadingProp) : localLoading;
  const clients = (passed ? clientsProp : local).filter((c) => c && c.logo);

  /* Reserve the strip's height while loading so the page does not jump,
     and drop it entirely only once we know there is nothing to show. */
  if (loading || clients.length === 0) {
    return loading ? (
      <section aria-busy="true" aria-label="Clients and partners" className="bg-white section-compact border-t border-slate-100">
        <div className="container-pad">
          <div className="mb-8 h-3 w-56 skeleton mx-auto" />
          <div className="flex gap-12 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-14 w-24 shrink-0 sm:h-16 sm:w-32 md:h-20 md:w-40" />
            ))}
          </div>
        </div>
      </section>
    ) : null;
  }

  const speed = Math.min(60, Math.max(26, clients.length * 6));

  const stripHandlers = {
    onPointerEnter: (e) => { if (e.pointerType !== 'touch') setStop('hover', true); },
    onPointerLeave: (e) => { if (e.pointerType !== 'touch') setStop('hover', false); },
    onPointerDown: () => setStop('touch', true),
    onPointerUp: () => setStop('touch', false),
    onPointerCancel: () => setStop('touch', false),
    onFocus: () => setStop('focus', true),
    onBlur: () => setStop('focus', false),
  };

  return (
    <section aria-labelledby="client-logos-heading" className="bg-white section-compact border-t border-slate-100">
      <div className="container-pad">
        {label && (
          <p
            id="client-logos-heading"
            className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-10"
          >
            {label}
          </p>
        )}
      </div>

      {/* Autoplay marquee — same behaviour on mobile and desktop */}
      <div
        {...stripHandlers}
        className="overflow-visible py-1
          [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]
          [-webkit-mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
      >
        <div
          className="flex w-max animate-logos-marquee will-change-transform motion-reduce:animate-none"
          style={{
            '--marquee-duration': `${speed}s`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          <div className="flex shrink-0 items-center gap-8 px-12 sm:gap-12">
            {clients.map((c, i) => (
              <LogoItem key={c._id || `c-${i}`} client={c} />
            ))}
          </div>
          {/* Duplicate strip is decorative: not reachable by keyboard or AT */}
          <div className="flex shrink-0 items-center gap-8 px-6 py-1 sm:gap-12" aria-hidden="true">
            {clients.map((c, i) => (
              <LogoItem key={`dup-${c._id || `c-${i}`}`} client={c} interactive={false} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}