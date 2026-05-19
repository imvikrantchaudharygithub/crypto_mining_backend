import mongoose, { Schema } from 'mongoose';

const SiteSettingsSchema: Schema = new Schema(
  {
    _id: { type: String, default: 'site' },
    brand: {
      name: { type: String, default: 'Crypto Mining Miles' },
      tagline: String,
      estYear: String,
      logo: String,
      favicon: String,
    },
    contact: {
      salesPhone:        { type: String, default: '+91 99119 44472' },
      salesPhoneLabel:   { type: String, default: 'Call Us Now' },
      whatsappNumber:    { type: String, default: '919911944472' },
      whatsappMessage:   { type: String, default: "Hi, I'd like to know more about mining contracts." },
      whatsappEnabled:   { type: Boolean, default: true },
      salesEmail:        String,
      supportEmail:      String,
      institutionalEmail: String,
      workingHours:      String,
    },
    facility: {
      address: String,
      cityLabel: String,
      mapEmbedUrl: String,
      tourPolicy: String,
      coordinates: { lat: Number, lng: Number, display: String },
    },
    legal: {
      gstNumber: String,
      cinNumber: String,
      privacyPolicyUrl: String,
      termsUrl: String,
    },
    social: {
      twitter: String,
      linkedin: String,
      youtube: String,
      instagram: String,
      telegram: String,
    },
    footer: {
      copyrightText: String,
      coordinatesLine: String,
    },
    liveCounters: {
      minersOnline: { type: String, default: '52,847' },
      networkHashratePHs: { type: String, default: '620' },
      paidOutUSDM: { type: String, default: '2.4' },
      uptimePct: { type: String, default: '99.9' },
      daysMining: { type: String, default: '3,012' },
    },
    seo: {
      defaultTitle: String,
      defaultDescription: String,
      defaultOgImage: String,
      twitterHandle: String,
    },
  },
  { timestamps: true }
);

const SiteSettings = mongoose.model('SiteSettings', SiteSettingsSchema);
export default SiteSettings;
