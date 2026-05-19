import mongoose, { Schema } from 'mongoose';

const LeadSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    source: { type: String, default: 'contact-form' },
    ipAddress: { type: String },
    userAgent: { type: String },
    status: { type: String, enum: ['new', 'in-progress', 'replied', 'spam', 'closed'], default: 'new' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: [
      {
        author: { type: Schema.Types.ObjectId, ref: 'User' },
        body: { type: String },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Lead = mongoose.model('Lead', LeadSchema);
export default Lead;
