/**
 * LATEST UPDATES — homepage strip.
 * Prefer items passed from Home (one fetch). Fall back to /news/public
 * when mounted elsewhere without props.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import { FadeIn, Stagger, item } from '../Motion';
import { motion } from 'framer-motion';
import SiteImage from '../SiteImage';
import api from '../../api';

const TYPE_LABELS = {
  news: 'News',
  'project-milestone': 'Milestone',
  announcement: 'Announcement',
  completion: 'Completion',
  equipment: 'Equipment',
};

const TYPE_COLORS = {
  news: 'bg-navy text-white',
  'project-milestone': 'bg-emerald-700 text-white',
  announcement: 'bg-accent text-white',
  completion: 'bg-emerald-600 text-white',
  equipment: 'bg-slate-700 text-white',
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function LatestUpdates({ settings, items: itemsProp, loading: loadingProp }) {
  const passed = Array.isArray(itemsProp);
  const [local, setLocal] = useState([]);
  const [localLoading, setLocalLoading] = useState(!passed);

  const lu = settings?.home?.latestUpdates || {};
  const kicker = lu.kicker || 'Latest updates';
  const title = lu.title || 'News, milestones & announcements.';
  const subtitle = lu.subtitle || '';
  const ctaLabel = lu.ctaLabel || 'View all updates';

  useEffect(() => {
    if (passed) return undefined;
    let active = true;
    api.get('/news/public')
      .then((r) => { if (active) setLocal((r.data || []).slice(0, 4)); })
      .catch(() => { if (active) setLocal([]); })
      .finally(() => { if (active) setLocalLoading(false); });
    return () => { active = false; };
  }, [passed]);

  const loading = passed ? Boolean(loadingProp) : localLoading;
  const items = (passed ? itemsProp : local).slice(0, 4);

  if (!loading && items.length === 0) return null;

  return (
    <section aria-labelledby="latest-updates-heading" className="section bg-stone-50">
      <div className="container-pad">
        <FadeIn>
          <div className="flex items-end justify-between gap-6 mb-12 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                <p className="editorial-eyebrow" id="latest-updates-heading">{kicker}</p>
              </div>
              <h2 className="editorial-title max-w-2xl">{title}</h2>
              {subtitle && (
                <p className="mt-4 text-base leading-relaxed text-slate-600 max-w-xl">{subtitle}</p>
              )}
            </div>
            <Link to="/news" className="btn-ghost shrink-0 hidden sm:inline-flex">
              {ctaLabel} <ArrowRight size={15} />
            </Link>
          </div>
        </FadeIn>

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-slate-200 bg-white overflow-hidden">
                <div className="skeleton aspect-[16/9]" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-3 w-1/3" />
                  <div className="skeleton h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && items.length > 0 && (
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {items.map((upd) => (
              <motion.article
                key={upd._id}
                variants={item}
                className="group flex flex-col bg-white border border-slate-200 overflow-hidden
                  transition-all duration-200 hover:border-accent/35 hover:shadow-elevated hover:-translate-y-0.5"
              >
                {upd.image && (
                  <div className="aspect-[16/10] overflow-hidden bg-navy/5">
                    <SiteImage
                      src={upd.image}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${TYPE_COLORS[upd.type] || 'bg-navy text-white'}`}>
                      {TYPE_LABELS[upd.type] || upd.type}
                    </span>
                    {upd.date && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar size={10} aria-hidden="true" />
                        {formatDate(upd.date)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-[15px] font-bold text-navy leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                    {upd.title}
                  </h3>
                  {upd.summary && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">{upd.summary}</p>
                  )}
                </div>
              </motion.article>
            ))}
          </Stagger>
        )}

        <FadeIn className="mt-8 sm:hidden">
          <Link to="/news" className="btn-ghost w-full">
            {ctaLabel} <ArrowRight size={15} />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
