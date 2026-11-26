import React, { useEffect, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Moon,
  Shield,
  Sun,
  User,
  X,
} from 'lucide-react';
import type { AuthAccountProfile } from '../types/admin';
import { SafeImage } from './SafeImage';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  authError: string | null;
  onClearError: () => void;
  onSignInPassword: (
    identifier: string,
    password: string
  ) => Promise<AuthAccountProfile | null>;
  onRegisterMember: (input: {
    username: string;
    displayName: string;
    email: string;
    password: string;
    avatarUrl?: string;
  }) => Promise<AuthAccountProfile | null>;
  onSignInGoogle: () => Promise<AuthAccountProfile | null>;
  onAuthenticated: (account: AuthAccountProfile) => void;
  primaryColor?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  initialMode = 'login',
  authError,
  onClearError,
  onSignInPassword,
  onRegisterMember,
  onSignInGoogle,
  onAuthenticated,
  primaryColor = '#0284c7',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAvatarUrl, setRegAvatarUrl] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setLocalError(null);
      onClearError();
    }
  }, [open, initialMode]);

  if (!open) return null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 450 * 1024) {
      setLocalError('Profil fotoğrafı 450 KB boyutundan küçük olmalıdır.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRegAvatarUrl(reader.result);
        setLocalError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    onClearError();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const acc = await onSignInPassword(identifier.trim(), password);
        if (acc) {
          onAuthenticated(acc);
          onClose();
        }
      } else {
        if (regPassword.length < 6) {
          setLocalError('Şifre en az 6 karakter olmalıdır.');
          return;
        }
        const acc = await onRegisterMember({
          displayName: regName.trim(),
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
          avatarUrl: regAvatarUrl.trim() || undefined,
        });
        if (acc) {
          onAuthenticated(acc);
          onClose();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setLocalError(null);
    onClearError();
    setSubmitting(true);
    try {
      const acc = await onSignInGoogle();
      if (acc) {
        onAuthenticated(acc);
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const errorText = localError || authError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {mode === 'login' ? 'Hesabına Giriş Yap' : 'Yeni Üye Kaydı'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'login'
                ? 'Kullanıcı adınız, e-postanız veya Google hesabınızla devam edin.'
                : 'Üye olarak anasayfaya katılın ve yorumlarda yer alın.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLocalError(null);
                onClearError();
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setLocalError(null);
                onClearError();
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Kayıt Ol
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {errorText && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {errorText}
            </div>
          )}

          {mode === 'login' ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Kullanıcı Adı veya E-posta
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Örn. ahmet veya Noh"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifrenizi girin"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Örn. Ahmet Yılmaz"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Kullanıcı Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="ahmet"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  E-posta
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ahmet@ornek.com"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Şifre (En az 6 karakter)
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Şifre belirleyin"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Profil Fotoğrafı (İsteğe Bağlı)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={regAvatarUrl}
                    onChange={(e) => setRegAvatarUrl(e.target.value)}
                    placeholder="https://... veya sağdan dosya seçin"
                    className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <label className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Camera className="h-3.5 w-3.5" />
                    <span>Seç</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleAvatarFile}
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
            style={{ backgroundColor: primaryColor }}
          >
            {submitting
              ? 'İşleniyor...'
              : mode === 'login'
                ? 'Giriş Yap'
                : 'Kayıt Ol ve Anasayfaya Gir'}
          </button>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            <span className="mx-3 shrink-0 text-[11px] font-medium text-slate-400">
              veya
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleGoogle}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <span>Google Hesabı ile Devam Et</span>
          </button>
        </form>
      </div>
    </div>
  );
};

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  account: AuthAccountProfile;
  onSaveProfile: (input: {
    displayName: string;
    avatarUrl?: string;
    bio?: string;
  }) => Promise<AuthAccountProfile | null>;
  primaryColor?: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  open,
  onClose,
  account,
  onSaveProfile,
  primaryColor = '#0284c7',
}) => {
  const [displayName, setDisplayName] = useState(account.displayName);
  const [avatarUrl, setAvatarUrl] = useState(account.avatarUrl || '');
  const [bio, setBio] = useState(account.bio || '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (open) {
      setDisplayName(account.displayName);
      setAvatarUrl(account.avatarUrl || '');
      setBio(account.bio || '');
      setFeedback(null);
    }
  }, [open, account]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 450 * 1024) {
      setFeedback({ type: 'err', text: 'Görsel boyutu en fazla 450 KB olabilir.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        setFeedback(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await onSaveProfile({
        displayName,
        avatarUrl,
        bio,
      });
      if (updated) {
        setFeedback({ type: 'ok', text: 'Profil bilgileriniz güncellendi.' });
      } else {
        setFeedback({ type: 'err', text: 'Profil kaydedilemedi.' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <User className="h-4 w-4 text-slate-500" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Profil Bilgilerim
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
            <SafeImage
              src={avatarUrl || undefined}
              alt={displayName}
              fallbackLabel={displayName}
              isAvatar
              className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {account.displayName}
                </p>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                    account.isAdmin
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                  }`}
                >
                  {account.isAdmin ? 'Tek Yönetici' : 'Site Üyesi'}
                </span>
              </div>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                @{account.username} · {account.email}
              </p>
            </div>
          </div>

          {feedback && (
            <div
              className={`rounded-lg px-3.5 py-2 text-xs ${
                feedback.type === 'ok'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Görünen Ad Soyad
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Profil Fotoğrafı URL veya Yükle
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Camera className="h-3.5 w-3.5" />
                <span>Yükle</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Kısa Biyografi
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Kendiniz hakkında kısa bir not..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-xl border border-slate-200 px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Kapat
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 rounded-xl px-4 text-xs font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
              style={{ backgroundColor: primaryColor }}
            >
              {saving ? 'Kaydediliyor...' : 'Profili Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  account: AuthAccountProfile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onChangePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  primaryColor?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  account,
  darkMode,
  onToggleDarkMode,
  onChangePassword,
  primaryColor = '#0284c7',
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (open) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFeedback(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 6) {
      setFeedback({ type: 'err', text: 'Yeni şifre en az 6 karakter olmalıdır.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'err', text: 'Yeni şifreler birbiriyle eşleşmiyor.' });
      return;
    }

    setSaving(true);
    try {
      const res = await onChangePassword(currentPassword, newPassword);
      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setFeedback({
          type: 'ok',
          text: 'Şifreniz başarıyla değiştirildi. Bir sonraki girişte yeni şifrenizi kullanabilirsiniz.',
        });
      } else {
        setFeedback({ type: 'err', text: res.error || 'Şifre değiştirilemedi.' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <KeyRound className="h-4 w-4 text-slate-500" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Hesap Ayarları
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Account & Role Status */}
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  @{account.username}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {account.isAdmin
                    ? 'Tek Yönetici Hesabı (Tam Yetki)'
                    : 'Standart Site Üyesi'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {darkMode ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                  <span>Açık Tema</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-slate-500" />
                  <span>Koyu Tema</span>
                </>
              )}
            </button>
          </div>

          {/* Password Change */}
          {account.canChangePassword ? (
            <form onSubmit={handleSubmitPassword} className="space-y-3">
              <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                Şifre Değiştir
              </h3>

              {feedback && (
                <div
                  className={`flex items-start gap-2 rounded-lg px-3.5 py-2.5 text-xs ${
                    feedback.type === 'ok'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
                  }`}
                >
                  {feedback.type === 'ok' && (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Mevcut Şifre
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mevcut şifrenizi girin"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Yeni şifreyi tekrar girin"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 rounded-xl border border-slate-200 px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 rounded-xl px-4 text-xs font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
                  style={{ backgroundColor: primaryColor }}
                >
                  {saving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
              Google hesabınızla oturum açtığınız için şifre işlemleri Google hesap güvenliğiniz üzerinden yönetilir. Profil adınızı ve fotoğrafınızı Profil menüsünden düzenleyebilirsiniz.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
