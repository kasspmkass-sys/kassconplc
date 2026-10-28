/**
 * HOME ADMIN — Edit all homepage section copy, KPIs, and section headings.
 * Manages: settings.home.* via PUT /settings
 * Covers (in homepage order):
 *   - Statistics / KPI band (up to 6)
 *   - Who We Are heading
 *   - Business Areas heading
 *   - Featured Projects heading
 *   - Production Capacity heading
 *   - Our Equipment heading
 *   - Clients strip label
 *   - Latest Updates heading
 *   - Quality & HSEQ heading
 *   - Careers heading
 *   - Where We Work heading
 *   - Final CTA
 *
 * Content itself lives in the collections it draws from (Equipment, Milestones,
 * Testimonials, Awards, Projects, Clients, News) — those have their own admin
 * pages, so this screen only edits the wrapper copy and never duplicates items.
 */
import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import { useSite } from '../../context/SiteContext';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const SECTION_ICONS = {
  stats:         '📊',
  about:         '🏢',
  services:      '🔧',
  projects:      '📁',
  capacity:      '🏗️',
  equipment:     '🚜',
  clients:       '🤝',
  latestUpdates: '📰',
  safety:        '🦺',
  careers:       '💼',
  locations:     '📍',
  finalCta:      '📣',
};

function SectionCard({ icon, title, hint, children }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="border-b border-slate-100 pb-3 mb-2">
        <h2 className="font-display font-bold text-navy flex items-center gap-2">
          <span>{icon}</span>{title}
        </h2>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {hint && <p className="text-[11px] text-slate-400 mb-1">{hint}</p>}
      {children}
    </div>
  );
}

/* ── Default home object ──────────────────────────────────────────────────── */
const DEFAULT_HOME = {
  /* Only verified KASCON figures carry a value. Empty value = slot hidden on
     the homepage, so unfilled metrics never publish an unverified number. */
  stats: [
    { value: '46+',     label: 'Years of experience',      descriptor: '' },
    { value: '2000+',   label: 'Documented projects',      descriptor: '' },
    { value: '',        label: 'Ongoing projects',         descriptor: '' },
    { value: '108',     label: 'Technical specialists',    descriptor: '' },
    { value: '',        label: 'Equipment fleet',          descriptor: '' },
    { value: '',        label: 'Concrete supplied',        descriptor: '' },
  ],
  services:      { kicker: 'Business areas',   title: 'Nine integrated construction capabilities.', subtitle: '' },
  projects:      { kicker: 'Project experience', title: 'Delivering landmark projects across Ethiopia.', subtitle: '', ctaLabel: 'View all projects' },
  capacity:      { kicker: 'Production capacity', title: 'Self-performed plant, equipment & fleet.', subtitle: '', ctaLabel: 'View capabilities' },
  equipment:     { kicker: 'Our equipment', subtitle: '', ctaLabel: 'View equipment gallery', image: '', imageAlt: '' },
  clients:       { label: 'Trusted by leading organisations' },
  latestUpdates: { kicker: 'Latest updates', title: 'News, milestones & announcements.', subtitle: '', ctaLabel: 'View all updates' },
  about:         { kicker: 'Who we are', title: '', description: '' },
  safety:        { kicker: 'Quality & HSEQ', title: '', lead: '' },
  careers:       { kicker: 'Careers', title: '', text: '' },
  locations:     { kicker: 'Where we work', title: '', text: '' },
  finalCta:      { kicker: 'Start a conversation', title: '', text: '', buttonText: '' },
};

