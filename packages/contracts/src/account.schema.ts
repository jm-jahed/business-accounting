import { z } from 'zod';

export const AccountTypeEnum = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);
export type AccountType = z.infer<typeof AccountTypeEnum>;

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
  parentId: z.string().optional().nullable(),
  currency: z.string().trim().length(3).optional().nullable(),
  isActive: z.boolean().default(true),
  isSystem: z.boolean().default(false),
  description: z.string().trim().max(500).optional().nullable(),
});

export type ChartOfAccountInput = z.infer<typeof ChartOfAccountInputSchema>;
