import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: String,
    bio: String,
    photo: String,
    /* Professional background shown on About (§12). */
    qualification: String,
    experience: String,
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('TeamMember', teamSchema);
