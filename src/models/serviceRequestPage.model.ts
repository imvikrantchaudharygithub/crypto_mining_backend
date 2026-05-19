import mongoose, { Schema } from 'mongoose';

const ServiceRequestPageSchema: Schema = new Schema(
  {
    _id: { type: String, default: 'service-request' },
    hero: {
      visible: { type: Boolean, default: true },
      tagNum: String,
      tagLabel: String,
      headline: String,
      italicWord: String,
      mono: String,
    },
    whyCard: {
      visible: { type: Boolean, default: true },
      sectionTag: String,
      headlinePrefix: String,
      headlineItalic: String,
      features: [{ icon: String, title: String, desc: String }],
      directContact: { phone: String, email: String },
    },
    form: {
      visible: { type: Boolean, default: true },
      heading: String,
      issueTypes: [String],
      priorityLevels: [String],
      submitLabel: String,
      successTitle: String,
      successBody: String,
    },
  },
  { timestamps: true, strict: false }
);

const ServiceRequestPage = mongoose.model('ServiceRequestPage', ServiceRequestPageSchema);
export default ServiceRequestPage;
