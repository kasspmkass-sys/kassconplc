import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, MailOpen } from 'lucide-react';
import api from '../../api';

export default function MessagesAdmin() {
  const [items, setItems] = useState([]);

  const load = () => api.get('/messages').then((r) => setItems(r.data));

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await api.put(`/messages/${id}/read`);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete message?')) return;
    await api.delete(`/messages/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-6">Messages</h1>
      <div className="space-y-3">
        {items.map((m) => (
          <div key={m._id} className={`card p-5 ${m.read ? 'opacity-70' : 'border-brand/30'}`}>
            <div className="flex flex-wrap justify-between gap-2 mb-2">
              <div>
                <div className="font-semibold text-navy">{m.name}</div>
                <div className="text-xs text-slate-400">
                  {m.email} {m.phone && ` • ${m.phone}`} • {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                {!m.read && (
                  <button onClick={() => markRead(m._id)} className="btn-ghost !py-1.5 !px-3 text-xs">
                    <MailOpen size={14} /> Mark read
                  </button>
                )}
                <button onClick={() => remove(m._id)} className="p-2 text-accent hover:bg-red-50 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {m.subject && <div className="text-sm font-medium text-brand mb-1">{m.subject}</div>}
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{m.message}</p>
          </div>
        ))}
        {items.length === 0 && <div className="text-center py-16 text-slate-400">No messages yet.</div>}
      </div>
    </div>
  );
}
