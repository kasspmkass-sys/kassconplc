import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import Settings from '../models/Settings.js';
import Project from '../models/Project.js';
import Service from '../models/Service.js';
import TeamMember from '../models/Team.js';
import { Client, Award, Testimonial, Milestone, Gallery } from '../models/Content.js';
import WhatWeBuild, { WHAT_WE_BUILD_CATEGORIES } from '../models/WhatWeBuild.js';

// Prefer public DNS when local resolvers refuse MongoDB Atlas SRV lookups
dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = process.env.MONGODB_URI?.trim();
if (!uri) {
  console.error('MONGODB_URI is required (live Atlas only).');
  process.exit(1);
}
if (/localhost|127\.0\.0\.1/i.test(uri)) {
  console.error('Local MongoDB is not allowed. Use the live Atlas MONGODB_URI only.');
  process.exit(1);
}

// Require an explicit flag to wipe the database — running this without
// --yes will print usage instructions and exit instead of destroying data.
if (!process.argv.includes('--yes')) {
  console.error('\n⚠  This script DELETES ALL existing data before seeding.');
  console.error('   Re-run with  --yes  to confirm:\n');
  console.error('   npm run seed -- --yes\n');
  process.exit(1);
}

/** Public media paths served by Vite from client/public */
const M = {
  hero: '/media/home/hero.jpg',
  logo: '/media/logo.png',
  founder: '/media/team/team-1.jpg',
  manager: '/media/team/team-2.jpg',
  project: (n) => `/media/projects/p-${String(n).padStart(2, '0')}.jpg`,
  siteAlt: (n) => `/media/projects/site-${n}.jpg`,
  service: (n) => `/media/services/svc-${n}.jpg`,
  client: (n) => `/media/clients/client-${n}.jpg`,
  award: (n) => `/media/awards/award-${n}.jpg`,
};

