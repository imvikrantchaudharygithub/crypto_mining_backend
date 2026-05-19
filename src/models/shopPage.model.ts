import mongoose, { Schema } from 'mongoose';

const ShopPageSchema: Schema = new Schema(
  {
    _id: { type: String, default: 'shop' },
    hero: {
      visible: { type: Boolean, default: true },
      tagNum: String,
      tagLabel: String,
      headline: String,
      italicWord: String,
      mono: String,
    },
    filters: {
      visible: { type: Boolean, default: true },
      algos: { type: [String], default: ['All', 'SHA-256', 'ETHASH', 'SCRYPT', 'KASPA'] },
      gstNote: { type: String, default: '+ 18% GST' },
    },
    emptyState: {
      visible: { type: Boolean, default: true },
      title: { type: String, default: 'No miners in this category yet.' },
      body: { type: String, default: 'check back soon — new hardware arrives monthly' },
    },
    trust: {
      visible: { type: Boolean, default: true },
      items: [{ icon: String, label: String, desc: String }],
    },
  },
  { timestamps: true, strict: false }
);

const ShopPage = mongoose.model('ShopPage', ShopPageSchema);
export default ShopPage;
