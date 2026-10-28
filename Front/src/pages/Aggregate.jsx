/**
 * AGGREGATE SUPPLY
 * Verified KASCON stone crushing plant information only.
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

/* Verified aggregate sizes from KASCON crushing plant */
const DEFAULT_SIZES = [
  '¾" (19mm) — Coarse aggregate',
  '½" (12.5mm) — Medium aggregate',
  '¼" (6mm) — Fine aggregate / chips',
  'Crusher dust — Fine fill',
  'River sand — Where available',
];

/* Verified plant capabilities */
const DEFAULT_PLANT_FACTS = [
  { label: 'Crusher type',         value: 'Primary jaw crusher' },
  { label: 'Screening',            value: 'Multi-deck aggregate screening' },
  { label: 'Aggregate sizes',      value: '¼" to ¾" and crusher dust' },
  { label: 'Stock facility',       value: 'On-site stockpile for immediate dispatch' },
  { label: 'Loading',              value: 'Front-end loader dispatch' },
  { label: 'Transport',            value: 'Own dump truck fleet' },
];

export default function Aggregate() {
  const [form, setForm] = useState({
    projectName: '', location: '', size: '', quantity: '',
    deliveryDate: '', name: '', phone: '', email: '', notes: '',
  });
  const [sending, setSending] = useState(false);

  const { settings } = useSite();
  const p = settings?.aggregatePage || {};

  const heroKicker = p.heroKicker || 'Aggregate Supply';
  const heroTitle  = p.heroTitle  || 'Quarry & stone crushing plant.';
  const heroLead   = p.heroLead   ||
    "KASCON's stone crushing plant produces coarse, medium and fine aggregates for building, road and civil engineering projects — with own transport fleet and stock facility for prompt dispatch.";

  const plantKicker = p.plantKicker || 'Plant specifications';
  const plantTitle  = p.plantTitle  || 'Primary crushing through to dispatch.';
  const plantFacts  = (Array.isArray(p.plantFacts) && p.plantFacts.length)
    ? p.plantFacts
    : DEFAULT_PLANT_FACTS;

  const capacityKicker = p.capacityKicker;
  const capacityTitle  = p.capacityTitle;
  const capacityFacts  = (Array.isArray(p.capacityFacts) ? p.capacityFacts : [])
    .filter((f) => f && f.label && f.value);

  const products = (Array.isArray(p.products) ? p.products : [])
    .filter((x) => x && x.title);

  const sizes = (Array.isArray(p.aggregateSizes) && p.aggregateSizes.length)
    ? p.aggregateSizes
    : DEFAULT_SIZES;

  const formKicker = p.formKicker || 'Request a quotation';
  const formTitle  = p.formTitle  || 'Aggregate Supply Request';
  const successToast = p.successToast || 'Your aggregate request has been sent. We will respond shortly.';
  const failToast    = p.failToast    || 'Failed to send. Please try again or call us directly.';

  useSEO(
    'Aggregate Supply',
    'KASCON quarry and aggregate supply — stone crushing plant producing coarse, medium and fine aggregates for construction projects.',
    'capabilities'
  );

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/aggregate-requests', {
        projectName:   form.projectName,
        location:      form.location,
        size:          form.size,
        quantity:      form.quantity,
        deliveryDate:  form.deliveryDate,
        contactPerson: form.name,
        phone:         form.phone,
        email:         form.email,
        notes:         form.notes,
      });
      toast.success(successToast);
      setForm({ projectName: '', location: '', size: '', quantity: '', deliveryDate: '', name: '', phone: '', email: '', notes: '' });
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

              {/* Specs */}
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

                {/* Plant output — only rendered once figures are published */}
                {capacityFacts.length > 0 && (
                  <div className="mt-8">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                      {capacityKicker || 'Plant output'}
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
              </div>

              {/* Sizes */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                  <p className="editorial-eyebrow">Available aggregate sizes</p>
                </div>
                <ul className="space-y-3">
                  {sizes.map((s) => (
                    <li key={s} className="flex items-start gap-3 border border-slate-200 bg-stone-50 p-4">
                      <span aria-hidden="true" className="mt-2 h-0.5 w-5 shrink-0 bg-accent" />
                      <span className="text-sm font-semibold text-navy">{s}</span>
                    </li>
                  ))}
                </ul>

                {/* Product applications — optional CMS block */}
                {products.length > 0 && (
                  <div className="mt-8">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                      Applications
                    </p>
                    <div className="space-y-3">
                      {products.map((x) => (
                        <div key={x.title} className="border border-slate-200 bg-white p-4">
                          <p className="text-sm font-semibold text-navy">{x.title}</p>
                          {x.desc && (
                            <p className="mt-1 text-sm leading-relaxed text-slate-600">{x.desc}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Request form */}
      <section id="request" className="section bg-stone-50 border-t-2 border-accent scroll-mt-20">
        <div className="container-pad">
          <FadeIn>
            <div className="max-w-3xl mb-10">
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="editorial-eyebrow">{formKicker}</p>
              </div>
              <h2 className="section-title">{formTitle}</h2>
            </div>

            <form onSubmit={submit} className="bg-white border border-slate-200 p-7 sm:p-10 max-w-3xl">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label htmlFor="agg-project" className="label">Project Name *</label>
                  <input id="agg-project" className="input" name="projectName" required value={form.projectName} onChange={onChange} />
                </div>
                <div>
                  <label htmlFor="agg-location" className="label">Delivery Location *</label>
                  <input id="agg-location" className="input" name="location" required value={form.location} onChange={onChange} />
                </div>
                <div>
                  <label htmlFor="agg-size" className="label">Aggregate Size *</label>
                  <select id="agg-size" className="input" name="size" required value={form.size} onChange={onChange}>
                    <option value="">Select size…</option>
                    {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                    <option value="Mixed / Multiple">Mixed / Multiple sizes</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="agg-qty" className="label">Quantity (m³ or tonnes)</label>
                  <input id="agg-qty" className="input" name="quantity" value={form.quantity} onChange={onChange} placeholder="e.g. 50 m³" />
                </div>
                <div>
                  <label htmlFor="agg-date" className="label">Required Date</label>
                  <input id="agg-date" className="input" name="deliveryDate" type="date" value={form.deliveryDate} onChange={onChange} />
                </div>

                <div className="sm:col-span-2 border-t border-slate-200 pt-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Contact details</p>
                </div>

                <div>
                  <label htmlFor="agg-name" className="label">Contact Person *</label>
                  <input id="agg-name" className="input" name="name" required value={form.name} onChange={onChange} />
                </div>
                <div>
                  <label htmlFor="agg-phone" className="label">Phone *</label>
                  <input id="agg-phone" className="input" name="phone" required value={form.phone} onChange={onChange} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="agg-email" className="label">Email</label>
                  <input id="agg-email" className="input" type="email" name="email" value={form.email} onChange={onChange} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="agg-notes" className="label">Notes / Special Requirements</label>
                  <textarea id="agg-notes" className="input min-h-[90px]" name="notes" value={form.notes} onChange={onChange} />
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
