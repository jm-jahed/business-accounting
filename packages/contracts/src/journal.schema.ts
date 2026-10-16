import { z } from 'zod';

export const VOUCHER_TYPES = [
  'JOURNAL',
  'PAYMENT',
  'RECEIPT',
  'SALES',
  'PURCHASE',
  'CONTRA',
] as const;

export type VoucherType = (typeof VOUCHER_TYPES)[number];

export const VOUCHER_STATUSES = ['DRAFT', 'POSTED', 'VOID'] as const;
export type VoucherStatus = (typeof VOUCHER_STATUSES)[number];

export const JournalLineInputSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  accountCode: z.string().optional(),
  accountName: z.string().optional(),
  debit: z.union([z.string(), z.number()]).refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 0;
    },
    { message: 'Debit must be a valid non-negative number' }
  ),
  credit: z.union([z.string(), z.number()]).refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 0;
    },
    { message: 'Credit must be a valid non-negative number' }
  ),
  description: z.string().max(500).optional().nullable(),
});

export const CreateJournalEntryInputSchema = z.object({
  entryDate: z.string().min(1, 'Entry date is required'),
  voucherType: z.enum(VOUCHER_TYPES).default('JOURNAL'),
  reference: z.string().max(100).optional().nullable(),
  description: z.string().min(2, 'Description must be at least 2 characters').max(1000),
  lines: z
    .array(JournalLineInputSchema)
    .min(2, 'A journal entry must contain at least 2 lines'),
});

export const GeneralLedgerQuerySchema = z.object({
  accountId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
});

export interface JournalLineDto {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
  description?: string | null;
}

export interface JournalEntryResponseDto {
  id: string;
  companyId: string;
  branchId?: string | null;
  entryNumber: string;
  voucherType: VoucherType;
  status: VoucherStatus;
  entryDate: string;
  reference?: string | null;
  description: string;
  lines: JournalLineDto[];
  totalDebit: string;
  totalCredit: string;
  postedAt?: string | null;
  postedBy?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeneralLedgerLineDto {
  id: string;
  journalEntryId: string;
  entryNumber: string;
  voucherType: VoucherType;
  entryDate: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType?: string;
  debit: string;
  credit: string;
  runningBalance: string;
  description: string;
  reference?: string | null;
  createdAt: string;
}

export interface GeneralLedgerSummaryDto {
  accountId?: string;
  accountCode?: string;
  accountName?: string;
  currency: string;
  openingBalance: string;
  totalDebit: string;
  totalCredit: string;
  closingBalance: string;
  transactionCount: number;
}

export interface GeneralLedgerResponseDto {
  summary: GeneralLedgerSummaryDto;
  entries: GeneralLedgerLineDto[];
  total: number;
  page: number;
  limit: number;
}

export type JournalLineInput = z.infer<typeof JournalLineInputSchema>;
export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntryInputSchema>;
export type GeneralLedgerQuery = z.infer<typeof GeneralLedgerQuerySchema>;
