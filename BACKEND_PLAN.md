# Crypto Mining Miles — Backend Plan

> **Convention reference:** `/Users/vikrantchaudhary/Desktop/attri/atrri-backend`.
> Every folder name, every file naming convention, every controller/model/route shape, the JWT scheme, the Cloudinary upload pattern, the bootstrap file, the env loader, the build scripts — all mirror that project. New code in this repo must look like new code in atrri-backend.
>
> If the reference project does X, this project does X.
> If the reference project does *not* do Y (e.g. no Zod, no service-layer for CRUD, no `app.ts`/`server.ts` split), this project does *not* do Y.

---

## 0. Document layout

1. Tech stack (locked to reference)
2. Folder structure (mirrors reference exactly)
3. File-naming conventions
4. `src/index.ts` — bootstrap pattern
5. `src/db/db.ts` — Mongo connection pattern
6. `src/config/` — env + cloudinary
7. `src/middlewares/` — auth + uploads
8. `src/types/express.d.ts` — Request augmentation
9. `src/models/` — every collection, every field
10. `src/controllers/` — function shapes & error pattern
11. `src/routes/routes.ts` — single routes file, verb-prefix endpoints
12. `src/services/` — integrations & shared helpers
13. `src/scripts/` — seeders and one-off migrations
14. Auth model (JWT 168h, Bearer header, `req.userId`)
15. Public vs Admin routes
16. Default content seeders
17. `package.json` & `tsconfig.json`
18. `.env.example`
19. Phase-by-phase build order
20. Open decisions

---

## 1. Tech stack (locked to reference)

Same versions, same packages, same patterns as `atrri-backend`:

| Concern | Choice |
|---|---|
| Runtime | Node.js (no version pin in atrri; we'll pin 20 LTS via `.nvmrc`) |
| Language | **TypeScript** strict, `target: es6`, `module: commonjs` |
| Framework | **Express 4.21.x** |
| ODM | **Mongoose 8.x** + MongoDB driver 6.x |
| Auth | **jsonwebtoken** — single token, Bearer header, 168h TTL |
| File upload | **multer** + **multer-storage-cloudinary** + **cloudinary** |
| Slugs | **slugify** |
| Env | **dotenv** (single `dotenv.config()` calls; multi-path loader inside `db.ts` to handle PM2 cwd) |
| HTTP body | `body-parser` + `express.json({ limit: '50mb', verify })` (raw body captured for webhooks) |
| CORS | **manual middleware** (not the `cors` package's API), with allowlist + RegExp pattern |
| Dev | **nodemon** + **ts-node** |
| Build | **tsc** → `dist/` |
| Deploy | **Vercel** (with `vercel.json`) — same as reference |

**Things we deliberately don't add** (because the reference doesn't):
- No Zod / Joi / class-validator. Controllers do their own checks.
- No Pino/Winston. `console.log` / `console.error`.
- No `helmet`, no `express-rate-limit`, no `mongo-sanitize`. Same posture as reference (we can add later but the plan stays aligned).
- No service-layer for CRUD. Controllers talk to models directly. `services/` is reserved for **external integrations** (Cloudinary, Email/SMS, payment gateway later) and **shared helpers** (OTP/token store, email templates, ticket-id minting).
- No `app.ts` / `server.ts` split. Bootstrap and listen happen in **`src/index.ts`**.
- No refresh tokens. One JWT, 168h. Re-login when expired.

---

## 2. Folder structure (mirrors reference exactly)

```
crypto_mining_backend/
├── dist/                              # tsc output (gitignored)
├── docs/                              # optional, like reference
├── node_modules/
├── src/
│   ├── config/
│   │   ├── cloudinary.ts              # cloudinary.v2.config({...})
│   │   └── env.ts                     # tiny static `env` object
│   ├── controllers/                   # ONE FILE per resource — <resource>Controller.ts
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── productController.ts
│   │   ├── planController.ts
│   │   ├── siteSettingsController.ts
│   │   ├── homeController.ts          # single endpoint returning all home page sections
│   │   ├── profitabilityController.ts
│   │   ├── contactPageController.ts
│   │   ├── serviceRequestPageController.ts
│   │   ├── shopPageController.ts
│   │   ├── trackTicketPageController.ts
│   │   ├── navController.ts
│   │   ├── leadController.ts
│   │   ├── ticketController.ts
│   │   ├── mediaController.ts
│   │   └── auditController.ts
│   ├── db/
│   │   └── db.ts                      # default-exported async connectDB
│   ├── middlewares/                   # plural, like reference
│   │   ├── auth.ts                    # verifyToken (named export)
│   │   ├── requireAdmin.ts            # role gate (named export)
│   │   └── uploads.ts                 # default-exported multer + cloudinary storage
│   ├── models/                        # <resource>.model.ts naming
│   │   ├── user.model.ts
│   │   ├── product.model.ts
│   │   ├── plan.model.ts
│   │   ├── siteSettings.model.ts
│   │   ├── homePage.model.ts
│   │   ├── profitabilityPage.model.ts
│   │   ├── contactPage.model.ts
│   │   ├── serviceRequestPage.model.ts
│   │   ├── shopPage.model.ts
│   │   ├── trackTicketPage.model.ts
│   │   ├── navLink.model.ts
│   │   ├── lead.model.ts
│   │   ├── ticket.model.ts
│   │   ├── counter.model.ts           # atomic counter for ticketId sequence
│   │   ├── media.model.ts
│   │   └── auditLog.model.ts
│   ├── routes/
│   │   └── routes.ts                  # SINGLE FILE — every endpoint mounted here
│   ├── scripts/                       # one-off CLI scripts (run via ts-node)
│   │   ├── seedAll.ts                 # seeds default content from frontend defaults
│   │   ├── seedSuperAdmin.ts
│   │   └── migrateXyz.ts              # future migrations
│   ├── services/                      # external integrations / shared helpers ONLY
│   │   ├── cloudinaryService.ts       # lift verbatim from reference
│   │   ├── mailService.ts             # Nodemailer (lead/ticket notifications)
│   │   ├── ticketIdService.ts         # mints CMM-YYYY-NNNN via Counter model
│   │   └── tokenStore.ts              # password-reset token store (in-memory or redis later)
│   ├── types/
│   │   └── express.d.ts               # augments Express.Request with userId / user
│   ├── public/                        # optional static assets
│   ├── index.ts                       # bootstrap (CORS, JSON, routes, listen) — NO app.ts/server.ts
│   └── vercel.d.ts                    # Vercel-specific declarations
├── .env
├── .env.example
├── .gitignore
├── .nvmrc
├── package.json
├── package-lock.json
├── tsconfig.json
└── vercel.json
```

> **Rule:** if you find yourself wanting to add a folder that isn't in this tree (e.g. `validators/`, `utils/`, `dtos/`), don't. Match the reference. Inline the helper into the file that uses it, or put it in `services/` if it's reusable.

---

## 3. File-naming conventions (lifted from reference)

| Concern | Pattern | Example |
|---|---|---|
| Controllers | `<resource>Controller.ts` (camelCase + `Controller`, **not** `.controller.ts`) | `productController.ts`, `homeController.ts` |
| Models | `<resource>.model.ts` (camelCase + `.model.ts`) | `product.model.ts`, `siteSettings.model.ts` |
| Middlewares folder | `middlewares/` (plural) | |
| Routes file | `src/routes/routes.ts` | exactly that name |
| Services | `<name>Service.ts` (most), or `<name>.service.ts` (some) — both acceptable, prefer `Service.ts` for new | `cloudinaryService.ts`, `mailService.ts` |
| DB | `db/db.ts` | |
| Types | `types/express.d.ts` | |
| Bootstrap | `src/index.ts` | |
| Scripts | `scripts/<verb><Thing>.ts` | `scripts/seedAll.ts`, `scripts/migrateSkus.ts` |

**Exports:**
- Controllers: each handler is a **named** `export const`.
- Models: schema declared inside file, then `const X = mongoose.model('X', schema); export default X;`
- Middlewares: named export (e.g. `export const verifyToken = ...`).
- Multer/uploads helper: **default export**.
- DB: **default export** of the `connectDB` function.

---

## 4. `src/index.ts` — bootstrap (lifted pattern from reference)

Replicates the reference structure verbatim, just with our domain origins.

```ts
'use strict';
import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import db from './db/db';
import router from './routes/routes';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins: (string | RegExp)[] = [
  'http://localhost:3000',
  'http://localhost:3001',           // crypto_mining_frontend dev
  'http://localhost:3002',           // crypto_mining_admin dev
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
    // Preserve raw body for webhook signature verification (future Razorpay / Stripe)
    if (req.originalUrl?.includes('/webhook')) req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const staticPath = path.join(__dirname, 'public');
if (fs.existsSync(staticPath)) app.use(express.static(staticPath));

// API routes
app.use('/api', router);

app.get('/', (_req: Request, res: Response) => {
  res.send('Crypto Mining Miles API');
});

async function start(): Promise<void> {
  await db();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
```

---

## 5. `src/db/db.ts` — Mongo connection (lifted verbatim from reference)

Use the reference's exact loader (handles `MONGODB_URI`, `DATABASE_URL`, `MONGODB_CONNECTION_STRING`, or constructed URI from `MONGODB_USER` + `MONGODB_PASSWORD` + `MONGODB_CLUSTER_HOST`, plus PM2 cwd quirks). Default-exported `connectDB` async function. No changes — copy file as-is.

---

## 6. `src/config/`

### 6.1 `config/cloudinary.ts` — lift verbatim

```ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

### 6.2 `config/env.ts` — tiny static reader

Mirrors reference's pattern (`env.ts` in reference holds Razorpay vars only). Add domain-specific constants here:

```ts
export const env = {
  SECRET_KEY: process.env.SECRET_KEY || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '168h',
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || '',
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || '',
  LEADS_NOTIFY_TO: process.env.LEADS_NOTIFY_TO || '',
  TICKETS_NOTIFY_TO: process.env.TICKETS_NOTIFY_TO || '',
  MAIL_FROM: process.env.MAIL_FROM || 'noreply@cryptominingmiles.in',
};
```

---

## 7. `src/middlewares/`

### 7.1 `middlewares/auth.ts` — `verifyToken`

Same shape as reference. Bearer support, `process.env.SECRET_KEY`, attaches `req.userId`. (Reference uses `decoded.userId || decoded.id || decoded._id`; keep that fallback.)

```ts
import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  userId?: string | number;
}

