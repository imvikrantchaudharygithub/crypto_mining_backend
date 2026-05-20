import mongoose, { Schema } from 'mongoose';

const ExpenseCategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    color: { type: String, default: '#7c8aa3' },
    isDefault: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ExpenseCategory = mongoose.model('ExpenseCategory', ExpenseCategorySchema);
export default ExpenseCategory;

export const DEFAULT_EXPENSE_CATEGORIES: { name: string; color: string; order: number }[] = [
  { name: 'Electricity',        color: '#f59e0b', order: 1 },
  { name: 'Hardware (ASIC)',    color: '#6366f1', order: 2 },
  { name: 'Hosting/Datacenter', color: '#0ea5e9', order: 3 },
  { name: 'Repairs/Maintenance',color: '#ef4444', order: 4 },
  { name: 'Cooling',            color: '#14b8a6', order: 5 },
  { name: 'Internet',           color: '#06b6d4', order: 6 },
  { name: 'Salaries',           color: '#22c55e', order: 7 },
  { name: 'Marketing',          color: '#ec4899', order: 8 },
  { name: 'Office',             color: '#a855f7', order: 9 },
  { name: 'Software',           color: '#8b5cf6', order: 10 },
  { name: 'Legal/Compliance',   color: '#64748b', order: 11 },
  { name: 'Taxes/GST',          color: '#dc2626', order: 12 },
  { name: 'Travel',             color: '#f97316', order: 13 },
  { name: 'Misc',               color: '#94a3b8', order: 14 },
];
