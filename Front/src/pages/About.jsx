/**
 * ABOUT — company profile page.
 * Modern section rhythm, CMS-driven copy, responsive from scratch.
 * Anchors: #company #history #approach #digital #erp #experience #values #owners #testimonials
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Briefcase,
  Building,
  Fuel,
  Hammer,
  Trees,
  Layers,
  Route,
  Settings2,
  Forklift,
  Factory,
  Wrench,
  TrendingUp,
  FileSpreadsheet,
  Shield,
  CheckCircle,
  LayoutDashboard,
  BarChart3,
  Database,
  Users,
  Eye,
  Target,
  GraduationCap,
  ChevronDown,
} from 'lucide-react';
import api from '../api';
import { useSite } from '../context/SiteContext';
import { useSEO } from '../useSEO';
import SiteImage from '../components/SiteImage';
import ClientLogoMarquee from '../components/ClientLogoMarquee';
import { FadeIn, Stagger, item } from '../components/Motion';
import { motion } from 'framer-motion';
import ProfileDownloadButton from '../components/ProfileDownloadButton';
import PageHeader from '../components/PageHeader';
import PageCta from '../components/PageCta';
import SectionHeading from '../components/SectionHeading';

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

const POSITION_POINTS = [
  'Grade-1 General Contractor with 46+ years of delivery',
  'Building construction, civil engineering & infrastructure works',
  'Fuel stations, petroleum depots, tank works & aviation infrastructure',
  'Roads, earthworks, drainage & industrial maintenance',
];

const APPROACH_PILLARS = [
  {
    title: 'Programme & Planning',
    description:
      'Structured scheduling and mobilisation from pre-construction through handover, with milestone tracking aligned to client programmes.',
    icon: TrendingUp,
  },
  {
    title: 'Cost & Quantity Control',
    description:
      'Quantity surveying, cost reporting and BOQ reconciliation on Class-One standards to keep budget certainty across phases.',
    icon: FileSpreadsheet,
  },
  {
    title: 'HSEQ Supervision',
    description:
      'Health, Safety, Environment and Quality systems on every site, with documented compliance and workforce training.',
    icon: Shield,
  },
  {
    title: 'Logistics & Site Control',
    description:
      'Plant, materials and labour mobilisation with senior engineers and foremen accountable for site operations.',
    icon: CheckCircle,
  },
];

const CAPABILITIES = [
  {
    id: 'concrete-batching',
    icon: Settings2,
    title: 'Concrete Batching Plant',
    desc: 'Industrial ready-mix supporting building and energy projects with typical grades C-20 to C-30.',
  },
  {
    id: 'stone-crushing',
    icon: Layers,
    title: 'Stone Crushing Plant',
    desc: 'Quarry and aggregate production — primary crushing, screening and dispatch.',
  },
  {
    id: 'steel-fabrication',
    icon: Wrench,
    title: 'Steel Fabrication',
    desc: 'Structural frames, canopies, shop and site welding aligned to EBCS / AISC practice.',
  },
  {
    id: 'fleet-auto-shop',
    icon: Forklift,
    title: 'Fleet & Auto Shop',
    desc: 'Owned mixers, loaders, dump trucks and in-house preventive maintenance.',
  },
];

const DIGITAL_POINTS = [
  'Integrated project scheduling across all active sites',
  'Cost reporting and quantity tracking from field to management',
  'HSEQ compliance records with digital sign-off workflows',
  'Material and inventory tracking linked to project codes',
  'Photo documentation and progress reporting at site level',
];

const SERVICE_ICONS = {
  building: Building2,
  fuel: Fuel,
  steel: Hammer,
  wood: Trees,
  quarry: Layers,
  management: Settings2,
  crane: Forklift,
  road: Route,
  mixer: Factory,
  realestate: Building,
};

const ERP_MODULES = [
  { label: 'Projects', icon: LayoutDashboard },
  { label: 'Cost Control', icon: BarChart3 },
  { label: 'Fleet & Plant', icon: Forklift },
  { label: 'Inventory', icon: Database },
  { label: 'Workforce', icon: Users },
  { label: 'HSEQ', icon: Shield },
];

const ERP_FLOW = [
  { label: 'Field data', note: 'Progress, quantities, plant & inventory captured at site' },
  { label: 'Integrated ERP', note: 'One platform linking projects, cost, fleet, inventory, workforce & HSEQ' },
  { label: 'Management reporting', note: 'Real-time visibility for leadership across every active site' },
];

const LEGACY = {
  heroKicker: 'About Kascon',
  heroTitle: 'Building Ethiopia with integrity since 1980.',
  companyKicker: 'Our company',
  companyTitle: 'Multidisciplinary Grade-1 contractor',
  timelineKicker: 'Timeline',
  valuesKicker: 'Values',
  leadershipKicker: 'Leadership',
};

const pick = (cms, legacy, redesign) => (cms && cms !== legacy ? cms : redesign);

const STORY_COLLAPSED_PX = 168; /* ~6 lines of editorial lead */

