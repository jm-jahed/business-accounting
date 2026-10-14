import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isSupportedCurrency,
  getCurrencyMetadata,
  convertCurrency,
  validateExchangeRate,
  formatCurrencyAmount,
  CurrencyCalculationError,
} from '../index.js';

describe('Currency Metadata & Support Suite', () => {
  it('should support the six required currencies: AED, USD, BDT, INR, SAR, EUR', () => {
    const required = ['AED', 'USD', 'BDT', 'INR', 'SAR', 'EUR'];
    for (const code of required) {
      assert(isSupportedCurrency(code), `Currency ${code} must be supported`);
      const meta = getCurrencyMetadata(code);
      assert.equal(meta.code, code);
      assert.equal(meta.standardDecimals, 2);
      assert(meta.symbol.length > 0, `Symbol for ${code} must not be empty`);
    }
  });

  it('should throw an error for unsupported currencies', () => {
    assert.equal(isSupportedCurrency('XYZ'), false);
    assert.throws(
      () => getCurrencyMetadata('XYZ'),
      /Unsupported currency code "XYZ"/
    );
  });
});

describe('Exchange Rate Validation & Conversion Suite', () => {
  it('should reject zero or negative exchange rates', () => {
    assert.throws(() => validateExchangeRate(0), CurrencyCalculationError);
    assert.throws(() => validateExchangeRate('-3.67'), CurrencyCalculationError);
    assert.throws(() => validateExchangeRate('invalid_rate'), Error);
  });

  it('should accept valid positive exchange rates', () => {
    const rate = validateExchangeRate('3.6725');
    assert.equal(rate.toString(), '3.6725');
  });

  it('should correctly convert identical currencies with rate=1', () => {
    const result = convertCurrency({
      amount: '500.00',
      fromCurrency: 'AED',
      toCurrency: 'AED',
      exchangeRate: 1,
    });

    assert.equal(result.convertedAmount.toString(), '500');
    assert.equal(result.exchangeRate.toString(), '1');
    assert.equal(result.fromCurrency, 'AED');
    assert.equal(result.toCurrency, 'AED');
  });

  it('should accurately convert cross-currency amounts using exact Decimal.js math', () => {
    // 1,000 USD to AED at fixed peg 3.6725 = 3,672.50 AED
    const result = convertCurrency({
      amount: '1000.00',
      fromCurrency: 'USD',
      toCurrency: 'AED',
      exchangeRate: '3.6725',
    });

    assert.equal(result.convertedAmount.toString(), '3672.5');
    assert.equal(result.formattedConverted, 'AED 3,672.50');
  });

  it('should apply Banker rounding (Round Half-Even) on fractional currency conversions', () => {
    // 100 USD to BDT at 32.555 -> 3255.50 (even round)
    const result = convertCurrency({
      amount: '100.00',
      fromCurrency: 'USD',
      toCurrency: 'BDT',
      exchangeRate: '32.555',
    });

    assert.equal(result.convertedAmount.toFixed(2), '3255.50');
  });

  it('should format currency amounts with standard thousands commas and proper symbol', () => {
    assert.equal(formatCurrencyAmount('15400.50', 'AED'), 'AED 15,400.50');
    assert.equal(formatCurrencyAmount('1250000.00', 'USD'), '$ 1,250,000.00');
    assert.equal(formatCurrencyAmount('50000.25', 'BDT'), '৳ 50,000.25');
    assert.equal(formatCurrencyAmount('75000.00', 'INR'), '₹ 75,000.00');
  });
});
