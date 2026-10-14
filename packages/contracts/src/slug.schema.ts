import { z } from 'zod';

export const RESERVED_COMPANY_SLUGS = [
  'admin',
  'super-admin',
  'login',
  'register',
  'signup',
  'signin',
  'logout',
  'auth',
  'api',
  'health',
  'invitations',
  'invite',
  'settings',
  'team',
  'files',
  'reports',
  'sales',
  'purchases',
  'accounts',
  'dashboard',
  'billing',
  'pricing',
  'support',
  'help',
  'docs',
  'assets',
  'static',
  'public',
  'favicon',
  'robots',
  'sitemap',
  'system',
  'root',
  'null',
  'undefined',
] as const;

export const COMPANY_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Normalizes a company name into a URL-safe, lowercase, hyphen-separated slug.
 */
export function normalizeCompanySlug(rawInput: string): string {
  if (!rawInput || typeof rawInput !== 'string') {
    return '';
  }

  return rawInput
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special characters
    .replace(/[\s_-]+/g, '-') // collapse whitespace and underscores into single hyphen
    .replace(/^-+|-+$/g, ''); // strip leading and trailing hyphens
}

/**
 * Zod schema for validating company store slugs.
 */
export const CompanySlugSchema = z
  .string()
  .trim()
  .min(3, 'Store slug must be at least 3 characters')
  .max(63, 'Store slug cannot exceed 63 characters')
  .regex(
    COMPANY_SLUG_REGEX,
    'Store slug must contain only lowercase alphanumeric characters and single hyphens (cannot start or end with a hyphen)'
  )
  .refine(
    (slug) => !RESERVED_COMPANY_SLUGS.includes(slug.toLowerCase() as any),
    (slug) => ({
      message: `"${slug}" is a reserved system keyword and cannot be used as a store slug`,
    })
  );

export type CompanySlug = z.infer<typeof CompanySlugSchema>;
