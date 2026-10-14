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
import { TrendingUp, BarChart3, Clock, AlertCircle } from 'lucide-react';

const cashFlowData = [
  { month: 'May', inflow: 142000, outflow: 98000 },
  { month: 'Jun', inflow: 168000, outflow: 112000 },
  { month: 'Jul', inflow: 155000, outflow: 105000 },
  { month: 'Aug', inflow: 189000, outflow: 124000 },
  { month: 'Sep', inflow: 174000, outflow: 119000 },
  { month: 'Oct', inflow: 215000, outflow: 138000 },
];

const incomeExpenseData = [
  { period: 'Q1', revenue: 480000, expense: 310000 },
  { period: 'Q2', revenue: 520000, expense: 340000 },
  { period: 'Q3', revenue: 590000, expense: 385000 },
  { period: 'Q4 (Est)', revenue: 640000, expense: 410000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: '#111A2E',
          border: '1px solid #22304D',
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          fontSize: '12px',
          color: '#F0F4FA',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: '6px', color: '#DFBF6E' }}>{label}</div>
        {payload.map((p: any, idx: number) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              margin: '3px 0',
            }}
          >
            <span style={{ color: p.color, display: 'flex', alignItems: 'center', gap: '5px' }}>
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
            <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          height: '280px',
          backgroundColor: '#111A2E',
          border: '1px solid #1D2A44',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#7E8DA6',
          fontSize: '13px',
          marginBottom: '24px',
        }}
      >
        Loading financial analytics...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}
    >
      {/* 1. Cash Flow Spline Area Chart */}
      <div
        style={{
          backgroundColor: '#111A2E',
          border: '1px solid #1D2A44',
          borderRadius: '12px',
          padding: '18px 20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
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
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'rgba(47, 191, 143, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2FBF8F',
              }}
            >
              <TrendingUp size={15} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F4FA' }}>
                Cash Flow Dynamics
              </div>
              <div style={{ fontSize: '11px', color: '#7E8DA6' }}>
                Monthly Inflows vs Operating Outflows (AED)
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: '11px',
              backgroundColor: 'rgba(201, 162, 75, 0.12)',
              color: '#DFBF6E',
              border: '1px solid rgba(201, 162, 75, 0.3)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontWeight: 600,
            }}
          >
            Sample Trend
          </span>
        </div>

        <div style={{ width: '100%', height: '220px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2FBF8F" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2FBF8F" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EC5A60" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#EC5A60" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1D2A44" vertical={false} />
              <XAxis dataKey="month" stroke="#7E8DA6" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#7E8DA6"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="inflow"
                name="Cash Inflow"
                stroke="#2FBF8F"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#inflowGrad)"
              />
              <Area
                type="monotone"
                dataKey="outflow"
                name="Cash Outflow"
                stroke="#EC5A60"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#outflowGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Income vs Expense Bar Chart */}
      <div
        style={{
          backgroundColor: '#111A2E',
          border: '1px solid #1D2A44',
          borderRadius: '12px',
          padding: '18px 20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
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
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'rgba(201, 162, 75, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#C9A24B',
              }}
            >
              <BarChart3 size={15} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F4FA' }}>
                Revenue vs Expense
              </div>
              <div style={{ fontSize: '11px', color: '#7E8DA6' }}>
                Quarterly Operating Performance (AED)
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: '11px',
              backgroundColor: 'rgba(201, 162, 75, 0.12)',
              color: '#DFBF6E',
              border: '1px solid rgba(201, 162, 75, 0.3)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontWeight: 600,
            }}
          >
            Quarterly
          </span>
        </div>

        <div style={{ width: '100%', height: '220px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={incomeExpenseData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1D2A44" vertical={false} />
              <XAxis dataKey="period" stroke="#7E8DA6" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#7E8DA6"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="revenue"
                name="Operating Revenue"
                fill="#C9A24B"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Operating Expense"
                fill="#4B5B76"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function ArAgingBucketsWidget() {
  const buckets = [
    { label: '0–30 Days (Current)', amount: '68,500.00', pct: '60%', color: '#2FBF8F' },
    { label: '31–60 Days', amount: '28,400.00', pct: '25%', color: '#60A5FA' },
    { label: '61–90 Days', amount: '12,200.00', pct: '11%', color: '#F59E0B' },
    { label: '90+ Days (Overdue)', amount: '5,180.00', pct: '4%', color: '#EC5A60' },
  ];

  return (
    <div
      style={{
        backgroundColor: '#111A2E',
        border: '1px solid #1D2A44',
        borderRadius: '12px',
        padding: '18px 20px',
        marginBottom: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="#C9A24B" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#F0F4FA' }}>
            Accounts Receivable (AR) Aging Buckets
          </span>
        </div>
        <span style={{ fontSize: '12px', color: '#94A3B8' }}>
          Total Outstanding: <strong style={{ color: '#F0F4FA' }}>AED 114,280.00</strong>
        </span>
      </div>

      {/* Progress Bar Stack */}
      <div
        style={{
          display: 'flex',
          height: '10px',
          borderRadius: '5px',
          overflow: 'hidden',
          backgroundColor: '#1E2C48',
          marginBottom: '14px',
        }}
      >
        {buckets.map((b, i) => (
          <div
            key={i}
            style={{
              width: b.pct,
              backgroundColor: b.color,
              transition: 'width 250ms ease',
            }}
            title={`${b.label}: AED ${b.amount} (${b.pct})`}
          />
        ))}
      </div>

      {/* Buckets Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
        }}
      >
        {buckets.map((b, i) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              backgroundColor: '#16223A',
              border: '1px solid #22304D',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: b.color,
                }}
              />
              <span style={{ fontSize: '11px', color: '#8A97B2' }}>{b.label}</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#F0F4FA', fontFamily: 'monospace' }}>
              AED {b.amount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
