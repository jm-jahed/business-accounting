'use client';

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
} from 'lucide-react';
import { useI18n } from '../i18n/context';
import { LanguageSelector, CurrencySelector } from './LanguageCurrencySelector';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onOpenMobile: () => void;
  selectedCompany: string;
  onSelectCompany: (company: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCommandPalette?: () => void;
}

export function Header({
  onOpenMobile,
  selectedCompany,
  onSelectCompany,
  searchQuery,
  onSearchChange,
  onOpenCommandPalette,
}: HeaderProps) {
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

  const sampleCompanies = [
    { name: 'Barakah Enterprises LLC', branch: 'Main Branch (DXB-01)', trn: '100293847500003' },
    { name: 'Emirates General Trading LLC', branch: 'Sharjah Facility', trn: '100349821100003' },
    { name: 'WebStudio Technologies FZ-LLC', branch: 'RAK Freezone', trn: '100119283400003' },
  ];

  return (
    <header
      style={{
        height: '62px',
        backgroundColor: 'rgba(17, 26, 46, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1D2A44',
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
            color: '#8A97B2',
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
              backgroundColor: '#16223A',
              border: '1px solid #22304D',
              color: '#F0F4FA',
              fontSize: '13px',
              fontWeight: 500,
              maxWidth: '260px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              transition: 'border-color 150ms ease, background-color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201, 162, 75, 0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#22304D')}
          >
            <Building2 size={16} color="#C9A24B" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedCompany}
            </span>
            <ChevronDown size={14} color="#8A97B2" />
          </button>

          {showCompanyMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                insetInlineStart: 0,
                width: '300px',
                backgroundColor: '#16223A',
                border: '1px solid #22304D',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                padding: '8px',
                zIndex: 40,
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#8A97B2',
                  letterSpacing: '0.5px',
                  padding: '6px 8px',
                  borderBottom: '1px solid #22304D',
                  marginBottom: '4px',
                }}
              >
                {dict.header.selectCompanyDemo}
              </div>
              {sampleCompanies.map((c) => (
                <div
                  key={c.name}
                  onClick={() => {
                    onSelectCompany(c.name);
                    setShowCompanyMenu(false);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: selectedCompany === c.name ? '#111A2E' : 'transparent',
                    border: selectedCompany === c.name ? '1px solid #C9A24B' : '1px solid transparent',
                    cursor: 'pointer',
                    marginBottom: '2px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#E6EAF2' }}>{c.name}</div>
                  <div style={{ fontSize: '11px', color: '#8A97B2', marginTop: '2px' }}>
                    {c.branch} • TRN: {c.trn}
                  </div>
                </div>
              ))}
              <div
                style={{
                  padding: '8px 10px',
                  fontSize: '11px',
                  color: '#C9A24B',
                  backgroundColor: 'rgba(201, 162, 75, 0.08)',
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
            backgroundColor: '#16223A',
            border: '1px solid #22304D',
            borderRadius: '7px',
            padding: '5px 10px',
            width: '280px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        >
          <Search size={14} color="#8A97B2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={dict.header.searchPlaceholder}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F0F4FA',
              fontSize: '12px',
              width: '100%',
            }}
          />
          <kbd
            onClick={onOpenCommandPalette}
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#7E8DA6',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid #22304D',
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
            backgroundColor: '#16223A',
            border: '1px solid #22304D',
            borderRadius: '7px',
            fontSize: '12px',
            color: '#94A3B8',
          }}
        >
          <Calendar size={14} color="#C9A24B" />
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
              backgroundColor: '#16223A',
              border: '1px solid #22304D',
              color: '#8A97B2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'border-color 150ms ease, color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(201, 162, 75, 0.4)';
              e.currentTarget.style.color = '#F0F4FA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#22304D';
              e.currentTarget.style.color = '#8A97B2';
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
                backgroundColor: '#2FBF8F',
                boxShadow: '0 0 6px rgba(47, 191, 143, 0.6)',
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
                backgroundColor: '#16223A',
                border: '1px solid #22304D',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                padding: '12px',
                zIndex: 40,
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#E6EAF2', marginBottom: '8px' }}>
                {dict.header.notificationsTitle}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#8A97B2' }}>
                  <CheckCircle2 size={14} color="#2FBF8F" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ color: '#E6EAF2', fontWeight: 500 }}>{dict.header.notifLedgerBalanced}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#8A97B2' }}>
                  <CheckCircle2 size={14} color="#C9A24B" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ color: '#E6EAF2', fontWeight: 500 }}>{dict.header.notifMongoCluster}</span>
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
              backgroundColor: '#16223A',
              border: '1px solid #22304D',
              color: '#E6EAF2',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: '#22304D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={14} color="#C9A24B" />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Jahed</span>
            <ChevronDown size={12} color="#8A97B2" />
          </button>

          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                insetInlineEnd: 0,
                width: '220px',
                backgroundColor: '#16223A',
                border: '1px solid #22304D',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                padding: '10px',
                zIndex: 40,
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#E6EAF2' }}>Jahed Chowdhury</div>
              <div style={{ fontSize: '11px', color: '#8A97B2' }}>{dict.header.userRole}</div>
              <div
                style={{
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid #22304D',
                  fontSize: '11px',
                  color: '#8A97B2',
                }}
              >
                {dict.header.sessionActive}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
