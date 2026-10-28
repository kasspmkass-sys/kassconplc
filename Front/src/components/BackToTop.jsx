/**
 * BACK TO TOP — paired visually with FloatingActions FAB rail.
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      setVisible(y > 420);
      setProgress(Math.min(1, y / max));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  const ring = 2 * Math.PI * 18; /* r=18 in 44 viewBox */

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          initial={{ opacity: 0, y: 18, scale: 0.86 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.9 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: EASE }}
          whileHover={reduceMotion ? undefined : { scale: 1.06, y: -2 }}
          whileTap={reduceMotion ? undefined : { scale: 0.94 }}
          className="fab-btn fab-btn--top"
        >
          <svg className="fab-top-ring" viewBox="0 0 44 44" aria-hidden="true">
            <circle className="fab-top-ring-track" cx="22" cy="22" r="18" />
            <circle
              className="fab-top-ring-progress"
              cx="22"
              cy="22"
              r="18"
              style={{
                strokeDasharray: ring,
                strokeDashoffset: ring * (1 - progress),
              }}
            />
          </svg>
          <span className="fab-btn-glyph">
            <ArrowUp size={18} strokeWidth={2.5} />
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
