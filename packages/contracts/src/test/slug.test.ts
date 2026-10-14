import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CompanySlugSchema,
  normalizeCompanySlug,
  RESERVED_COMPANY_SLUGS,
  FileRouteParamsSchema,
} from '../index.js';

describe('Company Slug Normalization and Validation Suite', () => {
  it('should normalize company names into clean, URL-safe slugs', () => {
    assert.equal(normalizeCompanySlug('Al-Futtaim Trading LLC'), 'al-futtaim-trading-llc');
    assert.equal(normalizeCompanySlug('  Global Retail & Supermarket!  '), 'global-retail-supermarket');
    assert.equal(normalizeCompanySlug('Tech Solutions 2026'), 'tech-solutions-2026');
    assert.equal(normalizeCompanySlug('___Store---Name___'), 'store-name');
  });

  it('should validate well-formed store slugs', () => {
    const validSlugs = [
      'al-futtaim-retail',
      'store-123',
      'dubai-logistics',
      'my-shop',
      'xyz-company',
    ];

    for (const slug of validSlugs) {
      const parsed = CompanySlugSchema.safeParse(slug);
      assert.equal(parsed.success, true, `Expected "${slug}" to be valid`);
    }
  });

  it('should reject slugs that are too short or too long', () => {
    assert.equal(CompanySlugSchema.safeParse('ab').success, false);
    assert.equal(CompanySlugSchema.safeParse('a'.repeat(64)).success, false);
  });

  it('should reject slugs with invalid characters or bad hyphen placement', () => {
    const invalidSlugs = [
      'store_name', // underscores not allowed in URL slug
      '-store-name', // leading hyphen
      'store-name-', // trailing hyphen
      'store--name', // double hyphen
      'store.name', // dot
      'Store-Name', // uppercase
      'store name', // space
    ];

    for (const slug of invalidSlugs) {
      const parsed = CompanySlugSchema.safeParse(slug);
      assert.equal(parsed.success, false, `Expected "${slug}" to be rejected`);
    }
  });

  it('should strictly reject all reserved system keywords', () => {
    for (const reserved of RESERVED_COMPANY_SLUGS) {
      const parsed = CompanySlugSchema.safeParse(reserved);
      assert.equal(parsed.success, false, `Expected reserved keyword "${reserved}" to be rejected`);
    }
  });
});

describe('File Route Contract Security Schema Suite', () => {
  it('should validate secure store file route params', () => {
    const validParams = {
      storeSlug: 'acme-retail',
      fileName: 'vat-return-q1.pdf',
    };
    const result = FileRouteParamsSchema.safeParse(validParams);
    assert.equal(result.success, true);
  });

  it('should reject path traversal sequences in file names', () => {
    const maliciousParams = [
      { storeSlug: 'acme-retail', fileName: '../passwords.txt' },
      { storeSlug: 'acme-retail', fileName: '..\\secrets.env' },
      { storeSlug: 'acme-retail', fileName: 'safe/../../etc/passwd' },
    ];

    for (const params of maliciousParams) {
      const result = FileRouteParamsSchema.safeParse(params);
      assert.equal(result.success, false, `Expected path traversal "${params.fileName}" to be rejected`);
    }
  });
});
