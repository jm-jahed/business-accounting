import { Types, ClientSession, isValidObjectId } from 'mongoose';
import { Account, IAccount } from '../models/Account.js';
import { Company } from '../models/Company.js';
import { Branch } from '../models/Branch.js';
import { ChartOfAccountInput, AccountType, getNormalBalanceForAccountType } from '@accounting/contracts';
import { TenantContext, validateTenantAccess, createTenantScopedFilter, TenantAuthorizationError } from './tenant.context.js';

export class AccountValidationError extends Error {
  constructor(message: string) {
    super(`[AccountValidation] ${message}`);
    this.name = 'AccountValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AccountService {
  /**
   * Checks whether an account is referenced by posted transactions in the ledger.
   * Prevents unsafe mutations on active financial accounts.
   */
  async hasTransactionReferences(accountId: string, companyId: string): Promise<boolean> {
    const JournalModel = (Account.db.models.JournalEntry || Account.db.models.Journal) as any;
    if (JournalModel) {
      const count = await JournalModel.countDocuments({
        companyId: new Types.ObjectId(companyId),
        'lines.accountId': accountId,
      });
      return count > 0;
    }
    return false;
  }

  /**
   * Creates a new Chart of Accounts record strictly scoped to the tenant.
   */
  async createAccount(
    input: ChartOfAccountInput,
    context: TenantContext,
    session?: ClientSession
  ): Promise<IAccount> {
    validateTenantAccess(context, input.companyId);

    // 1. Verify Company exists and is active
    const company = await Company.findById(context.companyId).session(session || null);
    if (!company || company.status !== 'active') {
      throw new AccountValidationError('Target company does not exist or is not active.');
    }

    // 2. Validate Branch if provided
    let branchObjId: Types.ObjectId | null = null;
    if (input.branchId) {
      const branch = await Branch.findOne({
        _id: input.branchId,
        companyId: context.companyId,
      }).session(session || null);
      if (!branch) {
        throw new AccountValidationError('Specified branch does not exist within this company.');
      }
      branchObjId = branch._id as Types.ObjectId;
    }

    // 3. Verify Code uniqueness within this company
    const existingCode = await Account.findOne({
      companyId: context.companyId,
      code: input.code.trim(),
    }).session(session || null);
    if (existingCode) {
      throw new AccountValidationError(`Account code "${input.code}" already exists in this company.`);
    }

    // 4. Validate Parent Account if provided
    let parentObjId: Types.ObjectId | null = null;
    if (input.parentId) {
      const parent = await Account.findOne({
        _id: input.parentId,
        companyId: context.companyId,
      }).session(session || null);
      if (!parent) {
        throw new AccountValidationError('Parent account not found within this company.');
      }
      if (parent.type !== input.type) {
        throw new AccountValidationError(
          `Parent account type (${parent.type}) must match child account type (${input.type}).`
        );
      }
      parentObjId = parent._id as Types.ObjectId;
    }

    const normalBalance = getNormalBalanceForAccountType(input.type);

    const account = new Account({
      companyId: new Types.ObjectId(context.companyId),
      branchId: branchObjId,
      code: input.code.trim(),
      name: input.name.trim(),
      type: input.type,
      normalBalance,
      parentId: parentObjId,
      currency: input.currency || company.currency || 'AED',
      isActive: input.isActive ?? true,
      isSystem: input.isSystem ?? false,
      description: input.description?.trim() || null,
    });

    try {
      return await account.save({ session });
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new AccountValidationError(`Account code "${input.code}" already exists in this company.`);
      }
      throw err;
    }
  }

  /**
   * Retrieves an individual account record strictly scoped to the tenant.
   */
  async getAccountById(
    accountId: string,
    context: TenantContext,
    session?: ClientSession
  ): Promise<IAccount> {
    validateTenantAccess(context, context.companyId);

    if (!isValidObjectId(accountId)) {
      throw new AccountValidationError('Invalid account ID format.');
    }

    const account = await Account.findOne({
      _id: accountId,
      companyId: context.companyId,
    }).session(session || null);

    if (!account) {
      throw new TenantAuthorizationError('Account record not found or inaccessible.');
    }

    return account;
  }