const settings = {
  companyName: 'Kassa & Sons Construction PLC',
  tagline: 'The Result Of Unity',
  headline: 'Building the Future with Quality & Integrity',
  aboutShort:
    'Grade-1 Ethiopian general contractor delivering buildings, fuel stations, civil works and industrial facilities since 1980.',
  aboutLong:
    'Kassa & Sons Construction PLC is an Ethiopian multidisciplinary construction company headquartered in Addis Ababa. Established in April 1980 as Kassa G/Tsadik Building Contractor and formally incorporated as Kassa & Sons Construction PLC in October 1998, the organization has developed broad experience in building construction, civil engineering, roads, earthworks, fuel stations, petroleum depots, tank works, aviation infrastructure and maintenance. The company holds Grade-1 General Contractor status with current capital of ETB 25.493 million.',
  mission:
    'To deliver sustainable, innovative and high-quality construction solutions that meet approved designs, specifications and bills of quantities - building long-term partnerships on integrity, transparency and excellence.',
  vision:
    'To become a leading construction company in Africa, recognized for innovative solutions, outstanding project delivery and a strong commitment to sustainable development.',
  values: [
    { title: 'Integrity', description: 'Highest ethical standards and transparency in every project.' },
    { title: 'Quality', description: 'Exceptional construction that exceeds client expectations.' },
    { title: 'Safety', description: 'Protecting employees, clients and communities at every site.' },
    { title: 'Sustainability', description: 'Environmentally responsible construction practices.' },
    { title: 'Innovation', description: 'Modern methods and technologies that improve outcomes.' },
    { title: 'Accountability', description: 'Ownership, client satisfaction and dependable delivery.' },
  ],
  specializations: [
    { title: 'Building Construction', description: 'Residential, commercial and mixed-use buildings delivered from foundation to finishing.' },
    { title: 'Fuel Stations & Depots', description: 'New stations, forecourt upgrades, tank farms, petroleum depots and aviation depots.' },
    { title: 'Civil Works & Roads', description: 'Roads, earthworks, drainage and site infrastructure for industrial and public clients.' },
    { title: 'Structural Metal Works', description: 'In-house steel fabrication, canopies and technical metal works.' },
    { title: 'Woodwork & Interiors', description: 'Bespoke furniture, joinery and interior fit-out coordinated with handover.' },
    { title: 'Crushed Aggregates', description: 'Owned quarry and crushing plant supplying graded aggregate for projects and external demand.' },
  ],
  about: {
    specializations: { kicker: 'Specialization', title: 'Areas of specialization' },
    founder: { kicker: 'Founder', title: 'Founder & historical background' },
  },
  foundingStory:
    'What started in the 1960s (E.C.) as a small private contracting venture has grown through decades of operational discipline and hands-on site management. The enterprise evolved from a sole proprietorship into a leading, family-led Private Limited Company delivering major commercial, fuel, steel and civil engineering projects across the region.',
  historicalBackground:
    'Kassa & Sons Construction PLC was established as Kassa G/Tsadik Building Contractor in April 1980 and formally incorporated as Kassa & Sons Construction PLC in October 1998. From licensed contracting during Ethiopia\u2019s growth era to a Grade-1 General Contractor today, the company has built a reputation for integrity, craftsmanship and long-term client trust.',
  historicalContent: [
    {
      title: '1960s (E.C.) \u2013 Licensed contractor',
      description: 'Ato Kassa Gebretsadik Abebe began licensed contracting during Ethiopia\u2019s growth era, laying the foundation for the family enterprise.',
    },
    {
      title: '1980 \u2013 Company founded',
      description: 'Kassa G/Tsadik Building Contractor was established in April 1980.',
    },
    {
      title: '1998 \u2013 Incorporation',
      description: 'The enterprise was reconstituted as Kassa & Sons Construction PLC.',
    },
    {
      title: '2002 \u2013 Shell recognition',
      description: 'Recognized Best Contractor by Shell Ethiopia in 2002, 2003 and 2007.',
    },
    {
      title: '2012 \u2013 Energy depots',
      description: 'Delivered civil works for Total Ethiopia Dukem depot, proving fuel & depot capability.',
    },
    {
      title: '2024/2025 \u2013 Gold excellence',
      description: 'Gold Level Organizational Excellence & Leadership Award for 2024/2025.',
    },
  ],
  phone: '+251 911 203 874',
  phones: ['+251 911 203 874', '+251 11 646 60 47', '+251 11 660 94 34', '+251 11 660 22 67', '+251 11 660 23 73', '0967 85 85 85'],
  email: 'kasconpl@gmail.com',
  emails: ['kasconpl@gmail.com', 'kasconplc@gmail.com'],
  website: 'www.kasconplc.com',
  address: 'Gurd Shola, Cheshire Services Ethiopia Building, 3rd Floor, Addis Ababa',
  legetafoAddress: 'Legetafo City, approx. 500 m from Ropack Real Estate road',
  poBox: 'P.O. Box 31219, Addis Ababa, Ethiopia',
  workingHours: 'Mon-Fri 08:00-17:00 - Sat 08:00-12:00 - Sun Closed',
  capital: 'ETB 25.493 million',
  grade: 'Grade-1 General Contractor',
  yearsExperience: '46+',
  projectCount: '37+',
  specialists: '108',
  heroImage: M.hero,
  heroSlides: [
    M.hero,
    '/media/about/site.jpg',
    '/media/about/plant.jpg',
    '/media/projects/p-01.jpg',
    '/media/projects/p-03.jpg',
  ],
  heroEyebrow: 'Grade-1 General Contractor - Addis Ababa',
  heroSupporting: 'Delivering landmark buildings, energy facilities and civil works with disciplined HSEQ and proven programme control.',
  ownerName: 'Ato Kassa G/Tsadik',
  ownerTitle: 'Founder & Chairman',
  ownerImage: M.founder,
  ownerQuote: 'Quality construction is the result of unity - disciplined people, honest leadership and lasting work.',
  ownerBio:
    'Ato Kassa G/Tsadik founded the organization in 1980 and built Kassa & Sons Construction PLC into a Grade-1 Ethiopian contractor. His leadership established a culture of integrity, craftsmanship and long-term client trust across buildings, energy facilities and civil works.',
  homeVideoUrl: '/media/video/kascon.mp4',
  homeVideoPoster: '/media/home/hero.jpg',
  homeVideoTitle: 'Experience Kascon',
  homeVideoSubtitle: 'Watch how we deliver quality construction across Ethiopia.',
  home: {
    about: {
      description:
        'Kassa & Sons Construction PLC is an Ethiopian multidisciplinary construction company headquartered in Addis Ababa — from licensed contracting to a Grade-1 General Contractor trusted across building, civil and energy works.',
    },
  },
  logo: M.logo,
};

