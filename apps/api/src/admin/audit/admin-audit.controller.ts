import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminAuditService } from '../services/admin-audit.service.js';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard.js';
import { AdminRolesGuard } from '../guards/admin-roles.guard.js';
import { AdminRoles } from '../decorators/admin-roles.decorator.js';

@Controller('admin/audit-logs')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  @Get()
  @AdminRoles('SUPER_ADMIN', 'DEVELOPER')
  @HttpCode(HttpStatus.OK)
  async queryLogs(@Query() query: any) {
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const offset = query.offset ? parseInt(query.offset, 10) : 0;
    return this.auditService.queryLogs({
      actorId: query.actorId,
      action: query.action,
      targetType: query.targetType,
      limit,
      offset,
    });
  }

  @Get('verify')
  @AdminRoles('SUPER_ADMIN', 'DEVELOPER')
  @HttpCode(HttpStatus.OK)
  async verifyChain() {
    return this.auditService.verifyEntireChain();
  }
}
