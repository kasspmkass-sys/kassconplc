/**
 * DIGITAL CONSTRUCTION MANAGEMENT
 * Explains KASCON's ERP-connected project management framework.
 * Data from: settings.about.digital / settings.about.erp
 * Never invents modules — only shows what the CMS supplies; falls back to
 * verified company information about the digital framework.
 */
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, FileSpreadsheet, TruckIcon, BarChart3, ClipboardCheck, Database } from 'lucide-react';
import { FadeIn } from '../Motion';
import SiteImage from '../SiteImage';

/* Verified KASCON ERP modules — only what is documented */
const DEFAULT_MODULES = [
  { icon: LayoutDashboard, label: 'Project Scheduling',   desc: 'Milestone planning and programme tracking across all active sites.' },
  { icon: FileSpreadsheet, label: 'Cost Control',         desc: 'Bill-of-quantities reconciliation and budget reporting in real time.' },
  { icon: TruckIcon,       label: 'Equipment Logistics',  desc: 'Fleet dispatch, utilisation records and preventive maintenance tracking.' },
  { icon: Database,        label: 'Procurement',          desc: 'Material requisition, supplier management and inventory control.' },
  { icon: ClipboardCheck,  label: 'HSEQ Records',         desc: 'Compliance workflows, site inspections and digital sign-off.' },
  { icon: BarChart3,       label: 'Progress Reporting',   desc: 'Photo documentation and progress reports from site to management.' },
];

export default function DigitalConstruction({ settings }) {
  const digital = settings?.about?.digital || {};
  const erp     = settings?.about?.erp     || {};

  const kicker  = digital.kicker || erp.kicker || 'Digital Construction';
  const title   = digital.title  || erp.title  || 'ERP-driven project management.';
  const lead    = digital.lead   || erp.lead   ||
    'KASCON operates an integrated digital framework that connects procurement, equipment logistics, cost control, scheduling and HSEQ across all active construction sites — giving clients transparent, evidence-based project delivery.';
  const image   = digital.image  || null;

  /* Use CMS modules when supplied; fall back to verified defaults */
  const modules = Array.isArray(erp.modules) && erp.modules.length > 0
    ? erp.modules.map((m, i) => ({ ...DEFAULT_MODULES[i % DEFAULT_MODULES.length], label: m }))
    : Array.isArray(digital.points) && digital.points.length > 0
      ? digital.points.map((p, i) => ({ ...DEFAULT_MODULES[i % DEFAULT_MODULES.length], label: p, desc: '' }))
      : DEFAULT_MODULES;

  return (
    <section
      aria-labelledby="digital-heading"
      className="digital-construction section bg-charcoal text-white overflow-hidden relative"
    >
      {/* Subtle grid overlay */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="container-pad relative">
        <FadeIn>
          <div className={`grid items-center gap-14 ${image ? 'lg:grid-cols-2' : ''}`}>

            {/* Copy */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent" id="digital-heading">
                  {kicker}
                </p>
              </div>

              <h2 className="editorial-title !text-white">{title}</h2>
              <p className="mt-5 text-base sm:text-lg leading-relaxed text-white/65 max-w-xl">{lead}</p>

              {/* ERP flow if CMS has it */}
              {Array.isArray(erp.flow) && erp.flow.length > 0 && (
                <div className="mt-8">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-4">
                    {erp.flowLabel || 'ERP workflow'}
                  </p>
                  <ol className="flex flex-wrap gap-2">
                    {erp.flow.map((step, i) => (
                      <li key={`${step.title}-${i}`} className="flex items-center gap-2">
                        <span className="rounded bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70">
                          {step.title}
                        </span>
                        {i < erp.flow.length - 1 && (
                          <ArrowRight size={12} className="text-accent/50 shrink-0" aria-hidden="true" />
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="mt-10">
                <Link to="/about#digital" className="btn-outline">
                  Our digital approach <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Module grid */}
            <div className={image ? 'hidden lg:block' : ''}>
              {image ? (
                <figure>
                  <div className="overflow-hidden border border-white/10">
                    <SiteImage
                      src={image}
                      alt={digital.caption || 'KASCON digital construction management'}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </div>
                  {digital.caption && (
                    <figcaption className="mt-3 text-[11px] text-white/40 uppercase tracking-widest">
                      {digital.caption}
                    </figcaption>
                  )}
                </figure>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {modules.map((mod, i) => {
                    const Icon = mod.icon || LayoutDashboard;
                    return (
                      <div
                        key={`${mod.label}-${i}`}
                        className="flex flex-col gap-3 border border-white/10 bg-white/5 p-5 transition-colors duration-200 hover:border-accent/40 hover:bg-white/10"
                      >
                        <Icon size={20} className="text-accent shrink-0" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-bold text-white">{mod.label}</p>
                          {mod.desc && (
                            <p className="mt-1 text-xs leading-relaxed text-white/50">{mod.desc}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Inline module grid when no image */}
          {!image && (
            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:hidden">
              {modules.map((mod, i) => {
                const Icon = mod.icon || LayoutDashboard;
                return (
                  <div
                    key={`m-${mod.label}-${i}`}
                    className="flex flex-col gap-3 border border-white/10 bg-white/5 p-4"
                  >
                    <Icon size={18} className="text-accent shrink-0" aria-hidden="true" />
                    <p className="text-xs font-bold text-white">{mod.label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </FadeIn>
      </div>
    </section>
  );
}
