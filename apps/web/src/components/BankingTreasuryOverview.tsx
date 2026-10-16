'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Landmark,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  RefreshCw,
  Plus,
  ArrowRightLeft,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';

export interface BankingTreasuryOverviewProps {
  currency?: string;
  onTransferClick?: () => void;
  onConnectBankClick?: () => void;
}

const CASH_FLOW_TREND_6M = [
  { month: 'Nov 19', inflow: 3.0, outflow: 2.1, net: 0.9 },
  { month: 'Dec 19', inflow: 4.0, outflow: 2.8, net: 1.2 },
  { month: 'Jan 20', inflow: 4.1, outflow: 2.5, net: 1.6 },
  { month: 'Feb 20', inflow: 3.5, outflow: 2.2, net: 1.3 },
  { month: 'Mar 20', inflow: 4.0, outflow: 2.7, net: 1.3 },
  { month: 'Apr 20', inflow: 3.9, outflow: 2.4, net: 1.5 },
  { month: 'May 20', inflow: 4.6, outflow: 3.1, net: 1.5 },
];

const LIQUIDITY_DISTRIBUTION = [
  { name: 'Emirates NBD (Operating)', value: 6.24, percentage: '48.56%', color: '#3B82F6' },
  { name: 'ADCB (Commercial)', value: 3.16, percentage: '24.59%', color: '#10B981' },
  { name: 'Standard Chartered (USD)', value: 2.39, percentage: '18.60%', color: '#8B5CF6' },
  { name: 'Central Vault & Cash', value: 1.06, percentage: '8.25%', color: '#F59E0B' },
];

const SPARKLINE_RUNWAY = [
  { v: 11.2 }, { v: 11.8 }, { v: 12.4 }, { v: 12.9 }, { v: 13.5 },
  { v: 13.8 }, { v: 14.0 }, { v: 14.1 }, { v: 13.9 }, { v: 14.3 },
  { v: 14.1 }, { v: 14.2 },
];

const SPARKLINE_NET_FLOW = [
  { v: 45 }, { v: 52 }, { v: 58 }, { v: 64 }, { v: 71 },
  { v: 68 }, { v: 75 }, { v: 79 }, { v: 82 }, { v: 80 },
  { v: 84 }, { v: 83 },
];

interface BankAccountCard {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  currency: string;
  balance: string;
  convertedBalance?: string;
  lastReconciled: string;
  status: 'RECONCILED' | 'PENDING_FEED' | 'VAULT_VERIFIED';
}

const BANK_ACCOUNTS: BankAccountCard[] = [
  {
    id: 'b1',
    bankName: 'Emirates NBD Corporate Treasury',
    accountType: 'Primary Corporate Operating Account',
    accountNumber: 'AE07 0331 0000 0012 3456 789',
    currency: 'AED',
    balance: '6,240,000.00',
    lastReconciled: 'Today at 08:30 AM',
    status: 'RECONCILED',
  },
  {
    id: 'b2',
    bankName: 'Abu Dhabi Commercial Bank (ADCB)',
    accountType: 'Secondary Commercial Settlement Register',
    accountNumber: 'AE44 0030 0000 0098 7654 321',
    currency: 'AED',
    balance: '3,160,000.00',
    lastReconciled: 'Today at 07:15 AM',
    status: 'RECONCILED',
  },
  {
    id: 'b3',
    bankName: 'Standard Chartered Trade Treasury',
    accountType: 'Multi-Currency Foreign Trade Clearing',
    accountNumber: 'AE82 0210 0000 0044 1122 334',
    currency: 'USD',
    balance: '$ 650,000.00',
    convertedBalance: 'AED 2,387,450.00',
    lastReconciled: 'Yesterday at 05:00 PM',
    status: 'RECONCILED',
  },
  {
    id: 'b4',
    bankName: 'Central Enterprise Cash Vault',
    accountType: 'Secured Store Cash & Physical Vault Registers',
    accountNumber: 'REG-VAULT-001 (Physical Ledger)',
    currency: 'AED',
    balance: '1,062,550.00',
    lastReconciled: 'Today at 09:00 AM (Physical Audit)',
    status: 'VAULT_VERIFIED',
  },
];

