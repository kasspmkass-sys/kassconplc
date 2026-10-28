/**
 * NEWS & UPDATES — Public page
 * CMS-driven via /news/public (NewsUpdate model).
 * Types: news | project-milestone | announcement | completion | equipment
 * Admin manages via /admin/news.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Tag } from 'lucide-react';
import api from '../api';
import { useSite } from '../context/SiteContext';
import { useSEO } from '../useSEO';
import { FadeIn, Stagger, item } from '../components/Motion';
import { motion } from 'framer-motion';
import SiteImage from '../components/SiteImage';
import PageHeader from '../components/PageHeader';

const TYPE_LABELS = {
  'news':              'News',
  'project-milestone': 'Project Milestone',
  'announcement':      'Announcement',
  'completion':        'Completion',
  'equipment':         'Equipment',
};

const TYPE_COLORS = {
  'news':              'bg-navy text-white',
  'project-milestone': 'bg-emerald-700 text-white',
  'announcement':      'bg-accent text-white',
  'completion':        'bg-emerald-600 text-white',
  'equipment':         'bg-slate-700 text-white',
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function News() {
  const { settings }  = useSite();
  const pg            = settings?.newsPage || {};
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('All');

  const heroKicker    = pg.heroKicker   || 'News & Updates';
  const heroTitle     = pg.heroTitle    || 'Latest from KASCON.';
  const heroLead      = pg.heroLead     ||
    'Project milestones, completions, equipment updates and company announcements.';
  const emptyState    = pg.emptyState   || 'No updates published yet. Please check back shortly.';
  const readMoreLabel = pg.readMoreLabel || 'Read more';

  useSEO(
    'News & Updates',
    'Project milestones, completions, equipment updates and company announcements from KASCON.',
    'news'
  );

  useEffect(() => {
    setLoading(true);
    api.get('/news/public')
      .then((r) => setItems(r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  /* Available filter tabs based on what's in the data */
  const activeTypes = useMemo(() => {
    const types = new Set(items.map((i) => i.type).filter(Boolean));
    return ['All', ...Object.keys(TYPE_LABELS).filter((t) => types.has(t))];
  }, [items]);

  const filtered = useMemo(() =>
    items.filter((i) => filter === 'All' || i.type === filter),
    [items, filter]
  );

  /* Featured item — most recent featured one */
  const featured  = filtered.find((i) => i.featured) || null;
  const rest      = filtered.filter((i) => i._id !== featured?._id);

  return (
    <>
      <PageHeader kicker={heroKicker} title={heroTitle} lead={heroLead} />

      {/* Type filter */}
      {activeTypes.length > 2 && (
        <div className="bg-navy border-b border-white/10">
          <div className="container-pad py-4">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter updates by type">
              {activeTypes.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={filter === t}
                  onClick={() => setFilter(t)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
                    filter === t
                      ? 'bg-accent text-white border border-accent'
                      : 'bg-white/10 text-white/70 border border-white/15 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {t === 'All' ? 'All' : TYPE_LABELS[t] || t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <section className="section bg-stone-50">
        <div className="container-pad">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="border border-slate-200 bg-white overflow-hidden">
                  <div className="skeleton aspect-[16/9]" />
                  <div className="p-5 space-y-3">
                    <div className="skeleton h-4 w-1/3" />
                    <div className="skeleton h-5 w-3/4" />
                    <div className="skeleton h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <p>{emptyState}</p>
            </div>
          ) : (
            <>
              {/* Featured lead card */}
              {featured && (
                <FadeIn className="mb-8">
                  <div className="grid lg:grid-cols-2 overflow-hidden bg-white border border-slate-200">
                    {featured.image && (
                      <div className="relative aspect-[16/9] lg:aspect-auto overflow-hidden bg-navy">
                        <SiteImage
                          src={featured.image}
                          alt={featured.title}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="eager"
                        />
                        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent" />
                      </div>
                    )}
                    <div className="flex flex-col justify-center p-7 sm:p-10">
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 ${TYPE_COLORS[featured.type] || 'bg-navy text-white'}`}>
                          {TYPE_LABELS[featured.type] || featured.type}
                        </span>
                        <span className="text-xs text-slate-400">{formatDate(featured.date)}</span>
                      </div>
                      <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl leading-tight">
                        {featured.title}
                      </h2>
                      {featured.summary && (
                        <p className="mt-4 text-slate-600 leading-relaxed line-clamp-4">{featured.summary}</p>
                      )}
                    </div>
                  </div>
                </FadeIn>
              )}

              {/* Grid */}
              {rest.length > 0 && (
                <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rest.map((upd) => (
                    <motion.article
                      key={upd._id}
                      variants={item}
                      className="group flex flex-col bg-white border border-slate-200
                        transition-all duration-200 hover:border-accent/40 hover:shadow-elevated hover:-translate-y-0.5"
                    >
                      <div aria-hidden="true" className="h-0.5 bg-slate-100 group-hover:bg-accent transition-colors duration-200" />

                      {upd.image && (
                        <div className="aspect-[16/9] overflow-hidden bg-navy/5">
                          <SiteImage
                            src={upd.image}
                            alt={upd.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}

                      <div className="flex flex-col flex-1 p-5">
                        <div className="flex items-center gap-2.5 mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${TYPE_COLORS[upd.type] || 'bg-navy text-white'}`}>
                            {TYPE_LABELS[upd.type] || upd.type}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar size={11} aria-hidden="true" />
                            {formatDate(upd.date)}
                          </span>
                        </div>

                        <h3 className="font-display text-base font-bold text-navy leading-snug group-hover:text-accent transition-colors duration-200">
                          {upd.title}
                        </h3>
                        {upd.summary && (
                          <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-3">{upd.summary}</p>
                        )}
                      </div>
                    </motion.article>
                  ))}
                </Stagger>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
