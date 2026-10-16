import { z } from 'zod';

export const AccountTypeEnum = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);
export type AccountType = z.infer<typeof AccountTypeEnum>;

export const AccountSystemRoleEnum = z.enum([
  'CASH',
  'BANK',
  'RECEIVABLE',
  'PAYABLE',
  'VAT_OUTPUT',
  'VAT_INPUT',
  'COGS',
  'INVENTORY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
]);
export type AccountSystemRole = z.infer<typeof AccountSystemRoleEnum>;

export const NormalBalanceEnum = z.enum(['DEBIT', 'CREDIT']);
export type NormalBalance = z.infer<typeof NormalBalanceEnum>;

/**
 * Returns the fundamental accounting normal balance for any account type.
 * Assets and Expenses normally carry Debit balances.
 * Liabilities, Equity, and Revenue normally carry Credit balances.
 */
export function getNormalBalanceForAccountType(type: AccountType): NormalBalance {
  switch (type) {
    case 'ASSET':
    case 'EXPENSE':
      return 'DEBIT';
    case 'LIABILITY':
    case 'EQUITY':
    case 'REVENUE':
      return 'CREDIT';
  }
}

export const ChartOfAccountInputSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  branchId: z.string().optional().nullable(),
  code: z
    .string()
    .trim()
    .min(1, 'Account code is required')
    .max(20)
    .regex(/^[0-9A-Za-z._-]+$/, 'Account code must be alphanumeric with optional dots or dashes'),
  name: z.string().trim().min(2, 'Account name must be at least 2 characters').max(100),
  type: AccountTypeEnum,
  systemRole: AccountSystemRoleEnum.optional().nullable(),
  parentId: z.string().optional().nullable(),
  currency: z.string().trim().length(3).optional().nullable(),
  isActive: z.boolean().default(true),
  isSystem: z.boolean().default(false),
  description: z.string().trim().max(500).optional().nullable(),
});

export type ChartOfAccountInput = z.infer<typeof ChartOfAccountInputSchema>;

export const CreateAccountInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Account code is required')
    .max(20, 'Account code cannot exceed 20 characters')
    .regex(/^[0-9A-Za-z._-]+$/, 'Account code must be alphanumeric with optional dots, hyphens, or underscores'),
  name: z
    .string()
    .trim()
    .min(2, 'Account name must be at least 2 characters')
    .max(100, 'Account name cannot exceed 100 characters'),
  type: AccountTypeEnum,
  systemRole: AccountSystemRoleEnum.optional().nullable(),
  parentId: z.string().trim().optional().nullable(),
  currency: z.string().trim().length(3, 'Currency code must be 3 characters').optional().nullable(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
});

export type CreateAccountInput = z.infer<typeof CreateAccountInputSchema>;

export const UpdateAccountInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Account name must be at least 2 characters')
    .max(100, 'Account name cannot exceed 100 characters')
    .optional(),
  code: z
    .string()
    .trim()
    .min(1, 'Account code is required')
    .max(20, 'Account code cannot exceed 20 characters')
    .regex(/^[0-9A-Za-z._-]+$/, 'Account code must be alphanumeric with optional dots, hyphens, or underscores')
    .optional(),
  systemRole: AccountSystemRoleEnum.optional().nullable(),
  parentId: z.string().trim().optional().nullable(),
  currency: z.string().trim().length(3).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateAccountInput = z.infer<typeof UpdateAccountInputSchema>;

export const AccountQueryFilterSchema = z.object({
  type: AccountTypeEnum.optional(),
  systemRole: AccountSystemRoleEnum.optional(),
  isActive: z
    .union([z.boolean(), z.enum(['true', 'false']).transform((val) => val === 'true')])
    .optional(),
  search: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export type AccountQueryFilter = z.infer<typeof AccountQueryFilterSchema>;

export interface AccountResponseDto {
  id: string;
  companyId: string;
  branchId?: string | null;
  code: string;
  name: string;
  type: AccountType;
  systemRole?: AccountSystemRole | null;
  normalBalance: NormalBalance;
  parentId?: string | null;
  currency?: string | null;
  isActive: boolean;
  isSystem: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}
