import mongoose, { Schema } from 'mongoose';

const TeamSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    bio: { type: String, default: '', maxlength: 280, trim: true },
    avatar: { type: String, default: '' },
    linkedin: { type: String, default: '', trim: true },
    twitter: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

const Team = mongoose.model('Team', TeamSchema);
export default Team;
