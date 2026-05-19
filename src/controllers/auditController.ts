import { Request, Response } from 'express';
import AuditLog from '../models/auditLog.model';

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {};
    if (req.query.entity) filter.entity = req.query.entity;
    if (req.query.action) filter.action = req.query.action;
    const logs = await AuditLog.find(filter).populate('actor', 'name email').sort({ createdAt: -1 }).limit(200);
    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error('Error in getAuditLogs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
