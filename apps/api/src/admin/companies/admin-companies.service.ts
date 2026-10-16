import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  Company,
  Branch,
  CompanyMembership,
  Subscription,
  Plan,
} from '@accounting/database';
import {
  CreateSubscriptionInput,
  UpdateSubscriptionStatusInput,
  ExtendSubscriptionInput,
} from '@accounting/contracts';
import { AdminAuditService } from '../services/admin-audit.service.js';
import { AdminJwtPayload } from '../services/admin-jwt.service.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';

@Injectable()
export class AdminCompaniesService {
  constructor(private readonly auditService: AdminAuditService) {}

  public async listCompanies(query: {
    status?: string;
    search?: string;
    region?: string;
    countryCode?: string;
    limit?: number;
    offset?: number;
  }) {
    const filter: any = {};
    if (query.status) {
      filter.status = query.status;
    }
    if (query.region) {
      filter.region = query.region.toUpperCase();
    }
    if (query.countryCode) {
      filter.countryCode = query.countryCode.toUpperCase();
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { legalName: { $regex: query.search, $options: 'i' } },
        { slug: { $regex: query.search, $options: 'i' } },
      ];
    }

    const limit = Math.min(query.limit || 50, 100);
    const offset = query.offset || 0;

    const [companies, total] = await Promise.all([
      Company.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      Company.countDocuments(filter),
    ]);

    const companyIds = companies.map((c) => c._id);

    // Load active subscriptions, branches, and memberships in parallel (Zero Ledger access!)
    const [subscriptions, memberships, branches] = await Promise.all([
      Subscription.find({ companyId: { $in: companyIds } }).lean(),
      CompanyMembership.find({ companyId: { $in: companyIds }, status: 'active' }).lean(),
      Branch.find({ companyId: { $in: companyIds } }).lean(),
    ]);

    const subMap = new Map(subscriptions.map((s) => [s.companyId.toString(), s]));
    const memberCountMap = new Map<string, number>();
    for (const m of memberships) {
      const cId = m.companyId.toString();
      memberCountMap.set(cId, (memberCountMap.get(cId) || 0) + 1);
    }
    const branchCountMap = new Map<string, number>();
    for (const b of branches) {
      const cId = b.companyId.toString();
      branchCountMap.set(cId, (branchCountMap.get(cId) || 0) + 1);
    }

    const items = companies.map((c) => {
      const cId = c._id.toString();
      const sub = subMap.get(cId);

      return {
        id: cId,
        name: c.name,
        slug: c.slug,
        legalName: c.legalName,
        countryCode: c.countryCode || 'AE',
        country: c.country || 'Country not set',
        region: c.region || 'GULF',
        dataRegion: c.dataRegion || 'GULF',
        vatNumber: c.vatNumber || c.trn || '',
        currency: c.currency,
        status: c.status,
        userCount: memberCountMap.get(cId) || 1,
        branchCount: branchCountMap.get(cId) || 1,
        subscription: sub
          ? {
              id: sub._id.toString(),
              planCode: sub.planCode,
              billingCycle: sub.billingCycle,
              currency: sub.currency,
              amount: sub.amount.toString(),
              seats: sub.seats,
              status: sub.status,
              currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
              trialEndsAt: sub.trialEndsAt ? sub.trialEndsAt.toISOString() : null,
              graceEndsAt: sub.graceEndsAt ? sub.graceEndsAt.toISOString() : null,
            }
          : {
              // Legacy fallback
              planCode: c.plan || 'starter',
              billingCycle: 'MONTHLY',
              currency: c.currency || 'AED',
              amount: '0.00',
              seats: c.seatLimit || 3,
              status: 'ACTIVE',
              currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString(),
              trialEndsAt: null,
              graceEndsAt: null,
            },
        createdAt: c.createdAt.toISOString(),
      };
    });

