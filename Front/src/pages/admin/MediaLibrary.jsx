/**
 * MEDIA LIBRARY — Admin
 * Browse, search, and manage all uploaded media files in GridFS.
 * Admin can: view, copy URL, delete (if unreferenced), filter by kind.
 * Used for selecting existing images without re-uploading.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Trash2, Copy, Check, Upload, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { mediaUrl, API_BASE } from '../../api';
import SiteImage from '../../components/SiteImage';
import ImageUploader from '../../components/ImageUploader';

const PAGE_SIZE = 48;

const KIND_TABS = [
  { key: '',        label: 'All' },
  { key: 'image',   label: 'Images' },
  { key: 'video',   label: 'Videos' },
  { key: 'document', label: 'Documents' },
];

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function MediaLibrary() {
  const [files, setFiles]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [skip, setSkip]         = useState(0);
  const [loading, setLoading]   = useState(true);
  const [kind, setKind]         = useState('');
  const [search, setSearch]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [copied, setCopied]     = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [preview, setPreview]   = useState(null);
  const searchTimer = useRef(null);

  /* Debounce search input */
  const onSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setSkip(0);
    }, 400);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: PAGE_SIZE, skip });
      if (kind)           params.set('kind', kind);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const { data } = await api.get(`/media?${params}`);
      setFiles(data.files || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [kind, debouncedSearch, skip]);

  useEffect(() => { load(); }, [load]);

  /* Reset to page 1 when filter/search changes */
  useEffect(() => { setSkip(0); }, [kind, debouncedSearch]);

  const copyUrl = (file) => {
    const url = file.url;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(file._id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const deleteFile = async (file) => {
    if (!window.confirm(`Delete "${file.originalname}"? This cannot be undone.`)) return;
    setDeleting(file._id);
    try {
      const { data } = await api.post('/media/delete', { url: file.url });
      if (data.deleted) {
        toast.success('File deleted');
        setPreview(null);
        load();
      } else if (data.reason === 'referenced') {
        toast.error('This file is still referenced by CMS content. Remove the reference first.');
      } else {
        toast.error('File not found — may have already been deleted.');
        load();
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const pages     = Math.ceil(total / PAGE_SIZE);
  const page      = Math.floor(skip / PAGE_SIZE) + 1;
  const hasMore   = skip + PAGE_SIZE < total;
  const hasLess   = skip > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Media Library</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total > 0 ? `${total} file${total !== 1 ? 's' : ''} stored` : 'Browse and manage uploaded media'}
          </p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2 shrink-0" title="Refresh">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Kind tabs */}
        <div className="flex gap-1" role="tablist">
          {KIND_TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={kind === t.key}
              onClick={() => setKind(t.key)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 rounded ${
                kind === t.key
                  ? 'bg-navy text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            className="input !pl-9 !py-2 !text-xs"
            placeholder="Search by filename…"
            value={search}
            onChange={onSearchChange}
            aria-label="Search media files"
          />
        </div>
      </div>

      {/* Upload shortcut */}
      <div className="mb-8 border border-slate-200 bg-white rounded-lg p-5">
        <p className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
          <Upload size={15} className="text-accent" /> Upload new file
        </p>
        <ImageUploader
          value=""
          onChange={(url) => {
            toast.success('Uploaded — file added to library');
            setTimeout(load, 500);
          }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="border border-dashed border-slate-300 py-24 text-center">
          <p className="text-slate-400">No files found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {files.map((file) => (
            <button
              key={file._id}
              onClick={() => setPreview(file)}
              className={`group relative aspect-square overflow-hidden border bg-slate-100 text-left
                transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40
                ${preview?._id === file._id ? 'border-accent ring-2 ring-accent/30' : 'border-slate-200 hover:border-accent/40'}`}
              aria-label={`Select ${file.originalname}`}
            >
              {file.kind === 'image' ? (
                <SiteImage
                  src={file.url}
                  alt={file.originalname}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-slate-50">
                  <span className="text-2xl font-bold text-slate-300 uppercase">{file.fileType || file.kind?.slice(0,3) || '?'}</span>
                  <span className="mt-1 text-[10px] text-slate-400 text-center line-clamp-2 break-all">{file.originalname}</span>
                </div>
              )}

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/30 transition-all duration-200" aria-hidden="true" />

              {/* Size badge */}
              {file.length > 0 && (
                <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatBytes(file.length)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
          <button disabled={!hasLess} onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))} className="btn-ghost btn-sm disabled:opacity-40">
            ← Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {pages}</span>
          <button disabled={!hasMore} onClick={() => setSkip(skip + PAGE_SIZE)} className="btn-ghost btn-sm disabled:opacity-40">
            Next →
          </button>
        </div>
      )}

      {/* Preview panel */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(null)}>
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview image */}
            {preview.kind === 'image' && (
              <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                <SiteImage src={preview.url} alt={preview.originalname} className="w-full h-full object-contain" />
              </div>
            )}

            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-navy text-sm break-all">{preview.originalname}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {[
                      preview.contentType,
                      formatBytes(preview.length),
                      formatDate(preview.uploadDate),
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                  <X size={18} />
                </button>
              </div>

              {/* URL display */}
              <div className="bg-slate-50 border border-slate-200 rounded px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">URL</p>
                <p className="text-xs text-slate-600 break-all font-mono">{preview.url}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => copyUrl(preview)}
                  className="btn-primary btn-sm flex items-center gap-2"
                >
                  {copied === preview._id ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy URL</>}
                </button>

                {preview.kind === 'image' && (
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost btn-sm"
                  >
                    Open ↗
                  </a>
                )}

                {preview.kind === 'document' && (
                  <a
                    href={preview.url}
                    download
                    className="btn-ghost btn-sm flex items-center gap-2"
                  >
                    Download
                  </a>
                )}

                <button
                  onClick={() => deleteFile(preview)}
                  disabled={deleting === preview._id}
                  className="btn-ghost btn-sm flex items-center gap-2 text-accent border-accent/30 hover:border-accent hover:bg-accent/5 disabled:opacity-55 ml-auto"
                >
                  <Trash2 size={13} />
                  {deleting === preview._id ? 'Deleting…' : 'Delete'}
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Files referenced by active CMS content cannot be deleted. Remove the reference first.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
