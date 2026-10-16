'use client';

import React, { useState, useEffect, useId, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  HelpCircle,
  Link2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { I18nProvider, useI18n } from '../../i18n/context';
import { LanguageSelector } from '../../components/LanguageSelector';
import { SystemStatusBadge } from '../../components/SystemStatusBadge';

function LuxuryGoldEmblem() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="gold-emblem-svg"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Ambient Gold Glow Filter */}
        <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComponentTransfer in="blur" result="glow1">
            <feFuncA type="linear" slope="0.6" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Facet Lighting Gradients */}
        <linearGradient id="goldTopPeak" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF7CC" />
          <stop offset="40%" stopColor="#F5D77F" />
          <stop offset="100%" stopColor="#C9A24B" />
        </linearGradient>

        <linearGradient id="goldLightFacet" x1="0%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFECA8" />
          <stop offset="50%" stopColor="#E2BD63" />
          <stop offset="100%" stopColor="#B3892F" />
        </linearGradient>

        <linearGradient id="goldMidFacet" x1="20%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E6C25E" />
          <stop offset="60%" stopColor="#AD8224" />
          <stop offset="100%" stopColor="#78550E" />
        </linearGradient>

        <linearGradient id="goldDarkFacet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B88E33" />
          <stop offset="70%" stopColor="#6E4E10" />
          <stop offset="100%" stopColor="#3D2905" />
        </linearGradient>

        <linearGradient id="goldStarTip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF3B8" />
          <stop offset="60%" stopColor="#D4AE47" />
          <stop offset="100%" stopColor="#8C6619" />
        </linearGradient>
      </defs>

      {/* Outer 6-Pointed Star Points */}
      <g filter="url(#goldGlow)">
        {/* Top Point */}
        <polygon points="50,4 40,28 50,22 60,28" fill="url(#goldStarTip)" />
        <polygon points="50,4 40,28 50,22" fill="url(#goldTopPeak)" opacity="0.9" />

        {/* Top-Right Point */}
        <polygon points="90,27 68,34 70,24 80,17" fill="url(#goldLightFacet)" />
        <polygon points="90,27 68,34 75,44" fill="url(#goldMidFacet)" />

        {/* Bottom-Right Point */}
        <polygon points="90,73 68,66 75,56" fill="url(#goldMidFacet)" />
        <polygon points="90,73 68,66 70,76 80,83" fill="url(#goldDarkFacet)" />

        {/* Bottom Point */}
        <polygon points="50,96 40,72 50,78 60,72" fill="url(#goldDarkFacet)" />
        <polygon points="50,96 60,72 50,78" fill="url(#goldMidFacet)" />

        {/* Bottom-Left Point */}
        <polygon points="10,73 32,66 25,56" fill="url(#goldMidFacet)" />
        <polygon points="10,73 32,66 30,76 20,83" fill="url(#goldDarkFacet)" />

        {/* Top-Left Point */}
        <polygon points="10,27 32,34 25,44" fill="url(#goldMidFacet)" />
        <polygon points="10,27 32,34 30,24 20,17" fill="url(#goldLightFacet)" />

        {/* Center 3D Isometric Faceted Cube */}
        {/* Top Rhombus Facet */}
        <polygon points="50,22 75,36 50,50 25,36" fill="url(#goldTopPeak)" />
        <line x1="50" y1="22" x2="50" y2="50" stroke="#FFF7CC" strokeWidth="0.8" opacity="0.6" />

        {/* Left Rhombus Facet */}
        <polygon points="25,36 50,50 50,78 25,64" fill="url(#goldMidFacet)" />

        {/* Right Rhombus Facet */}
        <polygon points="50,50 75,36 75,64 50,78" fill="url(#goldDarkFacet)" />

        {/* Center Facet Ridge Lines */}
        <line x1="50" y1="50" x2="50" y2="78" stroke="#FFECA8" strokeWidth="0.9" opacity="0.5" />
        <line x1="25" y1="36" x2="50" y2="50" stroke="#FFF7CC" strokeWidth="0.9" opacity="0.7" />
        <line x1="75" y1="36" x2="50" y2="50" stroke="#E2BD63" strokeWidth="0.7" opacity="0.6" />
      </g>
    </svg>
  );
}

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
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Forgot password help modal state
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  // Secure Account Linking State (Google SSO 409)
  const [linkPending, setLinkPending] = useState<{ email: string; idToken: string } | null>(null);
  const [linkPassword, setLinkPassword] = useState('');
  const [showLinkPassword, setShowLinkPassword] = useState(false);

  const emailId = useId();
  const passwordId = useId();
  const rememberMeId = useId();
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
      setLocalError('Please enter your username or email address.');
      return;
    }

    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: trimmedEmail, password }, redirectTarget);
    } catch (err: any) {
      setLocalError(err?.message || 'Invalid username or password.');
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

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isGoogleSsoConfigured = Boolean(googleClientId && googleClientId.trim().length > 0);

  const initGoogleIdentityServices = useCallback(() => {
    if (!isGoogleSsoConfigured) return;
    const google = typeof window !== 'undefined' ? (window as any).google : undefined;
    if (!google || !googleClientId) return;

    try {
      google.accounts.id.initialize({
        client_id: googleClientId,
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
          width: 340,
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      }
    } catch (e) {
      console.warn('Google Identity Services initialization warning:', e);
    }
  }, [googleClientId, isGoogleSsoConfigured, handleGoogleCredentialResponse]);

  useEffect(() => {
    if (isGoogleSsoConfigured) {
      const google = typeof window !== 'undefined' ? (window as any).google : undefined;
      if (google) {
        initGoogleIdentityServices();
      }
    }
  }, [isGoogleSsoConfigured, initGoogleIdentityServices]);

  const displayedError = localError || authError;

  return (
    <div className="luxury-login-root">
      {/* Top Bar Floating Utilities */}
      <div className="top-utility-bar">
        <SystemStatusBadge />
        <LanguageSelector />
      </div>

      {/* Subtle Backdrop Darkening for High-Contrast Luxury Feel */}
      <div className="luxury-backdrop-overlay" />

      {/* Main Luxury Stage */}
      <div className="luxury-login-stage">
        {/* BRAND IDENTITY BLOCK ABOVE CARD */}
        <header className="brand-header-group">
          {/* 3D Geometric Gold Emblem */}
          <div className="emblem-wrapper">
            <LuxuryGoldEmblem />
          </div>

          {/* GLOBAL ERP Title */}
          <div className="brand-title-row">
            <span className="brand-title-global">GLOBAL</span>{' '}
            <span className="brand-title-erp">ERP</span>
          </div>

          {/* Subtitle */}
          <div className="brand-subtitle">ENTERPRISE RESOURCE PLANNING</div>

          {/* Tagline with Diamond Accents */}
          <div className="brand-tagline">
            <span className="tagline-diamond">◆</span>
            <span>POWERING POSSIBILITIES. DRIVING EXCELLENCE.</span>
            <span className="tagline-diamond">◆</span>
          </div>
        </header>

        {/* LUXURY FROSTED GLASS CARD */}
        <main className="luxury-card">
          {/* Card Header */}
          <div className="card-header">
            <div className="welcome-title-row">
              <ShieldCheck size={24} className="welcome-shield" />
              <h1 className="welcome-title">Welcome Back</h1>
            </div>
            <p className="welcome-subtitle">
              Sign in to access your secure ERP dashboard
            </p>
          </div>

          {/* Error Notification Banner */}
          {displayedError && (
            <div role="alert" aria-live="polite" className="error-alert-banner">
              <AlertCircle size={17} className="error-icon" />
              <span className="error-text">{displayedError}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} noValidate className="login-form">
            {/* Username / Email Field */}
            <div className="field-group">
              <label htmlFor={emailId} className="field-label">
                Username / Email
              </label>
              <div className="input-box">
                <div className="input-leading-icon">
                  <User size={17} />
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
                  placeholder="Enter your username or email"
                  className="luxury-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="field-group">
              <label htmlFor={passwordId} className="field-label">
                Password
              </label>
              <div className="input-box">
                <div className="input-leading-icon">
                  <Lock size={17} />
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
                  placeholder="Enter your password"
                  className="luxury-input has-toggle"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="remember-forgot-row">
              <label htmlFor={rememberMeId} className="remember-checkbox-label">
                <input
                  id={rememberMeId}
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="luxury-checkbox"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setSupportModalOpen(true)}
                className="forgot-password-link"
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Securely Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-gold-submit"
            >
              {submitting ? (
                <>
                  <Loader2 size={19} className="btn-spinner" />
                  <span>Signing In Securely...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={19} className="btn-shield-icon" />
                  <span>Sign In Securely</span>
                </>
              )}
            </button>
          </form>

          {/* Google SSO — Rendered only if configured in environment */}
          {isGoogleSsoConfigured && (
            <div className="google-sso-wrapper">
              <div className="divider-row">
                <span className="divider-line" />
                <span className="divider-label">Or authenticate with</span>
                <span className="divider-line" />
              </div>
              <div id="google-signin-btn-container" className="google-btn-mount" />
            </div>
          )}

          {/* Bottom Protected Access Strip */}
          <footer className="card-footer-protected">
            <div className="footer-diamond">◆</div>
            <div className="protected-badge-row">
              <ShieldCheck size={15} className="protected-shield-icon" />
              <span className="protected-badge-text">Protected Access</span>
            </div>
            <div className="footer-compliance-row">
              <span>Enterprise-grade security</span>
              <span className="pipe-sep">|</span>
              <span>256-bit SSL Encryption</span>
              <span className="pipe-sep">|</span>
              <span>Multi-factor ready</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Forgot Password / Credential Assistance Modal */}
      {supportModalOpen && (
        <div className="modal-backdrop-overlay" role="dialog" aria-modal="true">
          <div className="luxury-modal-card">
            <div className="modal-header-row">
              <div className="modal-icon-badge">
                <HelpCircle size={22} />
              </div>
              <div className="modal-title-group">
                <h3 className="modal-title">Credential Assistance</h3>
                <p className="modal-subtitle">Enterprise Security Policy</p>
              </div>
              <button
                type="button"
                onClick={() => setSupportModalOpen(false)}
                className="modal-close-btn"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-text">
                To guarantee strict enterprise tenant isolation and audit trail compliance, self-service email credential resets are handled securely through your company administrator.
              </p>
              <div className="modal-steps-box">
                <div className="modal-step-item">
                  <CheckCircle2 size={16} className="modal-step-check" />
                  <span>Contact your <strong>Company Administrator</strong> or <strong>IT Security Officer</strong> to reset your access.</span>
                </div>
                <div className="modal-step-item">
                  <CheckCircle2 size={16} className="modal-step-check" />
                  <span>Administrators can issue temporary credentials via <strong>Settings → Users & Roles</strong>.</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setSupportModalOpen(false)}
                className="btn-modal-dismiss"
              >
                Understood / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Linking Modal (Google SSO existing user) */}
      {linkPending && (
        <div className="modal-backdrop-overlay" role="dialog" aria-modal="true">
          <div className="luxury-modal-card">
            <div className="modal-header-row">
              <div className="modal-icon-badge">
                <Link2 size={22} />
              </div>
              <div className="modal-title-group">
                <h3 className="modal-title">Link Corporate Identity</h3>
                <p className="modal-subtitle">
                  Account <span className="highlight-gold">{linkPending.email}</span> already exists
                </p>
              </div>
            </div>

            <p className="modal-text">
              Enter your corporate password to securely verify your identity and link your Google SSO credentials.
            </p>

            <form onSubmit={handleLinkSubmit} noValidate>
              <div className="field-group" style={{ marginBottom: '18px' }}>
                <label htmlFor={linkPasswordId} className="field-label">
                  Corporate Password
                </label>
                <div className="input-box">
                  <div className="input-leading-icon">
                    <Lock size={17} />
                  </div>
                  <input
                    id={linkPasswordId}
                    type={showLinkPassword ? 'text' : 'password'}
                    required
                    disabled={submitting}
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="luxury-input has-toggle"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowLinkPassword(!showLinkPassword)}
                    className="password-toggle-btn"
                  >
                    {showLinkPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="modal-dual-actions">
                <button
                  type="button"
                  onClick={() => {
                    setLinkPending(null);
                    setLinkPassword('');
                  }}
                  className="btn-modal-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !linkPassword}
                  className="btn-modal-confirm"
                >
                  {submitting ? <Loader2 size={16} className="btn-spinner" /> : <span>Verify & Link</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scoped High-Fidelity Luxury Stylesheet */}
      <style jsx>{`
        /* ===================================================================
           LUXURY EXECUTIVE ROOT CONTAINER & BACKGROUND
           =================================================================== */
        .luxury-login-root {
          min-height: 100vh;
          width: 100%;
          position: relative;
          background-color: #050e0a;
          background-image: url('/images/luxury-login-bg.jpg');
          background-position: center center;
          background-repeat: no-repeat;
          background-size: cover;
          background-attachment: fixed;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          box-sizing: border-box;
          overflow-x: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Subtle Dark Radial Vignette Overlay for Crisp Contrast */
        .luxury-backdrop-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at 50% 45%,
            rgba(3, 10, 7, 0.2) 0%,
            rgba(3, 10, 7, 0.5) 70%,
            rgba(2, 6, 4, 0.8) 100%
          );
          pointer-events: none;
          z-index: 1;
        }

        /* Floating Top Utility Bar */
        .top-utility-bar {
          position: absolute;
          top: 16px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 20;
          opacity: 0.85;
          transition: opacity 0.2s ease;
        }

        .top-utility-bar:hover {
          opacity: 1;
        }

        /* Centered Stage Wrapper */
        .luxury-login-stage {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 430px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* ===================================================================
           BRAND IDENTITY HEADER (Above the card)
           =================================================================== */
        .brand-header-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 16px;
          user-select: none;
        }

        .emblem-wrapper {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          filter: drop-shadow(0 4px 14px rgba(212, 175, 55, 0.45));
          animation: subtleFloat 6s ease-in-out infinite;
        }

        .gold-emblem-svg {
          width: 100%;
          height: 100%;
        }

        .brand-title-row {
          font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.2em;
          line-height: 1.1;
          margin-bottom: 4px;
          padding-left: 0.2em;
        }

        .brand-title-global {
          color: #f8fafc;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 255, 255, 0.25);
        }

        .brand-title-erp {
          background: linear-gradient(180deg, #fff2b2 0%, #e6c25e 50%, #c9a24b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 8px rgba(201, 162, 75, 0.5));
        }

        .brand-subtitle {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.35em;
          color: #d4af37;
          text-transform: uppercase;
          margin-bottom: 6px;
          padding-left: 0.35em;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
        }

        .brand-tagline {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.22em;
          color: #f1f5f9;
          opacity: 0.85;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
          padding-left: 0.22em;
        }

        .tagline-diamond {
          color: #d4af37;
          font-size: 6.5px;
          opacity: 0.9;
        }

        /* ===================================================================
           LUXURY FROSTED GLASS LOGIN CARD
           =================================================================== */
        .luxury-card {
          width: 100%;
          background: linear-gradient(
            160deg,
            rgba(12, 28, 22, 0.72) 0%,
            rgba(7, 18, 14, 0.84) 100%
          );
          backdrop-filter: blur(28px) saturate(150%);
          -webkit-backdrop-filter: blur(28px) saturate(150%);
          border: 1px solid rgba(212, 175, 55, 0.42);
          border-radius: 20px;
          padding: 28px 28px 20px;
          box-shadow:
            0 25px 60px rgba(0, 0, 0, 0.85),
            0 0 45px rgba(16, 185, 129, 0.08),
            inset 0 1px 1px rgba(255, 255, 255, 0.18),
            inset 0 0 20px rgba(201, 162, 75, 0.06);
          box-sizing: border-box;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        /* Card Header */
        .card-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .welcome-title-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-bottom: 5px;
        }

        .welcome-shield {
          color: #e6c97a;
          filter: drop-shadow(0 2px 6px rgba(230, 201, 122, 0.45));
          flex-shrink: 0;
        }

        .welcome-title {
          font-family: 'Playfair Display', 'Cinzel', Georgia, serif;
          font-size: 24px;
          font-weight: 600;
          color: #f8fafc;
          letter-spacing: -0.01em;
          margin: 0;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
        }

        .welcome-subtitle {
          font-size: 12.5px;
          color: #94a3b8;
          margin: 0;
          line-height: 1.4;
        }

        /* Error Banner */
        .error-alert-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          background: rgba(220, 38, 38, 0.16);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 10px;
          color: #fca5a5;
          font-size: 12.5px;
          line-height: 1.4;
          margin-bottom: 16px;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.12);
        }

        .error-icon {
          color: #ef4444;
          flex-shrink: 0;
        }

        .error-text {
          flex: 1;
        }

        /* Form Styles */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 12px;
          font-weight: 500;
          color: #cbd5e1;
          letter-spacing: 0.01em;
        }

        .input-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-leading-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          pointer-events: none;
          transition: color 0.15s ease;
        }

        .luxury-input {
          width: 100%;
          height: 45px;
          background: rgba(4, 14, 10, 0.72);
          border: 1px solid rgba(212, 175, 55, 0.32);
          border-radius: 10px;
          padding: 0 14px 0 42px;
          color: #f8fafc;
          font-size: 13.5px;
          font-family: inherit;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
        }

        .luxury-input.has-toggle {
          padding-right: 44px;
        }

        .luxury-input::placeholder {
          color: #52637a;
          font-size: 13px;
        }

        .luxury-input:focus {
          outline: none;
          border-color: #e6c97a;
          background: rgba(6, 18, 14, 0.88);
          box-shadow:
            0 0 0 3px rgba(230, 201, 122, 0.22),
            inset 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        .input-box:focus-within .input-leading-icon {
          color: #e6c97a;
        }

        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: color 0.15s ease;
        }

        .password-toggle-btn:hover {
          color: #e6c97a;
        }

        /* Remember Me & Forgot Password */
        .remember-forgot-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          margin-top: -2px;
          margin-bottom: 2px;
        }

        .remember-checkbox-label {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #a6b0c3;
          cursor: pointer;
          user-select: none;
        }

        .luxury-checkbox {
          width: 15px;
          height: 15px;
          border-radius: 4px;
          accent-color: #c9a24b;
          cursor: pointer;
        }

        .forgot-password-link {
          background: none;
          border: none;
          color: #e6c97a;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease, text-decoration 0.15s ease;
        }

        .forgot-password-link:hover {
          color: #fff2b2;
          text-decoration: underline;
        }

        /* Sign In Securely Button */
        .btn-gold-submit {
          width: 100%;
          height: 46px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          background: linear-gradient(180deg, #f5d77f 0%, #c9a24b 55%, #a88126 100%);
          color: #0b1410;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow:
            0 6px 20px rgba(201, 162, 75, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          margin-top: 2px;
        }

        .btn-gold-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          background: linear-gradient(180deg, #fff0b3 0%, #dfbf6e 55%, #bd9433 100%);
          box-shadow:
            0 9px 26px rgba(201, 162, 75, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .btn-gold-submit:active:not(:disabled) {
          transform: translateY(0);
          box-shadow:
            0 3px 12px rgba(201, 162, 75, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .btn-gold-submit:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .btn-shield-icon {
          color: #0b1410;
        }

        .btn-spinner {
          animation: spin 1s linear infinite;
        }

        /* Google SSO Integration */
        .google-sso-wrapper {
          margin-top: 16px;
        }

        .divider-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        .divider-label {
          font-size: 10.5px;
          color: #7e8da6;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .google-btn-mount {
          display: flex;
          justify-content: center;
        }

        /* Card Footer: Protected Access */
        .card-footer-protected {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-top: 18px;
          user-select: none;
        }

        .footer-diamond {
          color: #c9a24b;
          font-size: 7px;
          opacity: 0.9;
          margin-bottom: 7px;
        }

        .protected-badge-row {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #e6c97a;
          margin-bottom: 5px;
        }

        .protected-shield-icon {
          color: #e6c97a;
          filter: drop-shadow(0 1px 4px rgba(230, 201, 122, 0.4));
        }

        .protected-badge-text {
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .footer-compliance-row {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 10px;
          color: #7e8da6;
          line-height: 1.4;
        }

        .pipe-sep {
          color: #3b4d66;
        }

        /* ===================================================================
           LUXURY MODALS (Forgot Password & Google Account Linking)
           =================================================================== */
        .modal-backdrop-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(3, 8, 6, 0.88);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 100;
        }

        .luxury-modal-card {
          width: 100%;
          max-width: 440px;
          background: linear-gradient(160deg, #0e1e17 0%, #07130e 100%);
          border: 1px solid rgba(212, 175, 55, 0.5);
          border-radius: 16px;
          padding: 24px;
          box-shadow:
            0 25px 60px rgba(0, 0, 0, 0.9),
            0 0 35px rgba(201, 162, 75, 0.15);
          box-sizing: border-box;
        }

        .modal-header-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }

        .modal-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(201, 162, 75, 0.12);
          border: 1px solid rgba(201, 162, 75, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e6c97a;
          flex-shrink: 0;
        }

        .modal-title-group {
          flex: 1;
        }

        .modal-title {
          font-size: 16px;
          font-weight: 700;
          color: #f8fafc;
          margin: 0 0 2px 0;
        }

        .modal-subtitle {
          font-size: 11.5px;
          color: #c9a24b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: #7e8da6;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }

        .modal-close-btn:hover {
          color: #f8fafc;
        }

        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 20px;
        }

        .modal-text {
          font-size: 13px;
          line-height: 1.55;
          color: #a6b0c3;
          margin: 0;
        }

        .modal-steps-box {
          background-color: rgba(4, 12, 8, 0.85);
          border: 1px solid rgba(212, 175, 55, 0.25);
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .modal-step-item {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          font-size: 12.5px;
          color: #f8fafc;
          line-height: 1.45;
        }

        .modal-step-check {
          color: #10b981;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
        }

        .btn-modal-dismiss {
          width: 100%;
          height: 42px;
          background: linear-gradient(180deg, #e6c97a 0%, #c9a24b 100%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: #0b1410;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
        }

        .modal-dual-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }

        .btn-modal-cancel {
          flex: 1;
          height: 42px;
          background: rgba(22, 34, 28, 0.7);
          border: 1px solid #26324a;
          border-radius: 8px;
          color: #f8fafc;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-modal-confirm {
          flex: 1.8;
          height: 42px;
          background: linear-gradient(180deg, #e6c97a 0%, #c9a24b 100%);
          border: none;
          border-radius: 8px;
          color: #0b1410;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .highlight-gold {
          color: #e6c97a;
          font-weight: 600;
        }

        /* ===================================================================
           ANIMATIONS & MEDIA QUERIES
           =================================================================== */
        @keyframes subtleFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 480px) {
          .luxury-login-root {
            padding: 32px 12px 24px;
          }

          .brand-title-row {
            font-size: 26px;
          }

          .brand-subtitle {
            font-size: 9.5px;
          }

          .brand-tagline {
            font-size: 7.5px;
            gap: 6px;
          }

          .luxury-card {
            padding: 26px 20px 20px;
            border-radius: 16px;
          }

          .welcome-title {
            font-size: 22px;
          }

          .welcome-subtitle {
            font-size: 12px;
          }

          .luxury-input {
            height: 44px;
            font-size: 16px; /* Prevents auto-zoom on iOS */
          }

          .btn-gold-submit {
            height: 46px;
            font-size: 14px;
          }
        }
      `}</style>

      {/* Official Google Identity Services SDK Script — Only rendered when configured */}
      {isGoogleSsoConfigured && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={initGoogleIdentityServices}
        />
      )}
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
              backgroundColor: '#050E0A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C9A24B',
            }}
          >
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </I18nProvider>
  );
}
