import mongoose, { Schema } from 'mongoose';

const PlanSchema: Schema = new Schema(
  {
    slug: { type: String, unique: true },
    tag: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, enum: ['USD', 'INR'], default: 'USD' },
    hashrate: { type: String },
    duration: { type: String },
    durationMonths: { type: Number },
    featured: { type: Boolean, default: false },
    features: { type: [String], default: [] },
    ctaLabel: { type: String, default: 'Start Mining →' },
    ctaHref: { type: String, default: '#plans' },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

const Plan = mongoose.model('Plan', PlanSchema);
export default Plan;
