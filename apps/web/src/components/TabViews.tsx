'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers,
  BookOpen,
  Receipt,
  Settings,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Calendar,
  Lock,
  Landmark,
  Plus,
  Search,
  Sparkles,
  Edit3,
  AlertCircle,
  RefreshCw,
  FolderTree,
  Filter,
} from 'lucide-react';
import { accountsApi } from '../lib/api-client';
import { AccountDrawer } from './AccountDrawer';
import { useAuth } from '../contexts/AuthContext';
import type {
  AccountResponseDto,
  AccountType,
  CreateAccountInput,
  UpdateAccountInput,
} from '@accounting/contracts';

export interface ChartOfAccountsViewProps {
  storeSlug?: string;
  companyId?: string;
  userRole?: string;
  currency?: string;
}

const TYPE_BADGE_STYLES: Record<AccountType, { bg: string; text: string; border: string }> = {
  ASSET: { bg: 'rgba(47, 191, 143, 0.12)', text: '#2FBF8F', border: 'rgba(47, 191, 143, 0.3)' },
  LIABILITY: { bg: 'rgba(236, 90, 96, 0.12)', text: '#EC5A60', border: 'rgba(236, 90, 96, 0.3)' },
  EQUITY: { bg: 'rgba(129, 140, 248, 0.12)', text: '#818CF8', border: 'rgba(129, 140, 248, 0.3)' },
  REVENUE: { bg: 'rgba(96, 165, 250, 0.12)', text: '#60A5FA', border: 'rgba(96, 165, 250, 0.3)' },
  EXPENSE: { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
};

export function ChartOfAccountsView({
  storeSlug,
  companyId: propCompanyId,
  userRole: propUserRole,
  currency: propCurrency,
}: ChartOfAccountsViewProps = {}) {
  const { companies: authCompanies } = useAuth();

  // Resolve current active company and role
  const resolvedCompany = useMemo(() => {
    if (propCompanyId) {
      return authCompanies.find((c) => c.companyId === propCompanyId);
    }
    if (storeSlug) {
      return authCompanies.find((c) => c.slug === storeSlug);
    }
    return authCompanies[0];
  }, [propCompanyId, storeSlug, authCompanies]);

  const activeCompanyId = propCompanyId || resolvedCompany?.companyId;
  const role = propUserRole || resolvedCompany?.role || 'viewer';
  const currency = propCurrency || resolvedCompany?.currency || 'AED';

  const canWrite = ['owner', 'admin', 'accountant'].includes(role);
  const canManage = ['owner', 'admin'].includes(role);

  const [accounts, setAccounts] = useState<AccountResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<AccountType | 'ALL'>('ALL');
  const [showInactive, setShowInactive] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountResponseDto | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Auto-dismiss transient notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch accounts from API strictly scoped to current tenant
  const loadAccounts = useCallback(async () => {
    if (!activeCompanyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await accountsApi.list(activeCompanyId, {
        isActive: showInactive ? undefined : true,
      });
      setAccounts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve Chart of Accounts from server.');
    } finally {
      setIsLoading(false);
    }
  }, [activeCompanyId, showInactive]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Handle Save (Create or Update)
  const handleSaveAccount = async (data: CreateAccountInput | UpdateAccountInput, accountId?: string) => {
    if (!activeCompanyId) throw new Error('Company context missing.');

    if (accountId) {
      const updated = await accountsApi.update(activeCompanyId, accountId, data as UpdateAccountInput);
      setNotification({ message: `Account "${updated.code} - ${updated.name}" updated successfully.`, type: 'success' });
    } else {
      const created = await accountsApi.create(activeCompanyId, data as CreateAccountInput);
      setNotification({ message: `Account "${created.code} - ${created.name}" created successfully.`, type: 'success' });
    }
    await loadAccounts();
  };

  // Handle Deactivation
  const handleDeactivateAccount = async (accountId: string) => {
    if (!activeCompanyId) throw new Error('Company context missing.');
    const deactivated = await accountsApi.deactivate(activeCompanyId, accountId);
    setNotification({
      message: `Account "${deactivated.code} - ${deactivated.name}" safely deactivated.`,
      type: 'success',
    });
    await loadAccounts();
  };

  // Handle Template Initialization
  const handleInitializeTemplate = async () => {
    if (!activeCompanyId) return;
    setIsInitializing(true);
    setError(null);
    try {
      const result = await accountsApi.initializeStandard(activeCompanyId);
      setNotification({ message: result.message, type: 'success' });
      setShowTemplateModal(false);
      await loadAccounts();
    } catch (err: any) {
      setNotification({ message: err.message || 'Failed to initialize standard template.', type: 'error' });
      setShowTemplateModal(false);
    } finally {
      setIsInitializing(false);
    }
  };

  // Open Drawer in Create mode
  const openCreateDrawer = () => {
    setEditingAccount(null);
    setDrawerOpen(true);
  };

  // Open Drawer in Edit mode
  const openEditDrawer = (acc: AccountResponseDto) => {
    setEditingAccount(acc);
    setDrawerOpen(true);
  };

  // Filter accounts by search and type
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (selectedType !== 'ALL' && acc.type !== selectedType) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const codeMatch = acc.code.toLowerCase().includes(query);
        const nameMatch = acc.name.toLowerCase().includes(query);
        const descMatch = acc.description?.toLowerCase().includes(query);
        if (!codeMatch && !nameMatch && !descMatch) return false;
      }
      return true;
    });
  }, [accounts, selectedType, searchQuery]);

  // Statistics by account type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: accounts.length,
      ASSET: 0,
      LIABILITY: 0,
      EQUITY: 0,
      REVENUE: 0,
      EXPENSE: 0,
    };
    for (const acc of accounts) {
      if (counts[acc.type] !== undefined) {
        counts[acc.type]++;
      }
    }
    return counts;
  }, [accounts]);

  // Map parent IDs to names
  const accountMap = useMemo(() => {
    const map = new Map<string, AccountResponseDto>();
    for (const acc of accounts) {
      map.set(acc.id, acc);
    }
    return map;
  }, [accounts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* View Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F4FA', letterSpacing: '-0.3px', margin: 0 }}>
              Chart of Accounts
            </h1>
            <span
              style={{
                backgroundColor: 'rgba(201, 162, 75, 0.12)',
                color: '#DFBF6E',
                border: '1px solid rgba(201, 162, 75, 0.3)',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {accounts.length} Accounts
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#8A97B2', marginTop: '2px' }}>
            General Ledger financial account classifications, normal balances, and hierarchy
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(22, 34, 58, 0.8)',
                color: '#DFBF6E',
                border: '1px solid #22304D',
                borderRadius: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Initialize standard accounts template"
            >
              <Sparkles size={13} color="#C9A24B" />
              <span>Standard Template</span>
            </button>
          )}

          <button
            type="button"
            disabled={!canWrite}
            onClick={openCreateDrawer}
            title={canWrite ? 'Create a new ledger account' : 'Auditor/Viewer role has read-only access.'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: canWrite ? '#C9A24B' : '#2A3C60',
              color: canWrite ? '#0B1220' : '#7E8DA6',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: canWrite ? 'pointer' : 'not-allowed',
              boxShadow: canWrite ? '0 2px 6px rgba(201, 162, 75, 0.25)' : 'none',
            }}
          >
            <Plus size={15} />
            <span>New Account</span>
          </button>
        </div>
      </div>

      {/* Notification Toast Banner */}
      {notification && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: notification.type === 'success' ? 'rgba(47, 191, 143, 0.12)' : 'rgba(236, 90, 96, 0.12)',
            border: notification.type === 'success' ? '1px solid rgba(47, 191, 143, 0.35)' : '1px solid rgba(236, 90, 96, 0.35)',
            color: notification.type === 'success' ? '#2FBF8F' : '#FCA5A5',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#111A2E',
          border: '1px solid #1D2A44',
          borderRadius: '10px',
          padding: '12px 16px',
        }}
      >
        {/* Classification Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {(['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const).map((tab) => {
            const isSelected = selectedType === tab;
            const count = typeCounts[tab] || 0;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedType(tab)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#1E2D4A' : 'transparent',
                  color: isSelected ? '#DFBF6E' : '#7E8DA6',
                  border: isSelected ? '1px solid #2B3D63' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{tab === 'ALL' ? 'All Types' : tab}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: isSelected ? 'rgba(201, 162, 75, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#DFBF6E' : '#8A97B2',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Inactive Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search
              size={13}
              color="#7E8DA6"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code or name..."
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                backgroundColor: '#0E1626',
                border: '1px solid #1D2A44',
                borderRadius: '6px',
                color: '#F0F4FA',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#8A97B2',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              style={{ accentColor: '#C9A24B' }}
            />
            <span>Show Inactive</span>
          </label>

          <button
            type="button"
            onClick={loadAccounts}
            title="Refresh accounts"
            style={{
              background: 'none',
              border: '1px solid #1D2A44',
              borderRadius: '6px',
              color: '#7E8DA6',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Main Accounts Table */}
      <div
        style={{
          backgroundColor: '#111A2E',
          border: '1px solid #1D2A44',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0E1626', borderBottom: '1px solid #1D2A44', color: '#7E8DA6' }}>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>CODE</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>ACCOUNT NAME</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>TYPE</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>NORMAL BALANCE</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>PARENT ACCOUNT</th>
              <th style={{ padding: '10px 16px', textAlign: 'center' }}>SYSTEM</th>
              <th style={{ padding: '10px 16px', textAlign: 'center' }}>STATUS</th>
              <th style={{ padding: '10px 16px', textAlign: 'end' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading Skeleton State
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1D2A44' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ height: '18px', width: '60px', backgroundColor: '#1E2D4A', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ height: '18px', width: '180px', backgroundColor: '#1E2D4A', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ height: '18px', width: '70px', backgroundColor: '#1E2D4A', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ height: '18px', width: '60px', backgroundColor: '#1E2D4A', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ height: '18px', width: '100px', backgroundColor: '#1E2D4A', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ height: '18px', width: '40px', backgroundColor: '#1E2D4A', borderRadius: '4px', margin: '0 auto' }} />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ height: '18px', width: '50px', backgroundColor: '#1E2D4A', borderRadius: '4px', margin: '0 auto' }} />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'end' }}>
                    <div style={{ height: '18px', width: '30px', backgroundColor: '#1E2D4A', borderRadius: '4px', marginLeft: 'auto' }} />
                  </td>
                </tr>
              ))
            ) : error ? (
              // Error State
              <tr>
                <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: '#EC5A60' }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 10px', display: 'block' }} />
                  <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>Unable to load Chart of Accounts</div>
                  <div style={{ fontSize: '12px', color: '#8A97B2', marginBottom: '14px' }}>{error}</div>
                  <button
                    type="button"
                    onClick={loadAccounts}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      backgroundColor: '#1E2D4A',
                      border: '1px solid #2B3D63',
                      color: '#F0F4FA',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Retry Loading
                  </button>
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              // Honest Empty State: 0 accounts exist in company
              <tr>
                <td colSpan={8} style={{ padding: '56px 20px', textAlign: 'center' }}>
                  <Layers size={40} color="#C9A24B" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.8 }} />
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#F0F4FA', marginBottom: '6px' }}>
                    No Accounts Configured Yet
                  </div>
                  <p style={{ fontSize: '13px', color: '#8A97B2', maxWidth: '480px', margin: '0 auto 20px', lineHeight: '1.5' }}>
                    This company does not have any Chart of Accounts records yet. You can create custom accounts manually or initialize the standard commercial template.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => setShowTemplateModal(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(201, 162, 75, 0.15)',
                          color: '#DFBF6E',
                          border: '1px solid rgba(201, 162, 75, 0.35)',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Sparkles size={14} color="#C9A24B" />
                        <span>Initialize Standard Template</span>
                      </button>
                    )}
                    {canWrite && (
                      <button
                        type="button"
                        onClick={openCreateDrawer}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          backgroundColor: '#C9A24B',
                          color: '#0B1220',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={14} />
                        <span>Create Custom Account</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : filteredAccounts.length === 0 ? (
              // Filter/Search Empty State
              <tr>
                <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', color: '#7E8DA6' }}>
                  <Filter size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.6 }} />
                  <div style={{ fontWeight: 600, color: '#F0F4FA', marginBottom: '4px' }}>No matching accounts found</div>
                  <div style={{ fontSize: '12px' }}>Try adjusting your search terms or classification filters.</div>
                </td>
              </tr>
            ) : (
              // Rendered Account Rows
              filteredAccounts.map((acc) => {
                const badgeStyle = TYPE_BADGE_STYLES[acc.type] || {
                  bg: '#1E2D4A',
                  text: '#F0F4FA',
                  border: '#2B3D63',
                };
                const parent = acc.parentId ? accountMap.get(acc.parentId) : null;

                return (
                  <tr
                    key={acc.id}
                    style={{
                      borderBottom: '1px solid #1D2A44',
                      transition: 'background-color 0.1s ease',
                      opacity: acc.isActive ? 1 : 0.6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#16223A')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Code */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        onClick={() => openEditDrawer(acc)}
                        title="Click to view/edit account"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#DFBF6E',
                          backgroundColor: 'rgba(201, 162, 75, 0.08)',
                          border: '1px solid rgba(201, 162, 75, 0.25)',
                          cursor: 'pointer',
                        }}
                      >
                        {acc.code}
                      </span>
                    </td>

                    {/* Name & Description */}
                    <td style={{ padding: '12px 16px' }}>
                      <div
                        onClick={() => openEditDrawer(acc)}
                        style={{ fontWeight: 600, color: '#F0F4FA', cursor: 'pointer' }}
                      >
                        {acc.name}
                      </div>
                      {acc.description && (
                        <div style={{ fontSize: '11px', color: '#8A97B2', marginTop: '2px' }}>
                          {acc.description}
                        </div>
                      )}
                    </td>

                    {/* Type */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: badgeStyle.bg,
                          color: badgeStyle.text,
                          border: `1px solid ${badgeStyle.border}`,
                        }}
                      >
                        {acc.type}
                      </span>
                    </td>

                    {/* Normal Balance */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: acc.normalBalance === 'DEBIT' ? '#2FBF8F' : '#60A5FA',
                        }}
                      >
                        {acc.normalBalance}
                      </span>
                    </td>

                    {/* Parent */}
                    <td style={{ padding: '12px 16px', color: '#8A97B2', fontSize: '12px' }}>
                      {parent ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FolderTree size={12} color="#C9A24B" />
                          <span>{parent.code} — {parent.name}</span>
                        </span>
                      ) : (
                        <span style={{ color: '#4B5563' }}>— Top-Level</span>
                      )}
                    </td>

                    {/* System */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {acc.isSystem ? (
                        <span
                          title="Core system account protected from deactivation"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            color: '#DFBF6E',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          <Lock size={11} /> System
                        </span>
                      ) : (
                        <span style={{ color: '#4B5563', fontSize: '12px' }}>—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: acc.isActive ? 'rgba(47, 191, 143, 0.1)' : 'rgba(126, 141, 166, 0.1)',
                          color: acc.isActive ? '#2FBF8F' : '#7E8DA6',
                          border: acc.isActive ? '1px solid rgba(47, 191, 143, 0.25)' : '1px solid rgba(126, 141, 166, 0.25)',
                        }}
                      >
                        {acc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'end' }}>
                      <button
                        type="button"
                        onClick={() => openEditDrawer(acc)}
                        title="Edit account details"
                        style={{
                          background: 'none',
                          border: '1px solid #1D2A44',
                          borderRadius: '5px',
                          color: '#DFBF6E',
                          padding: '5px 8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        <Edit3 size={11} />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Account Create/Edit Drawer */}
      <AccountDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSaveAccount}
        onDeactivate={handleDeactivateAccount}
        accountToEdit={editingAccount}
        existingAccounts={accounts}
        userRole={role}
        currency={currency}
      />

      {/* Template Initialization Confirmation Modal */}
      {showTemplateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 20, 0.75)',
            backdropFilter: 'blur(3px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#0E1626',
              border: '1px solid #1D2A44',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Sparkles size={20} color="#C9A24B" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F0F4FA', margin: 0 }}>
                Initialize Standard Chart of Accounts
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#8A97B2', lineHeight: '1.6', margin: '0 0 16px' }}>
              This will safely seed 19 standard commercial accounts into this company (Cash, Bank Operating, AR, Inventory, AP, VAT Output/Input, Equity, Revenue, and Expense accounts).
            </p>

            <div
              style={{
                backgroundColor: 'rgba(201, 162, 75, 0.08)',
                border: '1px solid rgba(201, 162, 75, 0.25)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '20px',
                fontSize: '12px',
                color: '#DFBF6E',
                lineHeight: '1.4',
              }}
            >
              ✓ Safe and idempotent: existing accounts will not be overwritten or duplicated.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                disabled={isInitializing}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: '1px solid #1D2A44',
                  color: '#8A97B2',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInitializeTemplate}
                disabled={isInitializing}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  backgroundColor: '#C9A24B',
                  border: 'none',
                  color: '#0B1220',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isInitializing ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isInitializing ? (
                  <>
                    <RefreshCw size={13} className="spin" />
                    <span>Initializing...</span>
                  </>
                ) : (
                  <span>Confirm & Initialize</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function GeneralLedgerView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F4FA', letterSpacing: '-0.3px' }}>
          General Ledger
        </h1>
        <p style={{ fontSize: '13px', color: '#8A97B2', marginTop: '2px' }}>
          Posted Double-Entry Transactions & Audit Trail
        </p>
      </div>

      <div
        style={{
          padding: '40px 30px',
          backgroundColor: '#111A2E',
          border: '1px solid #1D2A44',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        <BookOpen size={40} color="#C9A24B" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F0F4FA', marginBottom: '6px' }}>
          No General Ledger Postings Recorded
        </h3>
        <p style={{ fontSize: '13px', color: '#8A97B2', maxWidth: '480px', margin: '0 auto 16px' }}>
          Immutable journal batches and multi-currency general ledger transactions will appear here once vouchers are posted in Phase 2.
        </p>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(201, 162, 75, 0.12)',
            color: '#DFBF6E',
            border: '1px solid rgba(201, 162, 75, 0.3)',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <Lock size={13} /> Double-Entry Engine Ready (0 Transactions)
        </span>
      </div>
    </div>
  );
}

export function SalesInvoicesView() {
  const invoices: Array<{ no: string; customer: string; date: string; due: string; total: string; status: string }> = [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F4FA', letterSpacing: '-0.3px' }}>
            Sales & Client Invoices
          </h1>
          <p style={{ fontSize: '13px', color: '#8A97B2', marginTop: '2px' }}>
            Accounts Receivable (AR) Invoices Awaiting Settlement
          </p>
        </div>
        <span
          style={{
            backgroundColor: 'rgba(201, 162, 75, 0.12)',
            color: '#DFBF6E',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          Total AR: AED 0.00
        </span>
      </div>

      <div
        style={{
          backgroundColor: '#111A2E',
          border: '1px solid #1D2A44',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0E1626', borderBottom: '1px solid #1D2A44', color: '#7E8DA6' }}>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>INVOICE NO.</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>CUSTOMER</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>ISSUE DATE</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>DUE DATE</th>
              <th style={{ padding: '10px 16px', textAlign: 'end' }}>TOTAL (AED)</th>
              <th style={{ padding: '10px 16px', textAlign: 'center' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#7E8DA6' }}>
                <Receipt size={32} color="#C9A24B" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.7 }} />
                <div style={{ fontWeight: 600, color: '#F0F4FA', marginBottom: '4px' }}>No Sales Invoices Recorded</div>
                <div style={{ fontSize: '12px' }}>
                  Accounts Receivable client invoicing and statutory VAT calculations will connect in Phase 2.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SettingsView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F4FA', letterSpacing: '-0.3px' }}>
          System & Enterprise Settings
        </h1>
        <p style={{ fontSize: '13px', color: '#8A97B2', marginTop: '2px' }}>
          Tenant Boundaries, Base Currency & Fiscal Configuration
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            backgroundColor: '#111A2E',
            border: '1px solid #1D2A44',
            borderRadius: '10px',
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Building2 size={16} color="#C9A24B" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F0F4FA' }}>Company & Tenant Isolation</h3>
          </div>
          <div style={{ fontSize: '12px', color: '#8A97B2', lineHeight: '1.6' }}>
            <div>Active Entity: <strong style={{ color: '#F0F4FA' }}>Authorized Store Tenant</strong></div>
            <div>Tenant Boundary: <strong style={{ color: '#F0F4FA' }}>Strict Isolation Enforced</strong></div>
            <div>Statutory Tax Regime: <strong style={{ color: '#F0F4FA' }}>Configured per Country Pack</strong></div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#111A2E',
            border: '1px solid #1D2A44',
            borderRadius: '10px',
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ShieldCheck size={16} color="#2FBF8F" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F0F4FA' }}>Ledger & Currency Security</h3>
          </div>
          <div style={{ fontSize: '12px', color: '#8A97B2', lineHeight: '1.6' }}>
            <div>Base Functional Currency: <strong style={{ color: '#F0F4FA' }}>AED (UAE Dirham)</strong></div>
            <div>Rounding Invariant: <strong style={{ color: '#F0F4FA' }}>Decimal.js Banker's Rounding</strong></div>
            <div>Double-Entry Enforcement: <strong style={{ color: '#2FBF8F' }}>Active & Verified</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PurchasesView() {
  const bills: Array<{ no: string; vendor: string; date: string; due: string; total: string; status: string }> = [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F4FA', letterSpacing: '-0.3px' }}>
            Purchases & Expenses
          </h1>
          <p style={{ fontSize: '13px', color: '#8A97B2', marginTop: '2px' }}>
            Vendor Bills, Accounts Payable & Statutory Expense Verification
          </p>
        </div>
        <span
          style={{
            backgroundColor: 'rgba(201, 162, 75, 0.12)',
            color: '#DFBF6E',
            border: '1px solid rgba(201, 162, 75, 0.3)',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          Total AP: AED 0.00
        </span>
      </div>

      <div
        style={{
          backgroundColor: '#111A2E',
          border: '1px solid #1D2A44',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0E1626', borderBottom: '1px solid #1D2A44', color: '#7E8DA6' }}>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>BILL #</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>VENDOR</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>BILL DATE</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>DUE DATE</th>
              <th style={{ padding: '10px 16px', textAlign: 'end' }}>TOTAL AMOUNT</th>
              <th style={{ padding: '10px 16px', textAlign: 'center' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#7E8DA6' }}>
                <Receipt size={32} color="#C9A24B" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.7 }} />
                <div style={{ fontWeight: 600, color: '#F0F4FA', marginBottom: '4px' }}>No Purchase Bills Recorded</div>
                <div style={{ fontSize: '12px' }}>
                  Vendor bills, statutory expense tracking, and Accounts Payable will connect in Phase 2.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ReportsView() {
  const reports = [
    { title: 'Trial Balance', desc: 'Summary of all debit and credit account balances to ensure fundamental double-entry equation balance.', freq: 'Real-time' },
    { title: 'Statement of Profit or Loss (P&L)', desc: 'Operating revenue, Cost of Goods Sold (COGS), statutory depreciation, and net earnings.', freq: 'Monthly / Quarterly' },
    { title: 'Balance Sheet (Statement of Financial Position)', desc: 'Total enterprise assets, current and non-current liabilities, and owner equity accounts.', freq: 'Quarterly / Annual' },
    { title: 'Statement of Cash Flows', desc: 'Cash generated and utilized across operating, investing, and financing business operations.', freq: 'Quarterly' },
    { title: 'UAE VAT 201 Return Summary', desc: 'Standard rated supplies (5%), reverse charge provisions, and recoverable input tax reconciliation.', freq: 'Tax Period' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F4FA', letterSpacing: '-0.3px' }}>
            Financial Reports & Compliance
          </h1>
          <p style={{ fontSize: '13px', color: '#8A97B2', marginTop: '2px' }}>
            Standard GAAP / IFRS Financial Statements & Statutory Tax Disclosures
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {reports.map((r) => (
          <div
            key={r.title}
            style={{
              backgroundColor: '#111A2E',
              border: '1px solid #1D2A44',
              borderRadius: '10px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F0F4FA' }}>{r.title}</h3>
                <span style={{ fontSize: '11px', color: '#DFBF6E', backgroundColor: 'rgba(201, 162, 75, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  {r.freq}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#8A97B2', lineHeight: '1.5' }}>{r.desc}</p>
            </div>
            <button
              disabled
              title="Reporting engine will activate in Phase 2"
              style={{
                alignSelf: 'flex-start',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: '#16223A',
                color: '#7E8DA6',
                border: '1px solid #22304D',
                cursor: 'not-allowed',
                opacity: 0.7,
              }}
            >
              Coming Soon (Phase 2)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamView() {
  const members: Array<{ name: string; email: string; role: string; access: string; seat: string; status: string }> = [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F4FA', letterSpacing: '-0.3px' }}>
            Team & Access Management
          </h1>
          <p style={{ fontSize: '13px', color: '#8A97B2', marginTop: '2px' }}>
            Tenant Role-Based Access Control (RBAC), Seat Allocation & Branch Entitlements
          </p>
        </div>
        <button
          disabled
          title="Team invitation UI will be connected in Phase A Group 2"
          style={{
            backgroundColor: 'rgba(201, 162, 75, 0.2)',
            color: '#DFBF6E',
            border: '1px solid rgba(201, 162, 75, 0.3)',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'not-allowed',
          }}
        >
          Invite Team Member
        </button>
      </div>

      <div
        style={{
          backgroundColor: '#111A2E',
          border: '1px solid #1D2A44',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0E1626', borderBottom: '1px solid #1D2A44', color: '#7E8DA6' }}>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>MEMBER</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>EMAIL</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>TENANT ROLE</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>BRANCH PERMISSIONS</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>SEAT TYPE</th>
              <th style={{ padding: '10px 16px', textAlign: 'center' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#7E8DA6' }}>
                <Building2 size={32} color="#C9A24B" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.7 }} />
                <div style={{ fontWeight: 600, color: '#F0F4FA', marginBottom: '4px' }}>No External Team Members</div>
                <div style={{ fontSize: '12px' }}>
                  Use the invitation service to invite accountants, auditors, and administrators to this tenant.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BankingView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F4FA', letterSpacing: '-0.3px', margin: 0 }}>
            Cash & Banking Management
          </h1>
          <p style={{ fontSize: '13px', color: '#8A97B2', marginTop: '2px' }}>
            Bank Accounts, Cash Ledgers & Statement Reconciliation
          </p>
        </div>
        <button
          disabled
          title="Bank account connection will activate in Phase 3"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(201, 162, 75, 0.15)',
            color: '#DFBF6E',
            border: '1px solid rgba(201, 162, 75, 0.3)',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'not-allowed',
            opacity: 0.8,
          }}
        >
          <Landmark size={15} />
          <span>Connect Bank Account (Coming soon)</span>
        </button>
      </div>

      <div
        style={{
          padding: '48px 24px',
          backgroundColor: '#111A2E',
          border: '1px solid #1D2A44',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        <Landmark size={40} color="#C9A24B" style={{ margin: '0 auto 12px', opacity: 0.85 }} />
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F0F4FA', marginBottom: '6px' }}>
          No bank accounts connected.
        </h3>
        <p style={{ fontSize: '13px', color: '#8A97B2', maxWidth: '520px', margin: '0 auto 16px', lineHeight: '1.5' }}>
          Cash and bank account management, bank feed synchronization, and statement reconciliation are currently under development and scheduled for activation in Phase 3.
        </p>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(201, 162, 75, 0.12)',
            color: '#DFBF6E',
            border: '1px solid rgba(201, 162, 75, 0.3)',
            padding: '5px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <Lock size={13} /> Banking Engine Pending (Phase 3 Roadmap)
        </span>
      </div>
    </div>
  );
}
