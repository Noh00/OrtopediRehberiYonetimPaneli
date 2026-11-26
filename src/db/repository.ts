import crypto from 'crypto';
import { desc, eq, or } from 'drizzle-orm';
import { db } from './index.ts';
import {
  authAccounts,
  categories,
  comments,
  customRoles,
  doctors,
  mediaAssets,
  mediaFolders,
  medicalNews,
  notifications,
  posts,
  redirects,
  siteSettings,
  tags,
  tasks,
  users,
} from './schema.ts';
import { hashPassword, verifyPassword } from '../lib/session.ts';
import {
  INITIAL_MEDIA,
  INITIAL_NOTIFICATION_PREFS,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_ROLES,
  INITIAL_SITE_BRAND,
  INITIAL_SITE_SEO,
  INITIAL_SPAM_CONFIG,
} from '../data/initialData.ts';
import type {
  AppNotification,
  AuthAccountProfile,
  BlogPost,
  Category,
  DoctorProfile,
  MediaAsset,
  MediaFolder,
  MedicalNewsItem,
  ModerationComment,
  NotificationPreferences,
  PublicAuthorSummary,
  PublicCommentItem,
  PublicHomePayload,
  RedirectRule,
  RoleDefinition,
  RolePermissionMatrix,
  SiteBrandConfig,
  SiteSeoConfig,
  SpamFilterConfig,
  TagItem,
  TeamTask,
  TeamUser,
  UserRole,
} from '../types/admin.ts';

const INITIAL_ADMIN_SCRYPT_HASH =
  '940473c7aece8f97e42f89080c1cf06b:084e948b3860136b2774dbbb39c7e8fb6ad5af9b777ea67cddf87fe9027ea089d5c89415affa766aae1f32d19a151ff4fe000d298a23ac225ed8a2d7a23a4bc0';

export async function ensureWorkspaceSeeded(): Promise<void> {
  try {
    const existingSettings = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, 'default'))
      .limit(1);

    if (existingSettings.length === 0) {
      await db
        .insert(siteSettings)
        .values({
          id: 'default',
          siteSeo: INITIAL_SITE_SEO,
          siteBrand: INITIAL_SITE_BRAND,
          rolePermissions: INITIAL_ROLE_PERMISSIONS,
          spamConfig: INITIAL_SPAM_CONFIG,
          notificationPrefs: INITIAL_NOTIFICATION_PREFS,
        })
        .onConflictDoNothing();
    } else if (!existingSettings[0].siteBrand) {
      await db
        .update(siteSettings)
        .set({ siteBrand: INITIAL_SITE_BRAND })
        .where(eq(siteSettings.id, 'default'));
    }

    const existingRoles = await db.select().from(customRoles).limit(1);
    if (existingRoles.length === 0) {
      for (const r of INITIAL_ROLES) {
        await db.insert(customRoles).values(r).onConflictDoNothing();
      }
    }

    // Ensure the single administrator profile ('Noh') exists in auth_accounts
    const existingAdmin = await db
      .select({ id: authAccounts.id })
      .from(authAccounts)
      .where(eq(authAccounts.isAdmin, true))
      .limit(1);

    if (existingAdmin.length === 0) {
      await db
        .insert(authAccounts)
        .values({
          id: 'acc-admin-noh',
          username: 'noh',
          displayUsername: 'Noh',
          email: 'noh@yonetim.local',
          displayName: 'Noh',
          avatarUrl: null,
          bio: 'Tek Yetkili Site Yöneticisi',
          role: 'admin',
          isAdmin: true,
          passwordHash: INITIAL_ADMIN_SCRYPT_HASH,
          firebaseUid: null,
          provider: 'password',
        })
        .onConflictDoNothing();
    }

    if (existingSettings.length > 0) {
      return;
    }

    // Seed visual assets once on a brand new empty database (excluded from fake data purge)
    for (const m of INITIAL_MEDIA) {
      await db.insert(mediaAssets).values(m).onConflictDoNothing();
    }
  } catch (error) {
    console.error('Database seed failed:', error);
    throw new Error('Çalışma alanı başlangıç verileri yüklenemedi.', { cause: error });
  }
}

function mapDbUserToTeamUser(row: typeof users.$inferSelect): TeamUser {
  const canonicalId = row.uid.startsWith('seed-') ? row.uid.replace('seed-', '') : row.uid;
  return {
    id: canonicalId,
    name: row.name,
    email: row.email,
    role: row.role as UserRole,
    status: row.status as 'active' | 'suspended',
    avatarUrl: row.avatarUrl || undefined,
    department: row.department,
    lastActiveAt: row.lastActiveAt,
    joinedAt: row.joinedAt,
    postsPublished: row.postsPublished,
  };
}

