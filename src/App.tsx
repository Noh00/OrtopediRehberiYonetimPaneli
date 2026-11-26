import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  INITIAL_NOTIFICATION_PREFS,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_ROLES,
  INITIAL_SITE_BRAND,
  INITIAL_SITE_SEO,
  INITIAL_SPAM_CONFIG,
  TRAFFIC_SERIES_30D,
} from './data/initialData';
import {
  AppNotification,
  BlogPost,
  Category,
  DoctorProfile,
  MediaAsset,
  ModerationComment,
  ModerationStatus,
  NavSection,
  NotificationPreferences,
  PermissionKey,
  PostStatus,
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
} from './types/admin';
import { useAuth } from './contexts/AuthContext';
import { apiFetch } from './lib/api';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { OverviewView } from './components/OverviewView';
import { PostsView } from './components/PostsView';
import { PostEditorModal } from './components/PostEditorModal';
import { MediaLibraryView, TaxonomyView } from './components/TaxonomyMediaView';
import { SeoModuleView } from './components/SeoModuleView';
import { AnalyticsView } from './components/AnalyticsView';
import { UsersRolesView } from './components/UsersRolesView';
import { ModerationView } from './components/ModerationView';
import { CalendarTasksView } from './components/CalendarTasksView';
import { NotificationCenter } from './components/NotificationCenter';
import { SiteStudioView } from './components/SiteStudioView';

interface WorkspacePayload {
  posts: BlogPost[];
  categories: Category[];
  tags: TagItem[];
  mediaAssets: MediaAsset[];
  siteSeo: SiteSeoConfig;
  siteBrand: SiteBrandConfig;
  rolePermissions: RolePermissionMatrix;
  roles: RoleDefinition[];
  doctors: DoctorProfile[];
  spamConfig: SpamFilterConfig;
  notificationPrefs: NotificationPreferences;
  redirects: RedirectRule[];
  comments: ModerationComment[];
  tasks: TeamTask[];
  notifications: AppNotification[];
  users: TeamUser[];
  currentUser: TeamUser;
}

