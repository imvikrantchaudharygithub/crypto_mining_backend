import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import User from '../models/user.model';
import SiteSettings from '../models/siteSettings.model';
import HomePage from '../models/homePage.model';
import ProfitabilityPage from '../models/profitabilityPage.model';
import ContactPage from '../models/contactPage.model';
import ServiceRequestPage from '../models/serviceRequestPage.model';
import ShopPage from '../models/shopPage.model';
import TrackTicketPage from '../models/trackTicketPage.model';
import Product from '../models/product.model';
import Plan from '../models/plan.model';
import NavLink from '../models/navLink.model';
import Ticket from '../models/ticket.model';
import Counter from '../models/counter.model';

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || '';

async function run(): Promise<void> {
  if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }
  await mongoose.connect(MONGODB_URI);
  console.log('Connected — seeding...');

  // ── Super admin ──
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@cryptominingmiles.in';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMeOnFirstLogin#2026';
  await User.findOneAndUpdate(
    { email },
    { email, passwordHash: await bcrypt.hash(password, 12), name: 'Super Admin', role: 'super-admin', isActive: true },
    { upsert: true }
  );
  console.log('✓ Super admin');

  // ── Site Settings ──
  await SiteSettings.findOneAndUpdate(
    { _id: 'site' },
    {
      brand: { name: 'Crypto Mining Miles', tagline: 'Industrial-grade hashrate for everyone', estYear: '2017' },
      contact: { salesPhone: '+91 98765 43210', salesEmail: 'sales@cryptominingmiles.in', supportEmail: 'support@cryptominingmiles.in', institutionalEmail: 'institutional@cryptominingmiles.in', workingHours: 'Mon–Sat, 10 AM – 7 PM IST' },
      liveCounters: { minersOnline: '52,847', networkHashratePHs: '620', paidOutUSDM: '2.4', uptimePct: '99.9', daysMining: '3,012' },
      footer: { copyrightText: '© 2025 Crypto Mining Miles. All rights reserved.', coordinatesLine: 'N 28°37′ · E 77°13′' },
    },
    { upsert: true }
  );
  console.log('✓ Site settings');

  // ── Home Page ──
  await HomePage.findOneAndUpdate(
    { _id: 'home' },
    {
      hero: {
        sectionTag: 'A new kind of mining',
        cornerLabelLeft: '[ 01 ] — Hashrate as a service',
        cornerLabelRight: 'N 28°37′ · E 77°13′\nMining facility · live',
        headlineLine1: 'Mine smarter,',
        headlineLine2Prefix: 'earn ',
        headlineItalic: 'everywhere',
        headlineLine2Suffix: '.',
        subtitleLines: [
          '// Industrial-grade hashrate, hosted hardware,',
          '// and transparent payouts — built for retail',
          '// miners and institutional desks since 2017.',
        ],
        primaryCta: { label: 'Start Mining', href: '#plans' },
        ghostCta: { label: 'View Plans', href: '#plans' },
        liveBadgeText: '52,847 miners online now',
        trustStrip: [
          { value: '1000+', label: 'Units Sold' },
          { value: '2017', label: 'Est. Year' },
          { value: 'GST ✓', label: 'Registered' },
          { value: '99.9%', label: 'Uptime SLA' },
        ],
      },
      statsMarquee: {
        items: [
          { label: 'Total Hashrate', value: '620 PH/s' },
          { label: 'Active Miners', value: '52,847' },
          { label: 'Paid Out', value: '$2.4M' },
          { label: 'Uptime', value: '99.9%' },
          { label: 'Days Mining', value: '3,012' },
        ],
      },
      statsGrid: {
        sectionTag: 'By the numbers',
        headlineLine1: 'Scale that',
        headlineLine2: 'speaks for itself.',
        items: [
          { label: 'Active Miners', detail: 'across our facilities', value: 52847, decimals: 0, prefix: '', suffix: '' },
          { label: 'Total Hashrate', detail: 'petahash per second', value: 620, decimals: 0, prefix: '', suffix: ' PH/s' },
          { label: 'Paid Out', detail: 'to miners since 2017', value: 2.4, decimals: 1, prefix: '$', suffix: 'M' },
          { label: 'Uptime SLA', detail: 'guaranteed', value: 99.9, decimals: 1, prefix: '', suffix: '%' },
        ],
      },
      whyUs: {
        sectionTag: 'Why choose us',
        headlineLine1: 'Built for serious',
        headlineItalic: 'miners.',
        features: [
          { num: '01', title: 'Industrial Infrastructure', body: 'Our facilities run on commercial-grade power with redundant UPS, precision cooling, and 24/7 monitoring — no garage-operation compromises.' },
          { num: '02', title: 'Transparent Payouts', body: 'Every satoshi accounted for. Real-time dashboards, on-chain verifiable payouts, and monthly statements you can hand to your CA.' },
          { num: '03', title: 'Expert Support', body: 'Dedicated account managers, firmware teams, and on-site engineers. We pick up the phone.' },
          { num: '04', title: 'GST-Compliant', body: 'Full GST invoicing, TDS-ready documentation, and structured agreements for corporate buyers and HNI clients.' },
        ],
      },
      howItWorks: {
        sectionTag: 'How it works',
        headlinePrefix: 'Up and mining in',
        headlineItalic: 'five steps.',
        steps: [
          { num: '01', title: 'Choose a Plan', body: 'Pick the hashrate package that matches your investment appetite — from Pebble to Mountain.' },
          { num: '02', title: 'Sign Agreement', body: 'We send a GST-compliant contract. E-sign and you\'re in the queue.' },
          { num: '03', title: 'Hardware Deployed', body: 'Your ASIC is racked, cabled, and pointed at your chosen pool within 48 hours of payment.' },
          { num: '04', title: 'Payouts Start', body: 'Mining rewards hit your wallet daily. Track everything on your live dashboard.' },
          { num: '05', title: 'Scale Anytime', body: 'Add more units, switch pools, or upgrade hardware — your account manager handles the rest.' },
        ],
      },
      faqs: {
        sectionTag: 'Common questions',
        headlineLine1: 'Everything you need',
        headlineLine2: 'to know.',
        items: [
          { q: 'Do I own the hardware?', a: 'Yes. You purchase the ASIC outright. We host it in our facility under a managed hosting agreement.' },
          { q: 'What are the electricity costs?', a: 'Power is included in all our plans at industrial rates — currently ₹5.2/kWh, significantly below retail.' },
          { q: 'Which coins can I mine?', a: 'Bitcoin (SHA-256), Ethereum Classic, Litecoin (SCRYPT), and Kaspa (KASPA). Algorithm depends on your hardware.' },
          { q: 'How are payouts processed?', a: 'Daily to your wallet address. Minimum threshold is 0.001 BTC or equivalent. No custodial holding.' },
          { q: 'What happens if my miner goes down?', a: 'Our on-site team receives an alert within 60 seconds. Most issues are resolved without customer involvement.' },
          { q: 'Is there a minimum contract period?', a: 'Pebble and Boulder plans have a 12-month minimum. Mountain (institutional) contracts are negotiated case-by-case.' },
        ],
      },
      footerCta: {
        sectionTag: 'Ready to start?',
        headlinePrefix: 'Start mining',
        headlineItalic: 'today.',
        cta: { label: 'Get Started →', href: '#plans' },
        quickLinks: [
          { label: 'View Plans', href: '#plans' },
          { label: 'Calculator', href: '/profitability' },
          { label: 'Contact Us', href: '/contact' },
          { label: 'Service Request', href: '/service-request' },
        ],
      },
    },
    { upsert: true }
  );
  console.log('✓ Home page');

  // ── Plans ──
  const plans = [
    { slug: 'pebble', tag: 'STARTER', name: 'Pebble', price: 49, currency: 'USD', hashrate: '5 TH/s', duration: '12 months', durationMonths: 12, featured: false, sortOrder: 0, features: ['5 TH/s SHA-256 hashrate', 'Daily BTC payouts', 'Real-time dashboard', 'Email support', 'GST invoice included'], ctaLabel: 'Start Mining →', ctaHref: '#plans' },
    { slug: 'boulder', tag: 'POPULAR', name: 'Boulder', price: 199, currency: 'USD', hashrate: '25 TH/s', duration: '12 months', durationMonths: 12, featured: true, sortOrder: 1, features: ['25 TH/s SHA-256 hashrate', 'Daily BTC payouts', 'Real-time dashboard', 'Priority support', 'GST invoice included', 'Pool switching included'], ctaLabel: 'Start Mining →', ctaHref: '#plans' },
    { slug: 'mountain', tag: 'INSTITUTIONAL', name: 'Mountain', price: 1499, currency: 'USD', hashrate: '200 TH/s', duration: 'Custom', durationMonths: 12, featured: false, sortOrder: 2, features: ['200 TH/s SHA-256 hashrate', 'Dedicated account manager', 'Custom pool configuration', '24/7 phone support', 'On-site visit included', 'Custom contract terms', 'Multi-coin available'], ctaLabel: 'Contact Sales →', ctaHref: '/contact' },
  ];
  for (const plan of plans) {
    await Plan.findOneAndUpdate({ slug: plan.slug }, plan, { upsert: true });
  }
  console.log('✓ Plans');

  // ── Nav Links ──
  const navLinks = [
    { label: 'Shop', href: '/shop', group: 'navbar', sortOrder: 0 },
    { label: 'Profitability', href: '/profitability', group: 'navbar', sortOrder: 1 },
    { label: 'Plans', href: '#plans', group: 'navbar', sortOrder: 2 },
    { label: 'Contact', href: '/contact', group: 'navbar', sortOrder: 3 },
    { label: 'Service Request', href: '/service-request', group: 'navbar', sortOrder: 4 },
    { label: 'Warranty', href: '/warranty', group: 'navbar', sortOrder: 5 },
    { label: 'Home', href: '/', group: 'footer-quick-links', sortOrder: 0 },
    { label: 'Shop', href: '/shop', group: 'footer-quick-links', sortOrder: 1 },
    { label: 'Plans', href: '#plans', group: 'footer-quick-links', sortOrder: 2 },
    { label: 'Contact', href: '/contact', group: 'footer-quick-links', sortOrder: 3 },
    { label: 'Track Ticket', href: '/track-ticket', group: 'footer-quick-links', sortOrder: 4 },
  ];
  for (const link of navLinks) {
    await NavLink.findOneAndUpdate({ label: link.label, group: link.group }, link, { upsert: true });
  }
  console.log('✓ Nav links');

  // ── Shop Page ──
  await ShopPage.findOneAndUpdate(
    { _id: 'shop' },
    { filterAlgos: ['All', 'SHA-256', 'ETHASH', 'SCRYPT', 'KASPA'], gstNote: 'Prices inclusive of GST. EMI available on select models.' },
    { upsert: true }
  );
  console.log('✓ Shop page');

  // ── Service Request Page ──
  await ServiceRequestPage.findOneAndUpdate(
    { _id: 'service-request' },
    {
      issueTypes: ['Hardware Failure', 'Connectivity Issue', 'Performance Degradation', 'Firmware Update', 'Pool Configuration', 'Power Issue', 'Noise / Overheating', 'Other'],
      priorityLevels: ['Low', 'Medium', 'High', 'Critical'],
    },
    { upsert: true }
  );
  console.log('✓ Service request page');

  // ── Track Ticket Page ──
  await TrackTicketPage.findOneAndUpdate(
    { _id: 'track-ticket' },
    { searchPlaceholder: 'e.g. CMM-2024-0042', notFoundMessage: 'No ticket found with that ID.', emptyHint: 'Check your email for the ticket ID we sent after submission.', escalationCopy: 'Need urgent help? Call +91 98765 43210' },
    { upsert: true }
  );
  console.log('✓ Track ticket page');

  // ── Demo tickets ──
  await Counter.findOneAndUpdate({ _id: 'ticket-2024' }, { seq: 88 }, { upsert: true });
  await Ticket.findOneAndUpdate(
    { ticketId: 'CMM-2024-0042' },
    { ticketId: 'CMM-2024-0042', customer: { name: 'Rohan Mehta', email: 'rohan@example.com', phone: '+91 99887 76655' }, issueType: 'Connectivity Issue', priority: 'Medium', description: 'Miner lost pool connection after power outage.', status: 'resolved', steps: [{ label: 'Ticket Received', desc: 'Your request has been logged.', time: '09:14', occurredAt: new Date(), done: true, active: false }, { label: 'Engineer Assigned', desc: 'Senior technician dispatched.', time: '09:45', occurredAt: new Date(), done: true, active: false }, { label: 'Issue Resolved', desc: 'Pool reconnected, miner hashing normally.', time: '11:02', occurredAt: new Date(), done: true, active: false }] },
    { upsert: true }
  );
  await Ticket.findOneAndUpdate(
    { ticketId: 'CMM-2024-0088' },
    { ticketId: 'CMM-2024-0088', customer: { name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 91234 56789' }, issueType: 'Performance Degradation', priority: 'High', description: 'Hashrate dropped 40% over 48 hours.', status: 'in-progress', steps: [{ label: 'Ticket Received', desc: 'Your request has been logged.', time: '14:22', occurredAt: new Date(), done: true, active: false }, { label: 'Diagnostics Running', desc: 'Remote analysis in progress.', time: '15:10', occurredAt: new Date(), done: false, active: true }] },
    { upsert: true }
  );
  console.log('✓ Demo tickets');

  // ── Products ──
  const seedProducts = [
    {
      slug: 'antminer-s19-xp',
      name: 'Antminer S19 XP',
      shortName: 'S19',
      subName: 'XP',
      algo: 'SHA-256',
      tag: 'BESTSELLER',
      stock: 'In Stock',
      available: true,
      edition: 'Bitmain · 2024 ed.',
      sku: 'BTM-S19XP-140',
      tagline: "The flagship workhorse. Bitmain's most efficient SHA-256 ASIC, tuned, tested and shipped from our Delhi facility — with full GST invoice and 12-month local RMA.",
      hashrate: '140 TH/s',
      hashrateNum: '140',
      hashrateUnit: 'TH/s',
      power: '3010W',
      powerNum: '3010',
      efficiency: '21.5 J/TH',
      efficiencyNum: '21.5',
      noise: '75 dB',
      noiseNum: '75',
      contract: '12 months',
      price: 320000,
      priceDisplay: '₹3,20,000',
      silencerPrice: 8000,
      specs: {
        performance: [['Algorithm','SHA-256'],['Hashrate','140 TH/s ±3%'],['Manufacturer','Bitmain Technologies'],['Chip','5nm Custom ASIC']],
        power: [['Power Draw','3010W ±5% @ 25°C'],['Efficiency','21.5 J/TH'],['Voltage','220–240V AC'],['Connector','C19 IEC inlet']],
        physical: [['Dimensions','400 × 195 × 290 mm'],['Weight','13.5 kg'],['Cooling','4× high-speed fans'],['Operating Temp','5°C – 45°C']],
        connectivity: [['Network','RJ45 Ethernet 10/100M'],['Noise level','75 dB'],['Pool support','Stratum V1/V2'],['Firmware','Bitmain stock + custom']],
      },
      boxItems: [
        { icon: '◼', label: 'Antminer S19 XP unit', sub: 'Sealed factory box, 24h tested' },
        { icon: '⏚', label: 'Power cable', sub: 'C19 IEC, India plug adapter included' },
        { icon: '⌥', label: '2× Ethernet cable', sub: 'Cat6, 2m each' },
        { icon: '📑', label: 'Quick setup guide', sub: 'English + Hindi · QR to video walkthrough' },
      ],
      electricalReqs: [
        ['AC Voltage','220V – 240V AC'],
        ['Wiring','2.5 mm² – 4 mm² copper'],
        ['Circuit','Dedicated, single-phase'],
        ['Breaker','16A minimum (20A recommended)'],
        ['Ventilation','Hot-air exhaust required'],
        ['Earthing','Mandatory · ≤ 4 Ω resistance'],
      ],
      relatedSlugs: ['antminer-s19j-pro', 'antminer-s21-pro', 'iceriver-ks3m'],
      seo: { title: 'Antminer S19 XP 140TH/s — Crypto Mining Miles', description: 'Buy the Antminer S19 XP. 140 TH/s SHA-256, 21.5 J/TH efficiency. Fully hosted in our New Delhi facility. Daily payouts.' },
      sortOrder: 0,
      status: 'active',
    },
    {
      slug: 'antminer-s19j-pro',
      name: 'Antminer S19j Pro',
      shortName: 'S19j',
      subName: 'Pro',
      algo: 'SHA-256',
      tag: 'POPULAR',
      stock: 'In Stock',
      available: true,
      edition: 'Bitmain · 2023 ed.',
      sku: 'BTM-S19JPRO-104',
      tagline: 'The reliable workhorse. Proven SHA-256 performance at an accessible price point — a favourite among Indian home miners.',
      hashrate: '104 TH/s',
      hashrateNum: '104',
      hashrateUnit: 'TH/s',
      power: '3068W',
      powerNum: '3068',
      efficiency: '29.5 J/TH',
      efficiencyNum: '29.5',
      noise: '75 dB',
      noiseNum: '75',
      contract: '12 months',
      price: 210000,
      priceDisplay: '₹2,10,000',
      silencerPrice: 8000,
      specs: {
        performance: [['Algorithm','SHA-256'],['Hashrate','104 TH/s ±3%'],['Manufacturer','Bitmain Technologies'],['Chip','7nm Custom ASIC']],
        power: [['Power Draw','3068W ±5% @ 25°C'],['Efficiency','29.5 J/TH'],['Voltage','220–240V AC'],['Connector','C19 IEC inlet']],
        physical: [['Dimensions','370 × 195 × 290 mm'],['Weight','13.2 kg'],['Cooling','4× high-speed fans'],['Operating Temp','5°C – 45°C']],
        connectivity: [['Network','RJ45 Ethernet 10/100M'],['Noise level','75 dB'],['Pool support','Stratum V1/V2'],['Firmware','Bitmain stock']],
      },
      boxItems: [
        { icon: '◼', label: 'Antminer S19j Pro unit', sub: 'Sealed factory box, 24h tested' },
        { icon: '⏚', label: 'Power cable', sub: 'C19 IEC, India plug adapter included' },
        { icon: '⌥', label: '2× Ethernet cable', sub: 'Cat6, 2m each' },
        { icon: '📑', label: 'Quick setup guide', sub: 'English + Hindi · QR to video walkthrough' },
      ],
      electricalReqs: [
        ['AC Voltage','220V – 240V AC'],
        ['Wiring','2.5 mm² – 4 mm² copper'],
        ['Circuit','Dedicated, single-phase'],
        ['Breaker','16A minimum (20A recommended)'],
        ['Ventilation','Hot-air exhaust required'],
        ['Earthing','Mandatory · ≤ 4 Ω resistance'],
      ],
      relatedSlugs: ['antminer-s19-xp'],
      seo: { title: 'Antminer S19j Pro 104TH/s — Crypto Mining Miles', description: 'Buy the Antminer S19j Pro. 104 TH/s SHA-256. Fully hosted in our New Delhi facility.' },
      sortOrder: 1,
      status: 'active',
    },
  ];
  for (const prod of seedProducts) {
    await Product.findOneAndUpdate({ slug: prod.slug }, prod, { upsert: true, new: true });
  }
  console.log('✓ Products');

  console.log('\n✅ Seed complete.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