export async function getOrCreateDbUser(input: {
  uid: string;
  email: string;
  name: string;
  avatarUrl?: string;
}): Promise<TeamUser> {
  try {
    await ensureWorkspaceSeeded();
    const nowFormatted = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const today = new Date().toISOString().slice(0, 10);

    const existingByUid = await db
      .select()
      .from(users)
      .where(eq(users.uid, input.uid))
      .limit(1);

    if (existingByUid.length > 0) {
      const updated = await db
        .update(users)
        .set({
          email: input.email || existingByUid[0].email,
          name: input.name || existingByUid[0].name,
          avatarUrl: input.avatarUrl || existingByUid[0].avatarUrl,
          lastActiveAt: nowFormatted,
        })
        .where(eq(users.uid, input.uid))
        .returning();
      return mapDbUserToTeamUser(updated[0]);
    }

    // Check if an admin pre-invited this email
    const invitedByEmail = input.email
      ? await db.select().from(users).where(eq(users.email, input.email)).limit(1)
      : [];

    const initialRole: UserRole =
      invitedByEmail.length > 0
        ? (invitedByEmail[0].role as UserRole)
        : 'member';

    const result = await db
      .insert(users)
      .values({
        uid: input.uid,
        email: input.email,
        name: input.name,
        role: initialRole,
        status: 'active',
        department:
          invitedByEmail[0]?.department || 'Genel Yayın Yönetimi',
        avatarUrl: input.avatarUrl || null,
        postsPublished: invitedByEmail[0]?.postsPublished ?? 0,
        lastActiveAt: nowFormatted,
        joinedAt: today,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: input.email,
          name: input.name,
          lastActiveAt: nowFormatted,
        },
      })
      .returning();

    return mapDbUserToTeamUser(result[0]);
  } catch (error) {
    console.error('getOrCreateDbUser failed:', error);
    throw new Error('Kullanıcı profili senkronize edilemedi.', { cause: error });
  }
}

export async function getWorkspaceSettings() {
  try {
    await ensureWorkspaceSeeded();
    const [rows, roleRows] = await Promise.all([
      db.select().from(siteSettings).where(eq(siteSettings.id, 'default')).limit(1),
      db.select().from(customRoles),
    ]);
    const row = rows[0];
    const mergedPerms: RolePermissionMatrix = { ...(row.rolePermissions || INITIAL_ROLE_PERMISSIONS) };
    for (const r of roleRows) {
      if (!mergedPerms[r.key]) {
        mergedPerms[r.key] = r.permissions;
      }
    }
    return {
      ...row,
      siteBrand: row.siteBrand || INITIAL_SITE_BRAND,
      rolePermissions: mergedPerms,
    };
  } catch (error) {
    console.error('getWorkspaceSettings failed:', error);
    throw new Error('Site ayarları yüklenemedi.', { cause: error });
  }
}

