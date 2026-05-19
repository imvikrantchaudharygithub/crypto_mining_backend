import mongoose, { Schema } from 'mongoose';

const HomePageSchema: Schema = new Schema(
  {
    _id: { type: String, default: 'home' },
    hero: {
      visible: { type: Boolean, default: true },
      sectionTag: String,
      cornerLabelLeft: String,
      cornerLabelRight: String,
      headlineLine1: String,
      headlineItalic: String,
      subtitleLines: [String],
      primaryCta: { label: String, href: String },
      ghostCta: { label: String, href: String },
      liveBadgeText: String,
      trustStrip: [{ value: String, label: String }],
      btcPrice: {
        visible: { type: Boolean, default: true },
        value: String,
        label: String,
        delta: String,
        deltaDirection: { type: String, enum: ['up', 'down'], default: 'up' },
      },
    },
    statsMarquee: {
      visible: { type: Boolean, default: true },
      items: [{ label: String, value: String }],
    },
    statsGrid: {
      visible: { type: Boolean, default: true },
      sectionTag: String,
      headlineLine1: String,
      headlineLine2: String,
      items: [{ label: String, detail: String, value: Number, decimals: Number, prefix: String, suffix: String }],
    },
    plansSection: {
      visible: { type: Boolean, default: true },
      sectionTag: String,
      headlineLine1: String,
      headlineLine2: String,
      asideText: String,
    },
    whyUs: {
      visible: { type: Boolean, default: true },
      sectionTag: String,
      headlineLine1: String,
      headlineItalic: String,
      features: [{ num: String, title: String, body: String }],
    },
    howItWorks: {
      visible: { type: Boolean, default: true },
      sectionTag: String,
      headlinePrefix: String,
      headlineItalic: String,
      steps: [{ num: String, title: String, body: String }],
    },
    teamSection: {
      visible: { type: Boolean, default: true },
      sectionTag: String,
      headlineLine1: String,
      headlineItalic: String,
      asideText: String,
    },
    softwarePartnersSection: {
      visible: { type: Boolean, default: true },
      sectionTag: String,
      headlineLine1: String,
      headlineItalic: String,
      asideText: String,
    },
    faqs: {
      visible: { type: Boolean, default: true },
      sectionTag: String,
      headlineLine1: String,
      headlineLine2: String,
      items: [{ q: String, a: String }],
    },
    footerCta: {
      visible: { type: Boolean, default: true },
      sectionTag: String,
      headlinePrefix: String,
      headlineItalic: String,
      cta: { label: String, href: String },
      quickLinks: [{ label: String, href: String }],
      copyright: String,
      coordinates: String,
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

const HomePage = mongoose.model('HomePage', HomePageSchema);
export default HomePage;
