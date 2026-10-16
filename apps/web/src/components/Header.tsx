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
        backgroundColor: 'var(--surface-1)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left: Mobile Toggle + Company Switcher + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        {/* Mobile Hamburger */}
        <button
          onClick={onOpenMobile}
          className="mobile-menu-btn"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            padding: '6px',
            display: 'none',
            borderRadius: '6px',
          }}
          aria-label="Open mobile navigation"
        >
          <Menu size={20} />
        </button>

        {/* Company Switcher Dropdown */}
        <div style={{ position: 'relative' }} ref={companyRef}>
          <button
            onClick={() => setShowCompanyMenu(!showCompanyMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '7px',
              backgroundColor: 'var(--surface-3)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 500,
              maxWidth: '260px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'border-color 150ms ease, background-color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-card)')}
          >
            <Building2 size={16} color="var(--gold)" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedCompany}
            </span>
            <ChevronDown size={14} color="var(--text-secondary)" />
          </button>

          {showCompanyMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                insetInlineStart: 0,
                width: '300px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border-card)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-elevated)',
                padding: '8px',
                zIndex: 40,
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.5px',
                  padding: '6px 8px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '4px',
                }}
              >
                ACTIVE STORE / TENANT ENTITY
              </div>
              {companies.map((c) => (
                <div
                  key={c.name}
                  onClick={() => {
                    onSelectCompany(c.name, c.slug);
                    setShowCompanyMenu(false);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: selectedCompany === c.name ? 'var(--surface-3)' : 'transparent',
                    border: selectedCompany === c.name ? '1px solid var(--gold)' : '1px solid transparent',
                    cursor: 'pointer',
                    marginBottom: '2px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {c.branch} • TRN: {c.trn}
                  </div>
                </div>
              ))}
              <div
                style={{
                  padding: '8px 10px',
                  fontSize: '11px',
                  color: 'var(--gold)',
                  backgroundColor: 'var(--gold-dim)',
                  borderRadius: '6px',
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Info size={14} />
                <span>{dict.header.activeCompanyNote}</span>
              </div>
            </div>
          )}
        </div>

        {/* Global Search Input */}
        <div
          className="header-search-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--surface-3)',
            border: '1px solid var(--border-card)',
            borderRadius: '7px',
            padding: '5px 10px',
            width: '280px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={dict.header.searchPlaceholder}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '12px',
              width: '100%',
            }}
          />
          <kbd
            onClick={onOpenCommandPalette}
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border-card)',
              borderRadius: '4px',
              padding: '1px 5px',
              letterSpacing: '0.2px',
              flexShrink: 0,
              cursor: 'pointer',
            }}
            title="Open command palette (Ctrl+K)"
          >
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right Controls: Date Range, Language/Currency, Theme, Notifications, User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Language & Currency Selectors */}
        <LanguageSelector />
        <CurrencySelector />

        {/* Light / Dark Theme Toggle */}
        <ThemeToggle />

        {/* Fiscal Calendar Badge */}
        <div
          className="header-fiscal-badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            backgroundColor: 'var(--surface-3)',
            border: '1px solid var(--border-card)',
            borderRadius: '7px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          <Calendar size={14} color="var(--gold)" />
          <span>{dict.header.fiscalYear}</span>
        </div>

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
              e.currentTarget.style.borderColor = 'var(--border-card)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            aria-label="View notifications"
          >
            <Bell size={15} />
            <span
              style={{
                position: 'absolute',
                top: '7px',
                right: '7px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--success)',
                boxShadow: '0 0 6px var(--success-glow)',
              }}
            />
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

        {/* User Monogram Profile */}
        <div style={{ position: 'relative' }} ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: 'var(--surface-3)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-primary)',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={14} color="var(--gold)" />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>
              {user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
            </span>
            <ChevronDown size={12} color="var(--text-secondary)" />
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
