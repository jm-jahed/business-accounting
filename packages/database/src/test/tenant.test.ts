import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Types } from 'mongoose';
import {
  validateTenantAccess,
  createTenantScopedFilter,
  assertEntityBelongsToTenant,
  TenantAuthorizationError,
  TenantContext,
} from '../services/tenant.context.js';
import { Company } from '../models/Company.js';
import { Branch } from '../models/Branch.js';
import { Account } from '../models/Account.js';

describe('Tenant Boundaries & Isolation Suite', () => {
  const companyAId = new Types.ObjectId().toString();
  const companyBId = new Types.ObjectId().toString();

  const contextA: TenantContext = {
    userId: 'user-emp-101',
    companyId: companyAId,
    role: 'accountant',
    branchAccess: 'all',
  };

  it('should allow access when actor companyId strictly matches target companyId', () => {
    assert.doesNotThrow(() => {
      validateTenantAccess(contextA, companyAId);
    });
  });

  it('should fail closed with TenantAuthorizationError when actor accesses different company (Company A vs B)', () => {
    assert.throws(
      () => validateTenantAccess(contextA, companyBId),
      (err: any) => {
        assert(err instanceof TenantAuthorizationError);
        assert.equal(err.message, 'Unauthorized: Access to requested company resource is denied.');
        return true;
      }
    );
  });

  it('should fail closed when context is null, undefined, or missing companyId', () => {
    assert.throws(
      () => validateTenantAccess(null, companyAId),
      (err: any) => {
        assert(err instanceof TenantAuthorizationError);
        assert.match(err.message, /Unauthenticated/);
        return true;
      }
    );

    assert.throws(
      () => validateTenantAccess({ userId: 'u1', companyId: '', role: 'viewer' }, companyAId),
      (err: any) => {
        assert(err instanceof TenantAuthorizationError);
        return true;
      }
    );
  });

  it('should strictly inject authenticated companyId and overwrite any malicious client-supplied companyId', () => {
    const maliciousClientFilter = {
      companyId: new Types.ObjectId(companyBId),
      code: '1010',
      description: 'Search filter',
    };

    const securedFilter = createTenantScopedFilter(contextA, maliciousClientFilter);

    // Guaranteed that filter.companyId matches actor context (Company A), NOT client's Company B
    assert.equal(securedFilter.companyId.toString(), companyAId);
    assert.notEqual(securedFilter.companyId.toString(), companyBId);
    assert.equal(securedFilter.code, '1010');
  });

  it('assertEntityBelongsToTenant should allow related entities belonging to the same company', () => {
    const accountInCompanyA = {
      _id: new Types.ObjectId(),
      companyId: new Types.ObjectId(companyAId),
      name: 'Cash on Hand',
    };

    assert.doesNotThrow(() => {
      assertEntityBelongsToTenant(accountInCompanyA, companyAId, 'Account');
    });
  });

  it('assertEntityBelongsToTenant should reject cross-company entity references (Company B entity in Company A)', () => {
    const accountInCompanyB = {
      _id: new Types.ObjectId(),
      companyId: new Types.ObjectId(companyBId),
      name: 'Petty Cash Company B',
    };

    assert.throws(
      () => assertEntityBelongsToTenant(accountInCompanyB, companyAId, 'Account'),
      (err: any) => {
        assert(err instanceof TenantAuthorizationError);
        assert(err.message.includes('Cross-tenant integrity violation'));
        return true;
      }
    );
  });

  it('assertEntityBelongsToTenant should fail closed if entity is missing or null', () => {
    assert.throws(
      () => assertEntityBelongsToTenant(null, companyAId, 'Customer'),
      (err: any) => {
        assert(err instanceof TenantAuthorizationError);
        assert(err.message.includes('Customer not found'));
        return true;
      }
    );
  });
});

