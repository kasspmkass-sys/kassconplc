import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Film } from 'lucide-react';
import api from '../../api';
import { useSite } from '../../context/SiteContext';
import ImageUploader from '../../components/ImageUploader';
import { WWB_CATEGORIES } from '../../components/home/WhatWeBuild';

function SectionImage({ title, description, block, form, setBlock }) {
  return (
    <div className="card p-6 space-y-4">
      <h3 className="font-display font-bold text-navy">{title}</h3>
      {description && <p className="text-sm text-slate-400">{description}</p>}
      <div className="grid lg:grid-cols-[240px_1fr] gap-5">
        <ImageUploader
          value={form.home?.[block]?.image || ''}
          onChange={(v) => setBlock(block, 'image', v)}
        />
        <div className="space-y-3">
          <div>
            <label className="label">Image alt text</label>
            <input
              className="input"
              value={form.home?.[block]?.imageAlt || ''}
              onChange={(e) => setBlock(block, 'imageAlt', e.target.value)}
              placeholder="Describe the image for accessibility"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeContentAdmin() {
  const { refresh } = useSite();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [builds, setBuilds] = useState({});
  const [buildsLoading, setBuildsLoading] = useState(true);
  const [buildsBusy, setBuildsBusy] = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) => setForm(r.data));
  }, []);

  useEffect(() => {
    api
      .get('/what-we-build')
      .then((r) => {
        const map = {};
        for (const rec of r.data || []) map[rec.category] = rec;
        setBuilds(map);
      })
      .catch(() => toast.error('Failed to load What We Build cards'))
      .finally(() => setBuildsLoading(false));
  }, []);

  const saveBuildCategories = async () => {
    setBuildsBusy(true);
    try {
      await Promise.all(
        WWB_CATEGORIES.map(async (category, i) => {
          const image = builds[category]?.image || '';
          const existing = builds[category];
          const payload = { category, image, order: i + 1, published: true };
          if (existing?._id) {
            await api.put(`/what-we-build/${existing._id}`, payload);
          } else {
            await api.post('/what-we-build', payload);
          }
        })
      );
      const r = await api.get('/what-we-build');
      const map = {};
      for (const rec of r.data || []) map[rec.category] = rec;
      setBuilds(map);
      toast.success('What We Build cards saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save What We Build cards');
    } finally {
      setBuildsBusy(false);
    }
  };

  if (!form) return <div className="text-slate-400">Loading home content...</div>;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setBlock = (block, key, value) =>
    setForm((f) => ({ ...f, home: { ...f.home, [block]: { ...(f.home?.[block] || {}), [key]: value } } }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put('/settings', {
        ownerName: form.ownerName,
        ownerTitle: form.ownerTitle,
        ownerBio: form.ownerBio,
        ownerImage: form.ownerImage,
        ownerQuote: form.ownerQuote,
        aboutShort: form.aboutShort,
        whoWeAreImage: form.whoWeAreImage,
        homeVideoUrl: form.homeVideoUrl,
        homeVideoPoster: form.homeVideoPoster,
        homeVideoTitle: form.homeVideoTitle,
        homeVideoSubtitle: form.homeVideoSubtitle,
        home: form.home,
      });
      await refresh();
      toast.success('Home content saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy">Home Page Content</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage images, text and settings for each section on the homepage.
        </p>
      </div>

      <form onSubmit={save} className="space-y-6 max-w-5xl">

        {/* 1. Owner / Founder */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-navy border-b border-slate-200 pb-3">
            1. Our Owners — Founder
          </h2>
          <div className="grid lg:grid-cols-[240px_1fr] gap-5">
            <ImageUploader value={form.ownerImage || ''} onChange={(v) => set('ownerImage', v)} />
            <div className="grid sm:grid-cols-2 gap-4 content-start">
              <div>
                <label className="label">Owner name</label>
                <input className="input" value={form.ownerName || ''} onChange={(e) => set('ownerName', e.target.value)} />
              </div>
              <div>
                <label className="label">Title / role</label>
                <input className="input" value={form.ownerTitle || ''} onChange={(e) => set('ownerTitle', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Quote</label>
                <input className="input" value={form.ownerQuote || ''} onChange={(e) => set('ownerQuote', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Owner bio</label>
                <textarea
                  className="input min-h-[140px]"
                  value={form.ownerBio || ''}
                  onChange={(e) => set('ownerBio', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Short company intro (beside owner)</label>
                <textarea
                  className="input min-h-[90px]"
                  value={form.aboutShort || ''}
                  onChange={(e) => set('aboutShort', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Who We Are */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-navy border-b border-slate-200 pb-3">
            2. Who We Are
          </h2>
          <SectionImage
            title="Section image"
            description="Editorial image shown beside the 'Who We Are' text on the homepage."
            block="about"
            form={form}
            setBlock={setBlock}
          />
        </div>

        {/* 3. Who We Are — Caution */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-navy border-b border-slate-200 pb-3">
            3. Who We Are — Caution
          </h2>
          <p className="text-sm text-slate-400">
            Optional caution note displayed below the Who We Are description. Leave empty to hide.
          </p>
          <div>
            <label className="label">Caution text</label>
            <textarea
              className="input min-h-[100px]"
              value={form.home?.about?.cautionText || ''}
              onChange={(e) => setBlock('about', 'cautionText', e.target.value)}
              placeholder="Enter the caution message..."
            />
          </div>
          <div>
            <label className="label">Author / source</label>
            <input
              className="input"
              value={form.home?.about?.cautionAuthor || ''}
              onChange={(e) => setBlock('about', 'cautionAuthor', e.target.value)}
              placeholder="e.g. HSEQ Department"
            />
          </div>
        </div>

        {/* 4. Where We Work */}
        <SectionImage
          title="4. Where We Work — Section image"
          description="Image shown alongside the locations and facilities section."
          block="locations"
          form={form}
          setBlock={setBlock}
        />

        {/* 5. What We Do */}
        <SectionImage
          title="5. What We Do — Section image"
          description="Optional hero image for the services overview section."
          block="services"
          form={form}
          setBlock={setBlock}
        />

        {/* 6. What We Build */}
        <SectionImage
          title="6. What We Build — Section image"
          description="Optional hero image for the projects showcase section."
          block="projects"
          form={form}
          setBlock={setBlock}
        />

        {/* 7. Careers */}
        <SectionImage
          title="7. Careers — Section image"
          description="Image shown beside the careers text on the homepage."
          block="careers"
          form={form}
          setBlock={setBlock}
        />

        {/* 8. Safety */}
        <SectionImage
          title="8. Safety — Section image"
          description="Image shown alongside the HSEQ safety section."
          block="safety"
          form={form}
          setBlock={setBlock}
        />

        {/* 9. Capacity — new */}
        <SectionImage
          title="9. Capacity & Equipment — Section image"
          description="Optional image shown in the production capacity section. Equipment photos are managed under Equipment admin."
          block="capacity"
          form={form}
          setBlock={setBlock}
        />

        {/* 10. Final CTA / Ready to Build */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-navy border-b border-slate-200 pb-3 flex items-center gap-2">
            <Film size={18} /> 10. Final CTA — Background image &amp; video
          </h2>
          <p className="text-sm text-slate-400">
            Background image behind the 'Ready to work together?' call-to-action at the bottom of the homepage.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Video title</label>
              <input className="input" value={form.homeVideoTitle || ''} onChange={(e) => set('homeVideoTitle', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Video subtitle</label>
              <input className="input" value={form.homeVideoSubtitle || ''} onChange={(e) => set('homeVideoSubtitle', e.target.value)} />
            </div>
            <div>
              <label className="label">Video file</label>
              <ImageUploader
                kind="video"
                value={form.homeVideoUrl || ''}
                onChange={(v) => set('homeVideoUrl', v)}
              />
            </div>
            <div>
              <label className="label">Background image (poster)</label>
              <ImageUploader
                value={form.homeVideoPoster || ''}
                onChange={(v) => set('homeVideoPoster', v)}
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-4 z-10 flex justify-end">
          <button className="btn-primary shadow-elevated" disabled={busy}>
            {busy ? 'Saving...' : 'Save Home Content'}
          </button>
        </div>
      </form>

      {/* What We Build — Category card images (dedicated records) */}
      <div className="mt-10 max-w-5xl">
        <div className="card p-6 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h2 className="font-display text-lg font-bold text-navy">
                What We Build — Category card images
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                One uploaded image per category. Saved straight to the What We Build records and shown on the homepage cards.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={saveBuildCategories}
              disabled={buildsBusy}
            >
              {buildsBusy ? 'Saving...' : 'Save What We Build Cards'}
            </button>
          </div>

          {buildsLoading ? (
            <p className="text-sm text-slate-400">Loading category cards...</p>
          ) : (
            <div className="space-y-4">
              {WWB_CATEGORIES.map((cat, i) => (
                <div
                  key={cat}
                  className="grid items-start gap-4 rounded-xl border border-slate-200/70 p-4 sm:grid-cols-[220px_1fr]"
                >
                  <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy">{cat}</p>
                      <p className="text-xs text-slate-400">Card image</p>
                    </div>
                  </div>
                  <ImageUploader
                    value={builds[cat]?.image || ''}
                    onChange={(v) =>
                      setBuilds((prev) => ({
                        ...prev,
                        [cat]: { ...(prev[cat] || {}), image: v },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
