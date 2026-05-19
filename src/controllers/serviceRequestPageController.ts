import { Request, Response } from 'express';
import ServiceRequestPage from '../models/serviceRequestPage.model';

const ID = 'service-request';

export const getServiceRequestPage = async (_req: Request, res: Response): Promise<void> => {
  try {
    const page = await ServiceRequestPage.collection.findOne({ _id: ID } as any);
    res.status(200).json({ success: true, page });
  } catch (error) {
    console.error('Error in getServiceRequestPage:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service request page', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateServiceRequestPage = async (req: Request, res: Response): Promise<void> => {
  try {
    await ServiceRequestPage.collection.updateOne(
      { _id: ID } as any,
      { $set: { ...req.body, updatedAt: new Date() } },
      { upsert: true }
    );
    const page = await ServiceRequestPage.collection.findOne({ _id: ID } as any);
    res.status(200).json({ success: true, message: 'Service request page updated', page });
  } catch (error) {
    console.error('Error in updateServiceRequestPage:', error);
    res.status(500).json({ success: false, message: 'Failed to update service request page', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
