/**
 * Business Accounting & Management System
 * Root Application Module
 */

import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CompanyModule } from './companies/company.module.js';
import { AccountsModule } from './accounts/accounts.module.js';

@Module({
  imports: [HealthModule, AuthModule, CompanyModule, AccountsModule],
})
export class AppModule {}
