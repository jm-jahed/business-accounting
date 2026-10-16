import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  CreatePlanSchema,
  UpdatePlanSchema,
  CreatePlanPriceSchema,
} from '@accounting/contracts';
import { AdminPlansService } from './admin-plans.service.js';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard.js';
import { AdminRolesGuard } from '../guards/admin-roles.guard.js';
import { AdminRoles } from '../decorators/admin-roles.decorator.js';
import { CurrentAdmin } from '../decorators/current-admin.decorator.js';
import { AdminJwtPayload } from '../services/admin-jwt.service.js';

@Controller('admin/plans')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class AdminPlansController {
  constructor(private readonly plansService: AdminPlansService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listPlans() {
    return this.plansService.listPlans();
  }

  @Get(':planId')
  @HttpCode(HttpStatus.OK)
  async getPlanById(@Param('planId') planId: string) {
    return this.plansService.getPlanById(planId);
  }

  @Post()
  @AdminRoles('SUPER_ADMIN', 'BILLING')
  @HttpCode(HttpStatus.CREATED)
  async createPlan(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const validated = CreatePlanSchema.parse(body);
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.plansService.createPlan(validated, admin, meta);
  }

  @Patch(':planId')
  @AdminRoles('SUPER_ADMIN', 'BILLING')
  @HttpCode(HttpStatus.OK)
  async updatePlan(
    @Param('planId') planId: string,
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const validated = UpdatePlanSchema.parse(body);
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.plansService.updatePlan(planId, validated, admin, meta);
  }

  @Post('prices')
  @AdminRoles('SUPER_ADMIN', 'BILLING')
  @HttpCode(HttpStatus.CREATED)
  async createPlanPrice(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const validated = CreatePlanPriceSchema.parse(body);
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.plansService.createPlanPrice(validated, admin, meta);
  }

  @Patch('prices/:priceId/deactivate')
  @AdminRoles('SUPER_ADMIN', 'BILLING')
  @HttpCode(HttpStatus.OK)
  async deactivatePlanPrice(
    @Param('priceId') priceId: string,
    @CurrentAdmin() admin: AdminJwtPayload,
    @Req() req: Request
  ) {
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.plansService.deactivatePlanPrice(priceId, admin, meta);
  }
}
