import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api';
import { useSite } from '../../context/SiteContext';
import ImageUploader from '../../components/ImageUploader';

/* ------------------------------------------------------------------ */
/*  Generic helpers for the deeply-nested Settings document            */
/* ------------------------------------------------------------------ */

const getPath = (obj, path) =>
  path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj) ?? '';

const setPathIn = (state, path, value) => {
  const keys = path.split('.');
  const copy = JSON.parse(JSON.stringify(state));
  let cur = copy;
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof cur[keys[i]] !== 'object' || cur[keys[i]] === null) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return copy;
};

function Field({ label, path, form, set, textarea = false }) {
  const value = typeof getPath(form, path) === 'object' && getPath(form, path) !== null
    ? JSON.stringify(getPath(form, path))
    : getPath(form, path);
  return (
    <div>
      <label className="label">{label}</label>
      {textarea ? (
        <textarea
          className="input min-h-[80px]"
          value={value}
          onChange={(e) => set(path, e.target.value)}
        />
      ) : (
        <input className="input" value={value} onChange={(e) => set(path, e.target.value)} />
      )}
    </div>
  );
}

function StringList({ label, path, form, set }) {
  const value = Array.isArray(getPath(form, path)) ? getPath(form, path).join('\n') : '';
  return (
    <div>
      <label className="label">{label}</label>
      <textarea
        className="input min-h-[120px] font-mono text-xs"
        placeholder="One item per line"
        value={value}
        onChange={(e) =>
          set(
            path,
            e.target.value
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
          )
        }
      />
    </div>
  );
}

