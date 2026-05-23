import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/product.model';
import StockMovement from '../models/stockMovement.model';

class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code);
  }
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s\-()]/g, '');
  if (/^\d{10}$/.test(digits)) return `+91${digits}`;
  return digits;
}

function isPositiveInt(v: any): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0;
}

function isNonNegativeInt(v: any): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0;
}

export const createStockMovement = async (req: Request, res: Response): Promise<void> => {
  const r = req as any;
  const { productId, type, quantity, newQuantity, supplier, poNumber, unitCost, notes } = req.body;
  let { recipient } = req.body;

  if (!['sale', 'restock', 'adjustment'].includes(type)) {
    res.status(400).json({ success: false, message: 'INVALID_TYPE' }); return;
  }
  if (!productId || !mongoose.isValidObjectId(productId)) {
    res.status(400).json({ success: false, message: 'INVALID_PRODUCT_ID' }); return;
  }
  if ((type === 'sale' || type === 'restock') && !isPositiveInt(quantity)) {
    res.status(400).json({ success: false, message: 'INVALID_QUANTITY' }); return;
  }
  if (type === 'adjustment' && !isNonNegativeInt(newQuantity)) {
    res.status(400).json({ success: false, message: 'INVALID_NEW_QUANTITY' }); return;
  }
  if (type === 'adjustment' && (!notes || !String(notes).trim())) {
    res.status(400).json({ success: false, message: 'ADJUSTMENT_NOTES_REQUIRED' }); return;
  }
  if (notes && String(notes).length > 1000) {
    res.status(400).json({ success: false, message: 'NOTES_TOO_LONG' }); return;
  }

  if (type === 'sale') {
    if (!recipient || !recipient.name || !recipient.phone) {
      res.status(400).json({ success: false, message: 'RECIPIENT_NAME_AND_PHONE_REQUIRED' }); return;
    }
    recipient = { ...recipient, phone: normalizePhone(String(recipient.phone)) };
  } else {
    recipient = undefined;
  }

  const session = await mongoose.startSession();
  let movement: any = null;
  try {
    await session.withTransaction(async () => {
      const current = await Product.findById(productId).session(session);
      if (!current) throw new HttpError(404, 'PRODUCT_NOT_FOUND');

      let filter: any;
      let update: any;
      let delta: number;
      const c: any = current;
      const currentQty: number = c.quantity ?? 0;

      if (type === 'sale') {
        const q = Math.abs(quantity);
        delta = -q;
        filter = { _id: current._id, quantity: { $gte: q } };
        update = { $inc: { quantity: delta } };
      } else if (type === 'restock') {
        const q = Math.abs(quantity);
        delta = +q;
        filter = { _id: current._id };
        update = { $inc: { quantity: delta } };
      } else {
        delta = newQuantity - currentQty;
        if (delta === 0) throw new HttpError(400, 'NO_CHANGE');
        filter = { _id: current._id, quantity: currentQty };
        update = { $set: { quantity: newQuantity } };
      }

      const product = await Product.findOneAndUpdate(
        filter, update, { new: true, session }
      );
      if (!product) {
        throw new HttpError(409, 'INSUFFICIENT_STOCK');
      }

      const [created] = await StockMovement.create([{
        product:          product._id,
        productSlug:      (product as any).slug,
        productName:      (product as any).name,
        type,
        delta,
        quantityAfter:    (product as any).quantity,
        recipient,
        supplier,
        poNumber,
        unitCost,
        notes,
        performedBy:      r.user?._id ?? 'dev',
        performedByEmail: r.user?.email ?? 'dev@localhost',
        ip:               req.ip,
        userAgent:        req.headers['user-agent'],
      }], { session });
      movement = created;
    });

    res.status(201).json({ success: true, movement });
  } catch (err: any) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ success: false, message: err.code });
    } else {
      console.error('createStockMovement error:', err);
      res.status(500).json({ success: false, message: 'INTERNAL_ERROR' });
    }
  } finally {
    session.endSession();
  }
};

