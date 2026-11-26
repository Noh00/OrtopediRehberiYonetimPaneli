import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  authenticateWithPasswordDb,
  changeAccountPasswordDb,
  createPublicCommentDb,
  deleteCategoryDb,
  deleteCommentDb,
  deleteDoctorDb,
  deleteMediaDb,
  deleteMediaFolderDb,
  deleteMedicalNewsDb,
  deleteNotificationDb,
  deletePostDb,
  deleteRedirectDb,
  deleteRoleDb,
  deleteTagDb,
  deleteTaskDb,
  deleteUserDb,
  getFullWorkspaceData,
  getPublicHomeData,
  getWorkspaceSettings,
  inviteOrUpdateUserDb,
  markAllNotificationsReadDb,
  registerMemberAccountDb,
  updateAuthProfileDb,
  updateCommentDb,
  updateSettingsDb,
  upsertCategoryDb,
  upsertDoctorDb,
  upsertMediaDb,
  upsertMediaFolderDb,
  upsertMedicalNewsDb,
  upsertNotificationDb,
  upsertPostDb,
  upsertRedirectDb,
  upsertRoleDb,
  upsertTagDb,
  upsertTaskDb,
} from './src/db/repository.ts';
import { runSearchGroundedSeoResearch } from './src/lib/gemini.ts';
import { signSessionToken } from './src/lib/session.ts';
import {
  type AuthRequest,
  requireAdmin,
  requireAuth,
  requirePermission,
} from './src/middleware/auth.ts';
import type {
  AppNotification,
  BlogPost,
  Category,
  DoctorProfile,
  MediaAsset,
  MediaFolder,
  MedicalNewsItem,
  ModerationComment,
  PostStatus,
  RedirectRule,
  RoleDefinition,
  TagItem,
  TeamTask,
  TeamUser,
} from './src/types/admin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Health endpoint (non-sensitive)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Public blog homepage & published content (non-sensitive fields only)
app.get('/api/public/home', async (_req, res) => {
  try {
    const payload = await getPublicHomeData();
    res.json(payload);
  } catch (error: any) {
    console.error('GET /api/public/home failed:', error);
    res.status(500).json({ error: error?.message || 'Anasayfa verileri alınamadı.' });
  }
});

// Public comment submission (filtered & stored in PostgreSQL)
app.post('/api/public/comments', async (req, res) => {
  try {
    const { postId, authorName, content } = req.body as {
      postId?: string;
      authorName?: string;
      content?: string;
    };
    const cleanName = (authorName || '').trim();
    const cleanContent = (content || '').trim();

    if (!postId || cleanName.length < 2 || cleanContent.length < 4 || cleanContent.length > 2000) {
      return res.status(400).json({
        error: 'Geçerli bir ad (en az 2 karakter) ve yorum metni (4-2000 karakter) giriniz.',
      });
    }

    const comment = await createPublicCommentDb({
      postId,
      authorName: cleanName.slice(0, 80),
      content: cleanContent,
    });
    res.json({ ok: true, comment });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Yorum gönderilemedi.' });
  }
});

function isSafeAvatarUrl(url?: string): boolean {
  if (!url || !url.trim()) return true;
  const trimmed = url.trim();
  if (trimmed.length > 700000) return false;
  if (trimmed.startsWith('/')) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(trimmed)) return true;
  return false;
}

