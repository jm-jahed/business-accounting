import { Locale } from './i18n.types.js';

const LOCALE_BCP47_MAP: Record<Locale, string> = {
  en: 'en-US',
  bn: 'bn-BD',
  ar: 'ar-AE',
  hi: 'hi-IN',
};

/**
 * Formats a Date or ISO date string according to the requested locale.
 */
export function formatLocalizedDate(
  dateInput: Date | string,
  locale: Locale = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const bcp47 = LOCALE_BCP47_MAP[locale] || 'en-US';
  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(bcp47, defaultOptions).format(date);
}

/**
 * Formats a number according to the requested locale conventions.
 */
export function formatLocalizedNumber(
  num: number | string,
  locale: Locale = 'en',
  options?: Intl.NumberFormatOptions
): string {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) {
    return '0';
  }

  const bcp47 = LOCALE_BCP47_MAP[locale] || 'en-US';
  return new Intl.NumberFormat(bcp47, options).format(value);
}
