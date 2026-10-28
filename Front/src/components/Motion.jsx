import { Children, useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    const id = hash ? hash.slice(1) : null;
    // Hash links (e.g. /about#company) should smooth-scroll to the section
    // once the new page has mounted (retry until the element appears).
    if (id) {
      let attempts = 0;
      const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const timer = setInterval(() => {
        const el = document.getElementById(id);
        if (el) {
          clearInterval(timer);
          el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        } else if (++attempts > 10) {
          clearInterval(timer);
          /* Never fail silently: surface the broken anchor for debugging and
             land the visitor at the top of the page rather than leaving them
             at whatever scroll depth they arrived with. */
          // eslint-disable-next-line no-console
          console.warn(
            `[ScrollToTop] anchor "#${id}" not found on ${window.location.pathname}`
          );
          window.scrollTo({ top: 0, behavior: 'auto' });
        }
      }, 120);
      return () => clearInterval(timer);
    }
    // Regular navigations must land at the very top instantly - the global
    // `scroll-behavior: smooth` would otherwise animate from the old depth.
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    html.style.scrollBehavior = prev;
  }, [pathname, hash, key]);
  return null;
}

export function FadeIn({ children, delay = 0, y = 24, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger children into view. Uses `animate` (not only whileInView) so items
 * that mount after an async fetch still become visible when the section is on screen.
 */
export function Stagger({ children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.08 });
  const childCount = Children.count(children);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (childCount > 0) setReady(true);
  }, [childCount]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView && ready ? 'show' : 'hidden'}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function SectionHeader({ kicker, title, subtitle, light = false }) {
  return (
    <FadeIn className="max-w-2xl mb-10 md:mb-14">
      {kicker && <p className={`section-kicker mb-3 ${light ? 'text-accent-muted' : ''}`}>{kicker}</p>}
      <h2 className={`section-title ${light ? 'text-white' : ''}`}>{title}</h2>
      {subtitle && (
        <p className={`mt-4 text-base md:text-lg leading-relaxed ${light ? 'text-white/75' : 'text-slate-500'}`}>
          {subtitle}
        </p>
      )}
    </FadeIn>
  );
}
