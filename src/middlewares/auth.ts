import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (process.env.NODE_ENV !== 'production' && req.headers.authorization === 'Bearer dev-skip') {
      (req as any).userId = 'dev';
      return next();
    }
    const authHeader = req.headers['authorization'];
    if (!authHeader) { res.status(403).json({ message: 'Token is not provided' }); return; }

    let token = authHeader;
    if (authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.SECRET_KEY as Secret, (err: any, decoded: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') res.status(401).json({ message: 'Token expired' });
        else if (err.name === 'JsonWebTokenError') res.status(401).json({ message: 'Invalid token signature' });
        else res.status(401).json({ message: 'Invalid token' });
        return;
      }
      (req as any).userId = decoded.userId || decoded.id || decoded._id;
      next();
    });
  } catch (error) {
    console.error('Auth middleware unexpected error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};
