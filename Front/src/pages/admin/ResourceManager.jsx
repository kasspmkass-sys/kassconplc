import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../../api';
import SiteImage from '../../components/SiteImage';
import ImageUploader from '../../components/ImageUploader';
import { projectImagePath, generatedProjectBasename } from '../../utils/projectMedia';

/**
 * Generic CRUD manager for admin resources.
 * fields: [{ key, label, type: 'text'|'textarea'|'number'|'date'|'select'|'checkbox'
 *            |'file'|'fileArray'|'tags'|'subdocs', options?, subkeys?, required?, full? }]
 *
 * `type: 'fileArray'` renders a replaceable list of image slots (used for
 * project galleries): each slot uploads/replaces under its assigned stable
 * `/media/projects/<name>` path via the shared path manager.
 */
export default function ResourceManager({ title, endpoint, fields, emptyItem }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [busy, setBusy] = useState(false);

  const isProjects = endpoint === 'projects';

  // Must mirror the backend's slot keys so generated names match (media.js).
  const imageKey = (key) => (key === 'coverImage' ? 'cover' : key === 'images' ? 'gallery' : key);
  const fieldName = (value, index, key) => {
    const k = imageKey(key);
    const { name } = projectImagePath(value || '', { title: form.title || '', index, key: k });
    // projectImagePath returns name=null for legacy /uploads/ paths and GridFS
    // URLs because those have no stable basename. Fall back to the deterministic
    // generated name so Replace still works on cover images that were uploaded
    // before the /media/projects/ scheme was introduced.
    return name || generatedProjectBasename({ title: form.title || '', index, key: k });
  };

  const load = () => api.get(`/${endpoint}`).then((r) => setItems(r.data));

  useEffect(() => {
    load().catch(() => toast.error('Failed to load'));
  }, [endpoint]);

  const openNew = () => {
    setEditing('new');
    setForm({ ...emptyItem });
  };

  const openEdit = (item) => {
    setEditing(item._id);
    const next = { ...emptyItem };
    fields.forEach((f) => {
      next[f.key] = item[f.key] ?? emptyItem[f.key];
    });
    setForm(next);
  };

  const close = () => {
    setEditing(null);
    setForm({ ...emptyItem });
  };

  const onChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setArrayItem = (key, index, value) =>
    setForm((f) => {
      const arr = Array.isArray(f[key]) ? [...f[key]] : [];
      arr[index] = value;
      return { ...f, [key]: arr };
    });

  /* Repeatable object rows, e.g. service process steps ({ title, desc }). */
  const addSubdoc = (field) =>
    setForm((f) => {
      const arr = Array.isArray(f[field.key]) ? [...f[field.key]] : [];
      const blank = Object.fromEntries(field.subkeys.map((k) => [k, '']));
      arr.push(blank);
      return { ...f, [field.key]: arr };
    });

  const setSubdocItem = (field, index, subkey, value) =>
    setForm((f) => {
      const arr = Array.isArray(f[field.key]) ? [...f[field.key]] : [];
      arr[index] = { ...(arr[index] || {}), [subkey]: value };
      return { ...f, [field.key]: arr };
    });

  const removeSubdoc = (field, index) =>
    setForm((f) => {
      const arr = Array.isArray(f[field.key]) ? f[field.key].filter((_, i) => i !== index) : [];
      return { ...f, [field.key]: arr };
    });

  const removeArrayItem = (key, index) =>
    setForm((f) => {
      const arr = Array.isArray(f[key]) ? f[key].filter((_, i) => i !== index) : [];
      return { ...f, [key]: arr };
    });

  const addArrayItem = (key) =>
    setForm((f) => {
      const arr = Array.isArray(f[key]) ? [...f[key]] : [];
      arr.push('');
      return { ...f, [key]: arr };
    });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form };
      fields.forEach((f) => {
        if (f.type === 'number' && payload[f.key] !== '' && payload[f.key] != null) {
          payload[f.key] = Number(payload[f.key]);
        }
        if ((f.type === 'date') && payload[f.key] === '') {
          payload[f.key] = null;
        }
        if (f.type === 'tags' && typeof payload[f.key] === 'string') {
          payload[f.key] = payload[f.key]
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
        if (isProjects && f.type === 'file' && payload[f.key]) {
          payload[f.key] = projectImagePath(payload[f.key], {
            title: payload.title || '',
            index: 0,
            key: imageKey(f.key),
          }).path;
        }
      });
      if (editing === 'new') await api.post(`/${endpoint}`, payload);
      else await api.put(`/${endpoint}/${editing}`, payload);
      toast.success('Saved');
      close();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this item?')) return;
    await api.delete(`/${endpoint}/${id}`);
    toast.success('Deleted');
    load();
  };

  const move = async (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= items.length || index === j) return;
    const a = items[index];
    const b = items[j];
    try {
      await Promise.all([
        api.put(`/${endpoint}/${a._id}`, { order: b.order ?? 0 }),
        api.put(`/${endpoint}/${b._id}`, { order: a.order ?? 0 }),
      ]);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reorder failed');
    }
  };

  const cellValue = (item, f) => {
    if (f.type === 'checkbox') return item[f.key] ? 'Yes' : 'No';
    if (f.type === 'subdocs') {
      const rows = Array.isArray(item[f.key]) ? item[f.key] : [];
      return rows.length ? `${rows.length} step${rows.length === 1 ? '' : 's'}` : '-';
    }
    if (Array.isArray(item[f.key])) return item[f.key].join(', ');
    if (item[f.key] == null || item[f.key] === '') return '-';
    return String(item[f.key]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">{title}</h1>
          <p className="text-sm text-slate-400">{items.length} items</p>
        </div>
        <button onClick={openNew} className="btn-primary !py-2.5">
          <Plus size={16} /> Add new
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                {fields.slice(0, 4).map((f) => (
                  <th key={f.key} className="px-4 py-3 font-semibold">
                    {f.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item._id} className="border-t border-slate-100">
                  {fields.slice(0, 4).map((f) => (
                    <td key={f.key} className="px-4 py-3 max-w-[220px] truncate">
                      {f.type === 'file' && item[f.key] ? (
                        <span className="flex items-center gap-2">
                          <SiteImage src={item[f.key]} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                        </span>
                      ) : (
                        cellValue(item, f)
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        className="p-2 text-slate-400 hover:text-brand disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg"
                        aria-label="Move up"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === items.length - 1}
                        className="p-2 text-slate-400 hover:text-brand disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg"
                        aria-label="Move down"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button onClick={() => openEdit(item)} className="p-2 text-brand hover:bg-brand-soft rounded-lg">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => remove(item._id)} className="p-2 text-accent hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    No items yet. Add your first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            role="button"
            tabIndex={-1}
            aria-label="Close dialog"
            onClick={close}
            onKeyDown={(e) => e.key === 'Escape' && close()}
          />
          <form
            onSubmit={save}
            role="dialog"
            aria-modal="true"
            aria-label={`${editing === 'new' ? 'Add' : 'Edit'} ${title.slice(0, -1)}`}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-soft p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-navy">
                {editing === 'new' ? 'Add' : 'Edit'} {title.slice(0, -1)}
              </h2>
              <button type="button" onClick={close} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {fields.map((f) => {
                const fieldId = `rm-field-${f.key}`;
                return (
                <div key={f.key} className={f.type === 'textarea' || f.full ? 'sm:col-span-2' : ''}>
                  {f.type === 'file' || f.type === 'fileArray' || f.type === 'subdocs' ? (
                    <p className="label mb-1.5">{f.label}</p>
                  ) : (
                    <label htmlFor={fieldId} className="label">{f.label}</label>
                  )}
                  {f.type === 'textarea' ? (
                    <textarea
                      id={fieldId}
                      className="input min-h-[100px]"
                      required={f.required}
                      value={form[f.key] ?? ''}
                      onChange={(e) => onChange(f.key, e.target.value)}
                    />
                  ) : f.type === 'select' ? (
                    <select
                      id={fieldId}
                      className="input"
                      required={f.required}
                      value={form[f.key] ?? ''}
                      onChange={(e) => onChange(f.key, e.target.value)}
                    >
                      {f.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : f.type === 'checkbox' ? (
                    <label htmlFor={fieldId} className="flex items-center gap-2 text-sm">
                      <input
                        id={fieldId}
                        type="checkbox"
                        checked={!!form[f.key]}
                        onChange={(e) => onChange(f.key, e.target.checked)}
                      />
                      Enabled
                    </label>
                  ) : f.type === 'file' ? (
                    <ImageUploader
                      value={form[f.key] ?? ''}
                      onChange={(v) => onChange(f.key, v)}
                      stableName={isProjects ? fieldName(form[f.key] ?? '', 0, f.key) : ''}
                      className="sm:col-span-2"
                    />
                  ) : f.type === 'fileArray' ? (
                    <div className="space-y-3">
                      {(Array.isArray(form[f.key]) ? form[f.key] : []).map((v, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Image {i + 1}
                              {v ? ` — ${String(v).split('/').pop()}` : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeArrayItem(f.key, i)}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-accent transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={12} aria-hidden="true" /> Remove
                            </button>
                          </div>
                          <ImageUploader
                            value={v ?? ''}
                            onChange={(nv) => setArrayItem(f.key, i, nv)}
                            stableName={isProjects ? fieldName(v ?? '', i, f.key) : ''}
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem(f.key)}
                        className="btn-ghost inline-flex items-center gap-1.5 !px-3.5 !py-2 !text-xs"
                      >
                        <Plus size={15} aria-hidden="true" /> Add image
                      </button>
                    </div>
                  ) : f.type === 'tags' ? (
                    <input
                      id={fieldId}
                      className="input"
                      placeholder="Comma separated"
                      value={Array.isArray(form[f.key]) ? form[f.key].join(', ') : form[f.key] ?? ''}
                      onChange={(e) => onChange(f.key, e.target.value)}
                    />
                  ) : f.type === 'subdocs' ? (
                    <div className="space-y-3">
                      {(Array.isArray(form[f.key]) ? form[f.key] : []).map((row, ri) => (
                        <div key={ri} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Step {ri + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSubdoc(f, ri)}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-accent transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={12} aria-hidden="true" /> Remove
                            </button>
                          </div>
                          <div className="space-y-2">
                            {f.subkeys.map((sk) => (
                              <div key={sk}>
                                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                  {sk === 'title' ? 'Title' : 'Description'}
                                </label>
                                {sk === 'desc' ? (
                                  <textarea
                                    className="input min-h-[64px]"
                                    value={row?.[sk] ?? ''}
                                    onChange={(e) => setSubdocItem(f, ri, sk, e.target.value)}
                                  />
                                ) : (
                                  <input
                                    className="input"
                                    value={row?.[sk] ?? ''}
                                    onChange={(e) => setSubdocItem(f, ri, sk, e.target.value)}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addSubdoc(f)}
                        className="btn-ghost inline-flex items-center gap-1.5 !px-3.5 !py-2 !text-xs"
                      >
                        <Plus size={15} aria-hidden="true" /> Add step
                      </button>
                    </div>
                  ) : (
                    <input
                      id={fieldId}
                      className="input"
                      type={f.type || 'text'}
                      required={f.required}
                      value={f.type === 'date' ? (form[f.key] ? String(form[f.key]).slice(0, 10) : '') : form[f.key] ?? ''}
                      onChange={(e) => onChange(f.key, e.target.value)}
                    />
                  )}
                </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={close} className="btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="btn-primary">
                {busy ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
