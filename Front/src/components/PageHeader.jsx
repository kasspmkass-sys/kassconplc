/**
 * PAGE HEADER — shared banner for all internal pages.
 * Strong contrast, accent rules, optional photo plate. Same prop API site-wide.
 */
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SiteImage from './SiteImage';

const FALLBACK_IMAGE = '/media/home/brand-2.jpg';

export default function PageHeader({
  kicker,
  title,
  lead,
  image,
  alt,
  backTo,
  backLabel,
}) {
  const plate = image || FALLBACK_IMAGE;
  const plateAlt = image ? alt || '' : '';

  return (
    <section className="page-header" aria-labelledby="page-header-title">
      <div className="page-header-visual" aria-hidden="true">
        <SiteImage
          src={plate}
          alt={plateAlt}
          className="page-header-photo"
          loading="eager"
        />
        <div className="page-header-scrim" />
        <div className="page-header-mesh" />
        <div className="page-header-blueprint" />
      </div>

      <span className="page-header-accent-bar" aria-hidden="true" />
      <span className="page-header-accent-line" aria-hidden="true" />

      <div className="page-header-inner container-pad">
        {backTo && backLabel && (
          <Link to={backTo} className="page-header-back">
            <ArrowLeft size={15} aria-hidden="true" />
            {backLabel}
          </Link>
        )}

        {kicker && (
          <p className="page-header-kicker">
            <span aria-hidden="true" />
            {kicker}
          </p>
        )}

        <h1 id="page-header-title" className="page-header-title">
          {title}
        </h1>

        {lead && <p className="page-header-lead">{lead}</p>}
      </div>
    </section>
  );
}