const RECENT_TRANSACTIONS = [
  { id: 'tx-1', date: '2026-04-12', desc: 'Wholesale sales settlement from Al-Barakah Hypermarket', ref: 'EFT-788912', acct: 'Emirates NBD', dr: '52,500.00', cr: '—', status: 'CLEARED' },
  { id: 'tx-2', date: '2026-04-11', desc: 'Vendor inventory settlement to Gulf Distributors FZE', ref: 'BTR-990142', acct: 'ADCB Commercial', dr: '—', cr: '31,500.00', status: 'CLEARED' },
  { id: 'tx-3', date: '2026-04-10', desc: 'Corporate treasury inter-account liquidity rebalance', ref: 'TX-INT-0082', acct: 'Emirates NBD → ADCB', dr: '150,000.00', cr: '150,000.00', status: 'TRANSFERRED' },
  { id: 'tx-4', date: '2026-04-09', desc: 'Physical cash register deposit to primary vault', ref: 'CSH-DEP-044', acct: 'Vault Register', dr: '24,500.00', cr: '—', status: 'AUDITED' },
  { id: 'tx-5', date: '2026-04-08', desc: 'Utility and facility energy settlement (DEWA / SEWA)', ref: 'AUTOPAY-11', acct: 'Emirates NBD', dr: '—', cr: '12,450.00', status: 'CLEARED' },
];