export const getStockMovements = async (req: Request, res: Response): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const filter: any = {};

    if (req.query.type && ['sale', 'restock', 'adjustment'].includes(String(req.query.type))) {
      filter.type = req.query.type;
    }
    if (req.query.product && mongoose.isValidObjectId(String(req.query.product))) {
      filter.product = new mongoose.Types.ObjectId(String(req.query.product));
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) (filter.createdAt as any).$gte = new Date(String(req.query.from));
      if (req.query.to)   (filter.createdAt as any).$lte = new Date(String(req.query.to));
    }
    if (req.query.admin) filter.performedBy = req.query.admin;
    if (req.query.q) {
      const q = String(req.query.q);
      filter.$or = [
        { 'recipient.name':  { $regex: q, $options: 'i' } },
        { 'recipient.phone': { $regex: q, $options: 'i' } },
        { notes:             { $regex: q, $options: 'i' } },
        { productName:       { $regex: q, $options: 'i' } },
        { poNumber:          { $regex: q, $options: 'i' } },
      ];
    }

    const total = await StockMovement.countDocuments(filter);
    const movements = await StockMovement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      movements,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('getStockMovements error:', err);
    res.status(500).json({ success: false, message: 'INTERNAL_ERROR' });
  }
};

export const getStockMovementsByProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      res.status(400).json({ success: false, message: 'INVALID_PRODUCT_ID' }); return;
    }
    const page  = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));

    const filter: any = { product: new mongoose.Types.ObjectId(String(productId)) };
    if (req.query.type && ['sale', 'restock', 'adjustment'].includes(String(req.query.type))) {
      filter.type = req.query.type;
    }

    const total = await StockMovement.countDocuments(filter);
    const movements = await StockMovement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ success: true, movements, page, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    console.error('getStockMovementsByProduct error:', err);
    res.status(500).json({ success: false, message: 'INTERNAL_ERROR' });
  }
};

export const getInventorySummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ status: 'active' })
      .sort({ sortOrder: 1, createdAt: -1 });

    const lastMoved = await StockMovement.aggregate([
      { $group: { _id: '$product', lastMovedAt: { $max: '$createdAt' } } },
    ]);
    const lastMap = new Map<string, Date>(
      lastMoved.map((r: any) => [r._id.toString(), r.lastMovedAt])
    );

    const rows = products.map((p: any) => {
      const obj = p.toObject();
      const computedStatus =
        obj.stockStatusOverride === 'Coming Soon' ? 'Coming Soon'
        : (obj.quantity ?? 0) > 0                  ? 'In Stock'
        :                                            'Sold Out';
      return {
        _id:                 obj._id,
        name:                obj.name,
        slug:                obj.slug,
        algo:                obj.algo,
        quantity:            obj.quantity ?? 0,
        lowStockThreshold:   obj.lowStockThreshold ?? 3,
        stockStatusOverride: obj.stockStatusOverride ?? null,
        computedStatus,
        lastMovedAt:         lastMap.get(obj._id.toString()) ?? null,
        isLowStock:          (obj.quantity ?? 0) > 0 && (obj.quantity ?? 0) <= (obj.lowStockThreshold ?? 3),
      };
    });

    const totalUnits    = rows.reduce((sum, r) => sum + r.quantity, 0);
    const lowStockCount = rows.filter((r) => r.isLowStock).length;

    res.status(200).json({ success: true, totalUnits, lowStockCount, products: rows });
  } catch (err) {
    console.error('getInventorySummary error:', err);
    res.status(500).json({ success: false, message: 'INTERNAL_ERROR' });
  }
};

export const getInventorySummaryByProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      res.status(400).json({ success: false, message: 'INVALID_PRODUCT_ID' }); return;
    }
    const product: any = await Product.findById(productId);
    if (!product) { res.status(404).json({ success: false, message: 'PRODUCT_NOT_FOUND' }); return; }

    const recent = await StockMovement.find({ product: product._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const totals = await StockMovement.aggregate([
      { $match: { product: product._id } },
      { $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalDelta: { $sum: '$delta' },
      }},
    ]);

    res.status(200).json({
      success: true,
      product: {
        _id:                 product._id,
        name:                product.name,
        slug:                product.slug,
        quantity:            product.quantity ?? 0,
        lowStockThreshold:   product.lowStockThreshold ?? 3,
        stockStatusOverride: product.stockStatusOverride ?? null,
      },
      totalsByType: totals,
      recentMovements: recent,
    });
  } catch (err) {
    console.error('getInventorySummaryByProduct error:', err);
    res.status(500).json({ success: false, message: 'INTERNAL_ERROR' });
  }
};

