import { z } from 'zod';

export const SupportedCurrencyEnum = z.enum(['AED', 'USD', 'BDT', 'INR', 'SAR', 'EUR']);
export type SupportedCurrency = z.infer<typeof SupportedCurrencyEnum>;

export const ExchangeRateInputSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  baseCurrency: SupportedCurrencyEnum,
  quoteCurrency: SupportedCurrencyEnum,
  rate: z
    .string()
    .or(z.number())
    .refine((val) => {
      const num = typeof val === 'number' ? val : parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Exchange rate must be a positive decimal number greater than zero'),
  effectiveDate: z.string().datetime().or(z.date()),
  source: z.string().trim().min(1).max(100).default('MANUAL'),
  notes: z.string().trim().max(500).optional(),
});

export type ExchangeRateInput = z.infer<typeof ExchangeRateInputSchema>;

export const TransactionCurrencySchema = z.object({
  originalCurrency: SupportedCurrencyEnum,
  originalAmount: z.string().refine((val) => !isNaN(parseFloat(val)), 'Amount must be a numeric string'),
  exchangeRate: z
    .string()
    .or(z.number())
    .refine((val) => {
      const num = typeof val === 'number' ? val : parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Exchange rate must be a positive decimal number greater than zero'),
  baseCurrency: SupportedCurrencyEnum.default('AED'),
  baseCurrencyAmount: z.string().refine((val) => !isNaN(parseFloat(val)), 'Base currency amount must be a numeric string'),
  rateEffectiveDate: z.string().datetime().or(z.date()),
  rateSource: z.string().trim().min(1).max(100).default('VERIFIED_RECORD'),
});

export type TransactionCurrency = z.infer<typeof TransactionCurrencySchema>;
