/**
 * NEWS / UPDATES ADMIN
 * Manages /news collection (NewsUpdate model).
 * Types: news | project-milestone | equipment | announcement | completion
 */
import { useEffect, useState } from 'react';
import { X, Plus, Edit2, Trash2, Save, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import ImageUploader from '../../components/ImageUploader';
import SiteImage from '../../components/SiteImage';

const TYPES = [
  { value: 'news',              label: 'News' },
  { value: 'project-milestone', label: 'Project Milestone' },
  { value: 'announcement',      label: 'Announcement' },
  { value: 'completion',        label: 'Completion' },
  { value: 'equipment',         label: 'Equipment Update' },
];

const EMPTY = {
  title: '', type: 'news', summary: '', body: '', image: '',
  date: new Date().toISOString().slice(0, 10),
  featured: false, order: 0, published: true,
};

export default function NewsAdmin() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/news').then((r) => setItems(r.data || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm({ ...EMPTY, date: new Date().toISOString().slice(0, 10) }); setModal('new'); };
  const openEdit = (item) => {
    setForm({ ...EMPTY, ...item, date: item.date ? new Date(item.date).toISOString().slice(0, 10) : EMPTY.date });
    setModal(item);
  };
  const closeModal = () => setModal(null);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      if (modal === 'new') {
        await api.post('/news', form);
        toast.success('Update added');
      } else {
        await api.put(`/news/${modal._id}`, form);
        toast.success('Update saved');
      }
      closeModal();
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await api.delete(`/news/${item._id}`);
      toast.success('Deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const typeLabel = (v) => TYPES.find((t) => t.value === v)?.label || v;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">News & Updates</h1>
          <p className="text-sm text-slate-500 mt-1">Project milestones, announcements, completions and news.</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Update
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4">{[1,2,3].map((i) => <div key={i} className="skeleton h-20 rounded" />)}</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-lg py-16 text-center">
          <p className="text-slate-400 mb-4">No updates yet.</p>
          <button onClick={openNew} className="btn-primary">Add First Update</button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="flex items-center gap-4 border border-slate-200 bg-white rounded-lg p-4">
              {item.image && (
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded bg-slate-100">
                  <SiteImage src={item.image} alt={item.title} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-navy truncate">{item.title}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-navy/5 text-navy px-2 py-0.5 rounded">
                    {typeLabel(item.type)}
                  </span>
                  {item.featured && (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-accent/10 text-accent px-2 py-0.5 rounded">Featured</span>
                  )}
                  {!item.published && (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded">Hidden</span>
                  )}
                </div>
                {item.summary && <p className="text-sm text-slate-500 mt-0.5 truncate">{item.summary}</p>}
                <p className="text-xs text-slate-400 mt-0.5">{item.date ? new Date(item.date).toLocaleDateString('en-GB') : ''}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-navy"><Edit2 size={16} /></button>
                <button onClick={() => remove(item)} className="p-1.5 text-slate-400 hover:text-accent"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="font-bold text-navy text-lg">{modal === 'new' ? 'Add Update' : 'Edit Update'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-5">
              <div>
                <label className="label">Title *</label>
                <input className="input" name="title" required value={form.title} onChange={onChange} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select className="input" name="type" value={form.type} onChange={onChange}>
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input className="input" name="date" type="date" value={form.date} onChange={onChange} />
                </div>
              </div>

              <div>
                <label className="label">Summary (shown in cards)</label>
                <textarea className="input min-h-[80px]" name="summary" value={form.summary || ''} onChange={onChange} />
              </div>

              <div>
                <label className="label">Full Content</label>
                <textarea className="input min-h-[140px]" name="body" value={form.body || ''} onChange={onChange} />
              </div>

              <div>
                <label className="label">Image</label>
                <ImageUploader
                  value={form.image || ''}
                  onChange={(url) => setForm((f) => ({ ...f, image: url }))}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="news-feat" name="featured" checked={!!form.featured} onChange={onChange} className="h-4 w-4" />
                  <label htmlFor="news-feat" className="text-sm text-slate-700">Featured (shown first)</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="news-pub" name="published" checked={!!form.published} onChange={onChange} className="h-4 w-4" />
                  <label htmlFor="news-pub" className="text-sm text-slate-700">Published</label>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-200">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-55">
                  <Save size={15} /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
