import mongoose from 'mongoose';
import { CompanyMemberRole } from '../models/CompanyMembership.js';

export interface TenantContext {
  readonly userId: string;
  readonly companyId: string;
  readonly role: CompanyMemberRole;
  readonly branchId?: string | null;
  readonly branchAccess?: string[] | 'all';
  readonly countryCode?: string;
  readonly industryType?: string;
  readonly enabledModules?: readonly string[];
}

export class TenantAuthorizationError extends Error {
  constructor(message = 'Access denied: Tenant authorization failed.') {
    super(message);
    this.name = 'TenantAuthorizationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Validates that an operation's actor context is authorized for the target company.
 * Fails closed. Does not reveal whether the target company exists.
 */
export function validateTenantAccess(
  context: TenantContext | null | undefined,
  targetCompanyId: string | mongoose.Types.ObjectId
): void {
  if (!context || !context.companyId || !context.userId) {
    throw new TenantAuthorizationError('Unauthenticated: Company context is missing.');
  }

  const actorCompanyId = context.companyId.toString();
  const targetId = targetCompanyId.toString();

  if (actorCompanyId !== targetId) {
    throw new TenantAuthorizationError('Unauthorized: Access to requested company resource is denied.');
  }
}

/**
 * Derives a secure MongoDB filter strictly scoped to the authenticated tenant.
 * Overwrites any client-supplied companyId to prevent authorization injection.
 */
export function createTenantScopedFilter<T extends Record<string, any>>(
  context: TenantContext,
  filter: T = {} as T
): T & { companyId: mongoose.Types.ObjectId } {
  if (!context || !context.companyId) {
    throw new TenantAuthorizationError('Cannot scope query: Active company context is missing.');
  }

  return {
    ...filter,
    companyId: new mongoose.Types.ObjectId(context.companyId),
  };
}
