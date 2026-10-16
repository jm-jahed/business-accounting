'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  Calendar,
  HelpCircle,
  RotateCcw,
  CreditCard,
  Hourglass,
  AlertTriangle,
  Percent,
  CalendarDays,
  Truck,
  Plus,
  Receipt,
  RotateCw,
} from 'lucide-react';

export interface AccountsPayableOverviewProps {
  currency?: string;
  onSupplierClick?: (supplierName: string) => void;
  onNewBillClick?: () => void;
}

// 1. Executive AP Data Sets
const AP_AGING_DATA = [
  { name: 'Within Terms', amount: 5.12, fill: '#10B981', label: '5.1M' },
  { name: 'Over Due 0-30 Days', amount: 1.45, fill: '#3B82F6', label: '1.5M' },
  { name: 'Over Due 31-60 Days', amount: 0.82, fill: '#2563EB', label: '0.8M' },
  { name: 'Over Due 61-90 Days', amount: 0.44, fill: '#1D4ED8', label: '0.4M' },
  { name: 'Due Over 90 Days', amount: 0.60, fill: '#1E40AF', label: '0.6M' },
];

const AP_CATEGORY_BREAKUP = [
  { name: 'Raw Materials & Inventory', value: 4.12, percentage: '48.87%', color: '#3B82F6' },
  { name: 'Freight & Logistics', value: 2.15, percentage: '25.50%', color: '#8B5CF6' },
  { name: 'Facilities & Utilities', value: 1.28, percentage: '15.18%', color: '#10B981' },
  { name: 'Cloud & Professional', value: 0.88, percentage: '10.45%', color: '#F59E0B' },
];

const AP_CASH_OUTFLOW_DATA = [
  { month: 'Nov 19', actual: 2.1, estimated: 2.4, forecast: null },
  { month: 'Dec 19', actual: 2.8, estimated: 3.1, forecast: null },
  { month: 'Jan 20', actual: 2.5, estimated: 2.8, forecast: null },
  { month: 'Feb 20', actual: 2.2, estimated: 2.6, forecast: null },
  { month: 'Mar 20', actual: 2.7, estimated: 2.9, forecast: null },
  { month: 'Apr 20', actual: 2.4, estimated: 2.7, forecast: null },
  { month: 'May 20', actual: 3.1, estimated: 3.1, forecast: null },
  { month: 'Jun 20 (F)', actual: null, estimated: null, forecast: 3.8 },
  { month: 'Jul 20 (F)', actual: null, estimated: null, forecast: 3.5 },
  { month: 'Aug 20 (F)', actual: null, estimated: null, forecast: 1.2 },
];

const AP_PURCHASES_TREND_DATA = [
  { month: 'May 19', withinDue: 0.8, overDue: 0.3, purchases: 1.2 },
  { month: 'Jun 19', withinDue: 1.0, overDue: 0.4, purchases: 1.8 },
  { month: 'Jul 19', withinDue: 0.9, overDue: 0.5, purchases: 1.6 },
  { month: 'Aug 19', withinDue: 1.1, overDue: 0.6, purchases: 2.0 },
  { month: 'Sep 19', withinDue: 1.2, overDue: 0.5, purchases: 2.1 },
  { month: 'Oct 19', withinDue: 1.4, overDue: 0.7, purchases: 2.5 },
  { month: 'Nov 19', withinDue: 1.6, overDue: 0.9, purchases: 3.0 },
  { month: 'Dec 19', withinDue: 1.5, overDue: 0.8, purchases: 2.7 },
  { month: 'Jan 20', withinDue: 1.7, overDue: 0.9, purchases: 3.1 },
  { month: 'Feb 20', withinDue: 1.6, overDue: 0.8, purchases: 2.8 },
  { month: 'Mar 20', withinDue: 1.8, overDue: 1.0, purchases: 3.4 },
  { month: 'Apr 20', withinDue: 1.9, overDue: 1.1, purchases: 3.6 },
  { month: 'May 20', withinDue: 2.1, overDue: 1.2, purchases: 4.1 },
];

