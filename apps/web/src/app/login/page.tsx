'use client';

import React, { useState, useEffect, useId, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { Lock, Mail, Eye, EyeOff, Building2, ShieldCheck, AlertCircle, Loader2, ArrowRight, Link2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { I18nProvider, useI18n } from '../../i18n/context';
import { LanguageSelector } from '../../components/LanguageSelector';
import { SystemStatusBadge } from '../../components/SystemStatusBadge';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const {
    user,
    companies,
    isLoading: authLoading,
    isAuthenticated,
    login,
    loginWithGoogle,
    linkGoogleAccount,
    error: authError,
    clearError,
  } = useAuth();
  const { dict, locale } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Secure Account Linking State
  const [linkPending, setLinkPending] = useState<{ email: string; idToken: string } | null>(null);
  const [linkPassword, setLinkPassword] = useState('');
  const [showLinkPassword, setShowLinkPassword] = useState(false);

  const emailId = useId();
  const passwordId = useId();
  const linkPasswordId = useId();

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

  const handleGoogleCredentialResponse = useCallback(
    async (response: any) => {
      if (!response || !response.credential) {
        setLocalError('No credential received from Google.');
        return;
      }

      setSubmitting(true);
      setLocalError(null);
      clearError();

      try {
        await loginWithGoogle(response.credential, redirectTarget);
      } catch (err: any) {
        // Check if account exists and requires explicit password verification to link
        if (
          err?.status === 409 ||
          err?.details?.code === 'ACCOUNT_EXISTS_LINK_REQUIRED' ||
          err?.message?.includes('verify your password')
        ) {
          setLinkPending({
            email: err?.details?.email || '',
            idToken: response.credential,
          });
        } else {
          setLocalError(err?.message || 'Google authentication failed.');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [loginWithGoogle, redirectTarget, clearError]
  );

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkPending || !linkPassword) return;

    setSubmitting(true);
    setLocalError(null);
    clearError();

    try {
      await linkGoogleAccount(linkPending.idToken, linkPassword, redirectTarget);
      setLinkPending(null);
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to verify password and link Google identity.');
    } finally {
      setSubmitting(false);
    }
  };

  const initGoogleIdentityServices = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const google = typeof window !== 'undefined' ? (window as any).google : undefined;
    if (!google || !clientId) return;

    try {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      const btnContainer = document.getElementById('google-signin-btn-container');
      if (btnContainer) {
        btnContainer.innerHTML = '';
        google.accounts.id.renderButton(btnContainer, {
          theme: 'filled_black',
          size: 'large',
          width: 384,
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      }
    } catch (e) {
      console.warn('Google Identity Services initialization warning:', e);
    }
  }, [handleGoogleCredentialResponse]);

  useEffect(() => {
    const google = typeof window !== 'undefined' ? (window as any).google : undefined;
    if (google) {
      initGoogleIdentityServices();
    }
  }, [initGoogleIdentityServices]);

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

          {/* Social Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '22px 0 18px 0',
              gap: '12px',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: '#1D2A44' }} />
            <span
              style={{
                fontSize: '11px',
                color: '#7E8DA6',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Or continue with
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#1D2A44' }} />
          </div>

          {/* Google Sign In Container */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '44px',
            }}
          >
            <div id="google-signin-btn-container" style={{ width: '100%' }}>
              {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                <button
                  type="button"
                  disabled
                  title="Google Sign-In requires NEXT_PUBLIC_GOOGLE_CLIENT_ID"
                  style={{
                    width: '100%',
                    height: '44px',
                    backgroundColor: '#111C30',
                    border: '1px solid #22304D',
                    borderRadius: '8px',
                    color: '#7E8DA6',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: 'not-allowed',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                    />
                  </svg>
                  <span>Google Sign-In (Pending Client ID)</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Account Linking Modal Overlay */}
          {linkPending && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(5, 9, 17, 0.82)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '420px',
                  backgroundColor: '#111C30',
                  border: '1px solid #22304D',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: '#1E293B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#C9A24B',
                      }}
                    >
                      <Link2 size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#F0F4FA', margin: 0 }}>
                        Link Google Account
                      </h3>
                      <p style={{ fontSize: '12px', color: '#7E8DA6', margin: 0 }}>
                        Verify existing password to complete linking
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkPending(null);
                      setLinkPassword('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#7E8DA6',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5', marginBottom: '18px' }}>
                  An account already exists for <strong>{linkPending.email || 'this email'}</strong>. Enter your existing account password to authorize linking your Google identity.
                </p>

                <form onSubmit={handleLinkSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label
                      htmlFor={linkPasswordId}
                      style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#CBD5E1', marginBottom: '6px' }}
                    >
                      Current Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id={linkPasswordId}
                        type={showLinkPassword ? 'text' : 'password'}
                        required
                        disabled={submitting}
                        value={linkPassword}
                        onChange={(e) => setLinkPassword(e.target.value)}
                        placeholder="••••••••••••"
                        style={{
                          width: '100%',
                          height: '42px',
                          paddingLeft: '12px',
                          paddingRight: '36px',
                          backgroundColor: '#0B1220',
                          border: '1px solid #22304D',
                          borderRadius: '8px',
                          color: '#F0F4FA',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLinkPassword(!showLinkPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#7E8DA6',
                          cursor: 'pointer',
                        }}
                      >
                        {showLinkPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkPending(null);
                        setLinkPassword('');
                      }}
                      style={{
                        flex: 1,
                        height: '42px',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#F0F4FA',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !linkPassword}
                      style={{
                        flex: 2,
                        height: '42px',
                        backgroundColor: '#C9A24B',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#080D18',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      {submitting ? <Loader2 size={16} className="spin" /> : <span>Link & Continue</span>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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

      {/* Official Google Identity Services SDK Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleIdentityServices}
      />
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
