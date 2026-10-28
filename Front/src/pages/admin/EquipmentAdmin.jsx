/**
 * EQUIPMENT ADMIN
 * Manages the Equipment collection (/equipment).
 * Backed by /equipment → Equipment model.
 * Images stored in GridFS via /upload.
 */
import { useEffect, useState } from 'react';
import { X, Plus, ChevronUp, ChevronDown, Edit2, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import ImageUploader from '../../components/ImageUploader';
import SiteImage from '../../components/SiteImage';

const CATEGORIES = [
  'Earthmoving',
  'Transport',
  'Concrete',
  'Lifting',
  'Crushing',
  'Support Equipment',
];

const EMPTY = {
  name: '', model: '', category: 'Earthmoving', capacity: '',
  quantity: '', mainUse: '', description: '', image: '',
  order: 0, published: true,
};

export default function EquipmentAdmin() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null); // null | 'new' | item object
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/equipment').then((r) => setItems(r.data || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(EMPTY); setModal('new'); };
  const openEdit = (item) => { setForm({ ...EMPTY, ...item }); setModal(item); };
  const closeModal = () => setModal(null);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (modal === 'new') {
        await api.post('/equipment', form);
        toast.success('Equipment added');
      } else {
        await api.put(`/equipment/${modal._id}`, form);
        toast.success('Equipment updated');
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
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await api.delete(`/equipment/${item._id}`);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const reorder = async (idx, dir) => {
    const next = [...items];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const [a, b] = [next[idx], next[swap]];
    try {
      await Promise.all([
        api.put(`/equipment/${a._id}`, { order: idx }),
        api.put(`/equipment/${b._id}`, { order: swap }),
      ]);
      load();
    } catch { toast.error('Reorder failed'); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Equipment & Fleet</h1>
          <p className="text-sm text-slate-500 mt-1">Manage equipment items shown on the /equipment page.</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Equipment
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1,2,3].map((i) => <div key={i} className="skeleton h-20 rounded" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-lg py-16 text-center">
          <p className="text-slate-400 mb-4">No equipment items yet.</p>
          <button onClick={openNew} className="btn-primary">Add First Item</button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item._id} className="flex items-center gap-4 border border-slate-200 bg-white rounded-lg p-4">
              {item.image && (
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded bg-slate-100">
                  <SiteImage src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-navy">{item.name}</span>
                  {item.model && <span className="text-xs text-slate-400">{item.model}</span>}
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-navy/5 text-navy px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  {!item.published && (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded">
                      Hidden
                    </span>
                  )}
                </div>
                {item.mainUse && <p className="text-sm text-slate-500 mt-0.5 truncate">{item.mainUse}</p>}
                {item.capacity && <p className="text-xs text-slate-400 mt-0.5">Capacity: {item.capacity}{item.quantity ? ` · Qty: ${item.quantity}` : ''}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => reorder(idx, -1)} disabled={idx === 0} className="p-1.5 text-slate-400 hover:text-navy disabled:opacity-30"><ChevronUp size={16} /></button>
                <button onClick={() => reorder(idx, 1)} disabled={idx === items.length - 1} className="p-1.5 text-slate-400 hover:text-navy disabled:opacity-30"><ChevronDown size={16} /></button>
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
              <h2 className="font-bold text-navy text-lg">{modal === 'new' ? 'Add Equipment' : 'Edit Equipment'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Equipment Name *</label>
                  <input className="input" name="name" required value={form.name} onChange={onChange} />
                </div>
                <div>
                  <label className="label">Model / Make</label>
                  <input className="input" name="model" value={form.model || ''} onChange={onChange} placeholder="e.g. Liebherr HTM 904" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select className="input" name="category" value={form.category} onChange={onChange}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Capacity</label>
                  <input className="input" name="capacity" value={form.capacity || ''} onChange={onChange} placeholder="e.g. 8 m³, 50 tonnes" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Quantity</label>
                  <input className="input" name="quantity" type="number" min="0" value={form.quantity || ''} onChange={onChange} />
                </div>
                <div>
                  <label className="label">Display Order</label>
                  <input className="input" name="order" type="number" value={form.order ?? 0} onChange={onChange} />
                </div>
              </div>

              <div>
                <label className="label">Main Use (one line)</label>
                <input className="input" name="mainUse" value={form.mainUse || ''} onChange={onChange} placeholder="e.g. Concrete delivery to site" />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px]" name="description" value={form.description || ''} onChange={onChange} />
              </div>

              <div>
                <label className="label">Photo</label>
                <ImageUploader
                  value={form.image || ''}
                  onChange={(url) => setForm((f) => ({ ...f, image: url }))}
                />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="eq-pub" name="published" checked={!!form.published} onChange={onChange} className="h-4 w-4" />
                <label htmlFor="eq-pub" className="text-sm text-slate-700">Published (visible on /equipment)</label>
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
