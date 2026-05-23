import 'dotenv/config';
import mongoose from 'mongoose';

async function main() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    process.env.MONGODB_CONNECTION_STRING;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  if (!db) throw new Error('Mongoose connection has no db');
  const coll = db.collection('products');
  const cursor = coll.find({});
  let migrated = 0;
  let skipped = 0;

  while (await cursor.hasNext()) {
    const doc: any = await cursor.next();
    if (doc.quantity !== undefined && doc.stock === undefined) {
      skipped++;
      continue;
    }
    const override = doc.stock === 'Coming Soon' ? 'Coming Soon' : null;
    await coll.updateOne(
      { _id: doc._id },
      {
        $set: {
          quantity: doc.quantity ?? 0,
          lowStockThreshold: doc.lowStockThreshold ?? 3,
          stockStatusOverride: override,
        },
        $unset: { stock: '' },
      }
    );
    migrated++;
  }

  console.log(`Migrated: ${migrated}, already-migrated (skipped): ${skipped}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
