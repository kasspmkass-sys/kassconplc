/**
 * SITE SEARCH
 * Searches projects, services, and careers from existing public APIs.
 * No private/admin data exposed. Keyboard accessible. Mobile-friendly.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Building2, Briefcase, FileText, Search as SearchIcon, Wrench, Newspaper } from 'lucide-react';
import api from '../api';
import { useSite } from '../context/SiteContext';
import { useSEO, useNoindex } from '../useSEO';
import { FadeIn } from '../components/Motion';
import PageHeader from '../components/PageHeader';
import SiteImage from '../components/SiteImage';

const DEFAULT_SUGGESTIONS = ['Building', 'Fuel Station', 'Road', 'Ready-Mix', 'Steel'];

/* Flattens nested values (objects, arrays) so searchable copy such as
   capabilities lists, requirements and quantities is matched too. */
function flatten(value, out = []) {
  if (value == null) return out;
  if (typeof value === 'string') { out.push(value); return out; }
  if (typeof value === 'number' || typeof value === 'boolean') { out.push(String(value)); return out; }
  if (Array.isArray(value)) { value.forEach((v) => flatten(v, out)); return out; }
  if (typeof value === 'object') {
    /* Keep the id searchable but still descend into the record's real content.
       Bailing out as soon as a record had an `_id` reduced every CMS document to
       its ObjectId, so no content query ever matched. Binary GridFS payloads
       are skipped so a blob never lands in the haystack. */
    for (const [key, v] of Object.entries(value)) {
      if (key === 'buffer' || key === 'data') continue;
      if (key === '_id') { if (v) out.push(String(v)); continue; }
      flatten(v, out);
    }
  }
  return out;
}

function hit(record, q) {
  const needle = q.trim().toLowerCase();
  if (!needle) return false;
  return flatten(record).join(' ').toLowerCase().includes(needle);
}