export async function getFullWorkspaceData() {
  try {
    await ensureWorkspaceSeeded();
    const [
      postRows,
      catRows,
      tagRows,
      mediaRows,
      folderRows,
      settingsRow,
      redirectRows,
      commentRows,
      taskRows,
      notifRows,
      userRows,
      roleRows,
      doctorRows,
      newsRows,
    ] = await Promise.all([
      db.select().from(posts).orderBy(desc(posts.updatedAt)),
      db.select().from(categories),
      db.select().from(tags),
      db.select().from(mediaAssets).orderBy(desc(mediaAssets.uploadedAt)),
      db.select().from(mediaFolders).orderBy(mediaFolders.name),
      db.select().from(siteSettings).where(eq(siteSettings.id, 'default')).limit(1),
      db.select().from(redirects),
      db.select().from(comments).orderBy(desc(comments.createdAt)),
      db.select().from(tasks).orderBy(desc(tasks.createdAt)),
      db.select().from(notifications).orderBy(desc(notifications.id)),
      db.select().from(users),
      db.select().from(customRoles),
      db.select().from(doctors).orderBy(desc(doctors.updatedAt)),
      db.select().from(medicalNews).orderBy(desc(medicalNews.publishedAt)),
    ]);

    const settings = settingsRow[0];
    const rolePermissions: RolePermissionMatrix = {
      ...(settings.rolePermissions || INITIAL_ROLE_PERMISSIONS),
    };

    const roles: RoleDefinition[] = roleRows.map((r) => {
      const effectivePerms = rolePermissions[r.key] ?? r.permissions;
      rolePermissions[r.key] = effectivePerms;
      return {
        key: r.key,
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
        permissions: effectivePerms,
        createdAt: r.createdAt,
      };
    });

    return {
      posts: postRows.map((p): BlogPost => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        categoryId: p.categoryId,
        tags: p.tags,
        authorId: p.authorId,
        status: p.status as BlogPost['status'],
        coverImage: p.coverImage,
        coverAlt: p.coverAlt,
        publishedAt: p.publishedAt,
        scheduledFor: p.scheduledFor || undefined,
        updatedAt: p.updatedAt,
        readTimeMin: p.readTimeMin,
        views: p.views,
        organicViews: p.organicViews,
        avgReadDurationSec: p.avgReadDurationSec,
        bounceRate: p.bounceRate,
        commentsCount: p.commentsCount,
        featured: p.featured,
        seo: p.seo,
      })),
      categories: catRows.map((c): Category => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        color: c.color,
      })),
      tags: tagRows.map((t): TagItem => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
      })),
      mediaAssets: mediaRows.map((m): MediaAsset => ({
        id: m.id,
        title: m.title,
        url: m.url,
        altText: m.altText,
        mimeType: m.mimeType,
        sizeKb: m.sizeKb,
        dimensions: m.dimensions,
        uploadedAt: m.uploadedAt,
        uploadedBy: m.uploadedBy,
        folderId: m.folderId || undefined,
      })),
      mediaFolders: folderRows.map((f): MediaFolder => ({
        id: f.id,
        name: f.name,
        color: f.color,
        createdAt: f.createdAt,
      })),
      siteSeo: settings.siteSeo,
      siteBrand: settings.siteBrand || INITIAL_SITE_BRAND,
      rolePermissions,
      roles,
      doctors: doctorRows.map((d): DoctorProfile => ({
        id: d.id,
        fullName: d.fullName,
        title: d.title,
        specialty: d.specialty,
        licenseNo: d.licenseNo,
        department: d.department,
        bio: d.bio,
        avatarUrl: d.avatarUrl,
        email: d.email,
        phone: d.phone,
        location: d.location,
        languages: d.languages,
        availableDays: d.availableDays,
        featured: d.featured,
        status: d.status as DoctorProfile['status'],
        updatedAt: d.updatedAt,
      })),
      news: newsRows.map((n): MedicalNewsItem => ({
        id: n.id,
        title: n.title,
        summary: n.summary,
        source: n.source,
        publishedAt: n.publishedAt,
        categoryLabel: n.categoryLabel,
        imageUrl: n.imageUrl,
        doctorName: n.doctorName,
      })),
      spamConfig: settings.spamConfig,
      notificationPrefs: settings.notificationPrefs,
      redirects: redirectRows.map((r): RedirectRule => ({
        id: r.id,
        sourcePath: r.sourcePath,
        targetPath: r.targetPath,
        statusCode: r.statusCode as 301 | 302,
        hits: r.hits,
        active: r.active,
        createdAt: r.createdAt,
      })),
      comments: commentRows.map((c): ModerationComment => ({
        id: c.id,
        postId: c.postId,
        authorName: c.authorName,
        authorEmail: c.authorEmail,
        authorIp: c.authorIp,
        content: c.content,
        createdAt: c.createdAt,
        status: c.status as ModerationComment['status'],
        reportReason: c.reportReason || undefined,
        flaggedWords: c.flaggedWords,
        moderatorReply: c.moderatorReply || undefined,
        isBlockedUser: c.isBlockedUser,
      })),
      tasks: taskRows.map((t): TeamTask => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status as TeamTask['status'],
        priority: t.priority as TeamTask['priority'],
        assigneeId: t.assigneeId,
        dueDate: t.dueDate,
        linkedPostId: t.linkedPostId || undefined,
        tags: t.tags,
        createdAt: t.createdAt,
      })),
      notifications: notifRows.map((n): AppNotification => ({
        id: n.id,
        title: n.title,
        message: n.message,
        category: n.category as AppNotification['category'],
        createdAt: n.createdAt,
        read: n.read,
        targetSection: n.targetSection as AppNotification['targetSection'],
        targetEntityId: n.targetEntityId || undefined,
      })),
      users: userRows.map(mapDbUserToTeamUser),
    };
  } catch (error) {
    console.error('getFullWorkspaceData failed:', error);
    throw new Error('Yönetim paneli verileri veritabanından alınamadı.', { cause: error });
  }
}

// Mutations
export async function upsertPostDb(post: BlogPost, ownerUid?: string) {
  try {
    await db
      .insert(posts)
      .values({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        categoryId: post.categoryId,
        tags: post.tags,
        authorId: post.authorId,
        status: post.status,
        coverImage: post.coverImage,
        coverAlt: post.coverAlt,
        publishedAt: post.publishedAt,
        scheduledFor: post.scheduledFor || null,
        updatedAt: post.updatedAt,
        readTimeMin: post.readTimeMin,
        views: post.views,
        organicViews: post.organicViews,
        avgReadDurationSec: post.avgReadDurationSec,
        bounceRate: post.bounceRate,
        commentsCount: post.commentsCount,
        featured: post.featured,
        seo: post.seo,
        ownerUid: ownerUid || null,
      })
      .onConflictDoUpdate({
        target: posts.id,
        set: {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          categoryId: post.categoryId,
          tags: post.tags,
          authorId: post.authorId,
          status: post.status,
          coverImage: post.coverImage,
          coverAlt: post.coverAlt,
          publishedAt: post.publishedAt,
          scheduledFor: post.scheduledFor || null,
          updatedAt: post.updatedAt,
          readTimeMin: post.readTimeMin,
          featured: post.featured,
          seo: post.seo,
        },
      });
  } catch (error: any) {
    console.error('upsertPostDb failed:', error);
    if (error?.code === '23505') {
      throw new Error('Bu URL slug başka bir yazıda kullanılıyor. Lütfen farklı bir slug belirleyin.', {
        cause: error,
      });
    }
    throw new Error('Blog yazısı kaydedilemedi.', { cause: error });
  }
}

