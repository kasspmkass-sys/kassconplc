/**
 * News / Updates / Announcements model.
 * Backs the "Latest Updates" section on the homepage and a dedicated updates feed.
 * Types: 'news' | 'project-milestone' | 'equipment' | 'announcement' | 'completion'
 */
import mongoose from 'mongoose';

const newsUpdateSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    slug:        String,
    type: {
      type: String,
      enum: ['news', 'project-milestone', 'equipment', 'announcement', 'completion'],
      default: 'news',
    },
    summary:     String,    // short teaser shown in cards
    body:        String,    // full content (plain text / markdown)
    image:       String,    // GridFS media URL
    date:        { type: Date, default: Date.now },
    relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    featured:    { type: Boolean, default: false },
    order:       { type: Number, default: 0 },
    published:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('NewsUpdate', newsUpdateSchema);