const services = [
  {
    title: 'Building Construction',
    slug: 'building-construction',
    summary: 'Residential, commercial, mixed-use and apartment buildings from foundation to finishing.',
    description: 'Full-scope building construction for residential, commercial and mixed-use developments with disciplined project controls.',
    icon: 'building',
    features: ['Foundations & substructure', 'Reinforced concrete', 'Finishing & handover'],
    image: M.service(1),
    order: 1,
  },
  {
    title: 'Fuel Stations & Depots',
    slug: 'fuel-stations',
    summary: 'New stations, forecourt upgrades, rebranding, tank farms and aviation depots.',
    description: 'Specialized construction for energy marketers including NOC, TotalEnergies and OLA Energy facilities.',
    icon: 'fuel',
    features: ['New CODO stations', 'Forecourt upgrades', 'Aviation depots'],
    image: M.service(2),
    order: 2,
  },
  {
    title: 'Structural Metal Works',
    slug: 'metal-works',
    summary: 'Steel fabrication, canopies, frames and technical metal works.',
    description: 'In-house fabrication with bending, shearing, welding and site erection for industrial and commercial projects.',
    icon: 'steel',
    features: ['Structural frames', 'Canopies', 'Shop & site welding'],
    image: M.service(3),
    order: 3,
  },
  {
    title: 'Woodwork & Interiors',
    slug: 'woodwork',
    summary: 'Bespoke furniture, joinery and interior fit-out.',
    description: 'Quality woodwork coordinated with building handover for residential and commercial spaces.',
    icon: 'wood',
    features: ['Bespoke furniture', 'Joinery', 'Interior fit-out'],
    image: M.service(4),
    order: 4,
  },
  {
    title: 'Crushed Aggregates',
    slug: 'aggregates',
    summary: 'Quarry production and graded aggregate supply.',
    description: 'Owned crushing plant supplying graded materials for company projects and external demand.',
    icon: 'quarry',
    features: ['Primary crushing', 'Screening', 'Dispatch'],
    image: M.service(5),
    order: 5,
  },
  {
    title: 'Project Management',
    slug: 'project-management',
    summary: 'Programme, cost, HSEQ and logistics control to Class-One standards.',
    description: 'Experienced project managers, engineers, surveyors and foremen delivering accountable site control.',
    icon: 'management',
    features: ['Planning & scheduling', 'Quantity control', 'HSEQ supervision'],
    image: M.service(6),
    order: 6,
  },
];

