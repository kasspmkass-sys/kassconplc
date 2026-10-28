import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Upload, Trash2, Image as ImageIcon, GripVertical } from 'lucide-react';
import api from '../../api';
import { useSite } from '../../context/SiteContext';
import SiteImage from '../../components/SiteImage';

export default function HeroAdmin() {
  const { refresh } = useSite();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) => {
      const data = r.data;
      const slides = Array.isArray(data.heroSlides) ? data.heroSlides : [];
      setForm({ ...data, heroSlides: slides });
    });
  }, []);

  if (!form) return <div className="text-slate-400">Loading hero settings...</div>;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const uploadSlide = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/upload', fd);
      set('heroSlides', [...(form.heroSlides || []), data.url]);
      toast.success('Slide added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeSlide = (idx) => {
    set(
      'heroSlides',
      (form.heroSlides || []).filter((_, i) => i !== idx)
    );
  };

  const moveSlide = (idx, dir) => {
    const next = [...(form.heroSlides || [])];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    set('heroSlides', next);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const slides = (form.heroSlides || []).filter(Boolean);
      await api.put('/settings', {
        heroSlides: slides,
        heroEyebrow: form.heroEyebrow,
        heroSupporting: form.heroSupporting,
        headline: form.headline,
        tagline: form.tagline,
        companyName: form.companyName,
        grade: form.grade,
      });
      await refresh();
      toast.success('Hero page updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy">Hero Page</h1>
        <p className="text-sm text-slate-400 mt-1">
          Add slider images for the homepage hero. They rotate in a circle every 5 seconds.
        </p>
      </div>

      <form onSubmit={save} className="space-y-6 max-w-5xl">
        <div className="card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-navy">Hero slider images</h2>
              <p className="text-xs text-slate-400 mt-1">
                {(form.heroSlides || []).length} image(s) - each shows for 5 seconds, then loops.
              </p>
            </div>
            <label className="btn-primary !py-2.5 cursor-pointer">
              <Upload size={16} />
              {uploading ? 'Uploading...' : 'Add image'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && uploadSlide(e.target.files[0])}
              />
            </label>
          </div>

          {(form.heroSlides || []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
              <ImageIcon size={36} className="mx-auto mb-3 opacity-40" />
              No slides yet. Upload 3-5 professional project photos.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(form.heroSlides || []).map((src, i) => (
                <div key={`${src}-${i}`} className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50">
                  <div className="aspect-[16/10] relative">
                    <SiteImage src={src} alt="" className="h-full w-full object-cover" />
                    <div className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-navy/80 text-white px-2 py-1 rounded-full">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-slate-400">
                      <GripVertical size={14} />
                      <button type="button" className="text-xs font-semibold hover:text-brand" onClick={() => moveSlide(i, -1)}>
                        Up
                      </button>
                      <button type="button" className="text-xs font-semibold hover:text-brand" onClick={() => moveSlide(i, 1)}>
                        Down
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSlide(i)}
                      className="p-2 rounded-lg text-accent hover:bg-red-50"
                      aria-label="Remove slide"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-navy">Hero copy</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Company name</label>
              <input className="input" value={form.companyName || ''} onChange={(e) => set('companyName', e.target.value)} />
            </div>
            <div>
              <label className="label">Eyebrow / location line</label>
              <input
                className="input"
                value={form.heroEyebrow || ''}
                onChange={(e) => set('heroEyebrow', e.target.value)}
                placeholder="Grade-1 General Contractor - Addis Ababa"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Headline</label>
              <input className="input" value={form.headline || ''} onChange={(e) => set('headline', e.target.value)} />
            </div>
            <div>
              <label className="label">Tagline</label>
              <input className="input" value={form.tagline || ''} onChange={(e) => set('tagline', e.target.value)} />
            </div>
            <div>
              <label className="label">Grade / licence</label>
              <input className="input" value={form.grade || ''} onChange={(e) => set('grade', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Supporting sentence</label>
              <textarea
                className="input min-h-[90px]"
                value={form.heroSupporting || ''}
                onChange={(e) => set('heroSupporting', e.target.value)}
                placeholder="One short professional sentence under the headline."
              />
            </div>
          </div>
        </div>

        <button className="btn-primary" disabled={busy}>
          {busy ? 'Saving...' : 'Save Hero Page'}
        </button>
      </form>
    </div>
  );
}
