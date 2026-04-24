import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { UserRole, JWTPayload } from '../types';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    brandIds: string[];
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export const verifyAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get accessible brand IDs for PIC users
    let accessibleBrandIds: string[] = [];
    if (user.role === 'OWNER') {
      accessibleBrandIds = await prisma.brand.findMany({
        where: { createdById: user.id },
        select: { id: true }
      }).then(brands => brands.map(b => b.id));
    } else {
      accessibleBrandIds = await prisma.userBrandAccess.findMany({
        where: { userId: user.id },
        select: { brandId: true }
      }).then(access => access.map(a => a.brandId));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      brandIds: accessibleBrandIds
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: UserRole | UserRole[]) => {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${requiredRoles.join(', ')}` 
      });
    }
    next();
  };
};

export const requireBrandAccess = (brandIdParam: string = 'brandId') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const brandId = req.params[brandIdParam] || req.body.brandId;
    
    if (!brandId) {
      return res.status(400).json({ error: 'brandId is required' });
    }

    if (!req.user!.brandIds.includes(brandId)) {
      return res.status(403).json({ 
        error: 'Access denied. No permission for this brand' 
      });
    }

    // Attach brandId to request for easy access in controllers
    (req as any).accessibleBrandId = brandId;
    next();
  };
};