const team = [
  { name: 'Ato Kassa G/Tsadik', role: 'Founder & Chairman', bio: 'Founded the company in 1980. Visionary leadership spanning generations of quality construction in Ethiopia.', photo: M.founder, order: 1 },
  { name: 'Ato Getahun Kassa', role: 'General Manager', bio: 'B.Sc. Civil Engineering; 25+ years directing project delivery and corporate operations.', photo: M.manager, order: 2 },
  { name: 'Ato Alemayehu Kassa', role: 'Deputy General Manager', bio: 'Supports executive leadership across operations, project oversight and sister-company coordination.', order: 3 },
  { name: 'Ato Yared Siyum', role: 'Finance Division Head', bio: 'Leads financial planning, reporting and resource control supporting multi-project execution.', order: 4 },
  { name: 'Ato Legnasil Tekab', role: 'Operation Division Head', bio: 'Oversees site operations, mobilisation and coordination of manpower and plant.', order: 5 },
  { name: 'Ato Asenak Belayneh', role: 'HSEQ Head', bio: 'Responsible for health, safety, environment and quality systems across all projects.', order: 6 },
];

const milestones = [
  { year: '1960s E.C.', title: 'Licensed Contractor', description: "Ato Kassa Gebretsadik Abebe began licensed contracting during Ethiopia's growth era.", order: 1 },
  { year: '1980', title: 'Company Founded', description: 'Kassa G/Tsadik Building Contractor established in April 1980.', order: 2 },
  { year: '1998', title: 'Incorporation', description: 'Reconstituted as Kassa & Sons Construction PLC in October 1998.', order: 3 },
  { year: '2002-2007', title: 'Shell Best Contractor', description: 'Recognized Best Contractor by Shell Ethiopia in 2002, 2003 and 2007.', order: 4 },
  { year: '2012', title: 'Energy Depots', description: 'Civil works for Total Ethiopia Dukem depot; proven fuel & depot capability.', order: 5 },
  { year: '2025', title: 'Gold Excellence', description: 'Gold Level Organizational Excellence & Leadership Award for 2024/2025.', order: 6 },
];

const awards = [
  { title: 'Best Contractor', issuer: 'Shell Ethiopia', year: '2002', image: M.award(1), order: 1 },
  { title: 'Best Contractor', issuer: 'Shell Ethiopia', year: '2003', image: M.award(2), order: 2 },
  { title: 'Best Contractor', issuer: 'Shell Ethiopia', year: '2007', image: M.award(3), order: 3 },
  { title: 'Gold Level Organizational Excellence & Leadership Award', issuer: 'Grand African Organizational & Leadership Award', year: '2024/2025', image: M.award(1), order: 4 },
];

const testimonials = [
  {
    quote:
      'Quality of the work is in the group of the best acceptable standard. We are pleased to recommend the contractor for more complex projects and confirm their professional integrity with a safe construction process.',
    author: 'Zena Dawit',
    role: 'Deputy Manager',
    company: 'DAG Trading P.L.C.',
    project: 'B+G+8 Nexus Hotel Building, Gerji',
    image: '/media/testimonials/dag-nexus-hotel.jpg',
    order: 1,
  },
  {
    quote:
      'We recommend Kassa & Sons Construction PLC for equivalent projects since the company completed and provisionally handed over the works to our satisfaction and within the contract time frame.',
    author: 'Tadesse Kebede',
    role: 'Deputy Chief Executive Officer',
    company: 'Derba MIDROC Cement',
    project: 'Fuel Station & Facility Buildings, Derba',
    image: '/media/testimonials/derba-fuel-station.jpg',
    order: 2,
  },
  {
    quote:
      'As design and supervision consultant, we confirm Kassa & Sons Construction performed with strong efficiency, diligence and speed on the G+8 residential building, completing ahead of the scheduled programme.',
    author: 'Yirgalem Zegeye',
    role: 'Consulting Architects & Engineers',
    company: 'Yirgalem Zegeye Consulting',
    project: 'G+8 Residential Building (Africa Market PLC)',
    image: '/media/testimonials/yirgalem-g8-residential.jpg',
    order: 3,
  },
  {
    quote:
      'Quality of the work is in the group of the best acceptable standard, with excellent workmanship. We are pleased to recommend the contractor for more complex projects.',
    author: 'Tamrat Tilahun',
    role: 'Manager, Engineering Department',
    company: 'Dashen Bank',
    project: 'LG+UG+3 Mixed-use Building, Arba Minch',
    image: '/media/testimonials/dashen-arba-minch.jpg',
    order: 4,
  },
  {
    quote:
      'Kassa & Sons Construction PLC successfully delivered the Ayertena service station works, including fabrication and installation of four 50,000-litre underground tanks as per the required detail.',
    author: 'Getachew Degaga',
    role: 'Engineering Head',
    company: 'Yetebaberut Beherawi Petroleum S.C.',
    project: 'Ayertena Service Station',
    image: '/media/testimonials/ybp-ayertena-station.jpg',
    order: 5,
  },
];