export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) { res.status(403).json({ message: 'Token is not provided' }); return; }

    let token = authHeader;
    if (authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.SECRET_KEY as Secret, (err: any, decoded: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') res.status(401).json({ message: 'Token expired' });
        else if (err.name === 'JsonWebTokenError') res.status(401).json({ message: 'Invalid token signature' });
        else res.status(401).json({ message: 'Invalid token' });
        return;
      }
      req.userId = decoded.userId || decoded.id || decoded._id;
      next();
    });
  } catch (error) {
    console.error('Auth middleware unexpected error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};
```

### 7.2 `middlewares/requireAdmin.ts` — role gate (small extension)

Reference doesn't have one (atrri is consumer-app), but our admin panel needs it. Keep it tiny and aligned with the reference's style:

```ts
import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';

export const requireAdmin = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.userId) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const user = await User.findById(req.userId).select('role isActive');
    if (!user || !user.isActive) { res.status(401).json({ message: 'User not found or inactive' }); return; }
    if (!['super-admin', 'editor', 'support'].includes(user.role)) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }
    req.user = { _id: String(user._id), role: user.role };
    next();
  } catch (error) {
    console.error('requireAdmin error:', error);
    res.status(500).json({ message: 'Authorization error' });
  }
};

// Optional: requireRole(...allowed)
export const requireRole = (...allowed: string[]) => async (req: any, res: Response, next: NextFunction) => {
  if (!req.user || !allowed.includes(req.user.role)) {
    res.status(403).json({ message: 'Insufficient permissions' });
    return;
  }
  next();
};
```

### 7.3 `middlewares/uploads.ts` — multer + Cloudinary (lift verbatim)

Same default-exported `upload` (Cloudinary storage, JPEG/PNG only, with `fileFilter`). Use it directly for simple single-image routes; for multi-field routes, controllers create their own inline `multer({ storage: multer.memoryStorage() })` and push buffers via `cloudinaryService.uploadCloudinary` — exactly like the reference does in `productController` / `categoryController`.

---

## 8. `src/types/express.d.ts`

Augments `Request` with both `userId` (set by `verifyToken`, matching reference) and `user` (set by `requireAdmin`, useful for role checks).

```ts
declare global {
  namespace Express {
    interface Request {
      userId?: string | number;
      user?: { _id: string; role: 'super-admin' | 'editor' | 'support' };
      rawBody?: Buffer;
    }
  }
}
export {};
```

---

## 9. `src/models/` — every collection, every field

> **Naming:** `<resource>.model.ts`. Schema declared inline, `mongoose.model('<Resource>', schema)`, `export default <Resource>`. Always `{ timestamps: true }`. Use `Document` interfaces only when typed methods/virtuals are needed (reference is inconsistent — match its mood: skip the interface unless useful).

### 9.1 `user.model.ts`

Admin users (editors / support / super-admin). Public site has no end-user accounts in v1.

```ts
{
  email: String, lowercase: true, unique: true, required: true
  passwordHash: String, required: true, select: false
  name: String, required: true
  role: { type: String, enum: ['super-admin','editor','support'], default: 'editor' }
  avatar: String
  isActive: { type: Boolean, default: true }
  lastLoginAt: Date
  // timestamps: true
}
```

### 9.2 `product.model.ts`

Mirrors `crypto_mining_frontend/lib/products.ts` 1:1. Slug pre-save via `slugify` (same as reference). Sub-docs declared inline (gallery, faqs, ingredients, info — same pattern as reference's `product.model.ts`).

```ts
{
  slug: { type: String, unique: true }                 // pre-save from name
  name: String, required: true
  shortName: String                                    // "S19"
  subName: String                                      // "XP"
  algo: String, required: true                         // 'SHA-256' | 'ETHASH' | ...
  tag: String                                          // "BESTSELLER", "POPULAR", ...
  stock: { type: String, enum: ['In Stock','Coming Soon'], default: 'In Stock' }
  available: { type: Boolean, default: true }
  edition: String
  sku: { type: String, unique: true }                  // pre-save auto-gen if missing (reference pattern)
  tagline: String
  // top-card stats
  hashrate: String                                     // "140 TH/s"
  hashrateNum: String
  hashrateUnit: String
  power: String
  powerNum: String
  efficiency: String
  efficiencyNum: String
  noise: String
  noiseNum: String
  contract: String
  // pricing — INR rupees (whole number, like reference uses Number for price)
  price: { type: Number, required: true }
  priceDisplay: String                                 // "₹3,20,000" (server-formatted)
  silencerPrice: { type: Number, default: 0 }
  // editorial
  specs: {
    performance: [[String]]                            // array of [k, v] tuples
    power:       [[String]]
    physical:    [[String]]
    connectivity:[[String]]
  }
  boxItems: [{ icon: String, label: String, sub: String }]
  electricalReqs: [[String]]
  // media
  images: [String]                                     // hero gallery (array of urls — reference style)
  gallery: [{ image: String, title: String, description: String }]
  // related
  relatedSlugs: [String]
  // SEO
  seo: { title: String, description: String, ogImage: String }
  // ordering & publishing
  sortOrder: { type: Number, default: 0 }
  status: { type: String, enum: ['active','inactive'], default: 'active' }   // reference convention
}
```

`pre('save')` hook generates slug from name and SKU from category/slug/_id (mirrors reference exactly).

### 9.3 `plan.model.ts`

Pebble / Boulder / Mountain (homepage Plans cards).

```ts
{
  slug: { type: String, unique: true }
  tag: String                                          // "STARTER" | "POPULAR" | "INSTITUTIONAL"
  name: String                                         // "Pebble"
  price: { type: Number, required: true }              // numeric value
  currency: { type: String, enum: ['USD','INR'], default: 'USD' }
  hashrate: String                                     // "5 TH/s"
  duration: String                                     // "12 months"
  durationMonths: Number
  featured: { type: Boolean, default: false }
  features: [String]
  ctaLabel: { type: String, default: 'Start Mining →' }
  ctaHref: { type: String, default: '#plans' }
  sortOrder: { type: Number, default: 0 }
  status: { type: String, enum: ['active','inactive'], default: 'active' }
}
```

### 9.4 `siteSettings.model.ts`

**Singleton** — convention: `_id: 'site'` (string), only ever one doc. Controllers use `findOneAndUpdate({ _id: 'site' }, body, { new: true, upsert: true })`.

```ts
{
  _id: { type: String, default: 'site' }
  brand: { name, tagline, estYear, logo, favicon }
  contact: { salesPhone, salesEmail, supportEmail, institutionalEmail, workingHours }
  facility: {
    address, cityLabel, mapEmbedUrl, tourPolicy,
    coordinates: { lat, lng, display }
  }
  legal: { gstNumber, cinNumber, privacyPolicyUrl, termsUrl }
  social: { twitter, linkedin, youtube, instagram, telegram }
  footer: { copyrightText, coordinatesLine }
  liveCounters: { minersOnline, networkHashratePHs, paidOutUSDM, uptimePct, daysMining }
  seo: { defaultTitle, defaultDescription, defaultOgImage, twitterHandle }
}
```

### 9.5 `homePage.model.ts`

**Singleton** — `_id: 'home'`. Embeds every section of `app/page.tsx` (Hero, StatsMarquee, StatsGrid, WhyUs, HowItWorks, FAQs, FooterCTA). One save = whole homepage updates atomically.

```ts
{
  _id: { type: String, default: 'home' }
  hero: {
    sectionTag: String
    cornerLabelLeft: String
    cornerLabelRight: String
    headlineLine1: String
    headlineLine2Prefix: String
    headlineItalic: String
    headlineLine2Suffix: String
    subtitleLines: [String]
    primaryCta: { label: String, href: String }
    ghostCta:   { label: String, href: String }
    liveBadgeText: String
    trustStrip: [{ value: String, label: String }]
  }
  statsMarquee: {
    items: [{ label: String, value: String }]
  }
  statsGrid: {
    sectionTag: String
    headlineLine1: String
    headlineLine2: String
    items: [{
      label: String, detail: String,
      value: Number, decimals: Number,
      prefix: String, suffix: String
    }]
  }
  whyUs: {
    sectionTag: String
    headlineLine1: String
    headlineItalic: String
    features: [{ num: String, title: String, body: String }]
  }
  howItWorks: {
    sectionTag: String
    headlinePrefix: String
    headlineItalic: String
    steps: [{ num: String, title: String, body: String }]
  }
  faqs: {
    sectionTag: String
    headlineLine1: String
    headlineLine2: String
    items: [{ q: String, a: String }]
  }
  footerCta: {
    sectionTag: String
    headlinePrefix: String
    headlineItalic: String
    cta: { label: String, href: String }
    quickLinks: [{ label: String, href: String }]
  }
  status: { type: String, enum: ['active','inactive'], default: 'active' }
}
```

### 9.6 `profitabilityPage.model.ts` (singleton, `_id: 'profitability'`)

```ts
{
  hero: { tagNum, tagLabel, headline, italicWord, mono }
  miners: [{ name: String, hashrate: Number, power: Number, algo: String }]
  network: {
    BTC: { difficulty: Number, blockReward: Number, blockTime: Number, symbol: String, priceINR: Number }
    ETH: { ... }
    LTC: { ... }
    KAS: { ... }
  }
  defaults: { selectedMinerIndex: Number, electricityRate: Number, months: Number }
  faqs: [{ q: String, a: String }]
}
```

### 9.7 `contactPage.model.ts` (singleton, `_id: 'contact'`)

```ts
{
  hero: { tagNum, tagLabel, headline, italicWord, mono }
  methods: [{ icon, method, primary, secondary, href, cta, accent: Boolean, sortOrder: Number }]
  facility: {
    sectionTag, cityHeadline, italicWord,
    details: [{ label: String, value: String }],
    mapCta: { label: String, href: String }
  }
  enquirySubjects: [String]
  formSuccess: { title: String, body: String }
  numbersSection: {
    sectionTag, headlinePrefix, headlineItalic, description,
    stats: [{ idx, value: Number, suffix, prefix, label, hint, decimals: Number }],
    tickerLine: String
  }
}
```

### 9.8 `serviceRequestPage.model.ts` (singleton, `_id: 'service-request'`)

```ts
{
  hero: { tagNum, tagLabel, headline, italicWord, mono }
  whyCard: {
    sectionTag, headlinePrefix, headlineItalic,
    features: [{ icon, title, desc }],
    directContact: { phone: String, email: String }
  }
  issueTypes: [String]
  priorityLevels: [String]
  formSuccess: { title: String, body: String }
}
```

### 9.9 `shopPage.model.ts` (singleton, `_id: 'shop'`)

```ts
{
  hero: { tagNum, tagLabel, headline, italicWord, mono }
  filterAlgos: [String]
  gstNote: String
  trustStrip: [{ icon: String, label: String, desc: String }]
}
```

### 9.10 `trackTicketPage.model.ts` (singleton, `_id: 'track-ticket'`)

```ts
{
  hero: { tagNum, tagLabel, headline, italicWord, mono }
  searchPlaceholder: String
  notFoundMessage: String
  emptyHint: String
  escalationCopy: String
}
```

### 9.11 `navLink.model.ts`

```ts
{
  label: String, required: true
  href: String, required: true
  external: { type: Boolean, default: false }
  group: { type: String, enum: ['navbar','footer-quick-links'], default: 'navbar' }
  showOnHomeAnchor: { type: Boolean, default: false }
  sortOrder: { type: Number, default: 0 }
  status: { type: String, enum: ['active','inactive'], default: 'active' }
}
```

### 9.12 `lead.model.ts`

```ts
{
  name: String, required: true
  email: String, required: true
  phone: String
  subject: String, required: true
  message: String, required: true
  source: { type: String, default: 'contact-form' }
  ipAddress: String
  userAgent: String
  status: { type: String, enum: ['new','in-progress','replied','spam','closed'], default: 'new' }
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' }
  notes: [{
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    body: String,
    at: { type: Date, default: Date.now }
  }]
}
```

### 9.13 `ticket.model.ts`

```ts
{
  ticketId: { type: String, unique: true }              // CMM-2026-0042 (set by ticketIdService)
  contractId: String
  customer: { name: String, email: String, phone: String }
  issueType: String, required: true
  priority: { type: String, enum: ['Low','Medium','High','Critical'], default: 'Medium' }
  description: String, required: true
  attachments: [{ url: String, name: String, size: Number, type: String }]
  status: { type: String, enum: ['open','in-progress','awaiting-customer','resolved','closed'], default: 'open' }
  eta: Date
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' }
  steps: [{
    label: String,
    desc: String,
    time: String,                    // "09:14" display
    occurredAt: Date,                // sortable timestamp
    done: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }]
}
```

### 9.14 `counter.model.ts`

```ts
{
  _id: String,                       // e.g. "ticket-2026"
  seq: { type: Number, default: 0 }
}
```

Used by `ticketIdService` via `findOneAndUpdate({ _id }, { $inc: { seq: 1 } }, { upsert: true, new: true })`.

### 9.15 `media.model.ts`

```ts
{
  url: String, required: true
  publicId: String                   // Cloudinary id, used to delete
  filename: String
  mimeType: String
  size: Number
  width: Number
  height: Number
  alt: String
  folder: { type: String, enum: ['products','logos','pages','misc'], default: 'misc' }
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}
```

### 9.16 `auditLog.model.ts`

```ts
{
  actor: { type: Schema.Types.ObjectId, ref: 'User' }
  actorEmail: String
  action: { type: String, enum: ['create','update','delete','login','logout'] }
  entity: String                     // 'Product' | 'HomePage' | ...
  entityId: String
  before: Schema.Types.Mixed
  after: Schema.Types.Mixed
  ip: String
  userAgent: String
}
```

---

## 10. `src/controllers/` — function shapes & error pattern

**Every handler is a named export const with the exact reference shape:**

```ts
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. read body / params / files
    // 2. minimal validation (manual checks, mirroring reference)
    // 3. mongoose calls directly (no service layer)
    // 4. respond { success: true, ...payload }
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
```

**Response convention** (matching reference, which is inconsistent — we'll standardize to `{ success, ... }`):
- 2xx: `{ success: true, message?: string, ...payload }`
- 4xx/5xx: `{ success: false, message: string, error?: string }`
- 401/403 from auth middleware: `{ message: '...' }` (matches reference's verbatim shape — keep parity).

**Controllers per file (full list):**

### 10.1 `authController.ts`

```ts
export const adminLogin                  // POST /admin/login   { email, password } → { user, token }
export const adminMe                     // GET  /admin/me      (verifyToken)
export const adminChangePassword         // POST /admin/change-password
export const adminForgotPassword         // POST /admin/forgot-password (token store + email)
export const adminResetPassword          // POST /admin/reset-password
```

### 10.2 `userController.ts` (admin user CRUD; super-admin only via `requireRole`)

```ts
export const createAdminUser
export const getAdminUsers
export const getAdminUserById
export const updateAdminUser
export const deactivateAdminUser
export const resendInvite
```

### 10.3 `productController.ts`

Mirrors reference's productController structure exactly:
```ts
export const createProduct       // multer fields: images, gallery
export const getAllProducts      // ?algo=... ?status=...
export const getProductBySlug
export const updateProduct
export const deleteProduct       // POST with id in body, like reference
export const reorderProducts     // POST { ids: string[] }
export const searchProducts
```

### 10.4 `planController.ts`

```ts
export const createPlan
export const getAllPlans
export const getPlanBySlug
export const updatePlan
export const deletePlan
export const reorderPlans
```

### 10.5 `siteSettingsController.ts`

```ts
export const getSiteSettings     // public — GET /site-settings
export const updateSiteSettings  // admin  — PUT /admin/update-site-settings
```

### 10.6 `homeController.ts`

> Mirrors the reference's `getHomedata` exactly — single endpoint that aggregates all homepage content in one round trip.

```ts
export const getHomePageData     // public — GET /home-pagedata
                                 // returns { homePage, plans, products[3 featured], siteSettings }