const SPARKLINE_AP_OVERDUE = [
  { v: 42 }, { v: 45 }, { v: 43 }, { v: 41 }, { v: 44 },
  { v: 42 }, { v: 40 }, { v: 38 }, { v: 41 }, { v: 39 },
  { v: 40 }, { v: 39.2 },
];

const SPARKLINE_DPO = [
  { v: 44 }, { v: 45 }, { v: 46 }, { v: 45 }, { v: 47 },
  { v: 49 }, { v: 48 }, { v: 50 }, { v: 49 }, { v: 47 },
  { v: 48 }, { v: 48 },
];

interface SupplierRow {
  name: string;
  balance: number;
  withinDue: number;
  overDue: number;
  overDuePct: string;
  pendingBills: number;
  earlyDiscount: boolean;
}

const TOP_SUPPLIERS_DATA: SupplierRow[] = [
  { name: 'Gulf Industrial Distributors FZE', balance: 142500, withinDue: 92500, overDue: 50000, overDuePct: '35.1%', pendingBills: 8, earlyDiscount: true },
  { name: 'Al-Farooq Logistics & Freight LLC', balance: 118400, withinDue: 68400, overDue: 50000, overDuePct: '42.2%', pendingBills: 6, earlyDiscount: false },
  { name: 'Emirates Paper & Packaging Works', balance: 98200, withinDue: 38200, overDue: 60000, overDuePct: '61.1%', pendingBills: 5, earlyDiscount: true },
  { name: 'Global Energy & Utilities Authority', balance: 84350, withinDue: 84350, overDue: 0, overDuePct: '0.0%', pendingBills: 3, earlyDiscount: false },
  { name: 'Oracle & Cloud Infrastructure ME', balance: 76500, withinDue: 26500, overDue: 50000, overDuePct: '65.4%', pendingBills: 4, earlyDiscount: false },
  { name: 'Al-Barakah Facilities Management', balance: 54200, withinDue: 14200, overDue: 40000, overDuePct: '73.8%', pendingBills: 4, earlyDiscount: false },
  { name: 'Apex Commercial Equipment FZCO', balance: 42800, withinDue: 0, overDue: 42800, overDuePct: '100.0%', pendingBills: 2, earlyDiscount: false },
];

