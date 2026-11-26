import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { verifySessionToken } from '../lib/session.ts';
import {
  getAuthAccountByIdDb,
  getWorkspaceSettings,
  upsertGoogleMemberAccountDb,
} from '../db/repository.ts';
import type {
  AuthAccountProfile,
  PermissionKey,
  TeamUser,
  UserRole,
} from '../types/admin.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  account?: AuthAccountProfile;
  dbUser?: TeamUser;
}

function accountToTeamUser(account: AuthAccountProfile): TeamUser {
  return {
    id: account.id,
    name: account.displayName,
    email: account.email,
    role: account.isAdmin ? 'admin' : ('member' as UserRole),
    status: 'active',
    department: account.isAdmin ? 'Yönetim Merkezi' : 'Site Üyesi',
    avatarUrl: account.avatarUrl,
    lastActiveAt: 'Az önce',
    joinedAt: new Date().toISOString().slice(0, 10),
    postsPublished: 0,
  };
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

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Yetkisiz erişim: Geçersiz oturum belirteci.' });
  }

  try {
    // 1. Custom signed session token (used for single admin 'Noh' and registered password accounts)
    if (token.startsWith('kd.')) {
      const payload = verifySessionToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Oturum süresi dolmuş veya geçersiz.' });
      }
      const account = await getAuthAccountByIdDb(payload.sub);
      if (!account) {
        return res.status(401).json({ error: 'Hesap bulunamadı.' });
      }
      req.account = account;
      req.dbUser = accountToTeamUser(account);
      return next();
    }

    // 2. Google Firebase ID Token (always mapped as standard site member — never admin)
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    const account = await upsertGoogleMemberAccountDb({
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Site Üyesi',
      avatarUrl: decodedToken.picture,
    });

    req.account = account;
    req.dbUser = accountToTeamUser(account);
    return next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.account || !req.account.isAdmin || req.account.role !== 'admin') {
    return res.status(403).json({
      error: 'Yönetim paneline yalnızca tanımlı yönetici hesabı erişebilir.',
    });
  }
  return next();
};

export function requirePermission(permission: PermissionKey) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.account || !req.dbUser) {
        return res.status(401).json({ error: 'Oturum doğrulanamadı.' });
      }
      if (!req.account.isAdmin || req.account.role !== 'admin') {
        return res.status(403).json({
          error: 'Bu işlem yalnızca yönetici hesabı için yetkilidir.',
        });
      }
      const settings = await getWorkspaceSettings();
      const allowed = settings.rolePermissions.admin?.[permission] ?? true;
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
