import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { ExecutionContext } from '@nestjs/common';
import mongoose, { Types } from 'mongoose';
import {
  dbManager,
  User,
  Company,
  CompanyMembership,
  Subscription,
  SuperAdminUser,
  Plan,
  PlanPrice,
  AdminAuditLog,
  AdminExchangeRate,
  CountryRegionMapping,
  assertTestDatabase,
  verifyAdminAuditChain,
} from '@accounting/database';
import { TenantGuard } from '../common/guards/tenant.guard.js';
import { AdminJwtAuthGuard } from '../admin/guards/admin-jwt-auth.guard.js';
import { AdminRateLimitGuard } from '../admin/guards/admin-rate-limit.guard.js';
import { AdminCorsGuard } from '../admin/guards/admin-cors.guard.js';
import { AdminJwtService } from '../admin/services/admin-jwt.service.js';
import { AdminTotpService } from '../admin/services/admin-totp.service.js';
import { AdminAuditService } from '../admin/services/admin-audit.service.js';
import { AdminAuthService } from '../admin/auth/admin-auth.service.js';
import { AdminPlansService } from '../admin/plans/admin-plans.service.js';
import { AdminCompaniesService } from '../admin/companies/admin-companies.service.js';
import { AdminDashboardService } from '../admin/dashboard/admin-dashboard.service.js';
import { AdminTeamService } from '../admin/team/admin-team.service.js';
import { seedSuperAdmin } from '../scripts/seed-admin.js';
import { JwtService } from '../auth/jwt.service.js';

