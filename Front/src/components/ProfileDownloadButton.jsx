/**
 * PROFILE DOWNLOAD BUTTON
 * Reusable across Navbar, Hero, ReadyCta, Footer, About.
 * Downloads the live auto-generated company profile PDF.
 */
import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { API_BASE } from '../api';

const YEAR = new Date().getFullYear();
const PDF_URL = `${API_BASE}/company-profile.pdf`;
const PDF_FILENAME = `KASCON_Company_Profile_${YEAR}.pdf`;

const STYLES = {
  default: 'btn-primary',
  hero: 'btn-hero-secondary',
  ghost: 'btn-ghost',
  white:
    'inline-flex items-center justify-center gap-2 rounded-md border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white hover:text-navy hover:border-white',
  link: 'text-sm font-semibold',
  accent: 'btn-accent',
};

export default function ProfileDownloadButton({
  variant = 'default',
  compact = false,
  className = '',
  label = 'Download company profile',
}) {
  const [status, setStatus] = useState('idle');

  const handleClick = async (e) => {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch(PDF_URL, { method: 'HEAD' });
      if (!res.ok) throw new Error('unavailable');
      setStatus('idle');
      const a = document.createElement('a');
      a.href = PDF_URL;
      a.download = PDF_FILENAME;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      setStatus('error');
      window.location.href = PDF_URL;
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const cls = `${STYLES[variant] || STYLES.default} ${className}`.trim();
  const text =
    status === 'loading' ? 'Preparing PDF…' : status === 'error' ? 'Download profile' : label;

  return (
    <a
      href={PDF_URL}
      download={PDF_FILENAME}
      onClick={handleClick}
      className={cls}
      aria-label="Download KASCON company profile PDF"
      title="Official KASCON company profile — generated from the latest verified content"
      aria-busy={status === 'loading'}
    >
      {status === 'loading' ? (
        <Loader2 size={15} className="animate-spin shrink-0" aria-hidden="true" />
      ) : (
        <FileDown size={15} className="shrink-0" aria-hidden="true" />
      )}
      {!compact && <span>{text}</span>}
      {compact && <span className="sr-only">{text}</span>}
    </a>
  );
}
