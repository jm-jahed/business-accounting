import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../common/guards/tenant.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator.js';
import { JwtUserPayload } from '../auth/jwt.service.js';
import { TenantContext } from '@accounting/database';
import { DashboardQueryFilterSchema } from '@accounting/contracts';

@Controller('companies/:companyId/dashboard')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  async getSummary(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: Record<string, any>
  ) {
    const validated = DashboardQueryFilterSchema.parse(query);
    return this.dashboardService.getSummary(tenant, validated);
  }

  @Post('seed-demo')
  @Roles('owner')
  @HttpCode(HttpStatus.OK)
  async seedDemoJournals(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request
  ) {
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.dashboardService.seedDemoJournals(tenant, user, meta);
  }
}