export const updateHomePage      // admin  — PUT /admin/update-home-page  (full doc patch)
```

### 10.7 `profitabilityController.ts`

```ts
export const getProfitabilityPage   // public
export const updateProfitabilityPage // admin
```

### 10.8 `contactPageController.ts`, `serviceRequestPageController.ts`, `shopPageController.ts`, `trackTicketPageController.ts`

Each: `getXPage` (public) + `updateXPage` (admin).

### 10.9 `navController.ts`

```ts
export const createNavLink
export const getNavLinks         // public  — ?group=navbar|footer-quick-links
export const updateNavLink
export const deleteNavLink
export const reorderNavLinks
```

### 10.10 `leadController.ts`

```ts
export const createLead          // public POST — anti-spam basic checks (honeypot, length, email regex)
export const getLeads            // admin
export const getLeadById         // admin
export const updateLead          // admin (status, assignedTo)
export const addLeadNote         // admin
export const deleteLead          // admin (super-admin only)
```

### 10.11 `ticketController.ts`

```ts
export const createTicket        // public POST — uses ticketIdService.mintId() → CMM-YYYY-NNNN
                                 // sends confirmation email to customer
                                 // sends notification email to TICKETS_NOTIFY_TO
export const getTicketById       // public lookup by ticketId (CMM-...) — strips internal fields
export const getTickets          // admin list
export const getTicketByIdAdmin  // admin full record
export const updateTicket        // admin (status, eta, assignedTo, priority)
export const addTicketStep       // admin
export const updateTicketStep    // admin
export const deleteTicketStep    // admin
```

### 10.12 `mediaController.ts`

```ts
export const uploadMedia         // multer + cloudinary — returns Media doc
export const getMedia            // ?folder=...
export const deleteMedia         // also deletes from Cloudinary by publicId
```

### 10.13 `auditController.ts`

```ts
export const getAuditLogs        // super-admin only, filterable
```

> **Audit logging integration:** mutation handlers (`update*`, `create*`, `delete*`) write a Mongo doc to `AuditLog` after the main op succeeds. No middleware abstraction (matches reference's "no shortcuts" style) — just two extra lines at the end of each admin handler.

---

## 11. `src/routes/routes.ts` — single routes file

> **Following the reference's exact pattern**: one `routes.ts` file, all imports at the top, all `router.METHOD(...)` calls together. Group by feature with comment headers (`// product`, `// home`, `// admin auth`, etc.).
>
> Endpoint naming follows the reference's verb-prefix convention:
> - `GET  /get-X`, `GET /get-X/:id`, `GET /get-X/:slug`
> - `POST /create-X`
> - `PUT  /update-X/:id`, `PUT /edit-X/:id`
> - `POST /delete-X` (with `id` in body, same as reference)
>
> All endpoints are mounted under `/api` by `index.ts`, so the full URL is `https://api.../api/get-products`.

