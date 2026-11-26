import React from 'react';
import {
  BarChart3,
  Bell,
  CalendarClock,
  FileText,
  FolderTree,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Moon,
  Palette,
  ShieldAlert,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { NavSection } from '../types/admin';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  pendingModerationCount: number;
  openTasksCount: number;
  unreadNotificationsCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  brandName?: string;
  logoUrl?: string;
}

interface NavItemConfig {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  pendingModerationCount,
  openTasksCount,
  unreadNotificationsCount,
  darkMode,
  onToggleDarkMode,
  mobileOpen,
  onCloseMobile,
  brandName,
  logoUrl,
}) => {
  const groups: { title: string; items: NavItemConfig[] }[] = [
    {
      title: 'İçerik ve Yayın',
      items: [
        { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
        { id: 'posts', label: 'Blog Yazıları', icon: FileText },
        { id: 'taxonomy', label: 'Kategoriler ve Etiketler', icon: FolderTree },
        { id: 'media', label: 'Medya Kütüphanesi', icon: ImageIcon },
      ],
    },
    {
      title: 'Büyüme ve Analitik',
      items: [
        { id: 'seo', label: 'SEO Stüdyosu', icon: Globe },
        { id: 'analytics', label: 'Raporlama ve İstatistik', icon: BarChart3 },
      ],
    },
    {
      title: 'Ekip ve Operasyon',
      items: [
        {
          id: 'calendar',
          label: 'Takvim ve Görevler',
          icon: CalendarClock,
          badge: openTasksCount > 0 ? openTasksCount : undefined,
        },
        {
          id: 'moderation',
          label: 'Moderasyon Merkezi',
          icon: ShieldAlert,
          badge: pendingModerationCount > 0 ? pendingModerationCount : undefined,
        },
        { id: 'users', label: 'Kullanıcılar ve Roller', icon: Users },
        { id: 'site_studio', label: 'Marka, Roller & Doktorlar', icon: Palette },
        {
          id: 'notifications',
          label: 'Bildirim Merkezi',
          icon: Bell,
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
        },
      ],
    },
  ];

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-white px-4 py-5 dark:bg-slate-900">
      <div className="space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between px-2">
          <button
            type="button"
            onClick={() => {
              onSelectSection('overview');
              onCloseMobile();
            }}
            className="flex min-w-0 items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={brandName || 'KalemDesk'}
                className="h-7 max-w-[120px] shrink-0 object-contain"
              />
            ) : null}
            <span className="truncate font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {brandName || 'KalemDesk'}
            </span>
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Menüyü kapat"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Ana yönetim menüsü" className="space-y-6">
          {groups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-2.5 pb-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                {group.title}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectSection(item.id);
                      onCloseMobile();
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {typeof item.badge === 'number' && (
                      <span
                        className={`ml-2 font-mono text-xs tabular-nums ${
                          isActive
                            ? 'font-semibold text-blue-700 dark:text-blue-300'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <span className="flex items-center gap-2.5">
            {darkMode ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-slate-500" />
            )}
            <span>{darkMode ? 'Açık Tema' : 'Koyu Tema'}</span>
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {darkMode ? 'Koyu' : 'Açık'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 lg:block dark:border-slate-800">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] border-r border-slate-200 dark:border-slate-800">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
