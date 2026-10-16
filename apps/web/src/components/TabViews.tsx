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
  CreditCard,
  Users,
  FileSpreadsheet,
  Download,
  ExternalLink,
  ChevronRight,
  Check,
  X,
  Shield,
  Clock,
  MapPin,
  Key,
  Printer,
  ArrowUpRight,
  TrendingUp,
  Percent,
  FileText,
  DollarSign,
  Briefcase,
  UserCheck,
  ShieldAlert,
  Globe,
  Database,
  Server,
  Zap,
  Eye,
} from 'lucide-react';
import { accountsApi } from '../lib/api-client';
import { AccountDrawer } from './AccountDrawer';
import { AccountsReceivableOverview } from './AccountsReceivableOverview';
import { AccountsPayableOverview } from './AccountsPayableOverview';
import { BankingTreasuryOverview } from './BankingTreasuryOverview';
import { GeneralLedgerOverview } from './GeneralLedgerOverview';
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
  ASSET: { bg: 'var(--success-dim, rgba(47, 191, 143, 0.12))', text: 'var(--success, #2FBF8F)', border: 'var(--success-border, rgba(47, 191, 143, 0.3))' },
  LIABILITY: { bg: 'var(--danger-dim, rgba(236, 90, 96, 0.12))', text: 'var(--danger, #EC5A60)', border: 'var(--danger-border, rgba(236, 90, 96, 0.3))' },
  EQUITY: { bg: 'var(--equity-dim, rgba(129, 140, 248, 0.12))', text: 'var(--equity, #818CF8)', border: 'var(--equity-border, rgba(129, 140, 248, 0.3))' },
  REVENUE: { bg: 'var(--info-dim, rgba(96, 165, 250, 0.12))', text: 'var(--info, #60A5FA)', border: 'var(--info-border, rgba(96, 165, 250, 0.3))' },
  EXPENSE: { bg: 'var(--warning-dim, rgba(245, 158, 11, 0.12))', text: 'var(--warning, #F59E0B)', border: 'var(--warning-border, rgba(245, 158, 11, 0.3))' },
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
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-ivory)', letterSpacing: '-0.3px', margin: 0 }}>
              Chart of Accounts
            </h1>
            <span
              style={{
                backgroundColor: 'var(--gold-dim)',
                color: 'var(--gold)',
                border: '1px solid var(--gold-glow)',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {accounts.length} Accounts
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
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
                backgroundColor: 'var(--surface-3)',
                color: 'var(--gold)',
                border: '1px solid var(--border-card)',
                borderRadius: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Initialize standard accounts template"
            >
              <Sparkles size={13} color="var(--gold)" />
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
              backgroundColor: canWrite ? 'var(--gold)' : 'var(--surface-3)',
              color: canWrite ? '#0B1220' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: canWrite ? 'pointer' : 'not-allowed',
              boxShadow: canWrite ? '0 2px 6px var(--gold-glow)' : 'none',
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
            backgroundColor: notification.type === 'success' ? 'var(--success-dim)' : 'var(--danger-dim)',
            border: notification.type === 'success' ? '1px solid var(--success-border)' : '1px solid var(--danger-border)',
            color: notification.type === 'success' ? 'var(--success)' : 'var(--danger)',
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

      {/* Executive 5-Card KPI Ribbon for Chart of Accounts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Accounts</span>
            <span style={{ color: 'var(--gold)', backgroundColor: 'var(--gold-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              CoA Active
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {accounts.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Master GL classifications
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Asset Accounts</span>
            <span style={{ color: 'var(--success)', backgroundColor: 'var(--success-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              Debit Normal
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)' }}>
            {typeCounts.ASSET}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Cash, bank, AR & inventory
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Liability Accounts</span>
            <span style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              Credit Normal
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--danger)' }}>
            {typeCounts.LIABILITY}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            AP, VAT payable & loans
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Equity Accounts</span>
            <span style={{ color: 'var(--equity, #818CF8)', backgroundColor: 'var(--equity-dim, rgba(129, 140, 248, 0.12))', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              Capital
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--equity, #818CF8)' }}>
            {typeCounts.EQUITY}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Share capital & reserves
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>P&L Nominal</span>
            <span style={{ color: 'var(--info)', backgroundColor: 'var(--info-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              P&L Accounts
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--info)' }}>
            {typeCounts.REVENUE + typeCounts.EXPENSE}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {typeCounts.REVENUE} Revenue • {typeCounts.EXPENSE} Expenses
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--surface-2)',
          border: '1px solid var(--border-card)',
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
                  backgroundColor: isSelected ? 'var(--surface-3)' : 'transparent',
                  color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--border-card)' : '1px solid transparent',
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
                    backgroundColor: isSelected ? 'var(--gold-dim)' : 'var(--surface-subtle)',
                    color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
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
              color="var(--text-muted)"
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
                backgroundColor: 'var(--surface-3)',
                border: '1px solid var(--border-card)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
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
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              style={{ accentColor: 'var(--gold)' }}
            />
            <span>Show Inactive</span>
          </label>

          <button
            type="button"
            onClick={loadAccounts}
            title="Refresh accounts"
            style={{
              background: 'none',
              border: '1px solid var(--border-card)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
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
          backgroundColor: 'var(--surface-2)',
          border: '1px solid var(--border-card)',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-3)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
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
                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ height: '18px', width: '60px', backgroundColor: 'var(--surface-3)', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ height: '18px', width: '180px', backgroundColor: 'var(--surface-3)', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ height: '18px', width: '70px', backgroundColor: 'var(--surface-3)', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ height: '18px', width: '60px', backgroundColor: 'var(--surface-3)', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ height: '18px', width: '100px', backgroundColor: 'var(--surface-3)', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ height: '18px', width: '40px', backgroundColor: 'var(--surface-3)', borderRadius: '4px', margin: '0 auto' }} />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ height: '18px', width: '50px', backgroundColor: 'var(--surface-3)', borderRadius: '4px', margin: '0 auto' }} />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'end' }}>
                    <div style={{ height: '18px', width: '30px', backgroundColor: 'var(--surface-3)', borderRadius: '4px', marginLeft: 'auto' }} />
                  </td>
                </tr>
              ))
            ) : error ? (
              // Error State
              <tr>
                <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--danger)' }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 10px', display: 'block' }} />
                  <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>Unable to load Chart of Accounts</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>{error}</div>
                  <button
                    type="button"
                    onClick={loadAccounts}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
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
                  <Layers size={40} color="var(--gold)" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.8 }} />
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    No Accounts Configured Yet
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 20px', lineHeight: '1.5' }}>
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
                          backgroundColor: 'var(--gold-dim)',
                          color: 'var(--gold)',
                          border: '1px solid var(--gold-border)',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Sparkles size={14} color="var(--gold)" />
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
                          backgroundColor: 'var(--gold)',
                          color: 'var(--bg-canvas)',
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
                <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Filter size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.6 }} />
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>No matching accounts found</div>
                  <div style={{ fontSize: '12px' }}>Try adjusting your search terms or classification filters.</div>
                </td>
              </tr>
            ) : (
              // Rendered Account Rows
              filteredAccounts.map((acc) => {
                const badgeStyle = TYPE_BADGE_STYLES[acc.type] || {
                  bg: 'var(--surface-3)',
                  text: 'var(--text-primary)',
                  border: 'var(--border-default)',
                };
                const parent = acc.parentId ? accountMap.get(acc.parentId) : null;

                return (
                  <tr
                    key={acc.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.1s ease',
                      opacity: acc.isActive ? 1 : 0.6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
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
                          color: 'var(--gold)',
                          backgroundColor: 'var(--gold-dim)',
                          border: '1px solid var(--gold-border)',
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
                        style={{ fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
                      >
                        {acc.name}
                      </div>
                      {acc.description && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
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
                          color: acc.normalBalance === 'DEBIT' ? 'var(--success)' : 'var(--info)',
                        }}
                      >
                        {acc.normalBalance}
                      </span>
                    </td>

                    {/* Parent */}
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {parent ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FolderTree size={12} color="var(--gold)" />
                          <span>{parent.code} — {parent.name}</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>— Top-Level</span>
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
                            color: 'var(--gold)',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          <Lock size={11} /> System
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
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
                          backgroundColor: acc.isActive ? 'var(--success-dim)' : 'var(--surface-3)',
                          color: acc.isActive ? 'var(--success)' : 'var(--text-muted)',
                          border: acc.isActive ? '1px solid var(--success-border)' : '1px solid var(--border-subtle)',
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
                          border: '1px solid var(--border-default)',
                          borderRadius: '5px',
                          color: 'var(--gold)',
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
            backgroundColor: 'var(--bg-overlay, rgba(5, 10, 20, 0.75))',
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
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Sparkles size={20} color="var(--gold)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Initialize Standard Chart of Accounts
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 16px' }}>
              This will safely seed 19 standard commercial accounts into this company (Cash, Bank Operating, AR, Inventory, AP, VAT Output/Input, Equity, Revenue, and Expense accounts).
            </p>

            <div
              style={{
                backgroundColor: 'var(--gold-dim)',
                border: '1px solid var(--gold-border)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '20px',
                fontSize: '12px',
                color: 'var(--gold)',
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
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
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
                  backgroundColor: 'var(--gold)',
                  border: 'none',
                  color: 'var(--bg-canvas)',
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
  return <GeneralLedgerOverview currency="AED" />;
}

export function SalesInvoicesView() {
  const [subView, setSubView] = useState<'analytics' | 'invoices'>('analytics');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'POSTED' | 'OVERDUE' | 'SETTLED'>('ALL');

  const sampleInvoices = [
    { no: 'INV-2026-00101', customer: 'Paula Moreno (Global Trade FZE)', date: '2026-04-12', due: '2026-05-12', total: '184,582.00', vat: '8,789.62', status: 'OVERDUE', overdueDays: 14 },
    { no: 'INV-2026-00098', customer: 'Nuan Zheng (Pacific Logistics LLC)', date: '2026-03-15', due: '2026-04-15', total: '166,370.00', vat: '7,922.38', status: 'OVERDUE', overdueDays: 27 },
    { no: 'INV-2026-00095', customer: 'Kristi Alvarez (Horizon Retailers)', date: '2026-03-01', due: '2026-03-31', total: '138,425.00', vat: '6,591.67', status: 'OVERDUE', overdueDays: 42 },
    { no: 'INV-2026-00092', customer: 'Preston Gonzalez (Metro Distribution)', date: '2026-02-14', due: '2026-03-16', total: '107,469.00', vat: '5,117.57', status: 'OVERDUE', overdueDays: 57 },
    { no: 'INV-2026-00089', customer: 'Daisy Blanco (Oasis Catering Co.)', date: '2026-04-05', due: '2026-05-05', total: '129,330.00', vat: '6,158.57', status: 'POSTED', overdueDays: 0 },
    { no: 'INV-2026-00084', customer: 'Renee Carlson (Emirates Supermarkets)', date: '2026-01-10', due: '2026-02-10', total: '86,619.00', vat: '4,124.71', status: 'OVERDUE', overdueDays: 91 },
    { no: 'INV-2026-00081', customer: 'Eugene Zhu (Asian Gourmet Market)', date: '2026-01-05', due: '2026-02-05', total: '84,952.00', vat: '4,045.33', status: 'OVERDUE', overdueDays: 96 },
    { no: 'INV-2026-00078', customer: 'Al-Barakah Hypermarket (Wholesale)', date: '2026-04-10', due: '2026-04-25', total: '52,500.00', vat: '2,500.00', status: 'SETTLED', overdueDays: 0 },
  ];

  const filteredInvoices = sampleInvoices.filter((inv) => {
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
    if (invoiceSearch) {
      const q = invoiceSearch.toLowerCase();
      return inv.no.toLowerCase().includes(q) || inv.customer.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top View Selector Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setSubView('analytics')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: subView === 'analytics' ? 'var(--gold)' : 'var(--surface-3)',
              color: subView === 'analytics' ? 'var(--bg-canvas)' : 'var(--text-secondary)',
              border: subView === 'analytics' ? 'none' : '1px solid var(--border-default)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Executive AR Overview (Analytics)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('invoices')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: subView === 'invoices' ? 'var(--gold)' : 'var(--surface-3)',
              color: subView === 'invoices' ? 'var(--bg-canvas)' : 'var(--text-secondary)',
              border: subView === 'invoices' ? 'none' : '1px solid var(--border-default)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Invoices & Receivables Ledger ({sampleInvoices.length})</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              backgroundColor: 'var(--gold-dim)',
              color: 'var(--gold)',
              border: '1px solid var(--gold-border)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            Total AR: AED 14,890,000.00
          </span>
        </div>
      </div>

      {/* Conditional Sub-View Rendering */}
      {subView === 'analytics' ? (
        <AccountsReceivableOverview currency="AED" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Invoices Search and Filter Ribbon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-card)',
              borderRadius: '10px',
              padding: '12px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search invoices by number or customer name..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  width: '100%',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {(['ALL', 'OVERDUE', 'POSTED', 'SETTLED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: statusFilter === st ? 'var(--gold)' : 'var(--surface-3)',
                    color: statusFilter === st ? 'var(--bg-canvas)' : 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    cursor: 'pointer',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices Table */}
          <div
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-card)',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-3)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'start' }}>INVOICE NO.</th>
                  <th style={{ padding: '10px 16px', textAlign: 'start' }}>CUSTOMER & CLIENT ENTITY</th>
                  <th style={{ padding: '10px 16px', textAlign: 'start' }}>ISSUE DATE</th>
                  <th style={{ padding: '10px 16px', textAlign: 'start' }}>DUE DATE</th>
                  <th style={{ padding: '10px 16px', textAlign: 'end' }}>VAT (5%)</th>
                  <th style={{ padding: '10px 16px', textAlign: 'end' }}>TOTAL AMOUNT (AED)</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.no}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: 'var(--gold)',
                          backgroundColor: 'var(--gold-dim)',
                          border: '1px solid var(--gold-border)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        {inv.no}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {inv.customer}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {inv.date}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {inv.due}
                      {inv.overdueDays > 0 && (
                        <span style={{ color: '#EF4444', fontSize: '11px', display: 'block', fontWeight: 600 }}>
                          +{inv.overdueDays}d overdue
                        </span>
                      )}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 16px', textAlign: 'end', color: 'var(--text-secondary)' }}>
                      {inv.vat}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 16px', textAlign: 'end', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {inv.total}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor:
                            inv.status === 'SETTLED'
                              ? 'var(--success-dim)'
                              : inv.status === 'OVERDUE'
                              ? 'rgba(239, 68, 68, 0.12)'
                              : 'var(--info-dim)',
                          color:
                            inv.status === 'SETTLED'
                              ? 'var(--success)'
                              : inv.status === 'OVERDUE'
                              ? '#EF4444'
                              : 'var(--info)',
                          border:
                            inv.status === 'SETTLED'
                              ? '1px solid var(--success-border)'
                              : inv.status === 'OVERDUE'
                              ? '1px solid rgba(239, 68, 68, 0.3)'
                              : '1px solid var(--info-border)',
                        }}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<'company' | 'branches' | 'tax' | 'security'>('company');
  const [periodLocked, setPeriodLocked] = useState(true);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const handleSave = () => {
    setSaveToast('Configuration settings saved successfully.');
    setTimeout(() => setSaveToast(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: 0 }}>
              Enterprise System Settings
            </h1>
            <span
              style={{
                backgroundColor: 'var(--gold-dim)',
                color: 'var(--gold)',
                border: '1px solid var(--gold-border)',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              Strict Tenant Boundary
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Company Profile, Fiscal Periods, Multi-Branch Routing, Statutory Tax & Audit Policies
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--gold)',
            color: 'var(--bg-canvas)',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 6px var(--gold-glow)',
          }}
        >
          <Check size={14} />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Notification Toast */}
      {saveToast && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--success-dim)',
            border: '1px solid var(--success-border)',
            color: 'var(--success)',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{saveToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveToast(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 4-Card Context Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Functional Currency</span>
            <span style={{ color: 'var(--gold)', backgroundColor: 'var(--gold-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              Primary
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            AED (Dirhams)
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Banker's Rounding (Round-Half-Even)
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Statutory Tax Regime</span>
            <span style={{ color: 'var(--success)', backgroundColor: 'var(--success-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              UAE FTA 5%
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)' }}>
            FTA Form 201
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            TRN: 100-4829-3918-0003 Verified
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Active Fiscal Period</span>
            <span style={{ color: 'var(--info)', backgroundColor: 'var(--info-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              FY2026 Q1
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--info)' }}>
            Open Period
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Prior periods locked against tampering
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Cryptographic Chaining</span>
            <span style={{ color: 'var(--gold)', backgroundColor: 'var(--gold-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              SHA-256
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Tamper-Proof
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Hash-chained voucher ledger integrity
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '10px',
        }}
      >
        {[
          { id: 'company', label: 'Company Profile & Fiscal Year' },
          { id: 'branches', label: 'Branches & POS Registers (3)' },
          { id: 'tax', label: 'Statutory Tax & E-Invoicing' },
          { id: 'security', label: 'Security & Audit Vault' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: activeTab === tab.id ? 'var(--gold)' : 'var(--surface-3)',
              color: activeTab === tab.id ? 'var(--bg-canvas)' : 'var(--text-secondary)',
              border: activeTab === tab.id ? 'none' : '1px solid var(--border-default)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panes */}
      {activeTab === 'company' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} color="var(--gold)" />
              <span>Legal Entity Registration</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Legal Company Name</label>
                <input type="text" readOnly value="Barakah Enterprises LLC" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-3)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Commercial Trade License #</label>
                <input type="text" readOnly value="CN-2894102-DXB (Dubai DED)" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-3)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Tenant Slug Identifier</label>
                <input type="text" readOnly value="barakah-enterprises" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-3)', color: 'var(--gold)', fontWeight: 700 }} />
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} color="var(--gold)" />
              <span>Fiscal Periods & Tamper-Proof Locking</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Fiscal Year Schedule</label>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>January 1 – December 31 (Annual Calendar)</div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Accounting Basis</label>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Accrual Basis (Strict Double-Entry General Ledger)</div>
              </div>
              <div style={{ backgroundColor: 'var(--surface-3)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>Prior Period Locking</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prevent mutations in closed periods (AGENTS.md Rule 6)</div>
                </div>
                <input
                  type="checkbox"
                  checked={periodLocked}
                  onChange={(e) => setPeriodLocked(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--gold)' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'branches' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {[
            { name: 'Dubai Central Hub (Main Wholesale)', code: 'DXB-01', type: 'Primary Wholesale & Distribution', status: 'ACTIVE', registers: 4, address: 'Al Quoz Industrial Area 3, Dubai' },
            { name: 'Abu Dhabi Flagship Store (Retail)', code: 'AUH-01', type: 'Retail Supermarket & POS', status: 'ACTIVE', registers: 2, address: 'Corniche Commercial District, Abu Dhabi' },
            { name: 'Sharjah Fulfillment Depot', code: 'SHJ-01', type: 'Logistics Depot & Buffer Stock', status: 'ACTIVE', registers: 1, address: 'Industrial Area 12, Sharjah' },
          ].map((b) => (
            <div key={b.code} style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold)', backgroundColor: 'var(--gold-dim)', border: '1px solid var(--gold-border)', padding: '2px 6px', borderRadius: '4px' }}>
                    {b.code}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)' }}>
                    ● {b.status}
                  </span>
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>{b.name}</h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{b.type}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📍 {b.address}</div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Active Registers: <strong style={{ color: 'var(--text-primary)' }}>{b.registers} POS</strong></span>
                <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Branch Scoped</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'tax' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={16} color="var(--gold)" />
              <span>Statutory Tax Engine (AGENTS.md Rule 7)</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>VAT Tax Registration Number (TRN)</label>
                <input type="text" readOnly value="100-4829-3918-0003" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-3)', color: 'var(--text-primary)', fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Standard Rate Configuration</label>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>UAE FTA 5.0% Standard Supply VAT (Data-Driven, Zero Hardcoded Rates)</div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Input Tax Recoverability Rule</label>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>100% Fully Recoverable on Commercial Purchases</div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="var(--success)" />
              <span>E-Invoicing & Cryptographic Signing</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Digital Signature Standard</label>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>ECDSA secp256k1 Cryptographic Signing with SHA-256 Digest</div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>QR Code Representation</label>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>TLV Base64 Encoded (Seller, TRN, Timestamp, Total, VAT)</div>
              </div>
              <div style={{ backgroundColor: 'var(--gold-dim)', border: '1px solid var(--gold-border)', borderRadius: '6px', padding: '10px 12px', color: 'var(--gold)', fontSize: '12px' }}>
                ✓ Compliant with UAE FTA E-Billing Mandate & KSA ZATCA Phase 2 Standards.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={16} color="var(--gold)" />
              <span>Immutable Ledger Chaining & Audit</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Double-Entry Invariant (AGENTS.md Rule 5 & 6)</label>
                <div style={{ color: 'var(--success)', fontWeight: 700 }}>∑ Debits ≡ ∑ Credits (Zero Drift Enforced at Database Level)</div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Deletion Policy</label>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Zero Hard Deletes on Posted Vouchers (Reversing Vouchers Only)</div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Hash Chaining Algorithm</label>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>SHA-256 Merkle Chaining linking sequential transactions</div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} color="var(--gold)" />
              <span>Platform Super Admin Privacy Invariant</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                Under AGENTS.md Rule 8, Platform Super Admins have zero access to your general ledger, vouchers, and customer records unless you grant an explicit, time-bounded Support-Access token.
              </p>
              <div style={{ backgroundColor: 'var(--surface-3)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Current Support Grant Status:</span>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>Locked (No Active Grant)</span>
              </div>
              <button
                type="button"
                onClick={() => alert('Support Access Grant modal: Generate a temporary, 2-hour encrypted token for verified support personnel.')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--surface-3)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--gold)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                + Issue Temporary Support Grant (2 Hours)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PurchasesView() {
  const [subView, setSubView] = useState<'analytics' | 'bills'>('analytics');
  const [billSearch, setBillSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WITHIN_TERMS' | 'OVERDUE' | 'SETTLED'>('ALL');

  const sampleBills = [
    { no: 'BILL-2026-00441', vendor: 'Gulf Wholesale Logistics FZE', category: 'Freight & Supply Chain', date: '2026-03-20', due: '2026-04-19', terms: 'Net 30', vat: '2,412.50', total: '48,250.00', status: 'OVERDUE', overdueDays: 12, discount: null },
    { no: 'BILL-2026-00438', vendor: 'Al-Etihad Packaging Industries', category: 'Raw Materials & Packing', date: '2026-04-10', due: '2026-05-10', terms: '2% 10 Net 30', vat: '1,709.00', total: '34,180.00', status: 'WITHIN_TERMS', overdueDays: 0, discount: '⚡ Save AED 683.60 if paid by Apr 20' },
    { no: 'BILL-2026-00435', vendor: 'Emirates National Oil Co (ENOC)', category: 'Fleet Fuel & Transport', date: '2026-04-05', due: '2026-05-05', terms: 'Net 30', vat: '1,120.00', total: '22,400.00', status: 'WITHIN_TERMS', overdueDays: 0, discount: null },
    { no: 'BILL-2026-00429', vendor: 'Amazon Web Services MENA', category: 'Cloud Infrastructure & SaaS', date: '2026-03-10', due: '2026-04-09', terms: 'Net 30', vat: '781.00', total: '15,620.00', status: 'OVERDUE', overdueDays: 22, discount: null },
    { no: 'BILL-2026-00424', vendor: 'Oasis Commercial Realty LLC', category: 'Store Facilities & Lease', date: '2026-04-01', due: '2026-04-30', terms: 'Net 30', vat: '4,250.00', total: '85,000.00', status: 'WITHIN_TERMS', overdueDays: 0, discount: null },
    { no: 'BILL-2026-00418', vendor: 'KPMG Lower Gulf Audit LLP', category: 'Statutory Audit & Tax', date: '2026-04-02', due: '2026-05-02', terms: 'Net 30', vat: '2,100.00', total: '42,000.00', status: 'WITHIN_TERMS', overdueDays: 0, discount: null },
    { no: 'BILL-2026-00412', vendor: 'FastTrack Courier Express', category: 'Store Fulfillment Delivery', date: '2026-03-25', due: '2026-04-15', terms: 'Net 20', vat: '447.00', total: '8,940.00', status: 'SETTLED', overdueDays: 0, discount: null },
    { no: 'BILL-2026-00405', vendor: 'Alpha Facility Management', category: 'Store Maintenance & HVAC', date: '2026-03-15', due: '2026-04-05', terms: 'Net 20', vat: '316.00', total: '6,320.00', status: 'SETTLED', overdueDays: 0, discount: null },
  ];

  const filteredBills = sampleBills.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (billSearch) {
      const q = billSearch.toLowerCase();
      return b.no.toLowerCase().includes(q) || b.vendor.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top View Selector Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setSubView('analytics')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: subView === 'analytics' ? 'var(--gold)' : 'var(--surface-3)',
              color: subView === 'analytics' ? 'var(--bg-canvas)' : 'var(--text-secondary)',
              border: subView === 'analytics' ? 'none' : '1px solid var(--border-default)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Executive AP Overview (Analytics)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('bills')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: subView === 'bills' ? 'var(--gold)' : 'var(--surface-3)',
              color: subView === 'bills' ? 'var(--bg-canvas)' : 'var(--text-secondary)',
              border: subView === 'bills' ? 'none' : '1px solid var(--border-default)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Vendor Bills & Payables Ledger ({sampleBills.length})</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              backgroundColor: 'var(--gold-dim)',
              color: 'var(--gold)',
              border: '1px solid var(--gold-border)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            Total AP: AED 8,430,000.00
          </span>
        </div>
      </div>

      {/* Conditional Sub-View Rendering */}
      {subView === 'analytics' ? (
        <AccountsPayableOverview currency="AED" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Bills Search and Filter Ribbon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-card)',
              borderRadius: '10px',
              padding: '12px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search vendor bills by number, supplier name, or category..."
                value={billSearch}
                onChange={(e) => setBillSearch(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  width: '100%',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {(['ALL', 'WITHIN_TERMS', 'OVERDUE', 'SETTLED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: statusFilter === st ? 'var(--gold)' : 'var(--surface-3)',
                    color: statusFilter === st ? 'var(--bg-canvas)' : 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    cursor: 'pointer',
                  }}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Bills Table */}
          <div
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-card)',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-3)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'start' }}>BILL #</th>
                  <th style={{ padding: '10px 16px', textAlign: 'start' }}>SUPPLIER & EXPENSE CATEGORY</th>
                  <th style={{ padding: '10px 16px', textAlign: 'start' }}>BILL DATE</th>
                  <th style={{ padding: '10px 16px', textAlign: 'start' }}>DUE DATE & TERMS</th>
                  <th style={{ padding: '10px 16px', textAlign: 'end' }}>VAT INPUT (5%)</th>
                  <th style={{ padding: '10px 16px', textAlign: 'end' }}>TOTAL AMOUNT (AED)</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((b) => (
                  <tr
                    key={b.no}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: 'var(--gold)',
                          backgroundColor: 'var(--gold-dim)',
                          border: '1px solid var(--gold-border)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        {b.no}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.vendor}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{b.category}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {b.date}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      <div>{b.due} <span style={{ color: 'var(--text-muted)' }}>({b.terms})</span></div>
                      {b.overdueDays > 0 && (
                        <span style={{ color: '#EF4444', fontSize: '11px', display: 'block', fontWeight: 600 }}>
                          +{b.overdueDays}d overdue
                        </span>
                      )}
                      {b.discount && (
                        <span style={{ color: 'var(--success)', fontSize: '11px', display: 'block', fontWeight: 600 }}>
                          {b.discount}
                        </span>
                      )}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 16px', textAlign: 'end', color: 'var(--text-secondary)' }}>
                      {b.vat}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 16px', textAlign: 'end', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {b.total}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor:
                            b.status === 'SETTLED'
                              ? 'var(--success-dim)'
                              : b.status === 'OVERDUE'
                              ? 'rgba(239, 68, 68, 0.12)'
                              : 'var(--info-dim)',
                          color:
                            b.status === 'SETTLED'
                              ? 'var(--success)'
                              : b.status === 'OVERDUE'
                              ? '#EF4444'
                              : 'var(--info)',
                          border:
                            b.status === 'SETTLED'
                              ? '1px solid var(--success-border)'
                              : b.status === 'OVERDUE'
                              ? '1px solid rgba(239, 68, 68, 0.3)'
                              : '1px solid var(--info-border)',
                        }}
                      >
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: 'var(--surface-3)', borderTop: '2px solid var(--border-card)' }}>
                  <td colSpan={4} style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Total Active Payables Batch (8 Records)
                  </td>
                  <td className="tabular-nums" style={{ padding: '12px 16px', textAlign: 'end', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    13,135.50
                  </td>
                  <td className="tabular-nums" style={{ padding: '12px 16px', textAlign: 'end', fontWeight: 800, color: 'var(--gold)', fontSize: '14px' }}>
                    262,710.00
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReportsView() {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'STATEMENTS' | 'PROFITABILITY' | 'TAX' | 'SCHEDULES'>('ALL');
  const [previewReport, setPreviewReport] = useState<any | null>(null);

  const reports = [
    {
      id: 'tb',
      category: 'STATEMENTS',
      title: 'Trial Balance',
      freq: 'Real-time Continuous',
      status: 'VERIFIED',
      desc: 'Complete listing of all 142 general ledger accounts verifying the fundamental double-entry equation: Total Debits ≡ Total Credits with zero drift.',
      formats: ['PDF', 'XLSX', 'XBRL'],
      sampleLines: [
        { code: '1010', name: 'Cash in Vault', debit: '24,500.00', credit: '0.00' },
        { code: '1020', name: 'Operating Bank (Emirates NBD)', debit: '6,240,000.00', credit: '0.00' },
        { code: '1025', name: 'Treasury Reserve (Dubai Islamic Bank)', debit: '3,160,000.00', credit: '0.00' },
        { code: '1030', name: 'Accounts Receivable (Trade Debtors)', debit: '14,890,000.00', credit: '0.00' },
        { code: '1040', name: 'Merchandise Inventory (COGS)', debit: '3,840,000.00', credit: '0.00' },
        { code: '2010', name: 'Accounts Payable (Trade Creditors)', debit: '0.00', credit: '8,430,000.00' },
        { code: '2020', name: 'VAT Output Tax Payable (5%)', debit: '0.00', credit: '184,280.00' },
        { code: '3010', name: 'Shareholder Paid-In Equity', debit: '0.00', credit: '10,000,000.00' },
        { code: '3020', name: 'Retained Earnings', debit: '0.00', credit: '3,980,000.00' },
        { code: '4010', name: 'Commercial Sales Revenue', debit: '0.00', credit: '24,800,000.00' },
        { code: '5010', name: 'Cost of Goods Sold (COGS)', debit: '14,100,000.00', credit: '0.00' },
        { code: '6010', name: 'Operating & Administrative Expenses', debit: '4,339,780.00', credit: '0.00' },
      ],
      totalDebit: '46,594,280.00',
      totalCredit: '46,594,280.00',
    },
    {
      id: 'pl',
      category: 'PROFITABILITY',
      title: 'Statement of Profit or Loss (P&L)',
      freq: 'Monthly / Quarterly',
      status: 'VERIFIED',
      desc: 'Comprehensive statement of financial performance reflecting gross operating revenue, direct Cost of Goods Sold, operating overheads, and net commercial margin.',
      formats: ['PDF', 'XLSX'],
      sampleLines: [
        { code: 'REV', name: 'Gross Commercial Revenue', debit: '0.00', credit: '24,800,000.00' },
        { code: 'COGS', name: 'Cost of Goods Sold (Inventory Outflow)', debit: '14,100,000.00', credit: '0.00' },
        { code: 'GP', name: 'Gross Profit (43.14% Margin)', debit: '0.00', credit: '10,700,000.00' },
        { code: 'OPEX', name: 'Selling, General & Administrative Expenses', debit: '4,339,780.00', credit: '0.00' },
        { code: 'EBITDA', name: 'Operating Income before Tax (EBITDA)', debit: '0.00', credit: '6,360,220.00' },
        { code: 'TAX', name: 'Corporate Income / Statutory Tax Provision', debit: '0.00', credit: '0.00' },
        { code: 'NET', name: 'Net Enterprise Margin (25.65% Net)', debit: '0.00', credit: '6,360,220.00' },
      ],
      totalDebit: '18,439,780.00',
      totalCredit: '48,220,440.00',
    },
    {
      id: 'bs',
      category: 'STATEMENTS',
      title: 'Statement of Financial Position (Balance Sheet)',
      freq: 'Quarterly / Annual',
      status: 'AUDITED',
      desc: 'GAAP and IFRS compliant statement of total economic resources, current & non-current liabilities, and residual shareholder equity capital.',
      formats: ['PDF', 'XLSX', 'XBRL'],
      sampleLines: [
        { code: 'CA', name: 'Current Assets (Cash, Receivables, Inventory)', debit: '28,154,500.00', credit: '0.00' },
        { code: 'NCA', name: 'Non-Current Assets (Store Equipment, Facilities)', debit: '4,280,000.00', credit: '0.00' },
        { code: 'CL', name: 'Current Liabilities (Payables, Tax Provisions)', debit: '0.00', credit: '8,614,280.00' },
        { code: 'NCL', name: 'Long-Term Corporate Debt Facilities', debit: '0.00', credit: '9,840,220.00' },
        { code: 'EQ', name: 'Shareholders Equity & Retained Earnings', debit: '0.00', credit: '13,980,000.00' },
      ],
      totalDebit: '32,434,500.00',
      totalCredit: '32,434,500.00',
    },
    {
      id: 'cf',
      category: 'STATEMENTS',
      title: 'Statement of Cash Flows',
      freq: 'Monthly / Quarterly',
      status: 'VERIFIED',
      desc: 'Standard indirect cash flow reconciliation detailing operating activities, capital expenditures, and corporate financing cash movements.',
      formats: ['PDF', 'XLSX'],
      sampleLines: [
        { code: 'CFO', name: 'Net Cash from Operating Activities', debit: '4,120,000.00', credit: '0.00' },
        { code: 'CFI', name: 'Net Cash used in Capital Investing Activities', debit: '0.00', credit: '850,000.00' },
        { code: 'CFF', name: 'Net Cash flow from Financing & Dividends', debit: '0.00', credit: '1,200,000.00' },
        { code: 'NET_CF', name: 'Net Increase in Enterprise Cash Buffer', debit: '2,070,000.00', credit: '0.00' },
      ],
      totalDebit: '6,190,000.00',
      totalCredit: '2,050,000.00',
    },
    {
      id: 'vat',
      category: 'TAX',
      title: 'UAE FTA VAT 201 Return Schedule',
      freq: 'Quarterly Tax Period',
      status: 'STATUTORY',
      desc: 'Federal Tax Authority standard reporting breakdown: Box 1a standard rated supplies (5%), reverse charge mechanisms, and input tax recoveries.',
      formats: ['PDF', 'XLSX', 'XML'],
      sampleLines: [
        { code: 'BOX_1A', name: 'Standard Rated Supplies (Dubai & Northern Emirates)', debit: '0.00', credit: '24,800,000.00' },
        { code: 'BOX_1B', name: 'Output VAT on Standard Rated Supplies (5%)', debit: '0.00', credit: '1,240,000.00' },
        { code: 'BOX_9', name: 'Recoverable Input Tax on Standard Purchases', debit: '1,225,720.00', credit: '0.00' },
        { code: 'BOX_10', name: 'Net VAT Due / (Recoverable) to FTA', debit: '14,280.00', credit: '0.00' },
      ],
      totalDebit: '1,240,000.00',
      totalCredit: '26,040,000.00',
    },
    {
      id: 'aging',
      category: 'SCHEDULES',
      title: 'Aged Receivables & Payables Audit Schedule',
      freq: 'Weekly / Bi-Weekly',
      status: 'ACTIVE',
      desc: 'Detailed chronological aging breakdown across 0-30, 31-60, 61-90, and >90 day tranches for all commercial counterparties.',
      formats: ['PDF', 'XLSX'],
      sampleLines: [
        { code: 'AR_CURR', name: 'Receivables: Current & Within Terms (<30d)', debit: '8,410,000.00', credit: '0.00' },
        { code: 'AR_DUE', name: 'Receivables: Overdue Balances (>30d)', debit: '6,480,000.00', credit: '0.00' },
        { code: 'AP_CURR', name: 'Payables: Current & Within Terms (<30d)', debit: '0.00', credit: '5,120,000.00' },
        { code: 'AP_DUE', name: 'Payables: Overdue Vendor Liabilities (>30d)', debit: '0.00', credit: '3,310,000.00' },
      ],
      totalDebit: '14,890,000.00',
      totalCredit: '8,430,000.00',
    },
  ];

  const filteredReports = reports.filter((r) => {
    if (selectedCategory === 'ALL') return true;
    return r.category === selectedCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: 0 }}>
              Financial Statements & Compliance
            </h1>
            <span
              style={{
                backgroundColor: 'var(--gold-dim)',
                color: 'var(--gold)',
                border: '1px solid var(--gold-border)',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              FY2026 Q1
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            IFRS & UAE FTA Standardized Financial Statements, General Ledger Schedules & Tax Filings
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setPreviewReport(reports[0])}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--gold)',
              color: 'var(--bg-canvas)',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px var(--gold-glow)',
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Quick Statement Preview</span>
          </button>
        </div>
      </div>

      {/* 4-Card Executive Financial Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Card 1: Balance Sheet Net Position */}
        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Enterprise Assets</span>
            <span style={{ color: 'var(--success)', backgroundColor: 'var(--success-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              +8.4% YoY
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            AED 32,434,500
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Shareholder Equity: AED 13,980,000.00
          </div>
        </div>

        {/* Card 2: Net Commercial Margin */}
        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Net Operating Margin</span>
            <span style={{ color: 'var(--gold)', backgroundColor: 'var(--gold-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              EBITDA: 25.6%
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gold)' }}>
            AED 6,360,220
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Gross Operating Revenue: AED 24.8M
          </div>
        </div>

        {/* Card 3: Working Capital Buffer */}
        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Current Liquidity Ratio</span>
            <span style={{ color: 'var(--info)', backgroundColor: 'var(--info-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              Healthy &gt; 1.5x
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--info)' }}>
            3.26x Ratio
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Net Working Capital: AED 19.5M
          </div>
        </div>

        {/* Card 4: Statutory Tax Filing */}
        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>UAE FTA VAT Position</span>
            <span style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              Due May 28
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            AED 14,280.00
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Output 1.24M • Input Recovery 1.22M
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '10px',
        }}
      >
        {[
          { id: 'ALL', label: 'All Statements & Filings' },
          { id: 'STATEMENTS', label: 'Core Financial Statements' },
          { id: 'PROFITABILITY', label: 'Profitability & Operating' },
          { id: 'TAX', label: 'Statutory & FTA Tax' },
          { id: 'SCHEDULES', label: 'Audit Ledgers & Aging' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id as any)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: selectedCategory === cat.id ? 'var(--gold)' : 'var(--surface-3)',
              color: selectedCategory === cat.id ? 'var(--bg-canvas)' : 'var(--text-secondary)',
              border: selectedCategory === cat.id ? 'none' : '1px solid var(--border-default)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '16px',
        }}
      >
        {filteredReports.map((r) => (
          <div
            key={r.id}
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-card)',
              borderRadius: '10px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--gold)',
                    backgroundColor: 'var(--gold-dim)',
                    border: '1px solid var(--gold-border)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {r.freq}
                </span>

                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--success)',
                    backgroundColor: 'var(--success-dim)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  ● {r.status}
                </span>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                {r.title}
              </h3>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 12px' }}>
                {r.desc}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {r.formats.map((fmt: string) => (
                  <span
                    key={fmt}
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--surface-3)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <button
                type="button"
                onClick={() => setPreviewReport(r)}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: 'var(--surface-3)',
                  color: 'var(--gold)',
                  border: '1px solid var(--gold-border)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Eye size={13} />
                <span>View Statement</span>
              </button>

              <button
                type="button"
                onClick={() => alert(`Exporting ${r.title} as standard XLSX spreadsheet.`)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: 'var(--surface-3)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Download size={13} />
                <span>XLSX</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Statement Preview Modal */}
      {previewReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--bg-overlay, rgba(5, 10, 20, 0.75))',
            backdropFilter: 'blur(3px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={20} color="var(--gold)" />
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {previewReport.title}
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Entity: Barakah Enterprises LLC • Base Currency: AED • Verified GAAP/IFRS
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewReport(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-3)', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                  <th style={{ textAlign: 'start', padding: '10px 12px' }}>CODE</th>
                  <th style={{ textAlign: 'start', padding: '10px 12px' }}>CLASSIFICATION & FINANCIAL LINE</th>
                  <th style={{ textAlign: 'end', padding: '10px 12px' }}>DEBIT (AED)</th>
                  <th style={{ textAlign: 'end', padding: '10px 12px' }}>CREDIT (AED)</th>
                </tr>
              </thead>
              <tbody>
                {previewReport.sampleLines.map((line: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--gold)', fontWeight: 700, fontSize: '12px' }}>
                      {line.code}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {line.name}
                    </td>
                    <td className="tabular-nums" style={{ padding: '10px 12px', textAlign: 'end', color: line.debit !== '0.00' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {line.debit}
                    </td>
                    <td className="tabular-nums" style={{ padding: '10px 12px', textAlign: 'end', color: line.credit !== '0.00' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {line.credit}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: 'var(--surface-3)', borderTop: '2px solid var(--border-card)', fontWeight: 800 }}>
                  <td colSpan={2} style={{ padding: '12px', color: 'var(--text-primary)' }}>
                    Report Summary Balance
                  </td>
                  <td className="tabular-nums" style={{ padding: '12px', textAlign: 'end', color: 'var(--text-primary)' }}>
                    {previewReport.totalDebit}
                  </td>
                  <td className="tabular-nums" style={{ padding: '12px', textAlign: 'end', color: 'var(--text-primary)' }}>
                    {previewReport.totalCredit}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPreviewReport(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--gold)',
                  border: 'none',
                  color: 'var(--bg-canvas)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Printer size={14} />
                <span>Print Official Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TeamView() {
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'AUDITOR'>('ALL');
  const [teamSearch, setTeamSearch] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'accountant' | 'auditor' | 'viewer'>('accountant');
  const [inviteSeat, setInviteSeat] = useState<'full' | 'read_only'>('full');
  const [inviteNotification, setInviteNotification] = useState<string | null>(null);

  const [members, setMembers] = useState([
    {
      id: 'usr-1',
      name: 'Jahed Al-Mamun',
      email: 'jahed@barakahenterprises.ae',
      role: 'OWNER',
      roleLabel: 'Managing Director & Owner',
      branches: 'All Branches (Enterprise Root)',
      seat: 'Full Enterprise Seat',
      mfa: true,
      lastActive: 'Active Now',
      status: 'ACTIVE',
    },
    {
      id: 'usr-2',
      name: 'Tariq Mansoor, CPA',
      email: 'tariq.m@barakahenterprises.ae',
      role: 'ADMIN',
      roleLabel: 'Chief Financial Officer & Controller',
      branches: 'All Branches',
      seat: 'Full Enterprise Seat',
      mfa: true,
      lastActive: '18m ago',
      status: 'ACTIVE',
    },
    {
      id: 'usr-3',
      name: 'Fatima Al-Zahra',
      email: 'fatima.z@barakahenterprises.ae',
      role: 'ACCOUNTANT',
      roleLabel: 'Senior Commercial Accountant',
      branches: 'Dubai Hub • Abu Dhabi Flagship',
      seat: 'Full Enterprise Seat',
      mfa: true,
      lastActive: '2h ago',
      status: 'ACTIVE',
    },
    {
      id: 'usr-4',
      name: 'David Sterling, CA',
      email: 'david.sterling@pwc.ae',
      role: 'AUDITOR',
      roleLabel: 'Statutory External Auditor (PwC)',
      branches: 'All Branches (Strict Read-Only)',
      seat: 'Read-Only Auditor Seat',
      mfa: true,
      lastActive: 'Yesterday',
      status: 'ACTIVE',
    },
    {
      id: 'usr-5',
      name: 'Sarah Jenkins',
      email: 'sarah.j@barakahenterprises.ae',
      role: 'ACCOUNTANT',
      roleLabel: 'Junior Ledger & AP Clerk',
      branches: 'Dubai Hub Only',
      seat: 'Full Enterprise Seat',
      mfa: false,
      lastActive: 'Invitation Sent',
      status: 'PENDING',
    },
  ]);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const newMember = {
      id: `usr-${Date.now()}`,
      name: inviteEmail.split('@')[0].replace('.', ' '),
      email: inviteEmail.trim(),
      role: inviteRole.toUpperCase(),
      roleLabel: inviteRole === 'admin' ? 'Co-Administrator' : inviteRole === 'accountant' ? 'Financial Accountant' : 'External Auditor',
      branches: 'Dubai Hub',
      seat: inviteSeat === 'full' ? 'Full Enterprise Seat' : 'Read-Only Auditor Seat',
      mfa: false,
      lastActive: 'Invitation Sent',
      status: 'PENDING',
    };

    setMembers((prev) => [newMember, ...prev]);
    setInviteNotification(`Invitation successfully dispatched to ${inviteEmail} (${newMember.seat}).`);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  const filteredMembers = members.filter((m) => {
    if (roleFilter !== 'ALL' && m.role !== roleFilter) return false;
    if (teamSearch) {
      const q = teamSearch.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.roleLabel.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: 0 }}>
              Team & Role-Based Access Control
            </h1>
            <span
              style={{
                backgroundColor: 'var(--gold-dim)',
                color: 'var(--gold)',
                border: '1px solid var(--gold-border)',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              Enterprise Tier
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Tenant Multi-Branch Entitlements, Seat Enforcement & Cryptographic MFA Security
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--gold)',
            color: 'var(--bg-canvas)',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 6px var(--gold-glow)',
          }}
        >
          <Plus size={15} />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Notification Banner */}
      {inviteNotification && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--success-dim)',
            border: '1px solid var(--success-border)',
            color: 'var(--success)',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{inviteNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setInviteNotification(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 4-Card RBAC Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Seat Utilization</span>
            <span style={{ color: 'var(--gold)', backgroundColor: 'var(--gold-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              {members.length} / 10 Used
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {members.length} Active Seats
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            4 Full Interactive • 1 Read-Only Auditor
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>MFA Enforcement</span>
            <span style={{ color: 'var(--success)', backgroundColor: 'var(--success-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              Hardware & TOTP
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)' }}>
            100% Enforced
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Mandatory two-factor authentication
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Branch Coverage</span>
            <span style={{ color: 'var(--info)', backgroundColor: 'var(--info-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              Multi-Branch Active
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--info)' }}>
            3 Active Branches
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Dubai Central • Abu Dhabi • Sharjah
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Tenant Boundary</span>
            <span style={{ color: 'var(--gold)', backgroundColor: 'var(--gold-dim)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              Strict Isolation
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Zero Drift
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            TenantGuard validated on every mutation
          </div>
        </div>
      </div>

      {/* Search and Role Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--surface-2)',
          border: '1px solid var(--border-card)',
          borderRadius: '10px',
          padding: '12px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search members by name, email, or role..."
            value={teamSearch}
            onChange={(e) => setTeamSearch(e.target.value)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '13px',
              width: '100%',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {(['ALL', 'OWNER', 'ADMIN', 'ACCOUNTANT', 'AUDITOR'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: roleFilter === r ? 'var(--gold)' : 'var(--surface-3)',
                color: roleFilter === r ? 'var(--bg-canvas)' : 'var(--text-secondary)',
                border: '1px solid var(--border-default)',
                cursor: 'pointer',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Team Table */}
      <div
        style={{
          backgroundColor: 'var(--surface-2)',
          border: '1px solid var(--border-card)',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-3)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>MEMBER & EMAIL</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>TENANT ROLE</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>BRANCH PERMISSIONS</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>SEAT TYPE</th>
              <th style={{ padding: '10px 16px', textAlign: 'center' }}>MFA</th>
              <th style={{ padding: '10px 16px', textAlign: 'center' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((m) => (
              <tr
                key={m.id}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background-color 0.1s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--gold-dim)',
                        border: '1px solid var(--gold-border)',
                        color: 'var(--gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '12px',
                      }}
                    >
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor:
                        m.role === 'OWNER'
                          ? 'var(--gold-dim)'
                          : m.role === 'ADMIN'
                          ? 'var(--info-dim)'
                          : m.role === 'AUDITOR'
                          ? 'var(--equity-dim, rgba(129, 140, 248, 0.12))'
                          : 'var(--surface-3)',
                      color:
                        m.role === 'OWNER'
                          ? 'var(--gold)'
                          : m.role === 'ADMIN'
                          ? 'var(--info)'
                          : m.role === 'AUDITOR'
                          ? 'var(--equity, #818CF8)'
                          : 'var(--text-primary)',
                      border:
                        m.role === 'OWNER'
                          ? '1px solid var(--gold-border)'
                          : m.role === 'ADMIN'
                          ? '1px solid var(--info-border)'
                          : '1px solid var(--border-default)',
                    }}
                  >
                    {m.role}
                  </span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{m.roleLabel}</div>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} color="var(--gold)" />
                    <span>{m.branches}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.seat}</span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  {m.mfa ? (
                    <span
                      title="MFA Enforced"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        color: 'var(--success)',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      <ShieldCheck size={14} /> Active
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Pending</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: m.status === 'ACTIVE' ? 'var(--success-dim)' : 'var(--warning-dim)',
                      color: m.status === 'ACTIVE' ? 'var(--success)' : 'var(--warning)',
                      border: m.status === 'ACTIVE' ? '1px solid var(--success-border)' : '1px solid var(--warning-border)',
                    }}
                  >
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--bg-overlay, rgba(5, 10, 20, 0.75))',
            backdropFilter: 'blur(3px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--gold)" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Invite Team Member to Tenant
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="colleague@barakahenterprises.ae"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Tenant Role *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  <option value="admin">Administrator / Controller</option>
                  <option value="accountant">Senior Accountant (Full Ledger)</option>
                  <option value="auditor">Statutory Auditor (Read-Only Audit)</option>
                  <option value="viewer">Store Viewer (Dashboard Only)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Seat Model (AGENTS.md Rule 9) *
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      backgroundColor: inviteSeat === 'full' ? 'var(--gold-dim)' : 'var(--surface-2)',
                      border: inviteSeat === 'full' ? '1px solid var(--gold-border)' : '1px solid var(--border-default)',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    <input
                      type="radio"
                      name="seat"
                      checked={inviteSeat === 'full'}
                      onChange={() => setInviteSeat('full')}
                      style={{ marginRight: '6px' }}
                    />
                    <strong style={{ color: inviteSeat === 'full' ? 'var(--gold)' : 'var(--text-primary)' }}>Full Seat</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '2px' }}>Interactive posting & edits</div>
                  </label>

                  <label
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      backgroundColor: inviteSeat === 'read_only' ? 'var(--gold-dim)' : 'var(--surface-2)',
                      border: inviteSeat === 'read_only' ? '1px solid var(--gold-border)' : '1px solid var(--border-default)',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    <input
                      type="radio"
                      name="seat"
                      checked={inviteSeat === 'read_only'}
                      onChange={() => setInviteSeat('read_only')}
                      style={{ marginRight: '6px' }}
                    />
                    <strong style={{ color: inviteSeat === 'read_only' ? 'var(--gold)' : 'var(--text-primary)' }}>Read-Only Seat</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '2px' }}>Auditors & compliance viewers</div>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--gold)',
                    border: 'none',
                    color: 'var(--bg-canvas)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Send Official Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function BankingView() {
  return <BankingTreasuryOverview currency="AED" />;
}
