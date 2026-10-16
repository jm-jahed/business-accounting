'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FileText,
  Wallet,
  RotateCcw,
  Users,
  CreditCard,
  PlusCircle,
  Eye,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';

export interface SalesWorkspaceProps {
  storeSlug?: string;
  companyId?: string;
  currency?: string;
}

// -----------------------------------------------------------------------------
// Sample/Reference Data Matching Luxury Sales Mockup
// -----------------------------------------------------------------------------
const SALES_OVERVIEW_DATA = [
  { day: 'Oct 8', amount: 12000 },
  { day: 'Oct 9', amount: 16000 },
  { day: 'Oct 10', amount: 14500 },
  { day: 'Oct 11', amount: 20000 },
  { day: 'Oct 12', amount: 24000 },
  { day: 'Oct 13', amount: 26500 },
  { day: 'Oct 14', amount: 32450 },
];

const INVOICE_STATUS_DATA = [
  { name: 'Paid', value: 78, color: '#F59E0B' },
  { name: 'Pending', value: 15, color: '#3B82F6' },
  { name: 'Overdue', value: 7, color: '#EF4444' },
];

const RECENT_INVOICES = [
  {
    id: 1,
    invoiceNo: 'SI-1048',
    date: '14 Oct 2025 10:45 AM',
    customer: 'ABC Trading LLC',
    amount: 'AED 12,450',
    status: 'Paid',
    statusColor: '#10B981',
    statusBg: 'rgba(16, 185, 129, 0.18)',
  },
  {
    id: 2,
    invoiceNo: 'SI-1047',
    date: '14 Oct 2025 09:32 AM',
    customer: 'Al Noor Supermarket',
    amount: 'AED 8,260',
    status: 'Paid',
    statusColor: '#10B981',
    statusBg: 'rgba(16, 185, 129, 0.18)',
  },
  {
    id: 3,
    invoiceNo: 'SI-1046',
    date: '14 Oct 2025 08:17 AM',
    customer: 'Fresh Mart',
    amount: 'AED 5,780',
    status: 'Pending',
    statusColor: '#38BDF8',
    statusBg: 'rgba(56, 189, 248, 0.18)',
  },
  {
    id: 4,
    invoiceNo: 'SI-1045',
    date: '14 Oct 2025 07:50 AM',
    customer: 'City Store',
    amount: 'AED 3,420',
    status: 'Paid',
    statusColor: '#10B981',
    statusBg: 'rgba(16, 185, 129, 0.18)',
  },
  {
    id: 5,
    invoiceNo: 'SI-1044',
    date: '13 Oct 2025 06:21 PM',
    customer: 'Gulf Retail',
    amount: 'AED 7,650',
    status: 'Overdue',
    statusColor: '#EF4444',
    statusBg: 'rgba(239, 68, 68, 0.18)',
  },
];

const RECENT_PAYMENTS = [
  {
    date: '14 Oct 2025 10:52 AM',
    invoiceNo: 'SI-1048',
    method: 'Cash',
    amount: 'AED 12,450',
  },
  {
    date: '14 Oct 2025 09:45 AM',
    invoiceNo: 'SI-1047',
    method: 'Card',
    amount: 'AED 8,260',
  },
  {
    date: '14 Oct 2025 08:33 AM',
    invoiceNo: 'SI-1046',
    method: 'Cash',
    amount: 'AED 5,780',
  },
  {
    date: '13 Oct 2025 05:12 PM',
    invoiceNo: 'SI-1045',
    method: 'Card',
    amount: 'AED 7,650',
  },
  {
    date: '13 Oct 2025 03:48 PM',
    invoiceNo: 'SI-1044',
    method: 'Cash',
    amount: 'AED 3,420',
  },
];

