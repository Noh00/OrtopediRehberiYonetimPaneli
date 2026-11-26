import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onSignIn: () => Promise<void>;
  error: string | null;
  loading: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSignIn,
  error,
  loading,
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-2">
          <span className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            KalemDesk
          </span>
          <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
            Blog ve Yayın Yönetim Paneli
          </h1>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            İçerik yönetimi, SEO stüdyosu, analitik raporlama, moderasyon ve ekip iş akışına erişmek için kurumsal Google hesabınızla oturum açın.
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onSignIn}
          disabled={loading}
          className="mt-6 flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          <span>{loading ? 'Oturum doğrulanıyor...' : 'Google ile Oturum Aç'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="mt-6 flex items-start gap-2.5 border-t border-slate-100 pt-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Tüm yayın verileri ve rol izinleri güvenli oturum doğrulaması ile korunmaktadır.
          </span>
        </div>
      </div>
    </div>
  );
};
