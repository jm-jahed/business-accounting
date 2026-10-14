import { Module } from '@nestjs/common';
import { CompanyService } from './company.service.js';
import { CompanyController } from './company.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { TenantGuard } from '../common/guards/tenant.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

@Module({
  imports: [AuthModule],
  controllers: [CompanyController],
  providers: [CompanyService, TenantGuard, RolesGuard],
  exports: [CompanyService, TenantGuard, RolesGuard],
})
export class CompanyModule {}
