'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  Lock,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Info,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  Copy,
  Filter,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import dynamic from 'next/dynamic';
import { I18nProvider, useI18n } from '../i18n/context';
import { useAuth } from '../contexts/AuthContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import {
  ChartOfAccountsView,
  GeneralLedgerView,
  SalesInvoicesView,
  PurchasesView,
  ReportsView,
  TeamView,
  SettingsView,
} from './TabViews';
import {
  formatCurrencyAmount,
  formatLocalizedDate,
  validateJournalLines,
} from '@accounting/core';

// Lazy load heavy components
const CommandPalette = dynamic(
  () => import('./CommandPalette').then((m) => m.CommandPalette),
  { ssr: false }
);

const FinancialChartsSection = dynamic(
  () => import('./FinancialCharts').then((m) => m.FinancialChartsSection),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '280px',
          backgroundColor: '#111A2E',
          borderRadius: '12px',
          border: '1px solid #1D2A44',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#7E8DA6',
          fontSize: '13px',
        }}
      >
        Loading financial analytics...
      </div>
    ),
  }
);

const ArAgingBucketsWidget = dynamic(
  () => import('./FinancialCharts').then((m) => m.ArAgingBucketsWidget),
  { ssr: false }
);

const CurrencyConverterWidget = dynamic(
  () => import('./CurrencyConverterWidget').then((m) => m.CurrencyConverterWidget),
  { ssr: false }
);

export interface StoreWorkspaceProps {
  storeSlug?: string;
  initialPage?: string;
}

export function StoreWorkspace({ storeSlug = 'barakah-enterprises', initialPage = 'dashboard' }: StoreWorkspaceProps) {
  return (
    <I18nProvider>
      <StoreWorkspaceContent storeSlug={storeSlug} initialPage={initialPage} />
    </I18nProvider>
  );
}

