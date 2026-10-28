/**
 * DOCUMENT LIBRARY ADMIN
 * Manages public downloadable documents (/documents).
 * Backed by Document model. Files uploaded to GridFS via /upload/document.
 * Only public:true documents appear on the public-facing /downloads page.
 */
import { useEffect, useState } from 'react';
import { X, Plus, Edit2, Trash2, Save, FileDown, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { API_BASE } from '../../api';
import ImageUploader from '../../components/ImageUploader';
import SiteImage from '../../components/SiteImage';

const DOC_TYPES = [
  { value: 'company-profile',      label: 'Company Profile' },
  { value: 'capability-statement', label: 'Capability Statement' },
  { value: 'equipment-list',       label: 'Equipment List' },
  { value: 'ready-mix-brochure',   label: 'Ready-Mix Brochure' },
  { value: 'project-portfolio',    label: 'Project Portfolio' },
  { value: 'certificate',          label: 'Certificate' },
  { value: 'other',                label: 'Other' },
];

const EMPTY = {
  title: '', type: 'other', description: '', fileUrl: '',
  fileSize: '', fileType: 'PDF', version: '', thumbnail: '',
  order: 0, published: true, public: true,
};

export default function DocumentsAdmin() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/documents').then((r) => setItems(r.data || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(EMPTY); setModal('new'); };
  const openEdit = (item) => { setForm({ ...EMPTY, ...item }); setModal(item); };
  const closeModal = () => setModal(null);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  /** Upload file (PDF or image) to GridFS via /upload/document */
  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('kascon_token');
      const res = await fetch(`${API_BASE}/upload/document`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      const sizeKB = Math.round(file.size / 1024);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setForm((f) => ({
        ...f,
        fileUrl:  data.url,
        fileSize: file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`,
        fileType: file.name.split('.').pop().toUpperCase(),
        title:    f.title || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      }));
      toast.success('File uploaded');
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.fileUrl.trim()) { toast.error('Please upload a file first'); return; }
    setSaving(true);
    try {
      if (modal === 'new') {
        await api.post('/documents', form);
        toast.success('Document added');
      } else {
        await api.put(`/documents/${modal._id}`, form);
        toast.success('Document updated');
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
      await api.delete(`/documents/${item._id}`);
      toast.success('Deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const typeLabel = (v) => DOC_TYPES.find((t) => t.value === v)?.label || v;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Document Library</h1>
          <p className="text-sm text-slate-500 mt-1">Company Profile, Certificates, Brochures and other approved public documents.</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Document
        </button>
      </div>

      <div className="mb-6 border border-amber-200 bg-amber-50 rounded-lg p-4 text-sm text-amber-800">
        <strong>Security note:</strong> Only set <em>Published</em> and <em>Public</em> to true for documents that are approved for public release. Confidential documents should remain hidden.
      </div>

      {loading ? (
        <div className="grid gap-4">{[1,2,3].map((i) => <div key={i} className="skeleton h-20 rounded" />)}</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-lg py-16 text-center">
          <p className="text-slate-400 mb-4">No documents yet.</p>
          <button onClick={openNew} className="btn-primary">Add First Document</button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="flex items-center gap-4 border border-slate-200 bg-white rounded-lg p-4">
              {item.thumbnail ? (
                <div className="h-14 w-12 shrink-0 overflow-hidden rounded bg-slate-100">
                  <SiteImage src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-14 w-12 shrink-0 bg-navy/5 rounded flex items-center justify-center">
                  <FileDown size={20} className="text-navy/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-navy truncate">{item.title}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-navy/5 text-navy px-2 py-0.5 rounded">
                    {typeLabel(item.type)}
                  </span>
                  {item.fileType && (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{item.fileType}</span>
                  )}
                  {!item.published && (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded">Hidden</span>
                  )}
                  {!item.public && (
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Confidential</span>
                  )}
                </div>
                {item.description && <p className="text-sm text-slate-500 mt-0.5 truncate">{item.description}</p>}
                {item.fileSize && <p className="text-xs text-slate-400 mt-0.5">{item.fileSize}{item.version ? ` · v${item.version}` : ''}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {item.fileUrl && (
                  <a href={item.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-navy" title="Preview">
                    <FileDown size={16} />
                  </a>
                )}
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
              <h2 className="font-bold text-navy text-lg">{modal === 'new' ? 'Add Document' : 'Edit Document'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-5">

              {/* File upload */}
              <div>
                <label className="label">Upload File (PDF or image, max 20 MB)</label>
                <div className="flex items-center gap-3">
                  <label className={`btn-ghost flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-55 pointer-events-none' : ''}`}>
                    <Upload size={15} />
                    {uploading ? 'Uploading…' : 'Choose file'}
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={uploadFile} />
                  </label>
                  {form.fileUrl && (
                    <a href={form.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline truncate max-w-[260px]">
                      {form.fileType} — {form.fileSize}
                    </a>
                  )}
                </div>
                {form.fileUrl && (
                  <p className="mt-1.5 text-xs text-slate-400 break-all">URL: {form.fileUrl}</p>
                )}
              </div>

              <div>
                <label className="label">Document Title *</label>
                <input className="input" name="title" required value={form.title} onChange={onChange} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select className="input" name="type" value={form.type} onChange={onChange}>
                    {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Version</label>
                  <input className="input" name="version" value={form.version || ''} onChange={onChange} placeholder="e.g. 2024-Q3" />
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px]" name="description" value={form.description || ''} onChange={onChange} />
              </div>

              <div>
                <label className="label">Cover Thumbnail (optional)</label>
                <ImageUploader
                  value={form.thumbnail || ''}
                  onChange={(url) => setForm((f) => ({ ...f, thumbnail: url }))}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="doc-pub" name="published" checked={!!form.published} onChange={onChange} className="h-4 w-4" />
                  <label htmlFor="doc-pub" className="text-sm text-slate-700">Published</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="doc-public" name="public" checked={!!form.public} onChange={onChange} className="h-4 w-4" />
                  <label htmlFor="doc-public" className="text-sm text-slate-700">Public (visible on /downloads)</label>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-200">
                <button type="submit" disabled={saving || uploading} className="btn-primary flex items-center gap-2 disabled:opacity-55">
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