export default function Search() {
  const { settings } = useSite();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [q, setQ]           = useState(initialQ);
  const [inputVal, setInputVal] = useState(initialQ);
  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  const [careers, setCareers]   = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [news, setNews]         = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);

  /* Guards against two overlapping searches: the effect below aborts the
     previous batch, and remembers the term it already resolved so re-submitting
     an identical query reuses the result instead of re-fetching 6 endpoints. */
  const inflight = useRef(null);
  const lastDone = useRef(null);

  const pg = settings?.searchPage || {};
  const heroKicker = pg.heroKicker || 'Search';
  const heroTitle  = pg.heroTitle  || 'Search KASCON.';
  const heroLead   = pg.heroLead   || 'Find projects, services, equipment, news and career opportunities.';
  const placeholder = pg.placeholder || 'Search projects, services, careers…';
  const emptyState  = pg.emptyState  || 'Try a different search term.';
  const suggestions = (Array.isArray(pg.suggestions) && pg.suggestions.length)
    ? pg.suggestions
    : DEFAULT_SUGGESTIONS;

  useSEO('Search', 'Search KASCON projects, services, equipment and careers.', 'search');

  /* useSEO marks public routes indexable; results pages are the exception,
     and robots.txt disallows /search to match. */
  useNoindex();

  useEffect(() => {
    const term = q.trim();
    if (!term) return undefined;

    /* Same term already resolved — nothing to re-fetch. */
    if (lastDone.current === term) {
      setSearched(true);
      setLoading(false);
      return undefined;
    }

    /* A newer search supersedes whatever is still in flight, so a slow earlier
       response can no longer overwrite the results of the latest one. */
    inflight.current?.abort();
    const ctrl = new AbortController();
    inflight.current = ctrl;

    const get = (url) =>
      api.get(url, { signal: ctrl.signal })
        .then((r) => (Array.isArray(r.data) ? r.data : []))
        .catch(() => []);

    setLoading(true);
    setSearched(true);

    Promise.all([
      get('/projects/public'),
      get('/services/public'),
      get('/careers/public'),
      get('/equipment/public'),
      get('/news/public'),
      get('/documents/public'),
    ]).then(([p, s, c, e, n, d]) => {
      if (ctrl.signal.aborted) return;
      setProjects(p.filter((x) => hit(x, term)));
      setServices(s.filter((x) => hit(x, term)));
      setCareers(c.filter((x) => hit(x, term)));
      setEquipment(e.filter((x) => hit(x, term)));
      setNews(n.filter((x) => hit(x, term)));
      setDocuments(d.filter((x) => hit(x, term)));
      lastDone.current = term;
    }).finally(() => {
      if (!ctrl.signal.aborted) setLoading(false);
    });

    return () => ctrl.abort();
  }, [q]);

  const totalResults = projects.length + services.length + careers.length
    + equipment.length + news.length + documents.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = inputVal.trim();
    if (!val) return;
    setQ(val);
    setSearchParams({ q: val });
  };

  return (
    <>
      <PageHeader kicker={heroKicker} title={heroTitle} lead={heroLead} />

      <section className="section bg-stone-50">
        <div className="container-pad max-w-3xl">
          <FadeIn>
            {/* Search input */}
            <form onSubmit={handleSubmit} role="search" className="flex gap-3 mb-10">
              <div className="relative flex-1">
                <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  className="input !pl-11 w-full"
                  type="search"
                  placeholder={placeholder}
                  aria-label="Search"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary shrink-0">Search</button>
            </form>

            {/* Loading */}
            {loading && (
              <div className="space-y-3">
                {[1,2,3].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
              </div>
            )}

            {/* Results */}
            {!loading && searched && (
              <>
                <p className="text-sm text-slate-500 mb-8">
                  {totalResults > 0
                    ? `${totalResults} result${totalResults === 1 ? '' : 's'} for "${q}"`
                    : `No results found for "${q}"`}
                </p>

                {/* Projects */}
                {projects.length > 0 && (
                  <ResultSection
                    label="Projects"
                    icon={Building2}
                    items={projects.map((p) => ({
                      id: p._id,
                      to: `/projects/${p._id}`,
                      title: p.title,
                      meta: [p.category, p.location, p.status].filter(Boolean).join(' · '),
                      image: p.coverImage,
                    }))}
                  />
                )}

                {/* Services */}
                {services.length > 0 && (
                  <ResultSection
                    label="Services"
                    icon={Wrench}
                    items={services.map((s) => ({
                      id: s._id,
                      to: `/services/${s._id}`,
                      title: s.title,
                      meta: s.summary,
                    }))}
                  />
                )}

                {/* Careers */}
                {careers.length > 0 && (
                  <ResultSection
                    label="Careers"
                    icon={Briefcase}
                    items={careers.map((c) => ({
                      id: c._id,
                      to: '/careers',
                      title: c.title,
                      meta: [c.department, c.location, c.type].filter(Boolean).join(' · '),
                    }))}
                  />
                )}

                {/* Equipment */}
                {equipment.length > 0 && (
                  <ResultSection
                    label="Equipment"
                    icon={Wrench}
                    items={equipment.map((e) => ({
                      id: e._id,
                      to: '/equipment',
                      title: e.name || e.title,
                      meta: [e.category, e.specification || e.spec].filter(Boolean).join(' · '),
                      image: e.image,
                    }))}
                  />
                )}

                {/* News */}
                {news.length > 0 && (
                  <ResultSection
                    label="News"
                    icon={Newspaper}
                    items={news.map((n) => ({
                      id: n._id,
                      to: '/news',
                      title: n.title,
                      meta: n.excerpt || n.summary,
                      image: n.image,
                    }))}
                  />
                )}

                {/* Documents */}
                {documents.length > 0 && (
                  <ResultSection
                    label="Documents"
                    icon={FileText}
                    items={documents.map((d) => ({
                      id: d._id,
                      to: '/downloads',
                      title: d.title,
                      meta: d.category,
                    }))}
                  />
                )}

                {/* Empty state */}
                {totalResults === 0 && (
                  <div className="border border-dashed border-slate-300 py-16 text-center">
                    <p className="text-slate-400 mb-4">{emptyState}</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setInputVal(s); setQ(s); setSearchParams({ q: s }); }}
                          className="btn-ghost btn-sm"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Initial state */}
            {!searched && !loading && (
              <div className="text-center py-12 text-slate-400">
                <SearchIcon size={32} className="mx-auto mb-4 opacity-30" />
                <p>Enter a search term above to find projects, services, equipment, news and careers.</p>
              </div>
            )}
          </FadeIn>
        </div>
      </section>
    </>
  );
}

function ResultSection({ label, icon: Icon, items }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2.5 mb-4 border-b border-slate-200 pb-3">
        <Icon size={15} className="text-accent" aria-hidden="true" />
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</h2>
        <span className="text-[10px] text-slate-400">({items.length})</span>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={item.to}
              className="group flex items-center gap-4 border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-accent/40 hover:shadow-card"
            >
              {item.image && (
                <div className="h-12 w-16 shrink-0 overflow-hidden bg-slate-100">
                  <SiteImage src={item.image} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold text-navy group-hover:text-accent transition-colors duration-200 truncate">
                  {item.title}
                </p>
                {item.meta && <p className="mt-0.5 text-xs text-slate-400 truncate">{item.meta}</p>}
              </div>
              <ArrowRight size={14} className="text-slate-300 group-hover:text-accent shrink-0 transition-colors duration-200" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