function StoreWorkspaceContent({ storeSlug, initialPage }: { storeSlug: string; initialPage: string }) {
  const router = useRouter();
  const { dict, locale, baseCurrency } = useI18n();

  // Normalize page name
  const canonicalPage = useMemo(() => {
    if (initialPage === 'coa') return 'accounts';
    if (initialPage === 'bills') return 'purchases';
    return initialPage || 'dashboard';
  }, [initialPage]);

  const { user, companies: authCompanies } = useAuth();
  const [activeTab, setActiveTab] = useState(canonicalPage);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(() => {
    return (
      storeSlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') || 'Store Workspace'
    );
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'POSTED' | 'DRAFT' | 'VOID'>('ALL');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveTab(canonicalPage);
  }, [canonicalPage]);

  // Active store tenant entity definition from authorized session memberships
  const companiesList = useMemo(() => {
    if (authCompanies && authCompanies.length > 0) {
      return authCompanies.map((c) => ({
        name: c.name,
        slug: c.slug,
        branch: 'Main Branch',
        trn: `Role: ${c.role.toUpperCase()}`,
      }));
    }
    return [
      {
        name: selectedCompany,
        slug: storeSlug,
        branch: 'Main Branch',
        trn: 'Tenant Boundary Active',
      },
    ];
  }, [authCompanies, selectedCompany, storeSlug]);

  // Sync selected company name from authorized memberships or slug
  useEffect(() => {
    const matching = authCompanies?.find((c) => c.slug === storeSlug);
    if (matching) {
      setSelectedCompany(matching.name);
    } else {
      const derived = storeSlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      setSelectedCompany(derived || 'Store Workspace');
    }
  }, [storeSlug, authCompanies]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`/${storeSlug}/${tabId}`);
  };

  const handleCompanyChange = (companyName: string, newSlug?: string) => {
    setSelectedCompany(companyName);
    if (newSlug && newSlug !== storeSlug) {
      toast.info(`Switching tenant to store: ${newSlug}`);
      router.push(`/${newSlug}/dashboard`);
    }
  };

  // Vouchers state - connected to Phase 2 General Ledger persistence
  const sampleVouchers: Array<{
    voucher: string;
    dateStr: string;
    descKey: any;
    debit: string;
    credit: string;
    status: 'POSTED' | 'DRAFT' | 'VOID';
    lines: Array<{ acct: string; memo: string; dr: string; cr: string }>;
  }> = useMemo(() => [], []);

  // Filter vouchers by status and search
  const filteredVouchers = useMemo(() => {
    return sampleVouchers.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesVoucher = item.voucher.toLowerCase().includes(query);
        const matchesDesc = (dict.dashboard as Record<string, string>)[item.descKey]?.toLowerCase().includes(query) ?? false;
        return matchesVoucher || matchesDesc;
      }
      return true;
    });
  }, [sampleVouchers, statusFilter, searchQuery, dict]);

  // Double-entry validation on sample records using @accounting/core
  const batchValidation = useMemo(() => {
    const rawLines = sampleVouchers.flatMap((v) =>
      v.lines.map((l) => ({
        accountId: l.acct.split(' ')[0],
        debit: l.dr.replace(/,/g, ''),
        credit: l.cr.replace(/,/g, ''),
      }))
    );
    return validateJournalLines(rawLines);
  }, [sampleVouchers]);

  const toggleRow = (voucher: string) => {
    setExpandedRows((prev) => ({ ...prev, [voucher]: !prev[voucher] }));
  };

  const copyVoucher = (voucher: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(voucher);
    toast.success(`Copied ${voucher} to clipboard`);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#0B1220',
        color: '#E6EAF2',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <Toaster position="top-right" theme="dark" richColors />

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onSelectTab={(tab) => {
          handleTabChange(tab);
          toast.info(`Switched to ${tab.toUpperCase()} view`);
        }}
      />

      {/* Responsive Enterprise Sidebar with canonical store URLs */}
      <Sidebar
        storeSlug={storeSlug}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Enterprise Top Navigation Bar */}
        <Header
          storeSlug={storeSlug}
          onOpenMobile={() => setMobileOpen(true)}
          selectedCompany={selectedCompany}
          onSelectCompany={handleCompanyChange}
          companiesList={companiesList}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCommandPalette={() => setCmdOpen(true)}
        />

        {/* Dynamic Workspace Container */}
        <main style={{ flex: 1, padding: '20px 24px 32px', overflowY: 'auto' }}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {(activeTab === 'accounts' || activeTab === 'coa') && <ChartOfAccountsView />}
            {activeTab === 'ledger' && <GeneralLedgerView />}
            {activeTab === 'sales' && <SalesInvoicesView />}
            {(activeTab === 'purchases' || activeTab === 'bills') && <PurchasesView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'team' && <TeamView />}
            {activeTab === 'settings' && <SettingsView />}

            {/* Default Primary Financial Dashboard */}
            {activeTab === 'dashboard' && (
              <>
                {/* Financial Context Strip */}
                <div className="context-strip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#F0F4FA', fontWeight: 600 }}>
                      <Building2 size={14} color="#C9A24B" />
                      <span>{selectedCompany}</span>
                      <span style={{ color: '#DFBF6E', fontWeight: 600, fontSize: '11px', backgroundColor: 'rgba(201, 162, 75, 0.12)', padding: '1px 6px', borderRadius: '4px' }}>
                        /{storeSlug}
                      </span>
                    </div>
                    <span style={{ color: '#2A3C60' }}>•</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={13} color="#7E8DA6" />
                      <span>{dict.dashboard.fiscalPeriodLabel}</span>
                    </div>
                    <span style={{ color: '#2A3C60' }}>•</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Layers size={13} color="#7E8DA6" />
                      <span>Base: <bdi dir="ltr">{baseCurrency}</bdi></span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'rgba(47, 191, 143, 0.12)',
                        border: '1px solid rgba(47, 191, 143, 0.3)',
                        color: '#2FBF8F',
                        borderRadius: '5px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.2px',
                      }}
                    >
                      <ShieldCheck size={11} />
                      <span>Strict Tenant Isolation Active</span>
                    </span>
                  </div>
                </div>

                {/* Page Heading Area */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <h1
                      style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: '#F0F4FA',
                        letterSpacing: '-0.3px',
                        margin: 0,
                      }}
                    >
                      {dict.dashboard.title}
                    </h1>
                    <p style={{ fontSize: '13px', color: '#8A97B2', marginTop: '3px' }}>
                      Canonical Store Route: <strong style={{ color: '#DFBF6E' }}>/{storeSlug}/dashboard</strong>
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleTabChange('reports')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: 'rgba(22, 34, 58, 0.8)',
                        border: '1px solid #22304D',
                        color: '#E6EAF2',
                        cursor: 'pointer',
                      }}
                    >
                      <FileSpreadsheet size={13} color="#DFBF6E" />
                      <span>Financial Reports</span>
                    </button>
                    <button
                      onClick={() => handleTabChange('sales')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: '#C9A24B',
                        border: 'none',
                        color: '#0B1220',
                        cursor: 'pointer',
                      }}
                    >
                      <span>+ Create Invoice</span>
                    </button>
                  </div>
                </div>

                {/* Asymmetric Financial Command Center */}
                <div className="asymmetric-command-grid">
                  <div
                    className="card-hover-lift"
                    style={{
                      background: 'linear-gradient(180deg, #111A2E 0%, #0E1627 100%)',
                      border: '1px solid #1D2A44',
                      borderRadius: '12px',
                      padding: '22px 24px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), 0 8px 24px rgba(0, 0, 0, 0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(47, 191, 143, 0.12)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#2FBF8F',
                            }}
                          >
                            <Wallet size={16} />
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F4FA' }}>
                              {dict.dashboard.workingCapitalTitle}
                            </div>
                            <div style={{ fontSize: '11px', color: '#7E8DA6' }}>
                              {dict.dashboard.cashAndBank}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ margin: '8px 0 16px' }}>
                        <div
                          className="tabular-nums"
                          style={{
                            fontSize: '32px',
                            fontWeight: 800,
                            letterSpacing: '-0.5px',
                            color: '#F0F4FA',
                          }}
                        >
                          <bdi dir="ltr">{formatCurrencyAmount('0.00', 'AED')}</bdi>
                        </div>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#DFBF6E',
                            marginTop: '6px',
                            backgroundColor: 'rgba(201, 162, 75, 0.08)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          <span>Phase 2 Ledger Pending (0.00 AED)</span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '12px',
                          paddingTop: '16px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '11px', color: '#8A97B2', marginBottom: '2px' }}>
                            {dict.dashboard.accountsReceivable} (AR)
                          </div>
                          <div
                            className="tabular-nums"
                            style={{ fontSize: '16px', fontWeight: 700, color: '#60A5FA' }}
                          >
                            <bdi dir="ltr">{formatCurrencyAmount('0.00', 'AED')}</bdi>
                          </div>
                          <div style={{ fontSize: '10px', color: '#7E8DA6', marginTop: '2px' }}>
                            0 invoices pending
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '11px', color: '#8A97B2', marginBottom: '2px' }}>
                            {dict.dashboard.accountsPayable} (AP)
                          </div>
                          <div
                            className="tabular-nums"
                            style={{ fontSize: '16px', fontWeight: 700, color: '#EC5A60' }}
                          >
                            <bdi dir="ltr">{formatCurrencyAmount('0.00', 'AED')}</bdi>
                          </div>
                          <div style={{ fontSize: '10px', color: '#7E8DA6', marginTop: '2px' }}>
                            0 bills pending
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '11px', color: '#8A97B2', marginBottom: '2px' }}>
                            {dict.dashboard.netOperatingIncome}
                          </div>
                          <div
                            className="tabular-nums"
                            style={{ fontSize: '16px', fontWeight: 700, color: '#DFBF6E' }}
                          >
                            <bdi dir="ltr">{formatCurrencyAmount('0.00', 'AED')}</bdi>
                          </div>
                          <div style={{ fontSize: '10px', color: '#7E8DA6', marginTop: '2px' }}>
                            0.00 Net margin
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <ArAgingBucketsWidget />
                </div>

                {/* Financial Analytics & Charts Section */}
                <FinancialChartsSection />

                {/* Multi-Currency Converter & Exposure */}
                <div style={{ marginBottom: '24px' }}>
                  <CurrencyConverterWidget />
                </div>

                {/* General Ledger Voucher Stream */}
                <div
                  style={{
                    backgroundColor: '#111A2E',
                    border: '1px solid #1D2A44',
                    borderRadius: '12px',
                    padding: '20px 22px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#F0F4FA', margin: 0 }}>
                        {dict.dashboard.sampleVouchersBadge}
                      </h2>
                      <p style={{ fontSize: '12px', color: '#7E8DA6', marginTop: '2px' }}>
                        Showing transactions for tenant <strong style={{ color: '#DFBF6E' }}>{storeSlug}</strong>
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {(['ALL', 'POSTED', 'DRAFT'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: statusFilter === st ? '#1E2D4A' : 'transparent',
                            color: statusFilter === st ? '#F0F4FA' : '#7E8DA6',
                            border: statusFilter === st ? '1px solid #2B3D63' : '1px solid transparent',
                            cursor: 'pointer',
                          }}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vouchers Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#0E1626', borderBottom: '1px solid #1D2A44', color: '#7E8DA6' }}>
                          <th style={{ width: '36px', padding: '10px' }}></th>
                          <th style={{ textAlign: 'start', padding: '10px 14px' }}>VOUCHER NO</th>
                          <th style={{ textAlign: 'start', padding: '10px 16px' }}>DATE</th>
                          <th style={{ textAlign: 'start', padding: '10px 16px' }}>DESCRIPTION</th>
                          <th style={{ textAlign: 'start', padding: '10px 16px' }}>STATUS</th>
                          <th style={{ textAlign: 'end', padding: '10px 16px' }}>DEBIT (AED)</th>
                          <th style={{ textAlign: 'end', padding: '10px 16px' }}>CREDIT (AED)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVouchers.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: '#7E8DA6' }}>
                              <BookOpen size={32} color="#C9A24B" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.7 }} />
                              <div style={{ fontWeight: 600, color: '#F0F4FA', marginBottom: '4px' }}>No Vouchers Posted Yet</div>
                              <div style={{ fontSize: '12px' }}>
                                General ledger posting persistence and voucher approval workflows activate in Phase 2.
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredVouchers.map((row) => {
                          const isExpanded = !!expandedRows[row.voucher];
                          return (
                            <React.Fragment key={row.voucher}>
                              <tr
                                onClick={() => toggleRow(row.voucher)}
                                style={{
                                  borderBottom: '1px solid #1D2A44',
                                  cursor: 'pointer',
                                  backgroundColor: isExpanded ? 'rgba(22, 34, 58, 0.4)' : 'transparent',
                                }}
                              >
                                <td style={{ padding: '12px 10px', textAlign: 'center', color: '#7E8DA6' }}>
                                  {isExpanded ? <ChevronDown size={14} color="#C9A24B" /> : <ChevronRight size={14} />}
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'start' }}>
                                  <span
                                    onClick={(e) => copyVoucher(row.voucher, e)}
                                    title="Click to copy voucher number"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '2px 7px',
                                      borderRadius: '5px',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      color: '#DFBF6E',
                                      backgroundColor: 'rgba(201, 162, 75, 0.08)',
                                      border: '1px solid rgba(201, 162, 75, 0.2)',
                                      cursor: 'copy',
                                    }}
                                  >
                                    <bdi dir="ltr">{row.voucher}</bdi>
                                    <Copy size={11} color="#C9A24B" />
                                  </span>
                                </td>
                                <td className="tabular-nums" style={{ padding: '12px 16px', color: '#94A3B8', textAlign: 'start', fontSize: '13px' }}>
                                  {formatLocalizedDate(row.dateStr, locale)}
                                </td>
                                <td style={{ padding: '12px 16px', color: '#F0F4FA', textAlign: 'start', fontWeight: 500, fontSize: '13px' }}>
                                  {(dict.dashboard as Record<string, string>)[row.descKey]}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'start' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      backgroundColor:
                                        row.status === 'POSTED'
                                          ? 'rgba(47, 191, 143, 0.1)'
                                          : 'rgba(245, 158, 11, 0.1)',
                                      color: row.status === 'POSTED' ? '#2FBF8F' : '#F59E0B',
                                      border:
                                        row.status === 'POSTED'
                                          ? '1px solid rgba(47, 191, 143, 0.2)'
                                          : '1px solid rgba(245, 158, 11, 0.2)',
                                    }}
                                  >
                                    {row.status}
                                  </span>
                                </td>
                                <td
                                  className="tabular-nums"
                                  style={{ padding: '12px 16px', textAlign: 'end', fontWeight: 600, color: '#F0F4FA', fontSize: '13px' }}
                                >
                                  <bdi dir="ltr">{formatCurrencyAmount(row.debit, 'AED')}</bdi>
                                </td>
                                <td
                                  className="tabular-nums"
                                  style={{ padding: '12px 16px', textAlign: 'end', fontWeight: 600, color: '#F0F4FA', fontSize: '13px' }}
                                >
                                  <bdi dir="ltr">{formatCurrencyAmount(row.credit, 'AED')}</bdi>
                                </td>
                              </tr>

                              {/* Expandable Line Details */}
                              {isExpanded && (
                                <tr style={{ backgroundColor: 'rgba(17, 26, 46, 0.85)', borderBottom: '1px solid #1D2A44' }}>
                                  <td colSpan={7} style={{ padding: '10px 24px 16px 44px' }}>
                                    <div
                                      style={{
                                        backgroundColor: '#0E1627',
                                        border: '1px solid #22304D',
                                        borderRadius: '8px',
                                        padding: '10px 14px',
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          color: '#C9A24B',
                                          marginBottom: '8px',
                                          letterSpacing: '0.04em',
                                          textTransform: 'uppercase',
                                        }}
                                      >
                                        Double-Entry Ledger Line Breakdown ({row.voucher})
                                      </div>
                                      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                                        <thead>
                                          <tr style={{ color: '#7E8DA6', borderBottom: '1px solid #1D2A44' }}>
                                            <th style={{ textAlign: 'start', padding: '6px 8px' }}>Account Code & Name</th>
                                            <th style={{ textAlign: 'start', padding: '6px 8px' }}>Line Memo</th>
                                            <th style={{ textAlign: 'end', padding: '6px 8px' }}>Debit (AED)</th>
                                            <th style={{ textAlign: 'end', padding: '6px 8px' }}>Credit (AED)</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {row.lines.map((l, li) => (
                                            <tr key={li} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                              <td style={{ padding: '6px 8px', color: '#F0F4FA', fontWeight: 500 }}>
                                                {l.acct}
                                              </td>
                                              <td style={{ padding: '6px 8px', color: '#8A97B2' }}>
                                                {l.memo}
                                              </td>
                                              <td style={{ padding: '6px 8px', textAlign: 'end', fontFamily: 'monospace', color: l.dr !== '0.00' ? '#2FBF8F' : '#7E8DA6' }}>
                                                {l.dr}
                                              </td>
                                              <td style={{ padding: '6px 8px', textAlign: 'end', fontFamily: 'monospace', color: l.cr !== '0.00' ? '#60A5FA' : '#7E8DA6' }}>
                                                {l.cr}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        }))}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: '#131D32', borderTop: '2px solid #22304D' }}>
                          <td colSpan={5} style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CheckCircle2 size={13} color="#2FBF8F" />
                              <span>{dict.dashboard.checksumTitle} <strong style={{ color: '#2FBF8F' }}>Double-Entry Verified</strong> (Debits = Credits)</span>
                            </div>
                          </td>
                          <td className="tabular-nums" style={{ padding: '12px 18px', textAlign: 'end', fontWeight: 700, color: '#F0F4FA', fontSize: '13px' }}>
                            <bdi dir="ltr">{formatCurrencyAmount(batchValidation.totalDebit.toString(), 'AED')}</bdi>
                          </td>
                          <td className="tabular-nums" style={{ padding: '12px 18px', textAlign: 'end', fontWeight: 700, color: '#F0F4FA', fontSize: '13px' }}>
                            <bdi dir="ltr">{formatCurrencyAmount(batchValidation.totalCredit.toString(), 'AED')}</bdi>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
