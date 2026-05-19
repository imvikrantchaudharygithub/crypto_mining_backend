import { Request, Response } from 'express';
import SiteSettings from '../models/siteSettings.model';

export const getSiteSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await SiteSettings.findById('site');
    res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Error in getSiteSettings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch site settings', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateSiteSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await SiteSettings.findOneAndUpdate({ _id: 'site' }, { $set: req.body }, { new: true, upsert: true, strict: false });
    res.status(200).json({ success: true, message: 'Site settings updated', settings: doc });
  } catch (error) {
    console.error('Error in updateSiteSettings:', error);
    res.status(500).json({ success: false, message: 'Failed to update site settings', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
