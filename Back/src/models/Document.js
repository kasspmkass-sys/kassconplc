/**
 * Document Library model.
 * Backs /downloads — approved public documents only.
 * Types map to the frontend download categories.
 * Files are stored in GridFS via the standard /upload endpoint.
 * NEVER expose internal/confidential documents via the public API.
 */
import mongoose from 'mongoose';

const DOCUMENT_TYPES = [
  'company-profile',
  'capability-statement',
  'equipment-list',
  'ready-mix-brochure',
  'project-portfolio',
  'certificate',
  'other',
];

const documentSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    type: {
      type: String,
      enum: DOCUMENT_TYPES,
      default: 'other',
    },
    description: String,
    fileUrl:     { type: String, required: true }, // GridFS media URL or /api/company-profile.pdf
    fileSize:    String,   // human-readable, e.g. "1.2 MB"
    fileType:    String,   // e.g. "PDF"
    version:     String,   // e.g. "2024-Q3"
    thumbnail:   String,   // optional cover image GridFS URL
    order:       { type: Number, default: 0 },
    published:   { type: Boolean, default: true },
    // Only public=true documents are served via the public API.
    // Confidential documents stay published=false.
    public:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DOCUMENT_TYPES_LIST = DOCUMENT_TYPES;
export default mongoose.model('Document', documentSchema);