export function BankingTreasuryOverview({
  currency = 'AED',
  onTransferClick,
  onConnectBankClick,
}: BankingTreasuryOverviewProps) {
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
            Cash & Corporate Treasury Overview
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Multi-Bank Reconciliation, Operating Liquidity & Vault Reserves • Base Functional Currency: <strong style={{ color: 'var(--gold)' }}>{currency}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onTransferClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--surface-3)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ArrowRightLeft size={14} style={{ color: 'var(--gold)' }} />
            <span>Inter-Account Transfer</span>
          </button>

          <button
            type="button"
            onClick={onConnectBankClick}
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
            <Landmark size={14} />
            <span>Connect Financial Institution</span>
          </button>
        </div>
      </div>

      {/* 2. Top 5-Card Metric Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Metric 1: Total Liquidity */}
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
            <Wallet size={22} />
          </div>
          <div>
            <div
              className="tabular-nums"
              style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}
            >
              12.85M
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
              Total Liquidity Buffer
            </div>
          </div>
        </div>

        {/* Metric 2: Operating Bank Balances */}
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
            <Landmark size={22} />
          </div>
          <div>
            <div
              className="tabular-nums"
              style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', lineHeight: 1.1 }}
            >
              9.40M
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
              Operating Accounts
            </div>
          </div>
        </div>

        {/* Metric 3: Vault Reserves */}
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
            <ShieldCheck size={22} />
          </div>
          <div>
            <div
              className="tabular-nums"
              style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gold)', lineHeight: 1.1 }}
            >
              3.45M
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
              Vault & Trade Clearing
            </div>
          </div>
        </div>

        {/* Metric 4: Corporate Runway */}
        <div
          style={{
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              <TrendingUp size={22} />
            </div>
            <div>
              <div
                className="tabular-nums"
                style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}
              >
                14.2 Mo
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                Cash Runway
              </div>
            </div>
          </div>

          <div style={{ width: '70px', height: '36px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SPARKLINE_RUNWAY}>
                <Area type="monotone" dataKey="v" stroke="#8B5CF6" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '-2px' }}>
              Runway T12M
            </div>
          </div>
        </div>

        {/* Metric 5: Net Monthly Cash Inflow */}
        <div
          style={{
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              <ArrowUpRight size={22} />
            </div>
            <div>
              <div
                className="tabular-nums"
                style={{ fontSize: '20px', fontWeight: 800, color: '#10B981', lineHeight: 1.1 }}
              >
                +83.0K
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                Net Monthly Inflow
              </div>
            </div>
          </div>

          <div style={{ width: '70px', height: '36px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SPARKLINE_NET_FLOW}>
                <Area type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '-2px' }}>
              Flow T12M
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bank Account & Vault Register Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {BANK_ACCOUNTS.map((acct) => (
          <div
            key={acct.id}
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: acct.status === 'RECONCILED' ? 'var(--success)' : 'var(--gold)',
                    backgroundColor: acct.status === 'RECONCILED' ? 'var(--success-dim)' : 'var(--gold-dim)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${acct.status === 'RECONCILED' ? 'var(--success-border)' : 'var(--gold-border)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={11} />
                  <span>{acct.status}</span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{acct.currency}</span>
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {acct.bankName}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                {acct.accountType}
              </p>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '6px' }}>
                {acct.accountNumber}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Live Reconciled Balance</div>
              <div
                className="tabular-nums"
                style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginTop: '2px' }}
              >
                {acct.currency} {acct.balance}
              </div>
              {acct.convertedBalance && (
                <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 600, marginTop: '2px' }}>
                  ≈ {acct.convertedBalance}
                </div>
              )}
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Reconciled: {acct.lastReconciled}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Analytics: Inflow/Outflow Trajectory + Liquidity Donut */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Chart 1: Cash Inflow vs Outflow Trajectory */}
        <div
          style={{
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Operating Inflow vs Outflow Trajectory
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Monthly cash receipts and supplier disbursements in millions (M)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#10B981', borderRadius: '2px' }} /> Inflow
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#EF4444', borderRadius: '2px' }} /> Outflow
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CASH_FLOW_TREND_6M} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bankInflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="bankOutflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}M`} />
                <Tooltip
                  formatter={(v: any) => [`${v}M ${currency}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Area type="monotone" dataKey="inflow" name="Inflow" stroke="#10B981" strokeWidth={2.5} fill="url(#bankInflow)" />
                <Area type="monotone" dataKey="outflow" name="Outflow" stroke="#EF4444" strokeWidth={2} fill="url(#bankOutflow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Liquidity Allocation Donut */}
        <div
          style={{
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Treasury Liquidity Allocation
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {LIQUIDITY_DISTRIBUTION.map((r) => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: r.color }} />
                <span>{r.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>

          <div style={{ width: '100%', height: '200px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={LIQUIDITY_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={(entry: any) => `${entry.percentage || ''}`}
                  labelLine={false}
                >
                  {LIQUIDITY_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${val}M ${currency} (${item.payload.percentage})`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Buffer</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>12.85M</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent Treasury Movements Table */}
      <div
        style={{
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border-card)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Recent Treasury Movements & Clearing Audit Trail
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Direct bank feed settlements, automated EFT clearings, and vault transfers
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-3)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '8px 10px', textAlign: 'start' }}>DATE</th>
                <th style={{ padding: '8px 10px', textAlign: 'start' }}>REFERENCE</th>
                <th style={{ padding: '8px 10px', textAlign: 'start' }}>DESCRIPTION & COUNTERPARTY</th>
                <th style={{ padding: '8px 10px', textAlign: 'start' }}>INSTRUMENT / ACCOUNT</th>
                <th style={{ padding: '8px 10px', textAlign: 'end' }}>INFLOW (DR)</th>
                <th style={{ padding: '8px 10px', textAlign: 'end' }}>OUTFLOW (CR)</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>CLEARING STATUS</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_TRANSACTIONS.map((tx) => (
                <tr
                  key={tx.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{tx.date}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 600, backgroundColor: 'var(--gold-dim)', padding: '2px 6px', borderRadius: '4px' }}>
                      {tx.ref}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>{tx.desc}</td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{tx.acct}</td>
                  <td className="tabular-nums" style={{ padding: '8px 10px', textAlign: 'end', fontWeight: 700, color: tx.dr !== '—' ? 'var(--success)' : 'var(--text-muted)' }}>
                    {tx.dr}
                  </td>
                  <td className="tabular-nums" style={{ padding: '8px 10px', textAlign: 'end', fontWeight: 700, color: tx.cr !== '—' ? '#EF4444' : 'var(--text-muted)' }}>
                    {tx.cr}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: 'var(--success-dim)',
                        color: 'var(--success)',
                        border: '1px solid var(--success-border)',
                      }}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
