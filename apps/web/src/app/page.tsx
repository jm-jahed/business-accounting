'use client';

import React, { useState } from 'react';
import {
  Building2,
  Search,
  Calendar,
  User,
  LayoutDashboard,
  BookOpen,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Settings,
  ChevronDown,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCompany] = useState('Barakah Enterprises LLC');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0B1220' }}>
      {/* 240px Sidebar */}
      <aside
        style={{
          width: '240px',
          backgroundColor: '#111A2E',
          borderRight: '1px solid #22304D',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            borderBottom: '1px solid #22304D',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#C9A24B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#0B1220',
              fontSize: '14px',
            }}
          >
            A
          </div>
          <span style={{ fontWeight: 600, fontSize: '15px', color: '#E6EAF2', letterSpacing: '-0.2px' }}>
            Universal Accounting
          </span>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <NavItem
            icon={<BookOpen size={18} />}
            label="General Ledger"
            active={activeTab === 'ledger'}
            onClick={() => setActiveTab('ledger')}
          />
          <NavItem
            icon={<Receipt size={18} />}
            label="Sales & Invoices"
            active={activeTab === 'sales'}
            onClick={() => setActiveTab('sales')}
          />
          <NavItem
            icon={<CreditCard size={18} />}
            label="Bills & Expenses"
            active={activeTab === 'bills'}
            onClick={() => setActiveTab('bills')}
          />
          <NavItem
            icon={<FileSpreadsheet size={18} />}
            label="Financial Reports"
            active={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
          />
          <NavItem
            icon={<Settings size={18} />}
            label="Settings"
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </nav>

        {/* System Status Footer */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #22304D',
            fontSize: '12px',
            color: '#8A97B2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2FBF8F' }} />
            <span>MongoDB Atlas Active</span>
          </div>
          <div style={{ marginTop: '4px', fontSize: '11px', color: '#8A97B2' }}>
            Phase 2A Initialized
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* 56px Top Bar */}
        <header
          style={{
            height: '56px',
            backgroundColor: '#111A2E',
            borderBottom: '1px solid #22304D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
          }}
        >
          {/* Company Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#16223A',
                border: '1px solid #22304D',
                cursor: 'pointer',
              }}
            >
              <Building2 size={16} color="#C9A24B" />
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#E6EAF2' }}>{selectedCompany}</span>
              <ChevronDown size={14} color="#8A97B2" />
            </div>

            {/* Global Search (Ctrl+K) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#16223A',
                border: '1px solid #22304D',
                borderRadius: '8px',
                padding: '6px 12px',
                width: '260px',
              }}
            >
              <Search size={14} color="#8A97B2" />
              <input
                type="text"
                placeholder="Search vouchers, accounts (Ctrl+K)"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#E6EAF2',
                  fontSize: '12px',
                  width: '100%',
                }}
              />
            </div>
          </div>

          {/* Right Header: Date Filter & User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#16223A',
                border: '1px solid #22304D',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#8A97B2',
              }}
            >
              <Calendar size={14} color="#8A97B2" />
              <span>Oct 01, 2026 – Oct 14, 2026</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px',
                borderRadius: '8px',
                backgroundColor: '#16223A',
                border: '1px solid #22304D',
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
                <User size={14} color="#E6EAF2" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#E6EAF2' }}>Jahed (Owner)</span>
            </div>
          </div>
        </header>

        {/* Dashboard Main Workspace */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {/* Header Title & Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#E6EAF2', letterSpacing: '-0.3px' }}>
                Financial Overview
              </h1>
              <p style={{ fontSize: '13px', color: '#8A97B2', marginTop: '2px' }}>
                Fiscal Year 2026-2027 • Double-Entry Ledger Active
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                style={{
                  backgroundColor: '#16223A',
                  color: '#E6EAF2',
                  border: '1px solid #22304D',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Export Reports
              </button>
              <button
                style={{
                  backgroundColor: '#C9A24B',
                  color: '#0B1220',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'background-color 150ms ease',
                }}
              >
                + New Journal Entry
              </button>
            </div>
          </div>

          {/* Compact 4-Card KPI Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <KpiCard
              title="Cash & Bank Accounts"
              amount="AED 428,500.00"
              subtext="+4.2% from last month"
              trend="up"
            />
            <KpiCard
              title="Accounts Receivable (AR)"
              amount="AED 114,280.00"
              subtext="12 invoices awaiting settlement"
              trend="neutral"
            />
            <KpiCard
              title="Accounts Payable (AP)"
              amount="AED 48,920.00"
              subtext="5 bills due this week"
              trend="down"
            />
            <KpiCard
              title="Net Operating Income"
              amount="AED 186,340.00"
              subtext="Fiscal period: 100% balanced"
              trend="gold"
            />
          </div>

          {/* Data Table: Recent Journal Entries */}
          <div
            style={{
              backgroundColor: '#111A2E',
              border: '1px solid #22304D',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            {/* Table Header Controls */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #22304D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#E6EAF2' }}>Recent Journal Entries</h2>
                <p style={{ fontSize: '12px', color: '#8A97B2' }}>
                  Posted double-entry transactions verified with Decimal precision
                </p>
              </div>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#2FBF8F',
                }}
              >
                <CheckCircle2 size={14} />
                <span>Balanced: Debits = Credits</span>
              </span>
            </div>

            {/* Dense Data Table (13px Font) */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#16223A', borderBottom: '1px solid #22304D' }}>
                    <th style={{ textAlign: 'left', padding: '10px 16px', color: '#8A97B2', fontWeight: 500 }}>
                      Voucher No.
                    </th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', color: '#8A97B2', fontWeight: 500 }}>
                      Date
                    </th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', color: '#8A97B2', fontWeight: 500 }}>
                      Description
                    </th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', color: '#8A97B2', fontWeight: 500 }}>
                      Status
                    </th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', color: '#8A97B2', fontWeight: 500 }}>
                      Total Debits (AED)
                    </th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', color: '#8A97B2', fontWeight: 500 }}>
                      Total Credits (AED)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <TableRow
                    voucher="JV-2026-0042"
                    date="2026-10-14"
                    description="Commercial Sales Receipt — Client Invoice #INV-1092"
                    status="POSTED"
                    debit="15,400.00"
                    credit="15,400.00"
                  />
                  <TableRow
                    voucher="JV-2026-0041"
                    date="2026-10-13"
                    description="Office Rent & Facility Utilities Allocation"
                    status="POSTED"
                    debit="8,250.00"
                    credit="8,250.00"
                  />
                  <TableRow
                    voucher="JV-2026-0040"
                    date="2026-10-12"
                    description="Supplier Settlement — Al-Madina Trading Co."
                    status="POSTED"
                    debit="24,600.00"
                    credit="24,600.00"
                  />
                  <TableRow
                    voucher="JV-2026-0039"
                    date="2026-10-11"
                    description="Petty Cash Replenishment & Minor Operating Expenses"
                    status="POSTED"
                    debit="1,200.00"
                    credit="1,200.00"
                  />
                  <TableRow
                    voucher="JV-2026-0038"
                    date="2026-10-10"
                    description="Quarterly VAT Filing & Tax Provision Adjustment"
                    status="POSTED"
                    debit="6,850.00"
                    credit="6,850.00"
                  />
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '9px 12px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: active ? 600 : 500,
        color: active ? '#C9A24B' : '#8A97B2',
        backgroundColor: active ? '#16223A' : 'transparent',
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

function KpiCard({
  title,
  amount,
  subtext,
  trend,
}: {
  title: string;
  amount: string;
  subtext: string;
  trend: 'up' | 'down' | 'neutral' | 'gold';
}) {
  return (
    <div
      style={{
        backgroundColor: '#111A2E',
        border: '1px solid #22304D',
        borderRadius: '10px',
        padding: '16px 20px',
      }}
    >
      <div style={{ fontSize: '12px', color: '#8A97B2', fontWeight: 500, marginBottom: '6px' }}>{title}</div>
      <div
        className="tabular-nums"
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: trend === 'gold' ? '#C9A24B' : '#E6EAF2',
          letterSpacing: '-0.4px',
        }}
      >
        {amount}
      </div>
      <div style={{ fontSize: '11px', color: '#8A97B2', marginTop: '6px' }}>{subtext}</div>
    </div>
  );
}

function TableRow({
  voucher,
  date,
  description,
  status,
  debit,
  credit,
}: {
  voucher: string;
  date: string;
  description: string;
  status: string;
  debit: string;
  credit: string;
}) {
  return (
    <tr
      style={{
        borderBottom: '1px solid #22304D',
        transition: 'background-color 150ms ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#16223A')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <td style={{ padding: '12px 16px', fontWeight: 500, color: '#C9A24B' }}>{voucher}</td>
      <td className="tabular-nums" style={{ padding: '12px 16px', color: '#8A97B2' }}>
        {date}
      </td>
      <td style={{ padding: '12px 16px', color: '#E6EAF2' }}>{description}</td>
      <td style={{ padding: '12px 16px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: 'rgba(47, 191, 143, 0.1)',
            color: '#2FBF8F',
          }}
        >
          {status}
        </span>
      </td>
      <td className="tabular-nums" style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#E6EAF2' }}>
        {debit}
      </td>
      <td className="tabular-nums" style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#E6EAF2' }}>
        {credit}
      </td>
    </tr>
  );
}
