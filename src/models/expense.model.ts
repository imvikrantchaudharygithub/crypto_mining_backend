import mongoose, { Schema } from 'mongoose';

const ExpenseSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true, index: true },
    categorySnapshot: { type: String, required: true },
    amount: { type: Number, required: true, min: 0, index: true },
    date: { type: Date, required: true, index: true },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1, categoryId: 1 });

const Expense = mongoose.model('Expense', ExpenseSchema);
export default Expense;
