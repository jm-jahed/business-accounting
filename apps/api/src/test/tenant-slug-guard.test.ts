import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { ExecutionContext, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { dbManager, User, Company, CompanyMembership, assertTestDatabase } from '@accounting/database';
import { TenantGuard } from '../common/guards/tenant.guard.js';

function createMockExecutionContext(req: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

describe('TenantGuard Store-Based Routing & Tenant Isolation Suite', () => {
  const guard = new TenantGuard();

  let userAId: string;
  let userBId: string;
  let companyAId: string;
  let companyBId: string;

  const slugA = `store-alpha-${Date.now().toString().slice(-4)}`;
  const slugB = `store-beta-${Date.now().toString().slice(-4)}`;

  before(async () => {
    if (process.env.MONGODB_URI) {
      // Mandatory Test Safety Invariant: Refuse execution if DB does not end with _test
      const dbName = process.env.DB_NAME || 'business_accounting_test';
      assertTestDatabase(dbName);
      await dbManager.connect();

      // Seed User A (Member of Company A only)
      const userA = await User.create({
        email: `usera_${Date.now()}@test.ae`,
        passwordHash: 'dummy-hash',
        fullName: 'User Alpha',
      });
      userAId = userA._id.toString();

      // Seed User B (Member of Company B only)
      const userB = await User.create({
        email: `userb_${Date.now()}@test.ae`,
        passwordHash: 'dummy-hash',
        fullName: 'User Beta',
      });
      userBId = userB._id.toString();

      // Seed Company A
      const compA = await Company.create({
        name: 'Store Alpha LLC',
        slug: slugA,
        legalName: 'Store Alpha General Trading LLC',
        currency: 'AED',
        status: 'active',
      });
      companyAId = compA._id.toString();

      await CompanyMembership.create({
        userId: userAId,
        companyId: companyAId,
        role: 'admin',
        branchAccess: 'all',
        status: 'active',
      });

      // Seed Company B
      const compB = await Company.create({
        name: 'Store Beta LLC',
        slug: slugB,
        legalName: 'Store Beta General Trading LLC',
        currency: 'AED',
        status: 'active',
      });
      companyBId = compB._id.toString();

      await CompanyMembership.create({
        userId: userBId,
        companyId: companyBId,
        role: 'admin',
        branchAccess: 'all',
        status: 'active',
      });
    }
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      if (userAId) await User.deleteOne({ _id: userAId });
      if (userBId) await User.deleteOne({ _id: userBId });
      if (companyAId) {
        await Company.deleteOne({ _id: companyAId });
        await CompanyMembership.deleteMany({ companyId: companyAId });
      }
      if (companyBId) {
        await Company.deleteOne({ _id: companyBId });
        await CompanyMembership.deleteMany({ companyId: companyBId });
      }
    }
  });

  it('should allow User A to access Company A using storeSlug', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const req: any = {
      user: { sub: userAId, email: 'usera@test.ae' },
      params: { storeSlug: slugA },
      headers: {},
      query: {},
    };

    const allowed = await guard.canActivate(createMockExecutionContext(req));
    assert.equal(allowed, true);
    assert.ok(req.tenant);
    assert.equal(req.tenant.companyId, companyAId);
    assert.equal(req.tenant.companySlug, slugA);
    assert.equal(req.tenant.role, 'admin');
  });

  it('CRITICAL: should reject User A attempting to access Company B via storeSlug (Cross-Tenant Access)', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const req: any = {
      user: { sub: userAId, email: 'usera@test.ae' },
      params: { storeSlug: slugB }, // Tampered URL pointing to store B
      headers: {},
      query: {},
    };

    await assert.rejects(
      async () => guard.canActivate(createMockExecutionContext(req)),
      (err: any) => {
        assert(err instanceof ForbiddenException);
        assert.equal(err.message, 'Access denied: You are not an authorized member of this store.');
        return true;
      }
    );
  });

  it('CRITICAL: should reject cross-tenant mismatch between storeSlug and x-company-id header', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const req: any = {
      user: { sub: userAId, email: 'usera@test.ae' },
      params: { storeSlug: slugA }, // Store Alpha
      headers: { 'x-company-id': companyBId }, // Injected Company Beta ID
      query: {},
    };

    await assert.rejects(
      async () => guard.canActivate(createMockExecutionContext(req)),
      (err: any) => {
        assert(err instanceof ForbiddenException);
        assert.equal(err.message, 'Cross-tenant access violation: Store slug and company ID mismatch.');
        return true;
      }
    );
  });

  it('should reject invalid slug formats with BadRequestException', async () => {
    const req: any = {
      user: { sub: 'mock-user' },
      params: { storeSlug: 'INVALID_UPPERCASE!' },
      headers: {},
      query: {},
    };

    await assert.rejects(
      async () => guard.canActivate(createMockExecutionContext(req)),
      (err: any) => {
        assert(err instanceof BadRequestException);
        return true;
      }
    );
  });

  it('should reject reserved system keywords as store slugs', async () => {
    const req: any = {
      user: { sub: 'mock-user' },
      params: { storeSlug: 'admin' },
      headers: {},
      query: {},
    };

    await assert.rejects(
      async () => guard.canActivate(createMockExecutionContext(req)),
      (err: any) => {
        assert(err instanceof BadRequestException);
        assert(err.message.includes('reserved system keyword'));
        return true;
      }
    );
  });

  it('should fail closed when user context is missing from request', async () => {
    const req: any = {
      user: null,
      params: { storeSlug: slugA },
      headers: {},
      query: {},
    };

    await assert.rejects(
      async () => guard.canActivate(createMockExecutionContext(req)),
      (err: any) => {
        assert(err instanceof ForbiddenException);
        assert(err.message.includes('Unauthenticated actor'));
        return true;
      }
    );
  });

  it('should return NotFoundException when store slug does not exist', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const req: any = {
      user: { sub: userAId },
      params: { storeSlug: 'non-existent-store-xyz-123' },
      headers: {},
      query: {},
    };

    await assert.rejects(
      async () => guard.canActivate(createMockExecutionContext(req)),
      (err: any) => {
        assert(err instanceof NotFoundException);
        return true;
      }
    );
  });
});
