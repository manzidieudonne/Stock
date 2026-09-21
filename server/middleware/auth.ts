import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'stockflow-jwt-super-secret-key-2026';

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : (req.headers['x-access-token'] as string);

  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired token.' });
    return;
  }
};

export const requireRole = (role: 'Admin' | 'User') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (role === 'Admin' && req.user.role !== 'Admin') {
      res.status(403).json({ message: 'Forbidden. Administrator privileges required.' });
      return;
    }
    next();
  };
};

export const requireAdmin = requireRole('Admin');
