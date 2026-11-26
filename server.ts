import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  deleteCategoryDb,
  deleteCommentDb,
  deleteDoctorDb,
  deleteMediaDb,
  deleteNotificationDb,
  deletePostDb,
  deleteRedirectDb,
  deleteRoleDb,
  deleteTagDb,
  deleteTaskDb,
  getFullWorkspaceData,
  getWorkspaceSettings,
  inviteOrUpdateUserDb,
  markAllNotificationsReadDb,
  updateCommentDb,
  updateSettingsDb,
  upsertCategoryDb,
  upsertDoctorDb,
  upsertMediaDb,
  upsertNotificationDb,
  upsertPostDb,
  upsertRedirectDb,
  upsertRoleDb,
  upsertTagDb,
  upsertTaskDb,
} from './src/db/repository.ts';
import { runSearchGroundedSeoResearch } from './src/lib/gemini.ts';
import { type AuthRequest, requireAuth, requirePermission } from './src/middleware/auth.ts';
import type {
  AppNotification,
  BlogPost,
  Category,
  DoctorProfile,
  MediaAsset,
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

app.use(express.json({ limit: '5mb' }));

// Health endpoint (non-sensitive)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Full workspace bootstrap for authenticated user
app.get('/api/workspace', requireAuth, async (req: AuthRequest, res) => {
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
app.post('/api/posts', requireAuth, async (req: AuthRequest, res) => {
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
app.post('/api/categories', requireAuth, async (req, res) => {
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

app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  try {
    await deleteCategoryDb(String(req.params.id));
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Kategori silinemedi.' });
  }
});

app.post('/api/tags', requireAuth, async (req, res) => {
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

app.delete('/api/tags/:id', requireAuth, async (req, res) => {
  try {
    await deleteTagDb(String(req.params.id));
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Etiket silinemedi.' });
  }
});

// Media
app.post(
  '/api/media',
  requireAuth,
  requirePermission('media_manage'),
  async (req, res) => {
    try {
      const asset = req.body as MediaAsset;
      if (!asset?.id || !asset?.url) {
        return res.status(400).json({ error: 'Medya varlığı geçersiz.' });
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

// Site SEO, Site Brand, Permissions, Spam, Notification Preferences
app.put('/api/settings', requireAuth, async (req: AuthRequest, res) => {
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
app.post('/api/doctors', requireAuth, async (req: AuthRequest, res) => {
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

app.delete('/api/doctors/:id', requireAuth, async (req: AuthRequest, res) => {
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
app.post('/api/notifications', requireAuth, async (req, res) => {
  try {
    const n = req.body as AppNotification;
    await upsertNotificationDb(n);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Bildirim kaydedilemedi.' });
  }
});

app.post('/api/notifications/mark-all-read', requireAuth, async (_req, res) => {
  try {
    await markAllNotificationsReadDb();
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Bildirimler güncellenemedi.' });
  }
});

app.delete('/api/notifications/:id', requireAuth, async (req, res) => {
  try {
    await deleteNotificationDb(String(req.params.id));
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Bildirim silinemedi.' });
  }
});

// Gemini 4 Hydrogen + Google Search Grounding for live SEO & editorial research
app.post('/api/seo/research', requireAuth, async (req: AuthRequest, res) => {
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
