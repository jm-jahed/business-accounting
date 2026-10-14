import { Decimal, toDecimal, isNegative, isPositive, isZero } from '../math/decimal.js';

export interface ValidatableLine {
  accountId: string;
  accountCode?: string;
  debit: Decimal | string | number;
  credit: Decimal | string | number;
  description?: string;
}

export interface JournalValidationResult {
  isValid: boolean;
  isBalanced: boolean;
  totalDebit: Decimal;
  totalCredit: Decimal;
  difference: Decimal;
  lineCount: number;
  errors: string[];
}

/**
 * Validates the mathematical and structural integrity of journal entry lines.
 * Strictly verifies double-entry balance: SUM(Debits) == SUM(Credits) and SUM(Debits) > 0.
 */
export function validateJournalLines(lines: ValidatableLine[]): JournalValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(lines) || lines.length < 2) {
    return {
      isValid: false,
      isBalanced: false,
      totalDebit: new Decimal(0),
      totalCredit: new Decimal(0),
      difference: new Decimal(0),
      lineCount: lines?.length || 0,
      errors: ['A journal entry must contain at least two lines.'],
    };
  }

  let totalDebit = new Decimal(0);
  let totalCredit = new Decimal(0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check account identifier
    if (!line.accountId || line.accountId.trim() === '') {
      errors.push(`Line ${lineNum}: Missing account identifier.`);
    }

    // Parse debit
    let debit: Decimal;
    try {
      debit = toDecimal(line.debit ?? 0);
    } catch {
      errors.push(`Line ${lineNum}: Invalid debit amount "${line.debit}".`);
      debit = new Decimal(0);
    }

    // Parse credit
    let credit: Decimal;
    try {
      credit = toDecimal(line.credit ?? 0);
    } catch {
      errors.push(`Line ${lineNum}: Invalid credit amount "${line.credit}".`);
      credit = new Decimal(0);
    }

    // Check non-negative
    if (isNegative(debit)) {
      errors.push(`Line ${lineNum}: Debit amount cannot be negative (${debit.toString()}).`);
    }
    if (isNegative(credit)) {
      errors.push(`Line ${lineNum}: Credit amount cannot be negative (${credit.toString()}).`);
    }

    // Cannot have both debit and credit on the same line
    if (isPositive(debit) && isPositive(credit)) {
      errors.push(
        `Line ${lineNum}: A single line cannot have both positive debit (${debit.toString()}) and credit (${credit.toString()}).`
      );
    }

    // Cannot have both zero
    if (isZero(debit) && isZero(credit)) {
      errors.push(`Line ${lineNum}: Line must have either a non-zero debit or credit.`);
    }

    if (!isNegative(debit)) {
      totalDebit = totalDebit.plus(debit);
    }
    if (!isNegative(credit)) {
      totalCredit = totalCredit.plus(credit);
    }
  }

  // Calculate difference: Debit - Credit
  const difference = totalDebit.minus(totalCredit).abs();
  const isBalanced = difference.isZero();

  if (!isBalanced) {
    errors.push(
      `Journal entry is unbalanced. Total Debits (${totalDebit.toFixed(4)}) must equal Total Credits (${totalCredit.toFixed(4)}). Difference: ${difference.toFixed(4)}.`
    );
  }

  if (totalDebit.isZero()) {
    errors.push('Journal entry total amount must be strictly greater than zero.');
  }

  return {
    isValid: errors.length === 0,
    isBalanced,
    totalDebit,
    totalCredit,
    difference,
    lineCount: lines.length,
    errors,
  };
}

/**
 * Asserts that journal lines are balanced and valid. Throws an Error with all failure reasons if invalid.
 */
export function assertBalancedJournal(lines: ValidatableLine[]): JournalValidationResult {
  const result = validateJournalLines(lines);
  if (!result.isValid) {
    throw new Error(`Accounting Invariant Error: ${result.errors.join(' | ')}`);
  }
  return result;
}
