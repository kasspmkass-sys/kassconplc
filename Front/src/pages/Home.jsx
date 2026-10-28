/**
 * HOME PAGE
 * Spine: Hero → Proof stats → Who we are → Services → Projects →
 *        Capacity → HSEQ → Clients → News → CTA
 *
 * One parallel fetch. Below-fold blocks are lazy. KPIs sit in StatsBand
 * so the hero stays cinematic and the first paint is not blocked by cards.
 */
import { useEffect, useState, lazy, Suspense } from 'react';
import api, { READ_TIMEOUT_MS } from '../api';
import { useSite } from '../context/SiteContext';
import { useSEO } from '../useSEO';

import HeroSlider from '../components/HeroSlider';
import StatsBand from '../components/home/StatsBand';
import WhoWeAre from '../components/home/WhoWeAre';
import WhatWeDo from '../components/home/WhatWeDo';
import WhatWeBuild from '../components/home/WhatWeBuild';

const CapacityEquipment = lazy(() => import('../components/home/CapacityEquipment'));
const Safety = lazy(() => import('../components/home/Safety'));
const ClientLogoMarquee = lazy(() => import('../components/ClientLogoMarquee'));
const LatestUpdates = lazy(() => import('../components/home/LatestUpdates'));
const ReadyCta = lazy(() => import('../components/home/ReadyCta'));

function Fold({ min = '28rem', children }) {
  return (
    <Suspense fallback={<div className="below-fold bg-white" style={{ minHeight: min }} aria-hidden="true" />}>
      {children}
    </Suspense>
  );
}

export default function Home() {
  const { settings, loading: settingsLoading } = useSite();

  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [news, setNews] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useSEO(
    null,
    settings?.headline ||
      'Grade-1 General Contractor in Addis Ababa, Ethiopia — building construction, civil engineering, roads, energy facilities and infrastructure works.',
    'home'
  );

  useEffect(() => {
    let active = true;
    /* The timeout matters as much as the catch: without it a cold-start
       request stays pending instead of rejecting, so the catch never runs and
       `loading` never clears. */
    const load = (path) =>
      api
        .get(path, { timeout: READ_TIMEOUT_MS })
        .then((r) => r.data || [])
        .catch(() => []);

    Promise.all([
      load('/projects/public'),
      load('/services/public'),
      load('/equipment/public'),
      load('/news/public'),
      load('/clients/public'),
    ]).then(([p, s, e, n, c]) => {
      if (!active) return;
      setProjects(Array.isArray(p) ? p : []);
      setServices(Array.isArray(s) ? s : []);
      setEquipment(Array.isArray(e) ? e : []);
      setNews(Array.isArray(n) ? n : []);
      setClients(Array.isArray(c) ? c : []);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <HeroSlider />
      <StatsBand settings={settings} loading={settingsLoading} />
      <WhoWeAre settings={settings} />
      <WhatWeDo settings={settings} services={services} loading={loading} />
      <WhatWeBuild settings={settings} projects={projects} loading={loading} />

      <Fold min="32rem">
        <div className="below-fold">
          <CapacityEquipment settings={settings} equipment={equipment} loading={loading} />
        </div>
      </Fold>
      <Fold min="24rem">
        <div className="below-fold">
          <Safety settings={settings} />
        </div>
      </Fold>
      <Fold min="10rem">
        <ClientLogoMarquee settings={settings} clients={clients} loading={loading} />
      </Fold>
      <Fold min="22rem">
        <div className="below-fold">
          <LatestUpdates settings={settings} items={news} loading={loading} />
        </div>
      </Fold>
      <Fold min="18rem">
        <ReadyCta settings={settings} />
      </Fold>
    </>
  );
}