### 11.1 Full route list

```ts
import express, { RequestHandler } from 'express';
import multer from 'multer';
import upload from '../middlewares/uploads';
import { verifyToken } from '../middlewares/auth';
import { requireAdmin, requireRole } from '../middlewares/requireAdmin';

import { adminLogin, adminMe, adminChangePassword, adminForgotPassword, adminResetPassword } from '../controllers/authController';
import { createAdminUser, getAdminUsers, getAdminUserById, updateAdminUser, deactivateAdminUser, resendInvite } from '../controllers/userController';
import { getHomePageData, updateHomePage } from '../controllers/homeController';
import { getSiteSettings, updateSiteSettings } from '../controllers/siteSettingsController';
import { createProduct, getAllProducts, getProductBySlug, updateProduct, deleteProduct, reorderProducts, searchProducts } from '../controllers/productController';
import { createPlan, getAllPlans, getPlanBySlug, updatePlan, deletePlan, reorderPlans } from '../controllers/planController';
import { getProfitabilityPage, updateProfitabilityPage } from '../controllers/profitabilityController';
import { getContactPage, updateContactPage } from '../controllers/contactPageController';
import { getServiceRequestPage, updateServiceRequestPage } from '../controllers/serviceRequestPageController';
import { getShopPage, updateShopPage } from '../controllers/shopPageController';
import { getTrackTicketPage, updateTrackTicketPage } from '../controllers/trackTicketPageController';
import { createNavLink, getNavLinks, updateNavLink, deleteNavLink, reorderNavLinks } from '../controllers/navController';
import { createLead, getLeads, getLeadById, updateLead, addLeadNote, deleteLead } from '../controllers/leadController';
import { createTicket, getTicketById, getTickets, getTicketByIdAdmin, updateTicket, addTicketStep, updateTicketStep, deleteTicketStep } from '../controllers/ticketController';
import { uploadMedia, getMedia, deleteMedia } from '../controllers/mediaController';
import { getAuditLogs } from '../controllers/auditController';

const router = express.Router();

/* ─────────── HOME (aggregated) ─────────── */
router.get('/home-pagedata', getHomePageData);

/* ─────────── SITE SETTINGS ─────────── */
router.get('/site-settings', getSiteSettings);

/* ─────────── PAGES (public) ─────────── */
router.get('/page/profitability',    getProfitabilityPage);
router.get('/page/contact',          getContactPage);
router.get('/page/service-request',  getServiceRequestPage);
router.get('/page/shop',             getShopPage);
router.get('/page/track-ticket',     getTrackTicketPage);

/* ─────────── PRODUCTS ─────────── */
const productMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
  .fields([{ name: 'images', maxCount: 10 }, { name: 'gallery', maxCount: 10 }]);

router.post('/create-product',  verifyToken, requireAdmin, productMemory, createProduct);
router.get('/get-products',     getAllProducts);
router.get('/get-product/:slug', getProductBySlug);
router.put('/edit-product/:id', verifyToken, requireAdmin, productMemory, updateProduct);
router.post('/delete-product',  verifyToken, requireAdmin, deleteProduct);
router.post('/reorder-products', verifyToken, requireAdmin, reorderProducts);
router.post('/search-products',  searchProducts as RequestHandler);

/* ─────────── PLANS ─────────── */
router.post('/create-plan',  verifyToken, requireAdmin, createPlan);
router.get('/get-plans',     getAllPlans);
router.get('/get-plan/:slug', getPlanBySlug);
router.put('/update-plan/:id', verifyToken, requireAdmin, updatePlan);
router.post('/delete-plan',  verifyToken, requireAdmin, deletePlan);
router.post('/reorder-plans', verifyToken, requireAdmin, reorderPlans);

/* ─────────── NAV ─────────── */
router.get('/get-nav',       getNavLinks);
router.post('/create-nav',   verifyToken, requireAdmin, createNavLink);
router.put('/update-nav/:id', verifyToken, requireAdmin, updateNavLink);
router.post('/delete-nav',   verifyToken, requireAdmin, deleteNavLink);
router.post('/reorder-nav',  verifyToken, requireAdmin, reorderNavLinks);

/* ─────────── LEADS ─────────── */
router.post('/create-lead',  createLead);   // public (rate-limited later if needed)
router.get('/admin/get-leads', verifyToken, requireAdmin, getLeads);
router.get('/admin/get-lead/:id', verifyToken, requireAdmin, getLeadById);
router.put('/admin/update-lead/:id', verifyToken, requireAdmin, updateLead);
router.post('/admin/lead-note', verifyToken, requireAdmin, addLeadNote);
router.post('/admin/delete-lead', verifyToken, requireRole('super-admin'), deleteLead);

/* ─────────── TICKETS ─────────── */
router.post('/create-ticket', createTicket);                         // public
router.get('/get-ticket/:ticketId', getTicketById);                  // public (CMM-XXXX-XXXX)
router.get('/admin/get-tickets', verifyToken, requireAdmin, getTickets);
router.get('/admin/get-ticket/:id', verifyToken, requireAdmin, getTicketByIdAdmin);
router.put('/admin/update-ticket/:id', verifyToken, requireAdmin, updateTicket);
router.post('/admin/ticket-step/add', verifyToken, requireAdmin, addTicketStep);
router.post('/admin/ticket-step/update', verifyToken, requireAdmin, updateTicketStep);
router.post('/admin/ticket-step/delete', verifyToken, requireAdmin, deleteTicketStep);

/* ─────────── MEDIA ─────────── */
router.post('/admin/upload-media',
  verifyToken, requireAdmin,
  upload.single('file'),
  uploadMedia);
router.get('/admin/get-media',  verifyToken, requireAdmin, getMedia);
router.post('/admin/delete-media', verifyToken, requireAdmin, deleteMedia);

/* ─────────── ADMIN — page editors (singletons) ─────────── */
router.put('/admin/update-home-page',         verifyToken, requireAdmin, updateHomePage);
router.put('/admin/update-site-settings',     verifyToken, requireAdmin, updateSiteSettings);
router.put('/admin/update-page/profitability',verifyToken, requireAdmin, updateProfitabilityPage);
router.put('/admin/update-page/contact',      verifyToken, requireAdmin, updateContactPage);
router.put('/admin/update-page/service-request', verifyToken, requireAdmin, updateServiceRequestPage);
router.put('/admin/update-page/shop',         verifyToken, requireAdmin, updateShopPage);
router.put('/admin/update-page/track-ticket', verifyToken, requireAdmin, updateTrackTicketPage);

/* ─────────── ADMIN AUTH ─────────── */
router.post('/admin/login',            adminLogin);
router.get('/admin/me',                verifyToken, adminMe);
router.post('/admin/change-password',  verifyToken, adminChangePassword);
router.post('/admin/forgot-password',  adminForgotPassword);
router.post('/admin/reset-password',   adminResetPassword);

/* ─────────── ADMIN — users (super-admin only) ─────────── */
router.post('/admin/create-user',  verifyToken, requireRole('super-admin'), createAdminUser);
router.get('/admin/get-users',     verifyToken, requireRole('super-admin'), getAdminUsers);
router.get('/admin/get-user/:id',  verifyToken, requireRole('super-admin'), getAdminUserById);
router.put('/admin/update-user/:id', verifyToken, requireRole('super-admin'), updateAdminUser);
router.post('/admin/deactivate-user', verifyToken, requireRole('super-admin'), deactivateAdminUser);
router.post('/admin/resend-invite', verifyToken, requireRole('super-admin'), resendInvite);

/* ─────────── ADMIN — audit log ─────────── */
router.get('/admin/audit-log', verifyToken, requireRole('super-admin'), getAuditLogs);

export default router;
```