export async function deletePostDb(id: string) {
  try {
    await db.delete(posts).where(eq(posts.id, id));
  } catch (error) {
    console.error('deletePostDb failed:', error);
    throw new Error('Blog yazısı silinemedi.', { cause: error });
  }
}

export async function upsertCategoryDb(cat: Category) {
  try {
    await db
      .insert(categories)
      .values(cat)
      .onConflictDoUpdate({
        target: categories.id,
        set: { name: cat.name, slug: cat.slug, description: cat.description, color: cat.color },
      });
  } catch (error: any) {
    console.error('upsertCategoryDb failed:', error);
    if (error?.code === '23505') {
      throw new Error('Bu kategori slug zaten kullanılıyor.', { cause: error });
    }
    throw new Error('Kategori kaydedilemedi.', { cause: error });
  }
}

export async function deleteCategoryDb(id: string) {
  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (error) {
    console.error('deleteCategoryDb failed:', error);
    throw new Error('Kategori silinemedi.', { cause: error });
  }
}

export async function upsertTagDb(tag: TagItem) {
  try {
    await db
      .insert(tags)
      .values(tag)
      .onConflictDoUpdate({
        target: tags.id,
        set: { name: tag.name, slug: tag.slug },
      });
  } catch (error: any) {
    console.error('upsertTagDb failed:', error);
    if (error?.code === '23505') {
      throw new Error('Bu etiket slug zaten kullanılıyor.', { cause: error });
    }
    throw new Error('Etiket kaydedilemedi.', { cause: error });
  }
}

export async function deleteTagDb(id: string) {
  try {
    await db.delete(tags).where(eq(tags.id, id));
  } catch (error) {
    console.error('deleteTagDb failed:', error);
    throw new Error('Etiket silinemedi.', { cause: error });
  }
}

export async function upsertMediaDb(asset: MediaAsset) {
  try {
    await db
      .insert(mediaAssets)
      .values({
        id: asset.id,
        title: asset.title,
        url: asset.url,
        altText: asset.altText,
        mimeType: asset.mimeType,
        sizeKb: asset.sizeKb,
        dimensions: asset.dimensions,
        uploadedAt: asset.uploadedAt,
        uploadedBy: asset.uploadedBy,
        folderId: asset.folderId || null,
      })
      .onConflictDoUpdate({
        target: mediaAssets.id,
        set: {
          title: asset.title,
          altText: asset.altText,
          folderId: asset.folderId || null,
        },
      });
  } catch (error) {
    console.error('upsertMediaDb failed:', error);
    throw new Error('Medya varlığı kaydedilemedi.', { cause: error });
  }
}

export async function deleteMediaDb(id: string) {
  try {
    await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  } catch (error) {
    console.error('deleteMediaDb failed:', error);
    throw new Error('Medya varlığı silinemedi.', { cause: error });
  }
}

export async function upsertMediaFolderDb(folder: MediaFolder) {
  try {
    await db
      .insert(mediaFolders)
      .values({
        id: folder.id,
        name: folder.name,
        color: folder.color,
        createdAt: folder.createdAt,
      })
      .onConflictDoUpdate({
        target: mediaFolders.id,
        set: {
          name: folder.name,
          color: folder.color,
        },
      });
  } catch (error) {
    console.error('upsertMediaFolderDb failed:', error);
    throw new Error('Klasör kaydedilemedi.', { cause: error });
  }
}

export async function deleteMediaFolderDb(id: string) {
  try {
    await db
      .update(mediaAssets)
      .set({ folderId: null })
      .where(eq(mediaAssets.folderId, id));
    await db.delete(mediaFolders).where(eq(mediaFolders.id, id));
  } catch (error) {
    console.error('deleteMediaFolderDb failed:', error);
    throw new Error('Klasör silinemedi.', { cause: error });
  }
}

export async function upsertMedicalNewsDb(item: MedicalNewsItem) {
  try {
    await db
      .insert(medicalNews)
      .values({
        id: item.id,
        title: item.title,
        summary: item.summary,
        source: item.source,
        publishedAt: item.publishedAt,
        categoryLabel: item.categoryLabel,
        imageUrl: item.imageUrl,
        doctorName: item.doctorName,
      })
      .onConflictDoUpdate({
        target: medicalNews.id,
        set: {
          title: item.title,
          summary: item.summary,
          source: item.source,
          publishedAt: item.publishedAt,
          categoryLabel: item.categoryLabel,
          imageUrl: item.imageUrl,
          doctorName: item.doctorName,
        },
      });
  } catch (error) {
    console.error('upsertMedicalNewsDb failed:', error);
    throw new Error('Haber kaydı kaydedilemedi.', { cause: error });
  }
}

export async function deleteMedicalNewsDb(id: string) {
  try {
    await db.delete(medicalNews).where(eq(medicalNews.id, id));
  } catch (error) {
    console.error('deleteMedicalNewsDb failed:', error);
    throw new Error('Haber kaydı silinemedi.', { cause: error });
  }
}

