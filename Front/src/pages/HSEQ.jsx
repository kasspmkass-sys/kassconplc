/**
 * HSEQ — Health, Safety, Environment & Quality
 * Verified KASCON HSEQ information only. No invented certifications.
 * Copy is CMS-driven (settings.hseqPage) with verified defaults as fallback;
 * licence/certificate cards come from the Certificate collection so a
 * certificate is only ever shown once an admin has published it.
 */
import { useEffect, useState } from 'react';
import { ArrowRight, Award as AwardIcon, FileDown } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { useSEO } from '../useSEO';
import { FadeIn, Stagger, item } from '../components/Motion';
import { motion } from 'framer-motion';
import api, { mediaUrl } from '../api';
import PageHeader from '../components/PageHeader';
import PageCta from '../components/PageCta';
import ProfileDownloadButton from '../components/ProfileDownloadButton';

const DEFAULT_SAFETY_COMMITMENTS = [
  {
    title: 'Daily Toolbox Meetings',
    desc: 'Every work shift begins with a structured toolbox meeting covering hazards, task requirements and safety procedures for the day.',
  },
  {
    title: 'PPE Enforcement',
    desc: 'Personal Protective Equipment is mandatory on all KASCON sites — hard hats, high-visibility vests, safety footwear and task-specific PPE.',
  },
  {
    title: 'Site Safety Inductions',
    desc: 'All workers and visitors receive a formal site safety induction before entering any active construction site.',
  },
  {
    title: 'Safety Training & Toolbox Talks',
    desc: 'Role-specific safety training is delivered before work starts and refreshed through toolbox talks, with attendance recorded for each session.',
  },
  {
    title: 'Equipment Safety Inspections',
    desc: 'Pre-use equipment checks and scheduled maintenance inspections ensure all plant and machinery is safe for operation.',
  },
  {
    title: 'Incident Reporting',
    desc: 'Structured incident and near-miss reporting system with investigation, corrective action and lessons-learned documentation.',
  },
  {
    title: 'Environmental Controls',
    desc: 'Responsible site practices including dust suppression, waste management and protection of neighbouring communities.',
  },
];

const DEFAULT_QUALITY_STEPS = [
  { number: '01', title: 'Material Inspection',     desc: 'All incoming materials are inspected and tested against approved specifications before acceptance.' },
  { number: '02', title: 'Mix Design Approval',     desc: 'Concrete mix designs are approved by qualified engineers before batching commences.' },
  { number: '03', title: 'Controlled Batching',     desc: 'Ready-mix produced to approved mix design with weigh-batching and water/cement ratio control.' },
  { number: '04', title: 'Slump Test',              desc: 'Workability tested at point of discharge before placement.' },
  { number: '05', title: 'Sampling',                desc: 'Cube samples taken per approved sampling frequency from each batch.' },
  { number: '06', title: 'Cube Testing',            desc: '7-day and 28-day cube tests carried out in the KASCON site laboratory.' },
  { number: '07', title: 'Strength Verification',   desc: 'Results verified against specified characteristic strength requirements.' },
  { number: '08', title: 'Quality Records',         desc: 'Full documentation of mix, test results and acceptance recorded and retained.' },
];

const DEFAULT_REGISTRATIONS = [
  { label: 'Contractor Grade',         value: 'Grade-1 General Contractor' },
  { label: 'Trade Licence',            value: 'Active' },
  { label: 'TIN Registration',         value: 'Active' },
  { label: 'VAT Registration',         value: 'Active' },
  { label: 'Environmental Compliance', value: 'Active' },
];

