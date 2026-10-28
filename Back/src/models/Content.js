/**
 * Content models — all lightweight CMS collections that don't warrant
 * their own file. Exported individually so routes can import selectively.
 */
import mongoose from 'mongoose';

// ── Client / Partner logos ────────────────────────────────────────────────
export const Client = mongoose.model(
  'Client',
  new mongoose.Schema(
    {
      name:      { type: String, required: true },
      logo:      String,
      website:   String,
      order:     { type: Number, default: 0 },
      published: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);

// ── Awards & recognition ──────────────────────────────────────────────────
export const Award = mongoose.model(
  'Award',
  new mongoose.Schema(
    {
      title:       { type: String, required: true },
      issuer:      String,
      year:        String,
      description: String,
      image:       String,
      order:       { type: Number, default: 0 },
      published:   { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);

// ── Client testimonials ───────────────────────────────────────────────────
export const Testimonial = mongoose.model(
  'Testimonial',
  new mongoose.Schema(
    {
      quote:     { type: String, required: true },
      author:    String,
      role:      String,
      company:   String,
      project:   String,
      image:     String,
      published: { type: Boolean, default: true },
      order:     { type: Number, default: 0 },
    },
    { timestamps: true }
  )
);

// ── Company milestones / timeline ─────────────────────────────────────────
export const Milestone = mongoose.model(
  'Milestone',
  new mongoose.Schema(
    {
      year:        { type: String, required: true },
      title:       String,
      description: String,
      order:       { type: Number, default: 0 },
      published:   { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);

// ── Contact form messages ─────────────────────────────────────────────────
export const Message = mongoose.model(
  'Message',
  new mongoose.Schema(
    {
      name:    { type: String, required: true },
      email:   { type: String, required: true },
      phone:   String,
      subject: String,
      message: { type: String, required: true },
      read:    { type: Boolean, default: false },
      // Optional: originating form type (general | ready-mix | aggregate | equipment)
      formType: { type: String, default: 'general' },
    },
    { timestamps: true }
  )
);

// ── HSEQ / compliance certificates ────────────────────────────────────────
// Public-facing licences and certificates. `file` points at the uploaded
// document so visitors can view or download it directly from the HSEQ page.
export const Certificate = mongoose.model(
  'Certificate',
  new mongoose.Schema(
    {
      name:        { type: String, required: true },
      issuer:      String,
      number:      String,
      issuedYear:  String,
      validUntil:  String,
      // Optional uploaded document; when empty only the metadata is shown.
      file:        String,
      description: String,
      order:       { type: Number, default: 0 },
      published:   { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);

// ── Photo gallery ─────────────────────────────────────────────────────────
// Used by /equipment page (category filter) and general site gallery.
// Equipment photos: category = one of EQUIPMENT_CATEGORIES_LIST.
// General gallery: category = 'Site', 'Team', 'Plant', etc.
export const Gallery = mongoose.model(
  'Gallery',
  new mongoose.Schema(
    {
      title:     String,
      category:  String,
      image:     { type: String, required: true },
      order:     { type: Number, default: 0 },
      published: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);

// ── Job vacancies ─────────────────────────────────────────────────────────
export const Career = mongoose.model(
  'Career',
  new mongoose.Schema(
    {
      title:        { type: String, required: true },
      department:   String,
      location:     String,
      type: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
        default: 'Full-time',
      },
      status: {
        // 'open' shows on public site; 'closed' hides but keeps the record
        type: String,
        enum: ['open', 'closed'],
        default: 'open',
      },
      summary:      String,
      description:  String,
      requirements: [String],
      deadline:     String,
      order:        { type: Number, default: 0 },
      published:    { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);

// ── Ready-Mix quotation requests ──────────────────────────────────────────
// Stored separately from general Messages so admin can filter/manage them.
export const ReadyMixRequest = mongoose.model(
  'ReadyMixRequest',
  new mongoose.Schema(
    {
      projectName:     { type: String, required: true },
      location:        { type: String, required: true },
      grade:           String,
      quantity:        String,
      castingDate:     String,
      requiredTime:    String,
      pumpRequired:    { type: String, default: 'No' },
      contactPerson:   { type: String, required: true },
      phone:           { type: String, required: true },
      email:           String,
      specialRequirement: String,
      status: {
        type: String,
        enum: ['new', 'reviewed', 'quoted', 'closed'],
        default: 'new',
      },
      read:            { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

// ── Aggregate quotation requests ──────────────────────────────────────────
export const AggregateRequest = mongoose.model(
  'AggregateRequest',
  new mongoose.Schema(
    {
      projectName:   { type: String, required: true },
      location:      { type: String, required: true },
      size:          String,
      quantity:      String,
      deliveryDate:  String,
      contactPerson: { type: String, required: true },
      phone:         { type: String, required: true },
      email:         String,
      notes:         String,
      status: {
        type: String,
        enum: ['new', 'reviewed', 'quoted', 'closed'],
        default: 'new',
      },
      read:          { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);
