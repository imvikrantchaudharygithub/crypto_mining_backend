import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import User from '../models/user.model';

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || '';

async function run(): Promise<void> {
  if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }
  await mongoose.connect(MONGODB_URI);
  console.log('Connected');

  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@cryptominingmiles.in';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMeOnFirstLogin#2026';
  const passwordHash = await bcrypt.hash(password, 12);

  await User.findOneAndUpdate(
    { email },
    { email, passwordHash, name: 'Super Admin', role: 'super-admin', isActive: true },
    { upsert: true, new: true }
  );

  console.log(`Super admin seeded: ${email}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
