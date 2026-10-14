import { z } from 'zod';

export const JournalLineSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  accountCode: z.string().min(1, 'Account code is required'),
  accountName: z.string().optional(),
  branchId: z.string().optional(),
  debit: z.string().or(z.number()),
  credit: z.string().or(z.number()),
  description: z.string().max(500).optional(),
});

export const JournalEntryInputSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  branchId: z.string().optional(),
  entryNumber: z.string().min(1, 'Entry number is required'),
  entryDate: z.string().datetime().or(z.date()),
  description: z.string().max(1000).optional(),
  reference: z.string().max(100).optional(),
  lines: z.array(JournalLineSchema).min(2, 'A journal entry must contain at least 2 lines'),
});

export type JournalLineInput = z.infer<typeof JournalLineSchema>;
export type JournalEntryInput = z.infer<typeof JournalEntryInputSchema>;
