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
import { CreateAdminUserSchema, UpdateAdminUserSchema } from '@accounting/contracts';
import { AdminTeamService } from './admin-team.service.js';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard.js';
import { AdminRolesGuard } from '../guards/admin-roles.guard.js';
import { AdminRoles } from '../decorators/admin-roles.decorator.js';
import { CurrentAdmin } from '../decorators/current-admin.decorator.js';
import { AdminJwtPayload } from '../services/admin-jwt.service.js';

@Controller('admin/team')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class AdminTeamController {
  constructor(private readonly teamService: AdminTeamService) {}

  @Get()
  @AdminRoles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async listTeam() {
    return this.teamService.listTeam();
  }

  @Post()
  @AdminRoles('SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createAdmin(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const validated = CreateAdminUserSchema.parse(body);
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.teamService.createAdmin(validated, admin, meta);
  }

  @Patch(':id')
  @AdminRoles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async updateAdmin(
    @Param('id') id: string,
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const validated = UpdateAdminUserSchema.parse(body);
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.teamService.updateAdmin(id, validated, admin, meta);
  }
}