export async function updateSettingsDb(partial: {
  siteSeo?: SiteSeoConfig;
  siteBrand?: SiteBrandConfig;
  rolePermissions?: RolePermissionMatrix;
  spamConfig?: SpamFilterConfig;
  notificationPrefs?: NotificationPreferences;
}) {
  try {
    await db
      .update(siteSettings)
      .set({
        ...partial,
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, 'default'));

    if (partial.rolePermissions) {
      const roleKeys = Object.keys(partial.rolePermissions);
      for (const key of roleKeys) {
        await db
          .update(customRoles)
          .set({ permissions: partial.rolePermissions[key] })
          .where(eq(customRoles.key, key));
      }
    }
  } catch (error) {
    console.error('updateSettingsDb failed:', error);
    throw new Error('Ayarlar güncellenemedi.', { cause: error });
  }
}

export async function upsertRedirectDb(rule: RedirectRule) {
  try {
    await db
      .insert(redirects)
      .values(rule)
      .onConflictDoUpdate({
        target: redirects.id,
        set: {
          sourcePath: rule.sourcePath,
          targetPath: rule.targetPath,
          statusCode: rule.statusCode,
          active: rule.active,
        },
      });
  } catch (error) {
    console.error('upsertRedirectDb failed:', error);
    throw new Error('Yönlendirme kuralı kaydedilemedi.', { cause: error });
  }
}

export async function deleteRedirectDb(id: string) {
  try {
    await db.delete(redirects).where(eq(redirects.id, id));
  } catch (error) {
    console.error('deleteRedirectDb failed:', error);
    throw new Error('Yönlendirme kuralı silinemedi.', { cause: error });
  }
}

export async function updateCommentDb(cm: ModerationComment) {
  try {
    await db
      .update(comments)
      .set({
        status: cm.status,
        moderatorReply: cm.moderatorReply || null,
        isBlockedUser: Boolean(cm.isBlockedUser),
      })
      .where(eq(comments.id, cm.id));
  } catch (error) {
    console.error('updateCommentDb failed:', error);
    throw new Error('Yorum güncellenemedi.', { cause: error });
  }
}

export async function deleteCommentDb(id: string) {
  try {
    await db.delete(comments).where(eq(comments.id, id));
  } catch (error) {
    console.error('deleteCommentDb failed:', error);
    throw new Error('Yorum silinemedi.', { cause: error });
  }
}

export async function upsertTaskDb(task: TeamTask) {
  try {
    await db
      .insert(tasks)
      .values({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
        linkedPostId: task.linkedPostId || null,
        tags: task.tags,
        createdAt: task.createdAt,
      })
      .onConflictDoUpdate({
        target: tasks.id,
        set: {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigneeId: task.assigneeId,
          dueDate: task.dueDate,
          linkedPostId: task.linkedPostId || null,
          tags: task.tags,
        },
      });
  } catch (error) {
    console.error('upsertTaskDb failed:', error);
    throw new Error('Görev kaydedilemedi.', { cause: error });
  }
}

export async function deleteTaskDb(id: string) {
  try {
    await db.delete(tasks).where(eq(tasks.id, id));
  } catch (error) {
    console.error('deleteTaskDb failed:', error);
    throw new Error('Görev silinemedi.', { cause: error });
  }
}

export async function upsertNotificationDb(n: AppNotification) {
  try {
    await db
      .insert(notifications)
      .values({
        id: n.id,
        title: n.title,
        message: n.message,
        category: n.category,
        createdAt: n.createdAt,
        read: n.read,
        targetSection: n.targetSection,
        targetEntityId: n.targetEntityId || null,
      })
      .onConflictDoUpdate({
        target: notifications.id,
        set: { read: n.read },
      });
  } catch (error) {
    console.error('upsertNotificationDb failed:', error);
    throw new Error('Bildirim kaydedilemedi.', { cause: error });
  }
}

export async function markAllNotificationsReadDb() {
  try {
    await db.update(notifications).set({ read: true });
  } catch (error) {
    console.error('markAllNotificationsReadDb failed:', error);
    throw new Error('Bildirimler güncellenemedi.', { cause: error });
  }
}

export async function deleteNotificationDb(id: string) {
  try {
    await db.delete(notifications).where(eq(notifications.id, id));
  } catch (error) {
    console.error('deleteNotificationDb failed:', error);
    throw new Error('Bildirim silinemedi.', { cause: error });
  }
}

export async function inviteOrUpdateUserDb(user: TeamUser) {
  try {
    const uid = user.id.startsWith('usr-') ? `seed-${user.id}` : user.id;
    await db
      .insert(users)
      .values({
        uid,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        department: user.department,
        avatarUrl: user.avatarUrl || null,
        postsPublished: user.postsPublished,
        lastActiveAt: user.lastActiveAt,
        joinedAt: user.joinedAt,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          department: user.department,
          avatarUrl: user.avatarUrl || null,
        },
      });
  } catch (error) {
    console.error('inviteOrUpdateUserDb failed:', error);
    throw new Error('Kullanıcı kaydı güncellenemedi.', { cause: error });
  }
}

export async function deleteUserDb(id: string) {
  try {
    const uid = id.startsWith('usr-') ? `seed-${id}` : id;
    await db.delete(users).where(eq(users.uid, uid));
  } catch (error) {
    console.error('deleteUserDb failed:', error);
    throw new Error('Kullanıcı silinemedi.', { cause: error });
  }
}

