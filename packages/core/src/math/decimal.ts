import { Decimal } from 'decimal.js';

// Configure global Decimal precision and Banker's Rounding (Half-Even)
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_EVEN,
  toExpNeg: -9,
  toExpPos: 28,
});

export { Decimal };

export type DecimalValue = Decimal | string | number;

/**
 * Safely parses any input into an exact Decimal instance.
 * Throws a descriptive error if the value is NaN or invalid.
 */
export function toDecimal(value: DecimalValue): Decimal {
  if (value instanceof Decimal) {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid non-finite number value: ${value}`);
    }
    return new Decimal(value.toString());
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || isNaN(Number(trimmed))) {
      throw new Error(`Invalid numeric string value: "${value}"`);
    }
    return new Decimal(trimmed);
  }
  throw new Error(`Unsupported value type for Decimal conversion: ${typeof value}`);
}

/**
 * Rounds a Decimal value using Banker's Rounding (ROUND_HALF_EVEN) to specified decimal places.
 */
export function roundHalfEven(value: DecimalValue, decimalPlaces: number = 4): Decimal {
  const d = toDecimal(value);
  return d.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_EVEN);
}

/**
 * Formats a Decimal value to a standard 4-decimal accounting storage string.
 */
export function formatStorageAmount(value: DecimalValue): string {
  return roundHalfEven(value, 4).toFixed(4);
}

/**
 * Formats a Decimal value to a 2-decimal presentation string.
 */
export function formatDisplayAmount(value: DecimalValue): string {
  return roundHalfEven(value, 2).toFixed(2);
}

/**
 * Checks if a value is strictly zero.
 */
export function isZero(value: DecimalValue): boolean {
  return toDecimal(value).isZero();
}

/**
 * Checks if a value is strictly positive (> 0).
 */
export function isPositive(value: DecimalValue): boolean {
  return toDecimal(value).isPositive() && !toDecimal(value).isZero();
}

/**
 * Checks if a value is negative (< 0).
 */
export function isNegative(value: DecimalValue): boolean {
  return toDecimal(value).isNegative() && !toDecimal(value).isZero();
}
