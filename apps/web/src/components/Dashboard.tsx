'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Calendar,
  ChevronDown,
  BookOpen,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Scale,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Building2,
  Search,
  FileText,
  Copy,
  ExternalLink,
  Database,
  Wrench,
  DollarSign,
  ChevronRight,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  dashboardApi,
  DashboardSummaryResponseDto,
  DashboardKPICard,
  ApiError,
} from '../lib/api-client';
import { Card, Badge, Button } from './ui';
import { useI18n } from '../i18n/context';

export interface DashboardProps {
  companyId?: string;
  storeSlug?: string;
  userRole?: string;
  currency?: string;
  onNavigateTab?: (tab: string) => void;
}

// Plain-language bilingual tooltip dictionary (English + Bangla)
const KPI_TOOLTIPS: Record<
  string,
  { en: string; bn: string; plainTermEn: string; plainTermBn: string }
> = {
  todaySales: {
    plainTermEn: "Today's Sales",
    plainTermBn: 'আজকের মোট বিক্রি',
    en: 'Total value of all sales invoices and income recorded today.',
    bn: 'আজ সারাদিনে হওয়া মোট বিক্রি ও আয়ের পরিমাণ।',
  },
  mtdRevenue: {
    plainTermEn: 'This Month Sales',
    plainTermBn: 'চলতি মাসের মোট বিক্রি',
    en: 'Total sales revenue earned from the 1st of this month until today.',
    bn: 'চলতি মাসের ১ তারিখ থেকে আজ পর্যন্ত মোট বিক্রির যোগফল।',
  },
  grossProfit: {
    plainTermEn: 'Profit Before Expenses',
    plainTermBn: 'খরচ পূর্ববর্তী লাভ',
    en: 'Sales income minus direct cost of goods sold, before operating expenses.',
    bn: 'পণ্য বিক্রির মোট আয় থেকে শুধু পণ্যের কেনা খরচ বাদ দিয়ে পাওয়া লাভ।',
  },
  netProfit: {
    plainTermEn: 'Final Profit',
    plainTermBn: 'চূড়ান্ত লাভ',
    en: 'Real net profit remaining after deducting all operating expenses, rent, and overheads.',
    bn: 'সব রকম খরচ (ভাড়া, বেতন, বিদ্যুৎ ইত্যাদি) বাদ দেওয়ার পর প্রকৃত লাভ।',
  },
  cashAndBank: {
    plainTermEn: 'Money Available',
    plainTermBn: 'সহজ ক্যাশ ও ব্যাংক ব্যালেন্স',
    en: 'Liquid money immediately available across all company bank accounts and cash drawers.',
    bn: 'ব্যাংক একাউন্ট ও ক্যাশ ড্রয়ারে থাকা খরচযোগ্য মোট নগদ টাকা।',
  },
  receivables: {
    plainTermEn: 'Money to Receive',
    plainTermBn: 'কাস্টমারদের থেকে প্রাপ্য টাকা',
    en: 'Money owed to your business by customers that has not yet been paid.',
    bn: 'কাস্টমার বা খদ্দেরদের কাছে বকেয়া পাওনা টাকা যা এখনও জমা হয়নি।',
  },
  payables: {
    plainTermEn: 'Money to Pay',
    plainTermBn: 'সাপ্লায়ারদের প্রদেয় টাকা',
    en: 'Money you owe to suppliers and vendors for bills and purchases.',
    bn: 'সাপ্লায়ার বা পাইকারদের কাছে আপনার প্রদেয় বা বাকি টাকা।',
  },
  inventoryValuation: {
    plainTermEn: 'Stock Value',
    plainTermBn: 'গুদামে মজুদ পণ্যের মূল্য',
    en: 'Total financial valuation of all products currently stored in your warehouses.',
    bn: 'গুদামে থাকা সব পণ্যের মোট ক্রয়মূল্যের হিসাব।',
  },
  openOrders: {
    plainTermEn: 'Pending Orders',
    plainTermBn: 'অপেক্ষমান অর্ডার',
    en: 'Active sales and purchase orders in progress awaiting fulfillment or delivery.',
    bn: 'চলতি বিক্রয় ও কেনাকাটার অর্ডার যা সম্পন্ন বা ডেলিভারির অপেক্ষায় রয়েছে।',
  },
};

