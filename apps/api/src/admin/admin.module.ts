import { Module } from '@nestjs/common';
import { AdminJwtService } from './services/admin-jwt.service.js';
import { AdminTotpService } from './services/admin-totp.service.js';
import { AdminAuditService } from './services/admin-audit.service.js';
import { AdminAuthService } from './auth/admin-auth.service.js';
import { AdminAuthController } from './auth/admin-auth.controller.js';
import { AdminPlansService } from './plans/admin-plans.service.js';
import { AdminPlansController } from './plans/admin-plans.controller.js';
import { AdminCompaniesService } from './companies/admin-companies.service.js';
import { AdminCompaniesController } from './companies/admin-companies.controller.js';
import { AdminDashboardService } from './dashboard/admin-dashboard.service.js';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller.js';
import { AdminTeamService } from './team/admin-team.service.js';
import { AdminTeamController } from './team/admin-team.controller.js';
import { AdminAuditController } from './audit/admin-audit.controller.js';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard.js';
import { AdminRolesGuard } from './guards/admin-roles.guard.js';

@Module({
  controllers: [
    AdminAuthController,
    AdminPlansController,
    AdminCompaniesController,
    AdminDashboardController,
    AdminTeamController,
    AdminAuditController,
  ],
  providers: [
    AdminJwtService,
    AdminTotpService,
    AdminAuditService,
    AdminAuthService,
    AdminPlansService,
    AdminCompaniesService,
    AdminDashboardService,
    AdminTeamService,
    AdminJwtAuthGuard,
    AdminRolesGuard,
  ],
  exports: [
    AdminJwtService,
    AdminTotpService,
    AdminAuditService,
    AdminAuthService,
    AdminPlansService,
    AdminCompaniesService,
    AdminDashboardService,
    AdminTeamService,
  ],
})
export class AdminModule {}
