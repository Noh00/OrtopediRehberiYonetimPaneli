import React, { useState } from 'react';
import { ShieldCheck, UserPlus, X } from 'lucide-react';
import {
  PermissionKey,
  RoleDefinition,
  RolePermissionMatrix,
  TeamUser,
  UserRole,
} from '../types/admin';
import { SafeImage } from './SafeImage';
import { ROLE_LABELS } from './TopBar';

interface UsersRolesViewProps {
  users: TeamUser[];
  roles?: RoleDefinition[];
  currentUserId: string;
  canManageUsers: boolean;
  rolePermissions: RolePermissionMatrix;
  onAddUser: (user: TeamUser) => void;
  onUpdateUserRole: (userId: string, role: UserRole) => void;
  onToggleUserStatus: (userId: string) => void;
  onTogglePermission: (role: UserRole, perm: PermissionKey) => void;
}

const PERMISSION_META: { key: PermissionKey; label: string; desc: string }[] = [
  { key: 'posts_publish', label: 'Yazı Yayınlama', desc: 'Taslakları doğrudan yayına alır' },
  { key: 'posts_delete', label: 'Yazı Silme', desc: 'Yayınları arşivden kalıcı siler' },
  { key: 'seo_manage', label: 'SEO Ayarları', desc: 'SERP, robots.txt ve yönlendirme yönetimi' },
  { key: 'analytics_export', label: 'Rapor Dışa Aktarma', desc: 'CSV ve JSON istatistik indirir' },
  { key: 'moderation_resolve', label: 'Yorum Moderasyonu', desc: 'Yorumları onaylar veya spam işaretler' },
  { key: 'calendar_manage', label: 'Takvim ve Görevler', desc: 'Görev ve yayın tarihi planlar' },
  { key: 'media_manage', label: 'Medya Yükleme', desc: 'Görsel yükler ve alt metin düzenler' },
  { key: 'users_manage', label: 'Kullanıcı & Rol Yönetimi', desc: 'Ekip üyelerini ve yetkileri düzenler' },
];

const DEFAULT_ROLE_KEYS: string[] = ['admin', 'editor', 'seo_specialist', 'writer', 'moderator'];

export const UsersRolesView: React.FC<UsersRolesViewProps> = ({
  users,
  roles,
  currentUserId,
  canManageUsers,
  rolePermissions,
  onAddUser,
  onUpdateUserRole,
  onToggleUserStatus,
  onTogglePermission,
}) => {
  const roleItems = roles && roles.length > 0
    ? roles.map((r) => ({ key: r.key, name: r.name }))
    : DEFAULT_ROLE_KEYS.map((k) => ({ key: k, name: ROLE_LABELS[k] || k }));
  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('writer');
  const [department, setDepartment] = useState('İçerik Masası');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onAddUser({
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      status: 'active',
      department: department.trim() || 'Editoryal Ekip',
      lastActiveAt: '2026-11-26 09:45',
      joinedAt: '2026-11-26',
      postsPublished: 0,
    });
    setName('');
    setEmail('');
    setInviteOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Team Members Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Ekip Üyeleri ve Erişim Durumu
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Toplam {users.length} kayıtlı üye · Üst menüdeki profil seçiciden rol yetkilerini test edebilirsiniz.
            </p>
          </div>
          {canManageUsers && (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
            >
              <UserPlus className="h-4 w-4" />
              <span>Yeni Üye Ekle</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="px-5 py-3">Kullanıcı</th>
                <th className="px-4 py-3">Birim</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3 text-right">Yayın</th>
                <th className="px-4 py-3">Son Etkinlik</th>
                <th className="px-5 py-3 text-right">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <SafeImage
                          src={user.avatarUrl}
                          alt={user.name}
                          fallbackLabel={user.name}
                          isAvatar
                          className="h-9 w-9 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {user.name}{' '}
                            {isSelf && (
                              <span className="ml-1 text-[11px] font-normal text-blue-600 dark:text-blue-400">
                                (Aktif Oturum)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {user.department}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        disabled={!canManageUsers || isSelf}
                        value={user.role}
                        onChange={(e) => onUpdateUserRole(user.id, e.target.value as UserRole)}
                        aria-label={`${user.name} rolü`}
                        className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-800 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {roleItems.map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                      {user.postsPublished}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {user.lastActiveAt}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        disabled={!canManageUsers || isSelf}
                        onClick={() => onToggleUserStatus(user.id)}
                        className={`text-xs font-medium disabled:opacity-60 ${
                          user.status === 'active'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {user.status === 'active' ? 'Aktif' : 'Askıda'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Role Permission Matrix */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Rol Tabanlı Yetki Matrisi (RBAC)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Her rol için modül bazlı erişim sınırlarını anlık olarak yapılandırın.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-5 py-3">Yetki / Modül</th>
                {roleItems.map((r) => (
                  <th key={r.key} className="px-4 py-3 text-center whitespace-nowrap">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {PERMISSION_META.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {perm.label}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{perm.desc}</p>
                  </td>
                  {roleItems.map((r) => {
                    const checked = Boolean(rolePermissions[r.key]?.[perm.key]);
                    const lockedAdmin = r.key === 'admin' && perm.key === 'users_manage';
                    return (
                      <td key={r.key} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!canManageUsers || lockedAdmin}
                          onChange={() => onTogglePermission(r.key, perm.key)}
                          aria-label={`${r.name} için ${perm.label}`}
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Yeni Ekip Üyesi Ekle
              </h3>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Deniz Kaya"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Kurumsal E-posta
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deniz.kaya@kalemdesk.com"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Rol
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {roleItems.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Birim
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Ekibe Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
