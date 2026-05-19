import mongoose, { Schema } from 'mongoose';

const MediaSchema: Schema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    filename: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    width: { type: Number },
    height: { type: Number },
    alt: { type: String },
    folder: { type: String, enum: ['products', 'logos', 'pages', 'misc'], default: 'misc' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Media = mongoose.model('Media', MediaSchema);
export default Media;
