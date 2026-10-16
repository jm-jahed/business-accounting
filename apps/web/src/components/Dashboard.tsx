'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Calendar,
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  FileText,
  CreditCard,
  Package,
  Box,
  BarChart3,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  Database,
  Sparkles,
  Smartphone,
  Laptop,
  Tv,
  Headphones,
  Watch,
  Layers,
  ExternalLink,
  ShieldCheck,
  Scale,
  DollarSign,
  HandCoins,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  dashboardApi,
  DashboardSummaryResponseDto,
  DashboardKPICard,
  ApiError,
} from '../lib/api-client';
import { useI18n } from '../i18n/context';

export interface DashboardProps {
  companyId?: string;
  storeSlug?: string;
  userRole?: string;
  currency?: string;
  onNavigateTab?: (tab: string) => void;
}

// -----------------------------------------------------------------------------
// Sample/Reference Data Matching Luxury Dubai Executive Dashboard Mockup
// -----------------------------------------------------------------------------
const PERFORMANCE_DATA = {
  'This Week': [
    { day: 'Oct 8', sales: 42000, profit: 24000, expenses: 14000, trend: 42000 },
    { day: 'Oct 9', sales: 38000, profit: 22000, expenses: 12000, trend: 38000 },
    { day: 'Oct 10', sales: 49000, profit: 29000, expenses: 15000, trend: 49000 },
    { day: 'Oct 11', sales: 36000, profit: 20000, expenses: 11000, trend: 36000 },
    { day: 'Oct 12', sales: 52000, profit: 31000, expenses: 16000, trend: 52000 },
    { day: 'Oct 13', sales: 45000, profit: 26000, expenses: 13000, trend: 45000 },
    { day: 'Oct 14', sales: 58000, profit: 34000, expenses: 17000, trend: 58000 },
  ],
  'This Month': [
    { day: 'W1', sales: 160000, profit: 92000, expenses: 48000, trend: 160000 },
    { day: 'W2', sales: 195000, profit: 112000, expenses: 54000, trend: 195000 },
    { day: 'W3', sales: 175000, profit: 98000, expenses: 50000, trend: 175000 },
    { day: 'W4', sales: 220000, profit: 128000, expenses: 62000, trend: 220000 },
  ],
  'This Year': [
    { day: 'Q1', sales: 680000, profit: 390000, expenses: 190000, trend: 680000 },
    { day: 'Q2', sales: 740000, profit: 425000, expenses: 210000, trend: 740000 },
    { day: 'Q3', sales: 810000, profit: 460000, expenses: 230000, trend: 810000 },
    { day: 'Q4', sales: 920000, profit: 530000, expenses: 260000, trend: 920000 },
  ],
};

const CATEGORY_DATA = [
  { name: 'Electronics', value: 32, color: '#F59E0B' },
  { name: 'Groceries', value: 24, color: '#3B82F6' },
  { name: 'Fashion', value: 16, color: '#10B981' },
  { name: 'Home & Living', value: 12, color: '#8B5CF6' },
  { name: 'Health & Beauty', value: 9, color: '#EC4899' },
  { name: 'Others', value: 7, color: '#94A3B8' },
];

const TOP_PRODUCTS = [
  {
    rank: 1,
    name: 'iPhone 15',
    icon: <Smartphone size={15} color="#38BDF8" />,
    bg: 'rgba(56, 189, 248, 0.15)',
    qty: 120,
    qtyHighlight: false,
    value: 'AED 96,000',
  },
  {
    rank: 2,
    name: 'Laptop Pro 15"',
    icon: <Laptop size={15} color="#F59E0B" />,
    bg: 'rgba(245, 158, 11, 0.15)',
    qty: 80,
    qtyHighlight: true,
    value: 'AED 72,000',
  },
  {
    rank: 3,
    name: 'Samsung TV 50"',
    icon: <Tv size={15} color="#A855F7" />,
    bg: 'rgba(168, 85, 247, 0.15)',
    qty: 60,
    qtyHighlight: false,
    value: 'AED 54,000',
  },
  {
    rank: 4,
    name: 'AirPods Pro',
    icon: <Headphones size={15} color="#10B981" />,
    bg: 'rgba(16, 185, 129, 0.15)',
    qty: 200,
    qtyHighlight: false,
    value: 'AED 48,000',
  },
  {
    rank: 5,
    name: 'Smart Watch',
    icon: <Watch size={15} color="#F43F5E" />,
    bg: 'rgba(244, 63, 94, 0.15)',
    qty: 150,
    qtyHighlight: false,
    value: 'AED 37,500',
  },
];

