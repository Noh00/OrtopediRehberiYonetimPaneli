import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateDbUser, getWorkspaceSettings } from '../db/repository.ts';
import type { PermissionKey, TeamUser, UserRole } from '../types/admin.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: TeamUser;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkisiz erişim: Oturum belirteci eksik.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    const dbUser = await getOrCreateDbUser({
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Editör',
      avatarUrl: decodedToken.picture,
    });

    if (dbUser.status === 'suspended') {
      return res.status(403).json({ error: 'Hesabınız yönetici tarafından askıya alınmış.' });
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' });
  }
};

export function requirePermission(permission: PermissionKey) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.dbUser) {
        return res.status(401).json({ error: 'Oturum doğrulanamadı.' });
      }
      const settings = await getWorkspaceSettings();
      const role = req.dbUser.role as UserRole;
      const allowed = settings.rolePermissions[role]?.[permission];
      if (!allowed) {
        return res.status(403).json({
          error: 'Bu işlem için rol yetkiniz bulunmuyor.',
        });
      }
      next();
    } catch (error) {
      console.error('Permission check failed:', error);
      return res.status(500).json({ error: 'Yetki kontrolü sırasında sunucu hatası oluştu.' });
    }
  };
}
