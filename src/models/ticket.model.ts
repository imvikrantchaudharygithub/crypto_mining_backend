import mongoose, { Schema } from 'mongoose';

const TicketSchema: Schema = new Schema(
  {
    ticketId: { type: String, unique: true },
    contractId: { type: String },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
    },
    issueType: { type: String, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    description: { type: String, required: true },
    attachments: [{ url: String, name: String, size: Number, type: String }],
    status: {
      type: String,
      enum: ['open', 'in-progress', 'awaiting-customer', 'resolved', 'closed'],
      default: 'open',
    },
    eta: { type: Date },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    steps: [
      {
        label: String,
        desc: String,
        time: String,
        occurredAt: Date,
        done: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
        addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  { timestamps: true }
);

const Ticket = mongoose.model('Ticket', TicketSchema);
export default Ticket;
