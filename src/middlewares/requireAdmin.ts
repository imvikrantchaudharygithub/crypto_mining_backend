import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const r = req as any;

    // TEMPORARY: bypass admin role check when DISABLE_AUTH=true. Pairs with verifyToken's bypass.
    if (process.env.DISABLE_AUTH === 'true') {
      r.userId = r.userId || 'dev';
      r.user = { _id: 'dev', role: 'super-admin' as const };
      next();
      return;
    }

    if (!r.userId) { res.status(401).json({ message: 'Not authenticated' }); return; }

    // Dev auth stub: verifyToken sets userId to 'dev' — no DB user; treat as super-admin locally
    if (process.env.NODE_ENV !== 'production' && String(r.userId) === 'dev') {
      r.user = { _id: 'dev', role: 'super-admin' as const };
      next();
      return;
    }

    const user = await User.findById(r.userId).select('role isActive');
    if (!user || !user.isActive) { res.status(401).json({ message: 'User not found or inactive' }); return; }
    const role = user.role as string;
    if (!['super-admin', 'editor', 'support'].includes(role)) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }
    r.user = { _id: (user._id as any).toString(), role: role as 'super-admin' | 'editor' | 'support' };
    next();
  } catch (error) {
    console.error('requireAdmin error:', error);
    res.status(500).json({ message: 'Authorization error' });
  }
};

export const requireRole = (...allowed: string[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const r = req as any;
    if (!r.user || !allowed.includes(r.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }
    next();
  };
