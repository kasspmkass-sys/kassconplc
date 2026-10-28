import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    client: String,
    category: {
      type: String,
      enum: ['Mixed-Use', 'Residential', 'Commercial', 'Fuel Station', 'Infrastructure', 'Aviation', 'Industrial', 'Other'],
      default: 'Other',
    },
    scope: String,
    location: String,
    contractValue: Number,
    progress: { type: Number, default: 100 },
    status: { type: String, enum: ['completed', 'ongoing'], default: 'completed' },
    year: String,
    description: String,
    featured: { type: Boolean, default: false },
    images: [String],
    coverImage: String,
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
    /* Additional data requested in the latest review */
    startDate: Date,
    completionDate: Date,
    lat: Number,
    lng: Number,
    majorQuantities: String,   // comma or bullet (rendered as-is)
    quantities: String,
    phases: [String],          // before/during/after gallery slots
    mapLabel: String,
    mapRegion: String,
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
