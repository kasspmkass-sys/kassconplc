import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X, Plus, Image as ImageIcon, Layout, LayoutGrid, GripVertical, ListOrdered } from 'lucide-react';
import api from '../../api';
import { useSite } from '../../context/SiteContext';
import SiteImage from '../../components/SiteImage';
import ImageUploader from '../../components/ImageUploader';

const DEFAULT_NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/projects', label: 'Projects' },
  { to: '/capabilities', label: 'Capabilities' },
  { to: '/contact', label: 'Contact' },
];

/* Fallback for the Capabilities footer column until links are saved here. */
const DEFAULT_CAPABILITY_LINKS = [
  { to: '/capabilities#concrete-batching', label: 'Concrete Batching Plant' },
  { to: '/capabilities#stone-crushing',    label: 'Stone Crushing Plant' },
  { to: '/capabilities#steel-fabrication', label: 'Steel Fabrication' },
  { to: '/capabilities#fleet-auto-shop',   label: 'Fleet & Auto Shop' },
  { to: '/ready-mix',                      label: 'Ready-Mix Concrete' },
  { to: '/aggregate',                      label: 'Aggregate Supply' },
  { to: '/equipment',                      label: 'Equipment Gallery' },
  { to: '/hseq',                           label: 'HSEQ System' },
  { to: '/news',                           label: 'News & Updates' },
  { to: '/downloads',                      label: 'Downloads' },
];

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 cursor-pointer group">
      <span className="text-sm text-slate-700 group-hover:text-navy transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
          checked ? 'bg-brand' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}

