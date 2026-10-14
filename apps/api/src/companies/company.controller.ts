import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CompanyService } from './company.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../common/guards/tenant.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator.js';
import { JwtUserPayload } from '../auth/jwt.service.js';
import { TenantContext } from '@accounting/database';
import {
  CreateCompanyWithOnboardingInput,
  InviteUserInput,
  AcceptInvitationInput,
} from '@accounting/contracts';

@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createCompany(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: CreateCompanyWithOnboardingInput
  ) {
    return this.companyService.createCompany(user.sub, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUserCompanies(@CurrentUser() user: JwtUserPayload) {
    return this.companyService.getUserCompanies(user.sub);
  }

  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(@Body() body: AcceptInvitationInput) {
    return this.companyService.acceptInvitation(body);
  }

  @Get(':companyId')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @HttpCode(HttpStatus.OK)
  async getCompanyDetails(
    @Param('companyId') companyId: string,
    @CurrentTenant() tenant: TenantContext
  ) {
    return this.companyService.getCompanyDetails(companyId, tenant);
  }

  @Post(':companyId/invitations')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('owner', 'admin')
  @HttpCode(HttpStatus.CREATED)
  async inviteUser(
    @Param('companyId') companyId: string,
    @CurrentUser() user: JwtUserPayload,
    @Body() body: InviteUserInput
  ) {
    return this.companyService.inviteUser(companyId, user.sub, body);
  }

  @Get(':companyId/invitations')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('owner', 'admin')
  @HttpCode(HttpStatus.OK)
  async listInvitations(@Param('companyId') companyId: string) {
    return this.companyService.listInvitations(companyId);
  }
}
