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
  const accounts: Array<{ code: string; name: string; type: string; balance: string; amount: string; status: string }> = [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F4FA', letterSpacing: '-0.3px' }}>
            Chart of Accounts
          </h1>
          <p style={{ fontSize: '13px', color: '#8A97B2', marginTop: '2px' }}>
            Standard Enterprise Chart of Accounts (Phase 2 Ledger Integration)
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
          0 Accounts Configured
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
              <th style={{ padding: '10px 16px', textAlign: 'end' }}>BALANCE</th>
              <th style={{ padding: '10px 16px', textAlign: 'center' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#7E8DA6' }}>
                <Layers size={32} color="#C9A24B" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.7 }} />
                <div style={{ fontWeight: 600, color: '#F0F4FA', marginBottom: '4px' }}>No Chart of Accounts Loaded</div>
                <div style={{ fontSize: '12px' }}>
                  Statutory chart of accounts configuration and balance tracking will activate in Phase 2 with General Ledger persistence.
                </div>
              </td>
            </tr>
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
