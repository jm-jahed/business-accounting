'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
  Calendar,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

// Dynamic Financial Timeseries Demo Sets
const CASH_FLOW_6M = [
  { month: 'Nov', inflow: 142000, outflow: 98000, net: 44000 },
  { month: 'Dec', inflow: 168000, outflow: 112000, net: 56000 },
  { month: 'Jan', inflow: 154000, outflow: 104000, net: 50000 },
  { month: 'Feb', inflow: 189000, outflow: 118000, net: 71000 },
  { month: 'Mar', inflow: 210000, outflow: 132000, net: 78000 },
  { month: 'Apr (MTD)', inflow: 178000, outflow: 95000, net: 83000 },
];

const REVENUE_EXPENSE_QUARTERS = [
  { period: 'Q1 25', revenue: 420000, expense: 295000, profit: 125000 },
  { period: 'Q2 25', revenue: 485000, expense: 330000, profit: 155000 },
  { period: 'Q3 25', revenue: 540000, expense: 360000, profit: 180000 },
  { period: 'Q4 25', revenue: 610000, expense: 390000, profit: 220000 },
  { period: 'Q1 26', revenue: 654000, expense: 412000, profit: 242000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: 'var(--surface-3)',
          border: '1px solid var(--border-card-hover)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          boxShadow: 'var(--shadow-elevated)',
          fontSize: '12px',
          color: 'var(--text-primary)',
          minWidth: '180px',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--gold-hover)' }}>
          {label} Performance
        </div>
        {payload.map((p: any, idx: number) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              margin: '4px 0',
            }}
          >
            <span style={{ color: p.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '2px',
                  backgroundColor: p.color,
                }}
              />
              {p.name}:
            </span>
            <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--text-ivory)' }}>
              AED {p.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function FinancialChartsSection() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'cashflow' | 'revenue'>('cashflow');
  const [timeRange, setTimeRange] = useState<'6M' | 'YTD' | '1Y'>('6M');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          height: '320px',
          backgroundColor: 'var(--surface-2)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
          marginBottom: '24px',
        }}
      >
        Loading dynamic financial intelligence...
      </div>
    );
  }

  return (
    <Card className="erp-card-interactive" style={{ marginBottom: '24px' }}>
      <CardHeader
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--gold-dim)',
              border: '1px solid rgba(201, 162, 75, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
            }}
          >
            <TrendingUp size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CardTitle>Financial Cash Flow & Operating Velocity</CardTitle>
              <Badge variant="gold" size="xs" dot>
                Live Analytics
              </Badge>
            </div>
            <CardDescription>
              Double-entry operating inflows vs verified statutory expenditures (AED)
            </CardDescription>
          </div>
        </div>

        {/* View Toggle Tabs & Time Range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Chart Mode Segmented Selector */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--surface-3)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
              border: '1px solid var(--border-strong)',
            }}
          >
            <button
              onClick={() => setActiveTab('cashflow')}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: activeTab === 'cashflow' ? 'var(--gold)' : 'transparent',
                color: activeTab === 'cashflow' ? '#070B14' : 'var(--text-secondary)',
                transition: 'all var(--duration-fast) ease',
              }}
            >
              Cash Flow
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: activeTab === 'revenue' ? 'var(--gold)' : 'transparent',
                color: activeTab === 'revenue' ? '#070B14' : 'var(--text-secondary)',
                transition: 'all var(--duration-fast) ease',
              }}
            >
              Revenue / Expense
            </button>
          </div>

          {/* Time Range Selector */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--surface-3)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
              border: '1px solid var(--border-strong)',
            }}
          >
            {(['6M', 'YTD', '1Y'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: timeRange === r ? 'var(--surface-hover)' : 'transparent',
                  color: timeRange === r ? 'var(--gold-hover)' : 'var(--text-muted)',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent style={{ padding: '20px 24px 16px' }}>
        {/* Top Metric Strip for Chart */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Period Net Inflow
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '2px',
              }}
            >
              <span>+ AED 83,000.00</span>
              <ArrowUpRight size={16} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              +18.4% vs previous 30 days
            </span>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Operating Cash Ratio
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text-ivory)',
                marginTop: '2px',
              }}
            >
              1.87x
            </div>
            <span style={{ fontSize: '11px', color: 'var(--success)' }}>
              Strong Liquidity Coverage
            </span>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Average Monthly Burn
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--gold-hover)',
                marginTop: '2px',
              }}
            >
              AED 109,833.00
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Operating runway: 14.2 months
            </span>
          </div>
        </div>

        {/* Dynamic Chart Container */}
        <div style={{ width: '100%', height: '260px' }}>
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'cashflow' ? (
              <AreaChart data={CASH_FLOW_6M} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="inflow"
                  name="Operating Inflow"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#inflowGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="outflow"
                  name="Operating Outflow"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#outflowGrad)"
                />
              </AreaChart>
            ) : (
              <BarChart data={REVENUE_EXPENSE_QUARTERS} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="revenue"
                  name="Recognized Revenue"
                  fill="#C9A24B"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name="Operating Expense"
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ArAgingBucketsWidget() {
  const buckets = [
    { label: '0–30 Days (Current)', amount: '142,500.00', pct: '68%', color: '#10B981', count: 14 },
    { label: '31–60 Days', amount: '42,000.00', pct: '20%', color: '#38BDF8', count: 5 },
    { label: '61–90 Days', amount: '18,500.00', pct: '9%', color: '#F59E0B', count: 2 },
    { label: '90+ Days (Overdue)', amount: '6,200.00', pct: '3%', color: '#EF4444', count: 1 },
  ];

  return (
    <Card className="erp-card-interactive" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <CardHeader
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--gold-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold)',
              }}
            >
              <Clock size={16} />
            </div>
            <div>
              <CardTitle style={{ fontSize: '14px' }}>AR Aging & Liquidity Buckets</CardTitle>
              <CardDescription style={{ fontSize: '11px' }}>
                Weighted collection maturity profile (AED)
              </CardDescription>
            </div>
          </div>
          <Badge variant="gold" size="xs">
            DSO: 28 Days
          </Badge>
        </CardHeader>

        <CardContent style={{ padding: '16px 20px' }}>
          {/* Total Sum Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Receivables:</span>
            <span
              className="tabular-nums"
              style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-ivory)' }}
            >
              AED 209,200.00
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div
            style={{
              display: 'flex',
              height: '8px',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              backgroundColor: 'var(--surface-3)',
              marginBottom: '16px',
              gap: '2px',
            }}
          >
            {buckets.map((b, i) => (
              <div
                key={i}
                style={{
                  width: b.pct,
                  backgroundColor: b.color,
                  transition: 'width var(--duration-normal) ease',
                }}
                title={`${b.label}: AED ${b.amount} (${b.pct})`}
              />
            ))}
          </div>

          {/* Grid of Buckets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {buckets.map((b, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--surface-3)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'border-color var(--duration-fast) ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: b.color,
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{b.label.split(' ')[0]}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{b.count} inv</span>
                </div>
                <div
                  className="tabular-nums"
                  style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}
                >
                  AED {b.amount}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </div>

      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--success)' }}>
          <CheckCircle2 size={12} />
          <span>97% Collected on Time</span>
        </span>
        <span>Target: &lt; 30d</span>
      </div>
    </Card>
  );
}
