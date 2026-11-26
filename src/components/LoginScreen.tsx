import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Lock, ShieldCheck, User } from 'lucide-react';
import type { AuthAccountProfile } from '../types/admin';

interface LoginScreenProps {
  onSignInPassword: (
    identifier: string,
    password: string
  ) => Promise<AuthAccountProfile | null>;
  onSignInGoogle: () => Promise<AuthAccountProfile | null>;
  error: string | null;
  loading: boolean;
  onBackToHome?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSignInPassword,
  onSignInGoogle,
  error,
  loading,
  onBackToHome,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSignInPassword(identifier.trim(), password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {onBackToHome && (
          <button
            type="button"
            onClick={onBackToHome}
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Site Anasayfasına Dön</span>
          </button>
        )}

        <div className="space-y-2">
          <span className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            KalemDesk
          </span>
          <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
            Yönetici Girişi
          </h1>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Yönetim paneline yalnızca tanımlı yönetici hesabı ile erişilebilir. Standart hesaplar ve Google girişleri anasayfaya yönlendirilir.
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Kullanıcı Adı
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Yönetici kullanıcı adı"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
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

          <button
            type="submit"
            disabled={loading || submitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            <span>{loading || submitting ? 'Doğrulanıyor...' : 'Giriş Yap'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <button
          type="button"
          onClick={onSignInGoogle}
          disabled={loading || submitting}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <span>Google ile Üye Girişi (Anasayfaya Gider)</span>
        </button>

        <div className="mt-6 flex items-start gap-2.5 border-t border-slate-100 pt-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Yönetim paneli tek yetkili yönetici profili ile korunmaktadır.
          </span>
        </div>
      </div>
    </div>
  );
};
