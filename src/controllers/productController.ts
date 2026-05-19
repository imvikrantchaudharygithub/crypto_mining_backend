import { Request, Response } from 'express';
import Product from '../models/product.model';
import { uploadCloudinary } from '../services/cloudinaryService';

// Multer multipart parsing keeps every field as a string and does not expand
// bracket notation. The admin sends JSON-stringified arrays for `boxItems`,
// `electricalReqs` and individual `specs[<group>]` keys — normalise them here
// so Mongoose can cast cleanly. Booleans/numbers are also coerced.
function normaliseProductBody(raw: Record<string, any>): Record<string, any> {
  const body: Record<string, any> = { ...raw };

  // specs can arrive in two shapes:
  //   1. flat keys: body['specs[performance]'] = '<json>'  (multer/raw)
  //   2. nested:    body.specs = {performance: '<json>', ...}  (after bracket expansion)
  //      where each sub-value can be either a JSON string OR a real array.
  const specsAcc: Record<string, any> = {};
  if (body.specs && typeof body.specs === 'object' && !Array.isArray(body.specs)) {
    for (const [k, v] of Object.entries(body.specs)) {
      const parsed = typeof v === 'string' ? safeJson<any>(v, []) : v;
      specsAcc[k] = toTupleRows(parsed);
    }
  }
  for (const key of Object.keys(body)) {
    const m = key.match(/^specs\[([a-zA-Z]+)\]$/);
    if (!m) continue;
    const value = body[key];
    const parsed = typeof value === 'string' ? safeJson<any>(value, []) : value;
    specsAcc[m[1]] = toTupleRows(parsed);
    delete body[key];
  }
  if (Object.keys(specsAcc).length) body.specs = specsAcc;

  // electricalReqs is also a tuple-array
  if (typeof body.electricalReqs === 'string') body.electricalReqs = safeJson(body.electricalReqs, []);
  body.electricalReqs = toTupleRows(body.electricalReqs);

  // Object-shaped array fields — keep as objects
  for (const field of ['boxItems', 'gallery', 'relatedSlugs'] as const) {
    if (typeof body[field] === 'string') body[field] = safeJson(body[field], []);
  }

  // Type coercion for primitives multer always serialises as string
  if (typeof body.available === 'string') body.available = body.available === 'true';
  if (typeof body.bestSeller === 'string') body.bestSeller = body.bestSeller === 'true';
  if (typeof body.price === 'string')         body.price = Number(body.price) || 0;
  if (typeof body.silencerPrice === 'string') body.silencerPrice = Number(body.silencerPrice) || 0;
  if (typeof body.sortOrder === 'string')     body.sortOrder = Number(body.sortOrder) || 0;

  return body;
}

// The schema stores rows as [label, value] tuples but the admin's
// ArrayObjectEditor produces [{label, value}, …]. Accept either shape.
function toTupleRows(input: unknown): [string, string][] {
  if (!Array.isArray(input)) return [];
  const out: [string, string][] = [];
  for (const row of input) {
    if (Array.isArray(row)) {
      const a = row[0] == null ? '' : String(row[0]);
      const b = row[1] == null ? '' : String(row[1]);
      if (a || b) out.push([a, b]);
    } else if (row && typeof row === 'object') {
      const r = row as Record<string, unknown>;
      const a = r.label ?? r.key   ?? r.name  ?? r[0] ?? '';
      const b = r.value ?? r.val   ?? r.text  ?? r[1] ?? '';
      const sa = a == null ? '' : String(a);
      const sb = b == null ? '' : String(b);
      if (sa || sb) out.push([sa, sb]);
    }
  }
  return out;
}

function safeJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const images: string[] = [];
    const gallery: { image: string; title: string; description: string }[] = [];

    if (files?.images) {
      for (const file of files.images) {
        const result: any = await uploadCloudinary(file, 'crypto-mining/products');
        images.push(result.secure_url);
      }
    }
    if (files?.gallery) {
      for (const file of files.gallery) {
        const result: any = await uploadCloudinary(file, 'crypto-mining/products/gallery');
        gallery.push({ image: result.secure_url, title: '', description: '' });
      }
    }

    const body = normaliseProductBody(req.body);
    const product = new Product({ ...body, images, gallery: gallery.length ? gallery : body.gallery });
    await product.save();
    res.status(201).json({ success: true, message: 'Product created', product });
  } catch (error) {
    console.error('Error in createProduct:', error);
    res.status(500).json({ success: false, message: 'Failed to create product', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {};
    if (req.query.algo && req.query.algo !== 'All') filter.algo = req.query.algo;
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    else if (!req.query.status) filter.status = 'active';

    const products = await Product.find(filter).sort({ sortOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, status: 'active' });
    if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Error in getProductBySlug:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const update: any = normaliseProductBody(req.body);

    if (files?.images) {
      const urls: string[] = [];
      for (const file of files.images) {
        const result: any = await uploadCloudinary(file, 'crypto-mining/products');
        urls.push(result.secure_url);
      }
      update.images = urls;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
    res.status(200).json({ success: true, message: 'Product updated', product });
  } catch (error) {
    console.error('Error in updateProduct:', error);
    res.status(500).json({ success: false, message: 'Failed to update product', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    const product = await Product.findByIdAndDelete(id);
    if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const reorderProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body as { ids: string[] };
    await Promise.all(ids.map((id, index) => Product.findByIdAndUpdate(id, { sortOrder: index })));
    res.status(200).json({ success: true, message: 'Products reordered' });
  } catch (error) {
    console.error('Error in reorderProducts:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder products', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    if (!query) { res.status(400).json({ message: 'Query is required' }); return; }
    const products = await Product.find({
      status: 'active',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { algo: { $regex: query, $options: 'i' } },
        { tagline: { $regex: query, $options: 'i' } },
      ],
    }).limit(10);
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Error in searchProducts:', error);
    res.status(500).json({ success: false, message: 'Search failed', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