export default function App() {
  const { firebaseUser, authLoading, authError, signInWithGoogle, logout } = useAuth();

  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kalemdesk_dark') === 'true';
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Server-backed workspace state
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [workspaceReady, setWorkspaceReady] = useState(false);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [siteSeo, setSiteSeo] = useState<SiteSeoConfig>(INITIAL_SITE_SEO);
  const [siteBrand, setSiteBrand] = useState<SiteBrandConfig>(INITIAL_SITE_BRAND);
  const [redirects, setRedirects] = useState<RedirectRule[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionMatrix>(
    INITIAL_ROLE_PERMISSIONS
  );
  const [roles, setRoles] = useState<RoleDefinition[]>(INITIAL_ROLES);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [comments, setComments] = useState<ModerationComment[]>([]);
  const [spamConfig, setSpamConfig] = useState<SpamFilterConfig>(INITIAL_SPAM_CONFIG);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(
    INITIAL_NOTIFICATION_PREFS
  );

  // Ephemeral UI state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [selectedSeoPostId, setSelectedSeoPostId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Debounce timers for high-frequency inline SEO form edits
  const postSyncTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const settingsSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('kalemdesk_dark', String(darkMode));
    } catch {
      // Ignore storage errors
    }
  }, [darkMode]);

  useEffect(() => {
    return () => {
      Object.values(postSyncTimerRef.current).forEach(clearTimeout);
      if (settingsSyncTimerRef.current) {
        clearTimeout(settingsSyncTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  const loadWorkspace = useCallback(async () => {
    if (!firebaseUser) return;
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    try {
      const data = await apiFetch<WorkspacePayload>('/api/workspace');
      setPosts(data.posts);
      setCategories(data.categories);
      setTags(data.tags);
      setMediaAssets(data.mediaAssets);
      setSiteSeo(data.siteSeo);
      setSiteBrand(data.siteBrand || INITIAL_SITE_BRAND);
      setRolePermissions(data.rolePermissions);
      setRoles(data.roles && data.roles.length > 0 ? data.roles : INITIAL_ROLES);
      setDoctors(data.doctors || []);
      setSpamConfig(data.spamConfig);
      setNotifPrefs(data.notificationPrefs);
      setRedirects(data.redirects);
      setComments(data.comments);
      setTasks(data.tasks);
      setNotifications(data.notifications);
      setUsers(data.users);
      setCurrentUserId(data.currentUser?.id || data.users[0]?.id || '');
      setSelectedSeoPostId((prev) =>
        prev && data.posts.some((p) => p.id === prev) ? prev : data.posts[0]?.id || ''
      );
      setWorkspaceReady(true);
    } catch (err: any) {
      setWorkspaceError(err?.message || 'Yönetim paneli verileri yüklenemedi.');
      setWorkspaceReady(false);
    } finally {
      setWorkspaceLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (firebaseUser) {
      loadWorkspace();
    } else {
      setWorkspaceReady(false);
      setWorkspaceError(null);
    }
  }, [firebaseUser, loadWorkspace]);

  const persistRequest = useCallback(
    async (fn: () => Promise<unknown>, fallbackError: string) => {
      try {
        await fn();
        return true;
      } catch (err: any) {
        showToast(err?.message || fallbackError);
        return false;
      }
    },
    [showToast]
  );

  const pushNotification = useCallback(
    (
      title: string,
      message: string,
      category: AppNotification['category'],
      targetSection: NavSection,
      targetEntityId?: string
    ) => {
      const item: AppNotification = {
        id: `ntf-${Date.now()}`,
        title,
        message,
        category,
        createdAt: 'Az önce',
        read: false,
        targetSection,
        targetEntityId,
      };
      setNotifications((prev) => [item, ...prev]);
      persistRequest(
        () =>
          apiFetch('/api/notifications', {
            method: 'POST',
            body: JSON.stringify(item),
          }),
        'Bildirim kaydedilemedi.'
      );
    },
    [persistRequest]
  );

  const currentUser = useMemo<TeamUser>(() => {
    const found = users.find((u) => u.id === currentUserId) ?? users[0];
    if (found) return found;
    return {
      id: firebaseUser?.uid || 'usr-active',
      name: firebaseUser?.displayName || 'Editör',
      email: firebaseUser?.email || '',
      role: 'admin',
      status: 'active',
      avatarUrl: firebaseUser?.photoURL || undefined,
      department: 'Yayın Yönetimi',
      lastActiveAt: 'Az önce',
      joinedAt: '2026-11-26',
      postsPublished: 0,
    };
  }, [users, currentUserId, firebaseUser]);

  const permissions =
    rolePermissions[currentUser.role] ?? INITIAL_ROLE_PERMISSIONS.admin;

  // Auth & loading gates
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        Oturum kontrol ediliyor...
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <LoginScreen
        onSignIn={signInWithGoogle}
        error={authError}
        loading={authLoading}
      />
    );
  }

  if (!workspaceReady && workspaceLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        Çalışma alanı verileri yükleniyor...
      </div>
    );
  }

  if (workspaceError && !workspaceReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Panel Verileri Yüklenemedi
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-red-600 dark:text-red-400">
            {workspaceError}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={loadWorkspace}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              Tekrar Dene
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
            >
              Oturumu Kapat
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Derived counters
  const pendingModerationCount = comments.filter((c) => c.status === 'pending').length;
  const openTasksCount = tasks.filter((t) => t.status !== 'done').length;
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Post Handlers
  const handleSavePost = async (post: BlogPost, isNew: boolean) => {
    const ok = await persistRequest(
      () =>
        apiFetch('/api/posts', {
          method: 'POST',
          body: JSON.stringify(post),
        }),
      'Blog yazısı kaydedilemedi.'
    );
    if (!ok) return;

    if (isNew) {
      setPosts((prev) => [post, ...prev]);
      pushNotification(
        'Yeni Blog Yazısı Oluşturuldu',
        `"${post.title}" ${post.status === 'published' ? 'yayınlandı' : 'kaydedildi'}.`,
        'publish',
        'posts',
        post.id
      );
      showToast('Yeni yazı başarıyla oluşturuldu.');
    } else {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
      showToast('Yazı değişiklikleri kaydedildi.');
    }
    setEditorOpen(false);
    setEditingPost(null);
  };

  const handleBulkUpdateStatus = async (ids: string[], status: PostStatus) => {
    const ok = await persistRequest(
      () =>
        apiFetch('/api/posts/bulk-status', {
          method: 'POST',
          body: JSON.stringify({ ids, status }),
        }),
      'Toplu durum güncellemesi başarısız oldu.'
    );
    if (!ok) return;

    const today = new Date().toISOString().slice(0, 10);
    setPosts((prev) =>
      prev.map((p) => (ids.includes(p.id) ? { ...p, status, updatedAt: today } : p))
    );
    showToast(`${ids.length} yazının durumu güncellendi.`);
  };

  const handleDeletePost = async (id: string) => {
    const ok = await persistRequest(
      () =>
        apiFetch(`/api/posts/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        }),
      'Blog yazısı silinemedi.'
    );
    if (!ok) return;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    showToast('Blog yazısı silindi.');
  };

  const handleBulkDeletePosts = async (ids: string[]) => {
    const ok = await persistRequest(
      () =>
        Promise.all(
          ids.map((id) =>
            apiFetch(`/api/posts/${encodeURIComponent(id)}`, {
              method: 'DELETE',
            })
          )
        ),
      'Seçili yazılar silinemedi.'
    );
    if (!ok) return;
    setPosts((prev) => prev.filter((p) => !ids.includes(p.id)));
    showToast(`${ids.length} yazı silindi.`);
  };

  const handleToggleFeatured = async (id: string) => {
    const target = posts.find((p) => p.id === id);
    if (!target) return;
    const updated = { ...target, featured: !target.featured };
    setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    await persistRequest(
      () =>
        apiFetch('/api/posts', {
          method: 'POST',
          body: JSON.stringify(updated),
        }),
      'Öne çıkarma durumu güncellenemedi.'
    );
  };

  const handleInlineSeoPostUpdate = (updated: BlogPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (postSyncTimerRef.current[updated.id]) {
      clearTimeout(postSyncTimerRef.current[updated.id]);
    }
    postSyncTimerRef.current[updated.id] = setTimeout(() => {
      persistRequest(
        () =>
          apiFetch('/api/posts', {
            method: 'POST',
            body: JSON.stringify(updated),
          }),
        'SEO değişiklikleri kaydedilemedi.'
      );
    }, 550);
  };

  const scheduleSettingsSync = (partial: {
    siteSeo?: SiteSeoConfig;
    rolePermissions?: RolePermissionMatrix;
    spamConfig?: SpamFilterConfig;
    notificationPrefs?: NotificationPreferences;
  }) => {
    if (settingsSyncTimerRef.current) {
      clearTimeout(settingsSyncTimerRef.current);
    }
    settingsSyncTimerRef.current = setTimeout(() => {
      persistRequest(
        () =>
          apiFetch('/api/settings', {
            method: 'PUT',
            body: JSON.stringify(partial),
          }),
        'Ayarlar veritabanına kaydedilemedi.'
      );
    }, 550);
  };

  // Moderation Handlers
  const handleUpdateCommentStatus = async (id: string, status: ModerationStatus) => {
    const target = comments.find((c) => c.id === id);
    if (!target) return;
    const updated = { ...target, status };
    const ok = await persistRequest(
      () =>
        apiFetch(`/api/comments/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: JSON.stringify(updated),
        }),
      'Yorum durumu güncellenemedi.'
    );
    if (!ok) return;

    setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
    showToast(
      status === 'approved'
        ? 'Yorum onaylandı.'
        : status === 'spam'
          ? 'Yorum spam olarak işaretlendi.'
          : 'Yorum reddedildi.'
    );
  };

  // Task Handlers
  const handleAddTask = async (task: TeamTask) => {
    const ok = await persistRequest(
      () =>
        apiFetch('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(task),
        }),
      'Görev kaydedilemedi.'
    );
    if (!ok) return;

    setTasks((prev) => [task, ...prev]);
    const assignee = users.find((u) => u.id === task.assigneeId);
    pushNotification(
      'Yeni Ekip Görevi Atandı',
      `"${task.title}" görevi ${assignee?.name ?? 'ekip üyesine'} atandı.`,
      'task',
      'calendar',
      task.id
    );
    showToast('Görev takvime ve panoya eklendi.');
  };

  const handleUpdateTask = async (updated: TeamTask) => {
    const ok = await persistRequest(
      () =>
        apiFetch('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(updated),
        }),
      'Görev güncellenemedi.'
    );
    if (!ok) return;
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    showToast('Görev güncellendi.');
  };

  const handleTogglePermission = async (role: UserRole, perm: PermissionKey) => {
    const nextMatrix: RolePermissionMatrix = {
      ...rolePermissions,
      [role]: {
        ...rolePermissions[role],
        [perm]: !rolePermissions[role][perm],
      },
    };
    const ok = await persistRequest(
      () =>
        apiFetch('/api/settings', {
          method: 'PUT',
          body: JSON.stringify({ rolePermissions: nextMatrix }),
        }),
      'Rol yetkisi güncellenemedi.'
    );
    if (!ok) return;
    setRolePermissions(nextMatrix);
    setRoles((prev) =>
      prev.map((r) => (r.key === role ? { ...r, permissions: nextMatrix[role] } : r))
    );
    showToast('Rol yetkisi güncellendi.');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        pendingModerationCount={pendingModerationCount}
        openTasksCount={openTasksCount}
        unreadNotificationsCount={unreadNotificationsCount}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        brandName={siteBrand.brandName}
        logoUrl={darkMode ? (siteBrand.logoDarkUrl || siteBrand.logoLightUrl) : siteBrand.logoLightUrl}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          activeSection={activeSection}
          searchQuery={globalSearch}
          onSearchChange={(q) => {
            setGlobalSearch(q);
            if (q.trim() && activeSection === 'overview') {
              setActiveSection('posts');
            }
          }}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNewPost={() => {
            setEditingPost(null);
            setEditorOpen(true);
          }}
          canCreateOrPublish={permissions.posts_publish}
          notifications={notifications}
          onMarkNotificationRead={(id) => {
            const target = notifications.find((n) => n.id === id);
            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            if (target) {
              persistRequest(
                () =>
                  apiFetch('/api/notifications', {
                    method: 'POST',
                    body: JSON.stringify({ ...target, read: true }),
                  }),
                'Bildirim güncellenemedi.'
              );
            }
          }}
          onMarkAllNotificationsRead={() => {
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            persistRequest(
              () =>
                apiFetch('/api/notifications/mark-all-read', {
                  method: 'POST',
                }),
              'Bildirimler güncellenemedi.'
            );
          }}
          onNavigateFromNotification={(n) => setActiveSection(n.targetSection)}
          onOpenAllNotifications={() => setActiveSection('notifications')}
          currentUser={currentUser}
          allUsers={users}
          roles={roles}
          onSwitchUser={(id) => {
            setCurrentUserId(id);
            const switched = users.find((u) => u.id === id);
            if (switched) showToast(`Görünüm önizleme: ${switched.name}`);
          }}
          onLogout={logout}
        />

        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 lg:p-8">
          {activeSection === 'overview' && (
            <OverviewView
              posts={posts}
              categories={categories}
              users={users}
              comments={comments}
              tasks={tasks}
              trafficSeries={TRAFFIC_SERIES_30D}
              onNavigate={setActiveSection}
              onEditPost={(post) => {
                setEditingPost(post);
                setEditorOpen(true);
              }}
              onInspectPostSeo={(postId) => {
                setSelectedSeoPostId(postId);
                setActiveSection('seo');
              }}
            />
          )}

          {activeSection === 'posts' && (
            <PostsView
              posts={posts}
              categories={categories}
              users={users}
              globalSearch={globalSearch}
              canPublish={permissions.posts_publish}
              canDelete={permissions.posts_delete}
              onNewPost={() => {
                setEditingPost(null);
                setEditorOpen(true);
              }}
              onEditPost={(post) => {
                setEditingPost(post);
                setEditorOpen(true);
              }}
              onDeletePost={handleDeletePost}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              onBulkDelete={handleBulkDeletePosts}
              onToggleFeatured={handleToggleFeatured}
              onInspectSeo={(postId) => {
                setSelectedSeoPostId(postId);
                setActiveSection('seo');
              }}
            />
          )}

          {activeSection === 'taxonomy' && (
            <TaxonomyView
              categories={categories}
              tags={tags}
              posts={posts}
              onAddCategory={async (cat) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch('/api/categories', {
                      method: 'POST',
                      body: JSON.stringify(cat),
                    }),
                  'Kategori eklenemedi.'
                );
                if (!ok) return;
                setCategories((prev) => [...prev, cat]);
                showToast('Kategori eklendi.');
              }}
              onDeleteCategory={async (id) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch(`/api/categories/${encodeURIComponent(id)}`, {
                      method: 'DELETE',
                    }),
                  'Kategori silinemedi.'
                );
                if (!ok) return;
                setCategories((prev) => prev.filter((c) => c.id !== id));
                showToast('Kategori silindi.');
              }}
              onAddTag={async (t) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch('/api/tags', {
                      method: 'POST',
                      body: JSON.stringify(t),
                    }),
                  'Etiket oluşturulamadı.'
                );
                if (!ok) return;
                setTags((prev) => [...prev, t]);
                showToast('Etiket oluşturuldu.');
              }}
              onDeleteTag={async (id) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch(`/api/tags/${encodeURIComponent(id)}`, {
                      method: 'DELETE',
                    }),
                  'Etiket silinemedi.'
                );
                if (!ok) return;
                setTags((prev) => prev.filter((t) => t.id !== id));
                showToast('Etiket silindi.');
              }}
            />
          )}

          {activeSection === 'media' && (
            <MediaLibraryView
              mediaAssets={mediaAssets}
              currentUserName={currentUser.name}
              onAddMedia={async (asset) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch('/api/media', {
                      method: 'POST',
                      body: JSON.stringify(asset),
                    }),
                  'Medya varlığı eklenemedi.'
                );
                if (!ok) return;
                setMediaAssets((prev) => [asset, ...prev]);
                showToast('Yeni görsel medya kütüphanesine eklendi.');
              }}
              onUpdateAltText={async (id, altText) => {
                const target = mediaAssets.find((m) => m.id === id);
                if (!target) return;
                const updated = { ...target, altText };
                setMediaAssets((prev) => prev.map((m) => (m.id === id ? updated : m)));
                await persistRequest(
                  () =>
                    apiFetch('/api/media', {
                      method: 'POST',
                      body: JSON.stringify(updated),
                    }),
                  'Alt metin güncellenemedi.'
                );
              }}
              onDeleteMedia={async (id) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch(`/api/media/${encodeURIComponent(id)}`, {
                      method: 'DELETE',
                    }),
                  'Medya varlığı kaldırılamadı.'
                );
                if (!ok) return;
                setMediaAssets((prev) => prev.filter((m) => m.id !== id));
                showToast('Medya varlığı kaldırıldı.');
              }}
            />
          )}

          {activeSection === 'seo' && (
            <SeoModuleView
              posts={posts}
              selectedPostId={selectedSeoPostId}
              onSelectPostId={setSelectedSeoPostId}
              onUpdatePost={handleInlineSeoPostUpdate}
              siteSeo={siteSeo}
              onUpdateSiteSeo={(cfg) => {
                setSiteSeo(cfg);
                scheduleSettingsSync({ siteSeo: cfg });
              }}
              redirects={redirects}
              onAddRedirect={async (rule) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch('/api/redirects', {
                      method: 'POST',
                      body: JSON.stringify(rule),
                    }),
                  'Yönlendirme kuralı eklenemedi.'
                );
                if (!ok) return;
                setRedirects((prev) => [rule, ...prev]);
              }}
              onToggleRedirect={async (id) => {
                const target = redirects.find((r) => r.id === id);
                if (!target) return;
                const updated = { ...target, active: !target.active };
                const ok = await persistRequest(
                  () =>
                    apiFetch('/api/redirects', {
                      method: 'POST',
                      body: JSON.stringify(updated),
                    }),
                  'Yönlendirme durumu güncellenemedi.'
                );
                if (!ok) return;
                setRedirects((prev) => prev.map((r) => (r.id === id ? updated : r)));
              }}
              onDeleteRedirect={async (id) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch(`/api/redirects/${encodeURIComponent(id)}`, {
                      method: 'DELETE',
                    }),
                  'Yönlendirme kuralı silinemedi.'
                );
                if (!ok) return;
                setRedirects((prev) => prev.filter((r) => r.id !== id));
              }}
              canManageSeo={permissions.seo_manage}
            />
          )}

          {activeSection === 'analytics' && (
            <AnalyticsView
              posts={posts}
              categories={categories}
              users={users}
              trafficSeries={TRAFFIC_SERIES_30D}
              canExport={permissions.analytics_export}
            />
          )}

          {activeSection === 'users' && (
            <UsersRolesView
              users={users}
              roles={roles}
              currentUserId={currentUserId}
              canManageUsers={permissions.users_manage}
              rolePermissions={rolePermissions}
              onAddUser={async (u) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch('/api/users', {
                      method: 'POST',
                      body: JSON.stringify(u),
                    }),
                  'Kullanıcı eklenemedi.'
                );
                if (!ok) return;
                setUsers((prev) => [...prev, u]);
                showToast(`${u.name} ekibe eklendi.`);
              }}
              onUpdateUserRole={async (userId, role) => {
                const target = users.find((u) => u.id === userId);
                if (!target) return;
                const updated = { ...target, role };
                const ok = await persistRequest(
                  () =>
                    apiFetch('/api/users', {
                      method: 'POST',
                      body: JSON.stringify(updated),
                    }),
                  'Kullanıcı rolü güncellenemedi.'
                );
                if (!ok) return;
                setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
                showToast('Kullanıcı rolü güncellendi.');
              }}
              onToggleUserStatus={async (userId) => {
                const target = users.find((u) => u.id === userId);
                if (!target) return;
                const updated: TeamUser = {
                  ...target,
                  status: target.status === 'active' ? 'suspended' : 'active',
                };
                const ok = await persistRequest(
                  () =>
                    apiFetch('/api/users', {
                      method: 'POST',
                      body: JSON.stringify(updated),
                    }),
                  'Kullanıcı durumu güncellenemedi.'
                );
                if (!ok) return;
                setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
              }}
              onTogglePermission={handleTogglePermission}
            />
          )}

          {activeSection === 'moderation' && (
            <ModerationView
              comments={comments}
              posts={posts}
              spamConfig={spamConfig}
              canResolve={permissions.moderation_resolve}
              onUpdateCommentStatus={handleUpdateCommentStatus}
              onReplyComment={async (id, reply) => {
                const target = comments.find((c) => c.id === id);
                if (!target) return;
                const updated = { ...target, moderatorReply: reply };
                const ok = await persistRequest(
                  () =>
                    apiFetch(`/api/comments/${encodeURIComponent(id)}`, {
                      method: 'PUT',
                      body: JSON.stringify(updated),
                    }),
                  'Moderatör yanıtı kaydedilemedi.'
                );
                if (!ok) return;
                setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
                showToast('Moderatör yanıtı kaydedildi.');
              }}
              onToggleBlockAuthor={async (id) => {
                const target = comments.find((c) => c.id === id);
                if (!target) return;
                const updated = { ...target, isBlockedUser: !target.isBlockedUser };
                const ok = await persistRequest(
                  () =>
                    apiFetch(`/api/comments/${encodeURIComponent(id)}`, {
                      method: 'PUT',
                      body: JSON.stringify(updated),
                    }),
                  'Yazar engelleme durumu güncellenemedi.'
                );
                if (!ok) return;
                setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
              }}
              onDeleteComment={async (id) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch(`/api/comments/${encodeURIComponent(id)}`, {
                      method: 'DELETE',
                    }),
                  'Yorum silinemedi.'
                );
                if (!ok) return;
                setComments((prev) => prev.filter((c) => c.id !== id));
                showToast('Yorum silindi.');
              }}
              onUpdateSpamConfig={(cfg) => {
                setSpamConfig(cfg);
                scheduleSettingsSync({ spamConfig: cfg });
              }}
            />
          )}

          {activeSection === 'calendar' && (
            <CalendarTasksView
              tasks={tasks}
              posts={posts}
              users={users}
              canManage={permissions.calendar_manage}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={async (id) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch(`/api/tasks/${encodeURIComponent(id)}`, {
                      method: 'DELETE',
                    }),
                  'Görev silinemedi.'
                );
                if (!ok) return;
                setTasks((prev) => prev.filter((t) => t.id !== id));
                showToast('Görev silindi.');
              }}
              onEditPost={(post) => {
                setEditingPost(post);
                setEditorOpen(true);
              }}
            />
          )}

          {activeSection === 'notifications' && (
            <NotificationCenter
              notifications={notifications}
              preferences={notifPrefs}
              onMarkRead={(id) => {
                const target = notifications.find((n) => n.id === id);
                setNotifications((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, read: true } : n))
                );
                if (target) {
                  persistRequest(
                    () =>
                      apiFetch('/api/notifications', {
                        method: 'POST',
                        body: JSON.stringify({ ...target, read: true }),
                      }),
                    'Bildirim güncellenemedi.'
                  );
                }
              }}
              onMarkAllRead={() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                persistRequest(
                  () =>
                    apiFetch('/api/notifications/mark-all-read', {
                      method: 'POST',
                    }),
                  'Bildirimler güncellenemedi.'
                );
              }}
              onDeleteNotification={async (id) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch(`/api/notifications/${encodeURIComponent(id)}`, {
                      method: 'DELETE',
                    }),
                  'Bildirim silinemedi.'
                );
                if (!ok) return;
                setNotifications((prev) => prev.filter((n) => n.id !== id));
              }}
              onNavigate={(n) => setActiveSection(n.targetSection)}
              onUpdatePreferences={async (prefs) => {
                setNotifPrefs(prefs);
                const ok = await persistRequest(
                  () =>
                    apiFetch('/api/settings', {
                      method: 'PUT',
                      body: JSON.stringify({ notificationPrefs: prefs }),
                    }),
                  'Bildirim tercihleri kaydedilemedi.'
                );
                if (ok) {
                  showToast('Bildirim tercihleri kaydedildi.');
                }
              }}
            />
          )}

          {activeSection === 'site_studio' && (
            <SiteStudioView
              siteBrand={siteBrand}
              siteSeo={siteSeo}
              mediaAssets={mediaAssets}
              roles={roles}
              users={users}
              doctors={doctors}
              canManageBrand={permissions.seo_manage || permissions.users_manage}
              canManageRoles={permissions.users_manage}
              canManageDoctors={permissions.users_manage || permissions.posts_publish}
              currentUserName={currentUser.name}
              onSaveSiteBrand={async (brand, alsoSyncSeoName) => {
                const updatedSeo = alsoSyncSeoName
                  ? { ...siteSeo, siteName: brand.brandName }
                  : undefined;
                const ok = await persistRequest(
                  () =>
                    apiFetch('/api/settings', {
                      method: 'PUT',
                      body: JSON.stringify({
                        siteBrand: brand,
                        ...(updatedSeo ? { siteSeo: updatedSeo } : {}),
                      }),
                    }),
                  'Marka ve görsel ayarlar kaydedilemedi.'
                );
                if (!ok) return false;
                setSiteBrand(brand);
                if (updatedSeo) setSiteSeo(updatedSeo);
                showToast(`"${brand.brandName}" konsept ve görsel ayarları güncellendi.`);
                return true;
              }}
              onAddMedia={async (asset) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch('/api/media', {
                      method: 'POST',
                      body: JSON.stringify(asset),
                    }),
                  'Görsel medya kütüphanesine eklenemedi.'
                );
                if (!ok) return;
                setMediaAssets((prev) => [asset, ...prev]);
              }}
              onSaveRole={async (roleDef) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch('/api/roles', {
                      method: 'POST',
                      body: JSON.stringify(roleDef),
                    }),
                  'Rol tanımı kaydedilemedi.'
                );
                if (!ok) return false;
                setRoles((prev) => {
                  const exists = prev.some((r) => r.key === roleDef.key);
                  return exists
                    ? prev.map((r) => (r.key === roleDef.key ? roleDef : r))
                    : [...prev, roleDef];
                });
                setRolePermissions((prev) => ({
                  ...prev,
                  [roleDef.key]: roleDef.permissions,
                }));
                showToast(`"${roleDef.name}" rolü kaydedildi.`);
                return true;
              }}
              onDeleteRole={async (roleKey) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch(`/api/roles/${encodeURIComponent(roleKey)}`, {
                      method: 'DELETE',
                    }),
                  'Rol silinemedi.'
                );
                if (!ok) return false;
                setRoles((prev) => prev.filter((r) => r.key !== roleKey));
                setRolePermissions((prev) => {
                  const next = { ...prev };
                  delete next[roleKey];
                  return next;
                });
                showToast('Özel rol silindi.');
                return true;
              }}
              onSaveDoctor={async (doctor, isNew) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch('/api/doctors', {
                      method: 'POST',
                      body: JSON.stringify(doctor),
                    }),
                  'Doktor kaydı kaydedilemedi.'
                );
                if (!ok) return false;
                setDoctors((prev) =>
                  isNew
                    ? [doctor, ...prev]
                    : prev.map((d) => (d.id === doctor.id ? doctor : d))
                );
                showToast(
                  isNew ? `${doctor.fullName} doktor kadrosuna eklendi.` : `${doctor.fullName} güncellendi.`
                );
                return true;
              }}
              onDeleteDoctor={async (id) => {
                const ok = await persistRequest(
                  () =>
                    apiFetch(`/api/doctors/${encodeURIComponent(id)}`, {
                      method: 'DELETE',
                    }),
                  'Doktor kaydı silinemedi.'
                );
                if (!ok) return false;
                setDoctors((prev) => prev.filter((d) => d.id !== id));
                showToast('Doktor kaydı silindi.');
                return true;
              }}
            />
          )}
        </main>
      </div>

      {editorOpen && (
        <PostEditorModal
          initialPost={editingPost}
          categories={categories}
          tags={tags}
          users={users}
          mediaAssets={mediaAssets}
          currentUserId={currentUser.id}
          canPublish={permissions.posts_publish}
          onSave={handleSavePost}
          onClose={() => {
            setEditorOpen(false);
            setEditingPost(null);
          }}
        />
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-5 bottom-5 z-50 rounded-xl border border-slate-200 bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg dark:border-slate-700 dark:bg-slate-100 dark:text-slate-900"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
