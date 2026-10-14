export type SupportedCurrencyCode = 'AED' | 'USD' | 'BDT' | 'INR' | 'SAR' | 'EUR';

export interface CurrencyMetadata {
  readonly code: SupportedCurrencyCode;
  readonly name: string;
  readonly symbol: string;
  readonly standardDecimals: number;
  readonly symbolPlacement: 'prefix' | 'suffix';
}

export const SUPPORTED_CURRENCIES: Readonly<Record<SupportedCurrencyCode, CurrencyMetadata>> = Object.freeze({
  AED: {
    code: 'AED',
    name: 'United Arab Emirates Dirham',
    symbol: 'AED',
    standardDecimals: 2,
    symbolPlacement: 'prefix',
  },
  USD: {
    code: 'USD',
    name: 'United States Dollar',
    symbol: '$',
    standardDecimals: 2,
    symbolPlacement: 'prefix',
  },
  BDT: {
    code: 'BDT',
    name: 'Bangladeshi Taka',
    symbol: '৳',
    standardDecimals: 2,
    symbolPlacement: 'prefix',
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    standardDecimals: 2,
    symbolPlacement: 'prefix',
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'SAR',
    standardDecimals: 2,
    symbolPlacement: 'prefix',
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    standardDecimals: 2,
    symbolPlacement: 'prefix',
  },
});

export function isSupportedCurrency(code: string): code is SupportedCurrencyCode {
  return Object.prototype.hasOwnProperty.call(SUPPORTED_CURRENCIES, code.toUpperCase());
}

export function getCurrencyMetadata(code: string): CurrencyMetadata {
  const upper = code.toUpperCase();
  if (!isSupportedCurrency(upper)) {
    throw new Error(`Unsupported currency code "${code}". Supported currencies: AED, USD, BDT, INR, SAR, EUR`);
  }
  return SUPPORTED_CURRENCIES[upper];
}
