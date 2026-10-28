import { useEffect, useState } from 'react';
import api from '../api';
import { useSite } from '../context/SiteContext';
import { useSEO } from '../useSEO';
import PageHeader from '../components/PageHeader';
import WhereWeWorkSection from '../components/home/WhereWeWork';
import ProjectMap from '../components/ProjectMap';
import PageCta from '../components/PageCta';

export default function WhereWeWork() {
  const { settings } = useSite();
  const [projects, setProjects] = useState([]);

  const whereWeWorkPage = settings?.whereWeWorkPage || {};
  const heroKicker = whereWeWorkPage.heroKicker || 'Coverage';
  const heroTitle = whereWeWorkPage.heroTitle || 'Where We Work';
  const heroLead =
    whereWeWorkPage.heroLead ||
    'Headquartered in Addis Ababa and operating across the country, Kassa & Sons delivers building, civil, energy and infrastructure works for public and private clients.';
  const heroImage = whereWeWorkPage.image || null;
  const heroAlt = whereWeWorkPage.alt || 'Kassa & Sons construction site in operation';

  useSEO(
    'Where We Work',
    'Headquartered in Addis Ababa, Kassa & Sons Construction PLC operates across Ethiopia - from high-rise mixed-use developments to fuel depots, roads and civil works.',
    'whereWeWork'
  );

  useEffect(() => {
    api.get('/projects/public').then((r) => setProjects(r.data || [])).catch(() => {});
  }, []);

  return (
    <>
      <PageHeader
        kicker={heroKicker}
        title={heroTitle}
        lead={heroLead}
        image={heroImage}
        alt={heroAlt}
      />
      <WhereWeWorkSection settings={settings} compact />

      <ProjectMap
        projects={projects}
        kicker={whereWeWorkPage.mapKicker || 'Coverage map'}
        title={whereWeWorkPage.mapTitle || 'Our project footprint across Ethiopia.'}
        subtitle={whereWeWorkPage.mapSubtitle || 'Select a marker to view the project summary. Dark markers are completed, red markers are currently underway.'}
      />
      <PageCta
        kicker="Start a conversation"
        title="Planning a project in Ethiopia?"
        label="Request a consultation"
        secondaryTo="/projects"
        secondaryLabel="View projects"
      />
    </>
  );
}