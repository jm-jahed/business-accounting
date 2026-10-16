import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  dashboardService,
  TenantContext,
  AuditLog,
} from '@accounting/database';
import { DashboardQueryFilter } from '@accounting/contracts';
import { JwtUserPayload } from '../auth/jwt.service.js';

interface RequestMetadata {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  async getSummary(tenant: TenantContext, filter: DashboardQueryFilter) {
    try {
      return await dashboardService.getDashboardSummary(tenant.companyId, filter, tenant);
    } catch (err: any) {
      this.logger.error(`Failed to aggregate dashboard summary: ${err.message}`, err.stack);
      throw new BadRequestException(err.message || 'Failed to aggregate dashboard metrics.');
    }
  }

  async seedDemoJournals(tenant: TenantContext, user: JwtUserPayload, meta?: RequestMetadata) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Demonstration data seeding is disabled in production environments.');
    }

    if (tenant.role !== 'owner') {
      throw new ForbiddenException('Only company owners are permitted to initialize demonstration records.');
    }

    try {
      const result = await dashboardService.seedRealDemoJournals(tenant.companyId, tenant);

      await AuditLog.create({
        actorId: user.sub,
        actorEmail: user.email || '',
        action: 'dashboard.demo_journals_seeded',
        targetType: 'Dashboard',
        targetId: tenant.companyId,
        companyId: new Types.ObjectId(tenant.companyId),
        outcome: 'success',
        ipAddress: meta?.ip || '',
        userAgent: meta?.userAgent || '',
        metadata: { ...result },
      });

      return {
        success: true,
        message: 'Real demonstration double-entry vouchers successfully posted to General Ledger.',
        data: result,
      };
    } catch (err: any) {
      this.logger.error(`Failed to seed demo journals: ${err.message}`, err.stack);
      throw new BadRequestException(err.message || 'Failed to seed demonstration vouchers.');
    }
  }
}
