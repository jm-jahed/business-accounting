import { Decimal, DecimalValue, toDecimal, roundHalfEven } from '../math/decimal.js';
import { SupportedCurrencyCode, getCurrencyMetadata } from './currency.types.js';

export interface CurrencyConversionOptions {
  readonly amount: DecimalValue;
  readonly fromCurrency: SupportedCurrencyCode;
  readonly toCurrency: SupportedCurrencyCode;
  readonly exchangeRate: DecimalValue;
  readonly roundingDecimals?: number;
}

export interface CurrencyConversionResult {
  readonly originalAmount: Decimal;
  readonly fromCurrency: SupportedCurrencyCode;
  readonly toCurrency: SupportedCurrencyCode;
  readonly exchangeRate: Decimal;
  readonly convertedAmount: Decimal;
  readonly formattedOriginal: string;
  readonly formattedConverted: string;
}

export class CurrencyCalculationError extends Error {
  constructor(message: string) {
    super(`[CurrencyCalculation] ${message}`);
    this.name = 'CurrencyCalculationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Validates that an exchange rate is a finite, positive Decimal greater than zero.
 */
export function validateExchangeRate(rate: DecimalValue): Decimal {
  const dec = toDecimal(rate);
  if (dec.isNaN() || !dec.isFinite()) {
    throw new CurrencyCalculationError('Exchange rate must be a valid, finite number.');
  }
  if (dec.lte(0)) {
    throw new CurrencyCalculationError(`Exchange rate must be greater than zero. Received: ${dec.toString()}`);
  }
  return dec;
}

/**
 * Converts an amount from one currency to another using exact Decimal.js math.
 * Strictly avoids JavaScript floating-point imprecision.
 */
export function convertCurrency(options: CurrencyConversionOptions): CurrencyConversionResult {
  const { fromCurrency, toCurrency, roundingDecimals } = options;
  const originalAmount = toDecimal(options.amount);
  getCurrencyMetadata(fromCurrency);
  const toMeta = getCurrencyMetadata(toCurrency);

  // Same-currency conversion invariant: rate is strictly 1
  if (fromCurrency === toCurrency) {
    const rate = new Decimal(1);
    const decimals = roundingDecimals ?? toMeta.standardDecimals;
    const rounded = roundHalfEven(originalAmount, decimals);

    return Object.freeze({
      originalAmount,
      fromCurrency,
      toCurrency,
      exchangeRate: rate,
      convertedAmount: rounded,
      formattedOriginal: formatCurrencyAmount(originalAmount, fromCurrency),
      formattedConverted: formatCurrencyAmount(rounded, toCurrency),
    });
  }

  // Cross-currency conversion requires verified positive exchange rate
  const rate = validateExchangeRate(options.exchangeRate);
  const targetDecimals = roundingDecimals ?? toMeta.standardDecimals;

  // Exact math: original * rate
  const rawConverted = originalAmount.times(rate);
  const convertedAmount = roundHalfEven(rawConverted, targetDecimals);

  return Object.freeze({
    originalAmount,
    fromCurrency,
    toCurrency,
    exchangeRate: rate,
    convertedAmount,
    formattedOriginal: formatCurrencyAmount(originalAmount, fromCurrency),
    formattedConverted: formatCurrencyAmount(convertedAmount, toCurrency),
  });
}

/**
 * Formats a financial amount with proper currency symbol and decimal places using Decimal.js.
 */
export function formatCurrencyAmount(
  amount: DecimalValue,
  currencyCode: SupportedCurrencyCode,
  decimals?: number
): string {
  const dec = toDecimal(amount);
  const meta = getCurrencyMetadata(currencyCode);
  const decPlaces = decimals ?? meta.standardDecimals;
  const formattedNumber = dec.toFixed(decPlaces);

  // Group thousands with commas
  const parts = formattedNumber.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const grouped = parts.join('.');

  if (meta.symbolPlacement === 'prefix') {
    return `${meta.symbol} ${grouped}`;
  }
  return `${grouped} ${meta.symbol}`;
}
