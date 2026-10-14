'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, AuthUser, AuthCompany, ApiError } from '../lib/api-client';
import type { LoginInput } from '@accounting/contracts';

export interface AuthContextType {
  user: AuthUser | null;
  companies: AuthCompany[];
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginInput, redirectTarget?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function sanitizeRedirectUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  // Only permit relative application paths, strictly rejecting protocol-relative URLs or scheme injection
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes(':') && !trimmed.includes('\\')) {
    return trimmed;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [companies, setCompanies] = useState<AuthCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      setUser(data.user);
      setCompanies(data.companies || []);
      setError(null);
    } catch {
      setUser(null);
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (credentials: LoginInput, redirectTarget?: string | null) => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.login(credentials);
      const meData = await authApi.getMe();
      setUser(meData.user);
      setCompanies(meData.companies || []);

      // Determine post-login redirect path
      const safeRedirect = sanitizeRedirectUrl(redirectTarget);
      if (safeRedirect && !safeRedirect.startsWith('/login') && !safeRedirect.startsWith('/onboarding')) {
        router.push(safeRedirect);
        return;
      }

      if (meData.companies && meData.companies.length > 0) {
        const primaryStore = meData.companies[0].slug;
        router.push(`/${primaryStore}/dashboard`);
      } else {
        // Zero active company memberships -> Route to onboarding
        router.push('/onboarding');
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Invalid email address or password.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Best-effort logout: even if server call errors, flush client state
    } finally {
      setUser(null);
      setCompanies([]);
      setIsLoading(false);
      router.push('/login');
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        companies,
        isLoading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        refreshSession,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
