import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Expense from '../models/expense.model';
import ExpenseCategory from '../models/expenseCategory.model';

type ExpenseFilterQuery = {
  date?: { $gte?: Date; $lte?: Date };
  categoryId?: mongoose.Types.ObjectId | { $in: mongoose.Types.ObjectId[] };
  amount?: { $gte?: number; $lte?: number };
  $or?: Array<Record<string, unknown>>;
};

function buildFilter(q: Request['query']): ExpenseFilterQuery {
  const filter: ExpenseFilterQuery = {};

  if (q.from || q.to) {
    filter.date = {};
    if (q.from) filter.date.$gte = new Date(String(q.from));
    if (q.to) {
      const to = new Date(String(q.to));
      to.setHours(23, 59, 59, 999);
      filter.date.$lte = to;
    }
  }

  if (q.categoryId) {
    const raw = String(q.categoryId);
    const ids = raw.split(',').map((s) => s.trim()).filter((s) => mongoose.isValidObjectId(s));
    if (ids.length === 1) filter.categoryId = new mongoose.Types.ObjectId(ids[0]);
    else if (ids.length > 1) filter.categoryId = { $in: ids.map((i) => new mongoose.Types.ObjectId(i)) };
  }

  if (q.minAmount || q.maxAmount) {
    filter.amount = {};
    if (q.minAmount) filter.amount.$gte = Number(q.minAmount);
    if (q.maxAmount) filter.amount.$lte = Number(q.maxAmount);
  }

  if (q.search) {
    const re = new RegExp(String(q.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: re }, { notes: re }, { categorySnapshot: re }];
  }

  return filter;
}