function ObjectList({ label, path, form, set, fields, keyField }) {
  const value = Array.isArray(getPath(form, path)) ? getPath(form, path) : [];
  const setItems = (items) => set(path, items);
  const update = (i, key, val) =>
    setItems(value.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));

  /* Stable row keys. `keyField` is used when the records carry a natural id;
     otherwise a key is minted once per row and only released when that exact row
     is removed, so editing or deleting a sibling never remounts the others. */
  const uid = useRef(0);
  const keyPool = useRef([]);
  while (keyPool.current.length < value.length) keyPool.current.push(`ol${++uid.current}`);
  if (keyPool.current.length > value.length) keyPool.current.length = value.length;
  const rowKey = (item, i) => (keyField && item?.[keyField]) || keyPool.current[i];

  const remove = (i) => {
    keyPool.current.splice(i, 1);
    setItems(value.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-2">
      <label className="label">{label}</label>
      {value.length === 0 && (
        <p className="text-xs text-slate-400 mb-2">None yet — add an item below.</p>
      )}
      {value.map((item, i) => (
        <div key={rowKey(item, i)} className="rounded-lg border border-slate-200 bg-stone-50 p-3 space-y-2">
          <div className="grid sm:grid-cols-2 gap-2">
            {fields.map((f) => {
              const raw = item[f.key];
              /* `lines` fields hold an array of strings but edit as one-per-line text. */
              const textValue = f.type === 'lines'
                ? (Array.isArray(raw) ? raw.join('\n') : (raw || ''))
                : (raw || '');
              const onEdit = (val) => update(i, f.key, val);
              return (
                <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {f.label}
                  </label>
                  {f.type === 'select' ? (
                    <select
                      className="input"
                      value={textValue}
                      onChange={(e) => onEdit(e.target.value)}
                    >
                      <option value="">—</option>
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : f.type === 'textarea' || f.type === 'lines' ? (
                    <textarea
                      className={f.type === 'lines' ? 'input min-h-[100px] font-mono text-xs' : 'input'}
                      placeholder={f.type === 'lines' ? 'One item per line' : undefined}
                      value={textValue}
                      onChange={(e) =>
                        onEdit(
                          f.type === 'lines'
                            ? e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                            : e.target.value
                        )
                      }
                    />
                  ) : (
                    <input
                      className="input"
                      value={textValue}
                      onChange={(e) => onEdit(e.target.value)}
                    />
                  )}
                  {f.hint && (
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{f.hint}</p>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-xs font-semibold text-red-600 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setItems([
            ...value,
            Object.fromEntries(fields.map((f) => [f.key, f.type === 'lines' ? [] : ''])),
          ])
        }
        className="inline-flex items-center gap-1.5 rounded-md border border-brand/30 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-soft/50"
      >
        + Add
      </button>
    </div>
  );
}

function Section({ title, children, defaultOpen = false }) {
  return (
    <details
      className="rounded-xl border border-slate-200 bg-white shadow-card"
      open={defaultOpen}
    >
      <summary className="cursor-pointer select-none px-5 py-4 font-display text-base font-bold text-navy">
        {title}
      </summary>
      <div className="px-5 pb-5 space-y-4">{children}</div>
    </details>
  );
}

const PAGES = [
  ['home', 'Home'],
  ['about', 'About'],
  ['services', 'Services'],
  ['serviceDetail', 'Service detail'],
  ['projects', 'Projects'],
  ['projectDetail', 'Project detail'],
  ['capabilities', 'Capabilities'],
  ['whereWeWork', 'Where We Work'],
  ['careers', 'Careers'],
  ['contact', 'Contact'],
  ['notFound', 'Not found'],
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SettingsAdmin() {
  const { refresh } = useSite();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) => setForm(r.data));
  }, []);

  if (!form) return <div className="text-slate-400">Loading settings...</div>;

  const set = (path, value) => setForm((f) => setPathIn(f, path, value));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        phones: typeof form.phones === 'string' ? form.phones.split(',').map((s) => s.trim()).filter(Boolean) : form.phones,
        emails: typeof form.emails === 'string' ? form.emails.split(',').map((s) => s.trim()).filter(Boolean) : form.emails,
      };
      await api.put('/settings', payload);
      await refresh();
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const fields = [
    ['companyName', 'Company name'],
    ['tagline', 'Tagline'],
    ['headline', 'Headline'],
    ['grade', 'Grade / licence'],
    ['capital', 'Capital'],
    ['foundedYear', 'Founded year'],
    ['yearsExperience', 'Years experience'],
    ['projectCount', 'Project count'],
    ['specialists', 'Specialists'],
    ['phone', 'Primary phone'],
    ['email', 'Primary email'],
    ['website', 'Website'],
    ['poBox', 'P.O. Box'],
    ['workingHours', 'Working hours'],
  ];

  const pageIntro = (path, keys) => (
    <div className="grid sm:grid-cols-2 gap-4">
      {keys.map((k) => (
        <Field key={k} label={k.replace(/^hero/, 'Hero ').replace(/([A-Z])/g, ' $1')} path={`${path}.${k}`} form={form} set={set} />
      ))}
    </div>
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-6">Site Settings</h1>
      <form onSubmit={save} className="space-y-5 max-w-4xl">
        {/* Company basics */}
        <Section title="Company information" defaultOpen>
          <div className="grid sm:grid-cols-2 gap-4">
            {fields.map(([key, label]) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input className="input" value={form[key] || ''} onChange={(e) => set(key, e.target.value)} />
              </div>
            ))}
          </div>
          <div>
            <label className="label">About (short)</label>
            <textarea className="input min-h-[80px]" value={form.aboutShort || ''} onChange={(e) => set('aboutShort', e.target.value)} />
          </div>
          <div>
            <label className="label">About (long)</label>
            <textarea className="input min-h-[140px]" value={form.aboutLong || ''} onChange={(e) => set('aboutLong', e.target.value)} />
          </div>
          <div>
            <label className="label">Mission</label>
            <textarea className="input min-h-[80px]" value={form.mission || ''} onChange={(e) => set('mission', e.target.value)} />
          </div>
          <div>
            <label className="label">Vision</label>
            <textarea className="input min-h-[80px]" value={form.vision || ''} onChange={(e) => set('vision', e.target.value)} />
          </div>
          <div>
            <label className="label">Address (HQ)</label>
            <input className="input" value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div>
            <label className="label">Legetafo address</label>
            <input className="input" value={form.legetafoAddress || ''} onChange={(e) => set('legetafoAddress', e.target.value)} />
          </div>
          <div>
            <label className="label">All phones (comma separated)</label>
            <input
              className="input"
              value={Array.isArray(form.phones) ? form.phones.join(', ') : form.phones || ''}
              onChange={(e) => set('phones', e.target.value)}
            />
          </div>
          <div>
            <label className="label">All emails (comma separated)</label>
            <input
              className="input"
              value={Array.isArray(form.emails) ? form.emails.join(', ') : form.emails || ''}
              onChange={(e) => set('emails', e.target.value)}
            />
          </div>
        </Section>

        {/* SEO */}
        <Section title="SEO (titles, descriptions, site name)">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Site name" path="seo.siteName" form={form} set={set} />
            <Field label="Site URL" path="seo.siteUrl" form={form} set={set} />
          </div>
          <Field label="Default description" path="seo.defaultDescription" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            {PAGES.map(([key, label]) => (
              <div key={key} className="rounded-lg border border-slate-200 p-3 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <Field label="Title" path={`seo.pages.${key}.title`} form={form} set={set} />
                <Field label="Description" path={`seo.pages.${key}.description`} form={form} set={set} textarea />
              </div>
            ))}
          </div>
        </Section>

        {/* Home page copy */}
        <Section title="Home page copy">
          <Field label="Hero: slide interval (ms)" path="hero.slideInterval" form={form} set={set} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Hero: primary CTA" path="hero.primaryCtaLabel" form={form} set={set} />
            <Field label="Hero: secondary CTA" path="hero.secondaryCtaLabel" form={form} set={set} />
          </div>
          <Field label="Hero: default slide alt text" path="hero.defaultSlideAlt" form={form} set={set} />
          <ObjectList
            label="Stats band"
            path="home.stats"
            form={form}
            set={set}
            fields={[
              { key: 'value', label: 'Value' },
              { key: 'label', label: 'Label' },
              { key: 'descriptor', label: 'Descriptor' },
            ]}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Who we are: kicker" path="home.about.kicker" form={form} set={set} />
            <Field label="Who we are: title" path="home.about.title" form={form} set={set} textarea />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Who we are: primary CTA" path="home.about.primaryCtaLabel" form={form} set={set} />
            <Field label="Who we are: secondary CTA" path="home.about.secondaryCtaLabel" form={form} set={set} />
          </div>
          <Field label="Who we are: description" path="home.about.description" form={form} set={set} textarea />
          <Field label="Who we are: image alt" path="home.about.imageAlt" form={form} set={set} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="What we do: kicker" path="home.services.kicker" form={form} set={set} />
            <Field label="What we do: title" path="home.services.title" form={form} set={set} />
          </div>
          <Field label="What we do: subtitle" path="home.services.subtitle" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="What we do: card CTA" path="home.services.cardCtaLabel" form={form} set={set} />
            <Field label="What we do: view-all CTA" path="home.services.ctaLabel" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="What we build: kicker" path="home.projects.kicker" form={form} set={set} />
            <Field label="What we build: title" path="home.projects.title" form={form} set={set} />
          </div>
          <Field label="What we build: subtitle" path="home.projects.subtitle" form={form} set={set} textarea />
          <Field label="What we build: CTA" path="home.projects.ctaLabel" form={form} set={set} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Where we work: kicker" path="home.locations.kicker" form={form} set={set} />
            <Field label="Where we work: title" path="home.locations.title" form={form} set={set} />
          </div>
          <Field label="Where we work: text" path="home.locations.text" form={form} set={set} textarea />
          <Field label="Where we work: facilities eyebrow" path="home.locations.facilitiesEyebrow" form={form} set={set} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Where we work: primary CTA" path="home.locations.primaryCtaLabel" form={form} set={set} />
            <Field label="Where we work: secondary CTA" path="home.locations.secondaryCtaLabel" form={form} set={set} />
          </div>
          <ObjectList
            label="Where we work: facilities"
            path="home.locations.facilities"
            form={form}
            set={set}
            fields={[
              { key: 'index', label: 'Index (optional)' },
              { key: 'tag', label: 'Tag' },
              { key: 'city', label: 'City' },
              { key: 'address', label: 'Address', full: true },
              { key: 'extra', label: 'Extra (optional)', full: true },
            ]}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Careers: kicker" path="home.careers.kicker" form={form} set={set} />
            <Field label="Careers: title" path="home.careers.title" form={form} set={set} />
          </div>
          <Field label="Careers: text" path="home.careers.text" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Careers: CTA" path="home.careers.ctaLabel" form={form} set={set} />
            <Field label="Careers: image alt" path="home.careers.imageAlt" form={form} set={set} />
          </div>
          <Field label="Careers: image caption" path="home.careers.caption" form={form} set={set} />
          <StringList label="Careers: pillars (one per line)" path="home.careers.pillars" form={form} set={set} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Owners: kicker" path="ownersKicker" form={form} set={set} />
            <Field label="Owners: title" path="ownersTitle" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Safety: kicker" path="home.safety.kicker" form={form} set={set} />
            <Field label="Safety: title" path="home.safety.title" form={form} set={set} />
          </div>
          <Field label="Safety: lead" path="home.safety.lead" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Safety: CTA" path="home.safety.ctaLabel" form={form} set={set} />
            <Field label="Safety: caption" path="home.safety.caption" form={form} set={set} />
          </div>
          <Field label="Safety: badge" path="home.safety.badge" form={form} set={set} />
          <StringList label="Safety: commitments (one per line)" path="home.safety.commitments" form={form} set={set} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Final CTA: kicker" path="home.finalCta.kicker" form={form} set={set} />
            <Field label="Final CTA: title" path="home.finalCta.title" form={form} set={set} textarea />
          </div>
          <Field label="Final CTA: text" path="home.finalCta.text" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Final CTA: button text" path="home.finalCta.buttonText" form={form} set={set} />
            <Field label="Final CTA: background image alt" path="home.finalCta.imageAlt" form={form} set={set} />
          </div>
        </Section>

        {/* Header / footer */}
        <Section title="Header & footer">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Header: quote button label" path="header.quoteLabel" form={form} set={set} />
            <Field label="Header: company profile label" path="header.profileLabel" form={form} set={set} />
          </div>
          <ObjectList
            label="Header: About dropdown items (label + URL)"
            path="header.aboutMenu"
            form={form}
            set={set}
            fields={[
              { key: 'label', label: 'Label' },
              { key: 'to', label: 'Path (e.g. /about#history)' },
            ]}
          />
          <ObjectList
            label="Header: Projects dropdown items"
            path="header.projectsMenu"
            form={form}
            set={set}
            fields={[
              { key: 'label', label: 'Label' },
              { key: 'to', label: 'Path (e.g. /projects?filter=fuel)' },
            ]}
          />
          <ObjectList
            label="Header: Capabilities dropdown items"
            path="header.capabilitiesMenu"
            form={form}
            set={set}
            fields={[
              { key: 'label', label: 'Label' },
              { key: 'to', label: 'Path (e.g. /capabilities#steel-fabrication)' },
            ]}
          />
          <ObjectList
            label="Footer: explore links"
            path="footer.exploreLinks"
            form={form}
            set={set}
            fields={[
              { key: 'label', label: 'Label' },
              { key: 'to', label: 'Path' },
            ]}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Footer: explore column title" path="footer.exploreTitle" form={form} set={set} />
            <Field label="Footer: services column title" path="footer.servicesTitle" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Footer: contact column title" path="footer.contactTitle" form={form} set={set} />
            <Field label="Footer: all-services CTA" path="footer.servicesCta" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Footer: CTA heading" path="footer.ctaHeading" form={form} set={set} />
            <Field label="Footer: compliance column title" path="footer.certificationsTitle" form={form} set={set} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="footer-showCertifications"
              type="checkbox"
              checked={form.footer?.showCertifications !== false}
              onChange={(e) => set('footer.showCertifications', e.target.checked)}
            />
            <label htmlFor="footer-showCertifications" className="label !mb-0">
              Show compliance certificates in footer
            </label>
          </div>
        </Section>

        {/* About page copy */}
        <Section title="About page copy">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Hero kicker" path="about.hero.kicker" form={form} set={set} />
            <Field label="Hero title" path="about.hero.title" form={form} set={set} textarea />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Company kicker" path="about.company.kicker" form={form} set={set} />
            <Field label="Company title" path="about.company.title" form={form} set={set} textarea />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Company CTA 1" path="about.company.companyCta1" form={form} set={set} />
            <Field label="Company CTA 2" path="about.company.companyCta2" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Values kicker" path="about.values.kicker" form={form} set={set} />
            <Field label="Values title" path="about.values.valuesTitle" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Timeline kicker" path="about.timeline.kicker" form={form} set={set} />
            <Field label="Timeline title" path="about.timeline.title" form={form} set={set} />
          </div>
          <Field label="Timeline description" path="about.timeline.description" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Leadership kicker" path="about.leadership.kicker" form={form} set={set} />
            <Field label="Leadership title" path="about.leadership.leadershipTitle" form={form} set={set} />
          </div>
          <Field label="Leadership team label" path="about.leadership.teamLabel" form={form} set={set} />
          <StringList label="Position points (one per line)" path="about.specializations.positionPoints" form={form} set={set} />
          <StringList label="Key fact labels (one per line, aligned to the facts order)" path="about.specializations.keyFactLabels" form={form} set={set} />
          <ObjectList
            label="Approach pillars (title + description)"
            path="about.approach.items"
            form={form}
            set={set}
            fields={[
              { key: 'title', label: 'Title' },
              { key: 'description', label: 'Description', full: true, type: 'textarea' },
            ]}
          />
          <ObjectList
            label="Capability cards"
            path="about.capabilities.items"
            form={form}
            set={set}
            fields={[
              { key: 'title', label: 'Title' },
              { key: 'description', label: 'Description', full: true, type: 'textarea' },
            ]}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Capabilities CTA" path="about.capabilities.ctaLabel" form={form} set={set} />
            <Field label="Digital kicker" path="about.digital.kicker" form={form} set={set} />
          </div>
          <Field label="Digital title" path="about.digital.title" form={form} set={set} textarea />
          <Field label="Digital lead" path="about.digital.lead" form={form} set={set} textarea />
          <Field label="Digital caption" path="about.digital.caption" form={form} set={set} />
          <div>
            <label className="label">Digital section image</label>
            <ImageUploader value={form.about?.digital?.image || ''} onChange={(v) => set('about.digital.image', v)} />
          </div>
          <StringList label="Digital points (one per line)" path="about.digital.points" form={form} set={set} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="ERP kicker" path="about.erp.kicker" form={form} set={set} />
            <Field label="ERP title" path="about.erp.title" form={form} set={set} textarea />
          </div>
          <Field label="ERP lead" path="about.erp.lead" form={form} set={set} textarea />
          <Field label="ERP flow label" path="about.erp.flowLabel" form={form} set={set} />
          <StringList label="ERP modules (one per line)" path="about.erp.modules" form={form} set={set} />
          <ObjectList
            label="ERP flow steps (title + description)"
            path="about.erp.flow"
            form={form}
            set={set}
            fields={[
              { key: 'title', label: 'Title' },
              { key: 'description', label: 'Description', full: true, type: 'textarea' },
            ]}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Experience kicker" path="about.experience.kicker" form={form} set={set} />
            <Field label="Experience title" path="about.experience.title" form={form} set={set} textarea />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Experience deliverables label" path="about.experience.deliverablesLabel" form={form} set={set} />
            <Field label="Experience all-capabilities CTA" path="about.experience.allCapabilitiesCta" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Testimonials kicker" path="about.testimonials.kicker" form={form} set={set} />
            <Field label="Testimonials title" path="about.testimonials.title" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Final CTA kicker" path="about.cta.kicker" form={form} set={set} />
            <Field label="Final CTA title" path="about.cta.title" form={form} set={set} textarea />
          </div>
          <Field label="Final CTA text" path="about.cta.text" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Final CTA primary" path="about.cta.primaryLabel" form={form} set={set} />
            <Field label="Final CTA secondary" path="about.cta.secondaryLabel" form={form} set={set} />
          </div>
        </Section>

        {/* Page copy */}
        <Section title="Services & projects page copy">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Services: kicker" path="servicesPage.kicker" form={form} set={set} />
            <Field label="Services: title" path="servicesPage.title" form={form} set={set} />
          </div>
          <Field label="Services: lead" path="servicesPage.lead" form={form} set={set} textarea />
          <Field label="Services: empty state" path="servicesPage.emptyState" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Service detail: overview label" path="servicesPage.detail.overviewLabel" form={form} set={set} />
            <Field label="Service detail: capabilities label" path="servicesPage.detail.capabilitiesLabel" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Service detail: process label" path="servicesPage.detail.processLabel" form={form} set={set} />
            <Field label="Service detail: quality label" path="servicesPage.detail.qualityLabel" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Service detail: equipment label" path="servicesPage.detail.equipmentLabel" form={form} set={set} />
            <Field label="Service detail: gallery label" path="servicesPage.detail.galleryLabel" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Service detail: enquiry CTA" path="servicesPage.detail.enquiryCta" form={form} set={set} />
            <Field label="Service detail: all-services label" path="servicesPage.detail.allServicesLabel" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Service detail: not-found title" path="servicesPage.detail.notFoundTitle" form={form} set={set} />
            <Field label="Service detail: no-description text" path="servicesPage.detail.noDescription" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Projects: hero kicker" path="projectsPage.heroKicker" form={form} set={set} />
            <Field label="Projects: hero title" path="projectsPage.heroTitle" form={form} set={set} />
          </div>
          <Field label="Projects: hero lead" path="projectsPage.heroLead" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Projects: search placeholder" path="projectsPage.searchPlaceholder" form={form} set={set} />
            <Field label="Projects: empty state" path="projectsPage.emptyState" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Projects: registered-work label" path="projectsPage.registeredWorkLabel" form={form} set={set} />
            <Field label="Projects: featured label" path="projectsPage.featuredLabel" form={form} set={set} />
          </div>
          <Field label="Projects: view-project label" path="projectsPage.viewLabel" form={form} set={set} />
          <StringList label="Projects: stat labels (4, one per line)" path="projectsPage.statLabels" form={form} set={set} />
          <ObjectList
            label="Projects: group labels (category -> label)"
            path="projectsPage.groupLabels"
            form={form}
            set={set}
            fields={[
              { key: 'category', label: 'Category (e.g. buildings)' },
              { key: 'label', label: 'Label' },
            ]}
          />
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Card: client label" path="projectsPage.cardLabels.client" form={form} set={set} />
            <Field label="Card: location label" path="projectsPage.cardLabels.location" form={form} set={set} />
            <Field label="Card: contract label" path="projectsPage.cardLabels.contract" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Detail: overview" path="projectsPage.detail.overviewLabel" form={form} set={set} />
            <Field label="Detail: scope label" path="projectsPage.detail.scopeLabel" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Detail: progress" path="projectsPage.detail.progressLabel" form={form} set={set} />
            <Field label="Detail: gallery" path="projectsPage.detail.galleryLabel" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Detail: information" path="projectsPage.detail.informationLabel" form={form} set={set} />
            <Field label="Detail: enquiries CTA" path="projectsPage.detail.enquiriesLabel" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Detail: client fact" path="projectsPage.detail.factLabels.client" form={form} set={set} />
            <Field label="Detail: location fact" path="projectsPage.detail.factLabels.location" form={form} set={set} />
            <Field label="Detail: year fact" path="projectsPage.detail.factLabels.year" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Detail: category fact" path="projectsPage.detail.factLabels.category" form={form} set={set} />
            <Field label="Detail: status fact" path="projectsPage.detail.factLabels.status" form={form} set={set} />
            <Field label="Detail: contract fact" path="projectsPage.detail.factLabels.contract" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Detail: related kicker" path="projectsPage.detail.relatedKicker" form={form} set={set} />
            <Field label="Detail: related title" path="projectsPage.detail.relatedTitle" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Detail: related view-all" path="projectsPage.detail.relatedViewAll" form={form} set={set} />
            <Field label="Detail: registered-work" path="projectsPage.detail.registeredWorkLabel" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Detail: CTA kicker" path="projectsPage.detail.ctaKicker" form={form} set={set} />
            <Field label="Detail: CTA title" path="projectsPage.detail.ctaTitle" form={form} set={set} />
          </div>
          <Field label="Detail: CTA text" path="projectsPage.detail.ctaText" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Detail: CTA primary" path="projectsPage.detail.ctaPrimary" form={form} set={set} />
            <Field label="Detail: CTA secondary" path="projectsPage.detail.ctaSecondary" form={form} set={set} />
          </div>
          <Field label="Detail: back label" path="projectsPage.detail.backLabel" form={form} set={set} />
        </Section>

        <Section title="Capabilities, contact, careers, coverage & 404 copy">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Capabilities: hero kicker" path="capabilitiesPage.heroKicker" form={form} set={set} />
            <Field label="Capabilities: hero title" path="capabilitiesPage.heroTitle" form={form} set={set} />
          </div>
          <Field label="Capabilities: hero lead" path="capabilitiesPage.heroLead" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Capabilities: why kicker" path="capabilitiesPage.whyKicker" form={form} set={set} />
            <Field label="Capabilities: why title" path="capabilitiesPage.whyTitle" form={form} set={set} />
          </div>
          <ObjectList
            label="Capabilities: units (title + description + specs + icon)"
            path="capabilitiesPage.units"
            form={form}
            set={set}
            fields={[
              { key: 'title', label: 'Title' },
              {
                key: 'icon',
                label: 'Icon',
                type: 'select',
                options: [
                  { value: 'factory', label: 'Factory' },
                  { value: 'warehouse', label: 'Warehouse' },
                  { value: 'wrench', label: 'Wrench' },
                  { value: 'truck', label: 'Truck' },
                ],
              },
            { key: 'description', label: 'Description', full: true, type: 'textarea' },
            { key: 'specs', label: 'Spec bullets (one per line)', full: true, type: 'lines' },
            { key: 'anchor', label: 'Anchor (deep-link id)', hint: 'Used by Navbar + Footer links, e.g. concrete-batching' },
          ]}
          />
          <ObjectList
            label="Capabilities: HSEQ / assurance items"
            path="capabilitiesPage.hseq"
            form={form}
            set={set}
            fields={[
              { key: 'title', label: 'Title' },
              { key: 'description', label: 'Description', full: true, type: 'textarea' },
            ]}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Contact: hero kicker" path="contactPage.heroKicker" form={form} set={set} />
            <Field label="Contact: hero title" path="contactPage.heroTitle" form={form} set={set} />
          </div>
          <Field label="Contact: hero lead" path="contactPage.heroLead" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Contact: head-office label" path="contactPage.headOfficeLabel" form={form} set={set} />
            <Field label="Contact: operations label" path="contactPage.operationsLabel" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Contact: operations list" path="contactPage.operationsList" form={form} set={set} />
            <Field label="Contact: all-lines label" path="contactPage.allLinesLabel" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Contact form: kicker" path="contactPage.formKicker" form={form} set={set} />
            <Field label="Contact form: title" path="contactPage.formTitle" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Contact form: submit label" path="contactPage.submitLabel" form={form} set={set} />
            <Field label="Contact form: sending label" path="contactPage.sendingLabel" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Contact form: success toast" path="contactPage.successToast" form={form} set={set} />
            <Field label="Contact form: failure toast" path="contactPage.failToast" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Form field: name" path="contactPage.formLabels.name" form={form} set={set} />
            <Field label="Form field: email" path="contactPage.formLabels.email" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Form field: phone" path="contactPage.formLabels.phone" form={form} set={set} />
            <Field label="Form field: subject" path="contactPage.formLabels.subject" form={form} set={set} />
          </div>
          <Field label="Form field: message" path="contactPage.formLabels.message" form={form} set={set} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Careers: hero kicker" path="careersPage.heroKicker" form={form} set={set} />
            <Field label="Careers: hero title" path="careersPage.heroTitle" form={form} set={set} />
          </div>
          <Field label="Careers: hero lead" path="careersPage.heroLead" form={form} set={set} textarea />
          <div>
            <label className="label">Careers page hero image</label>
            <ImageUploader value={form.careersPage?.image || ''} onChange={(v) => set('careersPage.image', v)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Careers: empty state" path="careersPage.emptyState" form={form} set={set} textarea />
            <Field label="Careers: apply label" path="careersPage.applyLabel" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Careers: open roles kicker" path="careersPage.openRolesKicker" form={form} set={set} />
            <Field label="Careers: open roles title" path="careersPage.openRolesTitle" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Careers: training kicker" path="careersPage.trainingKicker" form={form} set={set} />
            <Field label="Careers: training title" path="careersPage.trainingTitle" form={form} set={set} />
          </div>
          <Field label="Careers: training lead" path="careersPage.trainingLead" form={form} set={set} textarea />
          <ObjectList
            label="Careers: training & development items (title + description)"
            path="careersPage.trainingItems"
            form={form}
            set={set}
            fields={[
              { key: 'title', label: 'Title' },
              { key: 'desc', label: 'Description', full: true, type: 'textarea' },
            ]}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Careers: image alt" path="careersPage.alt" form={form} set={set} />
            <Field label="Where we work: hero kicker" path="whereWeWorkPage.heroKicker" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Where we work: hero title" path="whereWeWorkPage.heroTitle" form={form} set={set} />
            <Field label="Where we work: image alt" path="whereWeWorkPage.alt" form={form} set={set} />
          </div>
          <Field label="Where we work: hero lead" path="whereWeWorkPage.heroLead" form={form} set={set} textarea />
          <div>
            <label className="label">Where we work page hero image</label>
            <ImageUploader value={form.whereWeWorkPage?.image || ''} onChange={(v) => set('whereWeWorkPage.image', v)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="404: title" path="notFoundPage.title" form={form} set={set} />
            <Field label="404: CTA label" path="notFoundPage.ctaLabel" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Search: hero kicker" path="searchPage.heroKicker" form={form} set={set} />
            <Field label="Search: hero title" path="searchPage.heroTitle" form={form} set={set} />
          </div>
          <Field label="Search: hero lead" path="searchPage.heroLead" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Search: input placeholder" path="searchPage.placeholder" form={form} set={set} />
            <Field label="Search: empty state" path="searchPage.emptyState" form={form} set={set} />
          </div>
          <StringList label="Search: suggested terms (one per line)" path="searchPage.suggestions" form={form} set={set} />
          <Field label="404: body" path="notFoundPage.body" form={form} set={set} textarea />
        </Section>

        <Section title="HSEQ page copy">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="HSEQ: hero kicker" path="hseqPage.heroKicker" form={form} set={set} />
            <Field label="HSEQ: hero title" path="hseqPage.heroTitle" form={form} set={set} />
          </div>
          <Field label="HSEQ: hero lead" path="hseqPage.heroLead" form={form} set={set} textarea />
          <ImageUploader value={form.hseqPage?.image || ''} onChange={(v) => set('hseqPage.image', v)} />
          <Field label="HSEQ: hero image alt" path="hseqPage.imageAlt" form={form} set={set} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="HSEQ: safety kicker" path="hseqPage.safetyKicker" form={form} set={set} />
            <Field label="HSEQ: safety title" path="hseqPage.safetyTitle" form={form} set={set} />
          </div>
          <Field label="HSEQ: safety lead" path="hseqPage.safetyLead" form={form} set={set} textarea />
          <ObjectList
            label="HSEQ: safety commitments (title + description)"
            path="hseqPage.safetyCommitments"
            form={form}
            set={set}
            fields={[
              { key: 'title', label: 'Title' },
              { key: 'desc', label: 'Description', full: true, type: 'textarea' },
            ]}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="HSEQ: quality kicker" path="hseqPage.qualityKicker" form={form} set={set} />
            <Field label="HSEQ: quality title" path="hseqPage.qualityTitle" form={form} set={set} />
          </div>
          <ObjectList
            label="HSEQ: concrete quality process (number + title + description)"
            path="hseqPage.qualitySteps"
            form={form}
            set={set}
            fields={[
              { key: 'number', label: 'Number' },
              { key: 'title', label: 'Title' },
              { key: 'desc', label: 'Description', full: true, type: 'textarea' },
            ]}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="HSEQ: registrations kicker" path="hseqPage.registrationsKicker" form={form} set={set} />
            <Field label="HSEQ: registrations title" path="hseqPage.registrationsTitle" form={form} set={set} />
          </div>
          <ObjectList
            label="HSEQ: registrations & compliance (label + value)"
            path="hseqPage.registrations"
            form={form}
            set={set}
            fields={[
              { key: 'label', label: 'Label' },
              { key: 'value', label: 'Value' },
            ]}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Certificates: kicker" path="hseqPage.certificatesKicker" form={form} set={set} />
            <Field label="Certificates: title" path="hseqPage.certificatesTitle" form={form} set={set} />
          </div>
          <Field label="Certificates: lead" path="hseqPage.certificatesLead" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Documents: kicker" path="hseqPage.documentsKicker" form={form} set={set} />
            <Field label="Documents: title" path="hseqPage.documentsTitle" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="HSEQ CTA: title" path="hseqPage.ctaTitle" form={form} set={set} />
            <Field label="HSEQ CTA: text" path="hseqPage.ctaText" form={form} set={set} />
          </div>
        </Section>

        <Section title="Ready-mix & aggregate page copy">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ready-mix: hero kicker" path="readyMixPage.heroKicker" form={form} set={set} />
            <Field label="Ready-mix: hero title" path="readyMixPage.heroTitle" form={form} set={set} />
          </div>
          <Field label="Ready-mix: hero lead" path="readyMixPage.heroLead" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ready-mix: plant kicker" path="readyMixPage.plantKicker" form={form} set={set} />
            <Field label="Ready-mix: plant title" path="readyMixPage.plantTitle" form={form} set={set} />
          </div>
          <ObjectList
            label="Ready-mix: plant facts (label + value)"
            path="readyMixPage.plantFacts"
            form={form}
            set={set}
            fields={[
              { key: 'label', label: 'Label' },
              { key: 'value', label: 'Value' },
            ]}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ready-mix: capacity kicker" path="readyMixPage.capacityKicker" form={form} set={set} />
            <Field label="Ready-mix: capacity title" path="readyMixPage.capacityTitle" form={form} set={set} />
          </div>
          <ObjectList
            label="Ready-mix: production capacity (label + value) - only publish confirmed figures"
            path="readyMixPage.capacityFacts"
            form={form}
            set={set}
            fields={[
              { key: 'label', label: 'Label' },
              { key: 'value', label: 'Value' },
            ]}
          />
          <StringList label="Ready-mix: concrete grades (one per line)" path="readyMixPage.concreteGrades" form={form} set={set} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ready-mix: quality kicker" path="readyMixPage.qualityKicker" form={form} set={set} />
            <Field label="Ready-mix: quality title" path="readyMixPage.qualityTitle" form={form} set={set} />
          </div>
          <StringList label="Ready-mix: quality steps (one per line)" path="readyMixPage.qualitySteps" form={form} set={set} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ready-mix form: kicker" path="readyMixPage.formKicker" form={form} set={set} />
            <Field label="Ready-mix form: title" path="readyMixPage.formTitle" form={form} set={set} />
          </div>
          <Field label="Ready-mix form: lead text" path="readyMixPage.formLead" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ready-mix form: success toast" path="readyMixPage.successToast" form={form} set={set} />
            <Field label="Ready-mix form: failure toast" path="readyMixPage.failToast" form={form} set={set} />
          </div>
          <div>
            <label className="label">Ready-mix page hero image</label>
            <ImageUploader value={form.readyMixPage?.image || ''} onChange={(v) => set('readyMixPage.image', v)} />
          </div>
          <Field label="Ready-mix: hero image alt" path="readyMixPage.imageAlt" form={form} set={set} />

          <hr className="my-6 border-slate-200" />

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Aggregate: hero kicker" path="aggregatePage.heroKicker" form={form} set={set} />
            <Field label="Aggregate: hero title" path="aggregatePage.heroTitle" form={form} set={set} />
          </div>
          <Field label="Aggregate: hero lead" path="aggregatePage.heroLead" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Aggregate: plant kicker" path="aggregatePage.plantKicker" form={form} set={set} />
            <Field label="Aggregate: plant title" path="aggregatePage.plantTitle" form={form} set={set} />
          </div>
          <ObjectList
            label="Aggregate: plant facts (label + value)"
            path="aggregatePage.plantFacts"
            form={form}
            set={set}
            fields={[
              { key: 'label', label: 'Label' },
              { key: 'value', label: 'Value' },
            ]}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Aggregate: output kicker" path="aggregatePage.capacityKicker" form={form} set={set} />
            <Field label="Aggregate: output title" path="aggregatePage.capacityTitle" form={form} set={set} />
          </div>
          <ObjectList
            label="Aggregate: plant output (label + value) - only publish confirmed figures"
            path="aggregatePage.capacityFacts"
            form={form}
            set={set}
            fields={[
              { key: 'label', label: 'Label' },
              { key: 'value', label: 'Value' },
            ]}
          />
          <ObjectList
            label="Aggregate: applications (title + description)"
            path="aggregatePage.products"
            form={form}
            set={set}
            fields={[
              { key: 'title', label: 'Title' },
              { key: 'description', label: 'Description', full: true, type: 'textarea' },
            ]}
          />
          <StringList label="Aggregate: sizes (one per line)" path="aggregatePage.aggregateSizes" form={form} set={set} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Aggregate form: kicker" path="aggregatePage.formKicker" form={form} set={set} />
            <Field label="Aggregate form: title" path="aggregatePage.formTitle" form={form} set={set} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Aggregate form: success toast" path="aggregatePage.successToast" form={form} set={set} />
            <Field label="Aggregate form: failure toast" path="aggregatePage.failToast" form={form} set={set} />
          </div>
          <div>
            <label className="label">Aggregate page hero image</label>
            <ImageUploader value={form.aggregatePage?.image || ''} onChange={(v) => set('aggregatePage.image', v)} />
          </div>
          <Field label="Aggregate: hero image alt" path="aggregatePage.imageAlt" form={form} set={set} />
        </Section>

        <Section title="Equipment page copy">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Equipment: hero kicker" path="equipmentPage.heroKicker" form={form} set={set} />
            <Field label="Equipment: hero title" path="equipmentPage.heroTitle" form={form} set={set} />
          </div>
          <Field label="Equipment: hero lead" path="equipmentPage.heroLead" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Equipment: filter label" path="equipmentPage.filterLabel" form={form} set={set} />
            <Field label="Equipment: search placeholder" path="equipmentPage.searchPlaceholder" form={form} set={set} />
          </div>
          <Field label="Equipment: empty state" path="equipmentPage.emptyState" form={form} set={set} textarea />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Equipment CTA: kicker" path="equipmentPage.ctaKicker" form={form} set={set} />
            <Field label="Equipment CTA: title" path="equipmentPage.ctaTitle" form={form} set={set} />
          </div>
          <Field label="Equipment CTA: text" path="equipmentPage.ctaText" form={form} set={set} textarea />
        </Section>

        <button className="btn-primary" disabled={busy}>
          {busy ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}