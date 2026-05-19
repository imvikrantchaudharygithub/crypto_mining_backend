import { Request, Response } from 'express';
import ContactPage from '../models/contactPage.model';

const ID = 'contact';

export const getContactPage = async (_req: Request, res: Response): Promise<void> => {
  try {
    const page = await ContactPage.collection.findOne({ _id: ID } as any);
    res.status(200).json({ success: true, page });
  } catch (error) {
    console.error('Error in getContactPage:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contact page', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateContactPage = async (req: Request, res: Response): Promise<void> => {
  try {
    await ContactPage.collection.updateOne(
      { _id: ID } as any,
      { $set: { ...req.body, updatedAt: new Date() } },
      { upsert: true }
    );
    const page = await ContactPage.collection.findOne({ _id: ID } as any);
    res.status(200).json({ success: true, message: 'Contact page updated', page });
  } catch (error) {
    console.error('Error in updateContactPage:', error);
    res.status(500).json({ success: false, message: 'Failed to update contact page', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