export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, categoryId, amount, date, notes } = req.body;

    if (!title || !String(title).trim()) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }
    if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
      res.status(400).json({ success: false, message: 'Valid categoryId is required' });
      return;
    }
    if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) < 0) {
      res.status(400).json({ success: false, message: 'Valid amount is required' });
      return;
    }

    const category = await ExpenseCategory.findById(categoryId);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const r = req as any;
    const createdBy = r.user?._id && mongoose.isValidObjectId(r.user._id) ? r.user._id : undefined;

    const expense = await Expense.create({
      title: String(title).trim(),
      categoryId,
      categorySnapshot: (category as any).name,
      amount: Number(amount),
      date: date ? new Date(String(date)) : new Date(),
      notes: notes ? String(notes) : '',
      createdBy,
    });

    res.status(201).json({ success: true, message: 'Expense created', expense });
  } catch (error) {
    console.error('Error in createExpense:', error);
    res.status(500).json({ success: false, message: 'Failed to create expense', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = buildFilter(req.query);
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 500) : 200;
    const skip = req.query.skip ? Math.max(Number(req.query.skip), 0) : 0;

    const [expenses, total] = await Promise.all([
      Expense.find(filter as any).sort({ date: -1, createdAt: -1 }).limit(limit).skip(skip),
      Expense.countDocuments(filter as any),
    ]);

    res.status(200).json({ success: true, expenses, total, limit, skip });
  } catch (error) {
    console.error('Error in getExpenses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getExpenseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }
    res.status(200).json({ success: true, expense });
  } catch (error) {
    console.error('Error in getExpenseById:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expense', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const updates: Record<string, unknown> = {};
    if (req.body.title !== undefined) updates.title = String(req.body.title).trim();
    if (req.body.amount !== undefined) updates.amount = Number(req.body.amount);
    if (req.body.date !== undefined) updates.date = new Date(String(req.body.date));
    if (req.body.notes !== undefined) updates.notes = String(req.body.notes);

    if (req.body.categoryId !== undefined) {
      if (!mongoose.isValidObjectId(req.body.categoryId)) {
        res.status(400).json({ success: false, message: 'Invalid categoryId' });
        return;
      }
      const cat = await ExpenseCategory.findById(req.body.categoryId);
      if (!cat) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      updates.categoryId = req.body.categoryId;
      updates.categorySnapshot = (cat as any).name;
    }

    const expense = await Expense.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Expense updated', expense });
  } catch (error) {
    console.error('Error in updateExpense:', error);
    res.status(500).json({ success: false, message: 'Failed to update expense', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.body.id || req.params.id;
    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    console.error('Error in deleteExpense:', error);
    res.status(500).json({ success: false, message: 'Failed to delete expense', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Stats endpoint — powers dashboard card + filter-bar summary strip.
 * Returns: totals for window, previous-window total (for % delta),
 *          by-category breakdown, daily series (for sparkline).
 */
export const getExpenseStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = buildFilter(req.query);

    // Determine window for prev-period comparison + daily series
    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;
    if (to) to.setHours(23, 59, 59, 999);

    const [totalsAgg, byCategory, series] = await Promise.all([
      Expense.aggregate([
        { $match: filter as any },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 }, avg: { $avg: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: filter as any },
        {
          $group: {
            _id: '$categoryId',
            name: { $first: '$categorySnapshot' },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
      from && to
        ? Expense.aggregate([
            { $match: filter as any },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                total: { $sum: '$amount' },
              },
            },
            { $sort: { _id: 1 } },
          ])
        : Promise.resolve([] as { _id: string; total: number }[]),
    ]);

    // Previous window total (same length, immediately before)
    let prevTotal = 0;
    if (from && to) {
      const windowMs = to.getTime() - from.getTime();
      const prevTo = new Date(from.getTime() - 1);
      const prevFrom = new Date(prevTo.getTime() - windowMs);
      const prevFilter = { ...filter, date: { $gte: prevFrom, $lte: prevTo } };
      const prevAgg = await Expense.aggregate([
        { $match: prevFilter as any },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      prevTotal = prevAgg[0]?.total ?? 0;
    }

    // Pull category color metadata for UI
    const catIds = byCategory.map((c: any) => c._id).filter(Boolean);
    const cats = await ExpenseCategory.find({ _id: { $in: catIds } }).select('name color');
    const colorMap = new Map(cats.map((c: any) => [String(c._id), c.color]));

    res.status(200).json({
      success: true,
      stats: {
        total: totalsAgg[0]?.total ?? 0,
        count: totalsAgg[0]?.count ?? 0,
        avg: totalsAgg[0]?.avg ?? 0,
        prevTotal,
        byCategory: byCategory.map((c: any) => ({
          categoryId: c._id,
          name: c.name,
          total: c.total,
          count: c.count,
          color: colorMap.get(String(c._id)) ?? '#7c8aa3',
        })),
        series: series.map((s: any) => ({ date: s._id, total: s.total })),
      },
    });
  } catch (error) {
    console.error('Error in getExpenseStats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Compact summary used by the admin dashboard card.
 * Returns: this-month total, last-month total, top category, 30-day daily series.
 */
export const getExpenseDashboardSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const last30Start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    last30Start.setHours(0, 0, 0, 0);

    const [thisMonthAgg, lastMonthAgg, topCatAgg, series] = await Promise.all([
      Expense.aggregate([
        { $match: { date: { $gte: monthStart, $lte: now } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: monthStart, $lte: now } } },
        { $group: { _id: '$categoryId', name: { $first: '$categorySnapshot' }, total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 1 },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: last30Start, $lte: now } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const thisMonthTotal = thisMonthAgg[0]?.total ?? 0;
    const lastMonthTotal = lastMonthAgg[0]?.total ?? 0;
    const deltaPct = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : (thisMonthTotal > 0 ? 100 : 0);

    res.status(200).json({
      success: true,
      summary: {
        thisMonthTotal,
        thisMonthCount: thisMonthAgg[0]?.count ?? 0,
        lastMonthTotal,
        deltaPct,
        topCategory: topCatAgg[0] ? { name: topCatAgg[0].name, total: topCatAgg[0].total } : null,
        series: series.map((s: any) => ({ date: s._id, total: s.total })),
      },
    });
  } catch (error) {
    console.error('Error in getExpenseDashboardSummary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summary', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
