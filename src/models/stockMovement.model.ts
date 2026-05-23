import mongoose, { Schema } from 'mongoose';

const RecipientSchema = new Schema(
  {
    name:    { type: String },
    phone:   { type: String },
    email:   { type: String },
    company: { type: String },
    address: { type: String },
    city:    { type: String },
  },
  { _id: false }
);

const StockMovementSchema: Schema = new Schema(
  {
    product:     { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productSlug: { type: String, required: true },
    productName: { type: String, required: true },

    type:  { type: String, enum: ['sale', 'restock', 'adjustment'], required: true },
    delta: { type: Number, required: true },
    quantityAfter: { type: Number, required: true, min: 0 },

    recipient: { type: RecipientSchema, default: undefined },

    supplier: { type: String },
    poNumber: { type: String },
    unitCost: { type: Number },

    notes: { type: String, maxlength: 1000 },

    performedBy:      { type: Schema.Types.Mixed, required: true },
    performedByEmail: { type: String },

    ip:        { type: String },
    userAgent: { type: String },

    reverses: { type: Schema.Types.ObjectId, ref: 'StockMovement', default: null },
  },
  { timestamps: true }
);

StockMovementSchema.index({ product: 1, createdAt: -1 });
StockMovementSchema.index({ createdAt: -1 });
StockMovementSchema.index({ 'recipient.phone': 1 });

const StockMovement = mongoose.model('StockMovement', StockMovementSchema);
export default StockMovement;
