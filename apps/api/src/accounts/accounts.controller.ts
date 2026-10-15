import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AccountsService } from './accounts.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../common/guards/tenant.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator.js';
import { JwtUserPayload } from '../auth/jwt.service.js';
import { TenantContext } from '@accounting/database';
import {
  CreateAccountInputSchema,
  UpdateAccountInputSchema,
  AccountQueryFilterSchema,
  CreateAccountInput,
  UpdateAccountInput,
} from '@accounting/contracts';

@Controller('companies/:companyId/accounts')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listAccounts(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: Record<string, any>
  ) {
    const validatedQuery = AccountQueryFilterSchema.parse(query);
    return this.accountsService.listAccounts(tenant, validatedQuery);
  }

  @Post()
  @Roles('owner', 'admin', 'accountant')
  @HttpCode(HttpStatus.CREATED)
  async createAccount(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUserPayload,
    @Body() body: CreateAccountInput,
    @Req() req: Request
  ) {
    const validatedBody = CreateAccountInputSchema.parse(body);
    const ip = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.accountsService.createAccount(tenant, user, validatedBody, {
      ip,
      userAgent,
    });
  }

  @Post('initialize')
  @Roles('owner', 'admin')
  @HttpCode(HttpStatus.OK)
  async initializeStandardTemplate(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request
  ) {
    const ip = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.accountsService.initializeStandardTemplate(tenant, user, {
      ip,
      userAgent,
    });
  }

  @Get(':accountId')
  @HttpCode(HttpStatus.OK)
  async getAccountById(
    @CurrentTenant() tenant: TenantContext,
    @Param('accountId') accountId: string
  ) {
    return this.accountsService.getAccountById(tenant, accountId);
  }

  @Patch(':accountId')
  @Roles('owner', 'admin', 'accountant')
  @HttpCode(HttpStatus.OK)
  async updateAccount(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUserPayload,
    @Param('accountId') accountId: string,
    @Body() body: UpdateAccountInput,
    @Req() req: Request
  ) {
    const validatedBody = UpdateAccountInputSchema.parse(body);
    const ip = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.accountsService.updateAccount(tenant, user, accountId, validatedBody, {
      ip,
      userAgent,
    });
  }

  @Delete(':accountId')
  @Roles('owner', 'admin')
  @HttpCode(HttpStatus.OK)
  async deactivateAccount(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUserPayload,
    @Param('accountId') accountId: string,
    @Req() req: Request
  ) {
    const ip = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.accountsService.deactivateAccount(tenant, user, accountId, {
      ip,
      userAgent,
    });
  }
}
