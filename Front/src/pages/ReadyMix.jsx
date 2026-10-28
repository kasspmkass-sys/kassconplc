/**
 * READY-MIX CONCRETE
 * Verified KASCON batching plant information only.
 * Request form connects to existing /contact backend endpoint.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { useSite } from '../context/SiteContext';
import { useSEO } from '../useSEO';
import { FadeIn } from '../components/Motion';
import PageHeader from '../components/PageHeader';

/* Verified concrete grades from KASCON batching plant operations */
const DEFAULT_GRADES = ['C-15', 'C-20', 'C-25', 'C-30', 'C-35'];

/* Verified KASCON batching plant capabilities — only documented facts */
const DEFAULT_PLANT_FACTS = [
  { label: 'Concrete Grades', value: 'C-15 to C-35' },
  { label: 'Transit Mixer Fleet', value: 'Multiple units' },
  { label: 'Pump Availability', value: 'On request' },
  { label: 'Laboratory Testing', value: 'Slump test · Cube test · Strength verification' },
  { label: 'Mix Design', value: 'Controlled batching per approved mix design' },
  { label: 'Quality Records', value: 'Full QA documentation' },
];

const DEFAULT_QUALITY_STEPS = [
  'Material Inspection',
  'Mix Design Approval',
  'Controlled Batching',
  'Slump Test',
  'Sampling',
  'Cube Test',
  'Strength Verification',
  'Quality Record',
];

