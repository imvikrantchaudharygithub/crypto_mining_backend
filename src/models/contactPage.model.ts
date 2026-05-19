import mongoose, { Schema } from 'mongoose';

const ContactPageSchema: Schema = new Schema(
  {
    _id: { type: String, default: 'contact' },
    hero: {
      visible: { type: Boolean, default: true },
      tagNum: String,
      tagLabel: String,
      headline: String,
      italicWord: String,
      mono: String,
    },
    methods: {
      visible: { type: Boolean, default: true },
      items: [{ icon: String, method: String, primary: String, secondary: String, href: String, cta: String, accent: Boolean }],
    },
    facility: {
      visible: { type: Boolean, default: true },
      sectionTag: String,
      cityHeadline: String,
      italicWord: String,
      coordsLine: String,
      coordsLabel: String,
      mapCta: { label: String, href: String },
      details: [{ label: String, value: String }],
    },
    enquiryForm: {
      visible: { type: Boolean, default: true },
      heading: String,
      subjects: [String],
      submitLabel: String,
      successTitle: String,
      successBody: String,
    },
    numbersSection: {
      visible: { type: Boolean, default: true },
      sectionTag: String,
      headlinePrefix: String,
      headlineItalic: String,
      description: String,
      stats: [{ idx: String, value: Number, suffix: String, prefix: String, label: String, hint: String, decimals: Number }],
      tickerLine: String,
    },
  },
  { timestamps: true, strict: false }
);

const ContactPage = mongoose.model('ContactPage', ContactPageSchema);
export default ContactPage;
