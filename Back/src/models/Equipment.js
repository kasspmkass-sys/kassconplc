/**
 * Equipment & Fleet model.
 * Backs the /equipment public page: photos, category, specs.
 * Admin manages via the generic ResourceManager CRUD (endpoint: equipment).
 */
import mongoose from 'mongoose';

const EQUIPMENT_CATEGORIES = [
  'Earthmoving',
  'Transport',
  'Concrete',
  'Lifting',
  'Crushing',
  'Support Equipment',
];

const equipmentSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    model:       String,                            // e.g. "Liebherr HTM 904"
    category:    { type: String, enum: EQUIPMENT_CATEGORIES, default: 'Support Equipment' },
    capacity:    String,                            // e.g. "8 m³", "50 tonnes"
    quantity:    { type: Number, min: 0 },
    mainUse:     String,                            // one-line purpose
    description: String,
    image:       String,                            // GridFS media URL
    order:       { type: Number, default: 0 },
    published:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const EQUIPMENT_CATEGORIES_LIST = EQUIPMENT_CATEGORIES;
export default mongoose.model('Equipment', equipmentSchema);
