import mongoose, { Schema } from 'mongoose';
import slugify from 'slugify';

const ProductSchema: Schema = new Schema(
  {
    slug: { type: String, unique: true },
    name: { type: String, required: true },
    shortName: { type: String },
    subName: { type: String },
    algo: { type: String, required: true },
    tag: { type: String },
    stock: { type: String, enum: ['In Stock', 'Coming Soon', 'Sold Out'], default: 'In Stock' },
    available: { type: Boolean, default: true },
    bestSeller: { type: Boolean, default: false },
    edition: { type: String },
    sku: { type: String, unique: true },
    tagline: { type: String },
    hashrate: { type: String },
    hashrateNum: { type: String },
    hashrateUnit: { type: String },
    power: { type: String },
    powerNum: { type: String },
    efficiency: { type: String },
    efficiencyNum: { type: String },
    noise: { type: String },
    noiseNum: { type: String },
    contract: { type: String },
    price: { type: Number, required: true },
    priceDisplay: { type: String },
    silencerPrice: { type: Number, default: 0 },
    specs: {
      performance: { type: [[String]], default: [] },
      power: { type: [[String]], default: [] },
      physical: { type: [[String]], default: [] },
      connectivity: { type: [[String]], default: [] },
    },
    boxItems: [{ icon: String, label: String, sub: String }],
    electricalReqs: { type: [[String]], default: [] },
    images: { type: [String], default: [] },
    gallery: [{ image: String, title: String, description: String }],
    relatedSlugs: { type: [String], default: [] },
    seo: { title: String, description: String, ogImage: String },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

ProductSchema.pre('save', function (next) {
  const product = this as any;
  if (product.isModified('name')) {
    product.slug = slugify(product.name.toString(), { lower: true, strict: true, replacement: '-' });
  }
  if (!product.sku) {
    const slugPart = (product.slug || 'PROD').toUpperCase().slice(0, 8);
    const uniqueId = product._id.toString().slice(-6).toUpperCase();
    product.sku = `CMM-${slugPart}-${uniqueId}`;
  }
  next();
});

const Product = mongoose.model('Product', ProductSchema);
export default Product;