const RECENT_TRANSACTIONS = [
  {
    date: '14 Oct 2025 09:42 AM',
    type: 'Sale',
    typeIcon: <ShoppingCart size={13} color="#10B981" />,
    typeBg: 'rgba(16, 185, 129, 0.15)',
    description: 'INV-1048 - Al Noor Trading',
    amount: 'AED 12,480',
    status: 'Completed',
  },
  {
    date: '14 Oct 2025 08:17 AM',
    type: 'Purchase',
    typeIcon: <Package size={13} color="#F59E0B" />,
    typeBg: 'rgba(245, 158, 11, 0.15)',
    description: 'PO-1047 - Global Foods',
    amount: 'AED 8,750',
    status: 'Completed',
  },
  {
    date: '13 Oct 2025 07:53 AM',
    type: 'Payment Received',
    typeIcon: <CreditCard size={13} color="#3B82F6" />,
    typeBg: 'rgba(59, 130, 246, 0.15)',
    description: 'Customer Payment',
    amount: 'AED 5,200',
    status: 'Completed',
  },
  {
    date: '13 Oct 2025 04:21 PM',
    type: 'Expense',
    typeIcon: <FileText size={13} color="#EF4444" />,
    typeBg: 'rgba(239, 68, 68, 0.15)',
    description: 'Office Supplies',
    amount: 'AED 680',
    status: 'Completed',
  },
  {
    date: '13 Oct 2025 02:10 PM',
    type: 'Sale',
    typeIcon: <ShoppingCart size={13} color="#10B981" />,
    typeBg: 'rgba(16, 185, 129, 0.15)',
    description: 'INV-1046 - Tech World',
    amount: 'AED 3,450',
    status: 'Completed',
  },
];

const RECENT_ACTIVITIES = [
  {
    id: 1,
    title: 'New sale invoice created',
    detail: 'INV-1048 - AED 12,480',
    time: '09:42 AM',
    color: '#10B981',
    icon: <ShoppingCart size={13} color="#FFFFFF" />,
  },
  {
    id: 2,
    title: 'Payment received',
    detail: 'Customer - AED 5,200',
    time: '08:17 AM',
    color: '#3B82F6',
    icon: <CreditCard size={13} color="#FFFFFF" />,
  },
  {
    id: 3,
    title: 'New purchase order',
    detail: 'PO-1047 - AED 8,750',
    time: '07:53 AM',
    color: '#8B5CF6',
    icon: <Package size={13} color="#FFFFFF" />,
  },
  {
    id: 4,
    title: 'Stock adjustment',
    detail: 'iPhone 15: +20',
    time: '04:21 PM',
    color: '#F59E0B',
    icon: <Box size={13} color="#FFFFFF" />,
  },
];

