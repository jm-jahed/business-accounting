'use client';

import React, { useState, useEffect, useId, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, Building2, ShieldCheck, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { I18nProvider, useI18n } from '../../i18n/context';
import { LanguageSelector } from '../../components/LanguageSelector';
import { SystemStatusBadge } from '../../components/SystemStatusBadge';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const { user, companies, isLoading: authLoading, isAuthenticated, login, error: authError, clearError } = useAuth();
  const { dict, locale } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const emailId = useId();
  const passwordId = useId();

  // Redirect already authenticated users away from /login
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (companies && companies.length > 0) {
        router.replace(`/${companies[0].slug}/dashboard`);
      } else {
        router.replace('/onboarding');
      }
    }
  }, [authLoading, isAuthenticated, user, companies, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Email address is required.');
      return;
    }

    if (!password) {
      setLocalError('Password is required.');
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: trimmedEmail, password }, redirectTarget);
    } catch (err: any) {
      setLocalError(err?.message || 'Invalid email address or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedError = localError || authError;

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
      {/* Top Bar with Brand and Utilities */}
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
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#F0F4FA', letterSpacing: '-0.01em' }}>
              Universal Business Accounting
            </div>
            <div style={{ fontSize: '11px', color: '#7E8DA6' }}>
              Multi-Company Enterprise Financial Platform
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <SystemStatusBadge />
          <LanguageSelector />
        </div>
      </header>

      {/* Main Login Canvas */}
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
            maxWidth: '420px',
            backgroundColor: '#111A2E',
            border: '1px solid #1D2A44',
            borderRadius: '16px',
            padding: '36px 32px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* Card Header */}
          <div style={{ marginBottom: '28px', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(201, 162, 75, 0.1)',
                border: '1px solid rgba(201, 162, 75, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#C9A24B',
              }}
            >
              <ShieldCheck size={26} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#F0F4FA', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Sign In to Your Workspace
            </h1>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5 }}>
              Enter your corporate credentials to access your double-entry ledger and stores.
            </p>
          </div>

          {/* Error Banner */}
          {displayedError && (
            <div
              role="alert"
              aria-live="polite"
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(236, 90, 96, 0.12)',
                border: '1px solid rgba(236, 90, 96, 0.3)',
                color: '#EC5A60',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '13px',
                lineHeight: 1.4,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{displayedError}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor={emailId}
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#CBD5E1',
                  marginBottom: '8px',
                }}
              >
                Work Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#7E8DA6',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Mail size={16} />
                </div>
                <input
                  id={emailId}
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  disabled={submitting}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (localError) setLocalError(null);
                  }}
                  placeholder="accountant@company.ae"
                  style={{
                    width: '100%',
                    height: '44px',
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    backgroundColor: '#0B1220',
                    border: '1px solid #22304D',
                    borderRadius: '8px',
                    color: '#F0F4FA',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '28px' }}>
              <label
                htmlFor={passwordId}
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#CBD5E1',
                  marginBottom: '8px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#7E8DA6',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Lock size={16} />
                </div>
                <input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  disabled={submitting}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (localError) setLocalError(null);
                  }}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    height: '44px',
                    paddingLeft: '38px',
                    paddingRight: '40px',
                    backgroundColor: '#0B1220',
                    border: '1px solid #22304D',
                    borderRadius: '8px',
                    color: '#F0F4FA',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#7E8DA6',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                height: '46px',
                backgroundColor: '#C9A24B',
                color: '#080D18',
                fontWeight: 600,
                fontSize: '14px',
                borderRadius: '8px',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.15s ease, transform 0.05s ease',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #1D2A44',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#7E8DA6',
            }}
          >
            <ShieldCheck size={14} style={{ color: '#2FBF8F' }} />
            <span>End-to-end encrypted • Multi-tenant isolation</span>
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

export default function LoginPage() {
  return (
    <I18nProvider>
      <Suspense
        fallback={
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
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </I18nProvider>
  );
}
