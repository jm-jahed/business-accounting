import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  CountryRegionMappingSchema,
  AdminExchangeRateSchema,
} from '@accounting/contracts';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard.js';
import { AdminRolesGuard } from '../guards/admin-roles.guard.js';
import { AdminRoles } from '../decorators/admin-roles.decorator.js';
import { CurrentAdmin } from '../decorators/current-admin.decorator.js';
import { AdminJwtPayload } from '../services/admin-jwt.service.js';

@Controller('admin')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('dashboard/overview')
  @HttpCode(HttpStatus.OK)
  async getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('regions')
  @HttpCode(HttpStatus.OK)
  async listRegions() {
    return this.dashboardService.listRegions();
  }

  @Post('regions')
  @AdminRoles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async setCountryRegionMapping(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const validated = CountryRegionMappingSchema.parse(body);
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.dashboardService.setCountryRegionMapping(
      validated.countryCode,
      validated.countryName,
      validated.regionCode,
      validated.regionName,
      admin,
      meta
    );
  }

  @Get('exchange-rates')
  @HttpCode(HttpStatus.OK)
  async listExchangeRates() {
    return this.dashboardService.listExchangeRates();
  }

  @Post('exchange-rates')
  @AdminRoles('SUPER_ADMIN', 'BILLING')
  @HttpCode(HttpStatus.OK)
  async setExchangeRate(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const validated = AdminExchangeRateSchema.parse(body);
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.dashboardService.setExchangeRate(
      validated.fromCurrency,
      validated.toCurrency,
      validated.rate,
      admin,
      meta
    );
  }
}