const clients = [
  { name: 'Ethiopian Shipping & Logistics', logo: M.client(2), order: 1 },
  { name: 'TotalEnergies Marketing Ethiopia', logo: M.client(3), order: 2 },
  { name: 'OLA Energy Ethiopia', logo: M.client(4), order: 3 },
  { name: 'National Oil Ethiopia (NOC)', logo: M.client(5), order: 4 },
  { name: 'Dashen Bank', logo: M.client(6), order: 5 },
  { name: 'Bahir Dar University', logo: M.client(7), order: 6 },
  { name: 'Swiss Inn Nexus Hotel', logo: M.client(8), order: 7 },
  { name: 'TF House Construction', logo: M.client(9), order: 8 },
];

function withImages(list) {
  return list.map((p, i) => {
    const n = (i % 16) + 1;
    const cover = M.project(n);
    const extra = M.project((n % 16) + 1);
    return {
      ...p,
      coverImage: cover,
      images: [cover, extra, M.siteAlt(n)],
    };
  });
}

const completed = [
  ['TF Project', 'TF House', 'Mixed-Use', '3B+SB+G+18 mixed-use building', 140006945],
  ['JS Project', 'JS', 'Mixed-Use', '2B+SB+G+12 mixed-use building', 191162315],
  ['Top Real Estate', 'Top Real Estate', 'Residential', '2B+G+11 real estate building', 146237333],
  ['Dashen Bank Harrar', 'Dashen Bank', 'Commercial', 'Mixed-use Shewaber, Harrar', 136880701],
  ['Woyin Chemicals', 'Woyin Chemicals', 'Residential', '2B+SB+G+15 mixed residence', 124593989],
  ['Tulu Bolo-Kela Road', 'HHRBC', 'Infrastructure', 'Design-and-build road project', 73056142],
  ['Summit NOC', 'NOC', 'Fuel Station', 'G+2 service station complex, Summit', 46534806],
  ['Mechare NOC', 'NOC', 'Fuel Station', 'NOC service station', 41421477],
  ['Modjo Shipping', 'ESLSE', 'Fuel Station', 'Design & construction of fuel station', 38497484],
  ['Derba Transport', 'Derba', 'Fuel Station', 'Transport fuelling station', 29802384],
  ['Wide Project', 'Wide', 'Mixed-Use', '2B+G+2M+8F mixed-use building', 29737756],
  ['Elias Meseret', 'Elias Meseret', 'Residential', 'B+G+6 apartment building', 26521201],
  ['Gulle Total', 'TotalEnergies', 'Fuel Station', 'KDR at Gulle Medhanialem S/S', 24100295],
  ['Pharma Union', 'Pharma Union', 'Mixed-Use', 'B+G+9 mixed-use building', 18894736],
  ['Ene Dereje Piassa', 'Ene Dereje', 'Mixed-Use', 'B+G+5 mixed-use building', 18933488],
  ['Hawassa NOC', 'NOC', 'Aviation', 'Aviation depot, Hawassa Airport', 5455153],
  ['Grace MCH Hospital', 'Grace MCH', 'Commercial', 'B+G+8 health center', 11575258],
].map(([title, client, category, scope, contractValue], i) => ({
  title, client, category, scope, contractValue, status: 'completed', progress: 100, featured: i < 6, order: i + 1, published: true,
}));