> **Why one file:** the reference does it. Searchability (`grep '/get-products' src/routes/routes.ts`) trumps splitting for a project this size.

---

## 12. `src/services/`

### 12.1 `cloudinaryService.ts` — lift verbatim

`uploadToCloudinary(filePath)` and `uploadCloudinary(file, folder)` — the reference's two helpers, used from controllers that take `multer.memoryStorage()` buffers.

### 12.2 `mailService.ts` — Nodemailer wrapper

Two named exports:

```ts
export const sendLeadNotification(lead)   // → LEADS_NOTIFY_TO
export const sendTicketConfirmation(ticket) // → customer + TICKETS_NOTIFY_TO
export const sendTicketStatusUpdate(ticket) // → customer
export const sendAdminInvite(user, tempPassword) // → user.email
export const sendPasswordReset(user, resetLink)  // → user.email
```

SMTP config from env. Plain HTML templates inline (or `mailService/templates/*.ts` if it grows).

### 12.3 `ticketIdService.ts`

```ts
export const mintTicketId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { _id: `ticket-${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `CMM-${year}-${String(counter.seq).padStart(4, '0')}`;
};
```

### 12.4 `tokenStore.ts`

In-memory password-reset token store (mirroring reference's `otpStore.ts`):

```ts
interface ResetEntry { tokenHash: string; userId: string; expiresAt: number }
const store: Record<string, ResetEntry> = {};
export const issueResetToken = async (userId: string) => { ... }
export const consumeResetToken = async (token: string): Promise<string | null> => { ... }
```

Swap to Redis later if multi-instance deploy needed.

---

## 13. `src/scripts/`

### 13.1 `seedAll.ts`

Run via `npx ts-node src/scripts/seedAll.ts` (mirrors reference's script style — explicit `mongoose.connect(process.env.MONGODB_URI!)` at top, work, `process.exit(0)` at bottom).

Idempotent upserts for:
1. `User` super-admin from `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD`.
2. `SiteSettings` with values currently hardcoded in `Hero.tsx`, `FooterCTA.tsx`, `Navbar.tsx`.
3. `HomePage` with **every section's exact current copy** as default.
4. `ProfitabilityPage`, `ContactPage`, `ServiceRequestPage`, `ShopPage`, `TrackTicketPage`.
5. All 6 `Product` docs from `lib/products.ts`.
6. 3 `Plan` docs (Pebble, Boulder, Mountain).
7. `NavLink` rows for navbar + footer-quick-links groups.
8. Two demo `Ticket` docs (`CMM-2024-0042`, `CMM-2024-0088`) for the Track Ticket page demo.

### 13.2 `seedSuperAdmin.ts`

Stand-alone variant for the very first deploy if `seedAll` is too eager.

### 13.3 Future migrations

Same shape as reference's `migrateSkus.ts` and `recoverCapturedPendingOrders.ts` — single async function, `mongoose.connect`, do work, `process.exit(0)`.

---

## 14. Auth model (locked to reference)

- **Single JWT**, signed with `process.env.SECRET_KEY`, `expiresIn: '168h'` (7 days). No refresh tokens.
- **Bearer header**: `Authorization: Bearer <token>`. The middleware also accepts the bare token (reference quirk — keep it).
- **Login**: `POST /api/admin/login` with `{ email, password }`. Body: bcrypt-compare against `passwordHash`. Sign JWT with `{ userId: user._id }` (NB: reference uses `userId`, so the verifier reads `decoded.userId`). Return `{ user, token }`. Frontend admin stores token in localStorage and sends it on every request.
- **No cookies**: matches reference. The admin SPA holds the token client-side. (If we later want HTTP-only cookies, we add it without breaking the existing pattern.)
- **`req.userId`** is the source of truth in protected handlers. `requireAdmin` then loads the User doc and sets `req.user = { _id, role }`.

> **Trade-off acknowledged:** localStorage tokens are XSS-prone. Acceptable for v1 because admin is a small, internal app; mitigate by keeping admin on its own subdomain and never embedding third-party scripts there. Cookie migration is a future patch.

---

## 15. Public vs Admin route surface

### 15.1 Public (no auth) — what the frontend calls

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/home-pagedata` | Aggregated home payload (homePage + plans + featured products + siteSettings) |
| GET | `/api/site-settings` | Site settings singleton |
| GET | `/api/page/profitability` \| `/contact` \| `/service-request` \| `/shop` \| `/track-ticket` | Page singletons |
| GET | `/api/get-products?algo=...` | Product list (active only) |
| GET | `/api/get-product/:slug` | Product detail |
| GET | `/api/get-plans` | Plans list |
| GET | `/api/get-plan/:slug` | Plan detail |
| GET | `/api/get-nav?group=...` | Nav links |
| POST | `/api/create-lead` | Contact form |
| POST | `/api/create-ticket` | Service request form |
| GET | `/api/get-ticket/:ticketId` | Public ticket lookup (CMM-XXXX-XXXX) |
| POST | `/api/search-products` | Search |

