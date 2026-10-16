'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  TrendingUp,
  CheckSquare,
  Receipt,
  Store,
  ShoppingCart,
  Boxes,
  Factory,
  Users,
  Target,
  Briefcase,
  Landmark,
  UserCheck,
  FileSpreadsheet,
  ArrowLeftRight,
  Settings,
  ChevronDown,
  ChevronRight,
  Lock,
  PanelLeftClose,
  PanelLeft,
  X,
  LogOut,
  Layers,
} from 'lucide-react';
import { SYSTEM_MENUS, MenuItem } from '@accounting/contracts';
import { SystemStatusBadge } from './SystemStatusBadge';
import { useI18n } from '../i18n/context';

interface SidebarProps {
  storeSlug?: string;
  activeTab?: string;
  activePath?: string;
  onTabChange?: (tabId: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

/**
 * Business Pack & Module Enablement Stub
 * Rule: Central single function for module activation checks. Currently returns false until Phase B toggles land.
 */
export function isModuleEnabled(_moduleKey?: string): boolean {
  return false;
}

const MENU_ICONS: Record<string, React.ReactNode> = {
  dashboard: <Home size={18} />,
  tasks: <CheckSquare size={18} />,
  sell: <TrendingUp size={18} />,
  'counter-sale': <Store size={18} />,
  buy: <ShoppingCart size={18} />,
  stock: <Boxes size={18} />,
  production: <Factory size={18} />,
  customers: <Users size={18} />,
  leads: <Target size={18} />,
  jobs: <Briefcase size={18} />,
  money: <Landmark size={18} />,
  staff: <UserCheck size={18} />,
  reports: <FileSpreadsheet size={18} />,
  'import-export': <ArrowLeftRight size={18} />,
  settings: <Settings size={18} />,
};

export function Sidebar({
  storeSlug,
  activeTab,
  activePath,
  onTabChange,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, dict } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showHiddenDev, setShowHiddenDev] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  const isDev = process.env.NODE_ENV !== 'production';

  // Determine current active path
  const currentPath = useMemo(() => {
    if (activePath) return activePath;
    if (pathname && storeSlug) {
      const prefix = `/${storeSlug}`;
      if (pathname.startsWith(prefix)) {
        return pathname.slice(prefix.length) || '/dashboard';
      }
    }
    if (activeTab) {
      if (activeTab === 'accounts' || activeTab === 'coa') return '/money/account-list';
      if (activeTab === 'ledger') return '/money/account-book';
      if (activeTab === 'inventory') return '/stock/items';
      if (activeTab === 'team') return '/settings/team-permissions';
      if (activeTab === 'banking') return '/money/cash-bank';
      return `/${activeTab}`;
    }
    return '/dashboard';
  }, [activePath, pathname, storeSlug, activeTab]);

  // Automatically expand parent submenu containing the current path
  useEffect(() => {
    for (const menu of SYSTEM_MENUS) {
      if (menu.children && menu.children.some((c) => c.path === currentPath || currentPath.startsWith(c.path))) {
        setOpenSubMenus((prev) => ({ ...prev, [menu.key]: true }));
        break;
      }
      if (currentPath.startsWith(menu.path)) {
        setOpenSubMenus((prev) => ({ ...prev, [menu.key]: true }));
      }
    }
  }, [currentPath]);

  // Filter visible menus based on production invariants and dev toggle
  const visibleMenus = useMemo(() => {
    return SYSTEM_MENUS.filter((menu) => {
      if (menu.status === 'READY') return true;
      if (isModuleEnabled(menu.requiredModule)) return true;
      if (isDev && showHiddenDev) return true;
      return false;
    });
  }, [isDev, showHiddenDev]);

  const toggleSubMenu = (menuKey: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setOpenSubMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

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
          width: isCollapsed ? '72px' : '260px',
          backgroundColor: 'var(--surface-1)',
          borderInlineEnd: '1px solid var(--border)',
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
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '0 12px' : '0 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#070B14',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <img
              src="/images/gold-erp-emblem.jpg"
              alt="Global ERP Emblem"
              style={{
                width: '38px',
                height: '38px',
                minWidth: '38px',
                borderRadius: '8px',
                objectFit: 'cover',
                boxShadow: '0 2px 10px rgba(201, 162, 75, 0.4)',
              }}
            />
            {!isCollapsed && (
              <div style={{ whiteSpace: 'nowrap' }}>
                <div
                  style={{
                    fontFamily: '"Cinzel", "Playfair Display", Georgia, serif',
                    fontWeight: 700,
                    fontSize: '15px',
                    color: '#F3D086',
                    letterSpacing: '1px',
                    lineHeight: 1.2,
                  }}
                >
                  GLOBAL ERP
                </div>
                <div
                  style={{
                    fontSize: '8px',
                    color: '#C9A24B',
                    letterSpacing: '1.2px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    marginTop: '2px',
                  }}
                >
                  ENTERPRISE RESOURCE PLANNING
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
                color: 'var(--text-secondary)',
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
                color: 'var(--text-secondary)',
                display: 'none',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Data-Only Menu Navigation (docs/MENU_NAMES.md & menu.ts) */}
        <nav
          style={{
            padding: isCollapsed ? '16px 8px' : '16px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {visibleMenus.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isTopLevelActive = currentPath === item.path;
            const isChildActive = hasChildren && item.children!.some((c) => c.path === currentPath);
            const isActive = isTopLevelActive || isChildActive;
            const isOpen = !!openSubMenus[item.key];
            const isLocked = item.status === 'HIDDEN_UNTIL_ENABLED';

            const itemLabel = locale === 'bn' ? item.labelBn : item.labelEn;
            const icon = MENU_ICONS[item.key] || <Layers size={18} />;

            const targetHref = storeSlug
              ? `/${storeSlug}${item.path}`
              : item.path;

            const topLevelStyle: React.CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              width: '100%',
              padding: isCollapsed ? '9px 0' : '9px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#FFFFFF' : '#94A3B8',
              backgroundColor: isActive ? 'rgba(201, 162, 75, 0.18)' : 'transparent',
              border: isActive ? '1px solid rgba(201, 162, 75, 0.5)' : '1px solid transparent',
              textAlign: 'start',
              textDecoration: 'none',
              transition: 'all 120ms ease',
              cursor: 'pointer',
              userSelect: 'none',
              marginBottom: '4px',
            };

            return (
              <div key={item.key} style={{ display: 'flex', flexDirection: 'column' }}>
                {hasChildren ? (
                  <div
                    onClick={(e) => {
                      toggleSubMenu(item.key, e);
                    }}
                    title={isCollapsed ? itemLabel : undefined}
                    style={topLevelStyle}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={{ color: isActive ? '#F3D086' : '#94A3B8', display: 'flex', flexShrink: 0 }}>
                        {icon}
                      </span>
                      {!isCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {itemLabel}
                          </span>
                          {isLocked && (
                            <span
                              title="Locked module — visible in dev mode"
                              style={{
                                fontSize: '10px',
                                color: 'var(--gold)',
                                backgroundColor: 'rgba(201, 162, 75, 0.15)',
                                padding: '1px 4px',
                                borderRadius: '4px',
                                flexShrink: 0,
                              }}
                            >
                              🔒
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {!isCollapsed && (
                      <span style={{ color: '#64748B', display: 'flex', flexShrink: 0, marginLeft: '6px' }}>
                        <ChevronDown size={14} />
                      </span>
                    )}
                  </div>
                ) : (
                  <Link
                    href={targetHref}
                    onClick={() => {
                      onTabChange?.(item.key);
                      onCloseMobile();
                    }}
                    title={isCollapsed ? itemLabel : undefined}
                    style={topLevelStyle}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={{ color: isActive ? 'var(--gold)' : 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>
                        {icon}
                      </span>
                      {!isCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {itemLabel}
                          </span>
                          {isLocked && (
                            <span
                              title="Locked module"
                              style={{
                                fontSize: '10px',
                                color: 'var(--gold)',
                                backgroundColor: 'rgba(201, 162, 75, 0.15)',
                                padding: '1px 4px',
                                borderRadius: '4px',
                                flexShrink: 0,
                              }}
                            >
                              🔒
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                )}

                {/* Submenu Drawer (when expanded and not collapsed sidebar) */}
                {hasChildren && !isCollapsed && isOpen && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      paddingLeft: '28px',
                      marginTop: '2px',
                      marginBottom: '4px',
                      borderLeft: '1px solid var(--border-subtle)',
                      marginLeft: '18px',
                    }}
                  >
                    {item.children!.map((sub) => {
                      const isSubActive = currentPath === sub.path;
                      const subLabel = locale === 'bn' ? sub.labelBn : sub.labelEn;
                      const subHref = storeSlug
                        ? `/${storeSlug}${sub.path}`
                        : sub.path;

                      return (
                        <Link
                          key={sub.key}
                          href={subHref}
                          onClick={() => {
                            onTabChange?.(sub.key);
                            onCloseMobile();
                          }}
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            fontWeight: isSubActive ? 600 : 400,
                            color: isSubActive ? 'var(--gold)' : 'var(--text-secondary)',
                            backgroundColor: isSubActive ? 'rgba(201, 162, 75, 0.08)' : 'transparent',
                            borderRadius: '5px',
                            textDecoration: 'none',
                            transition: 'color 120ms ease, background-color 120ms ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSubActive) e.currentTarget.style.color = 'var(--text-ivory)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSubActive) e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {subLabel}
                          </span>
                          {sub.status === 'HIDDEN_UNTIL_ENABLED' && (
                            <span style={{ fontSize: '9px', opacity: 0.7 }}>🔒</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Development Mode Switch: Show Hidden Modules (Omitted completely in production) */}
          {isDev && !isCollapsed && (
            <div
              style={{
                marginTop: 'auto',
                padding: '8px 10px',
                borderTop: '1px dashed rgba(201, 162, 75, 0.25)',
                borderRadius: '6px',
                backgroundColor: 'rgba(201, 162, 75, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-ivory)' }}>
                  Show hidden (dev)
                </span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  🔒 5 locked modules
                </span>
              </div>
              <label
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '32px',
                  height: '18px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={showHiddenDev}
                  onChange={(e) => setShowHiddenDev(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    inset: 0,
                    backgroundColor: showHiddenDev ? 'var(--gold)' : 'var(--surface-3)',
                    transition: 'all 0.2s ease',
                    borderRadius: '18px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      content: '""',
                      height: '12px',
                      width: '12px',
                      left: showHiddenDev ? '16px' : '3px',
                      bottom: '2px',
                      backgroundColor: showHiddenDev ? '#0B1220' : 'var(--text-muted)',
                      transition: 'all 0.2s ease',
                      borderRadius: '50%',
                    }}
                  />
                </span>
              </label>
            </div>
          )}
        </nav>

        {/* Luxury Dubai Skyline Footer */}
        {!isCollapsed && (
          <div
            style={{
              padding: '16px 20px 24px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: '#070B14',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '110px',
                backgroundImage: "url('/images/sidebar-gold-skyline.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center 20%',
                borderRadius: '8px',
                marginBottom: '14px',
                filter: 'drop-shadow(0 0 10px rgba(243, 208, 134, 0.25))',
                boxShadow: 'inset 0 0 16px rgba(7, 11, 20, 0.8)',
              }}
            />
            <div
              style={{
                fontFamily: '"Cinzel", "Playfair Display", Georgia, serif',
                fontSize: '15px',
                fontWeight: 700,
                color: '#F3D086',
                lineHeight: 1.3,
                letterSpacing: '0.4px',
              }}
            >
              Smarter Business
            </div>
            <div
              style={{
                fontFamily: '"Cinzel", "Playfair Display", Georgia, serif',
                fontSize: '15px',
                fontWeight: 700,
                color: '#F3D086',
                lineHeight: 1.3,
                letterSpacing: '0.4px',
              }}
            >
              Stronger Tomorrow
            </div>
            <div
              style={{
                width: '32px',
                height: '2.5px',
                backgroundColor: '#C9A24B',
                marginTop: '10px',
                borderRadius: '2px',
              }}
            />
          </div>
        )}
      </aside>
    </>
  );
}
