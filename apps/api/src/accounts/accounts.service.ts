import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import mongoose, { Types, ClientSession } from 'mongoose';
import {
  accountService,
  AccountValidationError,
  TenantAuthorizationError,
  IAccount,
  AuditLog,
  TenantContext,
} from '@accounting/database';
import {
  CreateAccountInput,
  UpdateAccountInput,
  AccountQueryFilter,
  AccountResponseDto,
  ChartOfAccountInput,
} from '@accounting/contracts';
import { JwtUserPayload } from '../auth/jwt.service.js';

interface RequestMetadata {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  /**
   * Transforms an IAccount document into a standardized AccountResponseDto.
   */
  public toResponseDto(account: IAccount): AccountResponseDto {
    return {
      id: account._id.toString(),
      companyId: account.companyId.toString(),
      branchId: account.branchId ? account.branchId.toString() : null,
      code: account.code,
      name: account.name,
      type: account.type,
      normalBalance: account.normalBalance,
      parentId: account.parentId ? account.parentId.toString() : null,
      currency: account.currency || null,
      isActive: account.isActive,
      isSystem: account.isSystem,
      description: account.description || null,
      createdAt: account.createdAt ? account.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: account.updatedAt ? account.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Executes a database mutation inside a MongoDB ACID transaction when supported.
   * Ensures account state and immutable audit log are committed atomically.
   */
  private async executeWithTransaction<T>(
    operation: (session: ClientSession | null) => Promise<T>
  ): Promise<T> {
    let session: ClientSession | null = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      // Transaction sessions not supported by current environment/mock
      session = null;
    }

    if (session) {
      try {
        const result = await operation(session);
        await session.commitTransaction();
        return result;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      return await operation(null);
    }
  }

  /**
   * Maps internal domain errors to appropriate HTTP exceptions.
   */
  private handleDomainError(error: any): never {
    if (error instanceof AccountValidationError) {
      if (
        error.message.includes('already exists') ||
        error.message.includes('already in use')
      ) {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException(error.message);
    }

    if (error instanceof TenantAuthorizationError) {
      throw new ForbiddenException(error.message);
    }

    if (
      error instanceof ConflictException ||
      error instanceof BadRequestException ||
      error instanceof ForbiddenException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    this.logger.error('Unexpected account domain error:', error);
    throw error;
  }

  /**
   * Retrieves list of accounts for the authenticated tenant with optional filters.
   */
  public async listAccounts(
    context: TenantContext,
    filter: AccountQueryFilter
  ): Promise<AccountResponseDto[]> {
    try {
      const accounts = await accountService.getCompanyAccounts(context, {
        type: filter.type,
        isActive: filter.isActive,
        search: filter.search,
        limit: filter.limit,
      });

      return accounts.map((acc) => this.toResponseDto(acc));
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  /**
   * Retrieves an individual account by ID scoped to the authenticated tenant.
   */
  public async getAccountById(
    context: TenantContext,
    accountId: string
  ): Promise<AccountResponseDto> {
    try {
      const account = await accountService.getAccountById(accountId, context);
      return this.toResponseDto(account);
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  /**
   * Creates a new account scoped to the authenticated company and records an audit log.
   */
  public async createAccount(
    context: TenantContext,
    actor: JwtUserPayload,
    input: CreateAccountInput,
    meta: RequestMetadata = {}
  ): Promise<AccountResponseDto> {
    return this.executeWithTransaction(async (session) => {
      try {
        const coaInput: ChartOfAccountInput = {
          companyId: context.companyId,
          code: input.code.trim(),
          name: input.name.trim(),
          type: input.type,
          parentId: input.parentId || null,
          currency: input.currency || null,
          description: input.description || null,
          isActive: true,
          isSystem: false,
        };

        const createdAccount = await accountService.createAccount(coaInput, context, session || undefined);

        // Immutable Audit Log entry inside the same transaction
        await AuditLog.create(
          [
            {
              actorId: actor.sub,
              actorEmail: actor.email,
              action: 'account.created',
              targetType: 'Account',
              targetId: createdAccount._id.toString(),
              companyId: new Types.ObjectId(context.companyId),
              outcome: 'success',
              ipAddress: meta.ip || '',
              userAgent: meta.userAgent || '',
              metadata: {
                code: createdAccount.code,
                name: createdAccount.name,
                type: createdAccount.type,
                normalBalance: createdAccount.normalBalance,
                parentId: createdAccount.parentId ? createdAccount.parentId.toString() : null,
              },
            },
          ],
          session ? { session } : {}
        );

        return this.toResponseDto(createdAccount);
      } catch (error) {
        this.handleDomainError(error);
      }
    });
  }

  /**
   * Updates an existing account and appends an audit record of modified attributes.
   */
  public async updateAccount(
    context: TenantContext,
    actor: JwtUserPayload,
    accountId: string,
    input: UpdateAccountInput,
    meta: RequestMetadata = {}
  ): Promise<AccountResponseDto> {
    return this.executeWithTransaction(async (session) => {
      try {
        const before = await accountService.getAccountById(accountId, context, session || undefined);

        const updated = await accountService.updateAccount(
          accountId,
          input,
          context,
          session || undefined
        );

        await AuditLog.create(
          [
            {
              actorId: actor.sub,
              actorEmail: actor.email,
              action: 'account.updated',
              targetType: 'Account',
              targetId: updated._id.toString(),
              companyId: new Types.ObjectId(context.companyId),
              outcome: 'success',
              ipAddress: meta.ip || '',
              userAgent: meta.userAgent || '',
              metadata: {
                changes: input,
                previous: {
                  code: before.code,
                  name: before.name,
                  parentId: before.parentId ? before.parentId.toString() : null,
                  isActive: before.isActive,
                  description: before.description,
                },
              },
            },
          ],
          session ? { session } : {}
        );

        return this.toResponseDto(updated);
      } catch (error) {
        this.handleDomainError(error);
      }
    });
  }

  /**
   * Safely deactivates an account without hard-deletion and records audit log.
   */
  public async deactivateAccount(
    context: TenantContext,
    actor: JwtUserPayload,
    accountId: string,
    meta: RequestMetadata = {}
  ): Promise<AccountResponseDto> {
    return this.executeWithTransaction(async (session) => {
      try {
        const deactivated = await accountService.deactivateAccount(
          accountId,
          context,
          session || undefined
        );

        await AuditLog.create(
          [
            {
              actorId: actor.sub,
              actorEmail: actor.email,
              action: 'account.deactivated',
              targetType: 'Account',
              targetId: deactivated._id.toString(),
              companyId: new Types.ObjectId(context.companyId),
              outcome: 'success',
              ipAddress: meta.ip || '',
              userAgent: meta.userAgent || '',
              metadata: {
                code: deactivated.code,
                name: deactivated.name,
              },
            },
          ],
          session ? { session } : {}
        );

        return this.toResponseDto(deactivated);
      } catch (error) {
        this.handleDomainError(error);
      }
    });
  }

  /**
   * Idempotently seeds standard Chart of Accounts upon explicit user request.
   */
  public async initializeStandardTemplate(
    context: TenantContext,
    actor: JwtUserPayload,
    meta: RequestMetadata = {}
  ): Promise<{ message: string; createdCount: number }> {
    return this.executeWithTransaction(async (session) => {
      try {
        const result = await accountService.initializeStandardChartOfAccounts(
          context.companyId,
          context,
          session || undefined
        );

        await AuditLog.create(
          [
            {
              actorId: actor.sub,
              actorEmail: actor.email,
              action: 'account.template_initialized',
              targetType: 'Company',
              targetId: context.companyId,
              companyId: new Types.ObjectId(context.companyId),
              outcome: 'success',
              ipAddress: meta.ip || '',
              userAgent: meta.userAgent || '',
              metadata: {
                createdCount: result.createdCount,
              },
            },
          ],
          session ? { session } : {}
        );

        return {
          message:
            result.createdCount > 0
              ? `Standard Chart of Accounts successfully initialized with ${result.createdCount} standard accounts.`
              : 'All standard accounts already exist in this company. No new accounts needed.',
          createdCount: result.createdCount,
        };
      } catch (error) {
        this.handleDomainError(error);
      }
    });
  }
}
