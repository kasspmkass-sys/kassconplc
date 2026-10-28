import mongoose from 'mongoose';

export const WHAT_WE_BUILD_CATEGORIES = [
  'Mixed-Use',
  'Residential',
  'Fuel Station',
  'Infrastructure',
  'Commercial',
  'Aviation',
  'Industrial',
  'Other',
];

const whatWeBuildSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      unique: true,
      enum: WHAT_WE_BUILD_CATEGORIES,
    },
    image: String,
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('WhatWeBuild', whatWeBuildSchema);