/**
 * CAPABILITIES — Capacity & Resources
 * Shows KASCON's physical plant: batching, crushing, steel fab, fleet, HSEQ.
 * CMS-driven where available; falls back to verified company data only.
 */
import { Factory, Truck, Wrench, Warehouse, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSEO } from '../useSEO';
import { useSite } from '../context/SiteContext';
import { FadeIn, Stagger, item } from '../components/Motion';
import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import PageCta from '../components/PageCta';

const UNIT_ICONS = {
  factory:   Factory,
  warehouse: Warehouse,
  wrench:    Wrench,
  truck:     Truck,
};
const UNIT_ICON_ORDER = ['factory', 'warehouse', 'wrench', 'truck'];

/* Stable DOM id for a capability unit.
   Prefers the CMS-controlled `anchor` so the Navbar/Footer deep links
   (/capabilities#concrete-batching) keep working when a title is edited.
   Falls back to a title slug for records created before `anchor` existed. */
const slugify = (value) =>
  String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const unitAnchor = (unit, index) => {
  const anchor = slugify(unit.anchor);
  return anchor || slugify(unit.title) || `unit-${index}`;
};

/* Verified KASCON capability units */
const DEFAULT_UNITS = [
  {
    id:    'concrete-batching',
    icon:  Factory,
    title: 'Concrete Batching Plant',
    desc:  'Industrial ready-mix with documented transit mixers, vibrators and generators. Typical grades C-20 to C-30. Supplies both internal projects and external clients.',
    specs: ['Ready-mix concrete supply', 'C-20 to C-30 grades', 'Transit mixer fleet', 'Concrete pump available'],
  },
  {
    id:    'stone-crushing',
    icon:  Warehouse,
    title: 'Stone Crushing Plant',
    desc:  'Quarry and aggregate production — primary jaw crushing, secondary screening and dispatch for company projects and external supply.',
    specs: ['Primary jaw crusher', 'Aggregate screening', 'Various sizes produced', 'Stock and dispatch facility'],
  },
  {
    id:    'steel-fabrication',
    icon:  Wrench,
    title: 'Steel Fabrication',
    desc:  'Structural frames, canopies, shop and site welding aligned to EBCS / AISC practice and AWS D1.1 procedures.',
    specs: ['Structural steel fabrication', 'Canopy & frame works', 'Shop & site welding', 'EBCS / AISC standards'],
  },
  {
    id:    'fleet-auto-shop',
    icon:  Truck,
    title: 'Fleet & Auto Shop',
    desc:  'Owned transit mixers, loaders, dump trucks, mobile crane and in-house preventive maintenance for reliable uptime across all sites.',
    specs: ['Transit mixer fleet', 'Heavy earthmoving plant', 'Dump trucks & loaders', 'Mobile crane', 'In-house maintenance'],
  },
];

/* Verified KASCON HSEQ commitments — no invented certifications */
const DEFAULT_HSEQ = [
  {
    title: 'Safety Management System',
    description: 'Structured safety programme with daily toolbox meetings, PPE enforcement, site inductions and incident reporting across all active projects.',
  },
  {
    title: 'Quality Assurance',
    description: 'Material testing, mix-design verification, dimensional checks and documented quality records at every stage of construction.',
  },
  {
    title: 'Environmental Controls',
    description: 'Responsible site practices protecting employees, neighbouring communities and the environment during construction.',
  },
  {
    title: 'Registrations & Compliance',
    description: 'Grade-1 contractor licence, trade licence, TIN, VAT and environmental compliance — all active and current.',
  },
];

