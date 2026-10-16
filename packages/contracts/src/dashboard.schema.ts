import { z } from 'zod';
import {
  BusinessPackSchema,
  BusinessHealthScoreSchema,
  SmartTipSchema,
  BusinessPackChecklistItemSchema,
  BusinessPackQuickActionSchema,
} from './business-pack.schema.js';

export const CompareToPeriodEnum = z.enum(['PREVIOUS_PERIOD', 'PREVIOUS_YEAR', 'NONE']);
export type CompareToPeriod = z.infer<typeof CompareToPeriodEnum>;

export const DashboardQueryFilterSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  compareTo: CompareToPeriodEnum.default('PREVIOUS_PERIOD'),
  branchId: z.string().optional().nullable(),
  costCenterId: z.string().optional().nullable(),
  currency: z.string().trim().length(3).optional(),
});

export type DashboardQueryFilter = z.infer<typeof DashboardQueryFilterSchema>;

export const DashboardKPICardSchema = z.object({
  label: z.string(),
  value: z.string(),
  formatted: z.string(),
  changePercent: z.number().nullable(),
  changeDirection: z.enum(['UP', 'DOWN', 'NEUTRAL']),
  isPositive: z.boolean(),
  sparkline: z.array(z.number()),
  drillDownTab: z.string(),
  locked: z.boolean().default(false),
  comingSoon: z.boolean().default(false),
  setupNeeded: z.boolean().default(false),
  tooltip: z.string().optional(),
  subtext: z.string().optional(),
});

export type DashboardKPICard = z.infer<typeof DashboardKPICardSchema>;

export const DashboardSummaryResponseSchema = z.object({
  currency: z.string(),
  period: z.object({
    from: z.string(),
    to: z.string(),
    compareFrom: z.string().optional(),
    compareTo: z.string().optional(),
  }),
  kpis: z.object({
    todaySales: DashboardKPICardSchema,
    mtdRevenue: DashboardKPICardSchema,
    grossProfit: DashboardKPICardSchema,
    netProfit: DashboardKPICardSchema,
    cashAndBank: DashboardKPICardSchema,
    receivables: DashboardKPICardSchema,
    payables: DashboardKPICardSchema,
    inventoryValuation: DashboardKPICardSchema,
    openOrders: DashboardKPICardSchema,
  }),
  actionCenter: z.object({
    pendingApprovalsCount: z.number(),
    unpostedDraftVouchersCount: z.number(),
    unreconciledBankCount: z.number(),
    lowStockAlertsCount: z.number(),
  }),
  finance: z.object({
    profitAndLoss: z.object({
      revenue: z.string(),
      cogs: z.string(),
      grossProfit: z.string(),
      expenses: z.string(),
      netProfit: z.string(),
      grossMarginPercent: z.string(),
      netMarginPercent: z.string(),
    }),
    cashFlowTrend: z.array(
      z.object({
        month: z.string(),
        inflow: z.number(),
        outflow: z.number(),
        net: z.number(),
      })
    ),
    bankAccounts: z.array(
      z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        balance: z.string(),
        currency: z.string(),
      })
    ),
    taxPosition: z.object({
      vatOutputPayable: z.string(),
      vatInputRecoverable: z.string(),
      netVatPayable: z.string(),
      taxPeriod: z.string(),
    }),
    keyRatios: z.object({
      currentRatio: z.string().nullable(),
      quickRatio: z.string().nullable(),
      workingCapital: z.string(),
    }),
    aging: z.object({
      arAvailable: z.boolean(),
      apAvailable: z.boolean(),
      reason: z.string(),
    }),
    budget: z.object({
      available: z.boolean(),
      status: z.string(),
      message: z.string(),
    }),
  }),
  salesAndPurchases: z.object({
    topExpenseCategories: z.array(
      z.object({
        category: z.string(),
        amount: z.number(),
        percentage: z.string(),
        color: z.string(),
      })
    ),
    monthlyRevenueTrend: z.array(
      z.object({
        month: z.string(),
        revenue: z.number(),
        expense: z.number(),
        profit: z.number(),
      })
    ),
    funnel: z.object({
      available: z.boolean(),
      status: z.string(),
      message: z.string(),
    }),
  }),
  alerts: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['CRITICAL', 'WARNING', 'INFO']),
      title: z.string(),
      message: z.string(),
      actionTab: z.string().optional(),
    })
  ),
  recentJournalStream: z.array(
    z.object({
      id: z.string(),
      entryNumber: z.string(),
      entryDate: z.string(),
      description: z.string(),
      voucherType: z.string(),
      status: z.string(),
      totalDebit: z.string(),
      totalCredit: z.string(),
      lines: z.array(
        z.object({
          accountCode: z.string(),
          accountName: z.string(),
          debit: z.string(),
          credit: z.string(),
          description: z.string().nullable().optional(),
        })
      ),
    })
  ),
  onboarding: z.object({
    companyProfile: z.boolean(),
    chartOfAccountsSeeded: z.boolean(),
    openingBalancePosted: z.boolean(),
    inventoryCatalogued: z.boolean(),
    completedSteps: z.number(),
    totalSteps: z.number(),
    allCompleted: z.boolean(),
  }),
  unsupportedFilters: z.array(z.string()).default([]),
  inventoryMismatch: z.object({
    hasMismatch: z.boolean(),
    stockBalanceValue: z.string(),
    glValue: z.string(),
    difference: z.string(),
  }),
  todayInOneLine: z.object({
    en: z.string(),
    bn: z.string(),
  }),
  healthScore: BusinessHealthScoreSchema,
  smartTips: z.array(SmartTipSchema).default([]),
  businessPacks: z.array(BusinessPackSchema).default([]),
  activePackIds: z.array(z.string()).default([]),
  mergedChecklist: z.array(BusinessPackChecklistItemSchema).default([]),
  mergedQuickActions: z.array(BusinessPackQuickActionSchema).default([]),
  cached: z.boolean(),
  generatedAt: z.string(),
});

export type DashboardSummaryResponseDto = z.infer<typeof DashboardSummaryResponseSchema>;
