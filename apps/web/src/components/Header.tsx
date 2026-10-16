import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Search,
  Calendar,
  User,
  ChevronDown,
  Bell,
  Menu,
  CheckCircle2,
  Info,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useI18n } from '../i18n/context';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSelector, CurrencySelector } from './LanguageCurrencySelector';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  storeSlug?: string;
  onOpenMobile: () => void;
  selectedCompany: string;
  onSelectCompany: (company: string, slug?: string) => void;
  companiesList?: Array<{ name: string; slug: string; branch?: string; trn?: string }>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCommandPalette?: () => void;
}

export function Header({
  storeSlug: _storeSlug,
  onOpenMobile,
  selectedCompany,
  onSelectCompany,
  companiesList,
  searchQuery,
  onSearchChange,
  onOpenCommandPalette,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { dict } = useI18n();

  const companyRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) {
        setShowCompanyMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const companies = companiesList && companiesList.length > 0 ? companiesList : [
    { name: selectedCompany, slug: _storeSlug || 'store', branch: 'Authorized Entity', trn: 'Active Boundary' },
  ];

  return (
    <header
      style={{
        height: '62px',
        backgroundColor: '#070B14',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left: Mobile/Desktop Hamburger + Capsule Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
        {/* Luxury Gold Hamburger Button - Strictly hidden on desktop web via .header-hamburger-btn */}
        <button
          onClick={onOpenMobile}
          className="header-hamburger-btn"
          aria-label="Toggle navigation"
        >
          <Menu size={22} color="#F59E0B" />
        </button>

        {/* Global Luxury Capsule Search Input */}
        <div
          className="header-search-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '7px 16px',
            width: '360px',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}
          onFocusCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(201, 162, 75, 0.5)')}
          onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
        >
          <Search size={15} color="#94A3B8" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search anything..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F8FAFC',
              fontSize: '13px',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Right Controls: Notification Bell, Settings Gear, User Profile Capsule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

        {/* Notifications Icon Button */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '7px',
              backgroundColor: 'var(--surface-3)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'border-color 150ms ease, color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            aria-label="View notifications"
          >
            <Bell size={17} />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #0B1220',
              }}
            >
              2
            </span>
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                insetInlineEnd: 0,
                width: '280px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border-card)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-elevated)',
                padding: '12px',
                zIndex: 40,
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {dict.header.notificationsTitle}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{dict.header.notifLedgerBalanced}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{dict.header.notifMongoCluster}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings Gear Quick Action */}
        <button
          onClick={() => {
            if (_storeSlug) {
              window.location.href = `/${_storeSlug}/settings`;
            }
          }}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--gold-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Settings"
          aria-label="Open settings"
        >
          <SettingsIcon size={17} />
        </button>

        {/* User Luxury Profile Card */}
        <div style={{ position: 'relative' }} ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '3px 12px 3px 4px',
              borderRadius: '28px',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201, 162, 75, 0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F3D086 0%, #C9A24B 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0B1220',
                fontWeight: 800,
                fontSize: '12px',
                boxShadow: '0 2px 8px rgba(201, 162, 75, 0.35)',
                flexShrink: 0,
              }}
            >
              {user?.fullName
                ? user.fullName
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'SA'}
            </div>
            <div className="header-user-info-text" style={{ textAlign: 'start', lineHeight: 1.25 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap' }}>
                {user?.fullName || 'Saiful Ahmed'}
              </div>
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, whiteSpace: 'nowrap' }}>
                Administrator
              </div>
            </div>
            <ChevronDown size={13} color="var(--text-secondary)" />
          </button>

          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                insetInlineEnd: 0,
                width: '240px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border-card)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-elevated)',
                padding: '12px',
                zIndex: 40,
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.fullName || 'User'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{user?.email}</div>
              <div
                style={{
                  marginTop: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} />
                  <span>{dict.header.sessionActive}</span>
                </div>
                <button
                  onClick={() => logout()}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 0',
                  }}
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