### 15.2 Admin (auth required, prefix `/admin/...`)

Pattern: `verifyToken` first, then `requireAdmin` (or `requireRole('super-admin')` for user/audit endpoints). All listed in the routes section above.

---

## 16. Default content seeders — what `seedAll` produces

**Goal:** the day after seeding, the live frontend looks identical to today (no regression). Every hardcoded string in `crypto_mining_frontend/components/*` and `app/*/page.tsx` becomes a default field value in MongoDB.

Mapping (frontend → seeder target):

| Frontend file | Seeder target |
|---|---|
| `components/Hero.tsx` | `HomePage.hero.*`, `SiteSettings.brand.*` (live-counters numbers move to `SiteSettings.liveCounters`) |
| `components/StatsMarquee.tsx` | `HomePage.statsMarquee.items[]` |
| `components/StatsGrid.tsx` | `HomePage.statsGrid.*` |
| `components/Plans.tsx` | three `Plan` docs |
| `components/WhyUs.tsx` | `HomePage.whyUs.*` |
| `components/HowItWorks.tsx` | `HomePage.howItWorks.*` |
| `components/FAQ.tsx` | `HomePage.faqs.items[]` |
| `components/FooterCTA.tsx` | `HomePage.footerCta.*`, `SiteSettings.footer.*` |
| `components/Navbar.tsx` | `NavLink[]` (navbar group), `SiteSettings.brand.*` |
| `lib/products.ts` | 6 `Product` docs |
| `app/profitability/page.tsx` | `ProfitabilityPage` (miners[], network params, faqs) |
| `app/contact/page.tsx` | `ContactPage` (methods[], facility, subjects, stats[], ticker line) |
| `app/service-request/page.tsx` | `ServiceRequestPage` (whyCard.features[], issueTypes, priorityLevels) |
| `app/shop/page.tsx` | `ShopPage` (filterAlgos, gstNote, trustStrip[]) |
| `app/track-ticket/page.tsx` | `TrackTicketPage` (copy strings); two demo `Ticket` docs |

