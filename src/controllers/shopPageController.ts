import { Request, Response } from 'express';
import ShopPage from '../models/shopPage.model';

const ID = 'shop';

export const getShopPage = async (_req: Request, res: Response): Promise<void> => {
  try {
    const page = await ShopPage.collection.findOne({ _id: ID } as any);
    res.status(200).json({ success: true, page });
  } catch (error) {
    console.error('Error in getShopPage:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shop page', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateShopPage = async (req: Request, res: Response): Promise<void> => {
  try {
    await ShopPage.collection.updateOne(
      { _id: ID } as any,
      { $set: { ...req.body, updatedAt: new Date() } },
      { upsert: true }
    );
    const page = await ShopPage.collection.findOne({ _id: ID } as any);
    res.status(200).json({ success: true, message: 'Shop page updated', page });
  } catch (error) {
    console.error('Error in updateShopPage:', error);
    res.status(500).json({ success: false, message: 'Failed to update shop page', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
