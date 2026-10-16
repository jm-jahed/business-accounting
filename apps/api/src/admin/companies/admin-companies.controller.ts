import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  CreateSubscriptionSchema,
  UpdateSubscriptionStatusSchema,
  ExtendSubscriptionSchema,
} from '@accounting/contracts';
import { AdminCompaniesService } from './admin-companies.service.js';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard.js';
import { AdminRolesGuard } from '../guards/admin-roles.guard.js';
import { AdminRoles } from '../decorators/admin-roles.decorator.js';
import { CurrentAdmin } from '../decorators/current-admin.decorator.js';
import { AdminJwtPayload } from '../services/admin-jwt.service.js';

@Controller('admin/companies')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class AdminCompaniesController {
  constructor(private readonly companiesService: AdminCompaniesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listCompanies(@Query() query: any) {
    return this.companiesService.listCompanies(query);
  }

  @Get(':companyId')
  @HttpCode(HttpStatus.OK)
  async getCompanyDetails(@Param('companyId') companyId: string) {
    return this.companiesService.getCompanyDetails(companyId);
  }

  @Post(':companyId/subscription')
  @AdminRoles('SUPER_ADMIN', 'BILLING')
  @HttpCode(HttpStatus.OK)
  async assignOrUpdateSubscription(
    @Param('companyId') companyId: string,
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const validated = CreateSubscriptionSchema.parse(body);
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.companiesService.assignOrUpdateSubscription(companyId, validated, admin, meta);
  }

  @Post(':companyId/subscription/status')
  @AdminRoles('SUPER_ADMIN', 'BILLING', 'SUPPORT')
  @HttpCode(HttpStatus.OK)
  async updateSubscriptionStatus(
    @Param('companyId') companyId: string,
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const validated = UpdateSubscriptionStatusSchema.parse(body);
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.companiesService.updateSubscriptionStatus(companyId, validated, admin, meta);
  }

  @Post(':companyId/subscription/extend')
  @AdminRoles('SUPER_ADMIN', 'BILLING', 'SUPPORT')
  @HttpCode(HttpStatus.OK)
  async extendSubscription(
    @Param('companyId') companyId: string,
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const validated = ExtendSubscriptionSchema.parse(body);
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.companiesService.extendSubscription(companyId, validated, admin, meta);
  }
}