export async function upsertRoleDb(role: RoleDefinition) {
  try {
    await db
      .insert(customRoles)
      .values({
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.permissions,
        createdAt: role.createdAt,
      })
      .onConflictDoUpdate({
        target: customRoles.key,
        set: {
          name: role.name,
          description: role.description,
          permissions: role.permissions,
        },
      });

    const settings = await getWorkspaceSettings();
    const updatedMatrix: RolePermissionMatrix = {
      ...settings.rolePermissions,
      [role.key]: role.permissions,
    };
    await db
      .update(siteSettings)
      .set({ rolePermissions: updatedMatrix, updatedAt: new Date() })
      .where(eq(siteSettings.id, 'default'));
  } catch (error) {
    console.error('upsertRoleDb failed:', error);
    throw new Error('Rol tanımı kaydedilemedi.', { cause: error });
  }
}

export async function deleteRoleDb(roleKey: string) {
  try {
    const existing = await db
      .select()
      .from(customRoles)
      .where(eq(customRoles.key, roleKey))
      .limit(1);
    if (existing[0]?.isSystem) {
      throw new Error('Sistem varsayılan rolleri silinemez.');
    }
    await db.delete(customRoles).where(eq(customRoles.key, roleKey));

    const settings = await getWorkspaceSettings();
    const updatedMatrix = { ...settings.rolePermissions };
    delete updatedMatrix[roleKey];
    await db
      .update(siteSettings)
      .set({ rolePermissions: updatedMatrix, updatedAt: new Date() })
      .where(eq(siteSettings.id, 'default'));
  } catch (error: any) {
    console.error('deleteRoleDb failed:', error);
    if (error?.message === 'Sistem varsayılan rolleri silinemez.') {
      throw error;
    }
    throw new Error('Rol tanımı silinemedi.', { cause: error });
  }
}

export async function upsertDoctorDb(doctor: DoctorProfile) {
  try {
    await db
      .insert(doctors)
      .values({
        id: doctor.id,
        fullName: doctor.fullName,
        title: doctor.title,
        specialty: doctor.specialty,
        licenseNo: doctor.licenseNo,
        department: doctor.department,
        bio: doctor.bio,
        avatarUrl: doctor.avatarUrl,
        email: doctor.email,
        phone: doctor.phone,
        location: doctor.location,
        languages: doctor.languages,
        availableDays: doctor.availableDays,
        featured: doctor.featured,
        status: doctor.status,
        updatedAt: doctor.updatedAt,
      })
      .onConflictDoUpdate({
        target: doctors.id,
        set: {
          fullName: doctor.fullName,
          title: doctor.title,
          specialty: doctor.specialty,
          licenseNo: doctor.licenseNo,
          department: doctor.department,
          bio: doctor.bio,
          avatarUrl: doctor.avatarUrl,
          email: doctor.email,
          phone: doctor.phone,
          location: doctor.location,
          languages: doctor.languages,
          availableDays: doctor.availableDays,
          featured: doctor.featured,
          status: doctor.status,
          updatedAt: doctor.updatedAt,
        },
      });
  } catch (error) {
    console.error('upsertDoctorDb failed:', error);
    throw new Error('Doktor kaydı kaydedilemedi.', { cause: error });
  }
}

export async function deleteDoctorDb(id: string) {
  try {
    await db.delete(doctors).where(eq(doctors.id, id));
  } catch (error) {
    console.error('deleteDoctorDb failed:', error);
    throw new Error('Doktor kaydı silinemedi.', { cause: error });
  }
}