export function SalesWorkspace({
  storeSlug = 'store',
  currency = 'AED',
}: SalesWorkspaceProps) {
  const { dict } = useI18n();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const kpis = [
    {
      id: 'sales_invoices',
      title: 'Sales Invoices',
      value: `${currency} 258,750`,
      trend: '12.5%',
      trendSubtitle: 'vs. last month',
      trendColor: '#10B981',
      sparklineColor: '#10B981',
      sparklinePath: 'M 2 22 C 15 22, 22 14, 35 16 C 48 18, 55 6, 70 8 C 76 9, 79 3, 82 2',
      icon: <FileText size={17} color="#FFFFFF" />,
    },
    {
      id: 'money_received',
      title: 'Money Received',
      value: `${currency} 189,420`,
      trend: '8.3%',
      trendSubtitle: 'vs. last month',
      trendColor: '#38BDF8',
      sparklineColor: '#38BDF8',
      sparklinePath: 'M 2 24 C 14 24, 24 16, 36 15 C 48 14, 56 6, 68 8 C 74 9, 78 4, 82 2',
      icon: <Wallet size={17} color="#FFFFFF" />,
    },
    {
      id: 'credit_notes',
      title: 'Credit Notes',
      value: `${currency} 12,580`,
      trend: '4.2%',
      trendSubtitle: 'vs. last month',
      trendColor: '#EF4444',
      sparklineColor: '#EF4444',
      sparklinePath: 'M 2 23 C 16 23, 26 19, 38 20 C 50 21, 58 11, 70 13 C 76 14, 79 5, 82 3',
      icon: <RotateCcw size={17} color="#FFFFFF" />,
    },
    {
      id: 'money_to_receive',
      title: 'Money to Receive',
      value: `${currency} 36,750`,
      trend: '6.7%',
      trendSubtitle: 'vs. last month',
      trendColor: '#A855F7',
      sparklineColor: '#A855F7',
      sparklinePath: 'M 2 21 C 15 21, 23 15, 36 17 C 48 19, 56 7, 69 9 C 75 10, 78 4, 82 2',
      icon: <Users size={17} color="#FFFFFF" />,
    },
  ];

  const quickActions = [
    {
      title: 'New Invoice',
      subtitle: 'Create a new sales invoice',
      icon: <FileText size={16} color="#0B1220" />,
      path: `/${storeSlug}/sell/invoices/new`,
    },
    {
      title: 'Record Payment',
      subtitle: 'Add customer payment',
      icon: <CreditCard size={16} color="#0B1220" />,
      path: `/${storeSlug}/sell/money-received/new`,
    },
    {
      title: 'Credit Note',
      subtitle: 'Issue credit note for returns',
      icon: <RotateCcw size={16} color="#0B1220" />,
      path: `/${storeSlug}/sell/credit-notes/new`,
    },
    {
      title: 'Money to Receive',
      subtitle: 'Track customer dues',
      icon: <Users size={16} color="#0B1220" />,
      path: `/${storeSlug}/sell/money-to-receive`,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        color: '#F8FAFC',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* =====================================================================
          1. LUXURY SALES (SELL) HERO BANNER
          ===================================================================== */}
      <div
        className="dashboard-hero-banner"
        style={{
          position: 'relative',
          borderRadius: '14px',
          overflow: 'hidden',
          minHeight: '135px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 32px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
          background: `
            radial-gradient(circle at 10% 20%, rgba(201, 162, 75, 0.15) 0%, transparent 40%),
            linear-gradient(90deg, #070B14 0%, rgba(7, 11, 20, 0.90) 48%, rgba(7, 11, 20, 0.25) 100%),
            url('/images/luxury-pos-banner.jpg') right center / cover no-repeat
          `,
        }}
      >
        {/* Subtle top gold streak arc */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background:
              'linear-gradient(90deg, rgba(201, 162, 75, 0.8) 0%, rgba(243, 208, 134, 0.9) 30%, rgba(201, 162, 75, 0.2) 80%, transparent 100%)',
          }}
        />

        {/* Left Side: Tag, Heading & Subtitle */}
        <div style={{ maxWidth: '640px', zIndex: 2 }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#F3D086',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            SALES
          </div>
          <h1
            className="dashboard-hero-title"
            style={{
              margin: '0 0 6px 0',
              fontFamily: '"Cinzel", "Playfair Display", Georgia, serif',
              fontSize: '34px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              color: '#F3D086',
              textShadow: '0 2px 14px rgba(243, 208, 134, 0.35)',
            }}
          >
            Sell
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: '#CBD5E1',
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            Manage your sales, track invoices, receive payments, handle credit notes and customer dues — all in one place.
          </p>
        </div>
      </div>

      {/* =====================================================================
          2. TOP 4 KPI METRIC CARDS
          ===================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
        }}
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
              transition: 'border-color 150ms ease, transform 150ms ease',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(201, 162, 75, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Top row: Circular gold icon + Label & Amount */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F3D086 0%, #C9A24B 100%)',
                  boxShadow: '0 2px 10px rgba(201, 162, 75, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {kpi.icon}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#94A3B8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '3px',
                  }}
                >
                  {kpi.title}
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#F8FAFC',
                    letterSpacing: '0.2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {kpi.value}
                </div>
              </div>
            </div>

            {/* Bottom row: Trend Badge + Sparkline SVG */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '6px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: kpi.trendColor,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>↑ {kpi.trend}</span>
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 400 }}>
                  {kpi.trendSubtitle}
                </span>
              </div>

              <svg width="74" height="24" viewBox="0 0 84 28" fill="none">
                <path
                  d={kpi.sparklinePath}
                  stroke={kpi.sparklineColor}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* =====================================================================
          3. MIDDLE SECTION (3 COLUMNS: Sales Overview, Donut Gauge, Quick Actions)
          ===================================================================== */}
      <div
        className="dashboard-middle-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1.1fr) minmax(0, 1.2fr)',
          gap: '14px',
        }}
      >
        {/* Card 1: Sales Overview (Line Chart) */}
        <div
          className="dashboard-perf-card"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '18px 20px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
                Sales Overview
              </h2>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                Last 7 Days
              </div>
            </div>

            {/* Filter Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '11px',
                color: '#CBD5E1',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>Sales</span>
              <ChevronDown size={13} color="#94A3B8" />
            </div>
          </div>

          {/* Area Chart Container */}
          <div style={{ width: '100%', height: '210px', position: 'relative' }}>
            {/* Highlight Tooltip Box for Oct 14 */}
            <div
              style={{
                position: 'absolute',
                top: '28px',
                right: '18px',
                backgroundColor: '#F59E0B',
                color: '#0B1220',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                zIndex: 3,
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
              }}
            >
              AED 32,450
            </div>

            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={SALES_OVERVIEW_DATA}
                  margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="salesGoldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => (val === 0 ? '0' : `${(val / 1000).toFixed(0)}K`)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: 'rgba(201, 162, 75, 0.3)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#F8FAFC',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#F3D086"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGoldGrad)"
                    dot={{ r: 3.5, fill: '#F3D086', stroke: '#0F172A', strokeWidth: 1.5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Card 2: Paid Invoices Donut / Gauge */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '18px 20px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Donut Gauge */}
          <div style={{ position: 'relative', width: '160px', height: '170px' }}>
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={INVOICE_STATUS_DATA}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {INVOICE_STATUS_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="#0F172A" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Inner Center Text */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#F8FAFC' }}>78%</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                Paid Invoices
              </div>
            </div>
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              fontSize: '11px',
              width: '100%',
              paddingTop: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
              <span style={{ color: '#E2E8F0' }}>Paid</span>
              <span style={{ color: '#94A3B8', fontWeight: 600 }}>78%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
              <span style={{ color: '#E2E8F0' }}>Pending</span>
              <span style={{ color: '#94A3B8', fontWeight: 600 }}>15%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
              <span style={{ color: '#E2E8F0' }}>Overdue</span>
              <span style={{ color: '#94A3B8', fontWeight: 600 }}>7%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Quick Actions */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '18px 20px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h2 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
            Quick Actions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {quickActions.map((action) => (
              <a
                key={action.title}
                href={action.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '9px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#F1F5F9',
                  textDecoration: 'none',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(201, 162, 75, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(201, 162, 75, 0.4)';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #F3D086 0%, #C9A24B 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(201, 162, 75, 0.3)',
                      flexShrink: 0,
                    }}
                  >
                    {action.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#F8FAFC' }}>
                      {action.title}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94A3B8' }}>{action.subtitle}</div>
                  </div>
                </div>

                <ChevronRight size={15} color="#64748B" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. BOTTOM SECTION (2 COLUMNS: Invoices Table + Payment Record)
          ===================================================================== */}
      <div
        className="dashboard-bottom-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
          gap: '14px',
        }}
      >
        {/* Card 1: Recent Sales Invoices */}
        <div
          className="dashboard-tx-card"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '18px 20px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header + View All Link */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
              Recent Sales Invoices
            </h2>
            <a
              href={`/${storeSlug}/sell/invoices`}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#F59E0B',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>View All</span>
              <span>→</span>
            </a>
          </div>

          {/* Table */}
          <div className="dashboard-table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '8px 6px', fontSize: '11px', color: '#64748B', fontWeight: 600, width: '20px' }}>#</th>
                  <th style={{ padding: '8px 8px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Invoice No</th>
                  <th style={{ padding: '8px 8px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Date & Time</th>
                  <th style={{ padding: '8px 8px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '8px 8px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Total Amount</th>
                  <th style={{ padding: '8px 8px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '8px 8px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_INVOICES.map((inv) => (
                  <tr
                    key={inv.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background-color 150ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '10px 6px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                      {inv.id}
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#F8FAFC', whiteSpace: 'nowrap' }}>
                      {inv.invoiceNo}
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      {inv.date}
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: '12px', color: '#F1F5F9', fontWeight: 500 }}>
                      {inv.customer}
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: '12px', color: '#F8FAFC', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {inv.amount}
                    </td>
                    <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          backgroundColor: inv.statusBg,
                          color: inv.statusColor,
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'none',
                          border: 'none',
                          color: '#94A3B8',
                          fontSize: '11px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={12} />
                        <span>View</span>
                        <ChevronDown size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: Payment Record Table & Enterprise Security Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '18px 20px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}
          >
            {/* Header + View All Link */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
                Payment Record
              </h2>
              <a
                href={`/${storeSlug}/sell/money-received`}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#F59E0B',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>View All</span>
                <span>→</span>
              </a>
            </div>

            {/* Table */}
            <div className="dashboard-table-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <th style={{ padding: '8px 8px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Date & Time</th>
                    <th style={{ padding: '8px 8px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Invoice No</th>
                    <th style={{ padding: '8px 8px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Method</th>
                    <th style={{ padding: '8px 8px', fontSize: '11px', color: '#64748B', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_PAYMENTS.map((pm, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background-color 150ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '10px 8px', fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                        {pm.date}
                      </td>
                      <td style={{ padding: '10px 8px', fontSize: '12px', color: '#F8FAFC', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {pm.invoiceNo}
                      </td>
                      <td style={{ padding: '10px 8px', fontSize: '12px', color: '#CBD5E1', fontWeight: 500 }}>
                        {pm.method}
                      </td>
                      <td style={{ padding: '10px 8px', fontSize: '12px', color: '#F8FAFC', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {pm.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enterprise Security Protected Card */}
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '10px',
              backgroundColor: 'rgba(201, 162, 75, 0.06)',
              border: '1px solid rgba(201, 162, 75, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(201, 162, 75, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={18} color="#F3D086" />
            </div>
            <div style={{ fontSize: '12px', color: '#F3D086', fontWeight: 600 }}>
              Your data is protected with enterprise-grade security
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