// Authentication & Account Profile Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body as {
      identifier?: string;
      password?: string;
    };
    if (!identifier?.trim() || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı/e-posta ve şifre zorunludur.' });
    }
    const account = await authenticateWithPasswordDb(identifier, password);
    if (!account) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
    }
    const token = signSessionToken(account.id);
    res.json({ ok: true, token, account });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Giriş işlemi başarısız oldu.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, displayName, email, password, avatarUrl } = req.body as {
      username?: string;
      displayName?: string;
      email?: string;
      password?: string;
      avatarUrl?: string;
    };

    const cleanUsername = (username || '').trim();
    const cleanName = (displayName || '').trim();
    const cleanEmail = (email || '').trim();

    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(cleanUsername)) {
      return res.status(400).json({
        error: 'Kullanıcı adı 3-30 karakter olmalı ve yalnızca harf, rakam, nokta veya alt çizgi içermelidir.',
      });
    }
    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({ error: 'Ad soyad en az 2 karakter olmalıdır.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
    }
    if (!password || password.length < 6 || password.length > 128) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır.' });
    }
    if (!isSafeAvatarUrl(avatarUrl)) {
      return res.status(400).json({ error: 'Geçersiz profil fotoğrafı bağlantısı.' });
    }

    const account = await registerMemberAccountDb({
      username: cleanUsername,
      displayName: cleanName,
      email: cleanEmail,
      password,
      avatarUrl,
    });
    const token = signSessionToken(account.id);
    res.status(201).json({ ok: true, token, account });
  } catch (error: any) {
    const status = error?.message?.includes('zaten kayıtlı') || error?.message?.includes('ayrılmıştır') ? 409 : 500;
    res.status(status).json({ error: error?.message || 'Kayıt işlemi tamamlanamadı.' });
  }
});

app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
  res.json({ ok: true, account: req.account });
});

app.put('/api/auth/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { displayName, avatarUrl, bio } = req.body as {
      displayName?: string;
      avatarUrl?: string;
      bio?: string;
    };
    const cleanName = (displayName || '').trim();
    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({ error: 'Ad soyad en az 2 karakter olmalıdır.' });
    }
    if (!isSafeAvatarUrl(avatarUrl)) {
      return res.status(400).json({ error: 'Geçersiz profil fotoğrafı bağlantısı.' });
    }
    const updated = await updateAuthProfileDb(req.account!.id, {
      displayName: cleanName,
      avatarUrl,
      bio: (bio || '').slice(0, 300),
    });
    res.json({ ok: true, account: updated });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Profil güncellenemedi.' });
  }
});

app.post('/api/auth/change-password', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };
    if (!currentPassword || !newPassword || newPassword.length < 6 || newPassword.length > 128) {
      return res.status(400).json({
        error: 'Mevcut şifreyi ve en az 6 karakterli yeni şifreyi giriniz.',
      });
    }
    await changeAccountPasswordDb(req.account!.id, currentPassword, newPassword);
    res.json({ ok: true });
  } catch (error: any) {
    const msg = error?.message || 'Şifre güncellenemedi.';
    const status = msg.includes('hatalı') ? 400 : 500;
    res.status(status).json({ error: msg });
  }
});

// Full workspace bootstrap for single authenticated Admin only
app.get('/api/workspace', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const data = await getFullWorkspaceData();
    res.json({
      ...data,
      currentUser: req.dbUser,
    });
  } catch (error: any) {
    console.error('GET /api/workspace failed:', error);
    res.status(500).json({ error: error?.message || 'Çalışma alanı yüklenemedi.' });
  }
});

// Posts
app.post('/api/posts', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const post = req.body as BlogPost;
    if (!post?.id || !post?.title || !post?.slug) {
      return res.status(400).json({ error: 'Yazı başlığı ve URL slug zorunludur.' });
    }
    if (post.status === 'published') {
      const settings = await getWorkspaceSettings();
      const canPublish = settings.rolePermissions[req.dbUser!.role]?.posts_publish;
      if (!canPublish) {
        return res.status(403).json({ error: 'Doğrudan yayınlama yetkiniz bulunmuyor.' });
      }
    }
    await upsertPostDb(post, req.user?.uid);
    res.json({ ok: true, post });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Yazı kaydedilemedi.' });
  }
});

app.post(
  '/api/posts/bulk-status',
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { ids, status } = req.body as { ids: string[]; status: PostStatus };
      if (!Array.isArray(ids) || !status) {
        return res.status(400).json({ error: 'Geçersiz toplu güncelleme isteği.' });
      }
      if (status === 'published') {
        const settings = await getWorkspaceSettings();
        if (!settings.rolePermissions[req.dbUser!.role]?.posts_publish) {
          return res.status(403).json({ error: 'Toplu yayınlama yetkiniz yok.' });
        }
      }
      const data = await getFullWorkspaceData();
      const targets = data.posts.filter((p) => ids.includes(p.id));
      for (const p of targets) {
        await upsertPostDb({ ...p, status, updatedAt: new Date().toISOString().slice(0, 10) });
      }
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Toplu güncelleme başarısız.' });
    }
  }
);