---

## 17. `package.json` & `tsconfig.json` (lifted from reference)

### 17.1 `package.json`

```json
{
  "name": "crypto-mining-backend",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev":   "nodemon --exec ts-node ./src/index.ts",
    "seed":  "ts-node ./src/scripts/seedAll.ts"
  },
  "dependencies": {
    "@types/jsonwebtoken": "^9.0.8",
    "axios": "^1.8.2",
    "bcryptjs": "^2.4.3",
    "body-parser": "^1.20.2",
    "cloudinary": "^1.41.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "mongodb": "^6.12.0",
    "mongoose": "^8.9.5",
    "multer": "^1.4.5-lts.1",
    "multer-storage-cloudinary": "^4.0.0",
    "nodemailer": "^6.9.13",
    "slugify": "^1.6.6"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/dotenv": "^6.1.1",
    "@types/express": "^5.0.0",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.14.1",
    "@types/nodemailer": "^6.4.15",
    "nodemon": "^3.1.9",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.8.3"
  }
}
```

### 17.2 `tsconfig.json` — copy reference verbatim

```json
{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": "./src",
    "paths": { "*": ["*"] }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 17.3 `vercel.json` — same shape as reference

(Routes all requests to the Express handler, exposing `dist/index.js`.)

---

## 18. `.env.example`

```ini
# App
SECRET_KEY=your_jwt_secret_key
PORT=4000
FRONTEND_URL=http://localhost:3001
ADMIN_URL=http://localhost:3002

