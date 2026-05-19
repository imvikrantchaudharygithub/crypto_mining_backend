import { Request, Response } from 'express';
import ProfitabilityPage from '../models/profitabilityPage.model';

const ID = 'profitability';

export const getProfitabilityPage = async (_req: Request, res: Response): Promise<void> => {
  try {
    const page = await ProfitabilityPage.collection.findOne({ _id: ID } as any);
    res.status(200).json({ success: true, page });
  } catch (error) {
    console.error('Error in getProfitabilityPage:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profitability page', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateProfitabilityPage = async (req: Request, res: Response): Promise<void> => {
  try {
    await ProfitabilityPage.collection.updateOne(
      { _id: ID } as any,
      { $set: { ...req.body, updatedAt: new Date() } },
      { upsert: true }
    );
    const page = await ProfitabilityPage.collection.findOne({ _id: ID } as any);
    res.status(200).json({ success: true, message: 'Profitability page updated', page });
  } catch (error) {
    console.error('Error in updateProfitabilityPage:', error);
    res.status(500).json({ success: false, message: 'Failed to update profitability page', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