function LinkListEditor({ items, onChangeUpdate, onChangeRemove }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-slate-300 shrink-0">
            <GripVertical size={16} />
          </span>
          <input
            className="input flex-1 text-sm"
            placeholder="Label"
            value={it.label}
            onChange={(e) => onChangeUpdate(i, 'label', e.target.value)}
          />
          <input
            className="input flex-1 text-sm text-slate-500"
            placeholder="/path or full URL"
            value={it.to}
            onChange={(e) => onChangeUpdate(i, 'to', e.target.value)}
          />
          <button
            type="button"
            onClick={() => onChangeRemove(i)}
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors shrink-0"
            aria-label="Remove link"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function HeaderFooterAdmin() {
  const { refresh } = useSite();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) => setForm(r.data));
  }, []);

  if (!form) return <div className="text-slate-400">Loading settings...</div>;

  const header = form.header || {};
  const footer = form.footer || {};
  const navLinks = Array.isArray(header.navLinks) ? header.navLinks : DEFAULT_NAV_LINKS;
  const logoSize = form.logoSize || 44;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setSocial = (key, value) =>
    setForm((f) => ({ ...f, social: { ...(f.social || {}), [key]: value } }));

  const setHeader = (key, value) =>
    setForm((f) => ({ ...f, header: { ...(f.header || {}), [key]: value } }));

  const setFooter = (key, value) =>
    setForm((f) => ({ ...f, footer: { ...(f.footer || {}), [key]: value } }));

  const menuOf = (key) => (Array.isArray(header[key]) ? header[key] : []);
  const setMenu = (key, list) => setHeader(key, list);
  const updateMenuItem = (key, index, field, value) =>
    setMenu(key, menuOf(key).map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  const addMenuItem = (key) => setMenu(key, [...menuOf(key), { label: '', to: '' }]);
  const removeMenuItem = (key, index) => setMenu(key, menuOf(key).filter((_, i) => i !== index));

  const exploreLinks = Array.isArray(footer.exploreLinks) && footer.exploreLinks.length
    ? footer.exploreLinks
    : DEFAULT_NAV_LINKS;
  const updateExplore = (index, field, value) =>
    setFooter('exploreLinks', exploreLinks.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  const addExplore = () => setFooter('exploreLinks', [...exploreLinks, { label: '', to: '' }]);
  const removeExplore = (index) => setFooter('exploreLinks', exploreLinks.filter((_, i) => i !== index));

  const capabilityLinks = Array.isArray(footer.capabilityLinks) && footer.capabilityLinks.length
    ? footer.capabilityLinks
    : DEFAULT_CAPABILITY_LINKS;
  const updateCapability = (index, field, value) =>
    setFooter('capabilityLinks', capabilityLinks.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  const addCapability = () => setFooter('capabilityLinks', [...capabilityLinks, { label: '', to: '' }]);
  const removeCapability = (index) => setFooter('capabilityLinks', capabilityLinks.filter((_, i) => i !== index));

  const updateNavLink = (index, key, value) => {
    const next = navLinks.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    setHeader('navLinks', next);
  };

  const addNavLink = () => setHeader('navLinks', [...navLinks, { to: '/', label: 'New link' }]);

  const removeNavLink = (index) =>
    setHeader(
      'navLinks',
      navLinks.filter((_, i) => i !== index)
    );

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put('/settings', {
        logo: form.logo,
        logoSize: Number(logoSize) || 44,
        header: {
          name: header.name,
          subtitle: header.subtitle,
          showPhone: !!header.showPhone,
          showProfile: !!header.showProfile,
          showQuote: !!header.showQuote,
          quoteLabel: header.quoteLabel,
          profileLabel: header.profileLabel,
          navLinks,
          aboutMenu: menuOf('aboutMenu'),
          projectsMenu: menuOf('projectsMenu'),
          capabilitiesMenu: menuOf('capabilitiesMenu'),
        },
        footer: {
          aboutText: footer.aboutText,
          copyright: footer.copyright,
          showSocial: !!footer.showSocial,
          showExplore: !!footer.showExplore,
          showContact: !!footer.showContact,
          showOperations: !!footer.showOperations,
          showAdminLink: !!footer.showAdminLink,
          exploreLinks,
          exploreTitle: footer.exploreTitle,
          servicesTitle: footer.servicesTitle,
          contactTitle: footer.contactTitle,
          servicesCta: footer.servicesCta,
          capabilityLinks,
        },
        social: form.social || {},
      });
      await refresh();
      toast.success('Header & Footer saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy">Header & Footer</h1>
        <p className="text-sm text-slate-400 mt-1">
          Control logo, brand name, navigation links and footer content.
        </p>
      </div>

      <form onSubmit={save} className="space-y-6 max-w-4xl">
        {/* ─── HEADER ─── */}
        <div className="card p-6 space-y-6">
          <div className="flex items-center gap-2 text-navy">
            <Layout size={18} />
            <h2 className="font-display font-bold text-lg">Header</h2>
          </div>

          {/* Logo */}
          <div className="grid sm:grid-cols-[200px_1fr] gap-6">
            <div className="space-y-3">
              <label className="label">Logo</label>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center">
                {form.logo ? (
                  <SiteImage src={form.logo} alt="Logo" className="max-w-full max-h-full object-contain p-3" />
                ) : (
                  <div className="grid place-items-center text-slate-300">
                    <ImageIcon size={40} />
                  </div>
                )}
              </div>
              <ImageUploader value={form.logo || ''} onChange={(v) => set('logo', v)} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Logo size (height px)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="24"
                    max="80"
                    value={Number(logoSize) || 44}
                    onChange={(e) => set('logoSize', Number(e.target.value))}
                    className="flex-1 accent-brand"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="16"
                      max="120"
                      className="input w-20 text-center text-sm"
                      value={Number(logoSize) || 44}
                      onChange={(e) => set('logoSize', Number(e.target.value) || 44)}
                    />
                    <span className="text-xs text-slate-400">px</span>
                  </div>
                </div>
                {/* Preview */}
                <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {form.logo ? (
                      <SiteImage src={form.logo} alt="" className="object-contain" style={{ height: Number(logoSize) || 44 }} />
                    ) : (
                      <div className="flex items-center justify-center rounded-lg bg-brand text-white font-display font-bold" style={{ width: Number(logoSize) || 44, height: Number(logoSize) || 44 }}>
                        KS
                      </div>
                    )}
                    <div className="leading-tight">
                      <div className="font-display font-bold text-sm text-navy">{header.name || 'Kassa & Sons'}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">{header.subtitle || 'Construction PLC'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Brand text */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Brand name</label>
              <input className="input" value={header.name || ''} onChange={(e) => setHeader('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Subtitle</label>
              <input className="input" value={header.subtitle || ''} onChange={(e) => setHeader('subtitle', e.target.value)} />
            </div>
          </div>

          {/* Header toggles */}
          <div className="divide-y border-t border-slate-100">
            <Toggle label="Show phone number in header" checked={!!header.showPhone} onChange={(v) => setHeader('showPhone', v)} />
            <Toggle label='Show "Company Profile" download button' checked={!!header.showProfile} onChange={(v) => setHeader('showProfile', v)} />
            <Toggle label='Show "Get a Quote" CTA button' checked={!!header.showQuote} onChange={(v) => setHeader('showQuote', v)} />
          </div>

          {/* Navigation links */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label !mb-0">Main navigation links</label>
              <button type="button" onClick={addNavLink} className="text-xs font-semibold text-brand hover:text-brand-dark inline-flex items-center gap-1">
                <Plus size={14} /> Add link
              </button>
            </div>
            <LinkListEditor items={navLinks} onChangeUpdate={updateNavLink} onChangeRemove={removeNavLink} />
          </div>

          {/* Header labels */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">"Get a Quote" button label</label>
              <input
                className="input"
                placeholder="Request a Consultation"
                value={header.quoteLabel || ''}
                onChange={(e) => setHeader('quoteLabel', e.target.value)}
              />
            </div>
            <div>
              <label className="label">"Company Profile" download label</label>
              <input
                className="input"
                placeholder="Company Profile"
                value={header.profileLabel || ''}
                onChange={(e) => setHeader('profileLabel', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ─── DROPDOWN MENUS ─── */}
        <div className="card p-6 space-y-6">
          <div className="flex items-center gap-2 text-navy">
            <ListOrdered size={18} />
            <h2 className="font-display font-bold text-lg">Dropdown menus</h2>
          </div>
          <p className="text-xs text-slate-400 -mt-4">
            Links shown under About, Projects and Capabilities in the navigation. Leave a menu empty to use the default links.
          </p>

          {[
            ['aboutMenu', 'About dropdown'],
            ['projectsMenu', 'Projects dropdown'],
            ['capabilitiesMenu', 'Capabilities dropdown'],
          ].map(([key, label]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-3">
                <label className="label !mb-0">{label}</label>
                <button type="button" onClick={() => addMenuItem(key)} className="text-xs font-semibold text-brand hover:text-brand-dark inline-flex items-center gap-1">
                  <Plus size={14} /> Add link
                </button>
              </div>
              <LinkListEditor
                items={menuOf(key)}
                onChangeUpdate={(i, f, v) => updateMenuItem(key, i, f, v)}
                onChangeRemove={(i) => removeMenuItem(key, i)}
              />
              {menuOf(key).length === 0 && (
                <p className="text-[11px] text-slate-400">Empty - defaults are used.</p>
              )}
            </div>
          ))}
        </div>

        {/* ─── FOOTER ─── */}
        <div className="card p-6 space-y-6">
          <div className="flex items-center gap-2 text-navy">
            <LayoutGrid size={18} />
            <h2 className="font-display font-bold text-lg">Footer</h2>
          </div>

          <div>
            <label className="label">About / tagline paragraph</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="Shown in the first footer column below the logo"
              value={footer.aboutText || ''}
              onChange={(e) => setFooter('aboutText', e.target.value)}
            />
          </div>

          <div>
            <label className="label">Copyright text</label>
            <input
              className="input"
              placeholder="Leave blank for default"
              value={footer.copyright || ''}
              onChange={(e) => setFooter('copyright', e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Explore column title</label>
              <input className="input" placeholder="Company" value={footer.exploreTitle || ''} onChange={(e) => setFooter('exploreTitle', e.target.value)} />
            </div>
            <div>
              <label className="label">Capabilities column title</label>
              <input className="input" placeholder="Capabilities" value={footer.servicesTitle || ''} onChange={(e) => setFooter('servicesTitle', e.target.value)} />
            </div>
            <div>
              <label className="label">Contact column title</label>
              <input className="input" placeholder="Contact" value={footer.contactTitle || ''} onChange={(e) => setFooter('contactTitle', e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <label className="label">Capabilities column "view all" label</label>
              <input className="input" placeholder="All services" value={footer.servicesCta || ''} onChange={(e) => setFooter('servicesCta', e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label !mb-0">Explore links</label>
              <button type="button" onClick={addExplore} className="text-xs font-semibold text-brand hover:text-brand-dark inline-flex items-center gap-1">
                <Plus size={14} /> Add link
              </button>
            </div>
            <LinkListEditor items={exploreLinks} onChangeUpdate={updateExplore} onChangeRemove={removeExplore} />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Shown in the "Explore" footer column. Leave empty to use the main navigation links.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label !mb-0">Capabilities links</label>
              <button type="button" onClick={addCapability} className="text-xs font-semibold text-brand hover:text-brand-dark inline-flex items-center gap-1">
                <Plus size={14} /> Add link
              </button>
            </div>
            <LinkListEditor items={capabilityLinks} onChangeUpdate={updateCapability} onChangeRemove={removeCapability} />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Shown in the Capabilities footer column, under the column title above. Anchor links such as
              /capabilities#stone-crushing are supported.
            </p>
          </div>

          <div>
            <label className="label">Social media links</label>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label !mb-1.5">Facebook URL</label>
                <input className="input" value={form.social?.facebook || ''} onChange={(e) => setSocial('facebook', e.target.value)} />
              </div>
              <div>
                <label className="label !mb-1.5">LinkedIn URL</label>
                <input className="input" value={form.social?.linkedin || ''} onChange={(e) => setSocial('linkedin', e.target.value)} />
              </div>
              <div>
                <label className="label !mb-1.5">YouTube URL</label>
                <input className="input" value={form.social?.youtube || ''} onChange={(e) => setSocial('youtube', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="divide-y border-t border-slate-100">
            <Toggle label="Show social media icons" checked={!!footer.showSocial} onChange={(v) => setFooter('showSocial', v)} />
            <Toggle label='Show "Explore" column' checked={!!footer.showExplore} onChange={(v) => setFooter('showExplore', v)} />
            <Toggle label='Show "Head Office" column (address, phone, email)' checked={!!footer.showContact} onChange={(v) => setFooter('showContact', v)} />
            <Toggle label='Show "Operations" column' checked={!!footer.showOperations} onChange={(v) => setFooter('showOperations', v)} />
            <Toggle label="Show admin link in footer" checked={!!footer.showAdminLink} onChange={(v) => setFooter('showAdminLink', v)} />
          </div>
        </div>

        <button className="btn-primary" disabled={busy}>
          {busy ? 'Saving...' : 'Save Header & Footer'}
        </button>
      </form>
    </div>
  );
}
