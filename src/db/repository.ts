import { desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  categories,
  comments,
  customRoles,
  doctors,
  mediaAssets,
  notifications,
  posts,
  redirects,
  siteSettings,
  tags,
  tasks,
  users,
} from './schema.ts';
import {
  INITIAL_CATEGORIES,
  INITIAL_COMMENTS,
  INITIAL_DOCTORS,
  INITIAL_MEDIA,
  INITIAL_NOTIFICATION_PREFS,
  INITIAL_NOTIFICATIONS,
  INITIAL_POSTS,
  INITIAL_REDIRECTS,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_ROLES,
  INITIAL_SITE_BRAND,
  INITIAL_SITE_SEO,
  INITIAL_SPAM_CONFIG,
  INITIAL_TAGS,
  INITIAL_TASKS,
  INITIAL_USERS,
} from '../data/initialData.ts';
import type {
  AppNotification,
  BlogPost,
  Category,
  DoctorProfile,
  MediaAsset,
  ModerationComment,
  NotificationPreferences,
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

const PRIMARY_ADMIN_EMAIL = 'ozelereglianadoluhastanesi@gmail.com';

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

    const existingDoctors = await db.select().from(doctors).limit(1);
    if (existingDoctors.length === 0) {
      for (const d of INITIAL_DOCTORS) {
        await db
          .insert(doctors)
          .values({
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
            status: d.status,
            updatedAt: d.updatedAt,
          })
          .onConflictDoNothing();
      }
    }

    if (existingSettings.length > 0) {
      return;
    }

    for (const u of INITIAL_USERS) {
      await db
        .insert(users)
        .values({
          uid: `seed-${u.id}`,
          email: u.email,
          name: u.name,
          role: u.role,
          status: u.status,
          department: u.department,
          avatarUrl: u.avatarUrl || null,
          postsPublished: u.postsPublished,
          lastActiveAt: u.lastActiveAt,
          joinedAt: u.joinedAt,
        })
        .onConflictDoNothing();
    }

    for (const c of INITIAL_CATEGORIES) {
      await db.insert(categories).values(c).onConflictDoNothing();
    }

    for (const t of INITIAL_TAGS) {
      await db.insert(tags).values(t).onConflictDoNothing();
    }

    for (const m of INITIAL_MEDIA) {
      await db.insert(mediaAssets).values(m).onConflictDoNothing();
    }

    for (const p of INITIAL_POSTS) {
      await db
        .insert(posts)
        .values({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          content: p.content,
          categoryId: p.categoryId,
          tags: p.tags,
          authorId: p.authorId,
          status: p.status,
          coverImage: p.coverImage,
          coverAlt: p.coverAlt,
          publishedAt: p.publishedAt,
          scheduledFor: p.scheduledFor || null,
          updatedAt: p.updatedAt,
          readTimeMin: p.readTimeMin,
          views: p.views,
          organicViews: p.organicViews,
          avgReadDurationSec: p.avgReadDurationSec,
          bounceRate: p.bounceRate,
          commentsCount: p.commentsCount,
          featured: p.featured,
          seo: p.seo,
        })
        .onConflictDoNothing();
    }

    for (const r of INITIAL_REDIRECTS) {
      await db.insert(redirects).values(r).onConflictDoNothing();
    }

    for (const cm of INITIAL_COMMENTS) {
      await db
        .insert(comments)
        .values({
          id: cm.id,
          postId: cm.postId,
          authorName: cm.authorName,
          authorEmail: cm.authorEmail,
          authorIp: cm.authorIp,
          content: cm.content,
          createdAt: cm.createdAt,
          status: cm.status,
          reportReason: cm.reportReason || null,
          flaggedWords: cm.flaggedWords,
          moderatorReply: cm.moderatorReply || null,
          isBlockedUser: Boolean(cm.isBlockedUser),
        })
        .onConflictDoNothing();
    }

    for (const tk of INITIAL_TASKS) {
      await db
        .insert(tasks)
        .values({
          id: tk.id,
          title: tk.title,
          description: tk.description,
          status: tk.status,
          priority: tk.priority,
          assigneeId: tk.assigneeId,
          dueDate: tk.dueDate,
          linkedPostId: tk.linkedPostId || null,
          tags: tk.tags,
          createdAt: tk.createdAt,
        })
        .onConflictDoNothing();
    }

    for (const nt of INITIAL_NOTIFICATIONS) {
      await db
        .insert(notifications)
        .values({
          id: nt.id,
          title: nt.title,
          message: nt.message,
          category: nt.category,
          createdAt: nt.createdAt,
          read: nt.read,
          targetSection: nt.targetSection,
          targetEntityId: nt.targetEntityId || null,
        })
        .onConflictDoNothing();
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
      input.email.toLowerCase() === PRIMARY_ADMIN_EMAIL
        ? 'admin'
        : invitedByEmail.length > 0
          ? (invitedByEmail[0].role as UserRole)
          : 'admin';

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
      settingsRow,
      redirectRows,
      commentRows,
      taskRows,
      notifRows,
      userRows,
      roleRows,
      doctorRows,
    ] = await Promise.all([
      db.select().from(posts).orderBy(desc(posts.updatedAt)),
      db.select().from(categories),
      db.select().from(tags),
      db.select().from(mediaAssets).orderBy(desc(mediaAssets.uploadedAt)),
      db.select().from(siteSettings).where(eq(siteSettings.id, 'default')).limit(1),
      db.select().from(redirects),
      db.select().from(comments).orderBy(desc(comments.createdAt)),
      db.select().from(tasks).orderBy(desc(tasks.createdAt)),
      db.select().from(notifications).orderBy(desc(notifications.id)),
      db.select().from(users),
      db.select().from(customRoles),
      db.select().from(doctors).orderBy(desc(doctors.updatedAt)),
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
      .values(asset)
      .onConflictDoUpdate({
        target: mediaAssets.id,
        set: { title: asset.title, altText: asset.altText },
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
          role: user.role,
          status: user.status,
          department: user.department,
        },
      });
  } catch (error) {
    console.error('inviteOrUpdateUserDb failed:', error);
    throw new Error('Kullanıcı kaydı güncellenemedi.', { cause: error });
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
