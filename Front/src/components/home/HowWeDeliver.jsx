/**
 * HOW WE DELIVER — Construction Delivery Workflow
 * A visual process diagram showing the KASCON construction delivery methodology.
 * Only uses processes that accurately represent KASCON operations.
 * Data from settings.about.approach (CMS) or verified defaults.
 */
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FadeIn } from '../Motion';

/* Verified KASCON delivery stages */
const DEFAULT_STAGES = [
  {
    number: '01',
    title: 'Planning & Programme',
    desc: 'Site survey, design review, scheduling and resource allocation aligned to client programme.',
  },
  {
    number: '02',
    title: 'Procurement',
    desc: 'Material take-off, supplier selection, approval of shop drawings and bill-of-quantities sign-off.',
  },
  {
    number: '03',
    title: 'Mobilisation',
    desc: 'Plant, equipment and crew deployment with site establishment and HSEQ induction.',
  },
  {
    number: '04',
    title: 'Execution',
    desc: 'Controlled construction with senior engineers, surveyors and foremen maintaining site accountability.',
  },
  {
    number: '05',
    title: 'Quality Control',
    desc: 'Material testing, dimensional checks, mix-design verification and independent inspection.',
  },
  {
    number: '06',
    title: 'HSEQ Supervision',
    desc: 'Daily toolbox meetings, PPE enforcement, equipment safety checks and environmental controls.',
  },
  {
    number: '07',
    title: 'Progress Monitoring',
    desc: 'Earned-value tracking, photo documentation and regular client reporting against programme.',
  },
  {
    number: '08',
    title: 'Handover & Completion',
    desc: 'Defects inspection, as-built records, O&M documentation and client acceptance.',
  },
];

export default function HowWeDeliver({ settings }) {
  const approach = settings?.about?.approach || {};
  const kicker   = approach.kicker || 'How we deliver';
  const title    = approach.title  || 'A disciplined end-to-end delivery process.';

  /* Use CMS approach items if available, otherwise verified defaults */
  const stages = Array.isArray(approach.items) && approach.items.length > 0
    ? approach.items.map((it, i) => ({
        number: String(i + 1).padStart(2, '0'),
        title: it.title,
        desc: it.description,
      }))
    : DEFAULT_STAGES;

  return (
    <section aria-labelledby="how-we-deliver-heading" className="how-we-deliver section bg-white">
      <div className="container-pad">
        <FadeIn>
          <div className="max-w-3xl mb-12">
            <div className="flex items-center gap-3 mb-5">
              <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
              <p className="editorial-eyebrow" id="how-we-deliver-heading">{kicker}</p>
            </div>
            <h2 className="editorial-title">{title}</h2>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          {/* Desktop: horizontal numbered flow */}
          <div className="hidden lg:block">
            {/* Top row: steps 1–4 */}
            <DeliveryRow stages={stages.slice(0, 4)} direction="ltr" />
            {/* Connector */}
            <div className="relative my-0 flex justify-end pr-[calc(12.5%-1rem)]">
              <div className="h-12 w-0.5 bg-slate-200" />
            </div>
            {/* Bottom row: steps 5–8 reversed visual direction */}
            <DeliveryRow stages={stages.slice(4, 8)} direction="rtl" />
          </div>

          {/* Mobile: vertical list */}
          <div className="lg:hidden space-y-0 border-l-2 border-slate-100 pl-6">
            {stages.map((stage, i) => (
              <div key={`${stage.number}-${i}`} className="relative pb-8 last:pb-0">
                {/* Step marker */}
                <span className="absolute -left-[1.875rem] flex h-7 w-7 items-center justify-center rounded-sm bg-navy text-[10px] font-bold text-white">
                  {stage.number}
                </span>
                <h3 className="font-display text-base font-bold text-navy">{stage.title}</h3>
                {stage.desc && (
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{stage.desc}</p>
                )}
                {i < stages.length - 1 && (
                  <span aria-hidden="true" className="absolute -left-[1.125rem] bottom-0 top-8 w-0.5 bg-slate-100" />
                )}
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-12">
          <Link to="/about#approach" className="btn-ghost">
            Our delivery approach <ArrowRight size={15} />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

function DeliveryRow({ stages, direction }) {
  const ordered = direction === 'rtl' ? [...stages].reverse() : stages;
  return (
    <div className={`grid grid-cols-4 gap-0 ${direction === 'rtl' ? '' : ''}`}>
      {ordered.map((stage, i) => {
        const isLast = i === ordered.length - 1;
        return (
          <div key={`${stage.number}-${direction}`} className="relative group">
            {/* Connector line between cells */}
            {!isLast && (
              <div
                aria-hidden="true"
                className={`absolute top-[1.75rem] z-0 h-0.5 bg-slate-200 ${
                  direction === 'rtl' ? 'left-0 right-1/2' : 'left-1/2 right-0'
                }`}
              />
            )}

            {/* Cell */}
            <div className="relative z-10 px-4 pb-6 pt-1">
              {/* Number bubble */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center border border-slate-200 bg-white text-sm font-bold text-navy group-hover:border-accent group-hover:text-accent transition-colors duration-200">
                {stage.number}
              </div>
              <h3 className="font-display text-[15px] font-bold text-navy leading-snug">{stage.title}</h3>
              {stage.desc && (
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 max-w-[14ch] xl:max-w-none">
                  {stage.desc}
                </p>
              )}
            </div>

            {/* Arrow between cells */}
            {!isLast && (
              <div
                aria-hidden="true"
                className="absolute top-5 z-20 text-accent/60"
                style={{ [direction === 'rtl' ? 'left' : 'right']: 'calc(50% - 8px)' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d={direction === 'rtl' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
