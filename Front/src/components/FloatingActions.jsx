/**
 * FLOATING QUICK CONTACT — call / email / quote rail above BackToTop.
 * CMS: settings.phone(s), settings.email(s). Collapses on Escape, outside click, route change.
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MessageCircle, Phone, Mail, FileText, X } from 'lucide-react';
import { useSite } from '../context/SiteContext';

const firstOf = (...values) => {
  for (const v of values) {
    if (Array.isArray(v)) {
      const hit = v.find((x) => typeof x === 'string' && x.trim());
      if (hit) return hit.trim();
    } else if (typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }
  return '';
};

const EASE = [0.22, 1, 0.36, 1];

export default function FloatingActions() {
  const { settings, loading } = useSite();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const phone = firstOf(settings?.phones, settings?.phone);
  const email = firstOf(settings?.emails, settings?.email);
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null;
  const mailHref = email ? `mailto:${email}` : null;

  const actions = [
    telHref && { key: 'call', href: telHref, label: 'Call office', detail: phone, Icon: Phone },
    mailHref && { key: 'email', href: mailHref, label: 'Email us', detail: email, Icon: Mail },
    {
      key: 'quote',
      href: '/contact',
      label: 'Get a quote',
      detail: 'Request a quotation',
      Icon: FileText,
      primary: true,
    },
  ].filter(Boolean);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (loading || actions.length === 0) return null;

  const listVariants = {
    hidden: {},
    shown: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.06,
        delayChildren: reduceMotion ? 0 : 0.02,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: reduceMotion ? 0 : 14,
      x: reduceMotion ? 0 : 8,
      scale: reduceMotion ? 1 : 0.92,
    },
    shown: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: { duration: reduceMotion ? 0.01 : 0.28, ease: EASE },
    },
  };

  return (
    <div ref={wrapRef} className="fab-rail">
      <AnimatePresence>
        {open && (
          <motion.ul
            key="actions"
            initial="hidden"
            animate="shown"
            exit="hidden"
            variants={listVariants}
            className="fab-rail-list"
          >
            {actions.map(({ key, href, label, detail, Icon, primary }) => {
              const inner = (
                <>
                  <span className="fab-chip-copy">
                    <span className="fab-chip-label">{label}</span>
                    {detail && detail !== label && (
                      <span className="fab-chip-detail">{detail}</span>
                    )}
                  </span>
                  <span className={`fab-chip-icon${primary ? ' is-primary' : ''}`}>
                    <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                </>
              );

              const cls = `fab-chip${primary ? ' is-primary' : ''}`;

              return (
                <motion.li key={key} variants={itemVariants} className="fab-rail-item">
                  {href.startsWith('/') ? (
                    <Link to={href} onClick={() => setOpen(false)} className={cls}>
                      {inner}
                    </Link>
                  ) : (
                    <a href={href} onClick={() => setOpen(false)} className={cls}>
                      {inner}
                    </a>
                  )}
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={
          open
            ? 'Close quick contact'
            : 'Quick contact: call, email or request a quotation'
        }
        className={`fab-btn fab-btn--contact${open ? ' is-open' : ''}`}
        whileHover={reduceMotion ? undefined : { scale: 1.06 }}
        whileTap={reduceMotion ? undefined : { scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      >
        {!open && <span className="fab-btn-pulse" aria-hidden="true" />}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              className="fab-btn-glyph"
              initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.18, ease: EASE }}
            >
              <X size={20} strokeWidth={2.4} />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              className="fab-btn-glyph"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.18, ease: EASE }}
            >
              <MessageCircle size={20} strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
