import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthUser, Permission } from '../types/auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: 'JWT secret not configured' });
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const user = await User.findById(decoded.id)
      .populate('agency', 'name status')
      .select('-password');

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid token or inactive user' });
    }

    // Check if session is still active
    const session = user.activeSessions.find((s: any) => s.tokenId === decoded.tokenId);
    if (!session) {
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    // Update last used time for the session
    session.lastUsed = new Date();
    await user.save();

    req.user = {
      id: (user._id as any).toString(),
      username: user.username,
      role: user.role,
      agencyId: user.agency?._id.toString(),
      permissions: user.permissions,
      tokenId: decoded.tokenId,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (...permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const hasPermission = permissions.some(permission => 
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: permissions,
        userPermissions: req.user.permissions 
      });
    }

    return next();
  };
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient role.',
        required: roles,
        userRole: req.user.role 
      });
    }

    return next();
  };
};