export async function getPublicHomeData(): Promise<PublicHomePayload> {
  try {
    await ensureWorkspaceSeeded();
    const [
      postRows,
      catRows,
      doctorRows,
      userRows,
      commentRows,
      settingsRows,
      newsRows,
    ] = await Promise.all([
      db
        .select()
        .from(posts)
        .where(eq(posts.status, 'published'))
        .orderBy(desc(posts.publishedAt)),
      db.select().from(categories),
      db
        .select()
        .from(doctors)
        .where(eq(doctors.status, 'active'))
        .orderBy(desc(doctors.featured)),
      db.select().from(users),
      db
        .select()
        .from(comments)
        .where(eq(comments.status, 'approved'))
        .orderBy(desc(comments.createdAt)),
      db.select().from(siteSettings).where(eq(siteSettings.id, 'default')).limit(1),
      db.select().from(medicalNews).orderBy(desc(medicalNews.publishedAt)),
    ]);

    const settings = settingsRows[0];
    const authors: PublicAuthorSummary[] = userRows.map((row) => ({
      id: row.uid.startsWith('seed-') ? row.uid.replace('seed-', '') : row.uid,
      name: row.name,
      role: row.role as UserRole,
      avatarUrl: row.avatarUrl || undefined,
      department: row.department,
    }));

    return {
      siteBrand: settings?.siteBrand || INITIAL_SITE_BRAND,
      siteName: settings?.siteSeo?.siteName || INITIAL_SITE_BRAND.brandName,
      posts: postRows.map((p): BlogPost => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        categoryId: p.categoryId,
        tags: p.tags,
        authorId: p.authorId,
        status: p.status as BlogPost['status'],
        coverImage: p.coverImage,
        coverAlt: p.coverAlt,
        publishedAt: p.publishedAt,
        scheduledFor: p.scheduledFor || undefined,
        updatedAt: p.updatedAt,
        readTimeMin: p.readTimeMin,
        views: p.views,
        organicViews: p.organicViews,
        avgReadDurationSec: p.avgReadDurationSec,
        bounceRate: p.bounceRate,
        commentsCount: p.commentsCount,
        featured: p.featured,
        seo: p.seo,
      })),
      categories: catRows.map((c): Category => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        color: c.color,
      })),
      doctors: doctorRows.map((d): DoctorProfile => ({
        id: d.id,
        fullName: d.fullName,
        title: d.title,
        specialty: d.specialty,
        licenseNo: d.licenseNo,
        department: d.department,
        bio: d.bio,
        avatarUrl: d.avatarUrl,
        email: '',
        phone: '',
        location: d.location,
        languages: d.languages,
        availableDays: d.availableDays,
        featured: d.featured,
        status: d.status as DoctorProfile['status'],
        updatedAt: d.updatedAt,
      })),
      authors,
      comments: commentRows.map((c): PublicCommentItem => ({
        id: c.id,
        postId: c.postId,
        authorName: c.authorName,
        content: c.content,
        createdAt: c.createdAt,
        status: c.status as ModerationComment['status'],
        moderatorReply: c.moderatorReply || undefined,
      })),
      news: newsRows.map((n): MedicalNewsItem => ({
        id: n.id,
        title: n.title,
        summary: n.summary,
        source: n.source,
        publishedAt: n.publishedAt,
        categoryLabel: n.categoryLabel,
        imageUrl: n.imageUrl,
        doctorName: n.doctorName,
      })),
    };
  } catch (error) {
    console.error('getPublicHomeData failed:', error);
    throw new Error('Anasayfa içerikleri yüklenemedi.', { cause: error });
  }
}

export async function createPublicCommentDb(input: {
  postId: string;
  authorName: string;
  content: string;
}): Promise<PublicCommentItem> {
  try {
    await ensureWorkspaceSeeded();
    const targetPosts = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, input.postId))
      .limit(1);

    if (targetPosts.length === 0) {
      throw new Error('Yorum yapılacak blog yazısı bulunamadı.');
    }

    const settings = await getWorkspaceSettings();
    const blockedWords = settings?.spamConfig?.blockedWords || [];
    const lower = input.content.toLowerCase();
    const flaggedWords = blockedWords.filter((w) => lower.includes(w.toLowerCase()));
    const linkMatches = input.content.match(/https?:\/\//gi) || [];
    const tooManyLinks =
      linkMatches.length > (settings?.spamConfig?.maxLinksBeforeHold ?? 2);

    const status: ModerationComment['status'] =
      flaggedWords.length > 0 || tooManyLinks ? 'pending' : 'approved';

    const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const id = `com-${Date.now()}`;

    await db.insert(comments).values({
      id,
      postId: input.postId,
      authorName: input.authorName,
      authorEmail: 'okuyucu@site.local',
      authorIp: '0.0.0.0',
      content: input.content,
      createdAt: nowStamp,
      status,
      flaggedWords,
      isBlockedUser: false,
    });

    return {
      id,
      postId: input.postId,
      authorName: input.authorName,
      content: input.content,
      createdAt: nowStamp,
      status,
    };
  } catch (error: any) {
    console.error('createPublicCommentDb failed:', error);
    if (error?.message === 'Yorum yapılacak blog yazısı bulunamadı.') {
      throw error;
    }
    throw new Error('Yorum kaydedilemedi.', { cause: error });
  }
}

export function mapAccountToProfile(
  row: typeof authAccounts.$inferSelect
): AuthAccountProfile {
  return {
    id: row.id,
    username: row.displayUsername,
    displayName: row.displayName,
    email: row.email,
    avatarUrl: row.avatarUrl || undefined,
    bio: row.bio || '',
    role: row.isAdmin ? 'admin' : 'member',
    isAdmin: Boolean(row.isAdmin),
    provider: row.provider === 'google' ? 'google' : 'password',
    canChangePassword: Boolean(row.passwordHash),
  };
}

export async function getAuthAccountByIdDb(
  id: string
): Promise<AuthAccountProfile | null> {
  await ensureWorkspaceSeeded();
  const rows = await db
    .select()
    .from(authAccounts)
    .where(eq(authAccounts.id, id))
    .limit(1);
  if (rows.length === 0) return null;
  return mapAccountToProfile(rows[0]);
}

export async function authenticateWithPasswordDb(
  identifier: string,
  password: string
): Promise<AuthAccountProfile | null> {
  await ensureWorkspaceSeeded();
  const normalized = identifier.trim().toLowerCase();
  if (!normalized || !password) return null;

  const rows = await db
    .select()
    .from(authAccounts)
    .where(
      or(
        eq(authAccounts.username, normalized),
        eq(authAccounts.email, normalized)
      )
    )
    .limit(1);

  if (rows.length === 0) return null;
  const row = rows[0];
  if (!row.passwordHash) return null;
  if (!verifyPassword(password, row.passwordHash)) return null;

  return mapAccountToProfile(row);
}

