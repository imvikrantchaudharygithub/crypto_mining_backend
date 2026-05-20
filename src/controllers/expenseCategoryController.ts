import { Request, Response } from 'express';
import ExpenseCategory, { DEFAULT_EXPENSE_CATEGORIES } from '../models/expenseCategory.model';
import Expense from '../models/expense.model';

export const seedDefaultExpenseCategories = async (): Promise<void> => {
  try {
    const count = await ExpenseCategory.estimatedDocumentCount();
    if (count > 0) return;
    await ExpenseCategory.insertMany(
      DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, isDefault: true }))
    );
    console.log(`[seed] Inserted ${DEFAULT_EXPENSE_CATEGORIES.length} default expense categories`);
  } catch (err) {
    console.error('[seed] Failed to seed expense categories:', err);
  }
};

export const getExpenseCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await ExpenseCategory.find().sort({ order: 1, name: 1 });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('Error in getExpenseCategories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const createExpenseCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, color } = req.body;
    if (!name || !String(name).trim()) {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }
    const existing = await ExpenseCategory.findOne({ name: String(name).trim() });
    if (existing) {
      res.status(409).json({ success: false, message: 'Category already exists' });
      return;
    }
    const last = await ExpenseCategory.findOne().sort({ order: -1 }).select('order').lean();
    const lastOrder = typeof (last as any)?.order === 'number' ? (last as any).order : 0;
    const category = await ExpenseCategory.create({
      name: String(name).trim(),
      color: color || '#7c8aa3',
      isDefault: false,
      order: lastOrder + 1,
    });
    res.status(201).json({ success: true, category });
  } catch (error) {
    console.error('Error in createExpenseCategory:', error);
    res.status(500).json({ success: false, message: 'Failed to create category', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateExpenseCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const updates: Record<string, unknown> = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.color !== undefined) updates.color = req.body.color;
    if (req.body.order !== undefined) updates.order = req.body.order;

    const category = await ExpenseCategory.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    if (updates.name) {
      await Expense.updateMany({ categoryId: category._id }, { $set: { categorySnapshot: updates.name } });
    }

    res.status(200).json({ success: true, category });
  } catch (error) {
    console.error('Error in updateExpenseCategory:', error);
    res.status(500).json({ success: false, message: 'Failed to update category', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteExpenseCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    const category = await ExpenseCategory.findById(id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }
    if ((category as any).isDefault) {
      res.status(400).json({ success: false, message: 'Default categories cannot be deleted' });
      return;
    }
    const inUse = await Expense.countDocuments({ categoryId: id });
    if (inUse > 0) {
      res.status(409).json({ success: false, message: `Category in use by ${inUse} expense${inUse === 1 ? '' : 's'}. Reassign or delete those first.` });
      return;
    }
    await ExpenseCategory.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Error in deleteExpenseCategory:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