export default function HomeAdmin() {
  const { refresh } = useSite();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) => {
      const merged = { ...DEFAULT_HOME, ...r.data.home };
      /* Pad to the full 6 slots so every presentation metric is manageable,
         without discarding any values already stored in the CMS. */
      const stored = Array.isArray(merged.stats) ? merged.stats : [];
      const padded = DEFAULT_HOME.stats.map((fallback, i) => ({
        ...fallback,
        ...(stored[i] || {}),
      }));
      merged.stats = stored.length > DEFAULT_HOME.stats.length ? stored : padded;
      setForm({ ...r.data, home: merged });
    });
  }, []);

  if (!form) return <div className="text-slate-400 p-8">Loading…</div>;

  /* ── Mutators ──────────────────────────────────────────────────────────── */
  const setBlock = (block, key, value) =>
    setForm((f) => ({
      ...f,
      home: { ...f.home, [block]: { ...(f.home?.[block] || {}), [key]: value } },
    }));

  const setStat = (index, key, value) =>
    setForm((f) => ({
      ...f,
      home: {
        ...f.home,
        stats: f.home.stats.map((s, i) => (i === index ? { ...s, [key]: value } : s)),
      },
    }));

  const addStat = () => {
    if ((form.home.stats || []).length >= 6) return;
    setForm((f) => ({
      ...f,
      home: { ...f.home, stats: [...(f.home.stats || []), { value: '', label: '', descriptor: '' }] },
    }));
  };

  const removeStat = (index) => {
    setForm((f) => ({
      ...f,
      home: { ...f.home, stats: f.home.stats.filter((_, i) => i !== index) },
    }));
  };

  /* ── Save ──────────────────────────────────────────────────────────────── */
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put('/settings', { home: form.home });
      await refresh();
      toast.success('Home content saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const stats = form.home.stats || [];

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy">Home Page Content</h1>
        <p className="text-sm text-slate-400 mt-1">
          Edit text for every homepage section. Hero slides live under <strong>Hero Slides</strong>. Images live under <strong>Home Images</strong>.
        </p>
      </div>

      <form onSubmit={save} className="space-y-6">

        {/* ── KPI / Stats band ─────────────────────────────────────────── */}
        <SectionCard icon={SECTION_ICONS.stats} title="KPI Statistics Band"
          hint="Shown below the hero. Up to 6 metrics. Leave Value empty to hide a slot.">
          <div className="grid sm:grid-cols-2 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="border border-slate-200 bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Metric {i + 1}
                  </span>
                  <button type="button" onClick={() => removeStat(i)}
                    className="text-slate-300 hover:text-accent transition-colors"
                    aria-label={`Remove metric ${i + 1}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div>
                  <label className="label">Value <span className="text-slate-300 font-normal">(e.g. 46+, Grade 1)</span></label>
                  <input className="input" value={s.value || ''} onChange={(e) => setStat(i, 'value', e.target.value)}
                    placeholder="Leave blank to hide" />
                </div>
                <div>
                  <label className="label">Label <span className="text-slate-300 font-normal">(shown below value)</span></label>
                  <input className="input" value={s.label || ''} onChange={(e) => setStat(i, 'label', e.target.value)} />
                </div>
                <div>
                  <label className="label">Descriptor <span className="text-slate-300 font-normal">(optional sub-label)</span></label>
                  <input className="input" value={s.descriptor || ''} onChange={(e) => setStat(i, 'descriptor', e.target.value)}
                    placeholder="e.g. Concrete C-20 to C-35" />
                </div>
              </div>
            ))}
          </div>
          {stats.length < 6 && (
            <button type="button" onClick={addStat}
              className="btn-ghost text-sm flex items-center gap-2">
              <Plus size={14} /> Add metric (max 6)
            </button>
          )}
          <p className="text-xs text-slate-400">
            Metrics 1&ndash;4 fall back to Site Settings (years, documented projects, specialists, grade)
            when their value is empty. Metrics 5&ndash;6 (equipment fleet, concrete supplied) are
            free-text: enter a figure only once it is confirmed, otherwise leave the value blank to hide it.
          </p>
        </SectionCard>

        {/* ── Who We Are ───────────────────────────────────────────────── */}
        <SectionCard icon={SECTION_ICONS.about} title="Who We Are"
          hint="Heading and description for the company introduction section.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Eyebrow (kicker)">
              <input className="input" value={form.home.about?.kicker || ''} onChange={(e) => setBlock('about', 'kicker', e.target.value)} />
            </Field>
            <Field label="Section title">
              <input className="input" value={form.home.about?.title || ''} onChange={(e) => setBlock('about', 'title', e.target.value)} />
            </Field>
          </div>
          <Field label="Description">
            <textarea className="input min-h-[100px]" value={form.home.about?.description || ''} onChange={(e) => setBlock('about', 'description', e.target.value)} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Caution / Quote text" hint="Optional quote block below description">
              <textarea className="input min-h-[72px]" value={form.home.about?.cautionText || ''} onChange={(e) => setBlock('about', 'cautionText', e.target.value)} />
            </Field>
            <Field label="Quote author">
              <input className="input" value={form.home.about?.cautionAuthor || ''} onChange={(e) => setBlock('about', 'cautionAuthor', e.target.value)} />
            </Field>
          </div>
        </SectionCard>

        {/* ── Business Areas ───────────────────────────────────────────── */}
        <SectionCard icon={SECTION_ICONS.services} title="Business Areas"
          hint="Heading above the service cards grid. Services are managed under Services.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Eyebrow"><input className="input" value={form.home.services?.kicker || ''} onChange={(e) => setBlock('services', 'kicker', e.target.value)} /></Field>
            <Field label="Title"><input className="input" value={form.home.services?.title || ''} onChange={(e) => setBlock('services', 'title', e.target.value)} /></Field>
          </div>
          <Field label="Subtitle"><textarea className="input min-h-[72px]" value={form.home.services?.subtitle || ''} onChange={(e) => setBlock('services', 'subtitle', e.target.value)} /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Card CTA label"><input className="input" value={form.home.services?.cardCtaLabel || ''} onChange={(e) => setBlock('services', 'cardCtaLabel', e.target.value)} placeholder="Details" /></Field>
            <Field label="View all label"><input className="input" value={form.home.services?.ctaLabel || ''} onChange={(e) => setBlock('services', 'ctaLabel', e.target.value)} placeholder="View all services" /></Field>
          </div>
        </SectionCard>

        {/* ── Featured Projects ─────────────────────────────────────────── */}
        <SectionCard icon={SECTION_ICONS.projects} title="Featured Projects"
          hint="Heading above the project cards. Projects are managed under Projects.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Eyebrow"><input className="input" value={form.home.projects?.kicker || ''} onChange={(e) => setBlock('projects', 'kicker', e.target.value)} /></Field>
            <Field label="Title"><input className="input" value={form.home.projects?.title || ''} onChange={(e) => setBlock('projects', 'title', e.target.value)} /></Field>
          </div>
          <Field label="Subtitle"><textarea className="input min-h-[72px]" value={form.home.projects?.subtitle || ''} onChange={(e) => setBlock('projects', 'subtitle', e.target.value)} /></Field>
          <Field label="View all label"><input className="input" value={form.home.projects?.ctaLabel || ''} onChange={(e) => setBlock('projects', 'ctaLabel', e.target.value)} placeholder="View all projects" /></Field>
        </SectionCard>

        {/* ── Production capacity ───────────────────────────────────────── */}
        <SectionCard icon={SECTION_ICONS.capacity} title="Production Capacity"
          hint="Heading for the capacity section (batching plant, crusher, steel shop, fleet). Equipment items are managed under Equipment.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Eyebrow"><input className="input" value={form.home.capacity?.kicker || ''} onChange={(e) => setBlock('capacity', 'kicker', e.target.value)} /></Field>
            <Field label="Title"><input className="input" value={form.home.capacity?.title || ''} onChange={(e) => setBlock('capacity', 'title', e.target.value)} /></Field>
          </div>
          <Field label="Subtitle"><textarea className="input min-h-[72px]" value={form.home.capacity?.subtitle || ''} onChange={(e) => setBlock('capacity', 'subtitle', e.target.value)} /></Field>
          <Field label="CTA label"><input className="input" value={form.home.capacity?.ctaLabel || ''} onChange={(e) => setBlock('capacity', 'ctaLabel', e.target.value)} placeholder="View capabilities" /></Field>
        </SectionCard>

        {/* ── Our equipment ──────────────────────────────────────────────── */}
        <SectionCard icon={SECTION_ICONS.equipment} title="Our Equipment"
          hint="Copy for the owned-fleet sub-block inside Production Capacity. The machines themselves come from Equipment — managed under Equipment, no duplication.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Eyebrow"><input className="input" value={form.home.equipment?.kicker || ''} onChange={(e) => setBlock('equipment', 'kicker', e.target.value)} /></Field>
            <Field label="Fleet image URL" hint="Optional. Only used when Equipment records have no photos.">
              <input className="input" value={form.home.equipment?.image || ''} onChange={(e) => setBlock('equipment', 'image', e.target.value)} placeholder="/uploads/…" />
            </Field>
          </div>
          <Field label="Subtitle" hint="Overrides the default 'KASCON-owned and maintained in our own auto shop' line">
            <textarea className="input min-h-[72px]" value={form.home.equipment?.subtitle || ''} onChange={(e) => setBlock('equipment', 'subtitle', e.target.value)} />
          </Field>
          <Field label="CTA label"><input className="input" value={form.home.equipment?.ctaLabel || ''} onChange={(e) => setBlock('equipment', 'ctaLabel', e.target.value)} placeholder="View equipment gallery" /></Field>
        </SectionCard>

        {/* ── Clients ───────────────────────────────────────────────────── */}
        <SectionCard icon={SECTION_ICONS.clients} title="Clients & Partners"
          hint="Label above the client logo marquee. Logos managed under Clients.">
          <Field label="Strip label">
            <input className="input" value={form.home.clients?.label || ''} onChange={(e) => setBlock('clients', 'label', e.target.value)} />
          </Field>
        </SectionCard>

        {/* ── Latest Updates ────────────────────────────────────────────── */}
        <SectionCard icon={SECTION_ICONS.latestUpdates} title="Latest Updates"
          hint="Heading for the news/updates section. Updates managed under News & Updates.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Eyebrow"><input className="input" value={form.home.latestUpdates?.kicker || ''} onChange={(e) => setBlock('latestUpdates', 'kicker', e.target.value)} /></Field>
            <Field label="Title"><input className="input" value={form.home.latestUpdates?.title || ''} onChange={(e) => setBlock('latestUpdates', 'title', e.target.value)} /></Field>
          </div>
          <Field label="Subtitle"><textarea className="input min-h-[72px]" value={form.home.latestUpdates?.subtitle || ''} onChange={(e) => setBlock('latestUpdates', 'subtitle', e.target.value)} /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="View all label"><input className="input" value={form.home.latestUpdates?.ctaLabel || ''} onChange={(e) => setBlock('latestUpdates', 'ctaLabel', e.target.value)} placeholder="View all updates" /></Field>
            <Field label="Empty state message" hint="Shown when no updates exist">
              <input className="input" value={form.home.latestUpdates?.emptyState || ''} onChange={(e) => setBlock('latestUpdates', 'emptyState', e.target.value)} />
            </Field>
          </div>
        </SectionCard>

        {/* ── Safety / HSEQ ─────────────────────────────────────────────── */}
        <SectionCard icon={SECTION_ICONS.safety} title="Quality & HSEQ"
          hint="Heading and lead statement for the HSEQ section.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Eyebrow"><input className="input" value={form.home.safety?.kicker || ''} onChange={(e) => setBlock('safety', 'kicker', e.target.value)} /></Field>
            <Field label="Title"><input className="input" value={form.home.safety?.title || ''} onChange={(e) => setBlock('safety', 'title', e.target.value)} /></Field>
          </div>
          <Field label="Lead statement"><textarea className="input min-h-[80px]" value={form.home.safety?.lead || ''} onChange={(e) => setBlock('safety', 'lead', e.target.value)} /></Field>
        </SectionCard>

        {/* ── Careers ───────────────────────────────────────────────────── */}
        <SectionCard icon={SECTION_ICONS.careers} title="Careers Section">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Eyebrow"><input className="input" value={form.home.careers?.kicker || ''} onChange={(e) => setBlock('careers', 'kicker', e.target.value)} /></Field>
            <Field label="Title"><input className="input" value={form.home.careers?.title || ''} onChange={(e) => setBlock('careers', 'title', e.target.value)} /></Field>
          </div>
          <Field label="Intro text"><textarea className="input min-h-[80px]" value={form.home.careers?.text || ''} onChange={(e) => setBlock('careers', 'text', e.target.value)} /></Field>
          <Field label="CTA label"><input className="input" value={form.home.careers?.ctaLabel || ''} onChange={(e) => setBlock('careers', 'ctaLabel', e.target.value)} placeholder="Explore careers" /></Field>
        </SectionCard>

        {/* ── Where We Work ─────────────────────────────────────────────── */}
        <SectionCard icon={SECTION_ICONS.locations} title="Where We Work"
          hint="Heading for the locations / facilities section. Addresses come from Site Settings.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Eyebrow"><input className="input" value={form.home.locations?.kicker || ''} onChange={(e) => setBlock('locations', 'kicker', e.target.value)} /></Field>
            <Field label="Title"><input className="input" value={form.home.locations?.title || ''} onChange={(e) => setBlock('locations', 'title', e.target.value)} /></Field>
          </div>
          <Field label="Intro text"><textarea className="input min-h-[72px]" value={form.home.locations?.text || ''} onChange={(e) => setBlock('locations', 'text', e.target.value)} /></Field>
        </SectionCard>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <SectionCard icon={SECTION_ICONS.finalCta} title="Final Call-to-Action"
          hint="Banner before the footer. Includes two CTAs: Request Consultation + Company Profile download.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Eyebrow"><input className="input" value={form.home.finalCta?.kicker || ''} onChange={(e) => setBlock('finalCta', 'kicker', e.target.value)} /></Field>
            <Field label="Title"><input className="input" value={form.home.finalCta?.title || ''} onChange={(e) => setBlock('finalCta', 'title', e.target.value)} /></Field>
          </div>
          <Field label="Body text"><textarea className="input min-h-[80px]" value={form.home.finalCta?.text || ''} onChange={(e) => setBlock('finalCta', 'text', e.target.value)} /></Field>
          <Field label="Primary button text" hint="Default: Request a Consultation">
            <input className="input" value={form.home.finalCta?.buttonText || ''} onChange={(e) => setBlock('finalCta', 'buttonText', e.target.value)} placeholder="Request a Consultation" />
          </Field>
        </SectionCard>

        {/* ── Save ──────────────────────────────────────────────────────── */}
        <div className="sticky bottom-4 z-10 flex justify-end">
          <button type="submit" className="btn-primary shadow-elevated" disabled={busy}>
            {busy ? 'Saving…' : 'Save Home Content'}
          </button>
        </div>
      </form>
    </div>
  );
}
