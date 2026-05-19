import mongoose, { Schema } from 'mongoose';

const TrackTicketPageSchema: Schema = new Schema(
  {
    _id: { type: String, default: 'track-ticket' },
    hero: {
      visible: { type: Boolean, default: true },
      tagNum: String,
      tagLabel: String,
      headline: String,
      italicWord: String,
      mono: String,
    },
    lookup: {
      visible: { type: Boolean, default: true },
      placeholder: { type: String, default: 'Enter ticket ID — e.g. CMM-2024-0042' },
      submitLabel: { type: String, default: 'Track' },
      notFoundMessage: { type: String, default: 'No ticket found for that ID.' },
      emptyHint: { type: String, default: 'Enter your ticket ID to track its status in real time' },
    },
    escalation: {
      visible: { type: Boolean, default: true },
      copy: { type: String, default: 'Need to escalate? Contact us directly.' },
      ctaLabel: { type: String, default: 'Contact support →' },
      ctaHref: { type: String, default: '/contact' },
    },
  },
  { timestamps: true, strict: false }
);

const TrackTicketPage = mongoose.model('TrackTicketPage', TrackTicketPageSchema);
export default TrackTicketPage;
