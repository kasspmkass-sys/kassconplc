/**
 * SERVICE DETAIL
 * Engineering-focused layout. CMS-driven via /services/public/:id.
 * Shows: overview · image · features · capabilities · CTA.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight,
  Building2, Building, Forklift, Fuel, Hammer,
  Layers, Route, Settings2, Trees, Factory,
} from 'lucide-react';
import api from '../api';
import { useSEO } from '../useSEO';
import { useSite } from '../context/SiteContext';
import { FadeIn } from '../components/Motion';
import SiteImage from '../components/SiteImage';
import PageHeader from '../components/PageHeader';
import PageCta from '../components/PageCta';

const ICONS = {
  building: Building2, fuel: Fuel, steel: Hammer, wood: Trees,
  quarry: Layers, management: Settings2, crane: Forklift,
  road: Route, mixer: Factory, realestate: Building,
};

export default function ServiceDetail() {
  const { settings }  = useSite();
  const { id }        = useParams();
  const [service, setService] = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  const detail          = settings?.servicesPage?.detail || {};
  const notFoundTitle   = detail.notFoundTitle    || 'Service not found';
  const overviewLabel   = detail.overviewLabel    || 'Overview';
  const capabilitiesLabel = detail.capabilitiesLabel || 'Capabilities';
  const enquiryCta      = detail.enquiryCta       || 'Enquire about this service';
  const noDescription   = detail.noDescription   || 'Details available on request.';
  const allServicesLabel = detail.allServicesLabel || 'All services';
  const processLabel    = detail.processLabel    || 'How we deliver';
  const qualityLabel    = detail.qualityLabel    || 'Quality & compliance';
  const equipmentLabel  = detail.equipmentLabel  || 'Equipment & resources';
  const galleryLabel    = detail.galleryLabel    || 'Gallery';

  useEffect(() => {
    setLoading(true);
    setError('');
    setService(null);
    setImageFailed(false);
    api.get(`/services/public/${id}`)
      .then((r) => setService(r.data))
      .catch(() => setError(notFoundTitle))
      .finally(() => setLoading(false));
  }, [id]);

  useSEO(service?.title, service?.summary, 'serviceDetail');

  if (loading) {
    return (
      <div className="pt-20">
        <div className="skeleton h-[28vh]" />
        <div className="container-pad py-12 space-y-5">
          <div className="skeleton h-8 w-1/2" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="pt-32 pb-20 container-pad text-center">
        <p className="text-slate-500 mb-6">{error || notFoundTitle}</p>
        <Link to="/services" className="btn-primary">
          <ArrowLeft size={16} /> {allServicesLabel}
        </Link>
      </div>
    );
  }

  const Icon = ICONS[service.icon] || Building2;

  return (
    <>
      <PageHeader
        backTo="/services"
        backLabel={allServicesLabel}
        kicker="Service"
        title={service.title}
        lead={service.summary}
        image={service.image}
      />

      <section className="section bg-white">
        <div className="container-pad">
          <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">

            {/* Main content */}
            <FadeIn className="lg:col-span-2 space-y-10">

              {/* Service image */}
              {/* Service image — the bordered frame is dropped when the image
                  is missing or fails, so no empty box is left behind. */}
              {service.image && !imageFailed && (
                <div className="overflow-hidden border border-slate-200">
                  <SiteImage
                    src={service.image}
                    alt={service.title}
                    onError={() => setImageFailed(true)}
                    className="w-full object-cover aspect-[16/7]"
                  />
                </div>
              )}

              {/* Overview */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                  <p className="editorial-eyebrow">{overviewLabel}</p>
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-base sm:text-lg">
                  {service.description || service.summary || noDescription}
                </p>
              </div>

              {/* Features */}
              {service.features?.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                    <p className="editorial-eyebrow">{capabilitiesLabel}</p>
                  </div>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {service.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                        <span aria-hidden="true" className="mt-2 h-0.5 w-5 shrink-0 bg-accent" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Capacity */}
              {service.capacityText && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                    <p className="editorial-eyebrow">{service.capacityLabel || 'Capacity'}</p>
                  </div>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {service.capacityText}
                  </p>
                </div>
              )}

              {/* Process */}
              {service.process?.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                    <p className="editorial-eyebrow">{processLabel}</p>
                  </div>
                  <ol className="space-y-0 border-l-2 border-slate-200 pl-6">
                    {service.process.map((step, i) => (
                      <li key={step.title || i} className="relative pb-6 last:pb-0">
                        <span className="absolute -left-[1.9375rem] flex h-7 w-7 items-center justify-center bg-accent text-[10px] font-bold text-white">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <h3 className="font-display text-sm font-bold text-navy">{step.title}</h3>
                        {step.desc && (
                          <p className="mt-1 text-sm leading-relaxed text-slate-500">{step.desc}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Quality & compliance */}
              {service.qualityText && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                    <p className="editorial-eyebrow">{qualityLabel}</p>
                  </div>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {service.qualityText}
                  </p>
                  <Link
                    to="/hseq"
                    className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-accent transition-colors hover:text-accent-dark"
                  >
                    Read our HSEQ system <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                </div>
              )}

              {/* Equipment & resources */}
              {service.equipmentText && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                    <p className="editorial-eyebrow">{equipmentLabel}</p>
                  </div>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {service.equipmentText}
                  </p>
                  <Link
                    to="/equipment"
                    className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-accent transition-colors hover:text-accent-dark"
                  >
                    View our equipment <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                </div>
              )}

              {/* Gallery */}
              {service.gallery?.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-accent" />
                    <p className="editorial-eyebrow">{galleryLabel}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {service.gallery.map((src, i) => (
                      <div key={`${src}-${i}`} className="overflow-hidden border border-slate-200">
                        <SiteImage
                          src={src}
                          alt={`${service.title} — image ${i + 1}`}
                          loading="lazy"
                          className="aspect-[16/10] w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </FadeIn>

            {/* Sidebar */}
            <FadeIn delay={0.1} className="space-y-4">
              {/* Service identity card */}
              <div className="border-t-2 border-accent border border-slate-200 bg-stone-50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-10 w-10 items-center justify-center bg-navy text-white">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <h2 className="font-display text-base font-bold text-navy">{service.title}</h2>
                </div>
                {service.summary && (
                  <p className="text-sm text-slate-600 leading-relaxed">{service.summary}</p>
                )}
              </div>

              <Link to="/contact" className="btn-primary w-full">
                {enquiryCta} <ArrowRight size={15} />
              </Link>
              <Link to="/services" className="btn-ghost w-full">
                <ArrowLeft size={14} /> {allServicesLabel}
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      <PageCta
        kicker="Start a conversation"
        title={`Planning a project requiring ${service.title}?`}
        label="Contact KASCON"
      />
    </>
  );
}
