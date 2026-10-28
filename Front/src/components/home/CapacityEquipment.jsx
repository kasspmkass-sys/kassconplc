/**
 * PRODUCTION & EQUIPMENT CAPACITY — homepage section 5.
 *
 * Combines what used to be two overlapping sections into one block:
 *   1. the self-perform production units (batching plant, crusher, steel shop,
 *      fleet & auto shop), and
 *   2. the real owned fleet, read from the Equipment collection.
 * Equipment appears exactly once on the homepage — no duplicate cards.
 *
 * CMS   : settings.home.capacity (kicker/title/subtitle/image/ctaLabel)
 *          settings.home.equipment (owned-fleet sub-block copy)
 *          settings.capabilitiesPage.units (self-perform statements)
 * Data  : GET /equipment/public  (fetched once by the page, passed as `equipment`)
 * Admin : /admin/home (copy) · /admin/capabilities (units) · /admin/equipment (fleet)
 *
 * No hardcoded numbers: unit counts are summed from the published Equipment
 * records, and every figure shown therefore comes from the CMS.
 * Reserves its space with skeletons while loading so the page never jumps.
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Factory, Layers, Wrench, Truck, Cog, Warehouse } from 'lucide-react';
import { FadeIn, Stagger, item } from '../Motion';
import { motion } from 'framer-motion';
import SiteImage from '../SiteImage';

/* Fallback capability units, used only when the CMS has none. */
const DEFAULT_UNITS = [
  { title: 'Concrete Batching Plant', description: 'Industrial ready-mix production with our own transit mixer fleet and pump available.' },
  { title: 'Stone Crushing Plant',    description: 'Primary crushing, screening and aggregate dispatch for our own and external projects.' },
  { title: 'Steel Fabrication',       description: 'Structural frames, canopies, shop and site welding to recognised codes.' },
  { title: 'Fleet & Auto Shop',       description: 'Owned earthmoving and haulage equipment, maintained in our in-house workshop.' },
];

const UNIT_ICONS = [Factory, Layers, Wrench, Truck];

const CAT_ICONS = {
  Earthmoving: Truck,
  Transport: Truck,
  Concrete: Factory,
  Lifting: Warehouse,
  Crushing: Layers,
  'Support Equipment': Cog,
};

const MAX_PHOTOS = 4;

