'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Landmark,
  X,
  Layers,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  User,
  Users,
} from 'lucide-react';
import { SystemStatusBadge } from './SystemStatusBadge';
import { useI18n } from '../i18n/context';

interface SidebarProps {
  storeSlug?: string;
  activeTab: string;
  onTabChange?: (tabId: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ storeSlug, activeTab, onTabChange, mobileOpen, onCloseMobile }: SidebarProps) {
  const router = useRouter();
  const { dict } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navSections = [
    {
      title: dict.nav.coreFinancials,
      items: [
        { id: 'dashboard', label: dict.nav.dashboard, icon: <LayoutDashboard size={18} /> },
        { id: 'accounts', label: dict.nav.chartOfAccounts, icon: <Layers size={18} /> },
        { id: 'ledger', label: dict.nav.generalLedger, icon: <BookOpen size={18} /> },
      ],
    },
    {
      title: dict.nav.operations,
      items: [
        { id: 'sales', label: dict.nav.salesInvoices, icon: <Receipt size={18} /> },
        { id: 'purchases', label: dict.nav.purchasesExpenses, icon: <CreditCard size={18} /> },
        { id: 'banking', label: dict.nav.cashBanking, icon: <Landmark size={18} /> },
      ],
    },
    {
      title: dict.nav.reportsAndAudit,
      items: [
        { id: 'reports', label: dict.nav.financialReports, icon: <FileSpreadsheet size={18} /> },
        { id: 'team', label: 'Team & Access', icon: <Users size={18} /> },
        { id: 'settings', label: dict.nav.settings, icon: <Settings size={18} /> },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 18, 32, 0.75)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
          }}
          className="mobile-backdrop"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: isCollapsed ? '72px' : '250px',
          backgroundColor: '#111A2E',
          borderInlineEnd: '1px solid #1D2A44',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          zIndex: 50,
          transition: 'width 200ms ease',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: '62px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '0 12px' : '0 16px',
            borderBottom: '1px solid #1D2A44',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                minWidth: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #DFBF6E 0%, #C9A24B 100%)',
                boxShadow: '0 2px 8px rgba(201, 162, 75, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#0B1220',
                fontSize: '16px',
                letterSpacing: '-0.5px',
              }}
            >
              A
            </div>
            {!isCollapsed && (
              <div style={{ whiteSpace: 'nowrap' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#F0F4FA', letterSpacing: '-0.2px' }}>
                  Universal Accounting
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: '#C9A24B',
                    letterSpacing: '0.4px',
                    fontWeight: 600,
                  }}
                >
                  {dict.nav.enterpriseBadge}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Mobile Close Button */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="desktop-collapse-btn"
              style={{
                background: 'none',
                border: 'none',
                color: '#8A97B2',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '5px',
              }}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            </button>

            <button
              onClick={onCloseMobile}
              className="mobile-close-btn"
              style={{
                background: 'none',
                border: 'none',
                color: '#8A97B2',
                display: 'none',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav
          style={{
            padding: isCollapsed ? '16px 8px' : '16px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {navSections.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    color: '#7E8DA6',
                    padding: '4px 10px 8px',
                    textTransform: 'uppercase',
                  }}
                >
                  {section.title}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {section.items.map((item) => {
                  const active = activeTab === item.id;
                  const itemStyle: React.CSSProperties = {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: '10px',
                    width: '100%',
                    padding: isCollapsed ? '9px 0' : '8px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: active ? 600 : 500,
                    color: active ? '#F0F4FA' : '#8A97B2',
                    backgroundColor: active ? '#16223A' : 'transparent',
                    border: active ? '1px solid #22304D' : '1px solid transparent',
                    borderInlineStart: active ? '3px solid #C9A24B' : '3px solid transparent',
                    textAlign: 'start',
                    textDecoration: 'none',
                    transition: 'all 120ms ease',
                    cursor: 'pointer',
                  };

                  const innerContent = (
                    <>
                      <span style={{ color: active ? '#C9A24B' : '#7E8DA6', display: 'flex' }}>
                        {item.icon}
                      </span>
                      {!isCollapsed && <span>{item.label}</span>}
                    </>
                  );

                  if (storeSlug) {
                    return (
                      <Link
                        key={item.id}
                        href={`/${storeSlug}/${item.id}`}
                        onClick={() => {
                          onTabChange?.(item.id);
                          onCloseMobile();
                        }}
                        title={isCollapsed ? item.label : undefined}
                        style={itemStyle}
                      >
                        {innerContent}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange?.(item.id);
                        onCloseMobile();
                      }}
                      title={isCollapsed ? item.label : undefined}
                      style={itemStyle}
                    >
                      {innerContent}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile & Logout Section */}
        <div
          style={{
            padding: isCollapsed ? '10px 8px' : '10px 14px',
            borderTop: '1px solid #1D2A44',
            backgroundColor: '#0E1626',
          }}
        >
          {!isCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: '#1E2C48',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#C9A24B',
                    fontWeight: 700,
                    fontSize: '12px',
                    flexShrink: 0,
                  }}
                >
                  U
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#F0F4FA', whiteSpace: 'nowrap' }}>
                    Authorized User
                  </div>
                  <div style={{ fontSize: '10px', color: '#7E8DA6', whiteSpace: 'nowrap' }}>
                    /{storeSlug || 'store'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push('/login')}
                title="Logout"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7E8DA6',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: '#1E2C48',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C9A24B',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
                title="Jahed (Tenant DXB-01)"
              >
                J
              </div>
            </div>
          )}
        </div>

        {/* Real System Status Footer */}
        <div style={{ padding: isCollapsed ? '8px 4px' : '10px 14px', borderTop: '1px solid #1D2A44' }}>
          <SystemStatusBadge />
        </div>
      </aside>
    </>
  );
}
