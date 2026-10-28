
import { useState } from 'react';
import { Mail, MapPin, Phone, Send, Clock, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { useSite } from '../context/SiteContext';
import { useSEO } from '../useSEO';
import { FadeIn } from '../components/Motion';
import PageHeader from '../components/PageHeader';

const INQUIRY_TYPES = [
  'General Inquiry',
  'Request a Quote',
  'Request Ready-Mix',
  'Request Aggregate',
  'Request Equipment Rental',
  'Tender / Partnership',
  'Career Inquiry',
];

export default function Contact() {
  const { settings } = useSite();
  const [form, setForm]     = useState({ name: '', email: '', phone: '', subject: INQUIRY_TYPES[0], message: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const pg         = settings?.contactPage     || {};
  const formLabels = pg.formLabels             || {};
  const heroKicker = pg.heroKicker             || 'Contact';
  const heroTitle  = pg.heroTitle              || "Let's build together.";
  const heroLead   = pg.heroLead               || 'Reach our Addis Ababa head office or Legetafo operations for tenders, partnerships and project enquiries.';
  const headOfficeLabel  = pg.headOfficeLabel  || 'Head Office';
  const operationsLabel  = pg.operationsLabel  || 'Operations — Legetafo';
  const operationsList   = pg.operationsList   || 'Concrete plant · Equipment · Logistics · HR';
  const allLinesLabel    = pg.allLinesLabel    || 'All lines';
  const formKicker       = pg.formKicker       || 'Get in touch';
  const formTitle        = pg.formTitle        || 'Send a message';
  const submitLabel      = pg.submitLabel      || 'Send Message';
  const sendingLabel     = pg.sendingLabel     || 'Sending…';
  const successToast     = pg.successToast     || 'Message sent. We will contact you soon.';
  const failToast        = pg.failToast        || 'Failed to send. Please try again.';

  useSEO(
    'Contact',
    'Reach KASCON — Addis Ababa head office or Legetafo operations. Tenders, partnerships, ready-mix, aggregate and equipment enquiries.',
    'contact'
  );

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())    errs.name    = 'Name is required';
    if (!form.email.trim())   errs.email   = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.message.trim()) errs.message = 'Message is required';
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSending(true);
    try {
      await api.post('/contact', form);
      toast.success(successToast);
      setForm({ name: '', email: '', phone: '', subject: INQUIRY_TYPES[0], message: '' });
      setErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || failToast);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader kicker={heroKicker} title={heroTitle} lead={heroLead} />

      <section className="section bg-stone-50">
        <div className="container-pad">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-14">

            {/* Contact info */}
            <div className="lg:col-span-2 space-y-4">
              <FadeIn>
                {/* Head office */}
                <div className="border-t-2 border-t-accent border border-slate-200 bg-white p-7 space-y-5">
                  <h2 className="font-display font-bold text-navy flex items-center gap-2.5">
                    <span className="h-8 w-8 bg-navy text-white grid place-items-center shrink-0">
                      <MapPin size={15} aria-hidden="true" />
                    </span>
                    {headOfficeLabel}
                  </h2>
                  {settings?.address && (
                    <p className="flex items-start gap-2.5 text-sm text-slate-600">
                      <MapPin size={14} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="min-w-0 break-words">{settings.address}</span>
                    </p>
                  )}
                  {settings?.phone && (
                    <p className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Phone size={14} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                      <a href={`tel:${settings.phone.replace(/[^+\d]/g, '')}`} className="hover:text-accent transition-colors">
                        {settings.phone}
                      </a>
                    </p>
                  )}
                  {settings?.email && (
                    <p className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Mail size={14} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                      <a href={`mailto:${settings.email}`} className="min-w-0 break-words hover:text-accent transition-colors">
                        {settings.email}
                      </a>
                    </p>
                  )}
                  {settings?.workingHours && (
                    <p className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Clock size={14} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="min-w-0 break-words">{settings.workingHours}</span>
                    </p>
                  )}
                  {settings?.poBox && (
                    <p className="text-xs text-slate-400 pl-6">{settings.poBox}</p>
                  )}
                </div>
              </FadeIn>

              <FadeIn delay={0.08}>
                {/* Legetafo operations */}
                <div className="border border-slate-200 bg-white p-6">
                  <h2 className="font-display font-bold text-navy mb-3 flex items-center gap-2.5">
                    <span className="h-8 w-8 bg-navy/5 text-navy grid place-items-center shrink-0">
                      <Building2 size={15} aria-hidden="true" />
                    </span>
                    {operationsLabel}
                  </h2>
                  {settings?.legetafoAddress && (
                    <p className="text-sm text-slate-600">{settings.legetafoAddress}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-3">{operationsList}</p>
                </div>
              </FadeIn>

              {/* All lines */}
              {(settings?.phones || []).length > 1 && (
                <FadeIn delay={0.12}>
                  <div className="border border-slate-200 bg-white p-6">
                    <h3 className="font-display font-bold text-navy mb-3 text-sm">{allLinesLabel}</h3>
                    <ul className="space-y-2">
                      {settings.phones.map((p) => (
                        <li key={p}>
                          <a href={`tel:${p.replace(/\s/g, '')}`} className="text-sm text-slate-600 hover:text-accent transition-colors">
                            {p}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              )}
            </div>

            {/* Form */}
            <FadeIn className="lg:col-span-3" delay={0.05}>
              <div className="bg-white border border-slate-200 border-t-2 border-t-accent p-7 sm:p-10 shadow-card">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                    <p className="editorial-eyebrow">{formKicker}</p>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-navy">{formTitle}</h2>
                </div>

                <form onSubmit={submit} noValidate className="space-y-5">
                  {/* Inquiry type */}
                  <div>
                    <label htmlFor="contact-subject" className="label">Inquiry type</label>
                    <select
                      id="contact-subject"
                      className="input"
                      name="subject"
                      value={form.subject}
                      onChange={onChange}
                    >
                      {INQUIRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="label">
                        {formLabels.name || 'Name'} <span className="text-accent">*</span>
                      </label>
                      <input
                        id="contact-name" className={`input ${errors.name ? 'border-accent' : ''}`}
                        name="name" required value={form.name} onChange={onChange}
                        aria-describedby={errors.name ? 'contact-name-err' : undefined}
                      />
                      {errors.name && <p id="contact-name-err" className="mt-1 text-xs text-accent">{errors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="label">
                        {formLabels.email || 'Email'} <span className="text-accent">*</span>
                      </label>
                      <input
                        id="contact-email" className={`input ${errors.email ? 'border-accent' : ''}`}
                        type="email" name="email" required value={form.email} onChange={onChange}
                        aria-describedby={errors.email ? 'contact-email-err' : undefined}
                      />
                      {errors.email && <p id="contact-email-err" className="mt-1 text-xs text-accent">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-phone" className="label">{formLabels.phone || 'Phone'}</label>
                    <input id="contact-phone" className="input" name="phone" value={form.phone} onChange={onChange} />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="label">
                      {formLabels.message || 'Message'} <span className="text-accent">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      className={`input min-h-[140px] ${errors.message ? 'border-accent' : ''}`}
                      name="message" required value={form.message} onChange={onChange}
                      aria-describedby={errors.message ? 'contact-message-err' : undefined}
                    />
                    {errors.message && <p id="contact-message-err" className="mt-1 text-xs text-accent">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="btn-primary disabled:opacity-55 disabled:pointer-events-none w-full sm:w-auto"
                  >
                    {sending ? sendingLabel : submitLabel} <Send size={15} />
                  </button>
                </form>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Map embed if available */}
      {settings?.mapEmbed && (
        <div className="h-80 sm:h-96 bg-slate-200 border-t border-slate-200">
          <iframe
            src={settings.mapEmbed}
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            title="KASCON office location"
          />
        </div>
      )}
    </>
  );
}