export const undoStockMovement = async (req: Request, res: Response): Promise<void> => {
  const r = req as any;
  const { movementId } = req.body;
  if (!movementId || !mongoose.isValidObjectId(movementId)) {
    res.status(400).json({ success: false, message: 'INVALID_MOVEMENT_ID' }); return;
  }

  const session = await mongoose.startSession();
  try {
    let reversal: any = null;
    await session.withTransaction(async () => {
      const original: any = await StockMovement.findById(movementId).session(session);
      if (!original) throw new HttpError(404, 'MOVEMENT_NOT_FOUND');
      if (original.reverses) throw new HttpError(400, 'CANNOT_REVERSE_A_REVERSAL');

      const alreadyReversed = await StockMovement.findOne({ reverses: original._id }).session(session);
      if (alreadyReversed) throw new HttpError(400, 'ALREADY_REVERSED');

      const reverseDelta = -original.delta;
      const filter = reverseDelta < 0
        ? { _id: original.product, quantity: { $gte: Math.abs(reverseDelta) } }
        : { _id: original.product };
      const update = { $inc: { quantity: reverseDelta } };

      const product = await Product.findOneAndUpdate(filter, update, { new: true, session });
      if (!product) throw new HttpError(409, 'INSUFFICIENT_STOCK_TO_REVERSE');

      const [created] = await StockMovement.create([{
        product:          product._id,
        productSlug:      (product as any).slug,
        productName:      (product as any).name,
        type:             original.type,
        delta:            reverseDelta,
        quantityAfter:    (product as any).quantity,
        notes:            `Reversal of ${original._id}`,
        performedBy:      r.user?._id ?? 'dev',
        performedByEmail: r.user?.email ?? 'dev@localhost',
        ip:               req.ip,
        userAgent:        req.headers['user-agent'],
        reverses:         original._id,
      }], { session });
      reversal = created;
    });
    res.status(201).json({ success: true, movement: reversal });
  } catch (err: any) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ success: false, message: err.code });
    } else {
      console.error('undoStockMovement error:', err);
      res.status(500).json({ success: false, message: 'INTERNAL_ERROR' });
    }
  } finally {
    session.endSession();
  }
};

export const exportStockMovementsCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {};
    if (req.query.type && ['sale', 'restock', 'adjustment'].includes(String(req.query.type))) {
      filter.type = req.query.type;
    }
    if (req.query.product && mongoose.isValidObjectId(String(req.query.product))) {
      filter.product = new mongoose.Types.ObjectId(String(req.query.product));
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) (filter.createdAt as any).$gte = new Date(String(req.query.from));
      if (req.query.to)   (filter.createdAt as any).$lte = new Date(String(req.query.to));
    }

    const movements = await StockMovement.find(filter).sort({ createdAt: -1 }).limit(10000);

    const cols = [
      'createdAt', 'type', 'delta', 'quantityAfter',
      'productName', 'productSlug',
      'recipient.name', 'recipient.phone', 'recipient.email', 'recipient.company',
      'recipient.address', 'recipient.city',
      'supplier', 'poNumber', 'unitCost',
      'notes', 'performedByEmail',
    ];
    const get = (obj: any, path: string) =>
      path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
    const escape = (v: any) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };

    const lines = [cols.join(',')];
    for (const m of movements) {
      lines.push(cols.map((c) => escape(get(m.toObject(), c))).join(','));
    }
    const csv = lines.join('\n');
    const filename = `inventory-movements-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (err) {
    console.error('exportStockMovementsCsv error:', err);
    res.status(500).json({ success: false, message: 'INTERNAL_ERROR' });
  }
};
