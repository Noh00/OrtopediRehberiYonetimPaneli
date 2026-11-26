import React, { useState } from 'react';
import { Bell, CheckCheck, ExternalLink, Mail, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import {
  AppNotification,
  NotificationCategory,
  NotificationPreferences,
} from '../types/admin';

interface NotificationCenterProps {
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
  onNavigate: (n: AppNotification) => void;
  onUpdatePreferences: (prefs: NotificationPreferences) => void;
}

const CATEGORY_LABELS: Record<NotificationCategory | 'all', string> = {
  all: 'Tümü',
  moderation: 'Moderasyon',
  seo: 'SEO Uyarıları',
  task: 'Görev & Takvim',
  publish: 'Yayın Akışı',
  system: 'Sistem',
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  preferences,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onNavigate,
  onUpdatePreferences,
}) => {
  const [filter, setFilter] = useState<NotificationCategory | 'all'>('all');
  const [onlyUnread, setOnlyUnread] = useState(false);

  const filtered = notifications.filter((item) => {
    if (filter !== 'all' && item.category !== filter) return false;
    if (onlyUnread && item.read) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'moderation', 'task', 'publish', 'seo'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  filter === cat
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={(e) => setOnlyUnread(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              <span>Yalnızca okunmamış ({unreadCount})</span>
            </label>
            <button
              type="button"
              onClick={onMarkAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Tümünü Okundu Yap</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {filtered.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                Şu anda Herhangi bir veri bulunamadı
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Filtreyi değiştirerek tüm bildirim geçmişinizi inceleyebilirsiniz.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center ${
                  !item.read ? 'bg-blue-50/35 dark:bg-blue-950/15' : ''
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{item.createdAt}</span>
                    {!item.read && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          Yeni
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.message}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onMarkRead(item.id);
                      onNavigate(item);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>İlgili Ekrana Git</span>
                  </button>
                  {!item.read && (
                    <button
                      type="button"
                      onClick={() => onMarkRead(item.id)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 whitespace-nowrap"
                    >
                      Okundu
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteNotification(item.id)}
                    aria-label="Bildirimi sil"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
          Bildirim Tercihleri
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          E-posta ve panel içi uyarı kanallarınızı rolünüze göre özelleştirin.
        </p>

        <div className="mt-5 space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
          <label className="flex items-start justify-between gap-3 pt-1 cursor-pointer">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Moderasyon Kuyruğu E-postası
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Yasaklı kelime tespitinde anında e-posta gönder
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailOnModerationQueue}
              onChange={(e) =>
                onUpdatePreferences({ ...preferences, emailOnModerationQueue: e.target.checked })
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
            />
          </label>

          <label className="flex items-start justify-between gap-3 pt-4 cursor-pointer">
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Görev Atama Bildirimi
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Yeni editoryal görev atandığında bilgilendir
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailOnTaskAssigned}
              onChange={(e) =>
                onUpdatePreferences({ ...preferences, emailOnTaskAssigned: e.target.checked })
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
            />
          </label>

          <label className="flex items-start justify-between gap-3 pt-4 cursor-pointer">
            <div className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  SEO Teknik Uyarıları
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Eksik meta açıklama veya kırık yönlendirmeleri bildir
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.inAppOnSeoAlert}
              onChange={(e) =>
                onUpdatePreferences({ ...preferences, inAppOnSeoAlert: e.target.checked })
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
            />
          </label>

          <div className="pt-4">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Günlük Özet Gönderim Saati
            </label>
            <select
              value={preferences.dailyDigestHour}
              onChange={(e) =>
                onUpdatePreferences({ ...preferences, dailyDigestHour: e.target.value })
              }
              className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="08:00">08:00 (Sabah Bülteni)</option>
              <option value="09:00">09:00 (Mesai Başlangıcı)</option>
              <option value="13:00">13:00 (Öğle Özeti)</option>
              <option value="18:00">18:00 (Gün Sonu Raporu)</option>
            </select>
          </div>
        </div>
      </aside>
    </div>
  );
};