app.delete(
  '/api/posts/:id',
  requireAuth,
  requireAdmin,
  requirePermission('posts_delete'),
  async (req, res) => {
    try {
      await deletePostDb(String(req.params.id));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Yazı silinemedi.' });
    }
  }
);

// Categories & Tags
app.post('/api/categories', requireAuth, requireAdmin, async (req, res) => {
  try {
    const cat = req.body as Category;
    if (!cat?.id || !cat?.name) {
      return res.status(400).json({ error: 'Kategori adı zorunludur.' });
    }
    await upsertCategoryDb(cat);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Kategori kaydedilemedi.' });
  }
});

app.delete('/api/categories/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await deleteCategoryDb(String(req.params.id));
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Kategori silinemedi.' });
  }
});

app.post('/api/tags', requireAuth, requireAdmin, async (req, res) => {
  try {
    const tag = req.body as TagItem;
    if (!tag?.id || !tag?.name) {
      return res.status(400).json({ error: 'Etiket adı zorunludur.' });
    }
    await upsertTagDb(tag);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Etiket kaydedilemedi.' });
  }
});

app.delete('/api/tags/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await deleteTagDb(String(req.params.id));
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Etiket silinemedi.' });
  }
});

function isSafeMediaUrl(url?: string): boolean {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim();
  if (trimmed.length > 24 * 1024 * 1024) return false;
  if (trimmed.startsWith('/')) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,/i.test(trimmed)) return true;
  if (/^data:video\/(mp4|webm|ogg|quicktime);base64,/i.test(trimmed)) return true;
  return false;
}

// Media
app.post(
  '/api/media',
  requireAuth,
  requireAdmin,
  requirePermission('media_manage'),
  async (req, res) => {
    try {
      const asset = req.body as MediaAsset;
      if (!asset?.id || !asset?.url || !isSafeMediaUrl(asset.url)) {
        return res.status(400).json({ error: 'Medya varlığı veya URL biçimi geçersiz.' });
      }
      await upsertMediaDb(asset);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Medya kaydedilemedi.' });
    }
  }
);

app.delete(
  '/api/media/:id',
  requireAuth,
  requireAdmin,
  requirePermission('media_manage'),
  async (req, res) => {
    try {
      await deleteMediaDb(String(req.params.id));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Medya silinemedi.' });
    }
  }
);

// Media Folders
app.post(
  '/api/media/folders',
  requireAuth,
  requireAdmin,
  requirePermission('media_manage'),
  async (req, res) => {
    try {
      const folder = req.body as MediaFolder;
      if (!folder?.id || !folder?.name?.trim()) {
        return res.status(400).json({ error: 'Klasör adı zorunludur.' });
      }
      await upsertMediaFolderDb({
        id: folder.id,
        name: folder.name.trim(),
        color: /^#[0-9a-fA-F]{6}$/.test(folder.color || '') ? folder.color : '#2563EB',
        createdAt: folder.createdAt || new Date().toISOString().slice(0, 10),
      });
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Klasör kaydedilemedi.' });
    }
  }
);

app.delete(
  '/api/media/folders/:id',
  requireAuth,
  requireAdmin,
  requirePermission('media_manage'),
  async (req, res) => {
    try {
      await deleteMediaFolderDb(String(req.params.id));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Klasör silinemedi.' });
    }
  }
);

// Medical News
app.post('/api/news', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = req.body as MedicalNewsItem;
    if (!item?.id || !item?.title?.trim()) {
      return res.status(400).json({ error: 'Haber başlığı zorunludur.' });
    }
    await upsertMedicalNewsDb(item);
    res.json({ ok: true, item });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Haber kaydedilemedi.' });
  }
});

