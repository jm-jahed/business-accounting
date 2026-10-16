/**
 * Business Accounting & Management System
 * Root Application Module
 */

import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CompanyModule } from './companies/company.module.js';
import { AccountsModule } from './accounts/accounts.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [HealthModule, AuthModule, CompanyModule, AccountsModule, InventoryModule, DashboardModule, AdminModule],
})
export class AppModule {}