const ongoing = [
  ['Fuel Station', 'Ethiopian Shipping and Logistics Enterprise', 'Fuel Station', 0.95, 68000000],
  ['3B+G+SB+18 Mixed-Use Phase 2', 'TF House / Merkato', 'Mixed-Use', 0.95, 104277848],
  ['B+G+9+T Apartment', 'Selam Seventeen Housing Cooperative', 'Residential', 0.2, 291500000],
  ['B+G+9+T Apartment', 'Genet Housing Cooperative', 'Residential', 0.2, 291500000],
  ['2B+SB+G+8 Apartment', 'Ato Hunetaw Zewdie', 'Residential', 0.15, 53970019],
  ['B+SB+G+1 Commercial Phase I', 'Ato Alemu Mamo', 'Commercial', 0.05, 76881056],
  ['Adama New CODO S/S', 'TotalEnergies Marketing Ethiopia', 'Fuel Station', 0.05, 81770419],
  ['Cafe Modification Gojam Route', 'TotalEnergies Marketing Ethiopia', 'Fuel Station', 0.8, 4363454],
  ['Modification Harambee S/S', 'TotalEnergies Marketing Ethiopia', 'Fuel Station', 0.95, 8641007],
  ['Finishing B+G+5 Mixed-Use', 'Ene Ato Dereje Walelegn', 'Mixed-Use', null, 31882669],
  ['Forecourt Agaro West OLA', 'OLA Energy Ethiopia', 'Fuel Station', null, 26249500],
].map(([title, client, category, progress, contractValue], i) => ({
  title, client, category, contractValue,
  progress: progress == null ? 10 : Math.round(progress * 100),
  status: 'ongoing', featured: i < 3, order: i + 1, published: true,
  scope: title,
}));

const gallery = Array.from({ length: 16 }, (_, i) => ({
  title: `Site portfolio ${i + 1}`,
  category: i % 3 === 0 ? 'Building' : i % 3 === 1 ? 'Fuel Station' : 'Civil Works',
  image: M.project(i + 1),
  order: i + 1,
  published: true,
}));

async function run() {
  await mongoose.connect(uri);
  console.log('Connected to', uri);

  await Promise.all([
    Admin.deleteMany({}),
    Settings.deleteMany({}),
    Project.deleteMany({}),
    Service.deleteMany({}),
    TeamMember.deleteMany({}),
    Client.deleteMany({}),
    Award.deleteMany({}),
    Testimonial.deleteMany({}),
    Milestone.deleteMany({}),
    Gallery.deleteMany({}),
    WhatWeBuild.deleteMany({}),
  ]);

  await Admin.create({
    name: 'Kascon Admin',
    email: process.env.ADMIN_EMAIL || 'admin@kasconplc.com',
    password: process.env.ADMIN_PASSWORD || 'KasconAdmin2026!',
  });

  await Settings.create(settings);
  await Service.insertMany(services);
  await TeamMember.insertMany(team);
  await Milestone.insertMany(milestones);
  await Award.insertMany(awards);
  await Testimonial.insertMany(testimonials);
  await Client.insertMany(clients);
  await Project.insertMany(withImages([...completed, ...ongoing]));
  await Gallery.insertMany(gallery);
  await WhatWeBuild.insertMany(
    WHAT_WE_BUILD_CATEGORIES.map((category, i) => ({
      category,
      order: i + 1,
      published: true,
    }))
  );

  console.log('Seed complete with company images.');
  console.log('Projects:', completed.length + ongoing.length, '| Gallery:', gallery.length);
  console.log('Admin login:', process.env.ADMIN_EMAIL || 'admin@kasconplc.com');
  console.log('Password:', process.env.ADMIN_PASSWORD || 'KasconAdmin2026!');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
