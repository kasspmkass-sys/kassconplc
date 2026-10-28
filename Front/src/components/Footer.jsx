/**
 * PREMIUM CORPORATE FOOTER
 * Engineering-focused layout: 4-column desktop, stacked mobile.
 * Verified info only. No fake contact details.
 * Company, Capabilities, Contact columns.
 *
 * The Capabilities column is CMS-managed:
 *   heading  → settings.footer.servicesTitle
 *   links    → settings.footer.capabilityLinks  (fallback to the list below)
 * The Company column uses settings.footer.exploreLinks as before.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Facebook, Linkedin, Youtube, ArrowRight, Clock, ShieldCheck, Award } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import api from '../api';
import SiteImage from './SiteImage';
import ProfileDownloadButton from './ProfileDownloadButton';

const COMPANY_LINKS = [
  { to: '/about',        label: 'About KASCON' },
  { to: '/services',     label: 'Services' },
  { to: '/projects',     label: 'Projects' },
  { to: '/capabilities', label: 'Capabilities' },
  { to: '/careers',      label: 'Careers' },
  { to: '/contact',      label: 'Contact' },
];

/* Fallback only — used when the admin has not saved capabilityLinks yet. */
const DEFAULT_CAPABILITY_LINKS = [
  { to: '/capabilities#concrete-batching', label: 'Concrete Batching Plant' },
  { to: '/capabilities#stone-crushing',    label: 'Stone Crushing Plant' },
  { to: '/capabilities#steel-fabrication', label: 'Steel Fabrication' },
  { to: '/capabilities#fleet-auto-shop',   label: 'Fleet & Auto Shop' },
  { to: '/ready-mix',                      label: 'Ready-Mix Concrete' },
  { to: '/aggregate',                      label: 'Aggregate Supply' },
  { to: '/equipment',                      label: 'Equipment Gallery' },
  { to: '/hseq',                           label: 'HSEQ System' },
  { to: '/news',                           label: 'News & Updates' },
  { to: '/downloads',                      label: 'Downloads' },
];

