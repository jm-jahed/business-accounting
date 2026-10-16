import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  Company,
  Subscription,
  CountryRegionMapping,
  AdminExchangeRate,
} from '@accounting/database';
import { toDecimal, roundHalfEven } from '@accounting/core';
import { AdminAuditService } from '../services/admin-audit.service.js';
import { AdminJwtPayload } from '../services/admin-jwt.service.js';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly auditService: AdminAuditService) {}

  public async getOverview() {
    const [companies, subscriptions, countryMappings, exchangeRates] = await Promise.all([
      Company.find().lean(),
      Subscription.find().lean(),
      CountryRegionMapping.find().lean(),
      AdminExchangeRate.find().lean(),
    ]);

    const countryRegionMap = new Map<string, string>();
    for (const m of countryMappings) {
      countryRegionMap.set(m.countryCode.toUpperCase(), m.regionCode);
    }

    // 1. Company status counts
    const now = new Date();
    const in7Days = new Date(Date.now() + 7 * 86400000);

    const counts = {
      total: companies.length,
      active: 0,
      trial: 0,
      due: 0,
      grace: 0,
      readOnly: 0,
      suspended: 0,
      expiringIn7Days: 0,
    };

    const expiringSubs: any[] = [];
    const subByCompanyMap = new Map(subscriptions.map((s) => [s.companyId.toString(), s]));

    for (const comp of companies) {
      const sub = subByCompanyMap.get(comp._id.toString());
      const status = sub?.status || (comp.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE');

      switch (status) {
        case 'ACTIVE':
          counts.active++;
          break;
        case 'TRIAL':
          counts.trial++;
          break;
        case 'DUE':
          counts.due++;
          break;
        case 'GRACE':
          counts.grace++;
          break;
        case 'READ_ONLY':
          counts.readOnly++;
          break;
        case 'SUSPENDED':
          counts.suspended++;
          break;
      }

      if (sub && sub.currentPeriodEnd) {
        const endDate = new Date(sub.currentPeriodEnd);
        if (endDate >= now && endDate <= in7Days) {
          counts.expiringIn7Days++;
          expiringSubs.push({
            id: sub._id.toString(),
            companyId: comp._id.toString(),
            companyName: comp.name,
            companySlug: comp.slug,
            planCode: sub.planCode,
            billingCycle: sub.billingCycle,
            currency: sub.currency,
            amount: sub.amount.toString(),
            seats: sub.seats,
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
          });
        }
      }
    }

    // 2. Breakdown by Region & Country (data-driven)
    const regionCountMap = new Map<string, number>();
    const countryCountMap = new Map<string, number>();

    for (const comp of companies) {
      const cCode = (comp.countryCode || '').toUpperCase();
      const region = countryRegionMap.get(cCode) || comp.region || 'GULF';
      const country = comp.country || (cCode ? cCode : 'Country not set');

      regionCountMap.set(region, (regionCountMap.get(region) || 0) + 1);
      countryCountMap.set(country, (countryCountMap.get(country) || 0) + 1);
    }

    const byRegion = Array.from(regionCountMap.entries()).map(([region, count]) => ({
      region,
      count,
    }));
    const byCountry = Array.from(countryCountMap.entries()).map(([country, count]) => ({
      country,
      count,
    }));

    // 3. Strict MRR & ARR Calculation per Currency
    // Formula: Monthly = amount, 6-Month = amount / 6, Yearly = amount / 12
    interface CurrencyStat {
      currency: string;
      monthlyCount: number;
      sixMonthsCount: number;
      yearlyCount: number;
      totalActiveCount: number;
      mrrTotalDec: any;
    }

    const currencyStatsMap = new Map<string, CurrencyStat>();

    for (const sub of subscriptions) {
      // Active revenue generating statuses
      if (['ACTIVE', 'TRIAL', 'GRACE', 'DUE'].includes(sub.status)) {
        const cur = sub.currency.toUpperCase();
        if (!currencyStatsMap.has(cur)) {
          currencyStatsMap.set(cur, {
            currency: cur,
            monthlyCount: 0,
            sixMonthsCount: 0,
            yearlyCount: 0,
            totalActiveCount: 0,
            mrrTotalDec: toDecimal(0),
          });
        }

        const stat = currencyStatsMap.get(cur)!;
        stat.totalActiveCount++;

        const subAmount = toDecimal(sub.amount.toString());
        let mrrPortion = toDecimal(0);

        if (sub.billingCycle === 'MONTHLY') {
          stat.monthlyCount++;
          mrrPortion = subAmount;
        } else if (sub.billingCycle === 'SIX_MONTHS') {
          stat.sixMonthsCount++;
          mrrPortion = subAmount.dividedBy(6);
        } else if (sub.billingCycle === 'YEARLY') {
          stat.yearlyCount++;
          mrrPortion = subAmount.dividedBy(12);
        }

        stat.mrrTotalDec = stat.mrrTotalDec.plus(mrrPortion);
      }
    }

    const mrrByCurrency = Array.from(currencyStatsMap.values()).map((s) => {
      const roundedMrr = roundHalfEven(s.mrrTotalDec, 2);
      const roundedArr = roundHalfEven(s.mrrTotalDec.times(12), 2);
      return {
        currency: s.currency,
        monthlyCount: s.monthlyCount,
        sixMonthsCount: s.sixMonthsCount,
        yearlyCount: s.yearlyCount,
        totalActiveCount: s.totalActiveCount,
        mrrAmount: roundedMrr.toFixed(2),
        arrAmount: roundedArr.toFixed(2),
      };
    });

    // 4. Optional Total Estimated MRR using Admin Exchange Rates
    const baseCurrency = 'AED';
    let totalEstimatedMrr: { baseCurrency: string; amount: string; label: 'Estimated' } | null = null;
    let hasExchangeRates = true;

    if (mrrByCurrency.length > 0) {
      let totalInBase = toDecimal(0);
      const rateMap = new Map<string, any>();
      for (const r of exchangeRates) {
        if (r.toCurrency.toUpperCase() === baseCurrency) {
          rateMap.set(r.fromCurrency.toUpperCase(), toDecimal(r.rate.toString()));
        }
      }

      for (const curStat of currencyStatsMap.values()) {
        const cur = curStat.currency;
        if (cur === baseCurrency) {
          totalInBase = totalInBase.plus(curStat.mrrTotalDec);
        } else {
          const rate = rateMap.get(cur);
          if (rate) {
            totalInBase = totalInBase.plus(curStat.mrrTotalDec.times(rate));
          } else {
            // Missing conversion rate - refuse aggregate total as instructed
            hasExchangeRates = false;
            break;
          }
        }
      }

      if (hasExchangeRates) {
        totalEstimatedMrr = {
          baseCurrency,
          amount: roundHalfEven(totalInBase, 2).toFixed(2),
          label: 'Estimated',
        };
      }
    }

    return {
      companies: counts,
      byRegion,
      byCountry,
      mrrByCurrency,
      totalEstimatedMrr,
      hasExchangeRates,
      recentExpiringSubscriptions: expiringSubs,
    };
  }

  public async listRegions() {
    return CountryRegionMapping.find().sort({ countryCode: 1 }).lean();
  }

  public async setCountryRegionMapping(
    countryCode: string,
    countryName: string,
    regionCode: string,
    regionName: string,
    admin: AdminJwtPayload,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const cCode = countryCode.trim().toUpperCase();
    let mapping = await CountryRegionMapping.findOne({ countryCode: cCode });
    const beforeState = mapping ? mapping.toObject() : null;

    if (!mapping) {
      mapping = new CountryRegionMapping({
        countryCode: cCode,
        countryName,
        regionCode: regionCode.trim().toUpperCase(),
        regionName,
      });
    } else {
      mapping.countryName = countryName;
      mapping.regionCode = regionCode.trim().toUpperCase();
      mapping.regionName = regionName;
    }

    const saved = await mapping.save();

    await this.auditService.logAction({
      actorId: admin.sub,
      actorEmail: admin.email,
      adminRole: admin.role,
      action: 'admin.region.mapping_set',
      targetType: 'Region',
      targetId: saved._id.toString(),
      beforeState,
      afterState: saved.toObject(),
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return saved;
  }

  public async listExchangeRates() {
    const rates = await AdminExchangeRate.find().sort({ fromCurrency: 1 }).lean();
    return rates.map((r) => ({
      id: r._id.toString(),
      fromCurrency: r.fromCurrency,
      toCurrency: r.toCurrency,
      rate: r.rate.toString(),
      effectiveDate: r.effectiveDate.toISOString(),
    }));
  }

  public async setExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    rate: string,
    admin: AdminJwtPayload,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const from = fromCurrency.trim().toUpperCase();
    const to = toCurrency.trim().toUpperCase();

    let exRate = await AdminExchangeRate.findOne({ fromCurrency: from, toCurrency: to });
    const beforeState = exRate ? exRate.toObject() : null;

    if (!exRate) {
      exRate = new AdminExchangeRate({
        fromCurrency: from,
        toCurrency: to,
        rate: Types.Decimal128.fromString(rate),
        effectiveDate: new Date(),
      });
    } else {
      exRate.rate = Types.Decimal128.fromString(rate);
      exRate.effectiveDate = new Date();
    }

    const saved = await exRate.save();

    await this.auditService.logAction({
      actorId: admin.sub,
      actorEmail: admin.email,
      adminRole: admin.role,
      action: 'admin.exchange_rate.set',
      targetType: 'ExchangeRate',
      targetId: saved._id.toString(),
      beforeState,
      afterState: { from, to, rate },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      id: saved._id.toString(),
      fromCurrency: saved.fromCurrency,
      toCurrency: saved.toCurrency,
      rate: saved.rate.toString(),
      effectiveDate: saved.effectiveDate.toISOString(),
    };
  }
}
