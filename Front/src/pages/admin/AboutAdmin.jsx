import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CloudSun,
  Building2,
  Eye,
  Target,
  HeartHandshake,
  Clock3,
  Users,
  Trophy,
  Layers,
  Info,
  Plus,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Landmark,
} from 'lucide-react';
import api from '../../api';
import { useSite } from '../../context/SiteContext';
import SiteImage from '../../components/SiteImage';
import ImageUploader from '../../components/ImageUploader';

const DEFAULT_ABOUT = {
  hero: { kicker: 'About Kascon', title: 'Building Ethiopia with integrity since 1980.' },
  company: { kicker: 'Our company', title: 'Multidisciplinary Grade-1 contractor' },
  values: { kicker: 'Values', title: 'What guides every project' },
  timeline: { kicker: 'Timeline', title: 'History & milestones' },
  leadership: { kicker: 'Leadership', title: 'Governance & key personnel' },
  awards: { kicker: 'Recognition', title: 'Awards & excellence' },
  specializations: { kicker: 'Specialization', title: 'Areas of specialization' },
  founder: { kicker: 'Founder', title: 'Founder & historical background' },
};

// Initial content mirrors the existing company story. Shown on the frontend
// until the administrator edits and saves them from this panel.
const DEFAULT_HISTORICAL_CONTENT = [
  { title: '1960s (E.C.) \u2013 Licensed contractor', description: 'Ato Kassa Gebretsadik Abebe began licensed contracting during Ethiopia\u2019s growth era, laying the foundation for the family enterprise.' },
  { title: '1980 \u2013 Company founded', description: 'Kassa G/Tsadik Building Contractor was established in April 1980.' },
  { title: '1998 \u2013 Incorporation', description: 'The enterprise was reconstituted as Kassa & Sons Construction PLC.' },
  { title: '2002 \u2013 Shell recognition', description: 'Recognized Best Contractor by Shell Ethiopia in 2002, 2003 and 2007.' },
  { title: '2012 \u2013 Energy depots', description: 'Delivered civil works for Total Ethiopia Dukem depot, proving fuel & depot capability.' },
  { title: '2024/2025 \u2013 Gold excellence', description: 'Gold Level Organizational Excellence & Leadership Award for 2024/2025.' },
];

// Initial content mirrors the company's existing About Us story. Shown on the
// frontend until the administrator edits and saves them from this panel.
const DEFAULT_SPECIALIZATIONS = [
  { title: 'Building Construction', description: 'Residential, commercial and mixed-use buildings delivered from foundation to finishing.' },
  { title: 'Fuel Stations & Depots', description: 'New stations, forecourt upgrades, tank farms, petroleum depots and aviation depots.' },
  { title: 'Civil Works & Roads', description: 'Roads, earthworks, drainage and site infrastructure for industrial and public clients.' },
  { title: 'Structural Metal Works', description: 'In-house steel fabrication, canopies and technical metal works.' },
  { title: 'Woodwork & Interiors', description: 'Bespoke furniture, joinery and interior fit-out coordinated with handover.' },
  { title: 'Crushed Aggregates', description: 'Owned quarry and crushing plant supplying graded aggregate for projects and external demand.' },
];

