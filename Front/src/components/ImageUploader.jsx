import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ImageIcon, Loader2, Trash2, Upload, Video } from 'lucide-react';
import api, { mediaUrl } from '../api';
import SiteImage from './SiteImage';

/**
 * Shared admin image/video uploader.
 * - Upload → stores media permanently in the DB (backend returns a stable URL that never changes).
 * - Loading state shown while uploading; failures surface as toasts with the backend's message.
 * - Replace re-uses the same input; Remove clears the stored URL/reference.
 * - The raw URL can also be pasted manually.
 *
 * For project images pass `stableName` (a pre-computed safe basename like "my-project-ab12cd34.jpg").
 * The name is evaluated at upload time so that a title change between renders doesn't cause a mismatch.
 */
export default function ImageUploader({
  value = '',
  onChange,
  kind = 'image',
  className = '',
  stableName = '',
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  // Keep a ref so uploadFile always uses the latest stableName even if the
  // parent re-renders between the user clicking Upload and the file being sent.
  const stableNameRef = useRef(stableName);
  stableNameRef.current = stableName;

  const uploadFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      // Read from ref so we always use the name current at upload time,
      // not the name from the last render before the user clicked Upload.
      const name = stableNameRef.current;
      const isProjectImage = kind === 'image' && !!name;
      const endpoint = isProjectImage
        ? 'upload/project'
        : kind === 'video'
          ? 'upload/video'
          : 'upload';
      if (isProjectImage) fd.append('name', name);
      const { data } = await api.post(endpoint, fd);
      onChange(data.url);
      toast.success(isProjectImage ? `Image saved as ${name}` : kind === 'video' ? 'Video uploaded' : 'Image uploaded');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const preview = value ? (
    kind === 'video' ? (
      <video
        src={mediaUrl(value)}
        controls
        preload="metadata"
        className="max-h-44 w-full rounded-lg bg-slate-100 object-contain"
      />
    ) : (
      <SiteImage src={value} alt="Preview" className="h-32 w-full rounded-lg object-cover" />
    )
  ) : null;

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {preview || (
          <div className="grid h-24 place-items-center text-slate-300">
            {kind === 'video' ? (
              <Video size={28} aria-hidden="true" />
            ) : (
              <ImageIcon size={28} aria-hidden="true" />
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label
          className={`btn-ghost cursor-pointer select-none px-3.5 py-2 !text-xs inline-flex items-center gap-1.5 transition-opacity${
            busy ? ' pointer-events-none opacity-60' : ''
          }`}
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <Upload size={14} aria-hidden="true" />
          )}
          {busy ? 'Uploading...' : value ? 'Replace' : 'Upload'}
          <input
            ref={inputRef}
            type="file"
            accept={
              kind === 'video'
                ? 'video/mp4,video/webm,video/quicktime'
                : 'image/jpeg,image/png,image/webp,image/gif'
            }
            className="hidden"
            disabled={busy}
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
          />
        </label>

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-xs font-semibold text-accent transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={13} aria-hidden="true" /> Remove
          </button>
        )}
      </div>

      <input
        className="input mt-3"
        placeholder={kind === 'video' ? 'Or paste a video path / URL' : 'Or paste an image path / URL'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}