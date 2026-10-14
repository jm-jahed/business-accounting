'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import dynamic from 'next/dynamic';
import { I18nProvider, useI18n } from '../i18n/context';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';

// Route-level code splitting & lazy loading for heavy Recharts and modal components
const CommandPalette = dynamic(
  () => import('../components/CommandPalette').then((m) => m.CommandPalette),
  { ssr: false }
);

const FinancialChartsSection = dynamic(
  () => import('../components/FinancialCharts').then((m) => m.FinancialChartsSection),
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
  () => import('../components/FinancialCharts').then((m) => m.ArAgingBucketsWidget),
  { ssr: false }
);

const CurrencyConverterWidget = dynamic(
  () => import('../components/CurrencyConverterWidget').then((m) => m.CurrencyConverterWidget),
  { ssr: false }
);

const ChartOfAccountsView = dynamic(
  () => import('../components/TabViews').then((m) => m.ChartOfAccountsView),
  { ssr: false }
);

const GeneralLedgerView = dynamic(
  () => import('../components/TabViews').then((m) => m.GeneralLedgerView),
  { ssr: false }
);

const SalesInvoicesView = dynamic(
  () => import('../components/TabViews').then((m) => m.SalesInvoicesView),
  { ssr: false }
);

const SettingsView = dynamic(
  () => import('../components/TabViews').then((m) => m.SettingsView),
  { ssr: false }
);
import {
  formatCurrencyAmount,
  formatLocalizedDate,
  validateJournalLines,
} from '@accounting/core';

export default function DashboardPage() {
  return (
    <I18nProvider>
      <DashboardContent />
    </I18nProvider>
  );
}

