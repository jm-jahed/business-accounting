'use client';

import React, { use, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldAlert, ArrowRight, LogOut, Building2, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { COMPANY_SLUG_REGEX, RESERVED_COMPANY_SLUGS } from '@accounting/contracts';

interface StoreLayoutProps {
  params: Promise<{ storeSlug: string }>;
  children: React.ReactNode;
}

export default function StoreLayout({ params, children }: StoreLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { storeSlug } = use(params);

  const { user, companies, isLoading, isAuthenticated, logout } = useAuth();

  const normalizedSlug = storeSlug?.trim().toLowerCase();
  const isValidSlug =
    normalizedSlug &&
    COMPANY_SLUG_REGEX.test(normalizedSlug) &&
    !RESERVED_COMPANY_SLUGS.includes(normalizedSlug as any);

  const isMemberOfStore = companies.some((c) => c.slug === normalizedSlug);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        // Safe return path
        const returnUrl = encodeURIComponent(pathname || `/${normalizedSlug}/dashboard`);
        router.replace(`/login?redirect=${returnUrl}`);
      } else if (companies.length === 0) {
        router.replace('/onboarding');
      }
    }
  }, [isLoading, isAuthenticated, user, companies, normalizedSlug, pathname, router]);

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-canvas)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gold)',
        }}
      >
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Authenticated with zero companies
  if (companies.length === 0) {
    return null;
  }

  // Authenticated but unauthorized for the requested store slug (Cross-Tenant Boundary)
  if (!isMemberOfStore) {
    const primaryCompany = companies[0];

    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-canvas)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: 'var(--shadow-elevated)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 16px',
              borderRadius: '16px',
              backgroundColor: 'var(--danger-dim)',
              border: '1px solid var(--danger-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger)',
            }}
          >
            <ShieldAlert size={28} />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Store Access Restricted
          </h2>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
            You are signed in as <strong style={{ color: 'var(--text-primary)' }}>{user.email}</strong>, but your account is not an authorized member of store <code style={{ color: 'var(--gold)', backgroundColor: 'var(--surface-3)', padding: '2px 6px', borderRadius: '4px' }}>{normalizedSlug}</code>.
          </p>

          <div
            style={{
              backgroundColor: 'var(--surface-3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Your Authorized Stores:
            </div>
            {companies.map((c) => (
              <div key={c.companyId} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Building2 size={13} style={{ color: 'var(--gold)' }} />
                <span style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>({c.slug})</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => router.push(`/${primaryCompany.slug}/dashboard`)}
              style={{
                flex: 1,
                height: '42px',
                backgroundColor: 'var(--gold)',
                color: 'var(--bg-canvas)',
                fontWeight: 600,
                fontSize: '13px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>Go to {primaryCompany.name}</span>
              <ArrowRight size={15} />
            </button>
            <button
              onClick={() => logout()}
              style={{
                height: '42px',
                padding: '0 16px',
                backgroundColor: 'var(--surface-3)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized member of store -> Render workspace children
  return <>{children}</>;
}
