import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';

// TEMPORARY: admin role check fully disabled for the client demo phase.
// Restore the original block below when re-enabling auth.
export const requireAdmin = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const r = req as any;
  r.userId = r.userId || 'dev';
  r.user = { _id: 'dev', role: 'super-admin' as const };
  next();
};

// TEMPORARY: role check disabled — pass through.
export const requireRole = (..._allowed: string[]) =>
  async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    next();
  };

/* original implementations — restore when auth is needed again
export const requireAdminOriginal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const r = req as any;
    if (!r.userId) { res.status(401).json({ message: 'Not authenticated' }); return; }

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

export const requireRoleOriginal = (...allowed: string[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const r = req as any;
    if (!r.user || !allowed.includes(r.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }
    next();
  };
*/
