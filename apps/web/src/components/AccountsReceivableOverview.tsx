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
  Coins,
  Hourglass,
  AlertTriangle,
  Percent,
  CalendarDays,
  Flag,
  ArrowUpRight,
  TrendingDown,
  Filter,
  Download,
  Users,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

export interface AccountsReceivableOverviewProps {
  currency?: string;
  onCustomerClick?: (customerName: string) => void;
  onNewInvoiceClick?: () => void;
}

// 1. Data Sets Matching the Executive Architecture
const AGING_ANALYSIS_DATA = [
  { name: 'Within Due Days', amount: 6.72, fill: '#10B981', label: '6.7M' },
  { name: 'Over Due 0-30 Days', amount: 2.24, fill: '#3B82F6', label: '2.2M' },
  { name: 'Over Due 31-60 Days', amount: 1.12, fill: '#2563EB', label: '1.1M' },
  { name: 'Over Due 61-90 Days', amount: 0.84, fill: '#1D4ED8', label: '0.8M' },
  { name: 'Due Over 90 Days', amount: 4.16, fill: '#1E40AF', label: '4.1M' },
];

const REGIONAL_BREAKUP_DATA = [
  { name: 'Europe (GCC & MENA)', value: 3.42, percentage: '41.86%', color: '#3B82F6' },
  { name: 'Pacific (APAC)', value: 2.66, percentage: '32.58%', color: '#8B5CF6' },
  { name: 'North America', value: 2.08, percentage: '25.55%', color: '#10B981' },
];

const CASH_INFLOW_FORECAST_DATA = [
  { month: 'Nov 19', actual: 3.0, estimated: 3.5, forecast: null },
  { month: 'Dec 19', actual: 4.0, estimated: 5.0, forecast: null },
  { month: 'Jan 20', actual: 4.1, estimated: 4.6, forecast: null },
  { month: 'Feb 20', actual: 3.5, estimated: 4.6, forecast: null },
  { month: 'Mar 20', actual: 4.0, estimated: 4.6, forecast: null },
  { month: 'Apr 20', actual: 3.9, estimated: 4.9, forecast: null },
  { month: 'May 20', actual: 4.6, estimated: 4.6, forecast: null },
  { month: 'Jun 20 (F)', actual: null, estimated: null, forecast: 6.1 },
  { month: 'Jul 20 (F)', actual: null, estimated: null, forecast: 6.0 },
  { month: 'Aug 20 (F)', actual: null, estimated: null, forecast: 1.4 },
];

const CREDIT_SALES_TREND_DATA = [
  { month: 'May 19', withinDue: 1.1, overDue: 0.5, creditSales: 1.8 },
  { month: 'Jun 19', withinDue: 1.4, overDue: 0.8, creditSales: 2.9 },
  { month: 'Jul 19', withinDue: 1.3, overDue: 0.9, creditSales: 2.6 },
  { month: 'Aug 19', withinDue: 1.6, overDue: 1.1, creditSales: 3.2 },
  { month: 'Sep 19', withinDue: 1.7, overDue: 1.0, creditSales: 3.2 },
  { month: 'Oct 19', withinDue: 1.9, overDue: 1.4, creditSales: 4.0 },
  { month: 'Nov 19', withinDue: 2.3, overDue: 1.8, creditSales: 5.0 },
  { month: 'Dec 19', withinDue: 2.0, overDue: 1.6, creditSales: 4.4 },
  { month: 'Jan 20', withinDue: 2.2, overDue: 1.9, creditSales: 4.9 },
  { month: 'Feb 20', withinDue: 2.1, overDue: 1.7, creditSales: 4.3 },
  { month: 'Mar 20', withinDue: 2.4, overDue: 2.1, creditSales: 5.3 },
  { month: 'Apr 20', withinDue: 2.5, overDue: 2.3, creditSales: 5.6 },
  { month: 'May 20', withinDue: 2.8, overDue: 2.7, creditSales: 6.3 },
];

const SPARKLINE_OVERDUE = [
  { v: 48 }, { v: 51 }, { v: 49 }, { v: 53 }, { v: 52 },
  { v: 55 }, { v: 54 }, { v: 52 }, { v: 56 }, { v: 53 },
  { v: 55 }, { v: 54.8 },
];

const SPARKLINE_DSO = [
  { v: 54 }, { v: 56 }, { v: 55 }, { v: 58 }, { v: 57 },
  { v: 59 }, { v: 62 }, { v: 61 }, { v: 63 }, { v: 59 },
  { v: 61 }, { v: 60 },
];

interface CustomerRow {
  name: string;
  balance: number;
  withinDue: number;
  overDue: number;
  overDuePct: string;
  dueInvoices: number;
  aboveCreditLimit: boolean;
}