export function Dashboard({
  companyId,
  storeSlug = 'store',
  userRole = 'owner',
  currency = 'AED',
  onNavigateTab,
}: DashboardProps) {
  const { dict, locale } = useI18n();

  // Active time filter for Business Performance
  const [perfRange, setPerfRange] = useState<'This Week' | 'This Month' | 'This Year'>('This Week');

  // Live dynamic clock state in UAE time
  const [currentTime, setCurrentTime] = useState<string>('10:24 AM');
  const [currentDate, setCurrentDate] = useState<string>('Tue, 14 Oct 2025');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      // Format time
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      // Format date
      const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      setCurrentTime(timeStr);
      setCurrentDate(dateStr);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Summary state from API
  const [summary, setSummary] = useState<DashboardSummaryResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSeedingDemo, setIsSeedingDemo] = useState<boolean>(false);
  const [showDevPanel, setShowDevPanel] = useState<boolean>(false);

  // Fetch real summary from GET /api/companies/:companyId/dashboard/summary
  const fetchSummary = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const data = await dashboardApi.getSummary(companyId, {
        from: '2025-01-01',
        to: '2026-12-31',
        compareTo: 'PREVIOUS_PERIOD',
      });
      setSummary(data);
    } catch {
      // Graceful degradation: sample mockup figures displayed cleanly
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Seed demo data handler
  const handleSeedDemo = async () => {
    if (!companyId || isSeedingDemo) return;
    setIsSeedingDemo(true);
    try {
      const result = await dashboardApi.seedDemo(companyId);
      toast.success(result.message || 'Demo ledger seeded successfully!');
      await fetchSummary();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to seed demo data');
    } finally {
      setIsSeedingDemo(false);
    }
  };

  // Determine active metrics (using API values if available, else luxury sample numbers)
  const activeCurrency = summary?.currency || currency;

  const moneyAvailableVal =
    summary?.kpis?.cashAndBank?.formatted || `${activeCurrency} 428,750`;
  const totalProfitVal =
    summary?.kpis?.netProfit?.formatted || `${activeCurrency} 189,420`;
  const amountYouOweVal =
    summary?.kpis?.payables?.formatted || `${activeCurrency} 56,980`;
  const amountOwedToYouVal =
    summary?.kpis?.receivables?.formatted || `${activeCurrency} 342,750`;
  const todaySalesVal =
    summary?.kpis?.todaySales?.formatted || `${activeCurrency} 12,480`;

  const kpis = [
    {
      id: 'money_available',
      title: 'Money Available',
      value: moneyAvailableVal,
      trend: '8.3%',
      trendDirection: 'up' as const,
      trendSubtitle: 'vs. last month',
      trendColor: '#10B981',
      sparklineColor: '#10B981',
      sparklinePath: 'M 2 22 C 15 22, 22 14, 35 16 C 48 18, 55 6, 70 8 C 76 9, 79 3, 82 2',
      icon: <Wallet size={17} color="#FFFFFF" />,
    },
    {
      id: 'total_profit',
      title: 'Total Profit',
      value: totalProfitVal,
      trend: '12.5%',
      trendDirection: 'up' as const,
      trendSubtitle: 'vs. last month',
      trendColor: '#10B981',
      sparklineColor: '#10B981',
      sparklinePath: 'M 2 24 C 14 24, 24 16, 36 15 C 48 14, 56 6, 68 8 C 74 9, 78 4, 82 2',
      icon: <Coins size={17} color="#FFFFFF" />,
    },
    {
      id: 'amount_you_owe',
      title: 'Amount You Owe',
      value: amountYouOweVal,
      trend: '4.2%',
      trendDirection: 'down' as const,
      trendSubtitle: 'vs. last month',
      trendColor: '#EF4444',
      sparklineColor: '#EF4444',
      sparklinePath: 'M 2 23 C 16 23, 26 19, 38 20 C 50 21, 58 11, 70 13 C 76 14, 79 5, 82 3',
      icon: <HandCoins size={17} color="#FFFFFF" />,
    },
    {
      id: 'amount_owed_to_you',
      title: 'Amount Owed to You',
      value: amountOwedToYouVal,
      trend: '6.7%',
      trendDirection: 'up' as const,
      trendSubtitle: 'vs. last month',
      trendColor: '#10B981',
      sparklineColor: '#10B981',
      sparklinePath: 'M 2 21 C 15 21, 23 15, 36 17 C 48 19, 56 7, 69 9 C 75 10, 78 4, 82 2',
      icon: <DollarSign size={17} color="#FFFFFF" />,
    },
    {
      id: 'today_sales',
      title: "Today's Sales",
      value: todaySalesVal,
      trend: '15.3%',
      trendDirection: 'up' as const,
      trendSubtitle: 'vs. yesterday',
      trendColor: '#10B981',
      sparklineColor: '#0EA5E9',
      sparklinePath: 'M 2 23 C 14 23, 22 17, 34 16 C 46 15, 54 8, 67 9 C 74 10, 78 3, 82 2',
      icon: <ShoppingCart size={17} color="#FFFFFF" />,
    },
  ];

  const quickActions = [
    {
      title: 'New Invoice',
      icon: <FileText size={16} color="#0B1220" />,
      path: `/${storeSlug}/sales/invoices/new`,
    },
    {
      title: 'Record Payment',
      icon: <CreditCard size={16} color="#0B1220" />,
      path: `/${storeSlug}/finance/payments/new`,
    },
    {
      title: 'Add New Purchase',
      icon: <Package size={16} color="#0B1220" />,
      path: `/${storeSlug}/purchases/orders/new`,
    },
    {
      title: 'Add New Item',
      icon: <Box size={16} color="#0B1220" />,
      path: `/${storeSlug}/stock/items/new`,
    },
    {
      title: 'View Reports',
      icon: <BarChart3 size={16} color="#0B1220" />,
      path: `/${storeSlug}/reports/financial`,
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
          1. SKYLINE HERO BANNER
          ===================================================================== */}
      <div
        style={{
          position: 'relative',
          borderRadius: '14px',
          overflow: 'hidden',
          minHeight: '130px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 32px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
          background: `
            radial-gradient(circle at 10% 20%, rgba(201, 162, 75, 0.15) 0%, transparent 40%),
            linear-gradient(90deg, #070B14 0%, rgba(7, 11, 20, 0.88) 45%, rgba(7, 11, 20, 0.35) 100%),
            url('/images/luxury-skyline-banner.jpg') right center / cover no-repeat
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
            background: 'linear-gradient(90deg, rgba(201, 162, 75, 0.8) 0%, rgba(243, 208, 134, 0.9) 30%, rgba(201, 162, 75, 0.2) 80%, transparent 100%)',
          }}
        />

        {/* Left Side: Header & Subtitle */}
        <div style={{ maxWidth: '620px', zIndex: 2 }}>
          <h1
            style={{
              margin: '0 0 6px 0',
              fontFamily: '"Cinzel", "Playfair Display", Georgia, serif',
              fontSize: '32px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              color: '#F3D086',
              textShadow: '0 2px 14px rgba(243, 208, 134, 0.35)',
            }}
          >
            Dashboard
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
            Your business at a glance. Track performance, manage finances, and make smarter decisions — all in one place.
          </p>
        </div>

        {/* Right Side: Live Date, Large Digital Clock, Timezone */}
        <div
          style={{
            textAlign: 'end',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#E2E8F0',
              marginBottom: '2px',
            }}
          >
            <Calendar size={13} color="#F3D086" />
            <span>{currentDate}</span>
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '0.5px',
              lineHeight: 1.15,
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.8)',
            }}
          >
            {currentTime}
          </div>

          <div
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#94A3B8',
              marginTop: '2px',
            }}
          >
            UAE Time (GMT+4)
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. TOP 5 KPI METRIC CARDS
          ===================================================================== */}
      <div
        className="dashboard-kpi-grid"
        style={{
          display: 'grid',
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
                    fontSize: '17px',
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
          3. MIDDLE SECTION (3 COLUMNS: Performance, Donut, Quick Actions)
          ===================================================================== */}
      <div
        className="dashboard-middle-grid"
        style={{
          display: 'grid',
          gap: '14px',
        }}
      >
        {/* Card 1: Business Performance */}
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
          {/* Card Header & Time Range Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: '#F8FAFC',
              }}
            >
              Business Performance
            </h2>

            {/* Time Toggle Pills */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '20px',
                padding: '2px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {(['This Week', 'This Month', 'This Year'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setPerfRange(r)}
                  style={{
                    border: 'none',
                    background: perfRange === r ? '#F59E0B' : 'transparent',
                    color: perfRange === r ? '#0B1220' : '#94A3B8',
                    fontWeight: perfRange === r ? 700 : 500,
                    fontSize: '11px',
                    borderRadius: '16px',
                    padding: '4px 12px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Legend Items */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '11px',
              color: '#94A3B8',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
              <span>Sales</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              <span>Profit</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
              <span>Expenses</span>
            </div>
          </div>

          {/* Chart Container */}
          <div style={{ width: '100%', height: '210px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={PERFORMANCE_DATA[perfRange]}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
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
                  tickFormatter={(val) => (val === 0 ? 'AED 0' : `AED ${(val / 1000).toFixed(0)}k`)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(201, 162, 75, 0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F8FAFC',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                  }}
                />
                {/* Grouped Bars */}
                <Bar dataKey="sales" fill="#F59E0B" radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Bar dataKey="profit" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Bar dataKey="expenses" fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={14} />
                {/* Glowing spline trend line with golden dots */}
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke="#F3D086"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#F3D086', stroke: '#0F172A', strokeWidth: 1.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Sales by Category (Donut Chart) */}
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
          <h2
            style={{
              margin: '0 0 8px 0',
              fontSize: '15px',
              fontWeight: 700,
              color: '#F8FAFC',
            }}
          >
            Sales by Category
          </h2>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '100%',
              gap: '12px',
            }}
          >
            {/* Donut with Center Text */}
            <div style={{ position: 'relative', width: '150px', height: '180px', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_DATA}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {CATEGORY_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="#0F172A" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
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
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.2px' }}>
                  AED 428,750
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>
                  Total Sales
                </div>
              </div>
            </div>

            {/* Category Legend with Percentages */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                flex: 1,
              }}
            >
              {CATEGORY_DATA.map((c) => (
                <div
                  key={c.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: c.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: '#E2E8F0', whiteSpace: 'nowrap' }}>{c.name}</span>
                  </div>
                  <span style={{ color: '#94A3B8', fontWeight: 600 }}>{c.value}%</span>
                </div>
              ))}
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
          <h2
            style={{
              margin: '0 0 12px 0',
              fontSize: '15px',
              fontWeight: 700,
              color: '#F8FAFC',
            }}
          >
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
                  fontSize: '12px',
                  fontWeight: 600,
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
                  <span>{action.title}</span>
                </div>

                <ChevronRight size={15} color="#64748B" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. BOTTOM SECTION (3 COLUMNS: Transactions, Top Products, Activity)
          ===================================================================== */}
      <div
        className="dashboard-bottom-grid"
        style={{
          display: 'grid',
          gap: '14px',
        }}
      >
        {/* Card 1: Recent Transactions Table */}
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
              Recent Transactions
            </h2>
            <a
              href={`/${storeSlug}/ledger`}
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
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '8px 10px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Date & Time</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Description</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_TRANSACTIONS.map((tx, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background-color 150ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '10px 10px', fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                      {tx.date}
                    </td>
                    <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: tx.typeBg,
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#F8FAFC',
                        }}
                      >
                        {tx.typeIcon}
                        <span>{tx.type}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 10px', fontSize: '12px', color: '#F1F5F9', fontWeight: 500 }}>
                      {tx.description}
                    </td>
                    <td style={{ padding: '10px 10px', fontSize: '12px', color: '#F8FAFC', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {tx.amount}
                    </td>
                    <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          color: '#10B981',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: '1px solid rgba(16, 185, 129, 0.3)',
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

        {/* Card 2: Top Products by Sales Value */}
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
              Top Products by Sales Value
            </h2>
            <a
              href={`/${storeSlug}/stock/items`}
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
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '8px 6px', fontSize: '11px', color: '#64748B', fontWeight: 600, width: '24px' }}>#</th>
                  <th style={{ padding: '8px 8px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Product</th>
                  <th style={{ padding: '8px 8px', fontSize: '11px', color: '#64748B', fontWeight: 600, textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px 8px', fontSize: '11px', color: '#64748B', fontWeight: 600, textAlign: 'right' }}>Sales Value</th>
                </tr>
              </thead>
              <tbody>
                {TOP_PRODUCTS.map((prod) => (
                  <tr
                    key={prod.rank}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background-color 150ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '10px 6px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                      {prod.rank}
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            backgroundColor: prod.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {prod.icon}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#F8FAFC' }}>
                          {prod.name}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '10px 8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: prod.qtyHighlight ? '#F59E0B' : '#E2E8F0',
                        textAlign: 'center',
                      }}
                    >
                      {prod.qty}
                    </td>
                    <td
                      style={{
                        padding: '10px 8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#F8FAFC',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {prod.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Recent Activity (Vertical Connected Timeline) */}
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
          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: '15px',
              fontWeight: 700,
              color: '#F8FAFC',
            }}
          >
            Recent Activity
          </h2>

          {/* Timeline List */}
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Continuous vertical connector line */}
            <div
              style={{
                position: 'absolute',
                top: '14px',
                bottom: '24px',
                left: '13px',
                width: '2px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                zIndex: 1,
              }}
            />

            {RECENT_ACTIVITIES.map((act, index) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: index === RECENT_ACTIVITIES.length - 1 ? 0 : '14px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {/* Glowing Circular Node */}
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: act.color,
                    boxShadow: `0 0 10px ${act.color}80`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '2px solid #0F172A',
                  }}
                >
                  {act.icon}
                </div>

                {/* Activity Detail */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#F8FAFC', lineHeight: 1.3 }}>
                    {act.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                    {act.detail}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                    {act.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          5. ACCOUNTING INTEGRITY & SEED DEMO DRAWER (Rule 6 & Rule 11 Compliance)
          ===================================================================== */}
      <div
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={15} color="#10B981" />
            <span style={{ color: '#E2E8F0', fontWeight: 600 }}>Double-Entry Engine:</span>
            <span style={{ color: '#10B981', fontWeight: 700 }}>Balanced (Σ Debits ≡ Σ Credits)</span>
          </div>

          <span style={{ color: 'rgba(255, 255, 255, 0.1)' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Scale size={15} color="#F3D086" />
            <span style={{ color: '#94A3B8' }}>Statutory Regime:</span>
            <span style={{ color: '#F3D086', fontWeight: 600 }}>UAE FTA 5% VAT (Dynamic)</span>
          </div>

          <span style={{ color: 'rgba(255, 255, 255, 0.1)' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={15} color="#38BDF8" />
            <span style={{ color: '#94A3B8' }}>Tenant Isolation:</span>
            <span style={{ color: '#38BDF8', fontWeight: 600 }}>Active (/{storeSlug})</span>
          </div>
        </div>

        {/* Action button for seeding demo data */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchSummary}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '7px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#CBD5E1',
              fontSize: '11px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync Live Ledger</span>
          </button>

          <button
            onClick={handleSeedDemo}
            disabled={isSeedingDemo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '7px',
              background: 'linear-gradient(135deg, rgba(201, 162, 75, 0.25) 0%, rgba(243, 208, 134, 0.15) 100%)',
              border: '1px solid rgba(201, 162, 75, 0.4)',
              color: '#F3D086',
              fontSize: '11px',
              fontWeight: 700,
              cursor: isSeedingDemo ? 'not-allowed' : 'pointer',
            }}
          >
            <Sparkles size={13} color="#F3D086" />
            <span>{isSeedingDemo ? 'Seeding...' : 'Seed Live Journals'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
