import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    partnerId?: number;
    partnerCode?: string;
    partnerEmail?: string;
    partnerName?: string;
    adminId?: number;
    adminUsername?: string;
    adminRole?: string;
  }
}

export function requirePartnerAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.partnerId) {
    res.status(401).json({ success: false, message: 'Authentication required. Please log in as a partner.' });
    return;
  }
  next();
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.adminId) {
    res.status(401).json({ success: false, message: 'Admin privileges required. Please log in as administrator.' });
    return;
  }
  next();
}
