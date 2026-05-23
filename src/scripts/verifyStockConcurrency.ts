import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/product.model';

const API = process.env.API_URL || 'http://localhost:4001/api';
const HEADERS = { 'Content-Type': 'application/json', Authorization: 'Bearer dev-skip' };

async function main() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    process.env.MONGODB_CONNECTION_STRING;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri);

  const products = await Product.find({}).limit(1);
  if (!products.length) { console.error('No products in DB'); process.exit(1); }
  const productId = (products[0]._id as mongoose.Types.ObjectId).toString();

  await fetch(`${API}/create-stock-movement`, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({
      productId, type: 'adjustment', newQuantity: 5, notes: 'concurrency test setup',
    }),
  });

  const requests = Array.from({ length: 20 }, (_, i) =>
    fetch(`${API}/create-stock-movement`, {
      method: 'POST', headers: HEADERS,
      body: JSON.stringify({
        productId, type: 'sale', quantity: 1,
        recipient: { name: `Buyer ${i}`, phone: '9000000000' },
      }),
    }).then(r => r.status)
  );
  const statuses = await Promise.all(requests);
  const succeeded = statuses.filter(s => s === 201).length;
  const conflicted = statuses.filter(s => s === 409).length;

  const after: any = await Product.findById(productId);

  console.log(`succeeded=${succeeded}  conflicted=${conflicted}  remainingQty=${after.quantity}`);
  console.log(`expected: succeeded=5 conflicted=15 remainingQty=0`);

  if (succeeded === 5 && conflicted === 15 && after.quantity === 0) {
    console.log('PASS — atomic write held under concurrency.');
  } else {
    console.error('FAIL — oversell or undersell detected.');
    process.exit(1);
  }
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
