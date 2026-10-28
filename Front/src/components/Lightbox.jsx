import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { mediaUrl } from '../api';

export default function Lightbox({ src, alt, onClose }) {
  const closeRef = useRef(null);
  const prevFocus = useRef(null);

  useEffect(() => {
    if (!src) return;
    prevFocus.current = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // Move focus into the dialog once open so tab/esc behave predictably.
    const t = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevFocus.current?.focus?.();
    };
  }, [src, onClose]);

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          role="dialog"
          aria-modal="true"
          aria-label={alt || 'Image preview'}
        >
          <button
            ref={closeRef}
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white/80 hover:text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80 rounded-md"
            aria-label="Close"
          >
            <X size={28} />
          </button>
          <motion.img
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.3 }}
            src={mediaUrl(src)}
            alt={alt || ''}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl select-none"
            onClick={(e) => e.stopPropagation()}
            /* If the full-size image fails, close rather than leaving the
               visitor staring at an empty black overlay. */
            onError={onClose}
            draggable={false}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
