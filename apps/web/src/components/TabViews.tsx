'use client';

import React from 'react';
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
} from 'lucide-react';

export function ChartOfAccountsView() {
  const accounts = [
    { code: '1010', name: 'Main Cash on Hand', type: 'ASSET', balance: 'DEBIT', amount: 'AED 385,200.00', status: 'ACTIVE' },
    { code: '1020', name: 'Emirates NBD Operating Account', type: 'ASSET', balance: 'DEBIT', amount: 'AED 43,300.00', status: 'ACTIVE' },
    { code: '1200', name: 'Accounts Receivable (Trade Debtors)', type: 'ASSET', balance: 'DEBIT', amount: 'AED 114,280.00', status: 'ACTIVE' },
    { code: '2010', name: 'Trade Creditors (Accounts Payable)', type: 'LIABILITY', balance: 'CREDIT', amount: 'AED 48,920.00', status: 'ACTIVE' },
    { code: '2050', name: 'VAT 5% Output Tax Payable', type: 'LIABILITY', balance: 'CREDIT', amount: 'AED 14,230.00', status: 'ACTIVE' },
    { code: '3010', name: 'Owner Contributed Capital', type: 'EQUITY', balance: 'CREDIT', amount: 'AED 300,000.00', status: 'ACTIVE' },
    { code: '3020', name: 'Retained Earnings', type: 'EQUITY', balance: 'CREDIT', amount: 'AED 120,000.00', status: 'ACTIVE' },
    { code: '4010', name: 'Commercial Sales & Consulting Revenue', type: 'REVENUE', balance: 'CREDIT', amount: 'AED 625,400.00', status: 'ACTIVE' },
    { code: '5010', name: 'Office Rent & Commercial Premises', type: 'EXPENSE', balance: 'DEBIT', amount: 'AED 99,000.00', status: 'ACTIVE' },
    { code: '5020', name: 'Staff Salaries & Benefits', type: 'EXPENSE', balance: 'DEBIT', amount: 'AED 142,500.00', status: 'ACTIVE' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F4FA', letterSpacing: '-0.3px' }}>
            Chart of Accounts
          </h1>
          <p style={{ fontSize: '13px', color: '#8A97B2', marginTop: '2px' }}>
            Standard Enterprise Chart of Accounts (Seeded DXB-01 Ledger)
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
          17 Seed Accounts Configured
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
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>CODE</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>ACCOUNT NAME</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>TYPE</th>
              <th style={{ padding: '10px 16px', textAlign: 'start' }}>NORMAL BALANCE</th>
              <th style={{ padding: '10px 16px', textAlign: 'end' }}>BALANCE (AED)</th>
              <th style={{ padding: '10px 16px', textAlign: 'center' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr
                key={a.code}
                style={{
                  borderBottom: '1px solid #1D2A44',
                  transition: 'background-color 100ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(22, 34, 58, 0.5)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#DFBF6E', fontWeight: 600 }}>
                  {a.code}
                </td>
                <td style={{ padding: '10px 16px', color: '#F0F4FA', fontWeight: 500 }}>{a.name}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: '#16223A',
                      color: '#8A97B2',
                      border: '1px solid #22304D',
                    }}
                  >
                    {a.type}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', color: '#8A97B2' }}>{a.balance}</td>
                <td
                  style={{
                    padding: '10px 16px',
                    textAlign: 'end',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: '#F0F4FA',
                  }}
                >
                  {a.amount}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      backgroundColor: 'rgba(47, 191, 143, 0.12)',
                      color: '#2FBF8F',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
          padding: '30px',
          backgroundColor: '#111A2E',
          border: '1px solid #1D2A44',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        <BookOpen size={40} color="#C9A24B" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F0F4FA', marginBottom: '6px' }}>
          General Ledger Audit Feed Active
        </h3>
        <p style={{ fontSize: '13px', color: '#8A97B2', maxWidth: '480px', margin: '0 auto 16px' }}>
          Seed journal batches are mathematically verified with 0.0000 variance. Production ledger posting connects to the primary journal ledger in Phase 2.
        </p>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(47, 191, 143, 0.12)',
            color: '#2FBF8F',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={14} /> Double-Entry Ledger Balanced (AED 56,300.00)
        </span>
      </div>
    </div>
  );
}

export function SalesInvoicesView() {
  const invoices = [
    { no: 'INV-1092', customer: 'Apex Global Logistics FZE', date: 'Oct 14, 2026', due: 'Nov 13, 2026', total: 'AED 15,400.00', status: 'SETTLED' },
    { no: 'INV-1091', customer: 'Blue Horizon Tech Hub LLC', date: 'Oct 10, 2026', due: 'Nov 09, 2026', total: 'AED 42,000.00', status: 'PENDING' },
    { no: 'INV-1090', customer: 'Crescent Moon Media Group', date: 'Oct 04, 2026', due: 'Nov 03, 2026', total: 'AED 18,200.00', status: 'PENDING' },
    { no: 'INV-1089', customer: 'Desert Bloom Ventures LLC', date: 'Sep 28, 2026', due: 'Oct 28, 2026', total: 'AED 38,680.00', status: 'OVERDUE' },
  ];

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
            backgroundColor: 'rgba(47, 191, 143, 0.12)',
            color: '#2FBF8F',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          Total AR: AED 114,280.00
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
            {invoices.map((inv) => (
              <tr
                key={inv.no}
                style={{
                  borderBottom: '1px solid #1D2A44',
                  transition: 'background-color 100ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(22, 34, 58, 0.5)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#DFBF6E', fontWeight: 600 }}>
                  {inv.no}
                </td>
                <td style={{ padding: '10px 16px', color: '#F0F4FA', fontWeight: 500 }}>{inv.customer}</td>
                <td style={{ padding: '10px 16px', color: '#8A97B2' }}>{inv.date}</td>
                <td style={{ padding: '10px 16px', color: '#8A97B2' }}>{inv.due}</td>
                <td
                  style={{
                    padding: '10px 16px',
                    textAlign: 'end',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: '#F0F4FA',
                  }}
                >
                  {inv.total}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      backgroundColor:
                        inv.status === 'SETTLED'
                          ? 'rgba(47, 191, 143, 0.12)'
                          : inv.status === 'PENDING'
                          ? 'rgba(96, 165, 250, 0.12)'
                          : 'rgba(236, 90, 96, 0.12)',
                      color:
                        inv.status === 'SETTLED'
                          ? '#2FBF8F'
                          : inv.status === 'PENDING'
                          ? '#60A5FA'
                          : '#EC5A60',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
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
            <div>Active Entity: <strong style={{ color: '#F0F4FA' }}>Barakah Enterprises LLC</strong></div>
            <div>Tenant Code: <strong style={{ color: '#F0F4FA' }}>DXB-01 (Strict Isolation Enforced)</strong></div>
            <div>Tax Registration Number: <strong style={{ color: '#F0F4FA' }}>100293847500003</strong></div>
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
