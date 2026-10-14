import { z } from 'zod';

export const CompanyStatusEnum = z.enum(['active', 'suspended', 'archived']);
export type CompanyStatus = z.infer<typeof CompanyStatusEnum>;

export const BranchStatusEnum = z.enum(['active', 'inactive']);
export type BranchStatus = z.infer<typeof BranchStatusEnum>;

export const CompanyRoleEnum = z.enum(['owner', 'admin', 'accountant', 'auditor', 'viewer']);
export type CompanyRole = z.infer<typeof CompanyRoleEnum>;

export const SubscriptionStatusEnum = z.enum(['trial', 'active', 'past_due', 'suspended', 'cancelled']);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;

export const SeatTypeEnum = z.enum(['full', 'read_only']);
export type SeatType = z.infer<typeof SeatTypeEnum>;

export const CompanyInputSchema = z.object({
  name: z.string().trim().min(2, 'Company name must be at least 2 characters').max(100),
  legalName: z.string().trim().min(2, 'Legal name must be at least 2 characters').max(150),
  taxId: z.string().trim().max(50).optional(),
  trn: z.string().trim().max(50).optional(),
  currency: z.string().trim().length(3, 'Currency must be a 3-letter ISO code').default('AED'),
  fiscalYearStartMonth: z.number().int().min(1).max(12).default(1),
  countryCode: z.string().trim().length(2).default('AE'),
  industryType: z.enum(['retail', 'supermarket', 'restaurant', 'trading', 'manufacturing', 'services', 'general']).default('general'),
  enabledModules: z.array(z.string()).default(['accounting']),
  plan: z.string().default('starter'),
  subscriptionStatus: SubscriptionStatusEnum.default('trial'),
  seatLimit: z.number().int().min(1).default(3),
  trialEndsAt: z.date().optional(),
  entitlements: z.array(z.string()).default([]),
  status: CompanyStatusEnum.default('active'),
});

export const BranchInputSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  code: z
    .string()
    .trim()
    .min(1, 'Branch code is required')
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, 'Branch code must be alphanumeric with optional dashes or underscores')
    .transform(c => c.toUpperCase()),
  name: z.string().trim().min(2, 'Branch name must be at least 2 characters').max(100),
  address: z.string().trim().max(300).optional(),
  isMain: z.boolean().default(false),
  status: BranchStatusEnum.default('active'),
});

export const CompanyMembershipInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  companyId: z.string().min(1, 'Company ID is required'),
  role: CompanyRoleEnum.default('viewer'),
  seatType: SeatTypeEnum.default('full'),
  branchAccess: z.array(z.string()).or(z.literal('all')).default('all'),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type CompanyInput = z.infer<typeof CompanyInputSchema>;
export type BranchInput = z.infer<typeof BranchInputSchema>;
export type CompanyMembershipInput = z.infer<typeof CompanyMembershipInputSchema>;
