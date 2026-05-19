import { Request, Response } from 'express';
import HomePage from '../models/homePage.model';
import Plan from '../models/plan.model';
import Product from '../models/product.model';
import SiteSettings from '../models/siteSettings.model';
import NavLink from '../models/navLink.model';
import Team from '../models/team.model';
import SoftwarePartner from '../models/softwarePartner.model';

export const getHomePageData = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [homePage, plans, featuredProducts, siteSettings, navDocs, team, softwarePartners] = await Promise.all([
      HomePage.findById('home').lean(),
      Plan.find({ status: 'active' }).sort({ sortOrder: 1 }).lean(),
      Product.find({ status: 'active', available: true }).sort({ sortOrder: 1 }).limit(3).lean(),
      SiteSettings.findById('site').lean(),
      NavLink.find({ group: 'navbar', status: 'active' }).sort({ sortOrder: 1 }).lean(),
      Team.find({ status: 'active' }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
      SoftwarePartner.find({ status: 'active' }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
    ]);
    const navLinks = (navDocs as { label?: string; href?: string }[]).map((l) => ({
      label: l.label ?? '',
      href: l.href ?? '',
    }));
    res.status(200).json({
      success: true,
      homePage,
      plans,
      featuredProducts,
      siteSettings,
      navLinks,
      team,
      softwarePartners,
    });
  } catch (error) {
    console.error('Error in getHomePageData:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch home page data', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

const isBooleanPath = (path: string): boolean => {
  const schemaPath = HomePage.schema.path(path);
  if (!schemaPath) return false;
  // SchemaType.instance is 'Boolean' | 'String' | 'Number' | ...
  return (schemaPath as unknown as { instance: string }).instance === 'Boolean';
};

const normalizeFormValues = (value: unknown, path = ''): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeFormValues(item, path));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const childPath = path ? `${path}.${k}` : k;
      const normalized = normalizeFormValues(v, childPath);
      if (normalized === undefined) continue;
      out[k] = normalized;
    }
    return out;
  }
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
    // Empty string on a Boolean field would crash the cast — drop it so the schema default applies.
    if (value === '' && isBooleanPath(path)) return undefined;
  }
  return value;
};

export const updateHomePage = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = normalizeFormValues(req.body) as Record<string, unknown>;
    const doc = await HomePage.findOneAndUpdate({ _id: 'home' }, { $set: payload }, { new: true, upsert: true });
    res.status(200).json({ success: true, message: 'Home page updated', homePage: doc });
  } catch (error) {
    console.error('Error in updateHomePage:', error);
    res.status(500).json({ success: false, message: 'Failed to update home page', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
