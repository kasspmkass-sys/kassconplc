import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  Users,
  Building2,
  Award,
  MessageSquareQuote,
  Milestone,
  Settings,
  Mail,
  LogOut,
  Menu,
  X,
  Images,
  PanelsTopLeft,
  UserRound,
  Home,
  Info,
  Layout,
  BriefcaseBusiness,
  Truck,
  Newspaper,
  FileDown,
  Package,
  Factory,
  HardDrive,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNoindex } from '../../useSEO';

const NAV_GROUPS = [
  {
    label: 'Pages',
    items: [
      { to: '/admin', end: true,      label: 'Dashboard',       icon: LayoutDashboard },
      { to: '/admin/hero',            label: 'Hero Slides',     icon: PanelsTopLeft },
      { to: '/admin/home',            label: 'Home Copy',       icon: Home },
      { to: '/admin/home-content',    label: 'Home Images',     icon: UserRound },
      { to: '/admin/about',           label: 'About Page',      icon: Info },
      { to: '/admin/header-footer',   label: 'Header & Footer', icon: Layout },
      { to: '/admin/settings',        label: 'Site Settings',   icon: Settings },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/projects',        label: 'Projects',        icon: FolderKanban },
      { to: '/admin/services',        label: 'Services',        icon: Briefcase },
      { to: '/admin/equipment',       label: 'Equipment',       icon: Truck },
      { to: '/admin/news',            label: 'News & Updates',  icon: Newspaper },
      { to: '/admin/documents',       label: 'Documents',       icon: FileDown },
      { to: '/admin/certificates',    label: 'Certificates',    icon: ShieldCheck },
      { to: '/admin/gallery',         label: 'Gallery',         icon: Images },
      { to: '/admin/careers',         label: 'Careers',         icon: BriefcaseBusiness },
      { to: '/admin/media',           label: 'Media Library',   icon: HardDrive },
      { to: '/admin/company-profile', label: 'Company Profile',  icon: FileText },
    ],
  },
  {
    label: 'About',
    items: [
      { to: '/admin/team',            label: 'Team',            icon: Users },
      { to: '/admin/clients',         label: 'Clients',         icon: Building2 },
      { to: '/admin/awards',          label: 'Awards',          icon: Award },
      { to: '/admin/testimonials',    label: 'Testimonials',    icon: MessageSquareQuote },
      { to: '/admin/milestones',      label: 'Milestones',      icon: Milestone },
    ],
  },
  {
    label: 'Requests & Inbox',
    items: [
      { to: '/admin/requests',        label: 'Material Requests', icon: Factory },
      { to: '/admin/messages',        label: 'Messages',          icon: Mail },
    ],
  },
];

// Flat list used by routes in App.jsx
export const ADMIN_NAV = NAV_GROUPS.flatMap((g) => g.items);

export default function AdminLayout() {
  const { isAuth, loading, admin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useNoindex();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-slate-400">Loading…</div>;
  }
  if (!isAuth) return <Navigate to="/admin/login" replace />;

  const Sidebar = (
    <aside className="w-64 shrink-0 bg-navy text-white flex flex-col min-h-screen">
      <div className="p-5 border-b border-white/10">
        <div className="font-display font-bold text-base">Kascon CMS</div>
        <div className="text-xs text-white/40 mt-0.5 truncate">{admin?.email}</div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'text-white/65 hover:bg-white/8 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={16} aria-hidden="true" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={() => { logout(); navigate('/admin/login'); }}
        className="m-3 flex items-center gap-2 px-3 py-2 rounded text-sm text-white/55 hover:bg-white/8 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <LogOut size={16} /> Sign out
      </button>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{Sidebar}</div>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            role="button"
            tabIndex={-1}
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          />
          <div id="admin-sidebar" className="relative z-10 h-full w-64">{Sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 sticky top-0 z-20">
          <button
            className="lg:hidden p-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            aria-controls="admin-sidebar"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="font-semibold text-navy text-sm">Content Management</div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-xs font-semibold text-accent hover:underline"
          >
            View website ↗
          </a>
        </header>

        <div className="p-4 md:p-6 lg:p-8 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