export default function Capabilities() {
  const { settings }     = useSite();
  const capabilitiesPage = settings?.capabilitiesPage || {};

  const heroKicker = capabilitiesPage.heroKicker || 'Capabilities';
  const heroTitle  = capabilitiesPage.heroTitle  || 'Owned capacity & physical resources.';
  const heroLead   = capabilitiesPage.heroLead   ||
    'KASCON operates its own concrete batching plant, stone crushing plant, steel fabrication workshop, heavy fleet and auto shop — delivering self-performed capacity that most contractors must outsource.';
  const whyKicker  = capabilitiesPage.whyKicker  || 'Why clients choose us';
  const whyTitle   = capabilitiesPage.whyTitle   || 'Self-performed plant & fabrication.';

  const unitItems = capabilitiesPage.units?.length
    ? capabilitiesPage.units.map((u, i) => ({
        id:    unitAnchor(u, i),
        icon:  UNIT_ICONS[u.icon] || UNIT_ICONS[UNIT_ICON_ORDER[i % UNIT_ICON_ORDER.length]],
        title: u.title,
        desc:  u.description,
        specs: Array.isArray(u.specs) ? u.specs.filter(Boolean) : [],
      }))
    : DEFAULT_UNITS;

  const hseqItems = capabilitiesPage.hseq?.length
    ? capabilitiesPage.hseq.map((h) => ({ title: h.title, description: h.description }))
    : DEFAULT_HSEQ;

  useSEO(
    'Capabilities',
    'KASCON owns concrete batching plant, stone crushing plant, steel fabrication workshop and heavy fleet — Grade-1 self-performed capacity.',
    'capabilities'
  );

  return (
    <>
      <PageHeader kicker={heroKicker} title={heroTitle} lead={heroLead} />

      {/* ── Capability units ── */}
      <section id="why-us" className="section bg-white scroll-mt-20">
        <div className="container-pad">
          <FadeIn>
            <div className="max-w-3xl mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="editorial-eyebrow">{whyKicker}</p>
              </div>
              <h2 className="section-title">{whyTitle}</h2>
            </div>
          </FadeIn>

          <Stagger className="grid md:grid-cols-2 gap-5">
            {unitItems.map((u) => {
              const Icon = u.icon || Factory;
              return (
                <motion.div
                  key={u.id || u.title}
                  id={u.id}
                  variants={item}
                    className="group relative flex flex-col border border-slate-200 bg-white p-7
                      transition-all duration-200 hover:border-accent/40 hover:shadow-elevated hover:-translate-y-0.5
                      scroll-mt-24"
                >
                  {/* Top accent bar */}
                  <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-slate-100 group-hover:bg-accent transition-colors" />

                  <div className="flex items-start gap-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-navy text-white transition-colors duration-200 group-hover:bg-accent">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-bold text-navy">{u.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">{u.desc}</p>
                    </div>
                  </div>

                  {u.specs?.length > 0 && (
                    <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-5">
                      {u.specs.map((spec) => (
                        <li key={spec} className="flex items-center gap-2 text-xs text-slate-500">
                          <span aria-hidden="true" className="h-0.5 w-3 shrink-0 bg-accent" />
                          {spec}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ── Quick links to specialist pages ── */}
      <section className="section-compact bg-stone-50">
        <div className="container-pad">
          <FadeIn>
            <div className="flex items-center gap-3 mb-8">
              <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
              <p className="editorial-eyebrow">Specialist capability pages</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { to: '/ready-mix',  label: 'Ready-Mix Concrete',     desc: 'Batching plant, grades, supply capacity, request a quote.' },
                { to: '/aggregate',  label: 'Aggregate Supply',        desc: 'Crusher specifications, sizes, stock and delivery.' },
                { to: '/equipment',  label: 'Equipment & Fleet',       desc: 'Full equipment gallery — earthmoving, transport, lifting.' },
                { to: '/hseq',       label: 'HSEQ System',            desc: 'Quality, safety, environmental controls and laboratory.' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group flex flex-col border border-slate-200 bg-white p-6
                    transition-all duration-200 hover:border-accent/40 hover:shadow-card hover:-translate-y-0.5
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <div aria-hidden="true" className="h-0.5 bg-slate-100 group-hover:bg-accent transition-colors duration-200 -mx-6 -mt-6 mb-4" />
                  <h3 className="font-display text-base font-bold text-navy group-hover:text-accent transition-colors duration-200">
                    {link.label}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-500">{link.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-accent">
                    View <ArrowRight size={11} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── HSEQ ── */}
      <section id="hseq" className="section bg-navy text-white scroll-mt-20">
        <div className="container-pad">
          <FadeIn>
            <div className="flex items-center gap-3 mb-10">
              <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent">HSEQ</p>
            </div>
            <h2 className="section-title !text-white mb-10">Quality, safety & compliance.</h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-5">
            {hseqItems.map((h) => (
              <FadeIn key={h.title}>
                <div className="border border-white/10 p-7 transition-colors duration-200 hover:border-accent/40">
                  <div aria-hidden="true" className="h-0.5 w-8 bg-accent mb-5" />
                  <h3 className="font-display text-lg font-bold text-white">{h.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">{h.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.2} className="mt-10">
            <Link to="/hseq" className="btn-outline">
              Full HSEQ system <ArrowRight size={15} />
            </Link>
          </FadeIn>
        </div>
      </section>

      <PageCta
        kicker="Discuss your project"
        title="Need capacity, plant or a Grade-1 construction partner?"
        label="Request a consultation"
      />
    </>
  );
}