describe('Company and Branch Model Schema Validation Suite', () => {
  it('should successfully validate a well-formed Company document and auto-derive slug', () => {
    const company = new Company({
      name: 'Al-Barakah Trading LLC',
      legalName: 'Al-Barakah General Trading LLC',
      currency: 'AED',
      fiscalYearStartMonth: 1,
      trn: '100293847500003',
      status: 'active',
    });

    const err = company.validateSync();
    assert.equal(err, undefined);
    assert.equal(company.slug, 'al-barakah-trading-llc');
  });

  it('should respect explicitly provided valid slug on Company document', () => {
    const company = new Company({
      name: 'Al-Barakah Trading LLC',
      slug: 'custom-barakah-store',
      legalName: 'Al-Barakah General Trading LLC',
      currency: 'AED',
      fiscalYearStartMonth: 1,
      status: 'active',
    });

    const err = company.validateSync();
    assert.equal(err, undefined);
    assert.equal(company.slug, 'custom-barakah-store');
  });

  it('should reject Company with missing required fields or invalid currency length', () => {
    const invalidCompany = new Company({
      currency: 'INVALID_LONG_CODE',
    });

    const err = invalidCompany.validateSync();
    assert(err);
    assert(err.errors['name'], 'Company name is required');
    assert(err.errors['legalName'], 'Legal name is required');
    assert(err.errors['currency'], 'Currency must be 3 characters');
  });

  it('should validate Branch linked to a Company with uppercase code', () => {
    const companyId = new Types.ObjectId();
    const branch = new Branch({
      companyId,
      code: 'DXB-MAIN',
      name: 'Dubai Flagship Branch',
      isMain: true,
      status: 'active',
    });

    const err = branch.validateSync();
    assert.equal(err, undefined);
    assert.equal(branch.code, 'DXB-MAIN');
  });

  it('should reject Branch missing companyId or code', () => {
    const invalidBranch = new Branch({
      name: 'Orphan Branch',
    });

    const err = invalidBranch.validateSync();
    assert(err);
    assert(err.errors['companyId'], 'Branch must have companyId');
    assert(err.errors['code'], 'Branch must have code');
  });
});

describe('Chart of Accounts Schema & Domain Rules Suite', () => {
  it('should automatically assign normalBalance=DEBIT for ASSET and EXPENSE accounts', () => {
    const assetAccount = new Account({
      companyId: new Types.ObjectId(),
      code: '1010',
      name: 'Petty Cash',
      type: 'ASSET',
    });
    assetAccount.validateSync();
    assert.equal(assetAccount.normalBalance, 'DEBIT');

    const expenseAccount = new Account({
      companyId: new Types.ObjectId(),
      code: '6010',
      name: 'Office Rent',
      type: 'EXPENSE',
    });
    expenseAccount.validateSync();
    assert.equal(expenseAccount.normalBalance, 'DEBIT');
  });

  it('should automatically assign normalBalance=CREDIT for LIABILITY, EQUITY, and REVENUE accounts', () => {
    const liability = new Account({
      companyId: new Types.ObjectId(),
      code: '2010',
      name: 'Accounts Payable',
      type: 'LIABILITY',
    });
    liability.validateSync();
    assert.equal(liability.normalBalance, 'CREDIT');

    const equity = new Account({
      companyId: new Types.ObjectId(),
      code: '3010',
      name: "Owner's Equity",
      type: 'EQUITY',
    });
    equity.validateSync();
    assert.equal(equity.normalBalance, 'CREDIT');

    const revenue = new Account({
      companyId: new Types.ObjectId(),
      code: '4010',
      name: 'Sales Revenue',
      type: 'REVENUE',
    });
    revenue.validateSync();
    assert.equal(revenue.normalBalance, 'CREDIT');
  });

  it('should reject account with invalid account type', () => {
    const invalidAccount = new Account({
      companyId: new Types.ObjectId(),
      code: '9999',
      name: 'Mystery Account',
      type: 'INVALID_TYPE' as any,
    });

    const err = invalidAccount.validateSync();
    assert(err);
    assert(err.errors['type'], 'Account type must be one of the approved GAAP enums');
  });
});