export default function AboutAdmin() {
  const { refresh } = useSite();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) =>
      setForm({
        ...r.data,
        about: { ...DEFAULT_ABOUT, ...r.data.about },
        values: r.data.values || [],
        specializations: r.data.specializations?.length ? r.data.specializations : DEFAULT_SPECIALIZATIONS,
        historicalContent: r.data.historicalContent?.length ? r.data.historicalContent : DEFAULT_HISTORICAL_CONTENT,
      })
    );
  }, []);

  if (!form) return <div className="text-slate-400">Loading about page...</div>;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setBlock = (block, key, value) =>
    setForm((f) => ({ ...f, about: { ...f.about, [block]: { ...(f.about?.[block] || {}), [key]: value } } }));

  // ---- Values editor (same pattern as the existing values list) ----
  const addValue = () => set('values', [...(form.values || []), { title: '', description: '' }]);
  const setValue = (index, key, value) =>
    setForm((f) => ({
      ...f,
      values: f.values.map((v, i) => (i === index ? { ...v, [key]: value } : v)),
    }));
  const moveValue = (index, dir) => {
    const next = [...(form.values || [])];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    set('values', next);
  };
  const removeValue = (index) => set('values', (form.values || []).filter((_, i) => i !== index));

  // ---- Specializations editor (mirrors the values editor) ----
  const addSpec = () => set('specializations', [...(form.specializations || []), { title: '', description: '' }]);
  const setSpec = (index, key, value) =>
    setForm((f) => ({
      ...f,
      specializations: f.specializations.map((s, i) => (i === index ? { ...s, [key]: value } : s)),
    }));
  const moveSpec = (index, dir) => {
    const next = [...(form.specializations || [])];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    set('specializations', next);
  };
  const removeSpec = (index) => set('specializations', (form.specializations || []).filter((_, i) => i !== index));

  // ---- Historical content editor (mirrors the specializations editor) ----
  const addHist = () => set('historicalContent', [...(form.historicalContent || []), { title: '', description: '' }]);
  const setHist = (index, key, value) =>
    setForm((f) => ({
      ...f,
      historicalContent: f.historicalContent.map((h, i) => (i === index ? { ...h, [key]: value } : h)),
    }));
  const moveHist = (index, dir) => {
    const next = [...(form.historicalContent || [])];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    set('historicalContent', next);
  };
  const removeHist = (index) => set('historicalContent', (form.historicalContent || []).filter((_, i) => i !== index));

  const validate = () => {
    if (!(form.about?.hero?.title || '').trim()) {
      toast.error('Banner heading is required');
      return false;
    }
    if (!(form.aboutShort || '').trim()) {
      toast.error('Short intro is required');
      return false;
    }
    if ((form.specializations || []).some((s) => !(s.title || '').trim())) {
      toast.error('Every area of specialization needs a title');
      return false;
    }
    return true;
  };

  const save = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      await api.put('/settings', {
        about: form.about,
        aboutShort: form.aboutShort,
        aboutLong: form.aboutLong,
        vision: form.vision,
        mission: form.mission,
        capital: form.capital,
        grade: form.grade,
        foundedYear: form.foundedYear,
        yearsExperience: form.yearsExperience,
        projectCount: form.projectCount,
        specialists: form.specialists,
        values: form.values || [],
        specializations: form.specializations || [],
        historicalContent: form.historicalContent || [],
        foundingStory: form.foundingStory,
        historicalBackground: form.historicalBackground,
        ownerName: form.ownerName,
        ownerTitle: form.ownerTitle,
        ownerBio: form.ownerBio,
        ownerImage: form.ownerImage,
      });
      await refresh();
      toast.success('About page saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const header = (Icon, title, hint) => (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-8 w-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
        <Icon size={16} />
      </div>
      <div>
        <h2 className="font-display font-bold text-navy">{title}</h2>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );

  const sectionHeaderFields = (block, Icon, title, hint) => (
    <div className="card p-6 space-y-4">
      {header(Icon, title, hint)}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Kicker</label>
          <input className="input" value={form.about[block].kicker || ''} onChange={(e) => setBlock(block, 'kicker', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Title</label>
          <input className="input" value={form.about[block].title || ''} onChange={(e) => setBlock(block, 'title', e.target.value)} />
        </div>
      </div>
    </div>
  );

  // Reusable list editor for values / specializations (identical UI to the
  // existing values editor).
  const listEditor = ({ items, start, setItem, move, remove, add, label, emptyHint }) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-slate-400">
          {emptyHint}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((v, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-slate-400">
                  <GripVertical size={14} />
                  <span className="text-xs font-semibold">
                    {label} {i + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 text-slate-400">
                    <button type="button" className="text-xs font-semibold hover:text-brand" onClick={() => move(i, -1)}>
                      Up
                    </button>
                    <button type="button" className="text-xs font-semibold hover:text-brand" onClick={() => move(i, 1)}>
                      Down
                    </button>
                  </div>
                  <button type="button" onClick={() => remove(i)} className="p-2 rounded-lg text-accent hover:bg-red-50" aria-label={`Remove ${label.toLowerCase()}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Title</label>
                <input className="input" value={v.title || ''} onChange={(e) => setItem(i, 'title', e.target.value)} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[70px]" value={v.description || ''} onChange={(e) => setItem(i, 'description', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      )}
      <button type="button" className="btn-ghost !py-2.5" onClick={add}>
        <Plus size={16} /> Add {label.toLowerCase()}
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy">About Page</h1>
        <p className="text-sm text-slate-400 mt-1">
          Edit the banner, story, founder & historical background, specialization areas, vision, mission, values, key company facts and section headings on the frontend About page.
        </p>
      </div>

      <form onSubmit={save} className="space-y-6 max-w-4xl">
        <div className="card p-6 space-y-4">
          {header(CloudSun, 'Page banner', 'Blue hero banner at the top of the About page.')}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Kicker</label>
              <input className="input" value={form.about.hero.kicker || ''} onChange={(e) => setBlock('hero', 'kicker', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Heading</label>
              <input className="input" value={form.about.hero.title || ''} onChange={(e) => setBlock('hero', 'title', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Short intro</label>
              <textarea className="input min-h-[90px]" value={form.aboutShort || ''} onChange={(e) => set('aboutShort', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Hero background image</label>
            <ImageUploader value={form.about?.hero?.image || ''} onChange={(v) => setBlock('hero', 'image', v)} />
          </div>
        </div>

        {sectionHeaderFields('company', Building2, 'Company story', 'Left column with the full company description.')}

        <div className="card p-6 space-y-4">
          {header(Building2, 'Company description & key facts', 'Long story text plus the key company information cards.')}
          <div>
            <label className="label">Full description</label>
            <textarea className="input min-h-[160px]" value={form.aboutLong || ''} onChange={(e) => set('aboutLong', e.target.value)} />
          </div>
          <div>
            <label className="label">Company editorial image</label>
            <ImageUploader value={form.about?.company?.aboutImage || ''} onChange={(v) => setBlock('company', 'aboutImage', v)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Capital</label>
              <input className="input" value={form.capital || ''} onChange={(e) => set('capital', e.target.value)} />
            </div>
            <div>
              <label className="label">Licence / grade</label>
              <input className="input" value={form.grade || ''} onChange={(e) => set('grade', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          {header(Info, 'Key company information', 'The facts cards shown beside the long story on the About page.')}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Founded year</label>
              <input className="input" value={form.foundedYear || ''} onChange={(e) => set('foundedYear', e.target.value)} />
            </div>
            <div>
              <label className="label">Years of experience</label>
              <input className="input" value={form.yearsExperience || ''} onChange={(e) => set('yearsExperience', e.target.value)} />
            </div>
            <div>
              <label className="label">Documented projects</label>
              <input className="input" value={form.projectCount || ''} onChange={(e) => set('projectCount', e.target.value)} />
            </div>
            <div>
              <label className="label">Technical specialists</label>
              <input className="input" value={form.specialists || ''} onChange={(e) => set('specialists', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          {header(Eye, 'Vision & mission', 'The two side cards next to the company story.')}
          <div>
            <label className="label">Vision</label>
            <textarea className="input min-h-[90px]" value={form.vision || ''} onChange={(e) => set('vision', e.target.value)} />
          </div>
          <div>
            <label className="label">Mission</label>
            <textarea className="input min-h-[90px]" value={form.mission || ''} onChange={(e) => set('mission', e.target.value)} />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          {header(HeartHandshake, 'Values', 'Kicker/title plus the value cards. Reorder with Up / Down.')}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Kicker</label>
              <input className="input" value={form.about.values.kicker || ''} onChange={(e) => setBlock('values', 'kicker', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Title</label>
              <input className="input" value={form.about.values.title || ''} onChange={(e) => setBlock('values', 'title', e.target.value)} />
            </div>
          </div>
          {listEditor({
            items: form.values || [],
            start: 0,
            setItem: setValue,
            move: moveValue,
            remove: removeValue,
            add: addValue,
            label: 'Value',
            emptyHint: 'No values yet. Add your first one.',
          })}
        </div>

        <div className="card p-6 space-y-4">
          {header(Layers, 'Areas of specialization', 'Kicker/title plus the specialization cards. Reorder with Up / Down.')}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Kicker</label>
              <input className="input" value={form.about.specializations.kicker || ''} onChange={(e) => setBlock('specializations', 'kicker', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Title</label>
              <input className="input" value={form.about.specializations.title || ''} onChange={(e) => setBlock('specializations', 'title', e.target.value)} />
            </div>
          </div>
          {listEditor({
            items: form.specializations || [],
            start: 0,
            setItem: setSpec,
            move: moveSpec,
            remove: removeSpec,
            add: addSpec,
            label: 'Area',
            emptyHint: 'No areas yet. Add your first one.',
          })}
        </div>

        <div className="card p-6 space-y-4">
          {header(Landmark, 'Founder & historical background', 'Founder profile plus the company founding story, historical background and milestone notes.')}
          <div className="grid lg:grid-cols-[220px_1fr] gap-5">
            <div className="space-y-3">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                {form.ownerImage ? (
                  <SiteImage src={form.ownerImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full grid place-items-center text-slate-300">
                    <ImageIcon size={36} />
                  </div>
                )}
              </div>
              <ImageUploader value={form.ownerImage || ''} onChange={(v) => set('ownerImage', v)} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 content-start">
              <div>
                <label className="label">Founder name</label>
                <input className="input" value={form.ownerName || ''} onChange={(e) => set('ownerName', e.target.value)} />
              </div>
              <div>
                <label className="label">Title / role</label>
                <input className="input" value={form.ownerTitle || ''} onChange={(e) => set('ownerTitle', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Founder background</label>
                <textarea className="input min-h-[120px]" value={form.ownerBio || ''} onChange={(e) => set('ownerBio', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Company founding story</label>
                <textarea className="input min-h-[110px]" value={form.foundingStory || ''} onChange={(e) => set('foundingStory', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Historical background</label>
                <textarea className="input min-h-[110px]" value={form.historicalBackground || ''} onChange={(e) => set('historicalBackground', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Kicker</label>
              <input className="input" value={form.about.founder.kicker || ''} onChange={(e) => setBlock('founder', 'kicker', e.target.value)} />
            </div>
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.about.founder.title || ''} onChange={(e) => setBlock('founder', 'title', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Additional historical content</label>
            {listEditor({
              items: form.historicalContent || [],
              start: 0,
              setItem: setHist,
              move: moveHist,
              remove: removeHist,
              add: addHist,
              label: 'Milestone / note',
              emptyHint: 'No historical notes yet. Add your first one.',
            })}
          </div>
        </div>

        {sectionHeaderFields('timeline', Clock3, 'Timeline section heading', 'Above the "History & milestones" timeline (items managed in Milestones).')}
        {sectionHeaderFields('leadership', Users, 'Leadership section heading', 'Above the team grid (people managed in Team).')}
        {sectionHeaderFields('awards', Trophy, 'Awards section heading', 'Above the awards grid (awards managed in Awards).')}

        <button className="btn-primary" disabled={busy}>
          {busy ? 'Saving...' : 'Save About Page'}
        </button>
      </form>
    </div>
  );
}