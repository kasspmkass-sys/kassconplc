/**
 * REQUESTS ADMIN (Ready-Mix + Aggregate)
 * View, update status, and delete quotation requests from the two
 * material request forms. Tabbed interface — one tab per request type.
 */
import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Trash2, Mail, Phone, MapPin, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';

const STATUS_OPTS = [
  { value: 'new',      label: 'New',     color: 'bg-accent text-white' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-blue-600 text-white' },
  { value: 'quoted',   label: 'Quoted',   color: 'bg-emerald-700 text-white' },
  { value: 'closed',   label: 'Closed',   color: 'bg-slate-400 text-white' },
];

function statusCls(s) {
  return STATUS_OPTS.find((o) => o.value === s)?.color || 'bg-slate-300 text-slate-700';
}

function ReadyMixRequests() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/ready-mix-requests')
      .then((r) => setItems(r.data || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (item, status) => {
    try {
      await api.put(`/ready-mix-requests/${item._id}/status`, { status, read: true });
      toast.success('Status updated');
      load();
    } catch { toast.error('Update failed'); }
  };

  const remove = async (item) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await api.delete(`/ready-mix-requests/${item._id}`);
      if (selected?._id === item._id) setSelected(null);
      toast.success('Deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const markRead = async (item) => {
    if (item.read) return;
    try { await api.put(`/ready-mix-requests/${item._id}/status`, { read: true }); load(); } catch {}
  };

  if (loading) return <div className="grid gap-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-16 rounded" />)}</div>;

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 rounded-lg py-16 text-center text-slate-400">
        No ready-mix requests yet.
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* List */}
      <div className="lg:col-span-2 space-y-2">
        {items.map((item) => (
          <button
            key={item._id}
            onClick={() => { setSelected(item); markRead(item); }}
            className={`w-full text-left border rounded-lg p-4 transition-all duration-150
              ${selected?._id === item._id ? 'border-accent bg-accent/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-navy truncate">{item.projectName}</p>
                <p className="text-xs text-slate-500 truncate">{item.contactPerson} · {item.phone}</p>
                <p className="text-xs text-slate-400 mt-0.5">{new Date(item.createdAt).toLocaleDateString('en-GB')}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!item.read && <span className="h-2 w-2 rounded-full bg-accent shrink-0" />}
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${statusCls(item.status)}`}>
                  {item.status}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Detail */}
      <div className="lg:col-span-3">
        {selected ? (
          <div className="border border-slate-200 bg-white rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <h3 className="font-bold text-navy text-lg">{selected.projectName}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 shrink-0"><X size={18} /></button>
            </div>

            <dl className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Contact</dt><dd className="text-navy font-semibold">{selected.contactPerson}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Phone</dt><dd className="text-navy">{selected.phone}</dd></div>
              {selected.email && <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Email</dt><dd className="text-navy">{selected.email}</dd></div>}
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Location</dt><dd className="text-navy">{selected.location}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Grade</dt><dd className="font-bold text-accent">{selected.grade || '—'}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Quantity</dt><dd className="text-navy">{selected.quantity ? `${selected.quantity} m³` : '—'}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Casting Date</dt><dd className="text-navy">{selected.castingDate || '—'}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Required Time</dt><dd className="text-navy">{selected.requiredTime || '—'}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Pump Required</dt><dd className="text-navy">{selected.pumpRequired || '—'}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Received</dt><dd className="text-navy">{new Date(selected.createdAt).toLocaleString('en-GB')}</dd></div>
            </dl>

            {selected.specialRequirement && (
              <div className="mb-6 border-t border-slate-100 pt-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Special Requirements</p>
                <p className="text-sm text-slate-700 whitespace-pre-line">{selected.specialRequirement}</p>
              </div>
            )}

            {/* Status update */}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <span className="text-xs font-semibold text-slate-500 mr-2">Status:</span>
              {STATUS_OPTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => updateStatus(selected, s.value)}
                  className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded transition-opacity ${
                    selected.status === s.value ? s.color : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <button onClick={() => remove(selected)} className="ml-auto text-slate-400 hover:text-accent p-1.5">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-slate-200 rounded-xl h-full min-h-[200px] flex items-center justify-center text-slate-400">
            Select a request to view details
          </div>
        )}
      </div>
    </div>
  );
}

function AggregateRequests() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/aggregate-requests')
      .then((r) => setItems(r.data || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (item, status) => {
    try {
      await api.put(`/aggregate-requests/${item._id}/status`, { status, read: true });
      toast.success('Status updated');
      load();
    } catch { toast.error('Update failed'); }
  };

  const remove = async (item) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await api.delete(`/aggregate-requests/${item._id}`);
      if (selected?._id === item._id) setSelected(null);
      toast.success('Deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="grid gap-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-16 rounded" />)}</div>;
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 rounded-lg py-16 text-center text-slate-400">
        No aggregate requests yet.
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-2">
        {items.map((item) => (
          <button
            key={item._id}
            onClick={() => setSelected(item)}
            className={`w-full text-left border rounded-lg p-4 transition-all duration-150
              ${selected?._id === item._id ? 'border-accent bg-accent/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-navy truncate">{item.projectName}</p>
                <p className="text-xs text-slate-500 truncate">{item.contactPerson} · {item.phone}</p>
                <p className="text-xs text-slate-400 mt-0.5">{new Date(item.createdAt).toLocaleDateString('en-GB')}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded shrink-0 ${statusCls(item.status)}`}>
                {item.status}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="lg:col-span-3">
        {selected ? (
          <div className="border border-slate-200 bg-white rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <h3 className="font-bold text-navy text-lg">{selected.projectName}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 shrink-0"><X size={18} /></button>
            </div>
            <dl className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Contact</dt><dd className="text-navy font-semibold">{selected.contactPerson}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Phone</dt><dd>{selected.phone}</dd></div>
              {selected.email && <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Email</dt><dd>{selected.email}</dd></div>}
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Location</dt><dd>{selected.location}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Aggregate Size</dt><dd className="font-bold text-accent">{selected.size || '—'}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Quantity</dt><dd>{selected.quantity || '—'}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Required Date</dt><dd>{selected.deliveryDate || '—'}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Received</dt><dd>{new Date(selected.createdAt).toLocaleString('en-GB')}</dd></div>
            </dl>
            {selected.notes && (
              <div className="mb-6 border-t border-slate-100 pt-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Notes</p>
                <p className="text-sm text-slate-700 whitespace-pre-line">{selected.notes}</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <span className="text-xs font-semibold text-slate-500 mr-2">Status:</span>
              {STATUS_OPTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => updateStatus(selected, s.value)}
                  className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded transition-opacity ${
                    selected.status === s.value ? s.color : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <button onClick={() => remove(selected)} className="ml-auto text-slate-400 hover:text-accent p-1.5">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-slate-200 rounded-xl h-full min-h-[200px] flex items-center justify-center text-slate-400">
            Select a request to view details
          </div>
        )}
      </div>
    </div>
  );
}

export default function RequestsAdmin() {
  const [tab, setTab] = useState('ready-mix');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Material Requests</h1>
        <p className="text-sm text-slate-500 mt-1">Ready-mix concrete and aggregate quotation requests from the website.</p>
      </div>

      <div className="flex gap-0 border-b border-slate-200 mb-8">
        {[
          { key: 'ready-mix',  label: 'Ready-Mix Requests' },
          { key: 'aggregate',  label: 'Aggregate Requests' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ready-mix' && <ReadyMixRequests />}
      {tab === 'aggregate' && <AggregateRequests />}
    </div>
  );
}