export default function Footer() {
  const { settings } = useSite();
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    let active = true;
    api.get('/certificates/public')
      .then((r) => { if (active) setCertificates((r.data || []).slice(0, 4)); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const footer       = settings?.footer   || {};
  const brandName    = settings?.header?.name      || 'Kassa & Sons';
  const brandTail    = settings?.header?.subtitle  || 'Construction PLC';
  const companyName  = settings?.companyName       || `${brandName} ${brandTail}`;
  const tagline      = settings?.tagline           || 'The Result Of Unity';
  const showSocial   = footer.showSocial   !== false;
  const showAdminLink = footer.showAdminLink !== false;
  const copyright    = footer.copyright    || 'All rights reserved.';
  const logoHeight   = Math.min(Math.max(Number(settings?.logoSize) || 44, 32), 52);
  const aboutText    = footer.aboutText    ||
    `${tagline} — Grade-1 general contractor delivering building, civil, energy and infrastructure works across Ethiopia since ${settings?.foundedYear || '1980'}.`;

  const socialLinks = [
    ['Facebook', Facebook, settings?.social?.facebook],
    ['LinkedIn', Linkedin, settings?.social?.linkedin],
    ['YouTube',  Youtube,  settings?.social?.youtube],
  ].filter(([,, url]) => url && /^https?:\/\//i.test(url));

  const exploreLinks = (Array.isArray(footer.exploreLinks) && footer.exploreLinks.length
    ? footer.exploreLinks.filter((l) => l && l.to && l.label)
    : COMPANY_LINKS);

  const capabilityLinks = (Array.isArray(footer.capabilityLinks) && footer.capabilityLinks.length
    ? footer.capabilityLinks.filter((l) => l && l.to && l.label)
    : DEFAULT_CAPABILITY_LINKS);

  const capabilitiesTitle = footer.servicesTitle || 'Capabilities';

  const contactTitle = footer.contactTitle || 'Contact';
  const ctaLabel = footer.servicesCta || 'Request a Consultation';
  const ctaHeading = footer.ctaHeading || 'Start a project';
  const showCertifications = footer.showCertifications !== false;
  const certificationsTitle = footer.certificationsTitle || 'Compliance';

  return (
    <footer className="bg-navy-900 text-white">
      {/* Dark-red top accent */}
      <div aria-hidden="true" className="h-0.5 bg-accent" />

      {/* Desktop grid */}
      <div className="hidden lg:block">
        <div className="container-pad grid grid-cols-12 gap-8 py-20">

          {/* Brand column */}
          <div className="col-span-3">
            <div className="mb-5 flex items-center gap-3">
              {settings?.logo ? (
                <SiteImage
                  src={settings.logo}
                  alt={brandName}
                  className="shrink-0 object-contain bg-white p-1"
                  style={{ height: logoHeight }}
                />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center bg-accent font-display text-lg font-bold text-white">
                  KS
                </span>
              )}
              <div className="min-w-0">
                <div className="truncate font-display text-base font-bold leading-tight">{brandName}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/45">{brandTail}</div>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-white/60 max-w-xs">{aboutText}</p>

            {/* Social links */}
            {showSocial && socialLinks.length > 0 && (
              <div className="mt-6 flex gap-2">
                {socialLinks.map(([label, Icon, url]) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center border border-white/15 text-white/55
                      transition-colors duration-200 hover:border-accent hover:bg-accent hover:text-white"
                  >
                    <Icon size={15} aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}

            {/* Company profile download */}
            <ProfileDownloadButton
              variant="ghost"
              className="mt-5 !border-white/15 !bg-white/5 !text-white/70 !rounded-none hover:!text-white hover:!border-white/30 hover:!bg-white/10"
            />
          </div>

          {/* Company links */}
          <nav className="col-span-2" aria-label="Company">
            <h3 className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 border-b border-white/10 pb-3">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm">
              {exploreLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-white/65 transition-colors duration-200 hover:text-white flex items-center gap-1.5 group">
                    <span aria-hidden="true" className="h-px w-0 bg-accent transition-all duration-200 group-hover:w-3" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Capabilities links — CMS-managed (footer.capabilityLinks) */}
          <nav className="col-span-3" aria-label={capabilitiesTitle}>
            <h3 className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 border-b border-white/10 pb-3">
              {capabilitiesTitle}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {capabilityLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-white/65 transition-colors duration-200 hover:text-white flex items-center gap-1.5 group">
                    <span aria-hidden="true" className="h-px w-0 bg-accent transition-all duration-200 group-hover:w-3" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Compliance certificates — links to the full list on /hseq */}
            {showCertifications && certificates.length > 0 && (
              <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  <ShieldCheck size={12} className="text-accent" aria-hidden="true" />
                  {certificationsTitle}
                </h3>
                <ul className="space-y-2 text-xs">
                  {certificates.map((c) => (
                    <li key={c._id} className="flex items-start gap-2 text-white/55">
                      <Award size={11} className="mt-0.5 shrink-0 text-accent/70" aria-hidden="true" />
                      <span className="min-w-0 break-words">
                        {c.name}
                        {c.validUntil && <span className="text-white/35"> · {c.validUntil}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/hseq"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors duration-200 hover:text-white"
                >
                  View all certificates <ArrowRight size={12} aria-hidden="true" />
                </Link>
              </div>
            )}
          </nav>

          {/* Contact */}
          <div className="col-span-4">
            <h3 className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 border-b border-white/10 pb-3">
              {contactTitle}
            </h3>
            <ul className="space-y-4 text-sm text-white/65">
              {settings?.phone && (
                <li className="flex gap-3">
                  <Phone size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  <a href={`tel:${settings.phone.replace(/[^+\d]/g, '')}`} className="break-words hover:text-white transition-colors">
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings?.email && (
                <li className="flex gap-3">
                  <Mail size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  <a href={`mailto:${settings.email}`} className="min-w-0 break-words hover:text-white transition-colors">
                    {settings.email}
                  </a>
                </li>
              )}
              {settings?.address && (
                <li className="flex gap-3">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  <span className="min-w-0 break-words leading-relaxed">{settings.address}</span>
                </li>
              )}
              {settings?.workingHours && (
                <li className="flex gap-3">
                  <Clock size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  <span className="text-xs leading-relaxed text-white/45">{settings.workingHours}</span>
                </li>
              )}
            </ul>

            {/* CTA */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">{ctaHeading}</p>
              <Link to="/contact" className="btn-accent">
                {ctaLabel} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="lg:hidden">
        <div className="container-pad space-y-8 py-10">
          {/* Brand */}
          <div className="flex items-center gap-3">
            {settings?.logo ? (
              <SiteImage
                src={settings.logo}
                alt={brandName}
                className="shrink-0 object-contain bg-white p-1"
                style={{ height: 40 }}
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center bg-accent font-display font-bold text-white">
                KS
              </span>
            )}
            <div>
              <div className="font-display text-base font-bold leading-tight">{brandName}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/40">{brandTail}</div>
            </div>
          </div>

          <p className="text-sm text-white/60 leading-relaxed max-w-sm">{aboutText}</p>

          {/* Contact info */}
          <ul className="space-y-3">
            {settings?.phone && (
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-accent shrink-0" aria-hidden="true" />
                <a href={`tel:${settings.phone.replace(/[^+\d]/g, '')}`} className="text-sm text-white/70">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings?.email && (
              <li className="flex items-start gap-3">
                <Mail size={15} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                <a href={`mailto:${settings.email}`} className="text-sm text-white/70 break-words">
                  {settings.email}
                </a>
              </li>
            )}
            {settings?.address && (
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm text-white/70 break-words leading-snug">{settings.address}</span>
              </li>
            )}
          </ul>

          {/* Social + download */}
          <div className="flex flex-wrap gap-3">
            {showSocial && socialLinks.map(([label, Icon, url]) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center border border-white/15 text-white/60
                  transition-colors duration-200 active:bg-accent active:text-white"
              >
                <Icon size={17} aria-hidden="true" />
              </a>
            ))}
            <ProfileDownloadButton
              variant="ghost"
              className="!border-white/15 !bg-white/5 !text-white/70 !rounded-none hover:!text-white hover:!border-white/30"
            />
          </div>

          {/* Quick links */}
          <nav aria-label="Footer navigation">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
              {[...exploreLinks, ...capabilityLinks.slice(0, 4)].map((l) => (
                <Link key={`${l.to}-${l.label}`} to={l.to}
                  className="text-white/60 hover:text-white transition-colors truncate">
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Compliance certificates */}
          {showCertifications && certificates.length > 0 && (
            <div className="border-t border-white/10 pt-6">
              <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                <ShieldCheck size={12} className="text-accent" aria-hidden="true" />
                {certificationsTitle}
              </p>
              <ul className="space-y-1.5 text-xs text-white/55">
                {certificates.map((c) => (
                  <li key={c._id} className="flex items-start gap-2">
                    <Award size={11} className="mt-0.5 shrink-0 text-accent/70" aria-hidden="true" />
                    <span className="min-w-0 break-words">{c.name}</span>
                  </li>
                ))}
              </ul>
              <Link to="/hseq" className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white">
                View all certificates <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          )}

          <Link to="/contact" className="btn-accent w-full">
            {ctaLabel} <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-pad flex flex-col justify-between gap-2 py-5 text-xs text-white/35 sm:flex-row">
          <p className="break-words">
            &copy;  {new Date().getFullYear()} Kassa & Sons Construction PLC. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/search" className="hover:text-white/70 transition-colors">Search</Link>
         
          </div>
        </div>
      </div>
    </footer>
  );
}
