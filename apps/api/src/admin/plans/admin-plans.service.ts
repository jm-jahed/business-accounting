import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { Plan, PlanPrice } from '@accounting/database';
import {
  CreatePlanInput,
  UpdatePlanInput,
  CreatePlanPriceInput,
} from '@accounting/contracts';
import { AdminAuditService } from '../services/admin-audit.service.js';
import { AdminJwtPayload } from '../services/admin-jwt.service.js';

@Injectable()
export class AdminPlansService {
  constructor(private readonly auditService: AdminAuditService) {}

  public async listPlans() {
    const plans = await Plan.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
    return plans.map((p) => ({
      id: p._id.toString(),
      code: p.code,
      nameEn: p.nameEn,
      nameBn: p.nameBn,
      nameAr: p.nameAr,
      descriptionEn: p.descriptionEn,
      descriptionBn: p.descriptionBn,
      descriptionAr: p.descriptionAr,
      isPublic: p.isPublic,
      isActive: p.isActive,
      modules: p.modules,
      limits: p.limits,
      sortOrder: p.sortOrder,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  public async getPlanById(planId: string) {
    const plan = await Plan.findById(planId).lean();
    if (!plan) throw new NotFoundException('Plan not found.');
    const prices = await PlanPrice.find({ planId: new Types.ObjectId(planId) })
      .sort({ effectiveFrom: -1 })
      .lean();

    return {
      id: plan._id.toString(),
      code: plan.code,
      nameEn: plan.nameEn,
      nameBn: plan.nameBn,
      nameAr: plan.nameAr,
      descriptionEn: plan.descriptionEn,
      descriptionBn: plan.descriptionBn,
      descriptionAr: plan.descriptionAr,
      isPublic: plan.isPublic,
      isActive: plan.isActive,
      modules: plan.modules,
      limits: plan.limits,
      sortOrder: plan.sortOrder,
      prices: prices.map((pr) => ({
        id: pr._id.toString(),
        region: pr.region,
        currency: pr.currency,
        billingCycle: pr.billingCycle,
        amount: pr.amount.toString(),
        extraUserAmount: pr.extraUserAmount.toString(),
        effectiveFrom: pr.effectiveFrom.toISOString(),
        effectiveTo: pr.effectiveTo ? pr.effectiveTo.toISOString() : null,
        isActive: pr.isActive,
      })),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }

  public async createPlan(
    input: CreatePlanInput,
    admin: AdminJwtPayload,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const existing = await Plan.findOne({ code: input.code.toLowerCase() });
    if (existing) {
      throw new ConflictException(`Plan with code "${input.code}" already exists.`);
    }

    const plan = new Plan({
      code: input.code.toLowerCase(),
      nameEn: input.nameEn,
      nameBn: input.nameBn,
      nameAr: input.nameAr || '',
      descriptionEn: input.descriptionEn || '',
      descriptionBn: input.descriptionBn || '',
      descriptionAr: input.descriptionAr || '',
      isPublic: input.isPublic ?? true,
      isActive: input.isActive ?? true,
      modules: input.modules || ['accounting'],
      limits: input.limits,
      sortOrder: input.sortOrder ?? 0,
    });

    const saved = await plan.save();

    await this.auditService.logAction({
      actorId: admin.sub,
      actorEmail: admin.email,
      adminRole: admin.role,
      action: 'admin.plan.create',
      targetType: 'Plan',
      targetId: saved._id.toString(),
      afterState: saved.toObject(),
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      id: saved._id.toString(),
      code: saved.code,
      nameEn: saved.nameEn,
      nameBn: saved.nameBn,
      isActive: saved.isActive,
      limits: saved.limits,
      modules: saved.modules,
    };
  }

  public async updatePlan(
    planId: string,
    input: UpdatePlanInput,
    admin: AdminJwtPayload,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const plan = await Plan.findById(planId);
    if (!plan) throw new NotFoundException('Plan not found.');

    const beforeState = plan.toObject();

    if (input.nameEn !== undefined) plan.nameEn = input.nameEn;
    if (input.nameBn !== undefined) plan.nameBn = input.nameBn;
    if (input.nameAr !== undefined) plan.nameAr = input.nameAr;
    if (input.descriptionEn !== undefined) plan.descriptionEn = input.descriptionEn;
    if (input.descriptionBn !== undefined) plan.descriptionBn = input.descriptionBn;
    if (input.descriptionAr !== undefined) plan.descriptionAr = input.descriptionAr;
    if (input.isPublic !== undefined) plan.isPublic = input.isPublic;
    if (input.isActive !== undefined) plan.isActive = input.isActive;
    if (input.modules !== undefined) plan.modules = input.modules;
    if (input.limits !== undefined) plan.limits = input.limits;
    if (input.sortOrder !== undefined) plan.sortOrder = input.sortOrder;

    const saved = await plan.save();

    await this.auditService.logAction({
      actorId: admin.sub,
      actorEmail: admin.email,
      adminRole: admin.role,
      action: 'admin.plan.update',
      targetType: 'Plan',
      targetId: saved._id.toString(),
      beforeState,
      afterState: saved.toObject(),
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      id: saved._id.toString(),
      code: saved.code,
      nameEn: saved.nameEn,
      nameBn: saved.nameBn,
      isActive: saved.isActive,
      limits: saved.limits,
      modules: saved.modules,
    };
  }

  public async createPlanPrice(
    input: CreatePlanPriceInput,
    admin: AdminJwtPayload,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const plan = await Plan.findById(input.planId);
    if (!plan) throw new NotFoundException('Target plan not found.');

    const price = new PlanPrice({
      planId: plan._id,
      planCode: plan.code,
      region: input.region.toUpperCase(),
      currency: input.currency.toUpperCase(),
      billingCycle: input.billingCycle,
      amount: Types.Decimal128.fromString(input.amount),
      extraUserAmount: Types.Decimal128.fromString(input.extraUserAmount),
      effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : new Date(),
      isActive: true,
    });

    const saved = await price.save();

    await this.auditService.logAction({
      actorId: admin.sub,
      actorEmail: admin.email,
      adminRole: admin.role,
      action: 'admin.plan_price.create',
      targetType: 'PlanPrice',
      targetId: saved._id.toString(),
      afterState: {
        planCode: plan.code,
        region: saved.region,
        currency: saved.currency,
        billingCycle: saved.billingCycle,
        amount: saved.amount.toString(),
      },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      id: saved._id.toString(),
      planId: saved.planId.toString(),
      planCode: saved.planCode,
      region: saved.region,
      currency: saved.currency,
      billingCycle: saved.billingCycle,
      amount: saved.amount.toString(),
      extraUserAmount: saved.extraUserAmount.toString(),
      effectiveFrom: saved.effectiveFrom.toISOString(),
      isActive: saved.isActive,
    };
  }

  public async deactivatePlanPrice(
    priceId: string,
    admin: AdminJwtPayload,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const price = await PlanPrice.findById(priceId);
    if (!price) throw new NotFoundException('Plan price not found.');

    const beforeState = price.toObject();
    price.isActive = false;
    price.effectiveTo = new Date();
    await price.save();

    await this.auditService.logAction({
      actorId: admin.sub,
      actorEmail: admin.email,
      adminRole: admin.role,
      action: 'admin.plan_price.deactivate',
      targetType: 'PlanPrice',
      targetId: price._id.toString(),
      beforeState,
      afterState: price.toObject(),
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return { success: true, message: 'Plan price deactivated.' };
  }
}
