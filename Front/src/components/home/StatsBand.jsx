/**
 * Proof panel — floating KPI ledge under the hero.
 * Count-up on enter, staggered reveal. CMS → settings → defaults.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSite } from '../../context/SiteContext';

const VERIFIED_DEFAULTS = [
  { value: '46+', label: 'Years experience' },
  { value: '2000+', label: 'Projects delivered' },
  { value: '108', label: 'Specialists' },
  { value: 'Grade-1', label: 'Contractor licence' },
];

const SETTING_KEYS = [
  { key: 'yearsExperience', label: 'Years experience' },
  { key: 'projectCount', label: 'Projects delivered' },
  { key: 'specialists', label: 'Specialists' },
  { key: 'grade', label: 'Contractor licence' },
];

const text = (v) => {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'string') return v.trim();
  return '';
};

function parseStatValue(raw) {
  const value = text(raw);
  if (!value) return { kind: 'text', display: '—' };

  const match = value.match(/^([^\d]*)(\d[\d,]*)(\+?)(.*)$/);
  if (!match) return { kind: 'text', display: value };

  const [, prefix, digits, plus, suffix] = match;
  const target = Number(String(digits).replace(/,/g, ''));
  if (!Number.isFinite(target)) return { kind: 'text', display: value };

  return {
    kind: 'number',
    prefix: prefix || '',
    target,
    plus: plus || '',
    suffix: (suffix || '').trim(),
    display: value,
  };
}

function resolveStats(settings) {
  const cms = Array.isArray(settings?.home?.stats) ? settings.home.stats : [];

  const fromCms = cms
    .map((entry, i) => {
      const value = text(entry?.value);
      if (!value) return null;
      const fallback = VERIFIED_DEFAULTS[i] || SETTING_KEYS[i];
      return {
        id: `cms-${i}-${value}`,
        value,
        label: text(entry?.label) || fallback?.label || 'Metric',
        parsed: parseStatValue(value),
      };
    })
    .filter(Boolean);

  if (fromCms.length >= 2) return fromCms.slice(0, 4);

  const fromSettings = SETTING_KEYS.map(({ key, label }) => {
    const value = text(settings?.[key]);
    if (!value) return null;
    return { id: `set-${key}`, value, label, parsed: parseStatValue(value) };
  }).filter(Boolean);

  if (fromSettings.length >= 2) return fromSettings.slice(0, 4);

  const merged = [];
  for (let i = 0; i < 4; i += 1) {
    if (fromCms[i]) merged.push(fromCms[i]);
    else if (fromSettings[i]) merged.push(fromSettings[i]);
    else {
      const d = VERIFIED_DEFAULTS[i];
      merged.push({
        id: `def-${i}`,
        value: d.value,
        label: d.label,
        parsed: parseStatValue(d.value),
      });
    }
  }
  return merged;
}

function easeOutExpo(t) {
  return t >= 1 ? 1 : 1 - 2 ** (-10 * t);
}

function useCountUp(target, active, delay = 0, duration = 1700) {
  const [n, setN] = useState(0);
  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useEffect(() => {
    if (!active) {
      setN(0);
      return undefined;
    }
    if (reduced || !target) {
      setN(target);
      return undefined;
    }

    let frame = 0;
    let delayId = 0;

    const run = () => {
      const startAt = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - startAt) / duration);
        setN(Math.round(target * easeOutExpo(t)));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    if (delay > 0) delayId = window.setTimeout(run, delay);
    else run();

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(delayId);
    };
  }, [active, target, delay, duration, reduced]);

  return n;
}

function StatValue({ parsed, active, delay }) {
  const count = useCountUp(
    parsed.kind === 'number' ? parsed.target : 0,
    active,
    delay
  );

  if (parsed.kind !== 'number') {
    return (
      <span className="stat-proof-value">
        {parsed.display}
      </span>
    );
  }

  const num = active ? count : 0;

  return (
    <span className="stat-proof-value tabular-nums" aria-label={parsed.display}>
      {parsed.prefix}
      {num.toLocaleString('en-US')}
      {parsed.plus ? <span className="stat-proof-plus">{parsed.plus}</span> : null}
      {parsed.suffix ? <span className="stat-proof-suffix"> {parsed.suffix}</span> : null}
    </span>
  );
}

export default function StatsBand({ settings: settingsProp, loading: loadingProp }) {
  const site = useSite();
  const settings = settingsProp ?? site?.settings;
  const loading =
    typeof loadingProp === 'boolean'
      ? loadingProp && !settings
      : Boolean(site?.loading && !settings);

  const stats = useMemo(() => resolveStats(settings || {}), [settings]);
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const start = () => setActive(true);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start();
          io.disconnect();
        }
      },
      { threshold: 0.25, rootMargin: '60px 0px' }
    );
    io.observe(el);

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      start();
      io.disconnect();
    }

    return () => io.disconnect();
  }, [stats]);

  if (loading) {
    return (
      <section
        aria-busy="true"
        aria-label="Company capability statistics"
        className="stat-proof"
      >
        <div className="container-pad">
          <div className="stat-proof-panel">
            <div className="stat-proof-grid">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="stat-proof-item">
                  <div className="hero-skeleton h-8 w-16" />
                  <div className="hero-skeleton mt-2 h-2.5 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      aria-labelledby="company-stats-heading"
      className={`stat-proof${active ? ' is-live' : ''}`}
    >
      <h2 id="company-stats-heading" className="sr-only">
        Company capability statistics
      </h2>
      <div className="container-pad">
        <div className="stat-proof-panel">
          <dl className="stat-proof-grid">
            {stats.map((stat, i) => (
              <div
                key={stat.id}
                className="stat-proof-item"
                style={{ '--i': i }}
              >
                <span className="stat-proof-index" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <dd>
                  <StatValue
                    parsed={stat.parsed}
                    active={active}
                    delay={120 + i * 110}
                  />
                </dd>
                <dt className="stat-proof-label">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
