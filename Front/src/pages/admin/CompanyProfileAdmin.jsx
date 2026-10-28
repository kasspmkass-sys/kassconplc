/**
 * ADMIN — Company Profile Manager
 * ──────────────────────────────────────────────────────────────────────
 * Shows cache status, last-generated timestamp, content version.
 * Admin can preview in browser, regenerate (force rebuild), or download.
 * The PDF is always generated from live CMS data — no manual editing.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw, Download, Eye, CheckCircle2, AlertCircle,
  Clock, FileText, Cpu, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { API_BASE } from '../../api';

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

function fmtBytes(b) {
  if (!b) return '—';
  return b > 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(2)} MB` : `${Math.round(b / 1024)} KB`;
}

export default function CompanyProfileAdmin() {
  const [status, setStatus]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [regenerating, setRegen]  = useState(false);
  const [previewing, setPrev]     = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/company-profile/status');
      setStatus(data);
    } catch (e) {
      toast.error('Failed to load profile status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const regenerate = async () => {
    setRegen(true);
    try {
      await api.post('/admin/company-profile/regenerate');
      toast.success('Company profile regenerated successfully.');
      await loadStatus();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Regeneration failed');
    } finally {
      setRegen(false);
    }
  };

  const previewInBrowser = () => {
    const token = localStorage.getItem('kascon_token');
    // Open preview in new tab — use a data URL approach via fetch to pass auth
    setPrev(true);
    const url = `${API_BASE}/admin/company-profile/preview`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error('Preview failed');
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      })
      .catch(() => toast.error('Preview failed — try regenerating first.'))
      .finally(() => setPrev(false));
  };

  const upToDate  = status?.upToDate;
  const hasCached = status?.cached && status?.fileSize > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Company Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Dynamic 50-page PDF generated automatically from the live CMS data.
          </p>
        </div>
        <button
          onClick={loadStatus}
          className="btn-ghost flex items-center gap-2 shrink-0"
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh status
        </button>
      </div>

      {/* How it works notice */}
      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-8 text-sm text-blue-800 flex gap-3">
        <Info size={18} className="shrink-0 mt-0.5" />
        <div>
          <strong>Automatic updates:</strong> This profile is generated directly from the live website CMS.
          When you update any content (projects, services, settings, team, etc.), the next download
          automatically includes your latest changes — no manual PDF editing ever required.
        </div>
      </div>

      {/* Status card */}
      {loading ? (
        <div className="border border-slate-200 rounded-lg p-8 text-center">
          <RefreshCw size={24} className="mx-auto text-slate-300 animate-spin mb-3" />
          <p className="text-slate-400">Checking profile status…</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5 mb-8">
          {/* Status */}
          <div className="border border-slate-200 bg-white rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              {hasCached && upToDate ? (
                <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
              ) : hasCached && !upToDate ? (
                <AlertCircle size={22} className="text-amber-500 shrink-0" />
              ) : (
                <AlertCircle size={22} className="text-slate-400 shrink-0" />
              )}
              <div>
                <p className="font-bold text-navy">
                  {hasCached && upToDate
                    ? 'Up to date'
                    : hasCached
                    ? 'Needs regeneration'
                    : 'Not yet generated'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {hasCached && upToDate
                    ? 'Profile matches current CMS content.'
                    : hasCached
                    ? 'CMS content has changed since last generation.'
                    : 'Click "Regenerate" to create the first profile.'}
                </p>
              </div>
            </div>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500 flex items-center gap-1.5"><Clock size={13} /> Last generated</dt>
                <dd className="font-semibold text-navy">{fmt(status?.generatedAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500 flex items-center gap-1.5"><FileText size={13} /> File size</dt>
                <dd className="font-semibold text-navy">{fmtBytes(status?.fileSize)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500 flex items-center gap-1.5"><Cpu size={13} /> Content hash</dt>
                <dd className="font-mono text-xs text-slate-400">{status?.hash?.slice(0, 12) || '—'}</dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="border border-slate-200 bg-white rounded-lg p-6 flex flex-col gap-3">
            <h2 className="font-bold text-navy mb-1">Actions</h2>

            <button
              onClick={regenerate}
              disabled={regenerating}
              className="btn-primary flex items-center justify-center gap-2 disabled:opacity-55"
            >
              <RefreshCw size={15} className={regenerating ? 'animate-spin' : ''} />
              {regenerating ? 'Regenerating…' : 'Regenerate Profile'}
            </button>

            <button
              onClick={previewInBrowser}
              disabled={!hasCached || previewing}
              className="btn-ghost flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Eye size={15} />
              {previewing ? 'Opening preview…' : 'Preview in Browser'}
            </button>

            <a
              href={`${API_BASE}/company-profile.pdf`}
              download={`KASCON_Company_Profile_${new Date().getFullYear()}.pdf`}
              className={`btn-ghost flex items-center justify-center gap-2 ${!hasCached ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <Download size={15} />
              Download PDF
            </a>

            {!hasCached && (
              <p className="text-xs text-slate-400 text-center">
                Generate the profile first before previewing or downloading.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Profile structure */}
      <div className="border border-slate-200 bg-white rounded-lg p-6">
        <h2 className="font-bold text-navy mb-4">50-Page Profile Structure</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
          {[
            ['01', 'Cover'],
            ['02', 'Executive Summary'],
            ['03', 'Table of Contents'],
            ['04', 'Company Identification'],
            ['05', 'Background & History'],
            ['06', 'Who We Are'],
            ['07', 'Vision, Mission & Values'],
            ['08', 'Company at a Glance'],
            ['09', 'Our Competitive Capabilities'],
            ['10', 'Organization & Management'],
            ['11', 'Our People'],
            ['12', 'Geographic Footprint'],
            ['13', 'Digital Construction Management'],
            ['14', 'What We Do — Services Overview'],
            ['15', 'Building Construction'],
            ['16', 'Road & Infrastructure'],
            ['17', 'Fuel Station & Depot'],
            ['18', 'Structural Steel & Metal Works'],
            ['19', 'Woodwork & Finishing'],
            ['20', 'Quarry & Construction Materials'],
            ['21', 'Ready-Mix Concrete Supply'],
            ['22', 'Heavy Machinery & Fleet Rental'],
            ['23', 'Real Estate Development'],
            ['24', 'Resources & Production Capacity'],
            ['25', 'Project Delivery Methodology'],
            ['26', 'Procurement & Supply Chain'],
            ['27', 'Quality Management'],
            ['28', 'HSEQ'],
            ['29', 'Project Risk Management'],
            ['30', 'Project Portfolio Overview'],
            ['31', 'Completed Projects I'],
            ['32', 'Completed Projects II'],
            ['33', 'Ongoing Projects'],
            ['34–36', 'Selected Project Case Studies (×3)'],
            ['37', 'Clients & Partners'],
            ['38', 'Client Feedback & References'],
            ['39', 'Certifications & Recognition'],
            ['40', 'Financial & Commercial Capacity'],
            ['41', 'Careers & Social Responsibility'],
            ['42', 'Plant, Equipment & Fleet Capacity'],
            ['43', 'Equipment — Technical Detail'],
            ['44', 'Steel Fabrication & Workshop'],
            ['45', 'Professional Manpower & Management'],
            ['46', 'Tender-Proven Project Experience'],
            ['47', 'Current Contract Commitments'],
            ['48', 'Recognition & Demonstrated Performance'],
            ['49', 'Tender & Prequalification Documentation'],
            ['50', 'Contact & Offices'],
          ].map(([pg, title]) => (
            <div key={pg} className="flex items-center gap-3 py-0.5">
              <span className="text-[11px] font-bold text-accent w-8 shrink-0">{pg}</span>
              <span className="text-slate-600">{title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CMS data sources */}
      <div className="mt-5 border border-slate-200 bg-stone-50 rounded-lg p-6">
        <h2 className="font-bold text-navy mb-4">CMS → PDF Data Mapping</h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            ['Site Settings',             'Company name, logo, contact, stats, vision, mission, values'],
            ['Projects CMS',              'Portfolio pages 30–36, tables 31–33, tender pages 46–47'],
            ['Services CMS',              'Service overview (14) and individual service pages 15–23'],
            ['Team / Management',         'Organization (10), People (11), Manpower (45)'],
            ['Equipment CMS',             'Equipment capacity (42), technical detail (43)'],
            ['Clients CMS',               'Clients & Partners (37)'],
            ['Testimonials CMS',          'Client Feedback (38)'],
            ['Awards CMS',                'Certifications (39), Recognition (48)'],
            ['Milestones CMS',            'History (05), Recognition (48)'],
            ['Gallery CMS',               'Project gallery thumbnails'],
            ['Capabilities Settings',     'Competitive capabilities (09), HSEQ (28), Capacity (24)'],
            ['About / Digital Settings',  'Digital Construction Management (13)'],
          ].map(([source, pages]) => (
            <div key={source} className="flex gap-3">
              <span className="font-semibold text-navy shrink-0 w-44">{source}</span>
              <span className="text-slate-500 text-xs leading-relaxed">{pages}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