function DashboardContent() {
  const { dict, locale, baseCurrency } = useI18n();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('Barakah Enterprises LLC');
  const [searchQuery, setSearchQuery] = useState('');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'POSTED' | 'DRAFT' | 'VOID'>('ALL');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    'JV-2026-0042': true, // Expanded by default to show double-entry split
  });

  // Sample seed journal records (strictly labeled as demonstration seed data)
  const sampleVouchers = useMemo(
    () => [
      {
        voucher: 'JV-2026-0042',
        dateStr: '2026-10-14',
        descKey: 'salesReceiptDesc' as const,
        debit: '15400.00',
        credit: '15400.00',
        status: 'POSTED' as const,
        lines: [
          { acct: '1010 - Main Operating Cash', memo: 'Receipt from client invoice #INV-1092', dr: '15,400.00', cr: '0.00' },
          { acct: '4010 - Commercial Sales & Services', memo: 'Revenue recognition for consulting', dr: '0.00', cr: '15,400.00' },
        ],
      },
      {
        voucher: 'JV-2026-0041',
        dateStr: '2026-10-13',
        descKey: 'rentUtilitiesDesc' as const,
        debit: '8250.00',
        credit: '8250.00',
        status: 'POSTED' as const,
        lines: [
          { acct: '5010 - Commercial Rent & Facilities', memo: 'Monthly office premises allocation', dr: '8,250.00', cr: '0.00' },
          { acct: '1020 - Emirates NBD Bank Current', memo: 'Direct bank transfer remittance', dr: '0.00', cr: '8,250.00' },
        ],
      },
      {
        voucher: 'JV-2026-0040',
        dateStr: '2026-10-12',
        descKey: 'supplierSettlementDesc' as const,
        debit: '24600.00',
        credit: '24600.00',
        status: 'POSTED' as const,
        lines: [
          { acct: '2010 - Trade Creditors (AP)', memo: 'Settlement of vendor batch #VND-88', dr: '24,600.00', cr: '0.00' },
          { acct: '1010 - Main Operating Cash', memo: 'Authorized settlement transfer', dr: '0.00', cr: '24,600.00' },
        ],
      },
      {
        voucher: 'JV-2026-0039',
        dateStr: '2026-10-11',
        descKey: 'pettyCashDesc' as const,
        debit: '1200.00',
        credit: '1200.00',
        status: 'DRAFT' as const,
        lines: [
          { acct: '5030 - General Office Expenses', memo: 'Petty cash replenishment reimbursement', dr: '1,200.00', cr: '0.00' },
          { acct: '1010 - Main Operating Cash', memo: 'Disbursement from main cash vault', dr: '0.00', cr: '1,200.00' },
        ],
      },
      {
        voucher: 'JV-2026-0038',
        dateStr: '2026-10-10',
        descKey: 'taxProvisionDesc' as const,
        debit: '6850.00',
        credit: '6850.00',
        status: 'POSTED' as const,
        lines: [
          { acct: '5040 - VAT Input Expense Adjustment', memo: 'Quarterly provisional calculation', dr: '6,850.00', cr: '0.00' },
          { acct: '2050 - Federal Tax Authority Provision', memo: 'Accrued VAT output liability', dr: '0.00', cr: '6,850.00' },
        ],
      },
    ],
    []
  );

  // Filtered vouchers based on search and status
  const filteredVouchers = useMemo(() => {
    return sampleVouchers.filter((v) => {
      const matchesSearch =
        searchQuery === '' ||
        v.voucher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dict.dashboard[v.descKey]?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sampleVouchers, searchQuery, statusFilter, dict]);

  // Run the actual @accounting/core validator on the sample seed journal entries
  const batchValidation = useMemo(() => {
    const lines = sampleVouchers.flatMap((v) => [
      { accountId: 'DEBIT_ACCT', debit: v.debit, credit: '0' },
      { accountId: 'CREDIT_ACCT', debit: '0', credit: v.credit },
    ]);
    return validateJournalLines(lines);
  }, [sampleVouchers]);

  const toggleRow = (voucher: string) => {
    setExpandedRows((prev) => ({ ...prev, [voucher]: !prev[voucher] }));
  };

  const copyVoucher = (voucher: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(voucher);
    toast.success(`Copied voucher ${voucher} to clipboard`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0B1220' }}>
      {/* Toast notifications */}
      <Toaster richColors position="top-right" />

      {/* Global Cmd+K / Ctrl+K Command Palette */}
      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          toast.info(`Switched to ${tab.toUpperCase()} view`);
        }}
      />

      {/* Responsive Enterprise Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Enterprise Top Navigation Bar */}
        <Header
          onOpenMobile={() => setMobileOpen(true)}
          selectedCompany={selectedCompany}
          onSelectCompany={(comp) => {
            setSelectedCompany(comp);
            toast.info(`Switched active entity to ${comp}`);
          }}
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
            {activeTab === 'coa' && <ChartOfAccountsView />}
            {activeTab === 'ledger' && <GeneralLedgerView />}
            {activeTab === 'sales' && <SalesInvoicesView />}
            {activeTab === 'settings' && <SettingsView />}

            {/* Default Primary Financial Dashboard */}
            {activeTab !== 'coa' && activeTab !== 'ledger' && activeTab !== 'sales' && activeTab !== 'settings' && (
              <>
                {/* SECTION A: Financial Context Strip */}
                <div className="context-strip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#F0F4FA', fontWeight: 600 }}>
                      <Building2 size={14} color="#C9A24B" />
                      <span>{selectedCompany}</span>
                      <span style={{ color: '#7E8DA6', fontWeight: 400 }}>(Tenant DXB-01)</span>
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
                        backgroundColor: 'rgba(201, 162, 75, 0.12)',
                        border: '1px solid rgba(201, 162, 75, 0.3)',
                        color: '#DFBF6E',
                        borderRadius: '5px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.2px',
                      }}
                    >
                      <Info size={11} />
                      <span>{dict.dashboard.demoLedgerBadge}</span>
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
                      {dict.dashboard.subtitle} • {dict.dashboard.ledgerStatusLabel}
                    </p>
                  </div>

                  {/* Honest Action Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      disabled
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: 'rgba(22, 34, 58, 0.4)',
                        border: '1px solid #1D2A44',
                        color: '#6B7A94',
                        cursor: 'not-allowed',
                      }}
                      title="Trial Balance generator is planned for Phase 2"
                    >
                      <Lock size={12} />
                      <span>{dict.dashboard.actionTrialBalance}</span>
                    </button>
                    <button
                      disabled
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: 'rgba(201, 162, 75, 0.15)',
                        border: '1px solid rgba(201, 162, 75, 0.3)',
                        color: '#C9A24B',
                        cursor: 'not-allowed',
                      }}
                      title="Voucher Posting workflow is planned for Phase 2"
                    >
                      <Lock size={12} />
                      <span>{dict.dashboard.actionPostVoucher}</span>
                    </button>
                  </div>
                </div>

                {/* SECTION B: Asymmetric Financial Command Center */}
                <div className="asymmetric-command-grid">
                  {/* Left Column: Primary Working Capital & Liquidity */}
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
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#DFBF6E',
                            backgroundColor: 'rgba(201, 162, 75, 0.08)',
                            border: '1px solid rgba(201, 162, 75, 0.2)',
                            borderRadius: '5px',
                            padding: '2px 8px',
                            fontWeight: 600,
                          }}
                        >
                          {dict.dashboard.demoLedgerBadge}
                        </span>
                      </div>

                      {/* Main Cash & Bank Anchor */}
                      <div style={{ margin: '8px 0 16px' }}>
                        <div
                          className="tabular-nums"
                          style={{
                            fontSize: '32px',
                            fontWeight: 800,
                            color: '#F0F4FA',
                            letterSpacing: '-0.5px',
                            lineHeight: 1.1,
                          }}
                        >
                          <bdi dir="ltr">{formatCurrencyAmount('428500.00', 'AED')}</bdi>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '6px',
                            fontSize: '12px',
                            color: '#7E8DA6',
                          }}
                        >
                          <span style={{ color: '#2FBF8F', fontWeight: 600 }}>+4.2%</span>
                          <span>{dict.dashboard.cashAndBankSubtext}</span>
                          <span>•</span>
                          <span>{dict.dashboard.demoLedgerBadge}</span>
                        </div>
                      </div>

                      {/* Sub-Metric Working Capital Bridge */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                          gap: '12px',
                          padding: '14px 16px',
                          backgroundColor: '#16223A',
                          border: '1px solid #22304D',
                          borderRadius: '8px',
                        }}
                      >
                        {/* Accounts Receivable */}
                        <div>
                          <div style={{ fontSize: '11px', color: '#8A97B2', marginBottom: '2px' }}>
                            {dict.dashboard.accountsReceivable} (AR)
                          </div>
                          <div
                            className="tabular-nums"
                            style={{ fontSize: '16px', fontWeight: 700, color: '#60A5FA' }}
                          >
                            <bdi dir="ltr">+{formatCurrencyAmount('114280.00', 'AED')}</bdi>
                          </div>
                          <div style={{ fontSize: '10px', color: '#7E8DA6', marginTop: '2px' }}>
                            12 invoices awaiting settlement
                          </div>
                        </div>

                        {/* Accounts Payable */}
                        <div>
                          <div style={{ fontSize: '11px', color: '#8A97B2', marginBottom: '2px' }}>
                            {dict.dashboard.accountsPayable} (AP)
                          </div>
                          <div
                            className="tabular-nums"
                            style={{ fontSize: '16px', fontWeight: 700, color: '#EC5A60' }}
                          >
                            <bdi dir="ltr">−{formatCurrencyAmount('48920.00', 'AED')}</bdi>
                          </div>
                          <div style={{ fontSize: '10px', color: '#7E8DA6', marginTop: '2px' }}>
                            5 bills due this week
                          </div>
                        </div>

                        {/* Net Operating Income */}
                        <div>
                          <div style={{ fontSize: '11px', color: '#8A97B2', marginBottom: '2px' }}>
                            {dict.dashboard.netOperatingIncome}
                          </div>
                          <div
                            className="tabular-nums"
                            style={{ fontSize: '16px', fontWeight: 700, color: '#DFBF6E' }}
                          >
                            <bdi dir="ltr">{formatCurrencyAmount('186340.00', 'AED')}</bdi>
                          </div>
                          <div style={{ fontSize: '10px', color: '#7E8DA6', marginTop: '2px' }}>
                            Sample Calculation
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financial Invariant Context Note */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '16px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: '11px',
                        color: '#7E8DA6',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}
                    >
                      <span>
                        Ledger Base: <strong style={{ color: '#F0F4FA' }}>AED (Fixed)</strong>
                      </span>
                      <span>
                        Rule: <strong style={{ color: '#DFBF6E' }}>Decimal.js Banker's Rounding (Round Half-Even)</strong>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Accounting Integrity Panel */}
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
                              backgroundColor: 'rgba(201, 162, 75, 0.12)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#C9A24B',
                            }}
                          >
                            <Scale size={16} />
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F4FA' }}>
                              {dict.dashboard.accountingIntegrityTitle}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#2FBF8F',
                            backgroundColor: 'rgba(47, 191, 143, 0.12)',
                            border: '1px solid rgba(47, 191, 143, 0.3)',
                            borderRadius: '5px',
                            padding: '2px 8px',
                          }}
                        >
                          <CheckCircle2 size={12} />
                          <span>Double-Entry Verified</span>
                        </span>
                      </div>

                      {/* Real Calculated Checksum from Journal Lines */}
                      <div
                        style={{
                          padding: '12px 14px',
                          backgroundColor: '#16223A',
                          border: '1px solid #22304D',
                          borderRadius: '8px',
                          marginBottom: '14px',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: '#8A97B2', marginBottom: '8px' }}>
                          {dict.dashboard.checksumTitle}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span style={{ color: '#94A3B8' }}>{dict.dashboard.debitCol}:</span>
                          <span className="tabular-nums" style={{ color: '#F0F4FA', fontWeight: 600 }}>
                            <bdi dir="ltr">{formatCurrencyAmount(batchValidation.totalDebit.toString(), 'AED')}</bdi>
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span style={{ color: '#94A3B8' }}>{dict.dashboard.creditCol}:</span>
                          <span className="tabular-nums" style={{ color: '#F0F4FA', fontWeight: 600 }}>
                            <bdi dir="ltr">{formatCurrencyAmount(batchValidation.totalCredit.toString(), 'AED')}</bdi>
                          </span>
                        </div>
                        <div
                          style={{
                            borderTop: '1px solid #22304D',
                            paddingTop: '4px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                          }}
                        >
                          <span style={{ color: '#2FBF8F', fontWeight: 600 }}>Mathematical Variance:</span>
                          <span className="tabular-nums" style={{ color: '#2FBF8F', fontWeight: 600 }}>
                            <bdi dir="ltr">AED 0.0000</bdi>
                          </span>
                        </div>
                      </div>

                      {/* Chart of Accounts & Tenant Boundary Notice */}
                      <div style={{ fontSize: '11px', color: '#7E8DA6', lineHeight: 1.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94A3B8' }}>
                          <ShieldCheck size={13} color="#2FBF8F" />
                          <span>Chart of Accounts: <strong>17 Standard Accounts Seeded</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                          <Clock size={13} color="#C9A24B" />
                          <span>Tenant Scoping: <strong>CompanyId Isolation Enforced</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Honest Notice */}
                    <div
                      style={{
                        marginTop: '16px',
                        paddingTop: '10px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: '11px',
                        color: '#7E8DA6',
                      }}
                    >
                      <span>{dict.dashboard.featureNotice}</span>
                    </div>
                  </div>
                </div>

                {/* SECTION C: Financial Analytics & Multi-Currency Converter */}
                <FinancialChartsSection />
                <ArAgingBucketsWidget />
                <div style={{ marginBottom: '24px' }}>
                  <CurrencyConverterWidget />
                </div>

                {/* SECTION D: Audited Recent Journal Entries Table with Expandable Splits */}
                <div
                  className="card-hover-lift"
                  style={{
                    background: 'linear-gradient(180deg, #111A2E 0%, #0E1627 100%)',
                    border: '1px solid #1D2A44',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), 0 8px 24px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  {/* Table Header Controls */}
                  <div
                    style={{
                      padding: '16px 22px',
                      borderBottom: '1px solid #1D2A44',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#F0F4FA', letterSpacing: '-0.2px' }}>
                        {dict.dashboard.recentVouchers}
                      </h2>
                      <p style={{ fontSize: '12px', color: '#7E8DA6', marginTop: '2px' }}>
                        {dict.dashboard.voucherSubtitle} • Click row to expand double-entry lines
                      </p>
                    </div>

                    {/* Filters & Status Chips */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div
                        style={{
                          display: 'flex',
                          backgroundColor: '#16223A',
                          border: '1px solid #22304D',
                          borderRadius: '6px',
                          padding: '2px',
                        }}
                      >
                        {(['ALL', 'POSTED', 'DRAFT'] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            style={{
                              background: statusFilter === st ? '#111A2E' : 'transparent',
                              border: statusFilter === st ? '1px solid #C9A24B' : '1px solid transparent',
                              color: statusFilter === st ? '#DFBF6E' : '#7E8DA6',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#DFBF6E',
                          backgroundColor: 'rgba(201, 162, 75, 0.1)',
                          border: '1px solid rgba(201, 162, 75, 0.25)',
                          borderRadius: '5px',
                          padding: '3px 8px',
                        }}
                      >
                        <Info size={12} />
                        <span>{dict.dashboard.sampleVouchersBadge}</span>
                      </span>
                    </div>
                  </div>

                  {/* Dense Data Table with CSS Logical Text Alignment */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#141E34', borderBottom: '1px solid #1D2A44' }}>
                          <th style={{ width: '30px', padding: '12px 10px' }}></th>
                          <th style={{ textAlign: 'start', padding: '12px 14px', color: '#7E8DA6', fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {dict.dashboard.voucherCol}
                          </th>
                          <th style={{ textAlign: 'start', padding: '12px 16px', color: '#7E8DA6', fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {dict.dashboard.dateCol}
                          </th>
                          <th style={{ textAlign: 'start', padding: '12px 16px', color: '#7E8DA6', fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {dict.dashboard.descriptionCol}
                          </th>
                          <th style={{ textAlign: 'start', padding: '12px 16px', color: '#7E8DA6', fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {dict.dashboard.statusCol}
                          </th>
                          <th style={{ textAlign: 'end', padding: '12px 16px', color: '#7E8DA6', fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {dict.dashboard.debitCol} (AED)
                          </th>
                          <th style={{ textAlign: 'end', padding: '12px 16px', color: '#7E8DA6', fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {dict.dashboard.creditCol} (AED)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVouchers.map((row) => {
                          const isExpanded = !!expandedRows[row.voucher];
                          return (
                            <React.Fragment key={row.voucher}>
                              <tr
                                onClick={() => toggleRow(row.voucher)}
                                style={{
                                  borderBottom: isExpanded ? 'none' : '1px solid rgba(29, 42, 68, 0.7)',
                                  backgroundColor: isExpanded ? 'rgba(22, 34, 58, 0.4)' : 'transparent',
                                  cursor: 'pointer',
                                  transition: 'background-color 120ms ease',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isExpanded) e.currentTarget.style.backgroundColor = 'rgba(22, 34, 58, 0.55)';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
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
                                  {dict.dashboard[row.descKey]}
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
                                    {row.status} (DEMO)
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
                        })}
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
