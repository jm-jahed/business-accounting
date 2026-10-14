import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPPORTED_LOCALES,
  Locale,
  DICTIONARIES,
  getDictionary,
  formatLocalizedDate,
  formatLocalizedNumber,
} from '../index.js';

describe('Internationalization & RTL Localization Suite', () => {
  it('should support the four required initial languages: en, bn, ar, hi', () => {
    const required: Locale[] = ['en', 'bn', 'ar', 'hi'];
    for (const code of required) {
      assert(SUPPORTED_LOCALES[code], `Locale "${code}" must be supported`);
      assert.equal(SUPPORTED_LOCALES[code].code, code);
      assert(SUPPORTED_LOCALES[code].label.length > 0);
      assert(SUPPORTED_LOCALES[code].nativeName.length > 0);
    }
  });

  it('should configure Arabic with strict RTL text direction and others with LTR', () => {
    assert.equal(
      SUPPORTED_LOCALES.ar.dir,
      'rtl',
      'Arabic (ar) must have dir="rtl" for complete RTL layout'
    );
    assert.equal(SUPPORTED_LOCALES.en.dir, 'ltr');
    assert.equal(SUPPORTED_LOCALES.bn.dir, 'ltr');
    assert.equal(SUPPORTED_LOCALES.hi.dir, 'ltr');
  });

  it('should provide full key parity across all language translation dictionaries', () => {
    const canonical = DICTIONARIES.en;
    const locales: Locale[] = ['en', 'bn', 'ar', 'hi'];

    for (const loc of locales) {
      const dict = getDictionary(loc);
      assert(dict, `Dictionary for ${loc} must exist`);

      // Verify sections exist
      const sections = ['nav', 'header', 'dashboard', 'status', 'currency'] as const;
      for (const section of sections) {
        assert(dict[section], `Section "${section}" must exist in "${loc}" dictionary`);

        // Check each key in canonical section exists in this locale
        const canonicalKeys = Object.keys(canonical[section]);
        const locKeys = Object.keys(dict[section]);

        assert.deepEqual(
          locKeys.sort(),
          canonicalKeys.sort(),
          `Locale "${loc}" section "${section}" must have all canonical keys`
        );

        // Ensure no empty strings
        for (const key of canonicalKeys) {
          const value = (dict[section] as Record<string, string>)[key];
          assert(
            typeof value === 'string' && value.trim().length > 0,
            `Key "${section}.${key}" in locale "${loc}" must not be empty`
          );
        }
      }
    }
  });

  it('should verify reviewed, authentic accounting terminology in translations', () => {
    // English
    assert.equal(DICTIONARIES.en.nav.generalLedger, 'General Ledger');
    assert.equal(DICTIONARIES.en.nav.chartOfAccounts, 'Chart of Accounts');
    assert.equal(DICTIONARIES.en.dashboard.debitCol, 'Total Debits');
    assert.equal(DICTIONARIES.en.dashboard.creditCol, 'Total Credits');

    // Bengali (Reviewed IFRS/Accounting terms)
    assert.equal(DICTIONARIES.bn.nav.generalLedger, 'সাধারণ খতিয়ান');
    assert.equal(DICTIONARIES.bn.nav.chartOfAccounts, 'হিসাবের তালিকা');
    assert.equal(DICTIONARIES.bn.dashboard.debitCol, 'মোট ডেবিট');
    assert.equal(DICTIONARIES.bn.dashboard.creditCol, 'মোট ক্রেডিট');
    assert.equal(DICTIONARIES.bn.dashboard.balancedLabel, 'সমতাকৃত: ডেবিট = ক্রেডিট');

    // Arabic (Reviewed GCC/IFRS terminology)
    assert.equal(DICTIONARIES.ar.nav.generalLedger, 'دفتر الأستاذ العام');
    assert.equal(DICTIONARIES.ar.nav.chartOfAccounts, 'دليل الحسابات');
    assert.equal(DICTIONARIES.ar.dashboard.debitCol, 'إجمالي المدين');
    assert.equal(DICTIONARIES.ar.dashboard.creditCol, 'إجمالي الدائن');
    assert.equal(DICTIONARIES.ar.dashboard.balancedLabel, 'متوازن: المدين = الدائن');

    // Hindi (Reviewed accounting terms)
    assert.equal(DICTIONARIES.hi.nav.generalLedger, 'सामान्य बहीखाता');
    assert.equal(DICTIONARIES.hi.nav.chartOfAccounts, 'खातों की सूची');
    assert.equal(DICTIONARIES.hi.dashboard.debitCol, 'कुल डेबिट');
    assert.equal(DICTIONARIES.hi.dashboard.creditCol, 'कुल क्रेडिट');
  });

  it('should format dates properly according to locale without crashing', () => {
    const testDate = new Date('2026-10-14T12:00:00Z');
    const locales: Locale[] = ['en', 'bn', 'ar', 'hi'];

    for (const loc of locales) {
      const formatted = formatLocalizedDate(testDate, loc);
      assert(typeof formatted === 'string' && formatted.length > 0);
    }

    // Invalid date safety
    assert.equal(formatLocalizedDate('not-a-date', 'en'), 'Invalid Date');
  });

  it('should format numbers properly according to locale', () => {
    const num = 15400.5;
    const locales: Locale[] = ['en', 'bn', 'ar', 'hi'];

    for (const loc of locales) {
      const formatted = formatLocalizedNumber(num, loc);
      assert(typeof formatted === 'string' && formatted.length > 0);
    }

    // Invalid number fallback
    assert.equal(formatLocalizedNumber('not-a-number', 'en'), '0');
  });
});
