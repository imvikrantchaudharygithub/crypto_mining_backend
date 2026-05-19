import { Request, Response } from 'express';
import TrackTicketPage from '../models/trackTicketPage.model';

const ID = 'track-ticket';

export const getTrackTicketPage = async (_req: Request, res: Response): Promise<void> => {
  try {
    const page = await TrackTicketPage.collection.findOne({ _id: ID } as any);
    res.status(200).json({ success: true, page });
  } catch (error) {
    console.error('Error in getTrackTicketPage:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch track ticket page', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateTrackTicketPage = async (req: Request, res: Response): Promise<void> => {
  try {
    await TrackTicketPage.collection.updateOne(
      { _id: ID } as any,
      { $set: { ...req.body, updatedAt: new Date() } },
      { upsert: true }
    );
    const page = await TrackTicketPage.collection.findOne({ _id: ID } as any);
    res.status(200).json({ success: true, message: 'Track ticket page updated', page });
  } catch (error) {
    console.error('Error in updateTrackTicketPage:', error);
    res.status(500).json({ success: false, message: 'Failed to update track ticket page', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
