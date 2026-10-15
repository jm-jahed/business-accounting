import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  dbManager,
  User,
  Company,
  CompanyMembership,
  Account,
  AuditLog,
  TenantContext,
  assertTestDatabase,
} from '@accounting/database';
import { AccountsService } from '../accounts/accounts.service.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { JwtUserPayload } from '../auth/jwt.service.js';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { ROLES_KEY } from '../common/decorators/roles.decorator.js';

describe('Batch 2: Chart of Accounts (CoA) CRUD Vertical Slice Test Suite', () => {
  const accountsService = new AccountsService();
  const reflector = new Reflector();
  const rolesGuard = new RolesGuard(reflector);

  let ownerUser: any;
  let accountantUser: any;
  let viewerUser: any;
  let companyA: any;
  let companyB: any;

  let ownerPayload: JwtUserPayload;
  let accountantPayload: JwtUserPayload;

  let tenantAOwner: TenantContext = {
    userId: 'mock-owner',
    companyId: '507f1f77bcf86cd799439011',
    role: 'owner',
  };
  let tenantAAccountant: TenantContext = {
    userId: 'mock-accountant',
    companyId: '507f1f77bcf86cd799439011',
    role: 'accountant',
  };
  let tenantAViewer: TenantContext = {
    userId: 'mock-viewer',
    companyId: '507f1f77bcf86cd799439011',
    role: 'viewer',
  };
  let tenantBOwner: TenantContext = {
    userId: 'mock-owner',
    companyId: '507f1f77bcf86cd799439022',
    role: 'owner',
  };

  const testIdsToCleanup: {
    users: string[];
    companies: string[];
    accounts: string[];
    auditLogs: string[];
  } = {
    users: [],
    companies: [],
    accounts: [],
    auditLogs: [],
  };

  before(async () => {
    if (process.env.MONGODB_URI) {
      const dbName = process.env.DB_NAME || 'business_accounting_test';
      assertTestDatabase(dbName);
      await dbManager.connect();

      // Ensure collections and indexes exist before transactions to prevent catalog change write conflicts
      await Account.createCollection();
      await AuditLog.createCollection();
      await Account.init();
      await AuditLog.init();

      // Seed Users
      ownerUser = await User.create({
        email: `coa_owner_${Date.now()}@test.ae`,
        passwordHash: '$2a$10$dummyhashfortesting0000000000000000000000000000000',
        fullName: 'CoA Owner User',
      });
      testIdsToCleanup.users.push(ownerUser._id.toString());

      accountantUser = await User.create({
        email: `coa_accountant_${Date.now()}@test.ae`,
        passwordHash: '$2a$10$dummyhashfortesting0000000000000000000000000000000',
        fullName: 'CoA Accountant User',
      });
      testIdsToCleanup.users.push(accountantUser._id.toString());

      viewerUser = await User.create({
        email: `coa_viewer_${Date.now()}@test.ae`,
        passwordHash: '$2a$10$dummyhashfortesting0000000000000000000000000000000',
        fullName: 'CoA Viewer User',
      });
      testIdsToCleanup.users.push(viewerUser._id.toString());

      // Seed Companies
      companyA = await Company.create({
        name: 'Alpha General Trading LLC',
        slug: `alpha-gt-${Date.now().toString().slice(-4)}`,
        legalName: 'Alpha General Trading LLC',
        currency: 'AED',
        status: 'active',
      });
      testIdsToCleanup.companies.push(companyA._id.toString());

      companyB = await Company.create({
        name: 'Beta Commercial FZ-LLC',
        slug: `beta-com-${Date.now().toString().slice(-4)}`,
        legalName: 'Beta Commercial FZ-LLC',
        currency: 'USD',
        status: 'active',
      });
      testIdsToCleanup.companies.push(companyB._id.toString());

      // Memberships for Company A
      await CompanyMembership.create({
        userId: ownerUser._id,
        companyId: companyA._id,
        role: 'owner',
        status: 'active',
      });

      await CompanyMembership.create({
        userId: accountantUser._id,
        companyId: companyA._id,
        role: 'accountant',
        status: 'active',
      });

      await CompanyMembership.create({
        userId: viewerUser._id,
        companyId: companyA._id,
        role: 'viewer',
        status: 'active',
      });

      // Membership for Company B
      await CompanyMembership.create({
        userId: ownerUser._id,
        companyId: companyB._id,
        role: 'owner',
        status: 'active',
      });

      // Set up JWT payloads
      ownerPayload = { sub: ownerUser._id.toString(), email: ownerUser.email, fullName: ownerUser.fullName };
      accountantPayload = { sub: accountantUser._id.toString(), email: accountantUser.email, fullName: accountantUser.fullName };

      // Set up Tenant Contexts
      tenantAOwner = {
        userId: ownerUser._id.toString(),
        companyId: companyA._id.toString(),
        companySlug: companyA.slug,
        role: 'owner',
      };

      tenantAAccountant = {
        userId: accountantUser._id.toString(),
        companyId: companyA._id.toString(),
        companySlug: companyA.slug,
        role: 'accountant',
      };

      tenantAViewer = {
        userId: viewerUser._id.toString(),
        companyId: companyA._id.toString(),
        companySlug: companyA.slug,
        role: 'viewer',
      };

      tenantBOwner = {
        userId: ownerUser._id.toString(),
        companyId: companyB._id.toString(),
        companySlug: companyB.slug,
        role: 'owner',
      };
    }
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      if (testIdsToCleanup.accounts.length > 0) {
        await Account.deleteMany({ _id: { $in: testIdsToCleanup.accounts } });
      }
      if (testIdsToCleanup.companies.length > 0) {
        await Account.deleteMany({ companyId: { $in: testIdsToCleanup.companies } });
        await Company.deleteMany({ _id: { $in: testIdsToCleanup.companies } });
        await CompanyMembership.deleteMany({ companyId: { $in: testIdsToCleanup.companies } });
      }
      if (testIdsToCleanup.users.length > 0) {
        await User.deleteMany({ _id: { $in: testIdsToCleanup.users } });
      }
      // Clean up audit logs generated during test
      if (testIdsToCleanup.companies.length > 0) {
        await AuditLog.collection.deleteMany({
          companyId: { $in: testIdsToCleanup.companies.map((id) => new mongoose.Types.ObjectId(id)) },
        });
      }
    }
  });

  it('1. Account Creation: server correctly derives normal balance for each account type', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Asset -> DEBIT
    const assetAcc = await accountsService.createAccount(
      tenantAOwner,
      ownerPayload,
      { code: '1010-TEST', name: 'Cash Register Test', type: 'ASSET' },
      { ip: '127.0.0.1', userAgent: 'NodeTestRunner' }
    );
    testIdsToCleanup.accounts.push(assetAcc.id);
    assert.equal(assetAcc.normalBalance, 'DEBIT');
    assert.equal(assetAcc.code, '1010-TEST');

    // Liability -> CREDIT
    const liabAcc = await accountsService.createAccount(
      tenantAOwner,
      ownerPayload,
      { code: '2010-TEST', name: 'Vendor Payables Test', type: 'LIABILITY' },
      { ip: '127.0.0.1', userAgent: 'NodeTestRunner' }
    );
    testIdsToCleanup.accounts.push(liabAcc.id);
    assert.equal(liabAcc.normalBalance, 'CREDIT');

    // Equity -> CREDIT
    const eqAcc = await accountsService.createAccount(
      tenantAOwner,
      ownerPayload,
      { code: '3010-TEST', name: 'Paid-in Capital Test', type: 'EQUITY' },
      { ip: '127.0.0.1', userAgent: 'NodeTestRunner' }
    );
    testIdsToCleanup.accounts.push(eqAcc.id);
    assert.equal(eqAcc.normalBalance, 'CREDIT');

    // Revenue -> CREDIT
    const revAcc = await accountsService.createAccount(
      tenantAOwner,
      ownerPayload,
      { code: '4010-TEST', name: 'Consulting Sales Test', type: 'REVENUE' },
      { ip: '127.0.0.1', userAgent: 'NodeTestRunner' }
    );
    testIdsToCleanup.accounts.push(revAcc.id);
    assert.equal(revAcc.normalBalance, 'CREDIT');

    // Expense -> DEBIT (created by Accountant role)
    const expAcc = await accountsService.createAccount(
      tenantAAccountant,
      accountantPayload,
      { code: '5010-TEST', name: 'Direct Job Expense Test', type: 'EXPENSE' },
      { ip: '127.0.0.1', userAgent: 'NodeTestRunner' }
    );
    testIdsToCleanup.accounts.push(expAcc.id);
    assert.equal(expAcc.normalBalance, 'DEBIT');

    // Verify Audit Log was appended for assetAcc
    const audit = await AuditLog.findOne({
      targetId: assetAcc.id,
      action: 'account.created',
    }).lean();
    assert.ok(audit);
    assert.equal(audit.actorId, ownerPayload.sub);
    assert.equal(audit.outcome, 'success');
    assert.equal(audit.ipAddress, '127.0.0.1');
  });

  it('2. List and Filter: retrieves accounts with search and type filters', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Search by code
    const byCode = await accountsService.listAccounts(tenantAOwner, {
      search: '1010-TEST',
    });
    assert.equal(byCode.length, 1);
    assert.equal(byCode[0].code, '1010-TEST');

    // Search by name substring
    const byName = await accountsService.listAccounts(tenantAOwner, {
      search: 'Vendor Payables',
    });
    assert.equal(byName.length, 1);
    assert.equal(byName[0].code, '2010-TEST');

    // Filter by type
    const assetsOnly = await accountsService.listAccounts(tenantAOwner, {
      type: 'ASSET',
    });
    assert.ok(assetsOnly.some((a) => a.code === '1010-TEST'));
    assert.ok(!assetsOnly.some((a) => a.code === '2010-TEST'));
  });

  it('3. Read single: successfully retrieves single account by ID', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const [account] = await accountsService.listAccounts(tenantAOwner, {
      search: '1010-TEST',
    });
    const retrieved = await accountsService.getAccountById(tenantAOwner, account.id);
    assert.equal(retrieved.id, account.id);
    assert.equal(retrieved.name, account.name);
  });

  it('4. Update permitted fields: updates name and description, creates audit log', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const [account] = await accountsService.listAccounts(tenantAOwner, {
      search: '1010-TEST',
    });

    const updated = await accountsService.updateAccount(
      tenantAOwner,
      ownerPayload,
      account.id,
      {
        name: 'Main Cash Register Updated',
        description: 'Updated operating cash description',
      },
      { ip: '192.168.1.1' }
    );

    assert.equal(updated.name, 'Main Cash Register Updated');
    assert.equal(updated.description, 'Updated operating cash description');

    // Verify Audit record contains changes
    const audit = await AuditLog.findOne({
      targetId: account.id,
      action: 'account.updated',
    }).sort({ createdAt: -1 }).lean();
    assert.ok(audit);
    assert.equal(audit.outcome, 'success');
    assert.equal(audit.metadata?.changes?.name, 'Main Cash Register Updated');
  });

  it('5. Duplicate Account Codes: rejects duplicate code within same company (handles race/index)', async () => {
    if (mongoose.connection.readyState !== 1) return;

    await assert.rejects(
      async () => {
        await accountsService.createAccount(
          tenantAOwner,
          ownerPayload,
          { code: '1010-TEST', name: 'Duplicate Code Attempt', type: 'ASSET' }
        );
      },
      (err: any) => {
        return (
          err instanceof ConflictException ||
          err.message.includes('already exists')
        );
      }
    );
  });

  it('6. Multi-Tenant Code Independence: allows identical code in a different company', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Company B creates code '1010-TEST' — should succeed because companyId differs
    const compBAcc = await accountsService.createAccount(
      tenantBOwner,
      ownerPayload,
      { code: '1010-TEST', name: 'Company B Cash Account', type: 'ASSET' }
    );
    testIdsToCleanup.accounts.push(compBAcc.id);

    assert.ok(compBAcc.id);
    assert.equal(compBAcc.companyId, companyB._id.toString());
    assert.equal(compBAcc.code, '1010-TEST');
  });

  it('7. Cross-Tenant Isolation: rejects access when tenant attempts to read or mutate another company account', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const [compAAccount] = await accountsService.listAccounts(tenantAOwner, {
      search: '1010-TEST',
    });

    // Tenant B attempts to read Company A account
    await assert.rejects(
      async () => {
        await accountsService.getAccountById(tenantBOwner, compAAccount.id);
      },
      (err: any) => {
        return err instanceof ForbiddenException || err.name === 'TenantAuthorizationError';
      }
    );

    // Tenant B attempts to update Company A account
    await assert.rejects(
      async () => {
        await accountsService.updateAccount(
          tenantBOwner,
          ownerPayload,
          compAAccount.id,
          { name: 'Hacked Name' }
        );
      },
      (err: any) => {
        return err instanceof ForbiddenException || err.name === 'TenantAuthorizationError';
      }
    );
  });

  it('8. Parent Validation: enforces same type, rejects cross-company parent and circular references', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const parentAsset = await accountsService.createAccount(
      tenantAOwner,
      ownerPayload,
      { code: '1000-PARENT', name: 'Current Assets Parent', type: 'ASSET' }
    );
    testIdsToCleanup.accounts.push(parentAsset.id);

    // 8a. Parent type mismatch: child is LIABILITY, parent is ASSET -> reject
    await assert.rejects(
      async () => {
        await accountsService.createAccount(
          tenantAOwner,
          ownerPayload,
          { code: '2020-CHILD', name: 'Payable with Asset Parent', type: 'LIABILITY', parentId: parentAsset.id }
        );
      },
      (err: any) => {
        return (
          err instanceof BadRequestException ||
          err.message.includes('Parent account type')
        );
      }
    );

    // 8b. Cross-company parent: Account in Company B cannot be parent for Company A
    const compBAcc = await accountsService.createAccount(
      tenantBOwner,
      ownerPayload,
      { code: '1099-B', name: 'Company B Parent Candidate', type: 'ASSET' }
    );
    testIdsToCleanup.accounts.push(compBAcc.id);

    await assert.rejects(
      async () => {
        await accountsService.createAccount(
          tenantAOwner,
          ownerPayload,
          { code: '1020-CROSS', name: 'Child with foreign parent', type: 'ASSET', parentId: compBAcc.id }
        );
      },
      (err: any) => {
        return (
          err instanceof BadRequestException ||
          err.message.includes('not found within this company')
        );
      }
    );

    // 8c. Circular reference: Parent cannot be its own descendant
    const childAsset = await accountsService.createAccount(
      tenantAOwner,
      ownerPayload,
      { code: '1001-CHILD', name: 'Child Account', type: 'ASSET', parentId: parentAsset.id }
    );
    testIdsToCleanup.accounts.push(childAsset.id);

    // Trying to make parentAsset's parent become childAsset
    await assert.rejects(
      async () => {
        await accountsService.updateAccount(
          tenantAOwner,
          ownerPayload,
          parentAsset.id,
          { parentId: childAsset.id }
        );
      },
      (err: any) => {
        return (
          err instanceof BadRequestException ||
          err.message.includes('Circular parent account relationship')
        );
      }
    );

    // 8d. Self-parenting: Account cannot be its own parent
    await assert.rejects(
      async () => {
        await accountsService.updateAccount(
          tenantAOwner,
          ownerPayload,
          childAsset.id,
          { parentId: childAsset.id }
        );
      },
      (err: any) => {
        return (
          err instanceof BadRequestException ||
          err.message.includes('cannot be its own parent')
        );
      }
    );
  });

  it('9. Role-Based Permissions: RolesGuard enforces write restrictions', () => {
    // Helper to evaluate RolesGuard with a mock execution context
    function testGuardForRole(requiredRoles: string[], userTenant: TenantContext): boolean {
      const mockHandler = () => {};
      const mockContext: any = {
        getHandler: () => mockHandler,
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            tenant: userTenant,
          }),
        }),
      };

      Reflect.defineMetadata(ROLES_KEY, requiredRoles, mockHandler);
      return rolesGuard.canActivate(mockContext);
    }

    // Write endpoint: ['owner', 'admin', 'accountant']
    const writeRoles = ['owner', 'admin', 'accountant'];
    assert.equal(testGuardForRole(writeRoles, tenantAOwner), true, 'Owner passes write');
    assert.equal(testGuardForRole(writeRoles, tenantAAccountant), true, 'Accountant passes write');
    assert.throws(
      () => testGuardForRole(writeRoles, tenantAViewer),
      /Insufficient role privileges/,
      'Viewer is rejected from write endpoint'
    );

    // Admin-only endpoint (deactivation, template initialization): ['owner', 'admin']
    const adminRoles = ['owner', 'admin'];
    assert.equal(testGuardForRole(adminRoles, tenantAOwner), true, 'Owner passes admin');
    assert.throws(
      () => testGuardForRole(adminRoles, tenantAAccountant),
      /Insufficient role privileges/,
      'Accountant is rejected from admin endpoint'
    );
    assert.throws(
      () => testGuardForRole(adminRoles, tenantAViewer),
      /Insufficient role privileges/,
      'Viewer is rejected from admin endpoint'
    );
  });

  it('10. Safe Deactivation: deactivates without hard deletion and prevents deactivation when active children exist', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const toDeactivate = await accountsService.createAccount(
      tenantAOwner,
      ownerPayload,
      { code: '6099-DEACT', name: 'Temporary Sundry Account', type: 'EXPENSE' }
    );
    testIdsToCleanup.accounts.push(toDeactivate.id);

    const deactivated = await accountsService.deactivateAccount(
      tenantAOwner,
      ownerPayload,
      toDeactivate.id,
      { ip: '127.0.0.1' }
    );

    assert.equal(deactivated.isActive, false);

    // Verify still exists in database (zero hard deletes)
    const dbRecord = await Account.findById(toDeactivate.id);
    assert.ok(dbRecord);
    assert.equal(dbRecord.isActive, false);

    // Verify Audit log recorded deactivation
    const audit = await AuditLog.findOne({
      targetId: toDeactivate.id,
      action: 'account.deactivated',
    }).lean();
    assert.ok(audit);
    assert.equal(audit.outcome, 'success');

    // 10b. Active Child Protection: account with active child cannot be deactivated
    const parentAcc = await accountsService.createAccount(
      tenantAOwner,
      ownerPayload,
      { code: '6090-PARENT', name: 'Parent Operating Expense', type: 'EXPENSE' }
    );
    testIdsToCleanup.accounts.push(parentAcc.id);

    const childAcc = await accountsService.createAccount(
      tenantAOwner,
      ownerPayload,
      { code: '6091-CHILD', name: 'Child Operating Expense', type: 'EXPENSE', parentId: parentAcc.id }
    );
    testIdsToCleanup.accounts.push(childAcc.id);

    // Attempt deactivation via dedicated deactivateAccount endpoint
    await assert.rejects(
      async () => {
        await accountsService.deactivateAccount(
          tenantAOwner,
          ownerPayload,
          parentAcc.id
        );
      },
      (err: any) => {
        return (
          err instanceof BadRequestException &&
          err.message.includes('Cannot deactivate account because active child account')
        );
      },
      'Cannot deactivate parent account while child account is active'
    );

    // Attempt deactivation via updateAccount (PATCH)
    await assert.rejects(
      async () => {
        await accountsService.updateAccount(
          tenantAOwner,
          ownerPayload,
          parentAcc.id,
          { isActive: false }
        );
      },
      (err: any) => {
        return (
          err instanceof BadRequestException &&
          err.message.includes('Cannot deactivate account because active child account')
        );
      },
      'Cannot deactivate parent account via updateAccount while child account is active'
    );
  });

  it('11. Standard Account Template: idempotent initialization and concurrency safety', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // First initialization seeds standard accounts
    const firstRun = await accountsService.initializeStandardTemplate(
      tenantBOwner,
      ownerPayload,
      { ip: '127.0.0.1' }
    );
    assert.ok(firstRun.createdCount > 0, 'First run created standard accounts');

    // Second initialization should be idempotent and create 0 duplicates
    const secondRun = await accountsService.initializeStandardTemplate(
      tenantBOwner,
      ownerPayload,
      { ip: '127.0.0.1' }
    );
    assert.equal(secondRun.createdCount, 0, 'Second run idempotently created 0 duplicate accounts');

    // Concurrency test: execute two simultaneous initialization calls
    const [concA, concB] = await Promise.all([
      accountsService.initializeStandardTemplate(tenantBOwner, ownerPayload),
      accountsService.initializeStandardTemplate(tenantBOwner, ownerPayload),
    ]);

    assert.equal(concA.createdCount, 0);
    assert.equal(concB.createdCount, 0);

    // Verify template audit log
    const templateAudit = await AuditLog.findOne({
      targetId: tenantBOwner.companyId,
      action: 'account.template_initialized',
    }).lean();
    assert.ok(templateAudit);
    assert.equal(templateAudit.outcome, 'success');
  });

  it('12. Protected System Accounts: rejects deactivation via updateAccount (PATCH) and dedicated deactivateAccount', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Create a protected system account directly in company A
    const [sysDoc] = await Account.create(
      [
        {
          companyId: new mongoose.Types.ObjectId(companyA._id),
          code: '1099-SYS',
          name: 'Core System Account Protected',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          isSystem: true,
          isActive: true,
          currency: 'AED',
        },
      ]
    );
    testIdsToCleanup.accounts.push(sysDoc._id.toString());

    // 12a. Attempt deactivation via dedicated deactivateAccount method
    await assert.rejects(
      async () => {
        await accountsService.deactivateAccount(
          tenantAOwner,
          ownerPayload,
          sysDoc._id.toString()
        );
      },
      (err: any) => {
        return (
          err instanceof BadRequestException &&
          err.message.includes('Core system accounts cannot be deactivated')
        );
      },
      'deactivateAccount must reject deactivation of system accounts'
    );

    // 12b. Attempt deactivation via updateAccount (PATCH bypass)
    await assert.rejects(
      async () => {
        await accountsService.updateAccount(
          tenantAOwner,
          ownerPayload,
          sysDoc._id.toString(),
          { isActive: false }
        );
      },
      (err: any) => {
        return (
          err instanceof BadRequestException &&
          err.message.includes('Core system accounts cannot be deactivated')
        );
      },
      'updateAccount must reject isActive=false on system accounts'
    );

    // 12c. Normal permitted edits (name, description) to system accounts still succeed
    const updatedSys = await accountsService.updateAccount(
      tenantAOwner,
      ownerPayload,
      sysDoc._id.toString(),
      { name: 'Core System Account Updated Name', description: 'Updated allowed description' }
    );
    assert.equal(updatedSys.name, 'Core System Account Updated Name');
    assert.equal(updatedSys.description, 'Updated allowed description');
    assert.equal(updatedSys.isActive, true);
  });

  it('13. Pagination & Query Bounding: honors limit query and bounds account queries to max 500', async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Company B has initialized template accounts from test 11 plus accounts from earlier tests
    const boundedList = await accountsService.listAccounts(tenantBOwner, { limit: 5 });
    assert.equal(boundedList.length, 5, 'Honors custom limit query parameter');

    const defaultList = await accountsService.listAccounts(tenantBOwner, {});
    assert.ok(defaultList.length >= 19, 'Returns all accounts without explicit limit (<= 500)');
    assert.ok(defaultList.length <= 500, 'Bounded to max 500 accounts');
  });

  it('14. AuditLog Immutability: Mongoose query and document middleware prevents mutation and deletion', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const [testAudit] = await AuditLog.create([
      {
        action: 'test.audit_entry',
        targetType: 'Test',
        companyId: new mongoose.Types.ObjectId(companyA._id),
        outcome: 'success',
      },
    ]);

    // 14a. updateOne is blocked
    await assert.rejects(
      async () => {
        await AuditLog.updateOne({ _id: testAudit._id }, { outcome: 'failure' });
      },
      /AuditLog records are append-only and cannot be mutated/
    );

    // 14b. findOneAndUpdate is blocked
    await assert.rejects(
      async () => {
        await AuditLog.findOneAndUpdate({ _id: testAudit._id }, { outcome: 'failure' });
      },
      /AuditLog records are append-only and cannot be mutated/
    );

    // 14c. deleteOne is blocked
    await assert.rejects(
      async () => {
        await AuditLog.deleteOne({ _id: testAudit._id });
      },
      /AuditLog records are append-only and cannot be deleted/
    );

    // 14d. findOneAndDelete is blocked
    await assert.rejects(
      async () => {
        await AuditLog.findOneAndDelete({ _id: testAudit._id });
      },
      /AuditLog records are append-only and cannot be deleted/
    );

    // 14e. Document mutation via save() is blocked
    testAudit.action = 'mutated.action';
    await assert.rejects(
      async () => {
        await testAudit.save();
      },
      /AuditLog records are append-only and cannot be mutated/
    );
  });
});
