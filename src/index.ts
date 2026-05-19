'use strict';
import express, { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import db from './db/db';
import router from './routes/routes';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins: (string | RegExp)[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://cryptominingmiles.in',
  'https://www.cryptominingmiles.in',
  'https://admin.cryptominingmiles.in',
  /https:\/\/.*\.vercel\.app$/,
];

if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);
if (process.env.ADMIN_URL) allowedOrigins.push(process.env.ADMIN_URL);

const isOriginAllowed = (origin: string): boolean =>
  allowedOrigins.some((a) => (a instanceof RegExp ? a.test(origin) : a === origin));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

app.use(express.json({
  limit: '50mb',
  verify: (req: any, _res, buf) => {
    if (req.originalUrl?.includes('/webhook')) req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const staticPath = path.join(__dirname, 'public');
if (fs.existsSync(staticPath)) app.use(express.static(staticPath));

// Lazy DB connect — cached across warm serverless invocations,
// connected once-and-reused locally.
let dbPromise: Promise<void> | null = null;
const ensureDb = (): Promise<void> => {
  if (!dbPromise) dbPromise = db();
  return dbPromise;
};

app.use(async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    console.error('DB connect failed for incoming request:', err);
    dbPromise = null; // allow retry on next request
    res.status(503).json({ success: false, message: 'Database unavailable' });
  }
});

app.use('/api', router);

app.get('/', (_req: Request, res: Response) => {
  res.send('Crypto Mining Miles API');
});

// Local dev only — on Vercel the platform imports `app` and invokes it per-request.
if (!process.env.VERCEL) {
  ensureDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}

export default app;
