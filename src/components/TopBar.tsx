import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  ExternalLink,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  User,
} from 'lucide-react';
import {
  AppNotification,
  AuthAccountProfile,
  NavSection,
  RoleDefinition,
  TeamUser,
} from '../types/admin';
import { SafeImage } from './SafeImage';

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Baş Editör',
  editor: 'Editör',
  writer: 'Yazar',
  seo_specialist: 'SEO Uzmanı',
  moderator: 'Moderatör',
};

const SECTION_META: Record<NavSection, { title: string; parent: string }> = {
  overview: { title: 'Genel Bakış', parent: 'Yayın Paneli' },
  posts: { title: 'Blog Yazıları', parent: 'İçerik' },
  taxonomy: { title: 'Kategoriler ve Etiketler', parent: 'İçerik' },
  media: { title: 'Medya Kütüphanesi', parent: 'İçerik' },
  seo: { title: 'SEO Stüdyosu', parent: 'Büyüme' },
  analytics: { title: 'Raporlama ve İstatistik', parent: 'Büyüme' },
  calendar: { title: 'Takvim ve Görevler', parent: 'Ekip' },
  moderation: { title: 'Moderasyon Merkezi', parent: 'Ekip' },
  users: { title: 'Kullanıcılar ve Roller', parent: 'Ekip' },
  site_studio: { title: 'Marka, Roller ve Doktorlar', parent: 'Site Yönetimi' },
  notifications: { title: 'Bildirim Merkezi', parent: 'Ekip' },
};

interface TopBarProps {
  activeSection: NavSection;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMobileMenu: () => void;
  onNewPost: () => void;
  canCreateOrPublish: boolean;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onNavigateFromNotification: (n: AppNotification) => void;
  onOpenAllNotifications: () => void;
  currentUser: TeamUser;
  account?: AuthAccountProfile | null;
  allUsers: TeamUser[];
  roles?: RoleDefinition[];
  onSwitchUser: (userId: string) => void;
  onLogout: () => void;
  onOpenPublicHome?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  searchQuery,
  onSearchChange,
  onOpenMobileMenu,
  onNewPost,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigateFromNotification,
  onOpenAllNotifications,
  currentUser,
  account,
  onLogout,
  onOpenPublicHome,
  onOpenProfile,
  onOpenSettings,
}) => {
  const displayName = account?.displayName || currentUser.name;
  const displayAvatar = account?.avatarUrl || currentUser.avatarUrl;
  const displayUsername = account?.username || 'Noh';
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const meta = SECTION_META[activeSection];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Navigasyon menüsünü aç"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden text-slate-400 sm:inline dark:text-slate-500">
              {meta.parent}
            </span>
            <span className="hidden text-slate-300 sm:inline dark:text-slate-700" aria-hidden="true">
              /
            </span>
            <h1 className="truncate font-display text-base font-semibold text-slate-900 sm:text-lg dark:text-white">
              {meta.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Yazı, görev veya yorum ara..."
              aria-label="Panel içi hızlı arama"
              className="h-9 w-60 rounded-lg border border-slate-200 bg-slate-50 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none lg:w-72 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900"
            />
          </div>

          {onOpenPublicHome && (
            <button
              type="button"
              onClick={onOpenPublicHome}
              title="Canlı site anasayfasını görüntüle"
              className="hidden h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ExternalLink className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Siteye Git</span>
            </button>
          )}

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label="Bildirimleri aç"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 font-mono text-[10px] font-semibold text-white tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg sm:w-96 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    Bildirimler ({unreadCount} okunmamış)
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={onMarkAllNotificationsRead}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Tümünü okundu yap
                    </button>
                  )}
                </div>
                <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      Şu anda Herhangi bir veri bulunamadı
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onMarkNotificationRead(item.id);
                          onNavigateFromNotification(item);
                          setNotifOpen(false);
                        }}
                        className={`block w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                          !item.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {item.title}
                          </span>
                          <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">
                            {item.createdAt}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                          {item.message}
                        </p>
                        {!item.read && (
                          <span className="mt-1.5 inline-block text-[11px] font-medium text-blue-600 dark:text-blue-400">
                            Okunmadı · İncele
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
                <div className="border-t border-slate-200 px-4 py-2.5 text-center dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen(false);
                      onOpenAllNotifications();
                    }}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  >
                    Tüm Bildirimleri ve Tercihleri Gör
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <SafeImage
                src={displayAvatar}
                alt={displayName}
                fallbackLabel={displayName}
                isAvatar
                className="h-6 w-6 rounded-full object-cover"
              />
              <div className="hidden text-left sm:block">
                <p className="max-w-[110px] truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tek Yönetici
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {displayName}
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    @{displayUsername} · Yönetici Hesabı
                  </p>
                </div>

                <div className="space-y-0.5 p-1.5">
                  {onOpenProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Profil</span>
                    </button>
                  )}

                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Settings className="h-3.5 w-3.5 text-slate-400" />
                      <span>Ayarlar (Şifre Değiştir)</span>
                    </button>
                  )}

                  {onOpenPublicHome && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenPublicHome();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Site Anasayfasına Git</span>
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-100 p-1.5 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onNewPost}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Yazı</span>
          </button>
        </div>
      </div>
    </header>
  );
};