export default function ReadyMix() {
  const { settings } = useSite();
  const [form, setForm] = useState({
    projectName: '', location: '', grade: '', quantity: '',
    castingDate: '', requiredTime: '', pumpRequired: 'No',
    name: '', email: '', phone: '', specialRequirement: '',
  });
  const [sending, setSending] = useState(false);

  const p = settings?.readyMixPage || {};

  const heroKicker = p.heroKicker || 'Ready-Mix Concrete';
  const heroTitle  = p.heroTitle  || 'Batching plant with full QA documentation.';
  const heroLead   = p.heroLead   ||
    "KASCON's concrete batching plant supplies C-15 to C-35 ready-mix concrete for building, civil and energy projects — with transit mixers, pump options and complete quality records.";

  const plantKicker = p.plantKicker || 'Plant capabilities';
  const plantTitle  = p.plantTitle  || 'Controlled batching. Verified quality.';
  const plantFacts  = (Array.isArray(p.plantFacts) && p.plantFacts.length)
    ? p.plantFacts
    : DEFAULT_PLANT_FACTS;

  const capacityKicker = p.capacityKicker;
  const capacityTitle  = p.capacityTitle;
  const capacityFacts  = (Array.isArray(p.capacityFacts) ? p.capacityFacts : [])
    .filter((f) => f && f.label && f.value);

  const grades = (Array.isArray(p.concreteGrades) && p.concreteGrades.length)
    ? p.concreteGrades
    : DEFAULT_GRADES;

  const qualityKicker = p.qualityKicker || 'Quality control process';
  const qualityTitle  = p.qualityTitle  || 'From material inspection to quality record.';
  const qualitySteps  = (Array.isArray(p.qualitySteps) && p.qualitySteps.length)
    ? p.qualitySteps
    : DEFAULT_QUALITY_STEPS;

  const formKicker = p.formKicker || 'Request a quotation';
  const formTitle  = p.formTitle  || 'Ready-Mix Concrete Request';
  const formLead   = p.formLead   ||
    'Complete this form and our team will respond with availability, pricing and programme.';
  const successToast = p.successToast || 'Your request has been sent. We will respond shortly.';
  const failToast    = p.failToast    || 'Failed to send. Please try again or call us directly.';

  useSEO(
    'Ready-Mix Concrete',
    'KASCON ready-mix concrete supply — batching plant with C-15 to C-35 grades, transit mixers, pumps and full QA documentation.',
    'capabilities'
  );

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      // Post to the dedicated Ready-Mix request endpoint (stored separately from messages)
      await api.post('/ready-mix-requests', {
        projectName:        form.projectName,
        location:           form.location,
        grade:              form.grade,
        quantity:           form.quantity,
        castingDate:        form.castingDate,
        requiredTime:       form.requiredTime,
        pumpRequired:       form.pumpRequired,
        contactPerson:      form.name,
        phone:              form.phone,
        email:              form.email,
        specialRequirement: form.specialRequirement,
      });
      toast.success(successToast);
      setForm({
        projectName: '', location: '', grade: '', quantity: '',
        castingDate: '', requiredTime: '', pumpRequired: 'No',
        name: '', email: '', phone: '', specialRequirement: '',
      });
    } catch {
      toast.error(failToast);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader
        kicker={heroKicker}
        title={heroTitle}
        lead={heroLead}
        image={p.image}
        alt={p.imageAlt}
      />

      {/* Plant facts */}
      <section className="section bg-white">
        <div className="container-pad">
          <FadeIn>
            <div className="grid lg:grid-cols-2 gap-14 items-start">

              {/* Plant specs */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                  <p className="editorial-eyebrow">{plantKicker}</p>
                </div>
                <h2 className="section-title mb-8">{plantTitle}</h2>

                <dl className="grid sm:grid-cols-2 gap-4">
                  {plantFacts.map((f) => (
                    <div key={f.label} className="border border-slate-200 p-5 bg-stone-50">
                      <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{f.label}</dt>
                      <dd className="text-sm font-semibold text-navy">{f.value}</dd>
                    </div>
                  ))}
                </dl>

                {/* Production capacity — only shown once figures are published */}
                {capacityFacts.length > 0 && (
                  <div className="mt-8">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                      {capacityKicker || 'Production capacity'}
                    </p>
                    {capacityTitle && (
                      <p className="mb-4 text-sm leading-relaxed text-slate-600">{capacityTitle}</p>
                    )}
                    <dl className="grid sm:grid-cols-2 gap-4">
                      {capacityFacts.map((f) => (
                        <div key={f.label} className="border border-slate-200 bg-white p-5">
                          <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                            {f.label}
                          </dt>
                          <dd className="font-display text-lg font-bold text-navy">{f.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Concrete grades */}
                <div className="mt-8">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Available concrete grades</p>
                  <div className="flex flex-wrap gap-2">
                    {grades.map((g) => (
                      <span key={g} className="inline-flex items-center bg-navy text-white px-4 py-2 text-sm font-bold">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* QC workflow */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                  <p className="editorial-eyebrow">{qualityKicker}</p>
                </div>
                <h2 className="section-title mb-8">{qualityTitle}</h2>

                <ol className="space-y-0 border-l-2 border-slate-100 pl-6">
                  {qualitySteps.map((step, i) => (
                    <li key={step} className="relative pb-5 last:pb-0">
                      <span className="absolute -left-[1.875rem] flex h-7 w-7 items-center justify-center bg-navy text-[10px] font-bold text-white">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className="font-semibold text-navy text-sm pt-0.5">{step}</p>
                      {i < qualitySteps.length - 1 && (
                        <span aria-hidden="true" className="absolute -left-[1.125rem] top-8 bottom-0 w-0.5 bg-slate-100" />
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Request quotation form */}
      <section id="request" className="section bg-stone-50 border-t-2 border-accent scroll-mt-20">
        <div className="container-pad">
          <FadeIn>
            <div className="max-w-3xl mb-10">
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="editorial-eyebrow">{formKicker}</p>
              </div>
              <h2 className="section-title">{formTitle}</h2>
              <p className="mt-3 text-slate-500 text-sm">{formLead}</p>
            </div>

            <form onSubmit={submit} className="bg-white border border-slate-200 p-7 sm:p-10 max-w-3xl">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label htmlFor="rm-project" className="label">Project Name *</label>
                  <input id="rm-project" className="input" name="projectName" required value={form.projectName} onChange={onChange} />
                </div>
                <div>
                  <label htmlFor="rm-location" className="label">Location *</label>
                  <input id="rm-location" className="input" name="location" required value={form.location} onChange={onChange} />
                </div>
                <div>
                  <label htmlFor="rm-grade" className="label">Concrete Grade *</label>
                  <select id="rm-grade" className="input" name="grade" required value={form.grade} onChange={onChange}>
                    <option value="">Select grade…</option>
                    {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                    <option value="Other">Other (specify in requirements)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="rm-qty" className="label">Quantity (m³) *</label>
                  <input id="rm-qty" className="input" name="quantity" required type="number" min="1" value={form.quantity} onChange={onChange} />
                </div>
                <div>
                  <label htmlFor="rm-date" className="label">Casting Date</label>
                  <input id="rm-date" className="input" name="castingDate" type="date" value={form.castingDate} onChange={onChange} />
                </div>
                <div>
                  <label htmlFor="rm-time" className="label">Required Delivery Time</label>
                  <input id="rm-time" className="input" name="requiredTime" placeholder="e.g. 06:00 AM" value={form.requiredTime} onChange={onChange} />
                </div>
                <div>
                  <label htmlFor="rm-pump" className="label">Pump Required</label>
                  <select id="rm-pump" className="input" name="pumpRequired" value={form.pumpRequired} onChange={onChange}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="To be confirmed">To be confirmed</option>
                  </select>
                </div>

                <div className="sm:col-span-2 border-t border-slate-200 pt-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Contact details</p>
                </div>

                <div>
                  <label htmlFor="rm-name" className="label">Contact Person *</label>
                  <input id="rm-name" className="input" name="name" required value={form.name} onChange={onChange} />
                </div>
                <div>
                  <label htmlFor="rm-phone" className="label">Phone *</label>
                  <input id="rm-phone" className="input" name="phone" required value={form.phone} onChange={onChange} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="rm-email" className="label">Email</label>
                  <input id="rm-email" className="input" type="email" name="email" value={form.email} onChange={onChange} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="rm-special" className="label">Special Requirements</label>
                  <textarea id="rm-special" className="input min-h-[100px]" name="specialRequirement" value={form.specialRequirement} onChange={onChange} />
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-accent disabled:opacity-55 disabled:pointer-events-none"
                >
                  {sending ? 'Sending…' : 'Submit Request'} <Send size={14} />
                </button>
                <Link to="/contact" className="btn-ghost">General enquiry</Link>
              </div>
            </form>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