function ReadMoreText({ text, className = '' }) {
  const bodyRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [fullHeight, setFullHeight] = useState(STORY_COLLAPSED_PX);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return undefined;

    const measure = () => {
      const full = el.scrollHeight;
      setFullHeight(full);
      setOverflows(full > STORY_COLLAPSED_PX + 8);
    };

    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [text]);

  return (
    <div className={`about-readmore ${open ? 'is-open' : ''} ${className}`.trim()}>
      <div
        ref={bodyRef}
        id="about-story-text"
        className="about-readmore-body editorial-lead whitespace-pre-line"
        style={{ maxHeight: open || !overflows ? fullHeight : STORY_COLLAPSED_PX }}
      >
        {text}
      </div>
      {overflows && (
        <button
          type="button"
          className="about-readmore-btn"
          aria-expanded={open}
          aria-controls="about-story-text"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Read less' : 'Read more'}
          <ChevronDown size={15} aria-hidden="true" className="about-readmore-chevron" />
        </button>
      )}
    </div>
  );
}

const accentTitle = (title, accentShare = true) => {
  if (!title || typeof title !== 'string') return title;
  if (!accentShare) return title;
  const parts = title.split(/,\s*/);
  if (parts.length < 2) {
    const words = title.trim().split(/\s+/);
    if (words.length < 3) return title;
    const cut = Math.max(2, Math.floor(words.length * 0.55));
    return (
      <>
        {words.slice(0, cut).join(' ')}{' '}
        <span className="text-accent">{words.slice(cut).join(' ')}</span>
      </>
    );
  }
  return parts.map((part, i) =>
    i === parts.length - 1 ? (
      <span key="a" className="text-accent">
        {i > 0 ? ' ' : ''}
        {part}
      </span>
    ) : (
      <span key={i}>
        {part}
        {i < parts.length - 2 ? ', ' : ','}
      </span>
    )
  );
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function About() {
  const { settings } = useSite();
  const about = settings?.about || {};

  const [team, setTeam] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [awards, setAwards] = useState([]);
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  const companyName = settings?.companyName || 'Kassa & Sons Construction PLC';
  const foundedYear = settings?.foundedYear || '1980';

  const aboutApproach = about.approach || {};
  const aboutCapabilities = about.capabilities || {};
  const aboutDigital = about.digital || {};
  const aboutErp = about.erp || {};
  const aboutExperience = about.experience || {};
  const aboutTestimonials = about.testimonials || {};
  const aboutCta = about.cta || {};
  const aboutSpecializations = about.specializations || {};
  const aboutLeadership = about.leadership || {};
  const aboutValues = about.values || {};
  const aboutTimeline = about.timeline || {};

  const keyFactLabels = Array.isArray(aboutSpecializations.keyFactLabels)
    ? aboutSpecializations.keyFactLabels.filter(Boolean)
    : [];

  const keyFacts = useMemo(
    () =>
      [
        { label: 'Established', value: foundedYear },
        { label: 'Licence', value: settings?.grade || 'Grade-1' },
        { label: 'Experience', value: settings?.yearsExperience || '46+' },
        { label: 'Specialists', value: settings?.specialists || '108' },
        { label: 'Capital', value: settings?.capital || 'ETB 25.5M' },
        { label: 'Projects', value: settings?.projectCount || '2000+' },
      ]
        .filter((f) => f.value)
        .map((f, i) => (keyFactLabels[i] ? { ...f, label: keyFactLabels[i] } : f)),
    [foundedYear, settings, keyFactLabels]
  );

  const heroKicker = pick(about.hero?.kicker, LEGACY.heroKicker, 'ABOUT KASSA & SONS');
  const heroTitle = pick(
    about.hero?.title,
    LEGACY.heroTitle,
    'Building Ethiopia’s Future With Experience and Innovation'
  );
  const companyKicker = pick(about.company?.kicker, LEGACY.companyKicker, 'Who we are');
  const companyTitle = pick(
    about.company?.title,
    LEGACY.companyTitle,
    'An established Ethiopian contractor, built on decades of delivery.'
  );
  const companyCta1 = about.company?.companyCta1 || 'Explore our services';
  const companyCta2 = about.company?.companyCta2 || 'View our projects';

  /* Always resolve story imagery — CMS first, then committed media. */
  const companyImagePrimary =
    about.company?.aboutImage ||
    settings?.home?.about?.image ||
    settings?.whoWeAreImage ||
    '/media/about/site.jpg';
  const companyImageSecondary =
    about.digital?.image ||
    settings?.home?.about?.secondaryImage ||
    '/media/about/plant.jpg';
  const historyImage =
    about.timeline?.image ||
    about.hero?.image ||
    '/media/about/about-2.jpg';
  const historySideImage = settings?.ownerImage || '/media/founder/kass.jpg';

  const valuesKicker = pick(about.values?.kicker, LEGACY.valuesKicker, 'Our values');
  const valuesTitle = aboutValues.valuesTitle || about.values?.title || 'What guides every project.';
  const timelineKicker = pick(about.timeline?.kicker, LEGACY.timelineKicker, 'Our history');
  const timelineTitle = about.timeline?.title || null;
  const leadershipKicker = pick(about.leadership?.kicker, LEGACY.leadershipKicker, 'Leadership');
  const leadershipTitle = aboutLeadership.leadershipTitle || about.leadership?.title || null;
  const teamLabel = aboutLeadership.teamLabel || 'Key personnel';

  const positionPoints =
    Array.isArray(aboutSpecializations.positionPoints) && aboutSpecializations.positionPoints.length
      ? aboutSpecializations.positionPoints
      : POSITION_POINTS;

  const approachItems =
    aboutApproach.items && aboutApproach.items.length
      ? aboutApproach.items.map((a) => ({ ...a, icon: CheckCircle }))
      : APPROACH_PILLARS;
  const approachKicker = aboutApproach.kicker || 'Our approach';
  const approachTitle = aboutApproach.title || null;

  const capabilitiesKicker = aboutCapabilities.kicker || 'Experience & capabilities';
  const capabilitiesTitle = aboutCapabilities.title || null;
  const capabilityItems =
    aboutCapabilities.items && aboutCapabilities.items.length
      ? aboutCapabilities.items.map((u, i) => ({
          id: u.id || `cap-${i}`,
          title: u.title,
          desc: u.desc || u.description || '',
          icon: [Settings2, Layers, Wrench, Forklift][i % 4],
        }))
      : CAPABILITIES;

  const deliverablesLabel = aboutExperience.deliverablesLabel || 'What we deliver';
  const allCapabilitiesCta = aboutExperience.allCapabilitiesCta || 'All capabilities';

  const digitalKicker = aboutDigital.kicker || 'Digital construction';
  const digitalTitle = aboutDigital.title || null;
  const digitalLead =
    aboutDigital.lead ||
    'KASCON operates integrated digital controls across all active sites — linking programme, cost, HSEQ and logistics into a single reporting flow.';
  const digitalPoints =
    aboutDigital.points && aboutDigital.points.length ? aboutDigital.points : DIGITAL_POINTS;
  const digitalImage = aboutDigital.image || null;
  const digitalCaption = aboutDigital.caption || 'Operations';

  const erpKicker = aboutErp.kicker || 'Technology advantage';
  const erpTitle = aboutErp.title || null;
  const erpLead =
    aboutErp.lead ||
    'Projects, costs, fleet, inventory, workforce and HSEQ live in one ERP — real-time visibility across every site and commitment.';
  const erpFlowLabel = aboutErp.flowLabel || 'How it works';
  const erpIcons = [LayoutDashboard, BarChart3, Forklift, Database, Users, Shield];
  const erpModules =
    aboutErp.modules && aboutErp.modules.length
      ? aboutErp.modules.map((label, i) => ({ label, icon: erpIcons[i % erpIcons.length] }))
      : ERP_MODULES;
  const erpFlow =
    aboutErp.flow && aboutErp.flow.length
      ? aboutErp.flow.map((f) => ({ label: f.title, note: f.description }))
      : ERP_FLOW;

  const testimonialsKicker = aboutTestimonials.kicker || 'Client voices';
  const testimonialsTitle = aboutTestimonials.title || null;
  const ctaKicker = aboutCta.kicker || 'Start a conversation';
  const ctaTitle = aboutCta.title || 'Ready to work together?';
  const ctaText =
    aboutCta.text ||
    'Tell us about your next construction project — we will respond with capability, programme and next steps.';
  const ctaPrimary = aboutCta.primaryLabel || 'Request a consultation';
  const ctaSecondary = aboutCta.secondaryLabel || 'View our projects';
  const aboutHeroImage = about.hero?.image || null;

  const values = Array.isArray(settings?.values) ? settings.values : [];
  const visibleTestimonials = testimonials.slice(0, 3);

  useSEO(
    'About',
    settings?.aboutShort ||
      'Learn about Kassa & Sons Construction PLC — a Grade-1 Ethiopian contractor pioneering digital construction management since 1980.',
    'about'
  );

  useEffect(() => {
    const load = (path) => api.get(path).then((r) => r.data || []).catch(() => []);
    Promise.all([
      load('/team/public'),
      load('/milestones/public'),
      load('/awards/public'),
      load('/services/public'),
      load('/testimonials/public'),
    ]).then(([t, m, a, s, ts]) => {
      setTeam(t);
      setMilestones(m);
      setAwards(a);
      setServices(s);
      setTestimonials(ts);
    });
  }, []);

  return (
    <div className="about-page">
      <PageHeader
        kicker={heroKicker}
        title={heroTitle}
        lead={
          settings?.aboutShort ||
          'From a small contracting venture in the 1960s (E.C.) to a technology-forward Grade-1 general contractor delivering commercial, energy and civil works across Ethiopia.'
        }
        image={aboutHeroImage}
        alt={companyName}
      />

      {/* ── Facts ─────────────────────────────────────────────── */}
      <section aria-labelledby="about-stats" className="about-facts">
        <h2 id="about-stats" className="sr-only">
          Company facts
        </h2>
        <div className="container-pad">
          <dl className="about-facts-grid">
            {keyFacts.map((f) => (
              <div key={f.label} className="about-facts-item">
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Who we are ────────────────────────────────────────── */}
      <section id="company" className="section scroll-mt-24">
        <div className="container-pad">
          <FadeIn>
            <div className="about-story">
              <div className="about-story-visual">
                <div className="about-story-collage">
                  <span aria-hidden="true" className="about-story-corner" />
                  <figure className="about-story-main">
                    <SiteImage
                      src={companyImagePrimary}
                      alt={`${companyName} construction site`}
                      className="h-full w-full object-cover"
                    />
                  </figure>
                  <figure className="about-story-inset">
                    <SiteImage
                      src={companyImageSecondary}
                      alt={`${companyName} plant and equipment`}
                      className="h-full w-full object-cover"
                    />
                  </figure>
                  <div className="about-story-chip" aria-hidden="true">
                    <span>{settings?.yearsExperience || '46+'} yrs</span>
                    <span>Est. {foundedYear}</span>
                  </div>
                </div>
              </div>

              <div className="about-story-copy">
                <SectionHeading
                  kicker={companyKicker}
                  title={accentTitle(companyTitle)}
                  id="company-heading"
                />

                <div className="mt-5 flex flex-wrap gap-2">
                  {(settings?.grade || 'Grade-1 General Contractor') && (
                    <span className="about-badge about-badge--navy">
                      {settings?.grade || 'Grade-1 General Contractor'}
                    </span>
                  )}
                  <span className="about-badge">Addis Ababa, Ethiopia</span>
                </div>

                <ReadMoreText
                  className="mt-6"
                  text={
                    settings?.aboutLong ||
                    'Kassa & Sons Construction PLC is an Ethiopian multidisciplinary construction company headquartered in Addis Ababa. Established in April 1980 and formally incorporated in October 1998, we deliver building, civil, fuel-station, petroleum depot and aviation infrastructure works as a Grade-1 General Contractor.'
                  }
                />

                <ul className="about-point-list mt-8">
                  {positionPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>

                <div className="mt-9 flex flex-wrap gap-3">
                  <Link to="/services" className="btn-primary">
                    {companyCta1} <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                  <Link to="/projects" className="btn-ghost">
                    {companyCta2}
                  </Link>
                  <ProfileDownloadButton variant="ghost" />
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn className="about-vm mt-14 lg:mt-20">
            <article className="about-vm-vision">
              <span className="about-vm-icon" aria-hidden="true">
                <Eye size={18} />
              </span>
              <p className="about-vm-label">Vision</p>
              <p className="about-vm-text">
                {settings?.vision ||
                  'To become a leading construction company in Africa, recognised for innovative solutions, outstanding delivery and sustainable development.'}
              </p>
            </article>
            <article className="about-vm-mission">
              <span className="about-vm-icon about-vm-icon--light" aria-hidden="true">
                <Target size={18} />
              </span>
              <p className="about-vm-label about-vm-label--dark">Mission</p>
              <p className="about-vm-text about-vm-text--dark">
                {settings?.mission ||
                  'To deliver sustainable, high-quality construction solutions that meet approved designs and specifications — building partnerships on integrity and excellence.'}
              </p>
            </article>
          </FadeIn>
        </div>
      </section>

      {/* ── History ───────────────────────────────────────────── */}
      <section id="history" className="section bg-slate-50 scroll-mt-24">
        <div className="container-pad">
          <FadeIn>
            <div className="about-history-intro">
              <div>
                <SectionHeading
                  kicker={timelineKicker}
                  title={
                    timelineTitle || (
                      <>
                        Decades of growth, <span className="text-accent">grounded in integrity.</span>
                      </>
                    )
                  }
                  lead={
                    aboutTimeline.description ||
                    'From licensed contracting in the 1960s (E.C.) to a Grade-1 organisation delivering complex works nationwide — a continuous line of capability and trust.'
                  }
                  id="history-heading"
                />
              </div>
              <figure className="about-history-hero">
               
                <figcaption>
                  <span>Since {foundedYear}</span>
                  <span>{companyName}</span>
                </figcaption>
              </figure>
            </div>
          </FadeIn>

          <div className="about-history-body">
            <FadeIn className="about-history-aside">
              <figure className="about-history-portrait">
                <SiteImage
                  src={historySideImage}
                  alt={settings?.ownerName || 'Founder'}
                  className="h-full w-full object-cover object-top"
                />
                <figcaption>
                  <strong>{settings?.ownerName || 'Ato Kassa G/Tsadik'}</strong>
                  <span>{settings?.ownerTitle || 'Founder & Chairman'}</span>
                </figcaption>
              </figure>
            </FadeIn>

            <div className="about-history-rail">
              {milestones.length > 0 ? (
                <FadeIn>
                  <ol className="about-timeline">
                    {milestones.map((m, i) => (
                      <li key={m._id || m.title || i} className="about-timeline-item">
                        <span className="about-timeline-marker" aria-hidden="true" />
                        <span className="about-timeline-year">{m.year}</span>
                        <div className="about-timeline-body">
                          <h3>{m.title}</h3>
                          {m.description && <p>{m.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </FadeIn>
              ) : (
                <p className="text-sm text-slate-400">Milestones will appear here once published.</p>
              )}
            </div>
          </div>

          {awards.length > 0 && (
            <FadeIn className="mt-14">
              <p className="about-sublabel">Recognition</p>
              <ul className="about-awards">
                {awards.map((a, i) => (
                  <li key={a._id} className="about-award">
                    <SiteImage
                      src={a.image || `/media/awards/award-${(i % 3) + 1}.jpg`}
                      alt={a.title || 'Award'}
                      className="about-award-img"
                    />
                    <div>
                      <span className="about-award-year">{a.year}</span>
                      <h3>{a.title}</h3>
                      {a.issuer && <p>{a.issuer}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </FadeIn>
          )}
        </div>
      </section>

      {/* ── Approach ──────────────────────────────────────────── */}
      <section id="approach" className="section scroll-mt-24">
        <div className="container-pad">
          <FadeIn className="mb-12">
            <SectionHeading
              kicker={approachKicker}
              title={
                approachTitle || (
                  <>
                    Structured delivery,{' '}
                    <span className="text-accent">from pre-construction to handover.</span>
                  </>
                )
              }
              id="approach-heading"
            />
          </FadeIn>

          <Stagger className="about-pillars">
            {approachItems.map((p, i) => {
              const Icon = p.icon || CheckCircle;
              return (
                <motion.article key={p.title} variants={item} className="about-pillar">
                  <span className="about-pillar-index" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="about-pillar-icon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                </motion.article>
              );
            })}
          </Stagger>

          <FadeIn className="mt-10">
            <Link to="/capabilities" className="btn-ghost">
              Our capabilities <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Digital ───────────────────────────────────────────── */}
      <section id="digital" className="section bg-slate-50 scroll-mt-24">
        <div className="container-pad">
          <FadeIn>
            <div
              className={`grid items-start gap-12 lg:gap-16 ${
                digitalImage ? 'lg:grid-cols-12' : ''
              }`}
            >
              <div className={digitalImage ? 'lg:col-span-7' : 'max-w-3xl'}>
                <SectionHeading
                  kicker={digitalKicker}
                  title={
                    digitalTitle || (
                      <>
                        Project visibility from site to management,{' '}
                        <span className="text-accent">in real time.</span>
                      </>
                    )
                  }
                  lead={digitalLead}
                  id="digital-heading"
                />
                <ul className="about-check-list mt-8">
                  {digitalPoints.map((point) => (
                    <li key={point}>
                      <CheckCircle size={15} aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {digitalImage && (
                <figure className="lg:col-span-5 about-media">
                  <SiteImage
                    src={digitalImage}
                    alt="KASCON site operations and plant"
                    className="about-media-img aspect-[4/3] w-full object-cover lg:aspect-[4/5]"
                  />
                  <figcaption className="about-media-cap">
                    <span>{digitalCaption}</span>
                    <span>{companyName}</span>
                  </figcaption>
                </figure>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── ERP ───────────────────────────────────────────────── */}
      <section id="erp" className="section bg-navy text-white scroll-mt-24">
        <div className="container-pad">
          <FadeIn className="mb-12 max-w-3xl">
            <SectionHeading
              dark
              kicker={erpKicker}
              title={
                erpTitle || (
                  <>
                    One integrated system, <span className="text-accent">across every operation.</span>
                  </>
                )
              }
              lead={erpLead}
              id="erp-heading"
            />
          </FadeIn>

          <FadeIn>
            <ul className="about-erp-modules">
              {erpModules.map((m) => {
                const Icon = m.icon;
                return (
                  <li key={m.label}>
                    <Icon size={16} aria-hidden="true" />
                    <span>{m.label}</span>
                  </li>
                );
              })}
            </ul>
          </FadeIn>

          <FadeIn className="mt-12">
            <p className="about-sublabel about-sublabel--light">{erpFlowLabel}</p>
            <ol className="about-erp-flow">
              {erpFlow.map((step, i) => (
                <li key={step.label}>
                  <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{step.label}</h3>
                  <p>{step.note}</p>
                </li>
              ))}
            </ol>
          </FadeIn>
        </div>
      </section>

      {/* ── Experience ────────────────────────────────────────── */}
      <section id="experience" className="section scroll-mt-24">
        <div className="container-pad">
          <FadeIn className="mb-12">
            <SectionHeading
              kicker={capabilitiesKicker}
              title={
                capabilitiesTitle || (
                  <>
                    Owned capacity, <span className="text-accent">self-performed delivery.</span>
                  </>
                )
              }
              id="experience-heading"
            />
          </FadeIn>

          <Stagger className="about-caps">
            {capabilityItems.map((u) => {
              const Icon = u.icon;
              return (
                <motion.article key={u.id} variants={item} className="about-cap">
                  <span aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3>{u.title}</h3>
                    <p>{u.desc}</p>
                  </div>
                </motion.article>
              );
            })}
          </Stagger>

          {services.length > 0 && (
            <FadeIn className="mt-14">
              <p className="about-sublabel">{deliverablesLabel}</p>
              <ul className="about-services">
                {services.map((s) => {
                  const Icon = SERVICE_ICONS[s.icon] || Building2;
                  return (
                    <li key={s._id}>
                      <Link to={`/services/${s._id}`}>
                        <span className="about-services-icon" aria-hidden="true">
                          <Icon size={15} />
                        </span>
                        <span className="about-services-title">{s.title}</span>
                        <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </FadeIn>
          )}

          <FadeIn className="mt-10">
            <Link to="/capabilities" className="btn-ghost">
              {allCapabilitiesCta} <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────── */}
      {values.length > 0 && (
        <section id="values" className="section bg-slate-50 scroll-mt-24">
          <div className="container-pad">
            <FadeIn className="mb-12">
              <SectionHeading
                kicker={valuesKicker}
                title={accentTitle(valuesTitle, false) || valuesTitle}
                id="values-heading"
              />
            </FadeIn>
            <Stagger className="about-values">
              {values.map((v) => (
                <motion.article key={v.title} variants={item} className="about-value">
                  <h3>{v.title}</h3>
                  <p>{v.description}</p>
                </motion.article>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* ── Leadership ────────────────────────────────────────── */}
      <section id="owners" className="section scroll-mt-24">
        <div className="container-pad">
          <FadeIn>
            <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <SectionHeading
                  kicker={leadershipKicker}
                  title={
                    leadershipTitle || (
                      <>
                        The people <span className="text-accent">behind KASCON.</span>
                      </>
                    )
                  }
                  id="owners-heading"
                />

                {(settings?.ownerImage || settings?.ownerName) && (
                  <figure className="about-founder mt-8">
                    {settings?.ownerImage && (
                      <SiteImage
                        src={settings.ownerImage}
                        alt={settings?.ownerName || 'Founder'}
                        className="aspect-[3/2] w-full object-cover object-top"
                      />
                    )}
                    <figcaption>
                      <h3>{settings?.ownerName || 'Ato Kassa G/Tsadik'}</h3>
                      <p>{settings?.ownerTitle || 'Founder & Chairman'}</p>
                    </figcaption>
                  </figure>
                )}
              </div>

              <div className="lg:col-span-7">
                <p className="editorial-lead whitespace-pre-line">
                  {settings?.ownerBio ||
                    'Ato Kassa Gebretsadik Abebe believed in building a better future for Ethiopia. In the early 1960s (E.C.) he began as a licensed contractor on key projects during a period of national growth — laying the foundation for the company that became KASCON.'}
                </p>
                {settings?.ownerQuote && (
                  <blockquote className="about-quote">
                    <p>&ldquo;{settings.ownerQuote}&rdquo;</p>
                  </blockquote>
                )}
              </div>
            </div>
          </FadeIn>

          {team.length > 0 && (
            <FadeIn className="mt-16">
              <p className="about-sublabel">{teamLabel}</p>
              <ul className="about-team">
                {team.map((m) => (
                  <li key={m._id} className="about-team-item">
                    {m.photo && (
                      <SiteImage src={m.photo} alt={m.name} className="about-team-photo" />
                    )}
                    <div className="about-team-body">
                      <h3>{m.name}</h3>
                      <p className="about-team-role">{m.role}</p>
                      {(m.qualification || m.experience) && (
                        <dl className="about-team-meta">
                          {m.qualification && (
                            <div>
                              <dt className="sr-only">Qualification</dt>
                              <dd>
                                <GraduationCap size={13} aria-hidden="true" />
                                {m.qualification}
                              </dd>
                            </div>
                          )}
                          {m.experience && (
                            <div>
                              <dt className="sr-only">Experience</dt>
                              <dd>
                                <Briefcase size={13} aria-hidden="true" />
                                {m.experience}
                              </dd>
                            </div>
                          )}
                        </dl>
                      )}
                      {m.bio && <p className="about-team-bio">{m.bio}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </FadeIn>
          )}
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section id="testimonials" className="section bg-slate-50 scroll-mt-24">
        <div className="container-pad">
          <FadeIn className="mb-12">
            <SectionHeading
              kicker={testimonialsKicker}
              title={
                testimonialsTitle || (
                  <>
                    Trusted by the partners <span className="text-accent">we build for.</span>
                  </>
                )
              }
              id="testimonials-heading"
            />
          </FadeIn>

          {visibleTestimonials.length > 0 ? (
            <FadeIn>
              <ul className="about-quotes">
                {visibleTestimonials.map((t) => (
                  <li key={t._id}>
                    <figure className="about-quote-card">
                      <blockquote>{t.quote}</blockquote>
                      <figcaption>
                        <div>
                          <cite>{t.author || 'Client'}</cite>
                          <p>{[t.role, t.company].filter(Boolean).join(' · ')}</p>
                        </div>
                        {t.project && (
                          <p className="about-quote-project">
                            <Briefcase size={12} aria-hidden="true" />
                            {t.project}
                          </p>
                        )}
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </FadeIn>
          ) : (
            <p className="text-sm text-slate-400">
              Client testimonials will appear here once published.
            </p>
          )}
        </div>
      </section>

      <ClientLogoMarquee />

      <PageCta
        kicker={ctaKicker}
        title={ctaTitle}
        text={ctaText}
        label={ctaPrimary}
        secondaryTo="/projects"
        secondaryLabel={ctaSecondary}
      />
    </div>
  );
}
