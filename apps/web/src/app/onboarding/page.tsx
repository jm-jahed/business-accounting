'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ShieldAlert, LogOut, Mail, HelpCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { I18nProvider } from '../../i18n/context';
import { LanguageSelector } from '../../components/LanguageSelector';
import { SystemStatusBadge } from '../../components/SystemStatusBadge';

function OnboardingContent() {
  const router = useRouter();
  const { user, companies, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.replace('/login');
      } else if (companies && companies.length > 0) {
        router.replace(`/${companies[0].slug}/dashboard`);
      }
    }
  }, [isLoading, isAuthenticated, user, companies, router]);

  if (isLoading || !user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0B1220',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#C9A24B',
        }}
      >
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0B1220',
        color: '#F0F4FA',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          height: '64px',
          borderBottom: '1px solid #1D2A44',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          backgroundColor: '#0B1220',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#16223A',
              border: '1px solid #22304D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C9A24B',
            }}
          >
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#F0F4FA' }}>
              Universal Business Accounting
            </div>
            <div style={{ fontSize: '11px', color: '#7E8DA6' }}>
              Account Activation & Organization Workspace
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <SystemStatusBadge />
          <LanguageSelector />
          <button
            onClick={() => logout()}
            style={{
              background: '#16223A',
              border: '1px solid #22304D',
              borderRadius: '8px',
              color: '#94A3B8',
              padding: '6px 12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#111A2E',
            border: '1px solid #1D2A44',
            borderRadius: '16px',
            padding: '36px 32px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.35)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 20px',
              borderRadius: '16px',
              backgroundColor: 'rgba(224, 169, 59, 0.1)',
              border: '1px solid rgba(224, 169, 59, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E0A93B',
            }}
          >
            <ShieldAlert size={30} />
          </div>

          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#F0F4FA',
              marginBottom: '10px',
              letterSpacing: '-0.02em',
            }}
          >
            No Active Organization Membership
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: '#94A3B8',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}
          >
            Welcome, <strong style={{ color: '#F0F4FA' }}>{user.fullName || user.email}</strong>. Your authentication session is active and verified, but you have not yet been assigned to a company or store workspace.
          </p>

          <div
            style={{
              textAlign: 'left',
              backgroundColor: '#0B1220',
              border: '1px solid #1D2A44',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '24px',
              fontSize: '13px',
            }}
          >
            <div style={{ fontWeight: 600, color: '#C9A24B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={15} />
              <span>Next Steps to Access Your Workspace</span>
            </div>
            <ul style={{ paddingLeft: '18px', color: '#94A3B8', lineHeight: 1.6 }}>
              <li>
                Ask your company administrator to invite your email (<strong style={{ color: '#CBD5E1' }}>{user.email}</strong>) to their store.
              </li>
              <li>
                Once invited and accepted, return here or refresh your browser to access the general ledger.
              </li>
              <li>
                To switch accounts, sign out and use the credentials associated with an active store.
              </li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                flex: 1,
                height: '42px',
                backgroundColor: '#C9A24B',
                color: '#080D18',
                fontWeight: 600,
                fontSize: '13px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Check Membership Status
            </button>
            <button
              onClick={() => logout()}
              style={{
                height: '42px',
                padding: '0 16px',
                backgroundColor: '#16223A',
                border: '1px solid #22304D',
                color: '#CBD5E1',
                fontWeight: 500,
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
      </main>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <I18nProvider>
      <OnboardingContent />
    </I18nProvider>
  );
}