const TOP_CUSTOMERS_DATA: CustomerRow[] = [
  { name: 'Paula Moreno', balance: 184582, withinDue: 58145, overDue: 126437, overDuePct: '68.5%', dueInvoices: 13, aboveCreditLimit: false },
  { name: 'Nuan Zheng', balance: 166370, withinDue: 51448, overDue: 114922, overDuePct: '69.1%', dueInvoices: 12, aboveCreditLimit: true },
  { name: 'Kristi Alvarez', balance: 138425, withinDue: 26782, overDue: 111643, overDuePct: '80.7%', dueInvoices: 14, aboveCreditLimit: false },
  { name: 'Preston Gonzalez', balance: 107469, withinDue: 3108, overDue: 104362, overDuePct: '97.1%', dueInvoices: 12, aboveCreditLimit: false },
  { name: 'Daisy Blanco', balance: 129330, withinDue: 33686, overDue: 95644, overDuePct: '74.0%', dueInvoices: 11, aboveCreditLimit: false },
  { name: 'Renee Carlson', balance: 86619, withinDue: 0, overDue: 86619, overDuePct: '100.0%', dueInvoices: 10, aboveCreditLimit: false },
  { name: 'Eugene Zhu', balance: 84952, withinDue: 0, overDue: 84952, overDuePct: '100.0%', dueInvoices: 10, aboveCreditLimit: false },
];

