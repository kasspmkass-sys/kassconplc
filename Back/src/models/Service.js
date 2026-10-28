import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: String,
    summary: String,
    description: String,
    icon: { type: String, default: 'building' },
    image: String,
    features: [String],
    /* Detailed capability sub-page content. Every block is optional — the
       detail page only renders the sections an admin has actually filled in,
       so a sparsely configured service never shows empty headings. */
    capacityLabel: String,
    capacityText: String,
    process: [{ title: String, desc: String }],
    qualityText: String,
    equipmentText: String,
    gallery: [String],
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Service', serviceSchema);