  /**
   * Updates an existing account, strictly enforcing tenant boundary and cycle prevention.
   */
  async updateAccount(
    accountId: string,
    updates: Partial<ChartOfAccountInput>,
    context: TenantContext,
    session?: ClientSession
  ): Promise<IAccount> {
    validateTenantAccess(context, context.companyId);

    if (!isValidObjectId(accountId)) {
      throw new AccountValidationError('Invalid account ID format.');
    }

    const account = await Account.findOne({
      _id: accountId,
      companyId: context.companyId,
    }).session(session || null);

    if (!account) {
      throw new TenantAuthorizationError('Account record not found or inaccessible.');
    }

    // System accounts cannot have code or type mutated, or be deactivated
    if (account.isSystem) {
      if (updates.code && updates.code !== account.code) {
        throw new AccountValidationError('Cannot alter account code of a protected system account.');
      }
      if (updates.type && updates.type !== account.type) {
        throw new AccountValidationError('Cannot alter account type of a protected system account.');
      }
      if (updates.isActive === false) {
        throw new AccountValidationError('Core system accounts cannot be deactivated.');
      }
    }

    // Prevent deactivating an account if active child accounts depend on it
    if (updates.isActive === false) {
      const activeChild = await Account.findOne({
        companyId: context.companyId,
        parentId: account._id,
        isActive: true,
      }).session(session || null);

      if (activeChild) {
        throw new AccountValidationError(
          `Cannot deactivate account because active child account "${activeChild.code} - ${activeChild.name}" depends on it.`
        );
      }
    }

    // If code is changing, check uniqueness and transactions
    if (updates.code && updates.code !== account.code) {
      const hasTransactions = await this.hasTransactionReferences(accountId, context.companyId);
      if (hasTransactions) {
        throw new AccountValidationError('Cannot modify account code of an account with posted transactions.');
      }

      const codeTaken = await Account.findOne({
        companyId: context.companyId,
        code: updates.code.trim(),
        _id: { $ne: account._id },
      }).session(session || null);
      if (codeTaken) {
        throw new AccountValidationError(`Account code "${updates.code}" is already in use.`);
      }
      account.code = updates.code.trim();
    }

    // Parent account validation and cycle prevention
    if (updates.parentId !== undefined) {
      if (updates.parentId === accountId || updates.parentId === account._id.toString()) {
        throw new AccountValidationError('An account cannot be its own parent.');
      }

      if (updates.parentId) {
        const parent = await Account.findOne({
          _id: updates.parentId,
          companyId: context.companyId,
        }).session(session || null);
        if (!parent) {
          throw new AccountValidationError('Specified parent account not found in this company.');
        }

        // Validate that parent matches child account type
        if (parent.type !== account.type) {
          throw new AccountValidationError(
            `Parent account type (${parent.type}) must match child account type (${account.type}).`
          );
        }

        // Circular reference traversal check with safety depth limit
        let currentParentId: Types.ObjectId | null | undefined = parent.parentId;
        let depth = 0;
        const MAX_DEPTH = 50;

        while (currentParentId) {
          if (depth++ > MAX_DEPTH) {
            throw new AccountValidationError('Maximum hierarchy depth exceeded.');
          }
          if (currentParentId.toString() === account._id.toString()) {
            throw new AccountValidationError('Circular parent account relationship detected.');
          }
          const ancestor = await Account.findOne({
            _id: currentParentId,
            companyId: context.companyId,
          }).session(session || null);
          currentParentId = ancestor?.parentId;
        }

        account.parentId = parent._id as Types.ObjectId;
      } else {
        account.parentId = null;
      }
    }

    if (updates.name) account.name = updates.name.trim();
    if (updates.description !== undefined) account.description = updates.description?.trim() || null;
    if (updates.currency !== undefined && updates.currency) account.currency = updates.currency.trim();
    if (updates.isActive !== undefined) account.isActive = updates.isActive;

    try {
      return await account.save({ session });
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new AccountValidationError(`Account code "${updates.code || account.code}" is already in use.`);
      }
      throw err;
    }
  }

  /**
   * Deactivates an account (controlled deactivation, never hard delete).
   */
  async deactivateAccount(
    accountId: string,
    context: TenantContext,
    session?: ClientSession
  ): Promise<IAccount> {
    validateTenantAccess(context, context.companyId);

    if (!isValidObjectId(accountId)) {
      throw new AccountValidationError('Invalid account ID format.');
    }

    const account = await Account.findOne({
      _id: accountId,
      companyId: context.companyId,
    }).session(session || null);

    if (!account) {
      throw new TenantAuthorizationError('Account record not found or inaccessible.');
    }

    if (account.isSystem) {
      throw new AccountValidationError('Core system accounts cannot be deactivated.');
    }

    // Check if any child accounts are active
    const activeChild = await Account.findOne({
      companyId: context.companyId,
      parentId: account._id,
      isActive: true,
    }).session(session || null);

    if (activeChild) {
      throw new AccountValidationError(
        `Cannot deactivate account because active child account "${activeChild.code} - ${activeChild.name}" depends on it.`
      );
    }

    account.isActive = false;
    return await account.save({ session });
  }

  /**
   * Retrieves all Chart of Accounts records strictly scoped to the tenant with optional search & filters.
   */
  async getCompanyAccounts(
    context: TenantContext,
    filters: { type?: AccountType; isActive?: boolean; search?: string; limit?: number } = {},
    session?: ClientSession
  ): Promise<IAccount[]> {
    const filterQuery: Record<string, any> = {};

    if (filters.type) {
      filterQuery.type = filters.type;
    }
    if (filters.isActive !== undefined) {
      filterQuery.isActive = filters.isActive;
    }
    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim();
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filterQuery.$or = [
        { code: { $regex: escaped, $options: 'i' } },
        { name: { $regex: escaped, $options: 'i' } },
      ];
    }

    const MAX_LIMIT = 500;
    const requestedLimit =
      typeof filters.limit === 'number' && filters.limit > 0
        ? Math.min(filters.limit, MAX_LIMIT)
        : MAX_LIMIT;

    const query = createTenantScopedFilter(context, filterQuery);
    return await Account.find(query)
      .session(session || null)
      .sort({ code: 1 })
      .limit(requestedLimit)
      .exec();
  }

  /**
   * Explicit, idempotent standard chart of accounts initialization for a legal company.
   * Only executes upon explicit invocation (not automatically on arbitrary web requests).
   */
  async initializeStandardChartOfAccounts(
    companyId: string,
    context: TenantContext,
    session?: ClientSession
  ): Promise<{ createdCount: number }> {
    validateTenantAccess(context, companyId);

    const company = await Company.findById(companyId).session(session || null);
    if (!company) {
      throw new AccountValidationError('Company not found.');
    }

    const standardTemplates: Array<{
      code: string;
      name: string;
      type: AccountType;
      isSystem: boolean;
      description: string;
    }> = [
      // Assets (1000 - 1999)
      { code: '1010', name: 'Cash on Hand', type: 'ASSET', isSystem: true, description: 'Petty cash and cash registers' },
      { code: '1020', name: 'Bank Operating Account', type: 'ASSET', isSystem: true, description: 'Primary commercial bank account' },
      { code: '1200', name: 'Accounts Receivable (AR)', type: 'ASSET', isSystem: true, description: 'Unsettled customer sales invoices' },
      { code: '1300', name: 'Merchandise Inventory', type: 'ASSET', isSystem: true, description: 'Stock held for resale' },
      { code: '1500', name: 'Office & Facility Equipment', type: 'ASSET', isSystem: false, description: 'Fixed operational assets' },
      // Liabilities (2000 - 2999)
      { code: '2010', name: 'Accounts Payable (AP)', type: 'LIABILITY', isSystem: true, description: 'Unsettled supplier bills' },
      { code: '2210', name: 'VAT Output Tax Payable', type: 'LIABILITY', isSystem: true, description: 'VAT collected on commercial taxable sales' },
      { code: '2220', name: 'VAT Input Tax Recoverable', type: 'LIABILITY', isSystem: true, description: 'VAT paid on purchases eligible for input credit' },
      { code: '2500', name: 'Accrued Operating Liabilities', type: 'LIABILITY', isSystem: false, description: 'Accrued expenses due for payment' },
      // Equity (3000 - 3999)
      { code: '3010', name: "Owner's Capital", type: 'EQUITY', isSystem: true, description: 'Contributed capital by business owners' },
      { code: '3100', name: 'Retained Earnings', type: 'EQUITY', isSystem: true, description: 'Accumulated profits and net earnings' },
      // Revenue (4000 - 4999)
      { code: '4010', name: 'Sales Revenue', type: 'REVENUE', isSystem: true, description: 'Primary commercial operating revenue' },
      { code: '4020', name: 'Services & Advisory Revenue', type: 'REVENUE', isSystem: false, description: 'Secondary service fees' },
      { code: '4090', name: 'Sales Discounts Allowed', type: 'REVENUE', isSystem: false, description: 'Contra-revenue cash and trade discounts' },
      // Expenses (5000 - 6999)
      { code: '5010', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE', isSystem: true, description: 'Direct material and inventory acquisition cost' },
      { code: '6010', name: 'Rent & Premises Expense', type: 'EXPENSE', isSystem: false, description: 'Store, warehouse, and office rent' },
      { code: '6020', name: 'Salaries & Staff Compensation', type: 'EXPENSE', isSystem: false, description: 'Staff payroll and allowances' },
      { code: '6030', name: 'Utilities & Telecommunications', type: 'EXPENSE', isSystem: false, description: 'Electricity, water, internet, and phone' },
      { code: '6090', name: 'General & Administrative', type: 'EXPENSE', isSystem: false, description: 'Bank charges, government licenses, and sundry' },
    ];

    let createdCount = 0;
    const companyObjId = new Types.ObjectId(companyId);

    for (const tpl of standardTemplates) {
      try {
        const exists = await Account.findOne({ companyId: companyObjId, code: tpl.code }).session(session || null);
        if (!exists) {
          await Account.create(
            [
              {
                companyId: companyObjId,
                code: tpl.code,
                name: tpl.name,
                type: tpl.type,
                normalBalance: getNormalBalanceForAccountType(tpl.type),
                isSystem: tpl.isSystem,
                isActive: true,
                currency: company.currency || 'AED',
                description: tpl.description,
              },
            ],
            session ? { session } : {}
          );
          createdCount++;
        }
      } catch (err: any) {
        if (err?.code === 11000) {
          // Idempotent recovery if concurrent initializer inserted the same code
          continue;
        }
        throw err;
      }
    }

    return { createdCount };
  }
}

export const accountService = new AccountService();