# MongoDB — same flexibility as reference
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/crypto_mining?retryWrites=true&w=majority
# Or:
# MONGODB_USER=
# MONGODB_PASSWORD=
# MONGODB_CLUSTER_HOST=
# MONGODB_DB_NAME=crypto_mining

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

# Mail (Nodemailer SMTP — Resend / Brevo / generic)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM="Crypto Mining Miles <noreply@cryptominingmiles.in>"
LEADS_NOTIFY_TO=hello@cryptominingmiles.in
TICKETS_NOTIFY_TO=support@cryptominingmiles.in

# Super-admin seeder
SUPER_ADMIN_EMAIL=admin@cryptominingmiles.in
SUPER_ADMIN_PASSWORD=ChangeMeOnFirstLogin#2026

# JWT
JWT_EXPIRES_IN=168h
```

---

## 19. Phase-by-phase build order

| Phase | Scope | Outcome |
|---|---|---|
| **0. Bootstrap** | Repo init, copy `tsconfig.json` + `package.json` + `vercel.json` shapes from reference, scaffold `src/index.ts`, `src/db/db.ts`, `src/config/{cloudinary,env}.ts`, `src/middlewares/{auth,uploads}.ts`, `src/types/express.d.ts`, empty `src/routes/routes.ts`. `npm run dev` boots. `GET /` returns "Crypto Mining Miles API". | Server boots, DB connects |
| **1. Admin auth** | `user.model.ts`, `authController.ts` (login, me, change-password), `requireAdmin.ts`, `seedSuperAdmin.ts`. Bearer JWT 168h. | Admin can `POST /api/admin/login` and `GET /api/admin/me` |
| **2. Site & Page singletons (read)** | `siteSettings.model.ts` + 6 page models, controllers' `getX` handlers, `seedAll.ts` upserting current frontend defaults. | Frontend can swap hardcoded data for `fetch('/api/home-pagedata')` and render identically |
| **3. Site & Page singletons (write)** | `updateX` handlers under `/api/admin/...`, audit-log writes inline | Admin can edit homepage copy via REST and frontend reflects it |
| **4. Products** | `product.model.ts` (slug + sku pre-save like reference), `productController.ts`, multer fields for `images` + `gallery`, Cloudinary upload via `cloudinaryService` | Shop and shop/[slug] driven by API |
| **5. Plans** | `plan.model.ts`, `planController.ts` | Homepage Plans cards driven by API |
| **6. Nav** | `navLink.model.ts`, `navController.ts` | Navbar + footer links driven by API |
| **7. Leads** | `lead.model.ts`, `leadController.ts`, `mailService.sendLeadNotification` | Contact form persists, email sent, admin inbox works |
| **8. Tickets** | `ticket.model.ts`, `counter.model.ts`, `ticketIdService.ts`, `ticketController.ts`, `mailService.sendTicketConfirmation` | Service Request + Track Ticket fully wired |
| **9. Media library** | `media.model.ts`, `mediaController.ts`, end-to-end Cloudinary delete | Image management works from admin |
| **10. Admin users + audit log (super-admin)** | `userController.ts` admin CRUD, `auditController.ts`, `auditLog.model.ts` integration in mutating handlers | Compliance-ready |
| **11. Email polish** | Branded templates for ticket confirmation / status update / admin invite / password reset | Real branded mail going out |
| **12. Deploy** | Vercel project, env vars, custom domain `api.cryptominingmiles.in`, `seed` once-off in production | Live |

---

## 20. Open decisions (Vikrant to confirm before phase 4)

1. **Plan currency** — Pebble/Boulder/Mountain show `$` on the homepage; rest of site is `₹`. Recommend keeping `currency` field per Plan and showing whatever's set; default seeded to USD as today.
2. **Cookie auth** — reference uses Bearer + localStorage. Stick with that for v1 unless you want HTTP-only cookies day one (extra CSRF work).
3. **Audit log retention** — TTL 365 days OK?
4. **Live counters** — keep editable manually in `SiteSettings.liveCounters`; defer real metrics integration to v2. Confirm.
5. **Webhook readiness** — `index.ts` already preserves `req.rawBody` for `/webhook` paths. We don't have any webhook in v1; leave the hook in place for future Razorpay/Stripe/Shiprocket parity with reference.
6. **Static `public/` folder** — keep the reference's `if (fs.existsSync(staticPath))` block? Recommend yes — handy for serving og-images and favicons without a CDN.

---

**End of plan.** Implementation begins at Phase 0 once you confirm the structure matches your existing codebase mental model.
