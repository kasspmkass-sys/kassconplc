import { useState } from 'react';
import { mediaUrl } from '../api';

/**
 * Central image component for the whole site.
 * - Resolves stored references (absolute GridFS URLs, legacy /uploads/...,
 *   committed /media/...) through mediaUrl().
 * - When src is empty or load fails, renders nothing (empty state).
 * - Decorative images (alt="") get role="presentation" + aria-hidden.
 * - Optional `onError` lets a parent collapse its own wrapper (e.g. an
 *   aspect-ratio frame) so a failed image never leaves an empty grey box.
 */
export default function SiteImage({
  src,
  alt = '',
  className = '',
  style,
  onError,
  ...rest
}) {
  const [failed, setFailed] = useState(false);
  const url = mediaUrl(src);

  const isDecorative = alt === '';

  if (!url || failed) {
    return null;
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      role={isDecorative ? 'presentation' : undefined}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
      className={className}
      style={style}
      {...rest}
    />
  );
}
