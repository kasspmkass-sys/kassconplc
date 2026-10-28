import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import { Testimonial } from '../models/Content.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

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

async function run() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error('MONGODB_URI missing (live Atlas required)');
  if (/localhost|127\.0\.0\.1/i.test(uri)) {
    throw new Error('Local MongoDB is not allowed. Use the live Atlas MONGODB_URI only.');
  }
  await mongoose.connect(uri);
  await Testimonial.deleteMany({});
  await Testimonial.insertMany(testimonials.map((t) => ({ ...t, published: true })));
  console.log('Updated', testimonials.length, 'project testimonials with letter images');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