export default function HSEQ() {
  const { settings } = useSite();
  const [certificates, setCertificates] = useState([]);

  const p = settings?.hseqPage || {};

  const heroKicker = p.heroKicker || 'HSEQ';
  const heroTitle  = p.heroTitle  || 'Health, Safety, Environment & Quality.';
  const heroLead   = p.heroLead   ||
    'KASCON embeds a disciplined HSEQ system on every construction site — from daily toolbox meetings and PPE enforcement through material testing, mix-design verification and structured quality records.';

  const safetyKicker = p.safetyKicker || 'Safety system';
  const safetyTitle  = p.safetyTitle  || 'Site safety is non-negotiable.';
  const safetyLead   = p.safetyLead   ||
    'Every KASCON site operates under a structured safety programme — no exceptions.';

  const safetyCommitments = (Array.isArray(p.safetyCommitments) && p.safetyCommitments.length)
    ? p.safetyCommitments
    : DEFAULT_SAFETY_COMMITMENTS;

  const qualityKicker = p.qualityKicker || 'Concrete quality process';
  const qualityTitle  = p.qualityTitle  || 'From material inspection to quality record.';

  const qualitySteps = (Array.isArray(p.qualitySteps) && p.qualitySteps.length)
    ? p.qualitySteps
    : DEFAULT_QUALITY_STEPS;

  const regKicker = p.registrationsKicker || 'Compliance & registrations';
  const regTitle  = p.registrationsTitle  || 'Active licences and compliance status.';

  const registrations = (Array.isArray(p.registrations) && p.registrations.length)
    ? p.registrations
    : DEFAULT_REGISTRATIONS;

  const certKicker = p.certificatesKicker || 'Licences & certificates';
  const certTitle  = p.certificatesTitle  || 'Verified company certificates.';
  const certLead   = p.certificatesLead;

  const docKicker = p.documentsKicker || 'Public documents';
  const docTitle  = p.documentsTitle  || 'Approved company documents.';

  useSEO(
    'HSEQ',
    'KASCON Health, Safety, Environment and Quality system — site safety, material testing, mix design verification and compliance documentation.',
    'capabilities'
  );

  useEffect(() => {
    api.get('/certificates/public').then((r) => setCertificates(r.data || [])).catch(() => {});
  }, []);

  return (
    <>
      <PageHeader
        kicker={heroKicker}
        title={heroTitle}
        lead={heroLead}
        image={p.image || ''}
        alt={p.imageAlt || ''}
      />

      {/* Safety commitments */}
      <section className="section bg-white">
        <div className="container-pad">
          <FadeIn>
            <div className="max-w-3xl mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="editorial-eyebrow">{safetyKicker}</p>
              </div>
              <h2 className="section-title">{safetyTitle}</h2>
              <p className="mt-4 text-slate-500 text-base">{safetyLead}</p>
            </div>
          </FadeIn>

          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {safetyCommitments.map((c) => (
              <motion.div
                key={c.title}
                variants={item}
                className="border border-slate-200 bg-stone-50 p-7 transition-all duration-200 hover:border-accent/40 hover:bg-white"
              >
                <div aria-hidden="true" className="h-0.5 w-8 bg-accent mb-5" />
                <h3 className="font-display text-base font-bold text-navy">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{c.desc}</p>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Quality workflow */}
      <section className="section bg-navy text-white">
        <div className="container-pad">
          <FadeIn>
            <div className="max-w-3xl mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent">{qualityKicker}</p>
              </div>
              <h2 className="section-title !text-white">{qualityTitle}</h2>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            {/* Desktop: numbered grid */}
            <div className="hidden md:grid grid-cols-4 gap-0">
              {qualitySteps.map((step, i) => (
                <div
                  key={step.number || i}
                  className="border border-white/10 p-6 transition-colors duration-200 hover:border-accent/40 hover:bg-white/5"
                >
                  <p className="font-display text-3xl font-bold text-accent/40 mb-3">{step.number}</p>
                  <h3 className="font-display text-sm font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-white/55">{step.desc}</p>
                </div>
              ))}
            </div>

            {/* Mobile: vertical list */}
            <div className="md:hidden space-y-0 border-l-2 border-white/10 pl-6">
              {qualitySteps.map((step, i) => (
                <div key={step.number || i} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-[1.875rem] flex h-7 w-7 items-center justify-center bg-accent text-[10px] font-bold text-white">
                    {step.number}
                  </span>
                  <h3 className="font-display text-sm font-bold text-white">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/55">{step.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Registrations */}
      <section className="section bg-stone-50">
        <div className="container-pad">
          <FadeIn>
            <div className="grid lg:grid-cols-2 gap-14 items-start">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                  <p className="editorial-eyebrow">{regKicker}</p>
                </div>
                <h2 className="section-title mb-8">{regTitle}</h2>
                <dl className="space-y-3">
                  {registrations.map((r) => (
                    <div key={r.label} className="flex items-center justify-between border border-slate-200 bg-white px-5 py-4">
                      <dt className="text-sm font-semibold text-slate-600">{r.label}</dt>
                      <dd className="text-sm font-bold text-emerald-700">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Downloads */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                  <p className="editorial-eyebrow">{docKicker}</p>
                </div>
                <h2 className="section-title mb-8">{docTitle}</h2>
                <div className="space-y-3">
                  <div className="border border-slate-200 bg-white px-5 py-4">
                    <p className="text-sm font-bold text-navy mb-1">Company Profile</p>
                    <p className="text-xs text-slate-400 mt-0.5 mb-3">Kassa &amp; Sons Construction PLC — auto-generated PDF</p>
                    <ProfileDownloadButton variant="default" className="!text-xs !px-4 !py-2" />
                  </div>
                  <p className="text-xs text-slate-400 px-1">
                    Additional capability documents are available on request via our contact page.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Licences & certificates — only renders once an admin publishes records */}
      {certificates.length > 0 && (
        <section className="section bg-white">
          <div className="container-pad">
            <FadeIn>
              <div className="max-w-3xl mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                  <p className="editorial-eyebrow">{certKicker}</p>
                </div>
                <h2 className="section-title">{certTitle}</h2>
                {certLead && <p className="mt-4 text-slate-500 text-base">{certLead}</p>}
              </div>
            </FadeIn>

            <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {certificates.map((c) => {
                const href = c.file ? mediaUrl(c.file) : null;
                const Tag = href ? 'a' : 'div';
                return (
                  <motion.div key={c._id} variants={item}>
                    <Tag
                      {...(href ? { href, target: '_blank', rel: 'noreferrer' } : {})}
                      className={`group flex h-full flex-col border border-slate-200 bg-stone-50 p-6 transition-all duration-200 ${
                        href ? 'hover:border-accent/40 hover:bg-white hover:shadow-card' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-navy/5 text-navy transition-colors duration-200 group-hover:bg-accent group-hover:text-white">
                          <AwardIcon size={18} aria-hidden="true" />
                        </span>
                        {href && (
                          <FileDown
                            size={16}
                            className="shrink-0 text-slate-300 transition-colors duration-200 group-hover:text-accent"
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      <h3 className="mt-4 font-display text-base font-bold leading-snug text-navy">
                        {c.name}
                      </h3>

                      <dl className="mt-3 space-y-1.5 border-t border-slate-200 pt-3">
                        {c.issuer && (
                          <div className="flex gap-2 text-xs">
                            <dt className="w-16 shrink-0 font-bold uppercase tracking-wider text-slate-400">Issuer</dt>
                            <dd className="min-w-0 text-slate-600">{c.issuer}</dd>
                          </div>
                        )}
                        {c.number && (
                          <div className="flex gap-2 text-xs">
                            <dt className="w-16 shrink-0 font-bold uppercase tracking-wider text-slate-400">No.</dt>
                            <dd className="min-w-0 break-words text-slate-600">{c.number}</dd>
                          </div>
                        )}
                        {c.issuedYear && (
                          <div className="flex gap-2 text-xs">
                            <dt className="w-16 shrink-0 font-bold uppercase tracking-wider text-slate-400">Issued</dt>
                            <dd className="text-slate-600">{c.issuedYear}</dd>
                          </div>
                        )}
                        {c.validUntil && (
                          <div className="flex gap-2 text-xs">
                            <dt className="w-16 shrink-0 font-bold uppercase tracking-wider text-slate-400">Valid</dt>
                            <dd className="text-slate-600">{c.validUntil}</dd>
                          </div>
                        )}
                      </dl>

                      {c.description && (
                        <p className="mt-3 text-sm leading-relaxed text-slate-500">{c.description}</p>
                      )}

                      {href && (
                        <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-accent">
                          View certificate <ArrowRight size={11} aria-hidden="true" />
                        </span>
                      )}
                    </Tag>
                  </motion.div>
                );
              })}
            </Stagger>
          </div>
        </section>
      )}

      <PageCta
        kicker="Start a conversation"
        title="Need HSEQ documentation for a tender or project?"
        label="Contact KASCON"
      />
    </>
  );
}