export function AccountsPayableOverview({
  currency = 'AED',
  onSupplierClick,
  onNewBillClick,
}: AccountsPayableOverviewProps) {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'OVERDUE' | 'DISCOUNT'>('ALL');

  const filteredSuppliers = useMemo(() => {
    if (selectedFilter === 'OVERDUE') {
      return TOP_SUPPLIERS_DATA.filter((s) => parseFloat(s.overDuePct) >= 50);
    }
    if (selectedFilter === 'DISCOUNT') {
      return TOP_SUPPLIERS_DATA.filter((s) => s.earlyDiscount);
    }
    return TOP_SUPPLIERS_DATA;
  }, [selectedFilter]);

  const supplierTotals = useMemo(() => {
    return filteredSuppliers.reduce(
      (acc, curr) => ({
        balance: acc.balance + curr.balance,
        withinDue: acc.withinDue + curr.withinDue,
        overDue: acc.overDue + curr.overDue,
        bills: acc.bills + curr.pendingBills,
      }),
      { balance: 0, withinDue: 0, overDue: 0, bills: 0 }
    );
  }, [filteredSuppliers]);

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
            Accounts Payable & Vendor Expenses
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Corporate Payables Liquidity Analysis • Base Functional Currency: <strong style={{ color: 'var(--gold)' }}>{currency}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--surface-3)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              padding: '6px 12px',
            }}
          >
            <Calendar size={15} style={{ color: 'var(--gold)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              12/1/2019 — 5/30/2020
            </span>
          </div>

          <button
            type="button"
            title="Reset Filters"
            onClick={() => setSelectedFilter('ALL')}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-3)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={15} />
          </button>

          <button
            type="button"
            title="AP Guidelines & Discount Terms"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-3)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <HelpCircle size={15} />
          </button>

          {onNewBillClick && (
            <button
              type="button"
              onClick={onNewBillClick}
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
              <Receipt size={14} />
              <span>Enter Vendor Bill</span>
            </button>
          )}
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
        {/* Metric 1: Total AP Balance */}
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
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
              flexShrink: 0,
            }}
          >
            <CreditCard size={22} />
          </div>
          <div>
            <div
              className="tabular-nums"
              style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}
            >
              8.43M
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
              Total Payables
            </div>
          </div>
        </div>

        {/* Metric 2: Within Terms */}
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
            <Hourglass size={22} />
          </div>
          <div>
            <div
              className="tabular-nums"
              style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', lineHeight: 1.1 }}
            >
              5.12M
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
              Within Terms
            </div>
          </div>
        </div>

        {/* Metric 3: Over Due */}
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
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <div
              className="tabular-nums"
              style={{ fontSize: '22px', fontWeight: 800, color: '#F59E0B', lineHeight: 1.1 }}
            >
              3.31M
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
              Overdue Payables
            </div>
          </div>
        </div>

        {/* Metric 4: Overdue % with Sparkline */}
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
              <Percent size={22} />
            </div>
            <div>
              <div
                className="tabular-nums"
                style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}
              >
                39.2%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                Overdue %
              </div>
            </div>
          </div>

          <div style={{ width: '70px', height: '36px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SPARKLINE_AP_OVERDUE}>
                <Area type="monotone" dataKey="v" stroke="#8B5CF6" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '-2px' }}>
              Overdue T12M
            </div>
          </div>
        </div>

        {/* Metric 5: DPO with Sparkline */}
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
              <CalendarDays size={22} />
            </div>
            <div>
              <div
                className="tabular-nums"
                style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}
              >
                48
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                DPO (Days)
              </div>
            </div>
          </div>

          <div style={{ width: '70px', height: '36px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SPARKLINE_DPO}>
                <Area type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '-2px' }}>
              DPO T12M
            </div>
          </div>
        </div>
      </div>

      {/* 3. Analytics Grid Row 1: Aging Bar + Category Donut + Outflow Forecast */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Chart 1: Age Analysis of Payables Due Balance */}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Age Analysis of Payables Balance
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>M = Millions</span>
          </div>

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={AP_AGING_DATA} margin={{ top: 20, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="var(--text-muted)"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${value}M ${currency}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Bar
                  dataKey="amount"
                  radius={[4, 4, 0, 0]}
                  label={{ position: 'top', fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}
                >
                  {AP_AGING_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Payables Breakup by Category */}
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
              Payables Breakup by Expense Class
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {AP_CATEGORY_BREAKUP.map((r) => (
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
                  data={AP_CATEGORY_BREAKUP}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={(entry: any) => `${entry.percentage || ''}`}
                  labelLine={false}
                >
                  {AP_CATEGORY_BREAKUP.map((entry, index) => (
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
                    fontSize: '12px',
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
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total AP</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>8.43M</div>
            </div>
          </div>
        </div>

        {/* Chart 3: Actual vs Projected Cash Outflow (3M Forecast) */}
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
              Actual vs Estimated Outflow (3M Projection)
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#EF4444' }} />
              <span>Actual Outflow</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#F59E0B' }} />
              <span>Budgeted</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#8B5CF6' }} />
              <span>Projected</span>
            </div>
          </div>

          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={AP_CASH_OUTFLOW_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Bar dataKey="actual" name="Actual Outflow" fill="#EF4444" radius={[2, 2, 0, 0]} />
                <Bar dataKey="estimated" name="Budgeted Outflow" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                <Bar dataKey="forecast" name="Projected Settlements" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Analytics Grid Row 2: Purchases Trend + Top Suppliers Table */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Chart 4: Purchases Trend T13M */}
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
                Vendor Invoicing vs Payables Trend T13M
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Stacked current vs overdue liabilities with gross purchase volume
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#10B981', borderRadius: '2px' }} /> Within Terms
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#3B82F6', borderRadius: '2px' }} /> Overdue
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-primary)' }}>
                <span style={{ width: '8px', height: '2px', backgroundColor: 'var(--text-primary)' }} /> Purchases
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={AP_PURCHASES_TREND_DATA} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}M`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Bar dataKey="withinDue" stackId="a" fill="#10B981" name="Within Terms" />
                <Bar dataKey="overDue" stackId="a" fill="#3B82F6" name="Overdue Payables" radius={[3, 3, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="purchases"
                  stroke="var(--text-primary)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'var(--text-primary)' }}
                  name="Vendor Purchases"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Datatable: Top Suppliers by Outstanding Amount */}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Top Suppliers by Outstanding Balance
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Key vendor accounts and prompt payment discount eligibility
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setSelectedFilter('ALL')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: selectedFilter === 'ALL' ? 'var(--gold)' : 'var(--surface-3)',
                  color: selectedFilter === 'ALL' ? 'var(--bg-canvas)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                  cursor: 'pointer',
                }}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('OVERDUE')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: selectedFilter === 'OVERDUE' ? 'var(--danger)' : 'var(--surface-3)',
                  color: selectedFilter === 'OVERDUE' ? '#FFFFFF' : 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                  cursor: 'pointer',
                }}
              >
                &gt;50%
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('DISCOUNT')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: selectedFilter === 'DISCOUNT' ? '#10B981' : 'var(--surface-3)',
                  color: selectedFilter === 'DISCOUNT' ? '#FFFFFF' : 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                  cursor: 'pointer',
                }}
              >
                ⚡ Discounts
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '260px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-3)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'start' }}>Vendor / Supplier</th>
                  <th style={{ padding: '8px 10px', textAlign: 'end' }}>Balance</th>
                  <th style={{ padding: '8px 10px', textAlign: 'end' }}>Within Terms</th>
                  <th style={{ padding: '8px 10px', textAlign: 'end' }}>Overdue</th>
                  <th style={{ padding: '8px 10px', textAlign: 'end' }}>Overdue %</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Bills</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Early Disc.</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((sup) => (
                  <tr
                    key={sup.name}
                    onClick={() => onSupplierClick?.(sup.name)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '7px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {sup.name}
                    </td>
                    <td className="tabular-nums" style={{ padding: '7px 10px', textAlign: 'end', color: 'var(--text-primary)' }}>
                      {sup.balance.toLocaleString()}
                    </td>
                    <td className="tabular-nums" style={{ padding: '7px 10px', textAlign: 'end', color: 'var(--text-secondary)' }}>
                      {sup.withinDue.toLocaleString()}
                    </td>
                    <td className="tabular-nums" style={{ padding: '7px 10px', textAlign: 'end', fontWeight: 700, color: sup.overDue > 0 ? '#F59E0B' : 'var(--success)' }}>
                      {sup.overDue.toLocaleString()}
                    </td>
                    <td className="tabular-nums" style={{ padding: '7px 10px', textAlign: 'end', color: 'var(--text-primary)' }}>
                      {sup.overDuePct}
                    </td>
                    <td className="tabular-nums" style={{ padding: '7px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {sup.pendingBills}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                      {sup.earlyDiscount ? (
                        <span style={{ color: '#10B981', fontWeight: 700, fontSize: '11px' }}>2% 10 Net 30</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Net 30</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: 'var(--surface-3)', fontWeight: 800, borderTop: '2px solid var(--border-card)' }}>
                  <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>Total</td>
                  <td className="tabular-nums" style={{ padding: '8px 10px', textAlign: 'end', color: 'var(--text-primary)' }}>
                    {supplierTotals.balance.toLocaleString()}
                  </td>
                  <td className="tabular-nums" style={{ padding: '8px 10px', textAlign: 'end', color: 'var(--text-secondary)' }}>
                    {supplierTotals.withinDue.toLocaleString()}
                  </td>
                  <td className="tabular-nums" style={{ padding: '8px 10px', textAlign: 'end', color: '#F59E0B' }}>
                    {supplierTotals.overDue.toLocaleString()}
                  </td>
                  <td className="tabular-nums" style={{ padding: '8px 10px', textAlign: 'end', color: 'var(--text-primary)' }}>
                    39.2%
                  </td>
                  <td className="tabular-nums" style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-primary)' }}>
                    {supplierTotals.bills}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