export default function CapacityEquipment({ settings, equipment = [], loading = false }) {
  const cap     = settings?.home?.capacity   || {};
  const eqSec   = settings?.home?.equipment  || {};
  const capPage = settings?.capabilitiesPage || {};

  const kicker   = cap.kicker   || 'Production & equipment capacity';
  const title    = cap.title    || 'Self-performed plant, equipment & fleet.';
  const subtitle =
    cap.subtitle ||
    'KASCON owns and operates its own batching plant, stone crusher, steel workshop, transit mixer fleet and heavy equipment — direct delivery control, without depending on hired-in plant.';
  const ctaLabel = cap.ctaLabel || 'View capabilities';
  const image    = cap.image    || null;
  const imageAlt = cap.imageAlt || 'KASCON plant and equipment operations';

  /* Owned-fleet sub-block — edited under Home Admin → Our Equipment. */
  const fleetKicker = eqSec.kicker   || 'Owned fleet';
  const fleetCta    = eqSec.ctaLabel || 'Equipment gallery';
  const fleetImage  = eqSec.image    || image;
  const fleetAlt    = eqSec.imageAlt || imageAlt;

  const units = capPage.units?.length ? capPage.units : DEFAULT_UNITS;

  /* Fleet grouped by category, with counts summed from the CMS records. */
  const groups = [];
  const seen = new Map();
  for (const eq of equipment) {
    if (!eq) continue;
    const key = eq.category || 'Support Equipment';
    if (!seen.has(key)) {
      const g = { category: key, items: [], units: 0 };
      seen.set(key, g);
      groups.push(g);
    }
    const g = seen.get(key);
    g.items.push(eq);
    g.units += Number(eq.quantity) || 0;
  }
  const totalUnits = groups.reduce((sum, g) => sum + g.units, 0);
  const photos = equipment.filter((eq) => eq && eq.image).slice(0, MAX_PHOTOS);

  /* ── Loading: reserve the block's space so nothing shifts ─────────────── */
  if (loading) {
    return (
      <section aria-busy="true" aria-label="Production and equipment capacity" className="section bg-white">
        <div className="container-pad">
          <div className="mb-10 max-w-2xl space-y-4 lg:mb-12">
            <div className="skeleton h-3 w-40" />
            <div className="skeleton h-10 w-full" />
            <div className="skeleton h-4 w-full max-w-2xl" />
          </div>
          {/* self-perform units */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-slate-200 p-5">
                <div className="skeleton h-10 w-10" />
                <div className="skeleton mt-4 h-4 w-2/3" />
                <div className="skeleton mt-2 h-3 w-full" />
                <div className="skeleton mt-1.5 h-3 w-5/6" />
              </div>
            ))}
          </div>
          {/* owned fleet */}
          <div className="mt-14 border-t border-slate-200 pt-8 lg:mt-16">
            <div className="skeleton h-3 w-32" />
            <div className="skeleton mt-3 h-4 w-3/4 max-w-lg" />
            <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12">
              <div className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:col-span-7">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3.5 bg-white p-4 sm:p-5">
                    <div className="skeleton h-9 w-9 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3.5 w-2/3" />
                      <div className="skeleton h-3 w-1/2" />
                      <div className="skeleton h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 lg:col-span-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border border-slate-200">
                    <div className="skeleton aspect-[4/3] w-full" />
                    <div className="px-3 py-2"><div className="skeleton h-3 w-2/3" /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const showFleet = groups.length > 0;

  return (
    <section
      aria-labelledby="capacity-heading"
      className="section bg-white"
    >
      <div className="container-pad">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <FadeIn>
          <div className="grid items-end gap-6 lg:grid-cols-2 lg:gap-12 mb-10 lg:mb-12">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="editorial-eyebrow" id="capacity-heading">{kicker}</p>
              </div>
              <h2 className="editorial-title">{title}</h2>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600 max-w-xl">
                {subtitle}
              </p>
            </div>
            <div className="lg:text-right">
              <Link to="/capabilities" className="btn-ghost">
                {ctaLabel} <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </FadeIn>

        {/* ── Self-perform production units ─────────────────────────────── */}
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {units.slice(0, 4).map((u, i) => {
            const Icon = UNIT_ICONS[i % UNIT_ICONS.length];
            return (
              <motion.article
                key={`${u.title}-${i}`}
                variants={item}
                className="group relative flex flex-col border border-slate-200 bg-stone-50 p-5
                  transition-all duration-200 hover:border-accent/35 hover:bg-white hover:shadow-card"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-0.5 bg-accent/20 transition-colors duration-200 group-hover:bg-accent"
                />
                <span className="flex h-10 w-10 items-center justify-center bg-navy/5 text-navy
                  transition-all duration-200 group-hover:bg-navy group-hover:text-white">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-[15px] font-bold leading-snug text-navy
                  transition-colors duration-200 group-hover:text-accent">
                  {u.title}
                </h3>
                {u.description && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{u.description}</p>
                )}
              </motion.article>
            );
          })}
        </Stagger>

        {/* ── Owned fleet — the real equipment records ──────────────────── */}
        {showFleet && (
          <FadeIn delay={0.1} className="mt-14 lg:mt-16">
            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-200 pt-8">
              <div>
                <p className="editorial-eyebrow">{fleetKicker}</p>
                <p className="mt-2 text-sm text-slate-500 max-w-lg">
                  {eqSec.subtitle || (
                    <>
                      Every machine below is KASCON-owned and maintained in our own auto shop
                      {totalUnits > 0 ? ` — ${totalUnits} units on the register.` : '.'}
                    </>
                  )}
                </p>
              </div>
              <Link to="/equipment" className="btn-ghost shrink-0">
                {fleetCta} <ArrowRight size={15} />
              </Link>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12 items-start">

              {/* Fleet ledger by category */}
              <ul className="lg:col-span-7 grid gap-px self-start border border-slate-200 bg-slate-200 sm:grid-cols-2">
                {groups.map((g) => {
                  const Icon = CAT_ICONS[g.category] || Cog;
                  return (
                    <li key={g.category} className="flex items-start gap-3.5 bg-white p-4 sm:p-5">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-navy/5 text-accent">
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-navy">{g.category}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {g.items.length} {g.items.length === 1 ? 'type' : 'types'}
                          {g.units > 0 ? ` · ${g.units} ${g.units === 1 ? 'unit' : 'units'}` : ''}
                        </p>
                        <ul className="mt-2 space-y-0.5">
                          {g.items.slice(0, 3).map((eq, i) => (
                            <li key={eq._id || i} className="truncate text-xs text-slate-500">
                              {eq.name}
                              {eq.model ? <span className="text-slate-400"> · {eq.model}</span> : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Fleet photography — real CMS images only */}
              <div className="lg:col-span-5">
                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {photos.map((eq) => (
                      <figure
                        key={eq._id}
                        className="group overflow-hidden border border-slate-200 bg-white"
                      >
                        <SiteImage
                          src={eq.image}
                          alt={eq.name}
                          className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <figcaption className="px-3 py-2">
                          <p className="truncate text-[11px] font-semibold text-navy">{eq.name}</p>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : fleetImage ? (
                  <figure className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -right-2 -bottom-2 z-0 block h-full w-full border border-accent/20"
                    />
                    <div className="relative z-10 overflow-hidden border border-slate-200">
                      <SiteImage
                        src={fleetImage}
                        alt={fleetAlt}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </div>
                  </figure>
                ) : null}
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  );
}