export function AccountsReceivableOverview({
  currency = 'AED',
  onCustomerClick,
  onNewInvoiceClick,
}: AccountsReceivableOverviewProps) {
  const [dateRange, setDateRange] = useState({ start: '2019-12-01', end: '2020-05-30' });
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'OVERDUE' | 'LIMIT'>('ALL');

  const filteredCustomers = useMemo(() => {
    if (selectedFilter === 'OVERDUE') {
      return TOP_CUSTOMERS_DATA.filter((c) => parseFloat(c.overDuePct) >= 80);
    }
    if (selectedFilter === 'LIMIT') {
      return TOP_CUSTOMERS_DATA.filter((c) => c.aboveCreditLimit);
    }
    return TOP_CUSTOMERS_DATA;
  }, [selectedFilter]);

  const customerTotals = useMemo(() => {
    return filteredCustomers.reduce(
      (acc, curr) => ({
        balance: acc.balance + curr.balance,
        withinDue: acc.withinDue + curr.withinDue,
        overDue: acc.overDue + curr.overDue,
        invoices: acc.invoices + curr.dueInvoices,
      }),
      { balance: 0, withinDue: 0, overDue: 0, invoices: 0 }
    );
  }, [filteredCustomers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* 1. Executive Title & Date Control Ribbon */}
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
            Accounts Receivable Overview
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            As of Date: Saturday 30, May 2020 • Base Functional Currency: <strong style={{ color: 'var(--gold)' }}>{currency}</strong>
          </p>
        </div>

        {/* Date Selector & Action Controls */}
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
            title="Accounting Guidelines & Formula Explanations"
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

          {onNewInvoiceClick && (
            <button
              type="button"
              onClick={onNewInvoiceClick}
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
              <span>New Sales Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top 5-Card Executive Metric Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Metric 1: Total Balance */}
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
            <Coins size={22} />
          </div>
          <div>
            <div
              className="tabular-nums"
              style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}
            >
              14.89M
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
              Total Balance
            </div>
          </div>
        </div>

        {/* Metric 2: Within Due */}
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
              6.72M
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
              Within Due
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
              8.16M
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
              Over Due
            </div>
          </div>
        </div>

        {/* Metric 4: Over Due % with Sparkline */}
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
                54.8%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                Over Due %
              </div>
            </div>
          </div>

          <div style={{ width: '70px', height: '36px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SPARKLINE_OVERDUE}>
                <Area type="monotone" dataKey="v" stroke="#3B82F6" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '-2px' }}>
              Over Due % T12M
            </div>
          </div>
        </div>

        {/* Metric 5: DSO with Sparkline */}
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
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
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
                60
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                DSO (Days)
              </div>
            </div>
          </div>

          <div style={{ width: '70px', height: '36px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SPARKLINE_DSO}>
                <Area type="monotone" dataKey="v" stroke="#60A5FA" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '-2px' }}>
              DSO T12M
            </div>
          </div>
        </div>
      </div>

      {/* 3. Analytics Grid Row 1: Aging Bar + Regional Donut + Inflow Forecast */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Chart 1: Age Analysis of Due Balance */}
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
              Age Analysis of Due Balance
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>M = Millions</span>
          </div>

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={AGING_ANALYSIS_DATA} margin={{ top: 20, right: 10, left: -20, bottom: 25 }}>
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
                  {AGING_ANALYSIS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Over Due Breakup by Region / Segment */}
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
              Over Due Breakup by Region
            </h3>
          </div>

          {/* Regional Legend */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '8px' }}>
            {REGIONAL_BREAKUP_DATA.map((r) => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: r.color }} />
                <span>{r.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>

          <div style={{ width: '100%', height: '200px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={REGIONAL_BREAKUP_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={(entry: any) => `${entry.percentage || ''}`}
                  labelLine={false}
                >
                  {REGIONAL_BREAKUP_DATA.map((entry, index) => (
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
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overdue Total</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>8.16M</div>
            </div>
          </div>
        </div>

        {/* Chart 3: Actual vs Estimated Cash Inflow with 3-Month Forecast */}
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
              Actual vs Estimated Inflow (3M Forecast)
            </h3>
          </div>

          {/* Series Legend */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#2563EB' }} />
              <span>Actual</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#10B981' }} />
              <span>Estimated</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#A78BFA' }} />
              <span>Forecast</span>
            </div>
          </div>

          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CASH_INFLOW_FORECAST_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Bar dataKey="actual" name="Actual Receipts" fill="#2563EB" radius={[2, 2, 0, 0]} />
                <Bar dataKey="estimated" name="Estimated Receipts" fill="#10B981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="forecast" name="Forecasted Receipts" fill="#A78BFA" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Analytics Grid Row 2: Combo Trend Chart + Top 10 Overdue Customers Table */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Chart 4: Credit Sales vs Balance Due Trend T13M (Combo Stacked Bar + Line) */}
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
                Credit Sales vs Balance Due Trend T13M
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Stacked overdue vs current debt with rolling sales trendline
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#10B981', borderRadius: '2px' }} /> Within Due
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#3B82F6', borderRadius: '2px' }} /> Over Due
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-primary)' }}>
                <span style={{ width: '8px', height: '2px', backgroundColor: 'var(--text-primary)' }} /> Credit Sales
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={CREDIT_SALES_TREND_DATA} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
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
                <Bar dataKey="withinDue" stackId="a" fill="#10B981" name="Within Due" />
                <Bar dataKey="overDue" stackId="a" fill="#3B82F6" name="Over Due" radius={[3, 3, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="creditSales"
                  stroke="var(--text-primary)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'var(--text-primary)' }}
                  name="Credit Sales"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Datatable: Top 10 Customers by Over Due Amount */}
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
                Top Customers by Over Due Amount
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Direct exposure accounts requiring credit settlement action
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
                &gt;80%
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('LIMIT')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: selectedFilter === 'LIMIT' ? '#DC2626' : 'var(--surface-3)',
                  color: selectedFilter === 'LIMIT' ? '#FFFFFF' : 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                  cursor: 'pointer',
                }}
              >
                🚩 Limit
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '260px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-3)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'start' }}>Customer</th>
                  <th style={{ padding: '8px 10px', textAlign: 'end' }}>Balance</th>
                  <th style={{ padding: '8px 10px', textAlign: 'end' }}>Within Due</th>
                  <th style={{ padding: '8px 10px', textAlign: 'end' }}>Over Due</th>
                  <th style={{ padding: '8px 10px', textAlign: 'end' }}>Over Due %</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Due Invoices</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Above Limit</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.name}
                    onClick={() => onCustomerClick?.(cust.name)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '7px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {cust.name}
                    </td>
                    <td className="tabular-nums" style={{ padding: '7px 10px', textAlign: 'end', color: 'var(--text-primary)' }}>
                      {cust.balance.toLocaleString()}
                    </td>
                    <td className="tabular-nums" style={{ padding: '7px 10px', textAlign: 'end', color: 'var(--text-secondary)' }}>
                      {cust.withinDue.toLocaleString()}
                    </td>
                    <td className="tabular-nums" style={{ padding: '7px 10px', textAlign: 'end', fontWeight: 700, color: '#F59E0B' }}>
                      {cust.overDue.toLocaleString()}
                    </td>
                    <td className="tabular-nums" style={{ padding: '7px 10px', textAlign: 'end', color: 'var(--text-primary)' }}>
                      {cust.overDuePct}
                    </td>
                    <td className="tabular-nums" style={{ padding: '7px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {cust.dueInvoices}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                      {cust.aboveCreditLimit ? (
                        <Flag size={13} color="#EF4444" style={{ display: 'inline-block' }} />
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: 'var(--surface-3)', fontWeight: 800, borderTop: '2px solid var(--border-card)' }}>
                  <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>Total</td>
                  <td className="tabular-nums" style={{ padding: '8px 10px', textAlign: 'end', color: 'var(--text-primary)' }}>
                    {customerTotals.balance.toLocaleString()}
                  </td>
                  <td className="tabular-nums" style={{ padding: '8px 10px', textAlign: 'end', color: 'var(--text-secondary)' }}>
                    {customerTotals.withinDue.toLocaleString()}
                  </td>
                  <td className="tabular-nums" style={{ padding: '8px 10px', textAlign: 'end', color: '#F59E0B' }}>
                    {customerTotals.overDue.toLocaleString()}
                  </td>
                  <td className="tabular-nums" style={{ padding: '8px 10px', textAlign: 'end', color: 'var(--text-primary)' }}>
                    73.2%
                  </td>
                  <td className="tabular-nums" style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-primary)' }}>
                    {customerTotals.invoices}
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
