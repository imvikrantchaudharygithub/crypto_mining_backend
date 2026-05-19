import { Request, Response } from 'express';
import SoftwarePartner from '../models/softwarePartner.model';
import { uploadCloudinary } from '../services/cloudinaryService';

function coerceBody(raw: Record<string, any>): Record<string, any> {
  const body: Record<string, any> = { ...raw };
  if (typeof body.sortOrder === 'string') body.sortOrder = Number(body.sortOrder) || 0;
  return body;
}

export const createSoftwarePartner = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file as Express.Multer.File | undefined;
    let logo = '';
    if (file) {
      const result: any = await uploadCloudinary(file, 'crypto-mining/partners');
      logo = result.secure_url;
    }
    const body = coerceBody(req.body);
    const partner = await SoftwarePartner.create({ ...body, logo: logo || body.logo || '' });
    res.status(201).json({ success: true, message: 'Partner created', partner });
  } catch (error) {
    console.error('Error in createSoftwarePartner:', error);
    res.status(500).json({ success: false, message: 'Failed to create partner', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getAllSoftwarePartners = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {};
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    else if (!req.query.status) filter.status = 'active';
    const partners = await SoftwarePartner.find(filter).sort({ sortOrder: 1, createdAt: 1 });
    res.status(200).json({ success: true, partners });
  } catch (error) {
    console.error('Error in getAllSoftwarePartners:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch partners', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateSoftwarePartner = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file as Express.Multer.File | undefined;
    const update: any = coerceBody(req.body);
    if (file) {
      const result: any = await uploadCloudinary(file, 'crypto-mining/partners');
      update.logo = result.secure_url;
    }
    const partner = await SoftwarePartner.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!partner) { res.status(404).json({ message: 'Partner not found' }); return; }
    res.status(200).json({ success: true, message: 'Partner updated', partner });
  } catch (error) {
    console.error('Error in updateSoftwarePartner:', error);
    res.status(500).json({ success: false, message: 'Failed to update partner', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteSoftwarePartner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    const partner = await SoftwarePartner.findByIdAndDelete(id);
    if (!partner) { res.status(404).json({ message: 'Partner not found' }); return; }
    res.status(200).json({ success: true, message: 'Partner deleted' });
  } catch (error) {
    console.error('Error in deleteSoftwarePartner:', error);
    res.status(500).json({ success: false, message: 'Failed to delete partner', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const reorderSoftwarePartners = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body as { ids: string[] };
    await Promise.all(ids.map((id, index) => SoftwarePartner.findByIdAndUpdate(id, { sortOrder: index })));
    res.status(200).json({ success: true, message: 'Partners reordered' });
  } catch (error) {
    console.error('Error in reorderSoftwarePartners:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder partners', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
