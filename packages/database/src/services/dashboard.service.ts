import { Types } from 'mongoose';
import { Account } from '../models/Account.js';
import { JournalEntry } from '../models/JournalEntry.js';
import { GeneralLedger } from '../models/GeneralLedger.js';
import { StockBalance } from '../models/StockBalance.js';
import { Item } from '../models/Item.js';
import { ItemCategory } from '../models/ItemCategory.js';
import { Warehouse } from '../models/Warehouse.js';
import { UnitOfMeasure } from '../models/UnitOfMeasure.js';
import { Company } from '../models/Company.js';
import { TenantContext, validateTenantAccess } from './tenant.context.js';
import {
  getCachedDashboard,
  setCachedDashboard,
  invalidateCompanyDashboardCache,
} from './dashboard-cache.js';
import {
  DashboardQueryFilter,
  DashboardSummaryResponseDto,
  mergeBusinessPacks,
} from '@accounting/contracts';
import { toDecimal, roundHalfEven } from '@accounting/core';

export { invalidateCompanyDashboardCache };

export class DashboardService {
  /**
   * Generates real-time, zero-mock executive dashboard analytics
   * strictly derived from native MongoDB aggregations on posted General Ledger transactions
   * and tenant inventory balances.
   */
  async getDashboardSummary(
    companyId: string,
    filter: DashboardQueryFilter,
    context: TenantContext
  ): Promise<DashboardSummaryResponseDto> {
    validateTenantAccess(context, companyId);
    const companyObjId = new Types.ObjectId(companyId);

    // 1. Check In-Memory Cache (TTL: 120s fallback)
    const cacheKey = `dash:${companyId}:${filter.from || 'default'}:${filter.to || 'default'}:${filter.compareTo || 'prev'}:${filter.branchId || 'all'}:${filter.currency || 'base'}`;
    const cached = getCachedDashboard<DashboardSummaryResponseDto>(cacheKey);
    if (cached) {
      return {
        ...cached,
        cached: true,
      };
    }

    // 2. Load Company & Currency Info
    const company = await Company.findById(companyObjId).lean();
    const currency = filter.currency || company?.currency || 'AED';

    // Unsupported filters detection
    const unsupportedFilters: string[] = [];
    if (filter.branchId) {
      unsupportedFilters.push('branchId');
    }
    if (filter.currency && filter.currency !== (company?.currency || 'AED')) {
      unsupportedFilters.push('currency');
    }

    // 3. Resolve Date Ranges
    // toDate: Cumulative metrics (Cash, AR, AP, VAT, Inventory) up to this date
    let toDate: Date;
    if (filter.to) {
      toDate = new Date(filter.to);
      toDate.setHours(23, 59, 59, 999);
    } else {
      toDate = new Date();
    }

    // fromDate: Flow metrics (Revenue, COGS, Expenses) within from -> to
    let fromDate: Date;
    if (filter.from) {
      fromDate = new Date(filter.from);
      fromDate.setHours(0, 0, 0, 0);
    } else {
      fromDate = new Date(toDate.getFullYear(), toDate.getMonth(), 1, 0, 0, 0, 0);
    }

    // Today Date Range for Today's Sales
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Comparison Date Range (Previous period)
    const durationMs = Math.max(toDate.getTime() - fromDate.getTime(), 86400000);
    const compareToDate = new Date(fromDate.getTime() - 1);
    const compareFromDate = new Date(compareToDate.getTime() - durationMs);

    // 4. Load Accounts for Tenant & Filter by systemRole ONLY
    const accounts: any[] = await Account.find({ companyId: companyObjId, isActive: true }).lean();

    const cashAccounts = accounts.filter(
      (a) => a.systemRole === 'CASH' || a.systemRole === 'BANK'
    );
    const bankAccounts = accounts.filter((a) => a.systemRole === 'BANK');
    const arAccounts = accounts.filter((a) => a.systemRole === 'RECEIVABLE');
    const apAccounts = accounts.filter((a) => a.systemRole === 'PAYABLE');
    const vatOutputAccounts = accounts.filter((a) => a.systemRole === 'VAT_OUTPUT');
    const vatInputAccounts = accounts.filter((a) => a.systemRole === 'VAT_INPUT');
    const cogsAccounts = accounts.filter((a) => a.systemRole === 'COGS');
    const inventoryAccounts = accounts.filter((a) => a.systemRole === 'INVENTORY');
    const revenueAccounts = accounts.filter((a) => a.systemRole === 'REVENUE');
    const otherExpenseAccounts = accounts.filter(
      (a) => a.systemRole === 'EXPENSE' || (a.type === 'EXPENSE' && a.systemRole !== 'COGS')
    );

    // 5. MongoDB Aggregation Pipelines (Zero in-memory JavaScript raw line loops)
    const [
      cumulativeAggr,
      flowAggr,
      todayAggr,
      compareCumAggr,
      compareFlowAggr,
      stockBalanceAggr,
    ] = await Promise.all([
      // A. Cumulative Totals up to toDate
      GeneralLedger.aggregate([
        { $match: { companyId: companyObjId, entryDate: { $lte: toDate } } },
        {
          $group: {
            _id: '$accountId',
            totalDebit: { $sum: { $toDecimal: '$debit' } },
            totalCredit: { $sum: { $toDecimal: '$credit' } },
          },
        },
      ]),
      // B. Flow Totals between fromDate and toDate
      GeneralLedger.aggregate([
        { $match: { companyId: companyObjId, entryDate: { $gte: fromDate, $lte: toDate } } },
        {
          $group: {
            _id: '$accountId',
            totalDebit: { $sum: { $toDecimal: '$debit' } },
            totalCredit: { $sum: { $toDecimal: '$credit' } },
          },
        },
      ]),
      // C. Today's Flow Totals
      GeneralLedger.aggregate([
        { $match: { companyId: companyObjId, entryDate: { $gte: startOfToday, $lte: endOfToday } } },
        {
          $group: {
            _id: '$accountId',
            totalDebit: { $sum: { $toDecimal: '$debit' } },
            totalCredit: { $sum: { $toDecimal: '$credit' } },
          },
        },
      ]),
      // D. Comparison Cumulative Totals up to compareToDate
      GeneralLedger.aggregate([
        { $match: { companyId: companyObjId, entryDate: { $lte: compareToDate } } },
        {
          $group: {
            _id: '$accountId',
            totalDebit: { $sum: { $toDecimal: '$debit' } },
            totalCredit: { $sum: { $toDecimal: '$credit' } },
          },
        },
      ]),
      // E. Comparison Flow Totals
      GeneralLedger.aggregate([
        { $match: { companyId: companyObjId, entryDate: { $gte: compareFromDate, $lte: compareToDate } } },
        {
          $group: {
            _id: '$accountId',
            totalDebit: { $sum: { $toDecimal: '$debit' } },
            totalCredit: { $sum: { $toDecimal: '$credit' } },
          },
        },
      ]),
      // F. Perpetual Stock Balance Aggregate
      StockBalance.aggregate([
        { $match: { companyId: companyObjId } },
        { $group: { _id: null, totalValuation: { $sum: { $toDecimal: '$totalValuation' } } } },
      ]),
    ]);

    // Fast O(1) Lookup Maps
    const toBalanceMap = (items: any[]) => {
      const map = new Map<string, { dr: any; cr: any }>();
      for (const item of items) {
        map.set(item._id.toString(), {
          dr: toDecimal(item.totalDebit.toString()),
          cr: toDecimal(item.totalCredit.toString()),
        });
      }
      return map;
    };

    const cumMap = toBalanceMap(cumulativeAggr);
    const flowMap = toBalanceMap(flowAggr);
    const todayMap = toBalanceMap(todayAggr);
    const compCumMap = toBalanceMap(compareCumAggr);
    const compFlowMap = toBalanceMap(compareFlowAggr);

    // Calculation Helper Functions
    // Net Debit (Assets, Expenses): Debit - Credit
    const sumNetDebit = (accts: any[], map: Map<string, { dr: any; cr: any }>) => {
      let sum = toDecimal(0);
      for (const a of accts) {
        const val = map.get(a._id.toString());
        if (val) {
          sum = sum.plus(val.dr.minus(val.cr));
        }
      }
      return sum;
    };

    // Net Credit (Liabilities, Equity, Revenue): Credit - Debit
    const sumNetCredit = (accts: any[], map: Map<string, { dr: any; cr: any }>) => {
      let sum = toDecimal(0);
      for (const a of accts) {
        const val = map.get(a._id.toString());
        if (val) {
          sum = sum.plus(val.cr.minus(val.dr));
        }
      }
      return sum;
    };

    // 6. Calculate Metrics (Cumulative vs Flow strictly respected)
    // A. Revenue & Flow
    const todaySalesDec = sumNetCredit(revenueAccounts, todayMap);
    const mtdRevenueDec = sumNetCredit(revenueAccounts, flowMap);
    const cogsDec = sumNetDebit(cogsAccounts, flowMap);
    const otherExpensesDec = sumNetDebit(otherExpenseAccounts, flowMap);

    // Rule A-2: COGS is subtracted once! Gross = Revenue - COGS. Net = Gross - Other Expenses.
    const grossProfitDec = mtdRevenueDec.minus(cogsDec);
    const netProfitDec = grossProfitDec.minus(otherExpensesDec);

    // Comparison Flow Metrics
    const compMtdRevenueDec = sumNetCredit(revenueAccounts, compFlowMap);
    const compCogsDec = sumNetDebit(cogsAccounts, compFlowMap);
    const compGrossProfitDec = compMtdRevenueDec.minus(compCogsDec);
    const compOtherExpensesDec = sumNetDebit(otherExpenseAccounts, compFlowMap);
    const compNetProfitDec = compGrossProfitDec.minus(compOtherExpensesDec);

    // B. Cumulative Balance Metrics (start of company to toDate)
    const cashAndBankDec = sumNetDebit(cashAccounts, cumMap);
    const receivablesDec = sumNetDebit(arAccounts, cumMap);
    const payablesDec = sumNetCredit(apAccounts, cumMap);
    const vatOutputDec = sumNetCredit(vatOutputAccounts, cumMap);
    const vatInputDec = sumNetDebit(vatInputAccounts, cumMap);
    const netVatDec = vatOutputDec.minus(vatInputDec);
    const glInventoryDec = sumNetDebit(inventoryAccounts, cumMap);

    // Comparison Cumulative Metrics
    const compCashAndBankDec = sumNetDebit(cashAccounts, compCumMap);
    const compReceivablesDec = sumNetDebit(arAccounts, compCumMap);
    const compPayablesDec = sumNetCredit(apAccounts, compCumMap);

    // C. Physical Inventory Valuation & Mismatch Detection
    const stockValuationDec = stockBalanceAggr[0]?.totalValuation
      ? toDecimal(stockBalanceAggr[0].totalValuation.toString())
      : toDecimal(0);

    const hasMismatch = !stockValuationDec.equals(glInventoryDec);
    const inventoryMismatch = {
      hasMismatch,
      stockBalanceValue: stockValuationDec.toFixed(2),
      glValue: glInventoryDec.toFixed(2),
      difference: stockValuationDec.minus(glInventoryDec).abs().toFixed(2),
    };

    // Inventory Valuation Card value: Uses StockBalance if available, otherwise GL Inventory
    const activeInventoryValuationDec = stockValuationDec.gt(0)
      ? stockValuationDec
      : glInventoryDec;

    // Working Capital: Current Assets (Cash + AR + Inventory) - Current Liabilities (AP + VAT Out)
    const currentAssetsDec = cashAndBankDec.plus(receivablesDec).plus(activeInventoryValuationDec);
    const currentLiabilitiesDec = payablesDec.plus(vatOutputDec);
    const workingCapitalDec = currentAssetsDec.minus(currentLiabilitiesDec);

    // Key Ratios
    const currentRatio = currentLiabilitiesDec.gt(0)
      ? currentAssetsDec.dividedBy(currentLiabilitiesDec).toFixed(2)
      : null;
    const quickAssetsDec = cashAndBankDec.plus(receivablesDec);
    const quickRatio = currentLiabilitiesDec.gt(0)
      ? quickAssetsDec.dividedBy(currentLiabilitiesDec).toFixed(2)
      : null;

    // Margin Percentages
    const grossMarginPercent = mtdRevenueDec.gt(0)
      ? grossProfitDec.dividedBy(mtdRevenueDec).times(100).toFixed(1) + '%'
      : '0.0%';
    const netMarginPercent = mtdRevenueDec.gt(0)
      ? netProfitDec.dividedBy(mtdRevenueDec).times(100).toFixed(1) + '%'
      : '0.0%';

    // Percent Change Calculator
    const calcChange = (curr: any, prev: any) => {
      if (!prev || prev.isZero()) return null;
      return roundHalfEven(curr.minus(prev).dividedBy(prev).times(100), 1).toNumber();
    };

    // KPI Builder with Friendly Labels, Tooltips, and Setup Needed Fallback
    const buildKpi = (
      label: string,
      decValue: any,
      prevDec: any,
      drillDownTab: string,
      tooltip: string,
      isAccountMapped: boolean,
      subtext?: string
    ) => {
      if (!isAccountMapped) {
        return {
          label,
          value: 'Setup needed',
          formatted: 'Setup needed',
          changePercent: null,
          changeDirection: 'NEUTRAL' as const,
          isPositive: false,
          sparkline: [0, 0, 0, 0, 0],
          drillDownTab,
          locked: false,
          comingSoon: false,
          setupNeeded: true,
          tooltip,
          subtext: 'Assign systemRole to chart of accounts',
        };
      }

      const val = roundHalfEven(decValue, 2);
      const chg = calcChange(decValue, prevDec);
      const isPos = decValue.gte(0);
      const dir = chg === null ? 'NEUTRAL' : chg > 0 ? 'UP' : chg < 0 ? 'DOWN' : 'NEUTRAL';

      return {
        label,
        value: val.toString(),
        formatted: `${currency} ${val.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        changePercent: chg,
        changeDirection: dir as 'UP' | 'DOWN' | 'NEUTRAL',
        isPositive: isPos,
        sparkline: [
          prevDec ? prevDec.toNumber() : 0,
          val.toNumber(),
        ],
        drillDownTab,
        locked: false,
        comingSoon: false,
        setupNeeded: false,
        tooltip,
        subtext,
      };
    };

    const kpis = {
      todaySales: buildKpi(
        "Today's Sales",
        todaySalesDec,
        null,
        'sales',
        'Total money made from sales today',
        revenueAccounts.length > 0,
        "Today's billed turnover"
      ),
      mtdRevenue: buildKpi(
        'Monthly Sales',
        mtdRevenueDec,
        compMtdRevenueDec,
        'sales',
        'Total money earned from sales this month',
        revenueAccounts.length > 0,
        'Month-to-date sales'
      ),
      grossProfit: buildKpi(
        'Profit Before Expenses',
        grossProfitDec,
        compGrossProfitDec,
        'reports',
        'Sales money left after paying for goods sold',
        revenueAccounts.length > 0 && cogsAccounts.length > 0,
        `Margin: ${grossMarginPercent}`
      ),
      netProfit: buildKpi(
        'Final Profit',
        netProfitDec,
        compNetProfitDec,
        'reports',
        'Actual profit earned after all costs and expenses',
        revenueAccounts.length > 0,
        `Net: ${netMarginPercent}`
      ),
      cashAndBank: buildKpi(
        'Money Available',
        cashAndBankDec,
        compCashAndBankDec,
        'banking',
        'Cash in hand and operating bank balances ready to spend',
        cashAccounts.length > 0,
        'Treasury balance'
      ),
      receivables: buildKpi(
        'Money to Receive',
        receivablesDec,
        compReceivablesDec,
        'sales',
        'Total amount customers owe you from sales',
        arAccounts.length > 0,
        'Outstanding customer balances'
      ),
      payables: buildKpi(
        'Money to Pay',
        payablesDec,
        compPayablesDec,
        'purchases',
        'Total amount you owe to suppliers and vendors',
        apAccounts.length > 0,
        'Outstanding supplier balances'
      ),
      inventoryValuation: buildKpi(
        'Stock Value',
        activeInventoryValuationDec,
        null,
        'inventory',
        'Total value of unsold items in your inventory',
        inventoryAccounts.length > 0 || stockValuationDec.gt(0),
        hasMismatch ? 'Reconciliation needed' : 'Perpetual stock valuation'
      ),
      openOrders: {
        label: 'Pending Orders',
        value: '0',
        formatted: `${currency} 0.00`,
        changePercent: null,
        changeDirection: 'NEUTRAL' as const,
        isPositive: true,
        sparkline: [0, 0],
        drillDownTab: 'sales',
        locked: true,
        comingSoon: true,
        setupNeeded: false,
        tooltip: 'Orders awaiting delivery or invoice generation',
        subtext: 'Available after sales order module activation',
      },
    };

    // 7. Action Center Counts
    const [
      pendingVouchersCount,
      lowStockCount,
      allVouchersCount,
    ] = await Promise.all([
      JournalEntry.countDocuments({ companyId: companyObjId, status: 'DRAFT' }),
      StockBalance.countDocuments({ companyId: companyObjId, quantity: { $lte: 5 } }),
      JournalEntry.countDocuments({ companyId: companyObjId }),
    ]);

    // 8. Alerts
    const alerts: any[] = [];
    if (pendingVouchersCount > 0) {
      alerts.push({
        id: 'draft-vouchers',
        type: 'INFO',
        title: 'Draft entries pending review',
        message: `${pendingVouchersCount} voucher draft(s) awaiting approval and posting.`,
        actionTab: 'ledger',
      });
    }

    if (hasMismatch && (stockValuationDec.gt(0) || glInventoryDec.gt(0))) {
      alerts.push({
        id: 'inv-mismatch',
        type: 'WARNING',
        title: 'Inventory valuation difference detected',
        message: `Physical stock value (${currency} ${stockValuationDec.toFixed(2)}) differs from General Ledger (${currency} ${glInventoryDec.toFixed(2)}) by ${currency} ${inventoryMismatch.difference}. Reconciliation entry recommended.`,
        actionTab: 'inventory',
      });
    }

    // 9. Recent Journal Stream (Real POSTED double-entry records)
    const recentJournals = await JournalEntry.find({
      companyId: companyObjId,
      status: 'POSTED',
    })
      .sort({ entryDate: -1, createdAt: -1 })
      .limit(10)
      .lean();

    const recentJournalStream = recentJournals.map((j: any) => ({
      id: j._id.toString(),
      entryNumber: j.entryNumber,
      entryDate: j.entryDate ? new Date(j.entryDate).toISOString().slice(0, 10) : '',
      description: j.description || '',
      voucherType: j.voucherType || 'JOURNAL',
      status: j.status,
      totalDebit: j.totalDebit ? j.totalDebit.toString() : '0.00',
      totalCredit: j.totalCredit ? j.totalCredit.toString() : '0.00',
      lines: (j.lines || []).map((l: any) => ({
        accountCode: l.accountCode,
        accountName: l.accountName,
        debit: l.debit ? l.debit.toString() : '0.00',
        credit: l.credit ? l.credit.toString() : '0.00',
        description: l.description || null,
      })),
    }));

    // 10. Bank Accounts List
    const bankAccountList = bankAccounts.map((b) => {
      const bBal = cumMap.get(b._id.toString());
      const net = bBal ? bBal.dr.minus(bBal.cr) : toDecimal(0);
      return {
        id: b._id.toString(),
        code: b.code,
        name: b.name,
        balance: `${currency} ${net.toFixed(2)}`,
        currency: b.currency || currency,
      };
    });

    // 10. Multi-Pack Merging (Deduplicated KPIs & widgets, modular actions)
    const activePacks = company?.businessTypes && company.businessTypes.length > 0
      ? company.businessTypes
      : ['retail'];
    const businessPacksResult = mergeBusinessPacks(activePacks, company?.enabledModules || ['accounting']);

    // 11. "Today in One Line" (Dynamic real-data sentence in English & Bengali)
    const todayInOneLine = {
      en: todaySalesDec.gt(0)
        ? `Today you made ${currency} ${todaySalesDec.toFixed(2)} in total revenue across operations.`
        : mtdRevenueDec.gt(0)
        ? `No new transactions posted today. Month-to-date revenue stands at ${currency} ${mtdRevenueDec.toFixed(2)}.`
        : `Welcome to your business dashboard. Post your first voucher to view real-time metrics.`,
      bn: todaySalesDec.gt(0)
        ? `আজ আপনি মোট ${currency} ${todaySalesDec.toFixed(2)} বিক্রি করেছেন।`
        : mtdRevenueDec.gt(0)
        ? `আজ এখনো কোনো নতুন লেনদেন রেকর্ড হয়নি। চলতি মাসে মোট বিক্রি ${currency} ${mtdRevenueDec.toFixed(2)}।`
        : `আপনার ব্যবসায়িক ড্যাশবোর্ডে স্বাগতম। লাইভ ট্রেন্ড দেখতে আপনার প্রথম লেনদেন রেকর্ড করুন।`,
    };

    // 12. Business Health Score (0–100 Transparent Model or needMoreData fallback)
    const needMoreData = allVouchersCount === 0 || (mtdRevenueDec.isZero() && otherExpensesDec.isZero() && cogsDec.isZero());
    let healthScore: any;
    if (needMoreData) {
      healthScore = {
        score: null,
        status: 'warning' as const,
        grade: null,
        needMoreData: true,
        messageEn: 'More transaction history needed to calculate a reliable business health score.',
        messageBn: 'নির্ভরযোগ্য বিজনেস হেলথ স্কোর নির্ধারণ করতে আরও লেনদেনের তথ্য প্রয়োজন।',
        indicators: [],
      };
    } else {
      const monthlyOutflow = otherExpensesDec.plus(cogsDec);
      const liquidityRatio = monthlyOutflow.gt(0) ? cashAndBankDec.dividedBy(monthlyOutflow).toNumber() : 2.5;
      const liquidityScore = liquidityRatio >= 2.0 ? 25 : liquidityRatio >= 1.0 ? 18 : liquidityRatio >= 0.5 ? 10 : 5;

      const netMarginNum = netProfitDec.gt(0) && mtdRevenueDec.gt(0) ? netProfitDec.dividedBy(mtdRevenueDec).times(100).toNumber() : 0;
      const profitScore = netMarginNum >= 20 ? 25 : netMarginNum >= 10 ? 20 : netMarginNum > 0 ? 15 : 5;

      const arRatio = mtdRevenueDec.gt(0) ? receivablesDec.dividedBy(mtdRevenueDec).toNumber() : (receivablesDec.isZero() ? 0 : 3);
      const arScore = arRatio <= 0.5 ? 25 : arRatio <= 1.0 ? 18 : arRatio <= 2.0 ? 10 : 5;

      const integrityScore = inventoryMismatch.hasMismatch ? 10 : 25;
      const totalScore = liquidityScore + profitScore + arScore + integrityScore;
      const status = totalScore >= 70 ? 'good' : totalScore >= 50 ? 'warning' : 'critical';
      const grade = totalScore >= 80 ? 'A' : totalScore >= 60 ? 'B' : totalScore >= 40 ? 'C' : 'D';

      healthScore = {
        score: totalScore,
        status,
        grade,
        needMoreData: false,
        messageEn: `Business health is rated ${status.toUpperCase()} based on real ledger liquidity, profitability, and receivables ratios.`,
        messageBn: `নগদ তারল্য, মুনাফা এবং বকেয়া আদায়ের হিসাবের ওপর ভিত্তি করে সার্বিক ব্যবসায়িক স্বাস্থ্য মূল্যায়ন করা হয়েছে।`,
        indicators: [
          {
            nameEn: 'Cash Runway & Liquidity',
            nameBn: 'নগদ তারল্য ও সুরক্ষা',
            weight: 25,
            score: liquidityScore,
            status: liquidityScore >= 18 ? 'good' : liquidityScore >= 10 ? 'warning' : 'critical',
            valueFormatted: `${liquidityRatio.toFixed(1)}x expenses`,
            explanationEn: 'Evaluates cash & bank reserves against operating monthly outflow.',
            explanationBn: 'মাসিক খরচের বিপরীতে হাতে থাকা নগদ টাকার অনুপাত।',
          },
          {
            nameEn: 'Operating Profitability',
            nameBn: 'পরিচালন মুনাফা',
            weight: 25,
            score: profitScore,
            status: profitScore >= 20 ? 'good' : profitScore >= 15 ? 'warning' : 'critical',
            valueFormatted: `${netMarginNum.toFixed(1)}% margin`,
            explanationEn: 'Evaluates bottom-line net profit margin efficiency.',
            explanationBn: 'মোট আয়ের কত শতাংশ নিট মুনাফা হিসেবে থাকে।',
          },
          {
            nameEn: 'Receivables Discipline',
            nameBn: 'বকেয়া আদায়ের শৃঙ্খলা',
            weight: 25,
            score: arScore,
            status: arScore >= 18 ? 'good' : arScore >= 10 ? 'warning' : 'critical',
            valueFormatted: `${arRatio.toFixed(1)}x monthly revenue`,
            explanationEn: 'Evaluates outstanding accounts receivable relative to sales flow.',
            explanationBn: 'মাসিক বিক্রির বিপরীতে বাকি থাকা পাওনা টাকার অনুপাত।',
          },
          {
            nameEn: 'Ledger & Stock Integrity',
            nameBn: 'খতিয়ান ও স্টক মিল',
            weight: 25,
            score: integrityScore,
            status: integrityScore === 25 ? 'good' : 'warning',
            valueFormatted: inventoryMismatch.hasMismatch ? `${currency} ${inventoryMismatch.difference} variance` : 'Fully Reconciled',
            explanationEn: 'Validates that perpetual inventory matches GL balance.',
            explanationBn: 'ইনভেন্টরি স্টক ভ্যালুয়েশন ও খতিয়ানের মোট মিল।',
          },
        ],
      };
    }

    // 13. Rule-Based Smart Tips (Zero fake numbers, real GL values only)
    const smartTips: any[] = [];
    if (receivablesDec.gt(0)) {
      smartTips.push({
        id: 'tip-ar',
        type: 'warning' as const,
        ruleName: 'Outstanding Accounts Receivable > 0',
        messageEn: `You have ${currency} ${receivablesDec.toFixed(2)} in uncollected customer receivables. Active collection follow-up will boost liquidity.`,
        messageBn: `আপনার ${currency} ${receivablesDec.toFixed(2)} বকেয়া পাওনা রয়েছে। দ্রুত আদায় নিশ্চিত করলে চলতি মূলধন বৃদ্ধি পাবে।`,
        actualNumbers: { receivables: receivablesDec.toNumber() },
      });
    }
    if (cashAndBankDec.gt(0) && otherExpensesDec.gt(0)) {
      const monthsCovered = cashAndBankDec.dividedBy(otherExpensesDec).toFixed(1);
      smartTips.push({
        id: 'tip-liquidity',
        type: cashAndBankDec.gt(otherExpensesDec) ? ('info' as const) : ('warning' as const),
        ruleName: 'Cash Reserves vs Monthly Operating Overhead',
        messageEn: `Current cash & bank balance of ${currency} ${cashAndBankDec.toFixed(2)} covers approximately ${monthsCovered} months of operational expenses.`,
        messageBn: `হাতে থাকা নগদ ও ব্যাংক ব্যালেন্স (${currency} ${cashAndBankDec.toFixed(2)}) দিয়ে আনুমানিক ${monthsCovered} মাসের পরিচালন ব্যয় মেটানো সম্ভব।`,
        actualNumbers: { cash: cashAndBankDec.toNumber(), expenses: otherExpensesDec.toNumber() },
      });
    }
    if (lowStockCount > 0) {
      smartTips.push({
        id: 'tip-stock',
        type: 'warning' as const,
        ruleName: 'Low Stock Threshold Reached',
        messageEn: `${lowStockCount} inventory items have hit minimum safety stock levels. Place purchase orders soon to prevent stockouts.`,
        messageBn: `${lowStockCount}টি পণ্যের স্টক শেষ পর্যায়ে এসেছে। সরবরাহ নিশ্চিত করতে নতুন ক্রয়াদের দিন।`,
        actualNumbers: { lowStockCount },
      });
    }
    if (vatOutputDec.gt(vatInputDec)) {
      smartTips.push({
        id: 'tip-vat',
        type: 'info' as const,
        ruleName: 'Net Statutory VAT Position',
        messageEn: `Estimated net VAT payable is ${currency} ${netVatDec.toFixed(2)} for the current tax period.`,
        messageBn: `চলতি মেয়াদের জন্য আনুমানিক নিট ভ্যাট প্রদেয় ${currency} ${netVatDec.toFixed(2)}।`,
        actualNumbers: { netVat: netVatDec.toNumber() },
      });
    }

    const response: DashboardSummaryResponseDto = {
      currency,
      period: {
        from: fromDate.toISOString().slice(0, 10),
        to: toDate.toISOString().slice(0, 10),
        compareFrom: compareFromDate.toISOString().slice(0, 10),
        compareTo: compareToDate.toISOString().slice(0, 10),
      },
      todayInOneLine,
      healthScore,
      smartTips,
      businessPacks: businessPacksResult.activePacks,
      activePackIds: activePacks,
      mergedChecklist: businessPacksResult.checklist,
      mergedQuickActions: businessPacksResult.quickActions,
      kpis,
      actionCenter: {
        pendingApprovalsCount: 0,
        unpostedDraftVouchersCount: pendingVouchersCount,
        unreconciledBankCount: 0,
        lowStockAlertsCount: lowStockCount,
      },
      finance: {
        profitAndLoss: {
          revenue: mtdRevenueDec.toFixed(2),
          cogs: cogsDec.toFixed(2),
          grossProfit: grossProfitDec.toFixed(2),
          expenses: otherExpensesDec.toFixed(2),
          netProfit: netProfitDec.toFixed(2),
          grossMarginPercent,
          netMarginPercent,
        },
        cashFlowTrend: [
          {
            month: 'Current Period',
            inflow: mtdRevenueDec.toNumber(),
            outflow: otherExpensesDec.plus(cogsDec).toNumber(),
            net: netProfitDec.toNumber(),
          },
        ],
        bankAccounts: bankAccountList,
        taxPosition: {
          vatOutputPayable: vatOutputDec.toFixed(2),
          vatInputRecoverable: vatInputDec.toFixed(2),
          netVatPayable: netVatDec.toFixed(2),
          taxPeriod: `${fromDate.toISOString().slice(0, 10)} - ${toDate.toISOString().slice(0, 10)}`,
        },
        keyRatios: {
          currentRatio,
          quickRatio,
          workingCapital: `${currency} ${workingCapitalDec.toFixed(2)}`,
        },
        aging: {
          arAvailable: false,
          apAvailable: false,
          reason: 'Available after Sales and Purchase bills are added',
        },
        budget: {
          available: false,
          status: 'COMING_SOON',
          message: 'Available after budgeting is configured',
        },
      },
      salesAndPurchases: {
        topExpenseCategories: otherExpenseAccounts.slice(0, 5).map((acc, idx) => {
          const val = flowMap.get(acc._id.toString());
          const net = val ? val.dr.minus(val.cr) : toDecimal(0);
          const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];
          return {
            category: acc.name,
            amount: net.toNumber(),
            percentage: otherExpensesDec.gt(0)
              ? net.dividedBy(otherExpensesDec).times(100).toFixed(1) + '%'
              : '0.0%',
            color: colors[idx % colors.length],
          };
        }),
        monthlyRevenueTrend: [
          {
            month: 'Current Period',
            revenue: mtdRevenueDec.toNumber(),
            expense: otherExpensesDec.plus(cogsDec).toNumber(),
            profit: netProfitDec.toNumber(),
          },
        ],
        funnel: {
          available: false,
          status: 'COMING_SOON',
          message: 'Available after sales quotation features are activated',
        },
      },
      alerts,
      recentJournalStream,
      onboarding: {
        companyProfile: true,
        chartOfAccountsSeeded: accounts.length >= 5,
        openingBalancePosted: allVouchersCount > 0,
        inventoryCatalogued: stockValuationDec.gt(0),
        completedSteps: (accounts.length >= 5 ? 1 : 0) + (allVouchersCount > 0 ? 2 : 0) + 1,
        totalSteps: 4,
        allCompleted: accounts.length >= 5 && allVouchersCount > 0,
      },
      unsupportedFilters,
      inventoryMismatch,
      cached: false,
      generatedAt: new Date().toISOString(),
    };

    // Save in Cache
    setCachedDashboard(cacheKey, response, 120);

    return response;
  }

  /**
   * Seeds 7 fully balanced double-entry commercial vouchers
   * with strict Owner-only role, non-production enforcement, idempotency,
   * and dates anchored to today.
   */
  async seedRealDemoJournals(companyId: string, context: TenantContext) {
    validateTenantAccess(context, companyId);

    // Rule A-1: Owner Only
    if (context.role !== 'owner') {
      throw new Error('Only company owners are permitted to initialize demonstration records.');
    }

    // Rule A-1: Non-production Only
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Demonstration data seeding is disabled in production environments.');
    }

    const companyObjId = new Types.ObjectId(companyId);
    const company = await Company.findById(companyObjId);
    if (!company) {
      throw new Error('Target company not found.');
    }

    // Rule A-1: Idempotency check
    const existingSeed = await JournalEntry.findOne({
      companyId: companyObjId,
      entryNumber: 'JV-2026-00001',
    });
    if (existingSeed) {
      return {
        vouchersCreated: 0,
        alreadySeeded: true,
        message: 'Demonstration records already initialized (idempotent).',
      };
    }

    // Rule A-1: Refuse if other POSTED entries already exist
    const postedCount = await JournalEntry.countDocuments({
      companyId: companyObjId,
      status: 'POSTED',
    });
    if (postedCount > 0) {
      throw new Error(
        'Company already contains posted journal transactions. Demonstration seeding refused.'
      );
    }

    // Ensure Accounts exist with strict systemRole mapping
    const ensureAccount = async (
      code: string,
      name: string,
      type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE',
      systemRole: any
    ) => {
      let acc = await Account.findOne({ companyId: companyObjId, code });
      if (!acc) {
        acc = new Account({
          companyId: companyObjId,
          code,
          name,
          type,
          systemRole,
          normalBalance: type === 'ASSET' || type === 'EXPENSE' ? 'DEBIT' : 'CREDIT',
          isActive: true,
          isSystem: true,
          currency: company.currency || 'AED',
        });
        await acc.save();
      } else if (!acc.systemRole) {
        acc.systemRole = systemRole;
        await acc.save();
      }
      return acc;
    };

    const [
      accCash,
      accBank,
      accAR,
      accInventory,
      accAP,
      accVatOut,
      accVatIn,
      accCapital,
      accRevenue,
      accCOGS,
      accRent,
    ] = await Promise.all([
      ensureAccount('1010', 'Cash on Hand', 'ASSET', 'CASH'),
      ensureAccount('1020', 'Operating Bank Account', 'ASSET', 'BANK'),
      ensureAccount('1200', 'Trade Accounts Receivable', 'ASSET', 'RECEIVABLE'),
      ensureAccount('1300', 'Merchandise Inventory Asset', 'ASSET', 'INVENTORY'),
      ensureAccount('2010', 'Trade Accounts Payable', 'LIABILITY', 'PAYABLE'),
      ensureAccount('2210', 'VAT Output Tax Payable', 'LIABILITY', 'VAT_OUTPUT'),
      ensureAccount('2220', 'VAT Input Tax Recoverable', 'ASSET', 'VAT_INPUT'),
      ensureAccount('3010', "Owner's Capital", 'EQUITY', 'EQUITY'),
      ensureAccount('4010', 'Commercial Sales Revenue', 'REVENUE', 'REVENUE'),
      ensureAccount('5010', 'Cost of Goods Sold', 'EXPENSE', 'COGS'),
      ensureAccount('5020', 'Commercial Office Rent', 'EXPENSE', 'EXPENSE'),
    ]);

    // Ensure Warehouse, Item, and StockBalance exist to match 25,000 Inventory
    let defaultWarehouse = await Warehouse.findOne({ companyId: companyObjId, isDefault: true });
    if (!defaultWarehouse) {
      defaultWarehouse = new Warehouse({
        companyId: companyObjId,
        code: 'WH-MAIN',
        name: 'Main Central Logistics Warehouse',
        isDefault: true,
        isActive: true,
      });
      await defaultWarehouse.save();
    }

    let defaultUom = await UnitOfMeasure.findOne({ companyId: companyObjId, code: 'PCS' });
    if (!defaultUom) {
      defaultUom = new UnitOfMeasure({
        companyId: companyObjId,
        code: 'PCS',
        name: 'Pieces',
        isDefault: true,
        isActive: true,
      });
      await defaultUom.save();
    }

    let defaultCategory = await ItemCategory.findOne({ companyId: companyObjId, isDefault: true });
    if (!defaultCategory) {
      defaultCategory = new ItemCategory({
        companyId: companyObjId,
        code: 'CAT-GEN',
        name: 'General Commercial Merchandise',
        isDefault: true,
        isActive: true,
      });
      await defaultCategory.save();
    }

    let demoItem = await Item.findOne({ companyId: companyObjId, sku: 'DEMO-SKU-001' });
    if (!demoItem) {
      demoItem = new Item({
        companyId: companyObjId,
        sku: 'DEMO-SKU-001',
        name: 'Commercial Wholesale Inventory Asset',
        categoryId: defaultCategory._id,
        baseUomId: defaultUom._id,
        costPrice: Types.Decimal128.fromString('500.00'),
        sellingPrice: Types.Decimal128.fromString('1050.00'),
        isActive: true,
      });
      await demoItem.save();
    }

    // Set StockBalance to 50 units @ 500 = 25,000 valuation to perfectly match GL!
    await StockBalance.findOneAndUpdate(
      { companyId: companyObjId, itemId: demoItem._id, warehouseId: defaultWarehouse._id },
      {
        quantity: Types.Decimal128.fromString('50.00'),
        averageCost: Types.Decimal128.fromString('500.00'),
        totalValuation: Types.Decimal128.fromString('25000.00'),
      },
      { upsert: true }
    );

    // Rule A-1: Anchor voucher dates to Today
    const today = new Date();

    const vouchers = [
      {
        entryNumber: 'JV-2026-00001',
        voucherType: 'RECEIPT' as const,
        description: "Initial Capital Injection & Treasury Funding by Owner",
        totalDebit: '500000.00',
        totalCredit: '500000.00',
        lines: [
          { accountId: accCash._id, accountCode: accCash.code, accountName: accCash.name, debit: '100000.00', credit: '0.00', description: 'Cash in vault' },
          { accountId: accBank._id, accountCode: accBank.code, accountName: accBank.name, debit: '400000.00', credit: '0.00', description: 'Commercial operating bank deposit' },
          { accountId: accCapital._id, accountCode: accCapital.code, accountName: accCapital.name, debit: '0.00', credit: '500000.00', description: "Owner's contributed equity capital" },
        ],
      },
      {
        entryNumber: 'JV-2026-00002',
        voucherType: 'PURCHASE' as const,
        description: 'Wholesale Commercial Inventory Purchase from Supplier on Credit',
        totalDebit: '50000.00',
        totalCredit: '50000.00',
        lines: [
          { accountId: accInventory._id, accountCode: accInventory.code, accountName: accInventory.name, debit: '50000.00', credit: '0.00', description: 'Merchandise inventory acquisition (100 units @ 500)' },
          { accountId: accAP._id, accountCode: accAP.code, accountName: accAP.name, debit: '0.00', credit: '50000.00', description: 'Trade accounts payable to supplier' },
        ],
      },
      {
        entryNumber: 'JV-2026-00003',
        voucherType: 'SALES' as const,
        description: 'Commercial Wholesale Sale to Client with UAE 5% VAT',
        totalDebit: '52500.00',
        totalCredit: '52500.00',
        lines: [
          { accountId: accAR._id, accountCode: accAR.code, accountName: accAR.name, debit: '52500.00', credit: '0.00', description: 'Receivable invoice to customer' },
          { accountId: accRevenue._id, accountCode: accRevenue.code, accountName: accRevenue.name, debit: '0.00', credit: '50000.00', description: 'Commercial sales revenue' },
          { accountId: accVatOut._id, accountCode: accVatOut.code, accountName: accVatOut.name, debit: '0.00', credit: '2500.00', description: 'UAE 5% VAT output payable' },
        ],
      },
      {
        entryNumber: 'JV-2026-00004',
        voucherType: 'JOURNAL' as const,
        description: 'Cost of Goods Sold Recognition for Commercial Sale (50 units sold)',
        totalDebit: '25000.00',
        totalCredit: '25000.00',
        lines: [
          { accountId: accCOGS._id, accountCode: accCOGS.code, accountName: accCOGS.name, debit: '25000.00', credit: '0.00', description: 'COGS direct recognition (50 units @ 500)' },
          { accountId: accInventory._id, accountCode: accInventory.code, accountName: accInventory.name, debit: '0.00', credit: '25000.00', description: 'Inventory asset depletion' },
        ],
      },
      {
        entryNumber: 'JV-2026-00005',
        voucherType: 'RECEIPT' as const,
        description: 'Customer Full Electronic Bank Settlement of Sales Invoice',
        totalDebit: '52500.00',
        totalCredit: '52500.00',
        lines: [
          { accountId: accBank._id, accountCode: accBank.code, accountName: accBank.name, debit: '52500.00', credit: '0.00', description: 'Bank transfer received from customer' },
          { accountId: accAR._id, accountCode: accAR.code, accountName: accAR.name, debit: '0.00', credit: '52500.00', description: 'Trade accounts receivable settled in full' },
        ],
      },
      {
        entryNumber: 'JV-2026-00006',
        voucherType: 'PAYMENT' as const,
        description: 'Corporate Head Office Rent Lease Settlement with 5% Input VAT',
        totalDebit: '10500.00',
        totalCredit: '10500.00',
        lines: [
          { accountId: accRent._id, accountCode: accRent.code, accountName: accRent.name, debit: '10000.00', credit: '0.00', description: 'Monthly commercial office rent expense' },
          { accountId: accVatIn._id, accountCode: accVatIn.code, accountName: accVatIn.name, debit: '500.00', credit: '0.00', description: '5% recoverable input VAT on office rent' },
          { accountId: accBank._id, accountCode: accBank.code, accountName: accBank.name, debit: '0.00', credit: '10500.00', description: 'Bank wire payment for office lease' },
        ],
      },
      {
        entryNumber: 'JV-2026-00007',
        voucherType: 'PAYMENT' as const,
        description: 'Commercial Supplier Partial Accounts Payable Settlement via Bank Transfer',
        totalDebit: '30000.00',
        totalCredit: '30000.00',
        lines: [
          { accountId: accAP._id, accountCode: accAP.code, accountName: accAP.name, debit: '30000.00', credit: '0.00', description: 'Supplier AP payment settlement' },
          { accountId: accBank._id, accountCode: accBank.code, accountName: accBank.name, debit: '0.00', credit: '30000.00', description: 'Bank wire transfer payment to supplier' },
        ],
      },
    ];

    let vouchersCreated = 0;

    for (const v of vouchers) {
      const jDoc = new JournalEntry({
        companyId: companyObjId,
        entryNumber: v.entryNumber,
        voucherType: v.voucherType,
        entryDate: today,
        description: v.description,
        totalDebit: Types.Decimal128.fromString(v.totalDebit),
        totalCredit: Types.Decimal128.fromString(v.totalCredit),
        status: 'POSTED',
        lines: v.lines.map((l) => ({
          accountId: l.accountId,
          accountCode: l.accountCode,
          accountName: l.accountName,
          debit: Types.Decimal128.fromString(l.debit),
          credit: Types.Decimal128.fromString(l.credit),
          description: l.description,
        })),
      });

      const savedJournal = await jDoc.save();

      for (const line of v.lines) {
        const glLine = new GeneralLedger({
          companyId: companyObjId,
          journalEntryId: savedJournal._id,
          entryNumber: v.entryNumber,
          voucherType: v.voucherType,
          entryDate: today,
          accountId: line.accountId,
          accountCode: line.accountCode,
          accountName: line.accountName,
          debit: Types.Decimal128.fromString(line.debit),
          credit: Types.Decimal128.fromString(line.credit),
          description: line.description || v.description,
        });
        await glLine.save();
      }

      vouchersCreated++;
    }

    // Invalidate dashboard cache
    invalidateCompanyDashboardCache(companyId);

    return {
      vouchersCreated,
      message: 'Real demonstration double-entry vouchers successfully posted to General Ledger.',
    };
  }
}

export const dashboardService = new DashboardService();
