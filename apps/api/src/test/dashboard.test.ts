import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose, { Types } from 'mongoose';
import {
  dbManager,
  User,
  Company,
  CompanyMembership,
  Account,
  JournalEntry,
  GeneralLedger,
  StockBalance,
  Item,
  Warehouse,
  UnitOfMeasure,
  TenantContext,
  assertTestDatabase,
} from '@accounting/database';
import { DashboardService } from '../dashboard/dashboard.service.js';
import { DashboardController } from '../dashboard/dashboard.controller.js';
import {
  DashboardQueryFilterSchema,
  DashboardSummaryResponseSchema,
} from '@accounting/contracts';
import { JwtUserPayload } from '../auth/jwt.service.js';
import { ForbiddenException } from '@nestjs/common';

describe('Executive ERP Dashboard: Comprehensive Enterprise Suite', () => {
  const service = new DashboardService();
  const controller = new DashboardController(service);
  const defaultFilter = DashboardQueryFilterSchema.parse({});

  let testCompanyA: any;
  let testCompanyB: any;
  let testUserA: any;
  let testUserB: any;
  let tenantContextA: TenantContext;
  let tenantContextB: TenantContext;
  let userPayloadA: JwtUserPayload;

  const cleanupIds = {
    companies: [] as string[],
    users: [] as string[],
    accounts: [] as string[],
    journals: [] as string[],
    gl: [] as string[],
    stockBalances: [] as string[],
    items: [] as string[],
    warehouses: [] as string[],
    uoms: [] as string[],
  };

  before(async () => {
    if (process.env.MONGODB_URI) {
      const dbName = process.env.DB_NAME || 'business_accounting_test';
      assertTestDatabase(dbName);
      await dbManager.connect();

      // Create test user A and Company A
      testUserA = await User.create({
        email: `dash_tester_a_${Date.now()}@test.ae`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789',
        fullName: 'Executive Owner A',
      });
      cleanupIds.users.push(testUserA._id.toString());

      testCompanyA = await Company.create({
        name: 'Barakah Global Trading LLC',
        legalName: 'Barakah Global Trading LLC',
        slug: `barakah-test-${Date.now()}`,
        country: 'AE',
        currency: 'AED',
        timezone: 'Asia/Dubai',
        fiscalYearStartMonth: 1,
        taxNumber: '100000000000003',
        branches: [{ name: 'Main HQ', isMain: true, address: 'Dubai' }],
      });
      cleanupIds.companies.push(testCompanyA._id.toString());

      await CompanyMembership.create({
        userId: testUserA._id,
        companyId: testCompanyA._id,
        role: 'owner',
        status: 'active',
      });

      tenantContextA = {
        userId: testUserA._id.toString(),
        companyId: testCompanyA._id.toString(),
        role: 'owner',
      };

      userPayloadA = {
        sub: testUserA._id.toString(),
        email: testUserA.email,
        fullName: testUserA.fullName,
      };

      // Create test user B and Company B for Tenant Isolation
      testUserB = await User.create({
        email: `dash_tester_b_${Date.now()}@test.ae`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz01234567890123456789',
        fullName: 'Executive Owner B',
      });
      cleanupIds.users.push(testUserB._id.toString());

      testCompanyB = await Company.create({
        name: 'Isolated Falcon FZE',
        legalName: 'Isolated Falcon FZE',
        slug: `falcon-test-${Date.now()}`,
        country: 'AE',
        currency: 'AED',
        timezone: 'Asia/Dubai',
        fiscalYearStartMonth: 1,
        taxNumber: '100000000000004',
        branches: [{ name: 'Main HQ', isMain: true, address: 'Sharjah' }],
      });
      cleanupIds.companies.push(testCompanyB._id.toString());

      await CompanyMembership.create({
        userId: testUserB._id,
        companyId: testCompanyB._id,
        role: 'owner',
        status: 'active',
      });

      tenantContextB = {
        userId: testUserB._id.toString(),
        companyId: testCompanyB._id.toString(),
        role: 'owner',
      };
    }
  });

  after(async () => {
    if (process.env.MONGODB_URI && mongoose.connection.readyState === 1) {
      if (cleanupIds.gl.length) {
        await GeneralLedger.deleteMany({ _id: { $in: cleanupIds.gl } });
      }
      if (cleanupIds.journals.length) {
        await JournalEntry.deleteMany({ _id: { $in: cleanupIds.journals } });
      }
      if (cleanupIds.stockBalances.length) {
        await StockBalance.deleteMany({ _id: { $in: cleanupIds.stockBalances } });
      }
      if (cleanupIds.items.length) {
        await Item.deleteMany({ _id: { $in: cleanupIds.items } });
      }
      if (cleanupIds.warehouses.length) {
        await Warehouse.deleteMany({ _id: { $in: cleanupIds.warehouses } });
      }
      if (cleanupIds.uoms.length) {
        await UnitOfMeasure.deleteMany({ _id: { $in: cleanupIds.uoms } });
      }
      if (cleanupIds.accounts.length) {
        await Account.deleteMany({ _id: { $in: cleanupIds.accounts } });
      }
      if (cleanupIds.companies.length) {
        await Company.deleteMany({ _id: { $in: cleanupIds.companies } });
        await CompanyMembership.deleteMany({ companyId: { $in: cleanupIds.companies } });
      }
      if (cleanupIds.users.length) {
        await User.deleteMany({ _id: { $in: cleanupIds.users } });
      }
    }
  });

  // ==========================================
  // 1. CONTRACTS & ZOD FILTERING
  // ==========================================
  describe('Contracts & Schema Validation', () => {
    it('should validate default query parameters with PREVIOUS_PERIOD', () => {
      const parsed = DashboardQueryFilterSchema.parse({});
      assert.equal(parsed.compareTo, 'PREVIOUS_PERIOD');
      assert.equal(parsed.from, undefined);
      assert.equal(parsed.to, undefined);
    });

    it('should reject invalid compareTo enum values', () => {
      assert.throws(() => {
        DashboardQueryFilterSchema.parse({ compareTo: 'INVALID_PERIOD' });
      });
    });
  });

  // ==========================================
  // 2. REAL SEEDER & EXACT FIGURE ASSERTIONS (A-9 ক)
  // ==========================================
  describe('Rule A-9 (ক): Exact Financial Ledger Metric Assertions', () => {
    it('should seed 7 balanced double-entry vouchers and assert exact target values', async () => {
      if (!testCompanyA) return;

      // 1. Seed Demo Vouchers
      const seedResult = await service.seedDemoJournals(tenantContextA, userPayloadA);
      assert.equal(seedResult.success, true);
      assert.equal(seedResult.data.vouchersCreated, 7);

      // Verify double-entry balance for all 7 vouchers
      const postedVouchers = await JournalEntry.find({ companyId: testCompanyA._id });
      assert.equal(postedVouchers.length, 7);
      for (const v of postedVouchers) {
        cleanupIds.journals.push(v._id.toString());
        assert.equal(v.status, 'POSTED');
        assert.equal(
          v.totalDebit.toString(),
          v.totalCredit.toString(),
          `Voucher ${v.entryNumber} debits do not equal credits`
        );
      }

      // Collect GL rows for cleanup
      const glRows = await GeneralLedger.find({ companyId: testCompanyA._id });
      for (const gl of glRows) {
        cleanupIds.gl.push(gl._id.toString());
      }

      // 2. Fetch Dashboard Summary
      const summary = await service.getSummary(tenantContextA, {
        compareTo: 'PREVIOUS_PERIOD',
      });

      // Strict Schema Parse
      const validated = DashboardSummaryResponseSchema.parse(summary);
      assert(validated);

      // (A) Cash + Bank = 512,000
      assert.equal(
        summary.kpis.cashAndBank.value,
        '512000.00',
        `Cash & Bank must equal 512,000, got ${summary.kpis.cashAndBank.value}`
      );

      // (B) Trade AR = 0
      assert.equal(
        summary.kpis.receivables.value,
        '0.00',
        `AR must equal 0, got ${summary.kpis.receivables.value}`
      );

      // (C) Trade AP = 20,000
      assert.equal(
        summary.kpis.payables.value,
        '20000.00',
        `AP must equal 20,000, got ${summary.kpis.payables.value}`
      );

      // (D) Revenue = 50,000
      assert.equal(
        summary.finance.profitAndLoss.revenue,
        '50000.00',
        `Revenue must equal 50,000, got ${summary.finance.profitAndLoss.revenue}`
      );

      // (E) COGS = 25,000
      assert.equal(
        summary.finance.profitAndLoss.cogs,
        '25000.00',
        `COGS must equal 25,000, got ${summary.finance.profitAndLoss.cogs}`
      );

      // (F) Gross Profit = 25,000 (Revenue 50,000 - COGS 25,000)
      assert.equal(
        summary.finance.profitAndLoss.grossProfit,
        '25000.00',
        `Gross profit must equal 25,000, got ${summary.finance.profitAndLoss.grossProfit}`
      );

      // (G) Other expenses = 10,000 (Rent 10,000)
      assert.equal(
        summary.finance.profitAndLoss.expenses,
        '10000.00',
        `Other expenses must equal 10,000, got ${summary.finance.profitAndLoss.expenses}`
      );

      // (H) Net Profit = 15,000 (Gross 25,000 - Other expenses 10,000)
      assert.equal(
        summary.finance.profitAndLoss.netProfit,
        '15000.00',
        `Net profit must equal 15,000, got ${summary.finance.profitAndLoss.netProfit}`
      );

      // (I) VAT output = 2,500; VAT input = 500; Net VAT = 2,000
      assert.equal(
        summary.finance.taxPosition.vatOutputPayable,
        '2500.00',
        `VAT output must equal 2,500, got ${summary.finance.taxPosition.vatOutputPayable}`
      );
      assert.equal(
        summary.finance.taxPosition.vatInputRecoverable,
        '500.00',
        `VAT input must equal 500, got ${summary.finance.taxPosition.vatInputRecoverable}`
      );
      assert.equal(
        summary.finance.taxPosition.netVatPayable,
        '2000.00',
        `Net VAT must equal 2,000, got ${summary.finance.taxPosition.netVatPayable}`
      );

      // (J) Inventory (GL) = 25,000; StockBalance = 25,000; Mismatch = false
      assert.equal(
        summary.kpis.inventoryValuation.value,
        '25000.00',
        `Inventory must equal 25,000, got ${summary.kpis.inventoryValuation.value}`
      );
      assert.equal(summary.inventoryMismatch.hasMismatch, false);
      assert.equal(summary.inventoryMismatch.glValue, '25000.00');
      assert.equal(summary.inventoryMismatch.stockBalanceValue, '25000.00');
    });

    it('should be idempotent: subsequent seed call must not duplicate vouchers (A-1)', async () => {
      if (!testCompanyA) return;

      const secondSeed = await service.seedDemoJournals(tenantContextA, userPayloadA);
      assert.equal(secondSeed.success, true);
      assert.equal(secondSeed.data.vouchersCreated, 0);
      assert.equal(secondSeed.data.alreadySeeded, true);

      // Verify voucher count remains strictly 7
      const count = await JournalEntry.countDocuments({ companyId: testCompanyA._id });
      assert.equal(count, 7);
    });
  });

  // ==========================================
  // 3. TENANT ISOLATION (A-9 খ)
  // ==========================================
  describe('Rule A-9 (খ): Tenant Boundary Isolation', () => {
    it('should strictly isolate data: Company B must see 0 figures despite Company A being seeded', async () => {
      if (!testCompanyB) return;

      const summaryB = await service.getSummary(tenantContextB, {
        compareTo: 'PREVIOUS_PERIOD',
      });

      // Company B has zero vouchers
      assert.equal(summaryB.kpis.cashAndBank.value, '0.00');
      assert.equal(summaryB.finance.profitAndLoss.revenue, '0.00');
      assert.equal(summaryB.recentJournalStream.length, 0);
    });

    it('should reject User A attempting to access Company B (Cross-Tenant Rejection)', async () => {
      if (!testCompanyB) return;

      const crossTenantContext: TenantContext = {
        userId: testUserA._id.toString(),
        companyId: testCompanyB._id.toString(),
        role: 'owner',
      };

      // Service should reject cross-tenant access because User A has no membership in Company B
      await assert.rejects(async () => {
        await service.getSummary(crossTenantContext, defaultFilter);
      });
    });
  });

  // ==========================================
  // 4. ROLE GUARDS & PRODUCTION BLOCK (A-9 গ & ঘ)
  // ==========================================
  describe('Rule A-9 (গ & ঘ): Security Policies & Role Guards', () => {
    it('should reject non-owner role with 403 Forbidden on seed-demo (A-9 গ)', async () => {
      if (!testCompanyA) return;

      const viewerContext: TenantContext = {
        ...tenantContextA,
        role: 'viewer',
      };

      await assert.rejects(
        async () => {
          await service.seedDemoJournals(viewerContext, userPayloadA);
        },
        (err: any) => err instanceof ForbiddenException || /Only company owners/.test(err.message)
      );
    });

    it('should strictly block seed-demo in production environments (A-9 ঘ)', async () => {
      if (!testCompanyA) return;

      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';

        await assert.rejects(
          async () => {
            await service.seedDemoJournals(tenantContextA, userPayloadA);
          },
          (err: any) => err instanceof ForbiddenException || /disabled in production/.test(err.message)
        );
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  // ==========================================
  // 5. CACHE HOOK & REACTIVE INVALIDATION (A-5)
  // ==========================================
  describe('Rule A-5: Automatic Mongoose Hook Cache Invalidation', () => {
    it('should automatically invalidate cache upon JournalEntry.save() hook', async () => {
      if (!testCompanyA) return;

      // Prime cache
      const fresh1 = await service.getSummary(tenantContextA, defaultFilter);
      assert.equal(fresh1.cached, false);

      const cached1 = await service.getSummary(tenantContextA, defaultFilter);
      assert.equal(cached1.cached, true, 'Second fetch must be cached');

      // Save a new journal entry (triggers Mongoose post-save hook)
      const accCash = await Account.findOne({ companyId: testCompanyA._id, code: '1010' });
      const accCapital = await Account.findOne({ companyId: testCompanyA._id, code: '3010' });

      if (accCash && accCapital) {
        const extraVoucher = new JournalEntry({
          companyId: testCompanyA._id,
          entryNumber: `JV-EXTRA-${Date.now()}`,
          voucherType: 'RECEIPT',
          entryDate: new Date(),
          description: 'Reactive Cache Hook Validation Voucher',
          totalDebit: Types.Decimal128.fromString('1000.00'),
          totalCredit: Types.Decimal128.fromString('1000.00'),
          status: 'POSTED',
          lines: [
            {
              accountId: accCash._id,
              accountCode: accCash.code,
              accountName: accCash.name,
              debit: Types.Decimal128.fromString('1000.00'),
              credit: Types.Decimal128.fromString('0.00'),
            },
            {
              accountId: accCapital._id,
              accountCode: accCapital.code,
              accountName: accCapital.name,
              debit: Types.Decimal128.fromString('0.00'),
              credit: Types.Decimal128.fromString('1000.00'),
            },
          ],
        });
        await extraVoucher.save();
        cleanupIds.journals.push(extraVoucher._id.toString());

        // Fetch summary immediately after save — must be fresh (cached: false)
        const afterHook = await service.getSummary(tenantContextA, defaultFilter);
        assert.equal(
          afterHook.cached,
          false,
          'Mongoose post-save hook must immediately invalidate company dashboard cache'
        );
      }
    });

    it('should successfully execute controller getSummary HTTP entrypoint', async () => {
      if (!testCompanyA) return;

      const ctrlResult = await controller.getSummary(tenantContextA, {});
      assert(ctrlResult);
      assert.equal(ctrlResult.currency, 'AED');
      assert(ctrlResult.kpis);
    });
  });
});
