import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Phone, ChevronDown, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSite } from '../context/SiteContext';
import api, { API_BASE } from '../api';
import SiteImage from './SiteImage';
import ProfileDownloadButton from './ProfileDownloadButton';
import snapshot from '../data/site-snapshot.json';

const DEFAULT_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/projects', label: 'Projects' },
  { to: '/where-we-work', label: 'Where We Work' },
  { to: '/careers', label: 'Careers' },
  { to: '/contact', label: 'Contact' },
];

const ABOUT_ITEMS = (showProfile = true, profileLabel) => {
  const items = [
    { label: 'Who We Are', to: '/about#company' },
    { label: 'Our History', to: '/about#history' },
    { label: 'Our Approach', to: '/about#approach' },
    { label: 'Leadership', to: '/about#owners' },
    { label: 'Capabilities', to: '/capabilities' },
  ];
  if (showProfile) {
    items.push({ label: profileLabel || 'Company Profile', to: '/downloads', isProfileDownload: true });
  }
  return items;
};

const PROJECT_ITEMS = [
  { label: 'Building Construction', to: '/projects?filter=buildings' },
  { label: 'Road & Infrastructure', to: '/projects?filter=roads' },
  { label: 'Fuel Station & Depot', to: '/projects?filter=fuel' },
  { label: 'Industrial Works', to: '/projects?filter=industrial' },
  { label: 'View All Projects', to: '/projects' },
];

const CAPABILITY_ITEMS = [
  { label: 'Concrete Batching Plant', to: '/capabilities#concrete-batching' },
  { label: 'Stone Crushing Plant', to: '/capabilities#stone-crushing' },
  { label: 'Steel Fabrication', to: '/capabilities#steel-fabrication' },
  { label: 'Fleet & Auto Shop', to: '/capabilities#fleet-auto-shop' },
  { label: 'HSEQ System', to: '/capabilities#hseq' },
];

/* Services that also have a dedicated specialist page. Every other service links
   straight to its own CMS record, so the menu labels, order and targets all come
   from /services/public instead of a hardcoded slug map that silently breaks
   whenever a slug is renamed in the admin. */
const SPECIALIST_SERVICE_PAGES = [
  { slug: 'ready-mix-concrete',            label: 'Ready-Mix Concrete Supply', to: '/ready-mix' },
  { slug: 'quarry-construction-materials', label: 'Aggregate Supply',          to: '/aggregate' },
];

/* Safety net used only when /services/public is unavailable. */
const SERVICE_FALLBACK_ITEMS = [
  { label: 'Building Construction',     to: '/services' },
  { label: 'Ready-Mix Concrete Supply', to: '/ready-mix' },
  { label: 'Aggregate Supply',          to: '/aggregate' },
  { label: 'Equipment & Fleet',         to: '/equipment' },
  { label: 'All Services',              to: '/services' },
];

function MenuItem({ item, active }) {
  const base =
    'block px-3 py-2.5 text-sm select-none transition-colors duration-150 ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 ' +
    'border-l-2 ';
  const cls = base + (
    active
      ? 'text-accent font-semibold border-accent bg-accent/5'
      : 'text-slate-600 border-transparent hover:text-accent hover:border-accent/40 hover:bg-slate-50'
  );
  if (item.isProfileDownload) {
    return <ProfileDownloadButton variant="ghost" className="!block !rounded-none !border-l-2 !border-transparent !justify-start !px-3 !py-2.5 !text-sm hover:!border-accent/40 w-full" />;
  }
  if (item.href) {
    return <a href={item.href} download={item.download !== false} className={cls}>{item.label}</a>;
  }
  return <Link to={item.to} className={cls}>{item.label}</Link>;
}

function MobileItem({ item, active, onNavigate }) {
  const cls =
    'flex min-w-0 items-center gap-2 px-3 py-2.5 text-[15px] transition-colors focus:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-accent/40 ' +
    (active ? 'text-accent font-semibold' : 'text-slate-600 hover:text-accent');
  if (item.isProfileDownload) {
    return <ProfileDownloadButton variant="ghost" className="w-full !justify-start !px-3 !py-2.5 !text-[15px] !rounded-none" />;
  }
  if (item.href) {
    return (
      <a href={item.href} download={item.download !== false} onClick={onNavigate} className={cls}>
        <span className="min-w-0">{item.label}</span>
      </a>
    );
  }
  return (
    <Link to={item.to} onClick={onNavigate} className={cls}>
      <span className="min-w-0">{item.label}</span>
    </Link>
  );
}