function createMockExecutionContext(req: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('Super Admin Phase A1 Suite: Foundation, Isolation, Plans, Subscriptions & Audit', () => {
  const clientJwtService = new JwtService();
  const adminJwtService = new AdminJwtService();
  const adminTotpService = new AdminTotpService();
  const auditService = new AdminAuditService();
  const adminAuthService = new AdminAuthService(adminJwtService, adminTotpService, auditService);
  const plansService = new AdminPlansService(auditService);
  const companiesService = new AdminCompaniesService(auditService);
  const dashboardService = new AdminDashboardService(auditService);
  const teamService = new AdminTeamService(auditService);

  const tenantGuard = new TenantGuard();
  const adminGuard = new AdminJwtAuthGuard(adminJwtService);

  let testCompanyId: string;
  let testUserId: string;
  const storeSlug = `admin-test-store-${Date.now().toString().slice(-4)}`;

  before(async () => {
    if (process.env.MONGODB_URI) {
      if (!process.env.DB_NAME || !process.env.DB_NAME.endsWith('_test')) {
        process.env.DB_NAME = 'business_accounting_test';
      }
      assertTestDatabase(process.env.DB_NAME);
      await dbManager.connect();

      // Clean test collections using raw collection driver to bypass Mongoose anti-delete middleware
      await SuperAdminUser.collection.deleteMany({});
      await Plan.collection.deleteMany({});
      await PlanPrice.collection.deleteMany({});
      await Subscription.collection.deleteMany({});
      await AdminAuditLog.collection.deleteMany({});
      await AdminExchangeRate.collection.deleteMany({});
      await CountryRegionMapping.collection.deleteMany({});

      // Seed client user & company for subscription isolation tests
      const clientUser = await User.create({
        email: `client_${Date.now()}@test.ae`,
        fullName: 'Client Merchant',
        passwordHash: 'dummy',
      });
      testUserId = clientUser._id.toString();

      const comp = await Company.create({
        name: 'Merchant Test Entity LLC',
        slug: storeSlug,
        legalName: 'Merchant Test Entity LLC',
        currency: 'AED',
        status: 'active',
      });
      testCompanyId = comp._id.toString();

      await CompanyMembership.create({
        userId: testUserId,
        companyId: comp._id,
        role: 'owner',
        status: 'active',
      });
    }
  });

  // ==========================================
  // Test 1: Static Analysis Financial Privacy Invariant
  // ==========================================
  it('Financial Privacy Invariant: Admin module source files must NEVER import financial transaction services (GeneralLedger, JournalEntry, Account)', () => {
    const adminSrcDir = path.resolve(__dirname, '../../src/admin');
    const adminDistDir = path.resolve(__dirname, '../admin');
    const targetDir = fs.existsSync(adminSrcDir) ? adminSrcDir : adminDistDir;
    const files: string[] = [];

    function walkDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const fullPath = path.join(dir, e.name);
        if (e.isDirectory()) {
          walkDir(fullPath);
        } else if ((e.name.endsWith('.ts') || e.name.endsWith('.js')) && !e.name.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
    }

    walkDir(targetDir);
    assert.ok(files.length > 5, 'Admin module files should exist');

    const forbiddenImports = ['GeneralLedger', 'JournalEntry', 'journal.service', 'account.service'];

    for (const f of files) {
      const content = fs.readFileSync(f, 'utf8');
      for (const forbidden of forbiddenImports) {
        assert.strictEqual(
          content.includes(forbidden),
          false,
          `Privacy Violation in ${path.basename(f)}: Super Admin must NEVER import or query ${forbidden}`
        );
      }
    }
  });

  // ==========================================
  // Test 2: Super Admin Seeding & Single-SuperAdmin Refusal
  // ==========================================
  it('seedSuperAdmin: Should create initial SUPER_ADMIN with mustChangePassword=true and refuse second creation', async () => {
    const initialUserCount = await User.countDocuments();

    // 1. First seed: success
    const result1 = await seedSuperAdmin({
      email: 'founder@platform.local',
      name: 'Platform Founder',
      password: 'InitialSecurePassword123!',
    });
    assert.strictEqual(result1.success, true);

    const admin = await SuperAdminUser.findOne({ email: 'founder@platform.local' });
    assert.ok(admin);
    assert.strictEqual(admin.role, 'SUPER_ADMIN');
    assert.strictEqual(admin.mustChangePassword, true);
    assert.strictEqual(admin.isTotpEnabled, false);

    // Verify client User collection was untouched
    const afterUserCount = await User.countDocuments();
    assert.strictEqual(initialUserCount, afterUserCount, 'Client User collection must NOT be touched');

    // 2. Second seed: must refuse
    const result2 = await seedSuperAdmin({
      email: 'second@platform.local',
      name: 'Second Admin',
      password: 'AnotherPassword123!',
    });
    assert.strictEqual(result2.success, false);
    assert.strictEqual(result2.reason, 'ALREADY_EXISTS');
  });

  // ==========================================
  // Test 3: Token Scope Isolation (Client vs Admin)
  // ==========================================
  it('Token Scope Isolation: Super Admin token rejected on client API; Client token rejected on Admin API', async () => {
    // 1. Sign Super Admin token
    const adminToken = adminJwtService.signAccessToken({
      sub: 'admin-123',
      email: 'admin@platform.local',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    });

    // 2. Sign Client token
    const clientToken = clientJwtService.signAccessToken({
      sub: testUserId,
      email: 'client@test.ae',
      fullName: 'Client User',
      tokenType: 'CLIENT',
    });

    // Client Token presented to Admin Guard -> must reject with UnauthorizedException
    const adminReq = {
      headers: { authorization: `Bearer ${clientToken}` },
      cookies: {},
    };
    await assert.rejects(
      async () => adminGuard.canActivate(createMockExecutionContext(adminReq)),
      /invalid signature|Invalid token scope|Super Admin access token/i
    );

    // Admin Token presented to Client TenantGuard -> must fail
    const clientReq = {
      user: { sub: 'admin-123', tokenType: 'SUPER_ADMIN' },
      params: { storeSlug },
      headers: {},
      query: {},
    };
    await assert.rejects(
      async () => tenantGuard.canActivate(createMockExecutionContext(clientReq)),
      /Access denied: You are not an authorized member/
    );

    // Client JWT service verification of Admin Token must explicitly fail (isolated secret)
    assert.throws(
      () => clientJwtService.verifyAccessToken(adminToken),
      /invalid signature|Invalid token scope/i
    );

    // If an attacker forged a token with tokenType: 'SUPER_ADMIN' signed by client secret, it must fail scope check
    const forgedAdminToken = clientJwtService.signAccessToken({
      sub: 'attacker-1',
      email: 'attacker@evil.com',
      fullName: 'Attacker',
      tokenType: 'SUPER_ADMIN' as any,
    });
    assert.throws(
      () => clientJwtService.verifyAccessToken(forgedAdminToken),
      /Invalid token scope/
    );
  });

  // ==========================================
  // Test 4: TOTP Verification, Replay Attack & Lockout
  // ==========================================
  it('TOTP Security: 2-step verification, replay protection, and 5-attempt brute-force lockout', async () => {
    // Setup TOTP for the founder
    const loginRes = await adminAuthService.login({
      email: 'founder@platform.local',
      password: 'InitialSecurePassword123!',
    });
    assert.ok(loginRes.tempToken);
    assert.strictEqual(loginRes.requiresTotpSetup, true);

    const setup = await adminAuthService.setupTotp(loginRes.tempToken);
    assert.ok(setup.secret);
    assert.strictEqual(setup.recoveryCodes.length, 8);

    // Verify with recovery code
    const recoveryCode = setup.recoveryCodes[0];
    const verifyRes = await adminAuthService.verifyTotp({
      tempToken: loginRes.tempToken,
      totpCode: recoveryCode,
    });
    assert.ok(verifyRes.accessToken);
    assert.strictEqual(verifyRes.user.isTotpEnabled, true);

    // Replay attack test: using the burned recovery code again must fail
    await assert.rejects(
      async () =>
        adminAuthService.verifyTotp({
          tempToken: loginRes.tempToken,
          totpCode: recoveryCode,
        }),
      /Invalid or expired 2-step verification code/
    );

    // Brute-force lockout test: 5 wrong password attempts
    for (let i = 0; i < 4; i++) {
      await assert.rejects(
        async () =>
          adminAuthService.login({
            email: 'founder@platform.local',
            password: 'WrongPassword!',
          }),
        /Invalid email or password/
      );
    }

    // 5th attempt triggers lockout
    await assert.rejects(
      async () =>
        adminAuthService.login({
          email: 'founder@platform.local',
          password: 'WrongPassword!',
        }),
      /Account locked/
    );
  });

  // ==========================================
  // Test 5: Subscription Enforcement in TenantGuard
  // ==========================================
  it('Subscription Enforcement: Legacy=ACTIVE, READ_ONLY blocks mutations, SUSPENDED blocks all', async () => {
    const compObjId = new Types.ObjectId(testCompanyId);

    // 1. Legacy company (no Subscription document exists) -> mutation allowed
    const req1 = {
      user: { sub: testUserId },
      params: { storeSlug },
      method: 'POST',
      headers: {},
      query: {},
    };
    const allowedLegacy = await tenantGuard.canActivate(createMockExecutionContext(req1));
    assert.strictEqual(allowedLegacy, true);

    // 2. READ_ONLY Subscription -> GET allowed, POST blocked
    await Subscription.create({
      companyId: compObjId,
      planId: new Types.ObjectId(),
      planCode: 'starter',
      billingCycle: 'MONTHLY',
      currency: 'AED',
      amount: Types.Decimal128.fromString('150.00'),
      seats: 3,
      status: 'READ_ONLY',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 86400000),
    });
    TenantGuard.invalidateSubscriptionCache(testCompanyId);

    const reqGet = {
      user: { sub: testUserId },
      params: { storeSlug },
      method: 'GET',
      headers: {},
      query: {},
    };
    const allowedGet = await tenantGuard.canActivate(createMockExecutionContext(reqGet));
    assert.strictEqual(allowedGet, true, 'GET must be allowed in READ_ONLY status');

    const reqPost = {
      user: { sub: testUserId },
      params: { storeSlug },
      method: 'POST',
      headers: {},
      query: {},
    };
    await assert.rejects(
      async () => tenantGuard.canActivate(createMockExecutionContext(reqPost)),
      /Subscription is in read-only mode/
    );

    // 3. SUSPENDED Subscription -> all blocked
    await Subscription.updateOne({ companyId: compObjId }, { status: 'SUSPENDED' });
    TenantGuard.invalidateSubscriptionCache(testCompanyId);
    await assert.rejects(
      async () => tenantGuard.canActivate(createMockExecutionContext(reqGet)),
      /Company account is suspended/
    );

    // Verify company listing and derived status via AdminCompaniesService
    const compList = await companiesService.listCompanies({ limit: 10, offset: 0 });
    assert.ok(compList.items.length >= 1);
    const listed = compList.items.find((c: { id: string; subscription: { status: string } }) => c.id === testCompanyId);
    assert.ok(listed);
    assert.strictEqual(listed.subscription.status, 'SUSPENDED');
  });

  // ==========================================
  // Test 6: Plan & Price Versioning & Anti-Hard-Delete
  // ==========================================
  it('Plan & Pricing: Decimal128 precision, grandfathered versioning, and anti-hard-delete invariant', async () => {
    const adminActor = {
      sub: 'admin-1',
      email: 'founder@platform.local',
      name: 'Platform Founder',
      role: 'SUPER_ADMIN' as const,
      tokenType: 'SUPER_ADMIN' as const,
    };

    // 1. Create Plan
    const plan = await plansService.createPlan(
      {
        code: 'growth-pro',
        nameEn: 'Growth Professional',
        nameBn: 'গ্রোথ প্রফেশনাল',
        isPublic: true,
        isActive: true,
        modules: ['accounting', 'inventory'],
        limits: { users: 5, companies: 1, invoicesPerMonth: 500, storageMb: 1024 },
        sortOrder: 1,
      },
      adminActor
    );
    assert.strictEqual(plan.code, 'growth-pro');

    // 2. Add Price: 250.00 AED Monthly
    const price1 = await plansService.createPlanPrice(
      {
        planId: plan.id,
        region: 'GULF',
        currency: 'AED',
        billingCycle: 'MONTHLY',
        amount: '250.00',
        extraUserAmount: '50.00',
      },
      adminActor
    );
    assert.strictEqual(price1.amount, '250.00');

    // 3. Deactivate price (Grandfathered pricing: price document is NOT deleted)
    await plansService.deactivatePlanPrice(price1.id, adminActor);
    const deactivatedPrice = await PlanPrice.findById(price1.id);
    assert.ok(deactivatedPrice);
    assert.strictEqual(deactivatedPrice.isActive, false);
    assert.ok(deactivatedPrice.effectiveTo);

    // 4. Anti-hard-delete check: direct delete call on Plan or PlanPrice must throw
    await assert.rejects(
      async () => Plan.deleteOne({ _id: plan.id }),
      /Hard deleting plans is prohibited/
    );
    await assert.rejects(
      async () => PlanPrice.deleteOne({ _id: price1.id }),
      /Hard deleting plan prices is prohibited/
    );
  });

  // ==========================================
  // Test 7: Strict MRR & ARR Math with Hand-Calculated Proof
  // ==========================================
  it('MRR & ARR Formula: Monthly=amount, 6-Mo=amount/6, Yearly=amount/12 with hand-calculated proof', async () => {
    // Clear subscriptions
    await Subscription.collection.deleteMany({});
    await Company.collection.deleteMany({});
    await AdminExchangeRate.collection.deleteMany({});

    // Hand-calculated scenario:
    // Company 1: AED 100.00 Monthly -> MRR = 100.00, ARR = 1200.00
    // Company 2: AED 600.00 Six Months -> 600 / 6 = 100.00 MRR, ARR = 1200.00
    // Company 3: AED 1200.00 Yearly -> 1200 / 12 = 100.00 MRR, ARR = 1200.00
    // Total Expected AED MRR = 100 + 100 + 100 = 300.00 AED
    // Total Expected AED ARR = 300 * 12 = 3600.00 AED
    //
    // Company 4: USD 1200.00 Yearly -> 1200 / 12 = 100.00 USD MRR

    const c1 = await Company.create({ name: 'Co 1', slug: 'co-1', legalName: 'C1', currency: 'AED', countryCode: 'AE', status: 'active' });
    const c2 = await Company.create({ name: 'Co 2', slug: 'co-2', legalName: 'C2', currency: 'AED', countryCode: 'AE', status: 'active' });
    const c3 = await Company.create({ name: 'Co 3', slug: 'co-3', legalName: 'C3', currency: 'AED', countryCode: 'AE', status: 'active' });
    const c4 = await Company.create({ name: 'Co 4', slug: 'co-4', legalName: 'C4', currency: 'USD', countryCode: 'US', country: 'United States', status: 'active' });

    const dummyPlanId = new Types.ObjectId();
    const futureDate = new Date(Date.now() + 30 * 86400000);

    await Subscription.create([
      { companyId: c1._id, planId: dummyPlanId, planCode: 'starter', billingCycle: 'MONTHLY', currency: 'AED', amount: Types.Decimal128.fromString('100.00'), seats: 3, status: 'ACTIVE', currentPeriodStart: new Date(), currentPeriodEnd: futureDate },
      { companyId: c2._id, planId: dummyPlanId, planCode: 'starter', billingCycle: 'SIX_MONTHS', currency: 'AED', amount: Types.Decimal128.fromString('600.00'), seats: 3, status: 'ACTIVE', currentPeriodStart: new Date(), currentPeriodEnd: futureDate },
      { companyId: c3._id, planId: dummyPlanId, planCode: 'starter', billingCycle: 'YEARLY', currency: 'AED', amount: Types.Decimal128.fromString('1200.00'), seats: 3, status: 'ACTIVE', currentPeriodStart: new Date(), currentPeriodEnd: futureDate },
      { companyId: c4._id, planId: dummyPlanId, planCode: 'starter', billingCycle: 'YEARLY', currency: 'USD', amount: Types.Decimal128.fromString('1200.00'), seats: 3, status: 'ACTIVE', currentPeriodStart: new Date(), currentPeriodEnd: futureDate },
    ]);

    // 1. Overview without USD exchange rate set -> totalEstimatedMrr must be null
    const overview1 = await dashboardService.getOverview();
    const aedStat = overview1.mrrByCurrency.find((s) => s.currency === 'AED');
    const usdStat = overview1.mrrByCurrency.find((s) => s.currency === 'USD');

    assert.ok(aedStat);
    assert.strictEqual(aedStat.mrrAmount, '300.00', 'Hand calculation assertion: AED MRR must be exactly 300.00');
    assert.strictEqual(aedStat.arrAmount, '3600.00', 'Hand calculation assertion: AED ARR must be exactly 3600.00');

    assert.ok(usdStat);
    assert.strictEqual(usdStat.mrrAmount, '100.00', 'Hand calculation assertion: USD MRR must be exactly 100.00');

    assert.strictEqual(overview1.totalEstimatedMrr, null, 'Must NOT show total when exchange rates are missing');

    // 2. Set Admin exchange rate: 1 USD = 3.6725 AED
    const adminActor = { sub: 'admin-1', email: 'founder@platform.local', name: 'Founder', role: 'SUPER_ADMIN' as const, tokenType: 'SUPER_ADMIN' as const };
    await dashboardService.setExchangeRate('USD', 'AED', '3.6725', adminActor);

    // Overview with rate: Total = 300 + (100 * 3.6725) = 300 + 367.25 = 667.25 AED
    const overview2 = await dashboardService.getOverview();
    assert.ok(overview2.totalEstimatedMrr);
    assert.strictEqual(overview2.totalEstimatedMrr.amount, '667.25', 'Hand calculation assertion: 300 + (100 * 3.6725) = 667.25');
    assert.strictEqual(overview2.totalEstimatedMrr.label, 'Estimated');
  });

  // ==========================================
  // Test 8: Admin Team Invariants
  // ==========================================
  it('Admin Team Invariants: Cannot change own role, cannot demote/suspend last SUPER_ADMIN', async () => {
    const founder = await SuperAdminUser.findOne({ email: 'founder@platform.local' });
    assert.ok(founder);

    const founderActor = {
      sub: founder._id.toString(),
      email: founder.email,
      name: founder.name,
      role: 'SUPER_ADMIN' as const,
      tokenType: 'SUPER_ADMIN' as const,
    };

    // 1. Changing own role -> rejected
    await assert.rejects(
      async () =>
        teamService.updateAdmin(founder._id.toString(), { role: 'SUPPORT' }, founderActor),
      /You cannot change your own admin role/
    );

    // 2. Suspending last SUPER_ADMIN -> rejected
    await assert.rejects(
      async () =>
        teamService.updateAdmin(founder._id.toString(), { status: 'suspended' }, founderActor),
      /Cannot suspend the last remaining active SUPER_ADMIN/
    );

    // 3. Password < 12 characters -> rejected
    await assert.rejects(
      async () =>
        teamService.createAdmin(
          { email: 'short@test.ae', name: 'Short Pwd', role: 'SUPPORT', password: 'short' },
          founderActor
        ),
      /Admin password must be at least 12 characters/
    );
  });

  // ==========================================
  // Test 9: Cryptographic Hash Chaining & Tamper Detection
  // ==========================================
  it('Audit Log Chaining: Continuous SHA-256 chain and immediate tamper detection on altered payload', async () => {
    await AdminAuditLog.collection.deleteMany({});

    // Create 3 chained entries
    await auditService.logAction({
      actorId: 'admin-1',
      actorEmail: 'admin@platform.local',
      adminRole: 'SUPER_ADMIN',
      action: 'admin.test.action_one',
      targetType: 'Company',
      targetId: 'comp-1',
      afterState: { key: 'val1', passwordHash: 'SECRET_SHOULD_BE_REDACTED' },
    });

    await auditService.logAction({
      actorId: 'admin-1',
      actorEmail: 'admin@platform.local',
      adminRole: 'SUPER_ADMIN',
      action: 'admin.test.action_two',
      targetType: 'Plan',
      targetId: 'plan-1',
      afterState: { key: 'val2' },
    });

    await auditService.logAction({
      actorId: 'admin-1',
      actorEmail: 'admin@platform.local',
      adminRole: 'SUPER_ADMIN',
      action: 'admin.test.action_three',
      targetType: 'Subscription',
      targetId: 'sub-1',
      afterState: { key: 'val3' },
    });

    // 1. Verify chain integrity: must be valid
    const verification = await auditService.verifyEntireChain();
    assert.strictEqual(verification.isValid, true);
    assert.strictEqual(verification.totalEntries, 3);

    // 2. Verify credentials sanitization: passwordHash was redacted
    const entry1 = await AdminAuditLog.findOne({ sequenceNumber: 1 }).lean();
    assert.ok(entry1);
    assert.strictEqual(entry1.afterState?.passwordHash, '[REDACTED]', 'Sensitive credential must be redacted in audit log');

    // 3. Verify sequence continuity
    const entry2 = await AdminAuditLog.findOne({ sequenceNumber: 2 }).lean();
    const entry3 = await AdminAuditLog.findOne({ sequenceNumber: 3 }).lean();
    assert.strictEqual(entry2?.prevHash, entry1.hash, 'Sequence 2 prevHash must match Sequence 1 hash');
    assert.strictEqual(entry3?.prevHash, entry2?.hash, 'Sequence 3 prevHash must match Sequence 2 hash');

    // 4. Tamper detection test:
    // If an attacker tampers with entry 2 in-memory or in database, verifyAdminAuditChain must catch it!
    const tamperedEntries = [
      { ...entry1 },
      { ...entry2, hash: 'malicious_tampered_hash_value' },
      { ...entry3 },
    ];
    const tamperResult = verifyAdminAuditChain(tamperedEntries as any[]);
    assert.strictEqual(tamperResult.isValid, false);
    assert.ok(tamperResult.error?.includes('Tampering detected') || tamperResult.error?.includes('broken'));
    assert.strictEqual(tamperResult.brokenSequence, 2);
  });

  // ==========================================
  // Test 10: Admin Rate Limiting & Admin CORS Guard
  // ==========================================
  it('Security: Admin rate limiting (10 attempts on auth routes) and CORS origin isolation', () => {
    AdminRateLimitGuard.reset();
    const rateGuard = new AdminRateLimitGuard();
    const corsGuard = new AdminCorsGuard();

    // 1. Rate limiting on auth routes (10 allowed, 11th rejected with 429)
    const authReq = {
      ip: '192.168.1.50',
      path: '/api/admin/auth/login',
      headers: {},
      socket: { remoteAddress: '192.168.1.50' },
    };

    for (let i = 0; i < 10; i++) {
      const allowed = rateGuard.canActivate(createMockExecutionContext(authReq));
      assert.strictEqual(allowed, true);
    }

    assert.throws(
      () => rateGuard.canActivate(createMockExecutionContext(authReq)),
      /Too many requests to admin panel/
    );

    // 2. Separate CORS origins
    const allowedReq = {
      headers: { origin: 'http://localhost:3001' },
    };
    assert.strictEqual(corsGuard.canActivate(createMockExecutionContext(allowedReq)), true);

    const maliciousReq = {
      headers: { origin: 'https://evil.attacker.com' },
    };
    assert.throws(
      () => corsGuard.canActivate(createMockExecutionContext(maliciousReq)),
      /CORS blocked: Origin "https:\/\/evil\.attacker\.com" is not permitted/
    );
  });

  // ==========================================
  // Test 11: Refresh Token Rotation, Reuse Detection & Logout Revocation
  // ==========================================
  it('Auth Security: Refresh token rotation, replay reuse revocation, and logout revocation', async () => {
    const founder = await SuperAdminUser.findOne({ email: 'founder@platform.local' });
    assert.ok(founder);

    const sessionFamily = 'session-fam-1';
    founder.sessionFamily = sessionFamily;

    const initialRefreshToken = adminJwtService.signRefreshToken({
      sub: founder._id.toString(),
      email: founder.email,
      name: founder.name,
      role: founder.role,
      sessionFamily,
    });
    founder.refreshTokenHash = adminJwtService.hashToken(initialRefreshToken);
    await founder.save();

    // 1. First rotation: success
    const rotated = await adminAuthService.refreshToken(initialRefreshToken);
    assert.ok(rotated.accessToken);
    assert.ok(rotated.refreshToken);
    assert.notStrictEqual(rotated.refreshToken, initialRefreshToken);

    // 2. Replay of old refresh token: must detect reuse and revoke entire session family
    await assert.rejects(
      async () => adminAuthService.refreshToken(initialRefreshToken),
      /Refresh token reuse detected\. Session revoked\./
    );

    const reloaded = await SuperAdminUser.findById(founder._id);
    assert.strictEqual(reloaded?.refreshTokenHash, null);
    assert.strictEqual(reloaded?.sessionFamily, '');

    // 3. New token also invalidated because session was revoked
    await assert.rejects(
      async () => adminAuthService.refreshToken(rotated.refreshToken),
      /Refresh token reuse detected\. Session revoked\./
    );

    // 4. Logout explicitly revokes tokens
    founder.sessionFamily = 'session-fam-2';
    const postLogoutToken = adminJwtService.signRefreshToken({
      sub: founder._id.toString(),
      email: founder.email,
      name: founder.name,
      role: founder.role,
      sessionFamily: 'session-fam-2',
    });
    founder.refreshTokenHash = adminJwtService.hashToken(postLogoutToken);
    await founder.save();

    await adminAuthService.logout(founder._id.toString());
    await assert.rejects(
      async () => adminAuthService.refreshToken(postLogoutToken),
      /Refresh token reuse detected\. Session revoked\./
    );
  });

  // ==========================================
  // Test 12: Mongoose Anti-Delete & Anti-Mutation Security Hooks
  // ==========================================
  it('Model Invariants: Mongoose safety hooks prohibit deleting or mutating immutable entities', async () => {
    // 1. Plan cannot be hard deleted
    await assert.rejects(
      async () => Plan.deleteMany({}),
      /Hard deleting plans is prohibited\. Deactivate the plan instead\./
    );

    // 2. PlanPrice cannot be hard deleted
    await assert.rejects(
      async () => PlanPrice.deleteMany({}),
      /Hard deleting plan prices is prohibited to preserve historical contracts\./
    );

    // 3. AdminAuditLog cannot be deleted
    await assert.rejects(
      async () => AdminAuditLog.deleteMany({}),
      /AdminAuditLog records are append-only and cannot be deleted\./
    );

    // 4. AdminAuditLog cannot be mutated
    await assert.rejects(
      async () => AdminAuditLog.updateOne({}, { action: 'tampered.action' }),
      /AdminAuditLog records are append-only and cannot be mutated\./
    );
  });

  // ==========================================
  // Test 13: TenantGuard Subscription TTL Cache & Instant Block on Suspension
  // ==========================================
  it('TenantGuard: 45s TTL cache, cache invalidation on status change, and immediate block on SUSPENDED', async () => {
    TenantGuard.clearSubscriptionCache();

    const cacheTestComp = await Company.create({
      name: 'Tenant Cache Store LLC',
      slug: `cache-test-${Date.now()}`,
      legalName: 'Tenant Cache Store LLC',
      currency: 'AED',
      status: 'active',
    });
    const cacheCompanyId = cacheTestComp._id.toString();

    await CompanyMembership.create({
      userId: testUserId,
      companyId: cacheTestComp._id,
      role: 'owner',
      status: 'active',
    });

    await Subscription.create({
      companyId: cacheTestComp._id,
      planId: new Types.ObjectId(),
      planCode: 'starter',
      billingCycle: 'MONTHLY',
      currency: 'AED',
      amount: Types.Decimal128.fromString('100.00'),
      seats: 3,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    });

    const clientReq = {
      user: { sub: testUserId },
      params: { storeSlug: cacheTestComp.slug },
      headers: {},
      query: {},
    };

    // 1. Initial access: passes and populates cache
    const initialAllowed = await tenantGuard.canActivate(createMockExecutionContext(clientReq));
    assert.strictEqual(initialAllowed, true);

    const cachedBefore = TenantGuard.getCachedSubscription(cacheCompanyId);
    assert.ok(cachedBefore);
    assert.strictEqual(cachedBefore.status, 'ACTIVE');

    // 2. Admin suspends subscription
    const adminActor = {
      sub: 'admin-1',
      email: 'founder@platform.local',
      name: 'Founder',
      role: 'SUPER_ADMIN' as const,
      tokenType: 'SUPER_ADMIN' as const,
    };
    await companiesService.updateSubscriptionStatus(
      cacheCompanyId,
      { status: 'SUSPENDED', reason: 'Non-payment' },
      adminActor
    );

    // 3. Cache was invalidated immediately
    const cachedAfter = TenantGuard.getCachedSubscription(cacheCompanyId);
    assert.strictEqual(cachedAfter, undefined, 'Cache must be invalidated immediately on subscription change');

    // 4. Next client request is blocked immediately with 403 Forbidden
    await assert.rejects(
      async () => tenantGuard.canActivate(createMockExecutionContext(clientReq)),
      /Company account is suspended/
    );
  });

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
});
