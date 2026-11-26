import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { apiFetch, getCustomSessionToken, setCustomSessionToken } from '../lib/api';
import type { AuthAccountProfile } from '../types/admin';

interface RegisterMemberInput {
  username: string;
  displayName: string;
  email: string;
  password: string;
  avatarUrl?: string;
}

interface UpdateProfileInput {
  displayName: string;
  avatarUrl?: string;
  bio?: string;
}

interface AuthContextValue {
  firebaseUser: User | null;
  account: AuthAccountProfile | null;
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithPassword: (
    identifier: string,
    password: string
  ) => Promise<AuthAccountProfile | null>;
  registerMember: (input: RegisterMemberInput) => Promise<AuthAccountProfile | null>;
  signInWithGoogle: () => Promise<AuthAccountProfile | null>;
  updateProfile: (input: UpdateProfileInput) => Promise<AuthAccountProfile | null>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [account, setAccount] = useState<AuthAccountProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (getCustomSessionToken()) {
        setAuthLoading(false);
        return;
      }
      if (!user) {
        setAccount(null);
        setAuthLoading(false);
        return;
      }
      try {
        const res = await apiFetch<{ ok: boolean; account: AuthAccountProfile }>(
          '/api/auth/me'
        );
        setAccount(res.account);
      } catch (err) {
        console.error('Failed to sync Google account profile:', err);
        setAccount(null);
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const clearAuthError = () => setAuthError(null);

  const signInWithPassword = async (
    identifier: string,
    password: string
  ): Promise<AuthAccountProfile | null> => {
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.token || !data?.account) {
        setAuthError(data?.error || 'Kullanıcı adı veya şifre hatalı.');
        return null;
      }
      if (auth.currentUser) {
        await signOut(auth).catch(() => {});
      }
      setCustomSessionToken(data.token);
      setAccount(data.account as AuthAccountProfile);
      return data.account as AuthAccountProfile;
    } catch {
      setAuthError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
      return null;
    }
  };

  const registerMember = async (
    input: RegisterMemberInput
  ): Promise<AuthAccountProfile | null> => {
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.token || !data?.account) {
        setAuthError(data?.error || 'Kayıt işlemi tamamlanamadı.');
        return null;
      }
      if (auth.currentUser) {
        await signOut(auth).catch(() => {});
      }
      setCustomSessionToken(data.token);
      setAccount(data.account as AuthAccountProfile);
      return data.account as AuthAccountProfile;
    } catch {
      setAuthError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
      return null;
    }
  };

  const signInWithGoogle = async (): Promise<AuthAccountProfile | null> => {
    setAuthError(null);
    try {
      setCustomSessionToken(null);
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const token = await cred.user.getIdToken();
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.account) {
        setAccount(data.account as AuthAccountProfile);
        return data.account as AuthAccountProfile;
      }
      return null;
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setAuthError(
        err?.code === 'auth/popup-closed-by-user'
          ? 'Oturum açma penceresi kapatıldı. Devam etmek için tekrar deneyin.'
          : err?.message || 'Google ile oturum açılırken bir hata oluştu.'
      );
      return null;
    }
  };

  const updateProfile = async (
    input: UpdateProfileInput
  ): Promise<AuthAccountProfile | null> => {
    try {
      const res = await apiFetch<{ ok: boolean; account: AuthAccountProfile }>(
        '/api/auth/profile',
        {
          method: 'PUT',
          body: JSON.stringify(input),
        }
      );
      setAccount(res.account);
      return res.account;
    } catch (err: any) {
      setAuthError(err?.message || 'Profil güncellenemedi.');
      return null;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Şifre güncellenemedi.' };
    }
  };

  const logout = async () => {
    setCustomSessionToken(null);
    setAccount(null);
    setAuthError(null);
    if (auth.currentUser) {
      await signOut(auth);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    const customToken = getCustomSessionToken();
    if (customToken) return customToken;
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        account,
        authLoading,
        authError,
        clearAuthError,
        signInWithPassword,
        registerMember,
        signInWithGoogle,
        updateProfile,
        changePassword,
        logout,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