export default function Navbar() {
  const { settings } = useSite();
  const [open, setOpen]             = useState(false);
  const [openMenu, setOpenMenu]     = useState(null);
  const [openMobile, setOpenMobile] = useState(null);
  const [scrolled, setScrolled]     = useState(false);
  const [services, setServices]     = useState([]);
  const [resolvedLogoSrc, setResolvedLogoSrc] = useState(
    snapshot?.logoSmallPath || snapshot?.logoLocalPath || null
  );

  useEffect(() => {
    if (!settings?.logo) return;
    if (settings.logo === snapshot?.logoUrl) return;
    const img = new Image();
    img.onload = () => setResolvedLogoSrc(settings.logo);
    img.src = settings.logo;
    return () => { img.onload = null; };
  }, [settings?.logo]);
  const location   = useLocation();
  const isHome     = location.pathname === '/';

  const headerRef     = useRef(null);
  const menuBtnRef    = useRef(null);
  const dropdownBtnRefs = useRef(new Map());

  const hoverable = useMemo(
    () => typeof window.matchMedia === 'function' &&
          window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    []
  );

  const reduceMotion = useMemo(
    () => typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const header       = settings?.header || {};
  const links        = Array.isArray(header.navLinks) && header.navLinks.length
    ? header.navLinks.filter((l) => l && l.to && l.label)
    : DEFAULT_LINKS;
  const navLinks     = links.some((l) => l.to === '/')
    ? links
    : [{ to: '/', label: 'Home' }, ...links];
  const quoteLabel   = header.quoteLabel    || 'Request a Consultation';
  const profileLabel = header.profileLabel  || 'Company Profile';
  const logoSize     = Number(settings?.logoSize) || 48;
  const logoHeight   = Math.min(Math.max(logoSize, 36), 52);
  const brandName    = settings?.companyName || header.name || 'Kassa & Sons Construction PLC';

  const brandMatch = brandName.trim().match(
    /^(.+?)\s+(Construction\s+(?:PLC|P\.L\.C\.?)|Construction|PLC|P\.L\.C\.?|Inc\.?|Ltd\.?|S\.C\.?)$/i
  );
  const brandStem  = brandMatch ? brandMatch[1] : brandName.trim();
  const brandTail  = brandMatch ? brandMatch[2] : '';

  const showPhone   = header.showPhone   !== false;
  const showProfile = header.showProfile !== false;
  const showQuote   = header.showQuote   !== false;

  useEffect(() => {
    let mounted = true;
    api.get('/services/public').then((r) => { if (mounted) setServices(r.data); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const serviceItems = useMemo(() => {
    const list = Array.isArray(services)
      ? services.filter((s) => s && (s.title || s.name))
      : [];
    if (list.length === 0) return SERVICE_FALLBACK_ITEMS;

    const overrideBySlug = new Map(SPECIALIST_SERVICE_PAGES.map((p) => [p.slug, p]));
    const overrideByTitle = new Map(
      SPECIALIST_SERVICE_PAGES.map((p) => [p.label.toLowerCase(), p])
    );
    const used = new Set();

    const items = list.map((s) => {
      const title = s.title || s.name;
      /* Match on slug first, then on the CMS title so a slug rename in the admin
         does not orphan the specialist page link. */
      const override =
        overrideBySlug.get(String(s.slug || '').trim().toLowerCase()) ||
        overrideByTitle.get(String(title || '').trim().toLowerCase());
      if (override) used.add(override.slug);
      return { label: title, to: override ? override.to : `/services/${s._id}` };
    });

    /* Keep the specialist pages reachable even if their service is missing. */
    for (const p of SPECIALIST_SERVICE_PAGES) {
      if (!used.has(p.slug)) items.push({ label: p.label, to: p.to });
    }
    return items;
  }, [services]);

  const normalizeMenu = (items) =>
    (Array.isArray(items) ? items : [])
      .filter((i) => i && (i.label || i.title) && (i.to || i.href))
      .map((i) => ({ label: i.label || i.title, to: i.to, href: i.href }));

  const aboutItems = Array.isArray(header.aboutMenu) && header.aboutMenu.length
    ? normalizeMenu(header.aboutMenu)
    : ABOUT_ITEMS(showProfile, profileLabel);

  const projectItems = Array.isArray(header.projectsMenu) && header.projectsMenu.length
    ? normalizeMenu(header.projectsMenu) : PROJECT_ITEMS;

  const capabilityItems = Array.isArray(header.capabilitiesMenu) && header.capabilitiesMenu.length
    ? normalizeMenu(header.capabilitiesMenu) : CAPABILITY_ITEMS;

  const menus = useMemo(
    () => ({
      '/about':        { align: 'left-0',                   cols: Math.max(1, Math.ceil(aboutItems.length / 6)), items: aboutItems },
      '/services':     { align: 'left-1/2 -translate-x-1/2', cols: 2,   items: serviceItems },
      '/projects':     { align: 'right-0',                  cols: 1,   items: projectItems },
      '/capabilities': { align: 'right-0',                  cols: 1,   items: capabilityItems },
    }),
    [serviceItems, aboutItems, projectItems, capabilityItems]
  );

  const activeFor   = (to) => to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(`${to}/`);
  const itemActive  = (item) => item.to ? activeFor(item.to.split('?')[0].split('#')[0]) : false;

  /* ---- Scroll state — switch early so labels never sit on mixed hero tones ---- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ---- Close on route change ---- */
  useEffect(() => { setOpen(false); setOpenMenu(null); setOpenMobile(null); }, [location.pathname]);

  /* ---- Body scroll lock when mobile open ---- */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; document.documentElement.style.overflow = ''; };
  }, [open]);

  /* ---- Escape to close mobile ---- */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); menuBtnRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  /* ---- Escape + outside click to close desktop dropdown ---- */
  useEffect(() => {
    if (!openMenu) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpenMenu(null); dropdownBtnRefs.current.get(openMenu)?.focus(); }
    };
    const onPointer = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onPointer); };
  }, [openMenu]);

  /* Solid on every non-home route, after a short scroll, or while menus are open.
     Home-at-top uses a dark frosted plate so white labels never wash out on bright photos. */
  const solid = scrolled || !isHome || open || openMenu !== null;

  const navLinkCls = (active) =>
    [
      'site-nav-link',
      active ? 'is-active' : '',
      solid ? 'is-solid' : 'is-over',
    ]
      .filter(Boolean)
      .join(' ');

  const mobileRowCls = (active) =>
    `relative flex flex-1 min-w-0 items-center gap-3 px-4 py-3 text-[15px] font-semibold
     transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40
     border-l-2 ` +
    (active
      ? 'text-accent border-accent bg-accent/5'
      : 'text-slate-700 border-transparent hover:bg-slate-50 hover:text-accent hover:border-accent/40');

  return (
    <header
      ref={headerRef}
      className={`site-nav ${solid ? 'site-nav--solid' : 'site-nav--over'}`}
      data-solid={solid ? 'true' : 'false'}
    >
      <div className="container-pad flex items-center justify-between gap-3 sm:gap-4 h-[var(--header-h)]">

        {/* ---- Wordmark ---- */}
        <Link to="/" className="site-nav-brand group" aria-label={brandName}>
          {resolvedLogoSrc ? (
            <SiteImage
              src={resolvedLogoSrc}
              alt=""
              className="site-nav-logo"
              style={{ height: logoHeight }}
              width={logoHeight}
              height={logoHeight}
            />
          ) : (
            <span
              className="site-nav-logo-fallback"
              style={{ width: logoHeight, height: logoHeight }}
              aria-hidden="true"
            >
              KS
            </span>
          )}

          <span className="site-nav-brand-text">
            <span className="site-nav-brand-name">{brandStem}</span>
            {brandTail && <span className="site-nav-brand-name">{brandTail}</span>}
          </span>
        </Link>

        {/* ---- Desktop navigation ---- */}
        <nav aria-label="Site navigation" className="site-nav-desktop hidden xl:flex items-center">
          {navLinks.map((l) => {
            const menu = menus[l.to];
            if (!menu) {
              return (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) => navLinkCls(isActive)}
                >
                  {l.label}
                </NavLink>
              );
            }

            const isActive    = activeFor(l.to);
            const isOpen      = openMenu === l.to;
            const controlsId  = `dd-${l.to.replace(/[^a-z0-9]/gi, '')}`;

            return (
              <div
                key={l.to}
                className="relative"
                onMouseEnter={() => hoverable && setOpenMenu(l.to)}
                onMouseLeave={() => hoverable && setOpenMenu(null)}
                onFocus={() => setOpenMenu(l.to)}
                onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpenMenu(null); }}
              >
                <Link
                  ref={(el) => { dropdownBtnRefs.current.set(l.to, el); }}
                  to={l.to}
                  aria-haspopup="menu"
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? controlsId : undefined}
                  className={navLinkCls(isActive)}
                >
                  {l.label}
                  <ChevronDown
                    size={13}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className={`site-nav-caret ${isOpen ? 'is-open' : ''}`}
                  />
                </Link>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      id={controlsId}
                      role="menu"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: reduceMotion ? 0 : 0.14, ease: 'easeOut' }}
                      className={`absolute ${menu.align} top-full pt-3 z-50`}
                    >
                      <div
                        className={`site-nav-dropdown ${menu.cols === 2 ? 'site-nav-dropdown--wide' : ''}`}
                      >
                        <div className={menu.cols === 2 ? 'grid grid-cols-2 gap-0' : 'space-y-0'}>
                          {menu.items.map((it) => (
                            <MenuItem key={it.label} item={it} active={itemActive(it)} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* ---- Header actions ---- */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          {showPhone && (
            <a
              href={`tel:${settings?.phone || '+251-907-257-134'}`}
              className="site-nav-phone hidden xl:inline-flex"
            >
              <Phone size={15} aria-hidden="true" />
              <span>{settings?.phone || '+251-907-257-134'}</span>
            </a>
          )}
          {showQuote && (
            <Link to="/contact" className="btn-primary !px-4 !py-2 !text-xs lg:!px-5 lg:!py-2.5">
              {quoteLabel}
            </Link>
          )}
          <Link
            to="/search"
            aria-label="Search"
            className="site-nav-icon-btn"
          >
            <Search size={17} aria-hidden="true" />
          </Link>
        </div>

        {/* ---- Hamburger ---- */}
        <button
          ref={menuBtnRef}
          className="site-nav-toggle xl:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ---- Mobile navigation ---- */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="xl:hidden bg-white border-t-2 border-t-accent overflow-hidden shadow-elevated"
          >
            <nav aria-label="Mobile navigation" className="mobile-menu-panel px-2 py-2 space-y-0.5">
              {navLinks.map((l) => {
                const menu = menus[l.to];
                if (!menu) {
                  return (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      end={l.to === '/'}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) => mobileRowCls(isActive)}
                    >
                      <span className="min-w-0">{l.label}</span>
                    </NavLink>
                  );
                }

                const isActive = activeFor(l.to);
                const expanded = openMobile === l.to;
                const subId    = `m-${l.to.replace(/[^a-z0-9]/gi, '')}`;

                return (
                  <div key={l.to}>
                    <div className="flex items-center">
                      <NavLink
                        to={l.to}
                        end={l.to === '/'}
                        onClick={() => setOpen(false)}
                        className={({ isActive: sub }) => mobileRowCls(sub || isActive)}
                      >
                        <span className="min-w-0">{l.label}</span>
                      </NavLink>
                      <button
                        type="button"
                        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${l.label}`}
                        aria-expanded={expanded}
                        aria-controls={subId}
                        onClick={() => setOpenMobile((v) => (v === l.to ? null : l.to))}
                        className="rounded p-3 text-slate-400 hover:text-accent transition-colors
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <ChevronDown
                          size={16}
                          aria-hidden="true"
                          className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          id={subId}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="py-1 pl-6 pr-2 border-l-2 border-accent/20 ml-4 space-y-0">
                            {menu.items.map((it) => (
                              <MobileItem
                                key={it.label}
                                item={it}
                                active={itemActive(it)}
                                onNavigate={() => setOpen(false)}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              <div className="mt-2 border-t border-slate-100 pt-3 space-y-2 pb-2">
                {showPhone && (
                  <a
                    href={`tel:${settings?.phone || '+251911203874'}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-navy
                      transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    <Phone size={15} className="text-accent" aria-hidden="true" />
                    {settings?.phone || '+251-907-257-134'}
                  </a>
                )}
                {showQuote && (
                  <Link
                    to="/contact"
                    onClick={() => setOpen(false)}
                    className="btn-primary w-full"
                  >
                    {quoteLabel}
                  </Link>
                )}
                <Link
                  to="/search"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-500 hover:text-accent transition-colors"
                >
                  <Search size={15} aria-hidden="true" /> Search
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