export function Dashboard({
  companyId,
  storeSlug = 'store',
  userRole = 'owner',
  currency = 'AED',
  onNavigateTab,
}: DashboardProps) {
  const { locale } = useI18n();

  // Date range state: default = 1st of current month to today
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return {
      from: `${year}-${month}-01`,
      to: `${year}-${month}-${day}`,
    };
  });

  const [compareTo, setCompareTo] = useState<'PREVIOUS_PERIOD' | 'PREVIOUS_YEAR' | 'NONE'>('PREVIOUS_PERIOD');
  const [summary, setSummary] = useState<DashboardSummaryResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSeedingDemo, setIsSeedingDemo] = useState<boolean>(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Journal stream search & filter state
  const [streamSearch, setStreamSearch] = useState('');
  const [streamStatus, setStreamStatus] = useState<'ALL' | 'POSTED' | 'DRAFT'>('ALL');
  const [expandedJournalRows, setExpandedJournalRows] = useState<Record<string, boolean>>({});

  // Development environment check
  const isDev =
    process.env.NODE_ENV !== 'production' ||
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
  const isOwner = userRole?.toLowerCase() === 'owner';
  const showDemoDataButton = isDev && isOwner;

  // Fetch real summary from GET /api/companies/:companyId/dashboard/summary
  const fetchSummary = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardApi.getSummary(companyId, {
        from: dateRange.from,
        to: dateRange.to,
        compareTo,
      });
      setSummary(data);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : err?.message || 'Failed to fetch dashboard summary';
      setError(msg);
      toast.error(`Dashboard Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, dateRange.from, dateRange.to, compareTo]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Handle Seeding Real Demo Journals
  const handleSeedDemo = async () => {
    if (!companyId || isSeedingDemo) return;
    setIsSeedingDemo(true);
    try {
      const result = await dashboardApi.seedDemo(companyId);
      toast.success(result.message || 'Demo data seeded successfully!');
      await fetchSummary();
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : err?.message || 'Failed to seed demo data';
      toast.error(`Seed Demo Refused: ${msg}`);
    } finally {
      setIsSeedingDemo(false);
    }
  };

  // Toggle expanded row in journal stream
  const toggleJournalRow = (id: string) => {
    setExpandedJournalRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyVoucherNumber = (num: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(num);
    toast.success(`Copied ${num} to clipboard`);
  };

  // Filtered journal stream
  const filteredJournalStream = useMemo(() => {
    if (!summary?.recentJournalStream) return [];
    return summary.recentJournalStream.filter((item: any) => {
      if (streamStatus !== 'ALL' && item.status !== streamStatus) {
        return false;
      }
      if (streamSearch.trim() !== '') {
        const q = streamSearch.toLowerCase();
        return (
          item.entryNumber.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.voucherType.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [summary?.recentJournalStream, streamStatus, streamSearch]);

  const activeCurrency = summary?.currency || currency;

  // Render a Single KPI Card with honest states and friendly tooltips
  const renderKpiCard = (
    key: string,
    kpi?: DashboardKPICard,
    icon?: React.ReactNode,
    accentColor: string = 'var(--gold)'
  ) => {
    const tooltipMeta = KPI_TOOLTIPS[key] || {
      plainTermEn: kpi?.label || key,
      plainTermBn: kpi?.label || key,
      en: kpi?.tooltip || 'General ledger financial position metric.',
      bn: 'জেনারেল লেজার ভিত্তিক আর্থিক হিসাব নির্দেশক।',
    };

    // 1. Loading Skeleton
    if (isLoading && !summary) {
      return (
        <div
          key={key}
          style={{
            backgroundColor: 'var(--surface-2)',
            borderRadius: '14px',
            padding: '20px',
            border: '1px solid var(--border-card)',
            minHeight: '170px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{
                width: '120px',
                height: '14px',
                backgroundColor: 'var(--surface-3)',
                borderRadius: '4px',
                animation: 'pulse 1.5s infinite',
              }}
            />
            <div
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: 'var(--surface-3)',
                borderRadius: '50%',
              }}
            />
          </div>
          <div
            style={{
              width: '160px',
              height: '32px',
              backgroundColor: 'var(--surface-3)',
              borderRadius: '6px',
              margin: '12px 0',
            }}
          />
          <div
            style={{
              width: '100px',
              height: '12px',
              backgroundColor: 'var(--surface-3)',
              borderRadius: '4px',
            }}
          />
        </div>
      );
    }

    if (!kpi) return null;

    // 2. Setup Needed Card State (Honest, zero fake numbers)
    if (kpi.setupNeeded) {
      return (
        <div
          key={key}
          className="erp-card-interactive"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderRadius: '14px',
            padding: '20px 22px',
            border: '1px dashed var(--gold)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {locale === 'bn' ? tooltipMeta.plainTermBn : tooltipMeta.plainTermEn}
              </span>
              <Wrench size={16} color="var(--gold)" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold)', marginBottom: '6px' }}>
              Setup Needed
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              {kpi.subtext || 'Chart of accounts or opening balances need configuration to compute this metric.'}
            </p>
          </div>
          <div style={{ marginTop: '14px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab?.(kpi.drillDownTab || 'accounts')}
              style={{ width: '100%', fontSize: '11px', borderColor: 'var(--gold)', color: 'var(--gold)' }}
            >
              Configure in {kpi.drillDownTab.toUpperCase()}
            </Button>
          </div>
        </div>
      );
    }

    // 3. Coming Soon Card State (Honest, zero fake numbers)
    if (kpi.comingSoon) {
      return (
        <div
          key={key}
          className="erp-card-interactive"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderRadius: '14px',
            padding: '20px 22px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            opacity: 0.85,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {locale === 'bn' ? tooltipMeta.plainTermBn : tooltipMeta.plainTermEn}
              </span>
              <Clock size={15} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Available Soon
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              {kpi.subtext || 'Available after Sales and Purchase bills are added.'}
            </p>
          </div>
          <div style={{ marginTop: '14px' }}>
            <Badge variant="neutral" size="xs">
              Coming soon
            </Badge>
          </div>
        </div>
      );
    }

    // 4. Real Operational Live Data Card
    const isTooltipOpen = activeTooltip === key;

    return (
      <div
        key={key}
        className="erp-card-interactive"
        style={{
          backgroundColor: 'var(--surface-2)',
          borderRadius: '14px',
          padding: '20px 22px',
          border: `1px solid ${accentColor === 'var(--gold)' ? 'rgba(212, 160, 44, 0.3)' : 'var(--border-card)'}`,
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'visible',
          cursor: kpi.drillDownTab ? 'pointer' : 'default',
        }}
        onClick={() => {
          if (kpi.drillDownTab && onNavigateTab) {
            onNavigateTab(kpi.drillDownTab);
          }
        }}
      >
        <div>
          {/* Card Header with Friendly Term and ? Tooltip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {icon}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.02em',
                }}
              >
                {locale === 'bn' ? tooltipMeta.plainTermBn : tooltipMeta.plainTermEn}
              </span>
            </div>

            {/* ? Help Tooltip Trigger */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltip(isTooltipOpen ? null : key);
                }}
                onMouseEnter={() => setActiveTooltip(key)}
                onMouseLeave={() => setActiveTooltip(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '50%',
                }}
                aria-label="View metric explanation"
              >
                <HelpCircle size={14} />
              </button>

              {/* Tooltip Popup (Bilingual English + Bangla) */}
              {isTooltipOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '22px',
                    right: 0,
                    width: '260px',
                    backgroundColor: 'var(--surface-1)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '8px',
                    padding: '12px',
                    zIndex: 100,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    fontSize: '11px',
                    lineHeight: '1.45',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: '4px' }}>
                    {tooltipMeta.plainTermEn} / {tooltipMeta.plainTermBn}
                  </div>
                  <div style={{ marginBottom: '6px', color: 'var(--text-primary)' }}>
                    <strong>EN:</strong> {tooltipMeta.en}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
                    <strong>বাংলা:</strong> {tooltipMeta.bn}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Formatted Number Display */}
          <div
            className="tabular-nums"
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text-ivory)',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
            }}
          >
            {kpi.formatted}
          </div>

          {/* Change Pill vs Compare Period */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {kpi.changePercent !== null ? (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: kpi.isPositive ? '#10B981' : '#EF4444',
                }}
              >
                {kpi.changeDirection === 'UP' ? (
                  <ArrowUpRight size={13} />
                ) : kpi.changeDirection === 'DOWN' ? (
                  <ArrowDownRight size={13} />
                ) : null}
                {kpi.changePercent > 0 ? `+${kpi.changePercent}%` : `${kpi.changePercent}%`}
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Baseline</span>
            )}
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              vs {compareTo === 'PREVIOUS_YEAR' ? 'last year' : 'prev period'}
            </span>
          </div>
        </div>

        {/* Footer Subtext or Drilldown link */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '8px',
            marginTop: '12px',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <span>{kpi.subtext || 'Double-entry verified'}</span>
          {kpi.drillDownTab && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                color: 'var(--gold)',
                fontWeight: 600,
              }}
            >
              Open <ChevronRight size={12} />
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. Header Toolbar & Filters Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--text-ivory)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Dashboard: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Overview</span>
            </h1>
            <Badge variant="gold" size="xs">
              {activeCurrency} Real-Time Ledger
            </Badge>
            {summary?.cached && (
              <Badge variant="neutral" size="xs" title="Auto-invalidated on new journal entries">
                Cached
              </Badge>
            )}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px', marginBottom: 0 }}>
            Executive Real-Time Double-Entry Financial Command & Liquidity Overview
          </p>
        </div>

        {/* Date Filter & Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Preset Date Range Buttons */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '12px',
            }}
          >
            <Calendar size={13} color="var(--gold)" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {dateRange.from} – {dateRange.to}
            </span>
          </div>

          {/* Quick Date Presets */}
          <select
            value={
              dateRange.from === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
                ? 'MTD'
                : 'CUSTOM'
            }
            onChange={(e) => {
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const day = String(now.getDate()).padStart(2, '0');

              if (e.target.value === 'MTD') {
                setDateRange({ from: `${year}-${month}-01`, to: `${year}-${month}-${day}` });
              } else if (e.target.value === 'YTD') {
                setDateRange({ from: `${year}-01-01`, to: `${year}-${month}-${day}` });
              } else if (e.target.value === 'TODAY') {
                setDateRange({ from: `${year}-${month}-${day}`, to: `${year}-${month}-${day}` });
              }
            }}
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="MTD">This Month (MTD - Default)</option>
            <option value="TODAY">Today Only</option>
            <option value="YTD">This Year (YTD)</option>
          </select>

          {/* Compare Period Selector */}
          <select
            value={compareTo}
            onChange={(e) => setCompareTo(e.target.value as any)}
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="PREVIOUS_PERIOD">vs Previous Period</option>
            <option value="PREVIOUS_YEAR">vs Previous Year</option>
            <option value="NONE">No Comparison</option>
          </select>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            disabled={isLoading}
            title="Refresh live figures"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </Button>

          {/* 8. Demo Data Button: DEV ONLY & OWNER ONLY */}
          {showDemoDataButton && (
            <Button
              variant="gold"
              size="sm"
              onClick={handleSeedDemo}
              disabled={isSeedingDemo || isLoading}
              style={{
                backgroundColor: 'var(--gold)',
                color: '#0B1220',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
              }}
              title="Seed verified double-entry test transactions (Owner only)"
            >
              <Database size={13} />
              {isSeedingDemo ? 'Seeding...' : 'Seed Demo Data'}
            </Button>
          )}
        </div>
      </div>

      {/* 3. Unsupported Filters Notice Bar (Requirement 3) */}
      {summary?.unsupportedFilters && summary.unsupportedFilters.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 14px',
            backgroundColor: 'var(--surface-2)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Active Filter Scope:</span>

          {summary.unsupportedFilters.includes('branchId') && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--text-muted)',
                opacity: 0.8,
              }}
              title="Branch-level GL filtering requires multi-branch package activation."
            >
              <select disabled style={{ fontSize: '11px', padding: '2px 6px', opacity: 0.6 }}>
                <option>All Branches (Company-wide)</option>
              </select>
              <span>(Branch filter disabled: entity wide scope)</span>
            </span>
          )}

          {summary.unsupportedFilters.includes('currency') && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--text-muted)',
                opacity: 0.8,
              }}
              title="Multi-currency filtering requires foreign currency revaluation."
            >
              <select disabled style={{ fontSize: '11px', padding: '2px 6px', opacity: 0.6 }}>
                <option>Base Currency ({activeCurrency})</option>
              </select>
              <span>(Multi-currency filter disabled: functional currency only)</span>
            </span>
          )}
        </div>
      )}

      {/* Inventory Mismatch Alert (If any mismatch between stock balance and GL) */}
      {summary?.inventoryMismatch?.hasMismatch && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            color: '#F87171',
            fontSize: '13px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span>
              <strong>Inventory Reconciliation Discrepancy:</strong> Physical stock balance (
              {summary.inventoryMismatch.stockBalanceValue}) differs from General Ledger (
              {summary.inventoryMismatch.glValue}) by {summary.inventoryMismatch.difference}.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab?.('inventory')}
            style={{ fontSize: '11px', borderColor: '#F87171', color: '#F87171' }}
          >
            Reconcile Inventory
          </Button>
        </div>
      )}

      {/* System Error State Card (Requirement 6) */}
      {error && (
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>Failed to load dashboard summary</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{error}</div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSummary}>
            Try Again
          </Button>
        </div>
      )}

      {/* 6. Empty Ledger State ("Add your first sale") (Requirement 6) */}
      {!isLoading && summary && summary.recentJournalStream.length === 0 && (
        <Card
          style={{
            padding: '36px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--surface-2)',
            border: '1px dashed var(--gold)',
            borderRadius: '14px',
          }}
        >
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'rgba(212, 160, 44, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--gold)',
              }}
            >
              <BookOpen size={26} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-ivory)', marginBottom: '8px' }}>
              Add Your First Sale or Journal Voucher
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Your double-entry general ledger is initialized and balanced at 0. Record your opening balance, create a
              sales invoice, or post a journal entry to see live financial KPIs and analytics.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Button variant="gold" size="sm" onClick={() => onNavigateTab?.('general-ledger')}>
                Create Journal Voucher
              </Button>
              <Button variant="outline" size="sm" onClick={() => onNavigateTab?.('sales')}>
                Create Sales Invoice
              </Button>
              {showDemoDataButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSeedDemo}
                  disabled={isSeedingDemo}
                  style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
                >
                  <Database size={13} style={{ marginRight: '4px' }} />
                  {isSeedingDemo ? 'Seeding...' : 'Seed Sample Demo Data'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 4. 8-Card Glowing Executive KPI Matrix */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Row 1: Flow Metrics (Sales & Profit) */}
        {renderKpiCard(
          'todaySales',
          summary?.kpis.todaySales,
          <TrendingUp size={15} color="var(--gold)" />,
          'var(--gold)'
        )}
        {renderKpiCard(
          'mtdRevenue',
          summary?.kpis.mtdRevenue,
          <DollarSign size={15} color="#00E5FF" />,
          '#00E5FF'
        )}
        {renderKpiCard(
          'grossProfit',
          summary?.kpis.grossProfit,
          <Scale size={15} color="#10B981" />,
          '#10B981'
        )}
        {renderKpiCard(
          'netProfit',
          summary?.kpis.netProfit,
          <ShieldCheck size={15} color="#10B981" />,
          '#10B981'
        )}

        {/* Row 2: Cumulative Balance Sheet Metrics */}
        {renderKpiCard(
          'cashAndBank',
          summary?.kpis.cashAndBank,
          <Building2 size={15} color="#00E5FF" />,
          '#00E5FF'
        )}
        {renderKpiCard(
          'receivables',
          summary?.kpis.receivables,
          <ArrowDownRight size={15} color="#F59E0B" />,
          '#F59E0B'
        )}
        {renderKpiCard(
          'payables',
          summary?.kpis.payables,
          <ArrowUpRight size={15} color="#F97316" />,
          '#F97316'
        )}
        {renderKpiCard(
          'inventoryValuation',
          summary?.kpis.inventoryValuation,
          <Layers size={15} color="var(--gold)" />,
          'var(--gold)'
        )}
      </div>

      {/* 5. Financial Analytics Grid (Profitability, Taxes, Expenses) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '18px',
        }}
      >
        {/* Left: Monthly Revenue & Expense Trend (Area Chart) */}
        <Card className="erp-card-interactive" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-ivory)', margin: 0 }}>
                Monthly Financial Flow Trend
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>
                Sales Revenue vs Total Operating Expenses from General Ledger
              </p>
            </div>
            <Badge variant="neutral" size="xs">
              Live GL Flow
            </Badge>
          </div>

          <div style={{ width: '100%', height: '180px' }}>
            {summary?.salesAndPurchases.monthlyRevenueTrend &&
            summary.salesAndPurchases.monthlyRevenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={summary.salesAndPurchases.monthlyRevenueTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface-1)',
                      borderColor: 'var(--border-strong)',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [`${activeCurrency} ${val}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#00E5FF"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revenueGlow)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Expense"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expenseGlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                }}
              >
                No historical monthly figures yet
              </div>
            )}
          </div>
        </Card>

        {/* Right: Tax Position & VAT Settlement (Real Double-Entry GL 2020 / 1080) */}
        <Card className="erp-card-interactive" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={16} color="var(--gold)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-ivory)', margin: 0 }}>
                  Tax Position (VAT)
                </h3>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>
                {summary?.finance.taxPosition.taxPeriod || 'Current Statutory Tax Period'}
              </p>
            </div>
            <Badge variant="gold" size="xs">
              FTA VAT 5%
            </Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: 'var(--surface-3)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Output Tax Payable (Acct 2020):</span>
              <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--text-ivory)' }}>
                {activeCurrency} {summary?.finance.taxPosition.vatOutputPayable || '0.00'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: 'var(--surface-3)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Input Tax Recoverable (Acct 1080):</span>
              <span className="tabular-nums" style={{ fontWeight: 700, color: '#10B981' }}>
                {activeCurrency} {summary?.finance.taxPosition.vatInputRecoverable || '0.00'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border-card)',
                borderRadius: '8px',
                fontSize: '13px',
                marginTop: '4px',
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--text-ivory)' }}>Net VAT Payable / (Refund):</span>
              <span className="tabular-nums" style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '15px' }}>
                {activeCurrency} {summary?.finance.taxPosition.netVatPayable || '0.00'}
              </span>
            </div>
          </div>
        </Card>

        {/* Bottom Left: Honest Aging State (AR & AP) (Requirement 4) */}
        <Card className="erp-card-interactive" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-ivory)', margin: 0 }}>
                Aging Analysis (AR & AP)
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>
                Overdue receivables & payables aging breakdown
              </p>
            </div>
            <Badge variant="neutral" size="xs">
              Coming soon
            </Badge>
          </div>

          <div
            style={{
              padding: '24px 16px',
              backgroundColor: 'var(--surface-3)',
              borderRadius: '10px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Clock size={24} color="var(--text-muted)" />
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Available after Sales and Purchase bills are added
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, maxWidth: '320px' }}>
              Real overdue aging requires commercial invoice due dates and individual customer/supplier subledgers.
              Simulated or fabricated aging buckets are strictly prohibited.
            </p>
          </div>
        </Card>

        {/* Bottom Right: Top Expenses Breakdown (Native Chart) */}
        <Card className="erp-card-interactive" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-ivory)', margin: 0 }}>
                Top Expense Accounts
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>
                Highest expense debits from active general ledger
              </p>
            </div>
            <Badge variant="neutral" size="xs">
              GL Accounts
            </Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {summary?.salesAndPurchases.topExpenseCategories &&
            summary.salesAndPurchases.topExpenseCategories.length > 0 ? (
              summary.salesAndPurchases.topExpenseCategories.map((cat: any, idx: number) => (
                <div
                  key={cat.category + idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    backgroundColor: 'var(--surface-3)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: cat.color || 'var(--gold)',
                      }}
                    />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{cat.category}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {cat.percentage}
                    </span>
                    <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--text-ivory)' }}>
                      {activeCurrency} {cat.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                }}
              >
                No expense debits recorded in this period
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 7. Real-Time Double-Entry General Ledger Journal Voucher Stream */}
      <Card className="erp-card-interactive" style={{ padding: '20px 22px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="var(--gold)" />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-ivory)', margin: 0 }}>
                General Ledger Journal Voucher Stream
              </h2>
              <Badge variant="gold" size="xs">
                {filteredJournalStream.length} Recorded
              </Badge>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', marginBottom: 0 }}>
              Immutable audit log and live transaction feed for entity{' '}
              <strong style={{ color: 'var(--gold-hover)' }}>{storeSlug}</strong>
            </p>
          </div>

          {/* Filter and Search Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--surface-3)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 10px',
              }}
            >
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Filter vouchers..."
                value={streamSearch}
                onChange={(e) => setStreamSearch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  width: '130px',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {(['ALL', 'POSTED', 'DRAFT'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStreamStatus(st)}
                  style={{
                    backgroundColor: streamStatus === st ? 'var(--gold)' : 'var(--surface-3)',
                    color: streamStatus === st ? '#0B1220' : 'var(--text-secondary)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Journal Voucher Table */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
              minWidth: '680px',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  textAlign: 'left',
                }}
              >
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>VOUCHER NO</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>DATE</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>TYPE</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>DESCRIPTION</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'right' }}>DEBIT</th>
                <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'right' }}>CREDIT</th>
                <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'center' }}>LINES</th>
              </tr>
            </thead>
            <tbody>
              {filteredJournalStream.length > 0 ? (
                filteredJournalStream.map((item: any) => {
                  const isExpanded = !!expandedJournalRows[item.id];
                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => toggleJournalRow(item.id)}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          backgroundColor: isExpanded ? 'var(--surface-3)' : 'transparent',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '10px', fontFamily: 'monospace', color: 'var(--gold)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700 }}>{item.entryNumber}</span>
                            <button
                              type="button"
                              onClick={(e) => copyVoucherNumber(item.entryNumber, e)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                              }}
                              title="Copy voucher number"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{item.entryDate}</td>
                        <td style={{ padding: '10px' }}>
                          <Badge variant="neutral" size="xs">
                            {item.voucherType}
                          </Badge>
                        </td>
                        <td
                          style={{
                            padding: '10px',
                            color: 'var(--text-primary)',
                            maxWidth: '280px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.description}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <Badge
                            variant={item.status === 'POSTED' ? 'success' : 'neutral'}
                            size="xs"
                            dot={item.status === 'POSTED'}
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td
                          className="tabular-nums"
                          style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: 'var(--text-ivory)' }}
                        >
                          {activeCurrency} {item.totalDebit}
                        </td>
                        <td
                          className="tabular-nums"
                          style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: 'var(--text-ivory)' }}
                        >
                          {activeCurrency} {item.totalCredit}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', color: 'var(--gold)' }}>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </td>
                      </tr>

                      {/* Expanded Subledger Double-Entry Line Items */}
                      {isExpanded && item.lines && item.lines.length > 0 && (
                        <tr>
                          <td colSpan={8} style={{ padding: '12px 18px', backgroundColor: 'var(--surface-1)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold)', marginBottom: '8px' }}>
                              STRICT DOUBLE-ENTRY DEBIT & CREDIT JOURNAL LINES:
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                              <thead>
                                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                                  <th style={{ textAlign: 'left', padding: '4px' }}>ACCOUNT</th>
                                  <th style={{ textAlign: 'left', padding: '4px' }}>NAME</th>
                                  <th style={{ textAlign: 'left', padding: '4px' }}>MEMO</th>
                                  <th style={{ textAlign: 'right', padding: '4px' }}>DEBIT</th>
                                  <th style={{ textAlign: 'right', padding: '4px' }}>CREDIT</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.lines.map((line: any, idx: number) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td style={{ padding: '6px 4px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                                      {line.accountCode}
                                    </td>
                                    <td style={{ padding: '6px 4px', color: 'var(--text-primary)' }}>
                                      {line.accountName}
                                    </td>
                                    <td style={{ padding: '6px 4px', color: 'var(--text-secondary)' }}>
                                      {line.description || '—'}
                                    </td>
                                    <td
                                      className="tabular-nums"
                                      style={{
                                        padding: '6px 4px',
                                        textAlign: 'right',
                                        color: line.debit !== '0' && line.debit !== '0.00' ? 'var(--text-ivory)' : 'var(--text-muted)',
                                        fontWeight: line.debit !== '0' && line.debit !== '0.00' ? 700 : 400,
                                      }}
                                    >
                                      {activeCurrency} {line.debit}
                                    </td>
                                    <td
                                      className="tabular-nums"
                                      style={{
                                        padding: '6px 4px',
                                        textAlign: 'right',
                                        color: line.credit !== '0' && line.credit !== '0.00' ? 'var(--text-ivory)' : 'var(--text-muted)',
                                        fontWeight: line.credit !== '0' && line.credit !== '0.00' ? 700 : 400,
                                      }}
                                    >
                                      {activeCurrency} {line.credit}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: 'center',
                      padding: '28px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    No journal vouchers match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