export async function registerMemberAccountDb(input: {
  username: string;
  displayName: string;
  email: string;
  password: string;
  avatarUrl?: string;
}): Promise<AuthAccountProfile> {
  await ensureWorkspaceSeeded();
  const cleanUsername = input.username.trim();
  const normalizedUsername = cleanUsername.toLowerCase();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (normalizedUsername === 'noh') {
    throw new Error('Bu kullanıcı adı sistem tarafından ayrılmıştır.');
  }

  const existing = await db
    .select({ id: authAccounts.id })
    .from(authAccounts)
    .where(
      or(
        eq(authAccounts.username, normalizedUsername),
        eq(authAccounts.email, normalizedEmail)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error('Bu kullanıcı adı veya e-posta adresi zaten kayıtlı.');
  }

  const id = `acc-${crypto.randomUUID()}`;
  const passwordHash = hashPassword(input.password);
  const inserted = await db
    .insert(authAccounts)
    .values({
      id,
      username: normalizedUsername,
      displayUsername: cleanUsername,
      email: normalizedEmail,
      displayName: input.displayName.trim(),
      avatarUrl: input.avatarUrl?.trim() || null,
      bio: '',
      role: 'member',
      isAdmin: false,
      passwordHash,
      firebaseUid: null,
      provider: 'password',
    })
    .returning();

  return mapAccountToProfile(inserted[0]);
}

export async function upsertGoogleMemberAccountDb(input: {
  uid: string;
  email: string;
  name: string;
  avatarUrl?: string;
}): Promise<AuthAccountProfile> {
  await ensureWorkspaceSeeded();
  const existing = await db
    .select()
    .from(authAccounts)
    .where(eq(authAccounts.firebaseUid, input.uid))
    .limit(1);

  if (existing.length > 0) {
    const row = existing[0];
    const updated = await db
      .update(authAccounts)
      .set({
        email: input.email ? input.email.toLowerCase() : row.email,
        displayName: row.displayName || input.name,
        avatarUrl: row.avatarUrl || input.avatarUrl || null,
        role: 'member',
        isAdmin: false,
        updatedAt: new Date(),
      })
      .where(eq(authAccounts.id, row.id))
      .returning();
    return mapAccountToProfile(updated[0]);
  }

  const baseHandle = (input.email?.split('@')[0] || input.name || 'uye')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 20) || 'uye';
  const uniqueHandle =
    baseHandle === 'noh'
      ? `uye_${input.uid.slice(0, 6).toLowerCase()}`
      : `${baseHandle}_${input.uid.slice(0, 5).toLowerCase()}`;

  const id = `acc-g-${input.uid}`;
  const inserted = await db
    .insert(authAccounts)
    .values({
      id,
      username: uniqueHandle,
      displayUsername: input.name || baseHandle,
      email: (input.email || `${uniqueHandle}@google.local`).toLowerCase(),
      displayName: input.name || 'Site Üyesi',
      avatarUrl: input.avatarUrl || null,
      bio: '',
      role: 'member',
      isAdmin: false,
      passwordHash: null,
      firebaseUid: input.uid,
      provider: 'google',
    })
    .onConflictDoUpdate({
      target: authAccounts.firebaseUid,
      set: {
        email: (input.email || `${uniqueHandle}@google.local`).toLowerCase(),
        updatedAt: new Date(),
      },
    })
    .returning();

  return mapAccountToProfile(inserted[0]);
}

export async function updateAuthProfileDb(
  accountId: string,
  input: { displayName: string; avatarUrl?: string; bio?: string }
): Promise<AuthAccountProfile> {
  await ensureWorkspaceSeeded();
  const updated = await db
    .update(authAccounts)
    .set({
      displayName: input.displayName.trim(),
      avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl.trim() || null : undefined,
      bio: input.bio !== undefined ? input.bio.trim() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(authAccounts.id, accountId))
    .returning();

  if (updated.length === 0) {
    throw new Error('Kullanıcı hesabı bulunamadı.');
  }
  return mapAccountToProfile(updated[0]);
}

export async function changeAccountPasswordDb(
  accountId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await ensureWorkspaceSeeded();
  const rows = await db
    .select()
    .from(authAccounts)
    .where(eq(authAccounts.id, accountId))
    .limit(1);

  if (rows.length === 0) {
    throw new Error('Kullanıcı hesabı bulunamadı.');
  }
  const row = rows[0];
  if (!row.passwordHash) {
    throw new Error('Bu hesap türünde şifre değiştirme desteklenmiyor.');
  }
  if (!verifyPassword(currentPassword, row.passwordHash)) {
    throw new Error('Mevcut şifreniz hatalı.');
  }

  const nextHash = hashPassword(newPassword);
  await db
    .update(authAccounts)
    .set({
      passwordHash: nextHash,
      updatedAt: new Date(),
    })
    .where(eq(authAccounts.id, accountId));
}