app.delete('/api/news/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await deleteMedicalNewsDb(String(req.params.id));
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Haber silinemedi.' });
  }
});

// Site SEO, Site Brand, Permissions, Spam, Notification Preferences
app.put('/api/settings', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const body = req.body;
    const settings = await getWorkspaceSettings();
    const rolePerms = settings.rolePermissions[req.dbUser!.role];

    if (body.siteSeo && !rolePerms?.seo_manage) {
      return res.status(403).json({ error: 'SEO ayarlarını değiştirme yetkiniz yok.' });
    }
    if (body.siteBrand && !rolePerms?.seo_manage && !rolePerms?.users_manage) {
      return res.status(403).json({ error: 'Site tasarımı ve marka ayarlarını değiştirme yetkiniz yok.' });
    }
    if (body.rolePermissions && !rolePerms?.users_manage) {
      return res.status(403).json({ error: 'Rol yetkilerini değiştirme yetkiniz yok.' });
    }
    if (body.spamConfig && !rolePerms?.moderation_resolve) {
      return res.status(403).json({ error: 'Moderasyon kurallarını değiştirme yetkiniz yok.' });
    }

    await updateSettingsDb({
      siteSeo: body.siteSeo,
      siteBrand: body.siteBrand,
      rolePermissions: body.rolePermissions,
      spamConfig: body.spamConfig,
      notificationPrefs: body.notificationPrefs,
    });
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Ayarlar kaydedilemedi.' });
  }
});

// Redirects
app.post(
  '/api/redirects',
  requireAuth,
  requirePermission('seo_manage'),
  async (req, res) => {
    try {
      const rule = req.body as RedirectRule;
      if (!rule?.id || !rule?.sourcePath || !rule?.targetPath) {
        return res.status(400).json({ error: 'Kaynak ve hedef URL zorunludur.' });
      }
      await upsertRedirectDb(rule);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Yönlendirme kaydedilemedi.' });
    }
  }
);

app.delete(
  '/api/redirects/:id',
  requireAuth,
  requirePermission('seo_manage'),
  async (req, res) => {
    try {
      await deleteRedirectDb(String(req.params.id));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Yönlendirme silinemedi.' });
    }
  }
);

// Users
app.post(
  '/api/users',
  requireAuth,
  requirePermission('users_manage'),
  async (req, res) => {
    try {
      const user = req.body as TeamUser;
      if (!user?.id || !user?.email || !user?.name) {
        return res.status(400).json({ error: 'Kullanıcı bilgileri eksik.' });
      }
      await inviteOrUpdateUserDb(user);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Kullanıcı kaydedilemedi.' });
    }
  }
);

app.delete(
  '/api/users/:id',
  requireAuth,
  requirePermission('users_manage'),
  async (req: AuthRequest, res) => {
    try {
      const targetId = String(req.params.id);
      if (targetId === req.user?.uid || targetId === req.dbUser?.id) {
        return res.status(400).json({ error: 'Aktif kendi hesabınızı silemezsiniz.' });
      }
      await deleteUserDb(targetId);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Kullanıcı silinemedi.' });
    }
  }
);

// Custom Roles
app.post(
  '/api/roles',
  requireAuth,
  requirePermission('users_manage'),
  async (req, res) => {
    try {
      const role = req.body as RoleDefinition;
      if (!role?.key || !role?.name || !role?.permissions) {
        return res.status(400).json({ error: 'Rol anahtarı, adı ve yetkileri zorunludur.' });
      }
      await upsertRoleDb(role);
      res.json({ ok: true, role });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Rol tanımı kaydedilemedi.' });
    }
  }
);

app.delete(
  '/api/roles/:key',
  requireAuth,
  requirePermission('users_manage'),
  async (req, res) => {
    try {
      await deleteRoleDb(String(req.params.key));
      res.json({ ok: true });
    } catch (error: any) {
      const status = error?.message === 'Sistem varsayılan rolleri silinemez.' ? 400 : 500;
      res.status(status).json({ error: error?.message || 'Rol tanımı silinemedi.' });
    }
  }
);

