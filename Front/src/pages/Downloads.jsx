/**
 * DOWNLOADS — Company profile (priority) + document library.
 * Featured profile showcase for enterprise clients; supporting docs below.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  FileDown,
  ExternalLink,
  FileText,
  CheckCircle2,
  Shield,
  Building2,
  Layers,
  Users,
  Loader2,
} from 'lucide-react';
import api, { API_BASE } from '../api';
import { useSite } from '../context/SiteContext';
import { useSEO } from '../useSEO';
import { FadeIn, Stagger, item } from '../components/Motion';
import { motion } from 'framer-motion';
import SiteImage from '../components/SiteImage';
import PageHeader from '../components/PageHeader';
import PageCta from '../components/PageCta';

const YEAR = new Date().getFullYear();
const PDF_URL = `${API_BASE}/company-profile.pdf`;
const PDF_FILENAME = `KASCON_Company_Profile_${YEAR}.pdf`;

const TYPE_LABELS = {
  'company-profile': 'Company Profile',
  'capability-statement': 'Capability Statement',
  'equipment-list': 'Equipment List',
  'ready-mix-brochure': 'Ready-Mix Brochure',
  'project-portfolio': 'Project Portfolio',
  certificate: 'Certificate',
  other: 'Document',
};

const TYPE_ORDER = [
  'company-profile',
  'capability-statement',
  'equipment-list',
  'ready-mix-brochure',
  'project-portfolio',
  'certificate',
  'other',
];

const PROFILE_INCLUDES = [
  { icon: Building2, label: 'Company overview & licence' },
  { icon: Layers, label: 'Services & owned plant' },
  { icon: Shield, label: 'HSEQ systems' },
  { icon: Users, label: 'Leadership & key projects' },
];

function useProfileDownload(url = PDF_URL, filename = PDF_FILENAME) {
  const [status, setStatus] = useState('idle');

  const download = async () => {
    if (status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (!res.ok) throw new Error('unavailable');
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setStatus('idle');
    } catch {
      setStatus('error');
      window.location.href = url;
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return { status, download };
}

function ProfileCover({ companyName, grade, founded }) {
  return (
    <div className="profile-cover" aria-hidden="true">
      <div className="profile-cover-top">
        <span className="profile-cover-mark">KS</span>
        <span className="profile-cover-year">{YEAR}</span>
      </div>
      <div className="profile-cover-body">
        <p className="profile-cover-eyebrow">Official dossier</p>
        <p className="profile-cover-title">Company Profile</p>
        <p className="profile-cover-name">{companyName}</p>
        <div className="profile-cover-meta">
          <span>{grade}</span>
          <span>Est. {founded}</span>
        </div>
      </div>
      <div className="profile-cover-foot">
        <span>PDF</span>
        <span>Live from CMS</span>
      </div>
    </div>
  );
}

export default function Downloads() {
  const { settings } = useSite();
  const pg = settings?.downloadsPage || {};
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const companyName = settings?.companyName || 'Kassa & Sons Construction PLC';
  const grade = settings?.grade || 'Grade-1 General Contractor';
  const founded = settings?.foundedYear || '1980';
  const capital = settings?.capital || '';
  const years = settings?.yearsExperience || '46+';
  const projects = settings?.projectCount || '2000+';

  const heroKicker = pg.heroKicker || 'Resources';
  const heroTitle = pg.heroTitle || 'Company profile & documents.';
  const heroLead =
    pg.heroLead ||
    'Download the official KASCON company profile and supporting capability documents for tenders, partners and clients.';
  const emptyState =
    pg.emptyState || 'No additional documents available yet. Please check back shortly.';
  const downloadLabel = pg.downloadLabel || 'Download';
  const viewLabel = pg.viewLabel || 'Preview';

  useSEO(
    'Company Profile & Downloads',
    'Download the official KASCON company profile PDF and supporting construction documents.',
    'downloads'
  );

  useEffect(() => {
    setLoading(true);
    api
      .get('/documents/public')
      .then((r) => setDocs(r.data || []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  const cmsProfile = useMemo(
    () => docs.find((d) => d.type === 'company-profile') || null,
    [docs]
  );

  const profileHref = cmsProfile?.fileUrl || PDF_URL;
  const { status, download } = useProfileDownload(profileHref, PDF_FILENAME);

  const libraryDocs = useMemo(() => {
    const rest = docs.filter((d) => d.type !== 'company-profile');
    return filter === 'All' ? rest : rest.filter((d) => d.type === filter);
  }, [docs, filter]);

  const activeTypes = useMemo(() => {
    const allRest = docs.filter((d) => d.type !== 'company-profile');
    const allTypes = new Set(allRest.map((d) => d.type).filter(Boolean));
    return ['All', ...TYPE_ORDER.filter((t) => allTypes.has(t))];
  }, [docs]);

  const profileTitle =
    cmsProfile?.title || `${companyName} — Company Profile`;
  const profileDescription =
    cmsProfile?.description ||
    'A concise, board-ready overview of KASCON — licence standing, delivery capability, plant, HSEQ systems, leadership and selected project references. Prepared for clients, consultants and tender packages.';

  const isGenerated = !cmsProfile || cmsProfile.generated;

  return (
    <div className="downloads-page">
      <PageHeader kicker={heroKicker} title={heroTitle} lead={heroLead} />

      {/* ── Featured company profile ─────────────────────────── */}
      <section className="profile-showcase section" aria-labelledby="profile-showcase-title">
        <div className="container-pad">
          <FadeIn>
            <div className="profile-showcase-panel">
              <div className="profile-showcase-visual">
                {cmsProfile?.thumbnail ? (
                  <figure className="profile-showcase-thumb">
                    <SiteImage
                      src={cmsProfile.thumbnail}
                      alt={`${profileTitle} cover`}
                      className="h-full w-full object-cover"
                    />
                  </figure>
                ) : (
                  <ProfileCover
                    companyName={companyName}
                    grade={grade}
                    founded={founded}
                  />
                )}
              </div>

              <div className="profile-showcase-copy">
                <div className="profile-showcase-badges">
                  <span className="profile-badge profile-badge--accent">Priority document</span>
                  <span className="profile-badge">PDF</span>
                  {isGenerated && <span className="profile-badge profile-badge--live">Live</span>}
                </div>

                <p className="profile-showcase-kicker">Official company profile</p>
                <h2 id="profile-showcase-title" className="profile-showcase-title">
                  {profileTitle}
                </h2>
                <p className="profile-showcase-lead">{profileDescription}</p>

                <dl className="profile-showcase-facts">
                  <div>
                    <dt>Licence</dt>
                    <dd>{grade}</dd>
                  </div>
                  <div>
                    <dt>Experience</dt>
                    <dd>{years} years</dd>
                  </div>
                  <div>
                    <dt>Projects</dt>
                    <dd>{projects}</dd>
                  </div>
                  {capital && (
                    <div>
                      <dt>Capital</dt>
                      <dd>{capital}</dd>
                    </div>
                  )}
                </dl>

                <ul className="profile-showcase-includes">
                  {PROFILE_INCLUDES.map(({ icon: Icon, label }) => (
                    <li key={label}>
                      <Icon size={15} aria-hidden="true" />
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>

                <div className="profile-showcase-actions">
                  <button
                    type="button"
                    onClick={download}
                    className="btn-primary profile-dl-btn"
                    aria-busy={status === 'loading'}
                    aria-label="Download company profile PDF"
                  >
                    {status === 'loading' ? (
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <FileDown size={16} aria-hidden="true" />
                    )}
                    {status === 'loading' ? 'Preparing PDF…' : 'Download company profile'}
                  </button>
                  <a
                    href={profileHref}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost profile-view-btn"
                  >
                    <ExternalLink size={15} aria-hidden="true" />
                    {viewLabel} in browser
                  </a>
                </div>

                <p className="profile-showcase-note">
                  <CheckCircle2 size={14} aria-hidden="true" />
                  Generated from verified website content · Updated for {YEAR} engagements
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Supporting library ───────────────────────────────── */}
      <section className="section bg-slate-50" aria-labelledby="docs-library-title">
        <div className="container-pad">
          <FadeIn className="docs-library-head">
            <div>
              <p className="editorial-eyebrow mb-3">Document library</p>
              <h2 id="docs-library-title" className="editorial-title docs-library-title">
                Supporting <span className="text-accent">resources.</span>
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
                Capability statements, certificates and brochures for tenders and technical reviews.
              </p>
            </div>
          </FadeIn>

          {activeTypes.length > 2 && (
            <div className="docs-filters" role="tablist" aria-label="Filter documents by type">
              {activeTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={filter === t}
                  onClick={() => setFilter(t)}
                  className={`docs-filter${filter === t ? ' is-active' : ''}`}
                >
                  {t === 'All' ? 'All documents' : TYPE_LABELS[t] || t}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="docs-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="docs-card docs-card--skeleton">
                  <div className="skeleton h-12 w-12" />
                  <div className="skeleton mt-4 h-5 w-3/4" />
                  <div className="skeleton mt-2 h-3 w-full" />
                  <div className="skeleton mt-6 h-9 w-28" />
                </div>
              ))}
            </div>
          ) : libraryDocs.length === 0 ? (
            <div className="docs-empty">
              <FileText size={28} aria-hidden="true" />
              <p>{emptyState}</p>
            </div>
          ) : (
            <Stagger className="docs-grid">
              {libraryDocs.map((doc) => (
                <motion.article key={doc._id} variants={item} className="docs-card">
                  <div className="docs-card-accent" aria-hidden="true" />
                  {doc.thumbnail ? (
                    <div className="docs-card-thumb">
                      <SiteImage
                        src={doc.thumbnail}
                        alt={doc.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="docs-card-icon" aria-hidden="true">
                      <FileText size={22} />
                    </div>
                  )}

                  <div className="docs-card-meta">
                    <span>{TYPE_LABELS[doc.type] || doc.type}</span>
                    {doc.fileType && <span>{doc.fileType}</span>}
                  </div>

                  <h3>{doc.title}</h3>
                  {doc.description && <p>{doc.description}</p>}
                  {(doc.fileSize || doc.version) && (
                    <p className="docs-card-size">
                      {[doc.fileSize, doc.version ? `v${doc.version}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}

                  <div className="docs-card-actions">
                    <a
                      href={doc.fileUrl}
                      download
                      className="btn-primary btn-sm"
                      aria-label={`Download ${doc.title}`}
                    >
                      <FileDown size={13} aria-hidden="true" /> {downloadLabel}
                    </a>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost btn-sm"
                      aria-label={`View ${doc.title}`}
                    >
                      <ExternalLink size={13} aria-hidden="true" /> {viewLabel}
                    </a>
                  </div>
                </motion.article>
              ))}
            </Stagger>
          )}
        </div>
      </section>

      <PageCta
        kicker="Need something specific"
        title="Request a tailored package"
        text="Ask for capability statements, certificates or project references prepared for your tender."
        label="Contact KASCON"
      />
    </div>
  );
}
