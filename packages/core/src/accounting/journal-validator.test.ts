import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateJournalLines, assertBalancedJournal } from './journal-validator.js';

describe('Journal Entry Balance Validation Suite', () => {
  describe('Balanced Entries', () => {
    it('should accept a standard balanced two-line entry', () => {
      const lines = [
        { accountId: 'acc_cash', accountCode: '1010', debit: '1500.00', credit: '0' },
        { accountId: 'acc_sales', accountCode: '4010', debit: '0', credit: '1500.00' },
      ];

      const result = validateJournalLines(lines);

      assert.equal(result.isValid, true);
      assert.equal(result.isBalanced, true);
      assert.equal(result.totalDebit.toFixed(2), '1500.00');
      assert.equal(result.totalCredit.toFixed(2), '1500.00');
      assert.equal(result.difference.toFixed(2), '0.00');
      assert.equal(result.errors.length, 0);

      // Should also not throw
      assert.doesNotThrow(() => assertBalancedJournal(lines));
    });

    it('should accept a multi-line entry with split debits/credits', () => {
      const lines = [
        { accountId: 'acc_ar', accountCode: '1200', debit: '1150.0000', credit: '0' },
        { accountId: 'acc_sales', accountCode: '4010', debit: '0', credit: '1000.0000' },
        { accountId: 'acc_tax_payable', accountCode: '2150', debit: '0', credit: '150.0000' },
      ];

      const result = validateJournalLines(lines);

      assert.equal(result.isValid, true);
      assert.equal(result.isBalanced, true);
      assert.equal(result.totalDebit.toFixed(4), '1150.0000');
      assert.equal(result.totalCredit.toFixed(4), '1150.0000');
      assert.equal(result.difference.toFixed(4), '0.0000');
      assert.equal(result.errors.length, 0);
    });

    it('should accurately handle fractional 4-decimal currency amounts', () => {
      const lines = [
        { accountId: 'acc_1', debit: '33.3333', credit: '0' },
        { accountId: 'acc_2', debit: '66.6667', credit: '0' },
        { accountId: 'acc_3', debit: '0', credit: '100.0000' },
      ];

      const result = validateJournalLines(lines);

      assert.equal(result.isValid, true);
      assert.equal(result.isBalanced, true);
      assert.equal(result.difference.toFixed(4), '0.0000');
    });
  });

  describe('Unbalanced Entries', () => {
    it('should reject when total debit exceeds total credit', () => {
      const lines = [
        { accountId: 'acc_cash', debit: '100.00', credit: '0' },
        { accountId: 'acc_sales', debit: '0', credit: '99.99' },
      ];

      const result = validateJournalLines(lines);

      assert.equal(result.isValid, false);
      assert.equal(result.isBalanced, false);
      assert.equal(result.difference.toFixed(4), '0.0100');
      assert.ok(result.errors.some((e) => e.includes('unbalanced')));

      assert.throws(() => assertBalancedJournal(lines), /unbalanced/i);
    });

    it('should reject when total credit exceeds total debit', () => {
      const lines = [
        { accountId: 'acc_cash', debit: '500.00', credit: '0' },
        { accountId: 'acc_sales', debit: '0', credit: '600.00' },
      ];

      const result = validateJournalLines(lines);

      assert.equal(result.isValid, false);
      assert.equal(result.isBalanced, false);
      assert.equal(result.difference.toFixed(2), '100.00');
      assert.ok(result.errors.some((e) => e.includes('unbalanced')));
    });
  });

  describe('Zero-Value Entries', () => {
    it('should reject entries where all lines have zero amounts', () => {
      const lines = [
        { accountId: 'acc_1', debit: '0.00', credit: '0.00' },
        { accountId: 'acc_2', debit: '0.00', credit: '0.00' },
      ];

      const result = validateJournalLines(lines);

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('must have either a non-zero debit or credit')));
      assert.ok(result.errors.some((e) => e.includes('must be strictly greater than zero')));
    });

    it('should reject lines with zero amounts even if others balance', () => {
      const lines = [
        { accountId: 'acc_cash', debit: '100.00', credit: '0' },
        { accountId: 'acc_sales', debit: '0', credit: '100.00' },
        { accountId: 'acc_dummy', debit: '0', credit: '0' },
      ];

      const result = validateJournalLines(lines);

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('Line 3: Line must have either a non-zero debit or credit')));
    });
  });

  describe('Invalid Amounts & Structural Failures', () => {
    it('should reject negative debit amounts', () => {
      const lines = [
        { accountId: 'acc_cash', debit: '-100.00', credit: '0' },
        { accountId: 'acc_sales', debit: '0', credit: '100.00' },
      ];

      const result = validateJournalLines(lines);

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('cannot be negative')));
    });

    it('should reject negative credit amounts', () => {
      const lines = [
        { accountId: 'acc_cash', debit: '100.00', credit: '0' },
        { accountId: 'acc_sales', debit: '0', credit: '-100.00' },
      ];

      const result = validateJournalLines(lines);

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('cannot be negative')));
    });

    it('should reject a line having both positive debit and credit', () => {
      const lines = [
        { accountId: 'acc_1', debit: '100.00', credit: '50.00' },
        { accountId: 'acc_2', debit: '0', credit: '50.00' },
      ];

      const result = validateJournalLines(lines);

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('cannot have both positive debit')));
    });

    it('should reject non-numeric string values', () => {
      const lines = [
        { accountId: 'acc_1', debit: 'invalid_amount', credit: '0' },
        { accountId: 'acc_2', debit: '0', credit: '100.00' },
      ];

      const result = validateJournalLines(lines);

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('Invalid debit amount')));
    });

    it('should reject lines with missing accountId', () => {
      const lines = [
        { accountId: '', debit: '100.00', credit: '0' },
        { accountId: 'acc_sales', debit: '0', credit: '100.00' },
      ];

      const result = validateJournalLines(lines);

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('Missing account identifier')));
    });

    it('should reject journal entries with fewer than two lines', () => {
      const lines = [{ accountId: 'acc_cash', debit: '100.00', credit: '0' }];

      const result = validateJournalLines(lines);

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('must contain at least two lines')));
    });
  });
});