// Doctors / Medical Specialists
app.post('/api/doctors', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const settings = await getWorkspaceSettings();
    const rolePerms = settings.rolePermissions[req.dbUser!.role];
    if (!rolePerms?.users_manage && !rolePerms?.posts_publish) {
      return res.status(403).json({ error: 'Doktor kaydı düzenleme yetkiniz bulunmuyor.' });
    }
    const doctor = req.body as DoctorProfile;
    if (!doctor?.id || !doctor?.fullName || !doctor?.specialty) {
      return res.status(400).json({ error: 'Doktor adı ve uzmanlık alanı zorunludur.' });
    }
    await upsertDoctorDb(doctor);
    res.json({ ok: true, doctor });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Doktor kaydı kaydedilemedi.' });
  }
});

app.delete('/api/doctors/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const settings = await getWorkspaceSettings();
    const rolePerms = settings.rolePermissions[req.dbUser!.role];
    if (!rolePerms?.users_manage && !rolePerms?.posts_publish) {
      return res.status(403).json({ error: 'Doktor kaydı silme yetkiniz bulunmuyor.' });
    }
    await deleteDoctorDb(String(req.params.id));
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Doktor kaydı silinemedi.' });
  }
});

// Moderation Comments
app.put(
  '/api/comments/:id',
  requireAuth,
  requirePermission('moderation_resolve'),
  async (req, res) => {
    try {
      const comment = req.body as ModerationComment;
      await updateCommentDb(comment);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Yorum güncellenemedi.' });
    }
  }
);

app.delete(
  '/api/comments/:id',
  requireAuth,
  requirePermission('moderation_resolve'),
  async (req, res) => {
    try {
      await deleteCommentDb(String(req.params.id));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Yorum silinemedi.' });
    }
  }
);

// Tasks
app.post(
  '/api/tasks',
  requireAuth,
  requirePermission('calendar_manage'),
  async (req, res) => {
    try {
      const task = req.body as TeamTask;
      if (!task?.id || !task?.title) {
        return res.status(400).json({ error: 'Görev başlığı zorunludur.' });
      }
      await upsertTaskDb(task);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Görev kaydedilemedi.' });
    }
  }
);

app.delete(
  '/api/tasks/:id',
  requireAuth,
  requirePermission('calendar_manage'),
  async (req, res) => {
    try {
      await deleteTaskDb(String(req.params.id));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'Görev silinemedi.' });
    }
  }
);

// Notifications
app.post('/api/notifications', requireAuth, requireAdmin, async (req, res) => {
  try {
    const n = req.body as AppNotification;
    await upsertNotificationDb(n);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Bildirim kaydedilemedi.' });
  }
});

app.post('/api/notifications/mark-all-read', requireAuth, requireAdmin, async (_req, res) => {
  try {
    await markAllNotificationsReadDb();
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Bildirimler güncellenemedi.' });
  }
});

app.delete('/api/notifications/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await deleteNotificationDb(String(req.params.id));
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Bildirim silinemedi.' });
  }
});

// Gemini 4 Hydrogen + Google Search Grounding for live SEO & editorial research
app.post('/api/seo/research', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { query, focusKeyword, postTitle, mode } = req.body as {
      query?: string;
      focusKeyword?: string;
      postTitle?: string;
      mode?: 'seo_insights' | 'article_fact_check';
    };

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Lütfen en az 2 karakterlik bir araştırma konusu girin.' });
    }

    const result = await runSearchGroundedSeoResearch({
      query: query.trim(),
      focusKeyword: focusKeyword?.trim(),
      postTitle: postTitle?.trim(),
      mode,
    });

    res.json(result);
  } catch (error: any) {
    console.error('POST /api/seo/research failed:', error);
    const status = typeof error?.status === 'number' ? error.status : 500;
    res.status(status).json({
      error:
        error?.message ||
        'Google Arama verisi alınırken bir hata oluştu. Lütfen Gemini API anahtarını kontrol edin.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KalemDesk server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
