import mongoose, { Schema } from 'mongoose';

const SoftwarePartnerSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    tagline: { type: String, default: '', maxlength: 80, trim: true },
    logo: { type: String, default: '' },
    website: { type: String, default: '', trim: true },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

const SoftwarePartner = mongoose.model('SoftwarePartner', SoftwarePartnerSchema);
export default SoftwarePartner;
