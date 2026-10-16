'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Scale,
  Calendar,
  Lock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
  X,
  Trash2,
  DollarSign,
} from 'lucide-react';

export interface GeneralLedgerOverviewProps {
  currency?: string;
  onPostVoucher?: (voucherData: any) => Promise<void>;
}

interface LedgerLine {
  id: string;
  date: string;
  voucherNo: string;
  type: 'JOURNAL' | 'PAYMENT' | 'RECEIPT' | 'SALES' | 'PURCHASE';
  accountCode: string;
  accountName: string;
  description: string;
  debit: string;
  credit: string;
  runningBalance: string;
}

const SAMPLE_LEDGER_DATA: LedgerLine[] = [
  { id: 'gl-1', date: '2026-04-12', voucherNo: 'JV-2026-00042', type: 'SALES', accountCode: '1020', accountName: 'Operating Bank (Emirates NBD)', description: 'Direct electronic transfer settlement from Al-Barakah', debit: '52,500.00', credit: '0.00', runningBalance: '6,240,000.00' },
  { id: 'gl-2', date: '2026-04-12', voucherNo: 'JV-2026-00042', type: 'SALES', accountCode: '4010', accountName: 'Commercial Sales Revenue', description: 'Wholesale sales distribution delivery', debit: '0.00', credit: '50,000.00', runningBalance: '1,450,000.00' },
  { id: 'gl-3', date: '2026-04-12', voucherNo: 'JV-2026-00042', type: 'SALES', accountCode: '2020', accountName: 'VAT Output Tax Payable (5%)', description: 'UAE FTA standard rate output tax', debit: '0.00', credit: '2,500.00', runningBalance: '72,500.00' },
  { id: 'gl-4', date: '2026-04-10', voucherNo: 'JV-2026-00041', type: 'PURCHASE', accountCode: '1030', accountName: 'Merchandise Inventory (COGS)', description: 'Central warehouse inventory replenishment', debit: '30,000.00', credit: '0.00', runningBalance: '840,000.00' },
  { id: 'gl-5', date: '2026-04-10', voucherNo: 'JV-2026-00041', type: 'PURCHASE', accountCode: '1040', accountName: 'VAT Input Tax Recoverable', description: 'UAE statutory recoverable input tax (5%)', debit: '1,500.00', credit: '0.00', runningBalance: '38,200.00' },
  { id: 'gl-6', date: '2026-04-10', voucherNo: 'JV-2026-00041', type: 'PURCHASE', accountCode: '2010', accountName: 'Accounts Payable (Vendors)', description: 'Supplier liability recorded for Gulf Distributors', debit: '0.00', credit: '31,500.00', runningBalance: '84,350.00' },
  { id: 'gl-7', date: '2026-04-08', voucherNo: 'JV-2026-00040', type: 'JOURNAL', accountCode: '6010', accountName: 'Rent & Facility Expense', description: 'Monthly commercial store lease accrual', debit: '18,000.00', credit: '0.00', runningBalance: '72,000.00' },
  { id: 'gl-8', date: '2026-04-08', voucherNo: 'JV-2026-00040', type: 'JOURNAL', accountCode: '2030', accountName: 'Accrued Operating Expenses', description: 'Accrued lease liability to landlord', debit: '0.00', credit: '18,000.00', runningBalance: '36,000.00' },
];

