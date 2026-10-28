import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SiteProvider } from './context/SiteContext';
import ErrorBoundary from './components/ErrorBoundary';
import PublicLayout from './components/PublicLayout';
import Home from './pages/Home';

// Route-level code splitting: every page except the landing route is loaded
// on demand, so the initial bundle stays small and admin tooling never ships
// to public visitors.
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Capabilities = lazy(() => import('./pages/Capabilities'));
const Equipment    = lazy(() => import('./pages/Equipment'));
const ReadyMix     = lazy(() => import('./pages/ReadyMix'));
const Aggregate    = lazy(() => import('./pages/Aggregate'));
const HSEQ         = lazy(() => import('./pages/HSEQ'));
const WhereWeWork  = lazy(() => import('./pages/WhereWeWork'));
const Careers      = lazy(() => import('./pages/Careers'));
const Contact      = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Search   = lazy(() => import('./pages/Search'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const MessagesAdmin = lazy(() => import('./pages/admin/MessagesAdmin'));
const SettingsAdmin = lazy(() => import('./pages/admin/SettingsAdmin'));
const HeaderFooterAdmin = lazy(() => import('./pages/admin/HeaderFooterAdmin'));
const HeroAdmin = lazy(() => import('./pages/admin/HeroAdmin'));
const HomeContentAdmin = lazy(() => import('./pages/admin/HomeContentAdmin'));
const HomeAdmin = lazy(() => import('./pages/admin/HomeAdmin'));
const AboutAdmin = lazy(() => import('./pages/admin/AboutAdmin'));
const ProjectsAdmin = lazy(() =>
  import('./pages/admin/Resources').then((m) => ({ default: m.ProjectsAdmin }))
);
const ServicesAdmin = lazy(() =>
  import('./pages/admin/Resources').then((m) => ({ default: m.ServicesAdmin }))
);
const TeamAdmin = lazy(() =>
  import('./pages/admin/Resources').then((m) => ({ default: m.TeamAdmin }))
);
const ClientsAdmin = lazy(() =>
  import('./pages/admin/Resources').then((m) => ({ default: m.ClientsAdmin }))
);
const AwardsAdmin = lazy(() =>
  import('./pages/admin/Resources').then((m) => ({ default: m.AwardsAdmin }))
);
const TestimonialsAdmin = lazy(() =>
  import('./pages/admin/Resources').then((m) => ({ default: m.TestimonialsAdmin }))
);
const MilestonesAdmin = lazy(() =>
  import('./pages/admin/Resources').then((m) => ({ default: m.MilestonesAdmin }))
);
const GalleryAdmin = lazy(() =>
  import('./pages/admin/Resources').then((m) => ({ default: m.GalleryAdmin }))
);
const CareersAdmin = lazy(() =>
  import('./pages/admin/Resources').then((m) => ({ default: m.CareersAdmin }))
);
const CertificatesAdmin = lazy(() =>
  import('./pages/admin/Resources').then((m) => ({ default: m.CertificatesAdmin }))
);
const EquipmentAdmin   = lazy(() => import('./pages/admin/EquipmentAdmin'));
const NewsAdmin        = lazy(() => import('./pages/admin/NewsAdmin'));
const DocumentsAdmin   = lazy(() => import('./pages/admin/DocumentsAdmin'));
const RequestsAdmin    = lazy(() => import('./pages/admin/RequestsAdmin'));
const MediaLibrary        = lazy(() => import('./pages/admin/MediaLibrary'));
const CompanyProfileAdmin = lazy(() => import('./pages/admin/CompanyProfileAdmin'));
const News             = lazy(() => import('./pages/News'));
const Downloads        = lazy(() => import('./pages/Downloads'));

function RouteLoader() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <div className="h-10 w-10 border-2 border-navy border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SiteProvider>
          <MotionConfig reducedMotion="user">
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Toaster position="top-right" />
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route index element={<Home />} />
                  <Route path="about" element={<About />} />
                  <Route path="services" element={<Services />} />
                  <Route path="services/:id" element={<ServiceDetail />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:id" element={<ProjectDetail />} />
                  <Route path="capabilities" element={<Capabilities />} />
                  <Route path="equipment" element={<Equipment />} />
                  <Route path="ready-mix" element={<ReadyMix />} />
                  <Route path="aggregate" element={<Aggregate />} />
                  <Route path="hseq" element={<HSEQ />} />
                  <Route path="where-we-work" element={<WhereWeWork />} />
                  <Route path="careers" element={<Careers />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="search" element={<Search />} />
                  <Route path="news" element={<News />} />
                  <Route path="downloads" element={<Downloads />} />
                  <Route path="*" element={<NotFound />} />
                </Route>

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="projects" element={<ProjectsAdmin />} />
                  <Route path="services" element={<ServicesAdmin />} />
                  <Route path="team" element={<TeamAdmin />} />
                  <Route path="clients" element={<ClientsAdmin />} />
                  <Route path="awards" element={<AwardsAdmin />} />
                  <Route path="testimonials" element={<TestimonialsAdmin />} />
                  <Route path="milestones" element={<MilestonesAdmin />} />
                  <Route path="gallery" element={<GalleryAdmin />} />
                  <Route path="careers" element={<CareersAdmin />} />
                  <Route path="certificates" element={<CertificatesAdmin />} />
                  <Route path="equipment" element={<EquipmentAdmin />} />
                  <Route path="news" element={<NewsAdmin />} />
                  <Route path="documents" element={<DocumentsAdmin />} />
                  <Route path="requests" element={<RequestsAdmin />} />
                  <Route path="media" element={<MediaLibrary />} />
                  <Route path="company-profile" element={<CompanyProfileAdmin />} />
                  <Route path="hero" element={<HeroAdmin />} />
                  <Route path="home" element={<HomeAdmin />} />
                  <Route path="about" element={<AboutAdmin />} />
                  <Route path="home-content" element={<HomeContentAdmin />} />
                  <Route path="messages" element={<MessagesAdmin />} />
                  <Route path="settings" element={<SettingsAdmin />} />
                  <Route path="header-footer" element={<HeaderFooterAdmin />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
          </MotionConfig>
        </SiteProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}