    return { items, total, limit, offset };
  }

  public async getCompanyDetails(companyId: string) {
    const compObjId = new Types.ObjectId(companyId);
    const company = await Company.findById(compObjId).lean();
    if (!company) throw new NotFoundException('Company not found.');

    const [subscription, memberships, branches] = await Promise.all([
      Subscription.findOne({ companyId: compObjId }).lean(),
      CompanyMembership.find({ companyId: compObjId, status: 'active' }).lean(),
      Branch.find({ companyId: compObjId }).lean(),
    ]);

    return {
      id: company._id.toString(),
      name: company.name,
      slug: company.slug,
      legalName: company.legalName,
      countryCode: company.countryCode,
      country: company.country || 'Country not set',
      region: company.region || 'GULF',
      dataRegion: company.dataRegion || 'GULF',
      vatNumber: company.vatNumber || company.trn || '',
      currency: company.currency,
      status: company.status,
      businessTypes: company.businessTypes || ['retail'],
      enabledModules: company.enabledModules || ['accounting'],
      userCount: memberships.length,
      branchCount: branches.length,
      subscription: subscription
        ? {
            id: subscription._id.toString(),
            planId: subscription.planId.toString(),
            planCode: subscription.planCode,
            planPriceId: subscription.planPriceId?.toString(),
            billingCycle: subscription.billingCycle,
            currency: subscription.currency,
            amount: subscription.amount.toString(),
            seats: subscription.seats,
            status: subscription.status,
            trialEndsAt: subscription.trialEndsAt ? subscription.trialEndsAt.toISOString() : null,
            currentPeriodStart: subscription.currentPeriodStart.toISOString(),
            currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
            graceEndsAt: subscription.graceEndsAt ? subscription.graceEndsAt.toISOString() : null,
            notes: subscription.notes,
          }
        : null,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    };
  }

  public async assignOrUpdateSubscription(
    companyId: string,
    input: CreateSubscriptionInput,
    admin: AdminJwtPayload,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const compObjId = new Types.ObjectId(companyId);
    const company = await Company.findById(compObjId);
    if (!company) throw new NotFoundException('Target company not found.');

    const plan = await Plan.findById(input.planId);
    if (!plan) throw new NotFoundException('Target plan not found.');

    let subscription = await Subscription.findOne({ companyId: compObjId });
    const beforeState = subscription ? subscription.toObject() : null;

    const startDate = input.currentPeriodStart ? new Date(input.currentPeriodStart) : new Date();
    let endDate = input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : new Date(startDate);
    if (!input.currentPeriodEnd) {
      if (input.billingCycle === 'YEARLY') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (input.billingCycle === 'SIX_MONTHS') {
        endDate.setMonth(endDate.getMonth() + 6);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
    }

    if (!subscription) {
      subscription = new Subscription({
        companyId: compObjId,
        planId: plan._id,
        planCode: plan.code,
        planPriceId: input.planPriceId ? new Types.ObjectId(input.planPriceId) : null,
        billingCycle: input.billingCycle,
        currency: input.currency.toUpperCase(),
        amount: Types.Decimal128.fromString(input.amount),
        seats: input.seats,
        status: input.status,
        trialEndsAt: input.trialEndsAt ? new Date(input.trialEndsAt) : null,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        graceEndsAt: input.graceEndsAt ? new Date(input.graceEndsAt) : null,
        notes: input.notes || '',
      });
    } else {
      subscription.planId = plan._id as any;
      subscription.planCode = plan.code;
      if (input.planPriceId) subscription.planPriceId = new Types.ObjectId(input.planPriceId) as any;
      subscription.billingCycle = input.billingCycle;
      subscription.currency = input.currency.toUpperCase();
      subscription.amount = Types.Decimal128.fromString(input.amount);
      subscription.seats = input.seats;
      subscription.status = input.status;
      subscription.currentPeriodStart = startDate;
      subscription.currentPeriodEnd = endDate;
      if (input.notes) subscription.notes = input.notes;
    }

    const saved = await subscription.save();
    TenantGuard.invalidateSubscriptionCache(companyId);

    await this.auditService.logAction({
      actorId: admin.sub,
      actorEmail: admin.email,
      adminRole: admin.role,
      action: 'admin.subscription.assign',
      targetType: 'Subscription',
      targetId: saved._id.toString(),
      beforeState,
      afterState: saved.toObject(),
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      success: true,
      subscriptionId: saved._id.toString(),
      planCode: saved.planCode,
      status: saved.status,
      seats: saved.seats,
    };
  }

  public async updateSubscriptionStatus(
    companyId: string,
    input: UpdateSubscriptionStatusInput,
    admin: AdminJwtPayload,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const compObjId = new Types.ObjectId(companyId);
    const subscription = await Subscription.findOne({ companyId: compObjId });
    if (!subscription) throw new NotFoundException('Subscription not found for company.');

    const beforeState = subscription.toObject();
    subscription.status = input.status;
    if (input.graceEndsAt) {
      subscription.graceEndsAt = new Date(input.graceEndsAt);
    }
    if (input.notes) {
      subscription.notes = `${subscription.notes ? subscription.notes + ' | ' : ''}${input.notes} (Reason: ${input.reason})`;
    }

    const saved = await subscription.save();
    TenantGuard.invalidateSubscriptionCache(companyId);



    await this.auditService.logAction({
      actorId: admin.sub,
      actorEmail: admin.email,
      adminRole: admin.role,
      action: `admin.subscription.status_${input.status.toLowerCase()}`,
      targetType: 'Subscription',
      targetId: saved._id.toString(),
      beforeState,
      afterState: { status: saved.status, reason: input.reason, graceEndsAt: saved.graceEndsAt },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return { success: true, status: saved.status };
  }

  public async extendSubscription(
    companyId: string,
    input: ExtendSubscriptionInput,
    admin: AdminJwtPayload,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const compObjId = new Types.ObjectId(companyId);
    const subscription = await Subscription.findOne({ companyId: compObjId });
    if (!subscription) throw new NotFoundException('Subscription not found for company.');

    const beforeState = subscription.toObject();
    const currentEnd = new Date(subscription.currentPeriodEnd);
    currentEnd.setDate(currentEnd.getDate() + input.extensionDays);
    subscription.currentPeriodEnd = currentEnd;

    // If it was expired/due/grace, restore to ACTIVE
    if (subscription.status === 'DUE' || subscription.status === 'GRACE' || subscription.status === 'READ_ONLY') {
      subscription.status = 'ACTIVE';
    }

    const saved = await subscription.save();
    TenantGuard.invalidateSubscriptionCache(companyId);

    await this.auditService.logAction({
      actorId: admin.sub,
      actorEmail: admin.email,
      adminRole: admin.role,
      action: 'admin.subscription.extend_period',
      targetType: 'Subscription',
      targetId: saved._id.toString(),
      beforeState,
      afterState: {
        currentPeriodEnd: saved.currentPeriodEnd.toISOString(),
        extensionDays: input.extensionDays,
        reason: input.reason,
      },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      success: true,
      currentPeriodEnd: saved.currentPeriodEnd.toISOString(),
      status: saved.status,
    };
  }
}