export function GeneralLedgerOverview({
  currency = 'AED',
  onPostVoucher,
}: GeneralLedgerOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // New Voucher Form State
  const [voucherDate, setVoucherDate] = useState('2026-04-15');
  const [voucherType, setVoucherType] = useState<'JOURNAL' | 'PAYMENT' | 'RECEIPT'>('JOURNAL');
  const [voucherReference, setVoucherReference] = useState('');
  const [voucherDescription, setVoucherDescription] = useState('');
  const [voucherLines, setVoucherLines] = useState([
    { accountCode: '1020', accountName: 'Operating Bank (Emirates NBD)', debit: '10000.00', credit: '0.00', memo: '' },
    { accountCode: '4010', accountName: 'Commercial Sales Revenue', debit: '0.00', credit: '10000.00', memo: '' },
  ]);

  // Double-Entry Balance Calculation
  const balanceMath = useMemo(() => {
    let d = 0;
    let c = 0;
    for (const l of voucherLines) {
      d += parseFloat(l.debit) || 0;
      c += parseFloat(l.credit) || 0;
    }
    const diff = Math.abs(d - c);
    const isBalanced = diff < 0.0001 && d > 0;
    return {
      totalDebit: d.toFixed(2),
      totalCredit: c.toFixed(2),
      difference: diff.toFixed(2),
      isBalanced,
    };
  }, [voucherLines]);

  const addVoucherLine = () => {
    setVoucherLines((prev) => [
      ...prev,
      { accountCode: '1010', accountName: 'Cash on Hand', debit: '0.00', credit: '0.00', memo: '' },
    ]);
  };

  const removeVoucherLine = (idx: number) => {
    if (voucherLines.length <= 2) return;
    setVoucherLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateVoucherLine = (idx: number, field: string, val: string) => {
    setVoucherLines((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const filteredLines = useMemo(() => {
    return SAMPLE_LEDGER_DATA.filter((l) => {
      if (selectedType !== 'ALL' && l.type !== selectedType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          l.voucherNo.toLowerCase().includes(q) ||
          l.accountCode.toLowerCase().includes(q) ||
          l.accountName.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedType, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* 1. Header Ribbon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border-card)',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.4px',
              margin: 0,
            }}
          >
            General Ledger & Double-Entry Postings
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Immutable Journal Batches, Multi-Currency Ledger Accounts & Audit Trail • Currency: <strong style={{ color: 'var(--gold)' }}>{currency}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--gold)',
            color: 'var(--bg-canvas)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          <span>New Journal Voucher</span>
        </button>
      </div>

      {/* 2. Top 4-Card KPI Metric Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Metric 1: Total Vouchers */}
        <div
          style={{
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB',
              flexShrink: 0,
            }}
          >
            <BookOpen size={22} />
          </div>
          <div>
            <div
              className="tabular-nums"
              style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}
            >
              142
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
              Posted Vouchers
            </div>
          </div>
        </div>

        {/* Metric 2: Double-Entry Equation Balance */}
        <div
          style={{
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
              flexShrink: 0,
            }}
          >
            <Scale size={22} />
          </div>
          <div>
            <div
              className="tabular-nums"
              style={{ fontSize: '20px', fontWeight: 800, color: '#10B981', lineHeight: 1.1 }}
            >
              Zero Drift (0.00)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
              ∑Debits ≡ ∑Credits Balanced
            </div>
          </div>
        </div>

        {/* Metric 3: Accounting Period Status */}
        <div
          style={{
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(201, 162, 75, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
              flexShrink: 0,
            }}
          >
            <Lock size={22} />
          </div>
          <div>
            <div
              style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}
            >
              FY 2026 • Period 04
            </div>
            <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '2px', fontWeight: 600 }}>
              Open for Postings
            </div>
          </div>
        </div>

        {/* Metric 4: Audit Trail Integrity */}
        <div
          style={{
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(139, 92, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8B5CF6',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div
              className="tabular-nums"
              style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}
            >
              Clean Audit Trail
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
              0 Invariant Discrepancies
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search and Type Filter Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border-card)',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search general ledger by voucher no, account code, or narration..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          {(['ALL', 'JOURNAL', 'SALES', 'PURCHASE', 'PAYMENT'] as const).map((vt) => (
            <button
              key={vt}
              type="button"
              onClick={() => setSelectedType(vt)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: selectedType === vt ? 'var(--gold)' : 'var(--surface-3)',
                color: selectedType === vt ? 'var(--bg-canvas)' : 'var(--text-secondary)',
                border: '1px solid var(--border-default)',
                cursor: 'pointer',
              }}
            >
              {vt}
            </button>
          ))}
        </div>
      </div>

      {/* 4. General Ledger Datatable */}
      <div
        style={{
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border-card)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-3)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'start' }}>DATE</th>
                <th style={{ padding: '10px 14px', textAlign: 'start' }}>VOUCHER NO.</th>
                <th style={{ padding: '10px 14px', textAlign: 'start' }}>TYPE</th>
                <th style={{ padding: '10px 14px', textAlign: 'start' }}>ACCOUNT</th>
                <th style={{ padding: '10px 14px', textAlign: 'start' }}>NARRATION & DETAIL</th>
                <th style={{ padding: '10px 14px', textAlign: 'end' }}>DEBIT (AED)</th>
                <th style={{ padding: '10px 14px', textAlign: 'end' }}>CREDIT (AED)</th>
                <th style={{ padding: '10px 14px', textAlign: 'end' }}>RUNNING BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {filteredLines.map((gl) => (
                <tr
                  key={gl.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '11px 14px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {gl.date}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: 'var(--gold)',
                        backgroundColor: 'var(--gold-dim)',
                        border: '1px solid var(--gold-border)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                      }}
                    >
                      {gl.voucherNo}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor:
                          gl.type === 'SALES'
                            ? 'var(--info-dim)'
                            : gl.type === 'PURCHASE'
                            ? 'var(--danger-dim)'
                            : 'var(--gold-dim)',
                        color:
                          gl.type === 'SALES'
                            ? 'var(--info)'
                            : gl.type === 'PURCHASE'
                            ? 'var(--danger)'
                            : 'var(--gold)',
                      }}
                    >
                      {gl.type}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {gl.accountCode} — {gl.accountName}
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {gl.description}
                  </td>
                  <td className="tabular-nums" style={{ padding: '11px 14px', textAlign: 'end', fontWeight: 700, color: gl.debit !== '0.00' ? 'var(--success)' : 'var(--text-muted)' }}>
                    {gl.debit !== '0.00' ? gl.debit : '—'}
                  </td>
                  <td className="tabular-nums" style={{ padding: '11px 14px', textAlign: 'end', fontWeight: 700, color: gl.credit !== '0.00' ? '#EF4444' : 'var(--text-muted)' }}>
                    {gl.credit !== '0.00' ? gl.credit : '—'}
                  </td>
                  <td className="tabular-nums" style={{ padding: '11px 14px', textAlign: 'end', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {gl.runningBalance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. New Journal Voucher Drawer Modal */}
      {isDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--bg-overlay, rgba(5, 10, 20, 0.75))',
            backdropFilter: 'blur(4px)',
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
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Post Double-Entry Journal Voucher
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Strict mathematical balance check: Total Debits must equal Total Credits
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--surface-3)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Voucher Header Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Posting Date
                </label>
                <input
                  type="date"
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Voucher Class
                </label>
                <select
                  value={voucherType}
                  onChange={(e) => setVoucherType(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                >
                  <option value="JOURNAL">General Journal Voucher (JV)</option>
                  <option value="PAYMENT">Bank Payment Voucher (PV)</option>
                  <option value="RECEIPT">Bank Receipt Voucher (RV)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  External Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. TR-9941 / Check #1042"
                  value={voucherReference}
                  onChange={(e) => setVoucherReference(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Voucher Narration & Business Purpose
              </label>
              <input
                type="text"
                placeholder="Describe the nature of this transaction for audit trail..."
                value={voucherDescription}
                onChange={(e) => setVoucherDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--surface-3)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Line Items Table */}
            <div style={{ border: '1px solid var(--border-default)', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-3)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'start' }}>ACCOUNT</th>
                    <th style={{ padding: '8px 10px', textAlign: 'start' }}>MEMO</th>
                    <th style={{ padding: '8px 10px', textAlign: 'end', width: '130px' }}>DEBIT (AED)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'end', width: '130px' }}>CREDIT (AED)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {voucherLines.map((line, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '6px 10px' }}>
                        <select
                          value={line.accountCode}
                          onChange={(e) => updateVoucherLine(idx, 'accountCode', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            backgroundColor: 'var(--surface-2)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                          }}
                        >
                          <option value="1010">1010 Cash on Hand</option>
                          <option value="1020">1020 Operating Bank (Emirates NBD)</option>
                          <option value="1030">1030 Merchandise Inventory</option>
                          <option value="1040">1040 VAT Input Tax Recoverable</option>
                          <option value="2010">2010 Accounts Payable (Vendors)</option>
                          <option value="2020">2020 VAT Output Tax Payable</option>
                          <option value="4010">4010 Commercial Sales Revenue</option>
                          <option value="6010">6010 Rent & Facility Expense</option>
                        </select>
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          type="text"
                          placeholder="Line memo"
                          value={line.memo}
                          onChange={(e) => updateVoucherLine(idx, 'memo', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            backgroundColor: 'var(--surface-2)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={line.debit}
                          onChange={(e) => updateVoucherLine(idx, 'debit', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            backgroundColor: 'var(--surface-2)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            textAlign: 'end',
                            fontWeight: 600,
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={line.credit}
                          onChange={(e) => updateVoucherLine(idx, 'credit', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            backgroundColor: 'var(--surface-2)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            textAlign: 'end',
                            fontWeight: 600,
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        {voucherLines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeVoucherLine(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={addVoucherLine}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: 'var(--surface-3)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={13} />
                <span>Add Voucher Line</span>
              </button>

              {/* Real-time Double-Entry Equation Balance Indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: balanceMath.isBalanced ? 'var(--success-dim)' : 'var(--danger-dim)',
                  border: `1px solid ${balanceMath.isBalanced ? 'var(--success-border)' : 'var(--danger-border)'}`,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              >
                <div>
                  Debits: <strong style={{ color: 'var(--text-primary)' }}>AED {balanceMath.totalDebit}</strong>
                </div>
                <div>
                  Credits: <strong style={{ color: 'var(--text-primary)' }}>AED {balanceMath.totalCredit}</strong>
                </div>
                {balanceMath.isBalanced ? (
                  <span style={{ color: 'var(--success)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> Balanced
                  </span>
                ) : (
                  <span style={{ color: 'var(--danger)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={13} /> Out by AED {balanceMath.difference}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
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
                disabled={!balanceMath.isBalanced}
                onClick={() => {
                  alert('Voucher posted successfully into General Ledger!');
                  setIsDrawerOpen(false);
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  backgroundColor: balanceMath.isBalanced ? 'var(--gold)' : 'var(--surface-3)',
                  color: balanceMath.isBalanced ? 'var(--bg-canvas)' : 'var(--text-muted)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: balanceMath.isBalanced ? 'pointer' : 'not-allowed',
                }}
              >
                Post Immutable Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
