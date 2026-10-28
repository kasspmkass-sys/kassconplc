import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, Mail, Briefcase, Building2, ArrowRight,
  Truck, Newspaper, FileDown, Factory, Package,
} from 'lucide-react';
import api from '../../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const s = stats;

  const cards = [
    // ── Projects ──────────────────────────────────────────────────────
    { label: 'Completed projects',   value: s?.projects      ?? '…', icon: FolderKanban, to: '/admin/projects',  color: 'bg-navy' },
    { label: 'Ongoing projects',     value: s?.ongoing       ?? '…', icon: FolderKanban, to: '/admin/projects',  color: 'bg-accent' },
    // ── Content ──────────────────────────────────────────────────────
    { label: 'Services',             value: s?.services      ?? '…', icon: Briefcase,    to: '/admin/services',  color: 'bg-emerald-700' },
    { label: 'Clients',              value: s?.clients       ?? '…', icon: Building2,    to: '/admin/clients',   color: 'bg-indigo-700' },
    { label: 'Equipment items',      value: s?.equipment     ?? '…', icon: Truck,        to: '/admin/equipment', color: 'bg-slate-700' },
    { label: 'News updates',         value: s?.news          ?? '…', icon: Newspaper,    to: '/admin/news',      color: 'bg-sky-700' },
    { label: 'Documents',            value: s?.documents     ?? '…', icon: FileDown,     to: '/admin/documents', color: 'bg-teal-700' },
    // ── Requests ─────────────────────────────────────────────────────
    { label: 'New Ready-Mix requests', value: s?.readyMixNew ?? '…', icon: Factory,      to: '/admin/requests',  color: s?.readyMixNew > 0 ? 'bg-amber-600' : 'bg-slate-500' },
    { label: 'New Aggregate requests', value: s?.aggregateNew ?? '…', icon: Package,     to: '/admin/requests',  color: s?.aggregateNew > 0 ? 'bg-amber-600' : 'bg-slate-500' },
    // ── Messages ─────────────────────────────────────────────────────
    { label: 'Unread messages',      value: s?.unread        ?? '…', icon: Mail,         to: '/admin/messages',  color: s?.unread > 0 ? 'bg-accent' : 'bg-slate-500' },
    { label: 'Total messages',       value: s?.messages      ?? '…', icon: Mail,         to: '/admin/messages',  color: 'bg-slate-600' },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-1">Dashboard</h1>
      <p className="text-slate-500 text-sm mb-8">Manage website content for Kassa &amp; Sons Construction PLC</p>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={`${c.label}-${c.to}`} to={c.to} className="card p-5 hover:shadow-elevated transition group">
            <div className="flex items-start justify-between">
              <div className={`h-10 w-10 rounded ${c.color} text-white grid place-items-center shrink-0`}>
                <c.icon size={18} aria-hidden="true" />
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-accent transition" />
            </div>
            <div className="mt-4 font-display text-3xl font-bold text-navy tabular-nums">{c.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{c.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="mt-10 border-t border-slate-200 pt-8">
        <h2 className="font-display font-bold text-navy text-base mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { to: '/admin/hero',         label: 'Edit Hero Slides' },
            { to: '/admin/home',         label: 'Edit Home Copy' },
            { to: '/admin/about',        label: 'Edit About Page' },
            { to: '/admin/projects',     label: 'Add Project' },
            { to: '/admin/services',     label: 'Add Service' },
            { to: '/admin/equipment',    label: 'Add Equipment' },
            { to: '/admin/news',         label: 'Add News Update' },
            { to: '/admin/documents',    label: 'Add Document' },
            { to: '/admin/requests',     label: 'View Requests' },
            { to: '/admin/messages',     label: 'Read Messages' },
            { to: '/admin/settings',     label: 'Site Settings' },
            { to: '/admin/company-profile', label: 'Company Profile PDF' },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="btn-ghost btn-sm">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
