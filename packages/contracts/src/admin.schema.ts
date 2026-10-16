import { z } from 'zod';

// ==========================================
// 1. Admin Roles & Permissions
// ==========================================
export const ADMIN_ROLES = ['SUPER_ADMIN', 'BILLING', 'SUPPORT', 'DEVELOPER'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];
export const AdminRoleSchema = z.enum(ADMIN_ROLES);

export const AdminUserStatusSchema = z.enum(['active', 'suspended']);
export type AdminUserStatus = z.infer<typeof AdminUserStatusSchema>;

export const SuperAdminUserDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(2),
  role: AdminRoleSchema,
  status: AdminUserStatusSchema,
  isTotpEnabled: z.boolean(),
  mustChangePassword: z.boolean(),
  lastLoginAt: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type SuperAdminUserDto = z.infer<typeof SuperAdminUserDtoSchema>;

export const CreateAdminUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(2).max(100),
  role: AdminRoleSchema,
  password: z.string().min(12, 'Password must be at least 12 characters long'),
});
export type CreateAdminUserInput = z.infer<typeof CreateAdminUserSchema>;

export const UpdateAdminUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: AdminRoleSchema.optional(),
  status: AdminUserStatusSchema.optional(),
});
export type UpdateAdminUserInput = z.infer<typeof UpdateAdminUserSchema>;

export const AdminLoginInputSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});
export type AdminLoginInput = z.infer<typeof AdminLoginInputSchema>;

export const AdminTotpVerifyInputSchema = z.object({
  tempToken: z.string().min(1),
  totpCode: z.string().min(6).max(8), // 6 digit OTP or 8 char recovery code
});
export type AdminTotpVerifyInput = z.infer<typeof AdminTotpVerifyInputSchema>;

export const AdminChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12, 'New password must be at least 12 characters long'),
});
export type AdminChangePasswordInput = z.infer<typeof AdminChangePasswordSchema>;

// ==========================================
// 2. Plans & Dynamic Regional Pricing
// ==========================================
export const PlanLimitsSchema = z.object({
  users: z.number().int().min(1),
  companies: z.number().int().min(1),
  invoicesPerMonth: z.number().int().min(-1), // -1 for unlimited
  storageMb: z.number().int().min(100),
});
export type PlanLimits = z.infer<typeof PlanLimitsSchema>;

export const PlanSchema = z.object({
  id: z.string(),
  code: z.string().min(2).max(50),
  nameEn: z.string().min(2),
  nameBn: z.string().min(2),
  nameAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionBn: z.string().optional(),
  descriptionAr: z.string().optional(),
  isPublic: z.boolean().default(true),
  isActive: z.boolean().default(true),
  modules: z.array(z.string()).default(['accounting']),
  limits: PlanLimitsSchema,
  sortOrder: z.number().int().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type PlanDto = z.infer<typeof PlanSchema>;

export const CreatePlanSchema = z.object({
  code: z.string().min(2).max(50).toLowerCase().regex(/^[a-z0-9_-]+$/, 'Plan code must be alphanumeric with dashes or underscores'),
  nameEn: z.string().min(2).max(100),
  nameBn: z.string().min(2).max(100),
  nameAr: z.string().max(100).optional(),
  descriptionEn: z.string().max(500).optional(),
  descriptionBn: z.string().max(500).optional(),
  descriptionAr: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  isActive: z.boolean().default(true),
  modules: z.array(z.string()).default(['accounting']),
  limits: PlanLimitsSchema,
  sortOrder: z.number().int().default(0),
});
export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;

export const UpdatePlanSchema = CreatePlanSchema.partial().omit({ code: true });
export type UpdatePlanInput = z.infer<typeof UpdatePlanSchema>;

export const BILLING_CYCLES = ['MONTHLY', 'SIX_MONTHS', 'YEARLY'] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];
export const BillingCycleSchema = z.enum(BILLING_CYCLES);

export const PlanPriceSchema = z.object({
  id: z.string(),
  planId: z.string(),
  planCode: z.string(),
  region: z.string().min(2),
  currency: z.string().length(3),
  billingCycle: BillingCycleSchema,
  amount: z.string(), // Decimal string
  extraUserAmount: z.string(), // Decimal string
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});
export type PlanPriceDto = z.infer<typeof PlanPriceSchema>;

export const CreatePlanPriceSchema = z.object({
  planId: z.string().min(1),
  region: z.string().min(2).toUpperCase(),
  currency: z.string().length(3).toUpperCase(),
  billingCycle: BillingCycleSchema,
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price amount format'),
  extraUserAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid extra user price format'),
  effectiveFrom: z.string().optional(),
});
export type CreatePlanPriceInput = z.infer<typeof CreatePlanPriceSchema>;

// ==========================================
// 3. Subscriptions & Company Enforcement
// ==========================================
export const SUBSCRIPTION_LIFECYCLE_STATUSES = [
  'TRIAL',
  'ACTIVE',
  'DUE',
  'GRACE',
  'READ_ONLY',
  'SUSPENDED',
  'CANCELLED',
] as const;
export type SubscriptionLifecycleStatus = (typeof SUBSCRIPTION_LIFECYCLE_STATUSES)[number];
export const SubscriptionLifecycleStatusSchema = z.enum(SUBSCRIPTION_LIFECYCLE_STATUSES);

export const SubscriptionDtoSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  companyName: z.string().optional(),
  companySlug: z.string().optional(),
  planId: z.string(),
  planCode: z.string(),
  planNameEn: z.string().optional(),
  planPriceId: z.string().optional(),
  billingCycle: BillingCycleSchema,
  currency: z.string(),
  amount: z.string(),
  seats: z.number().int(),
  status: SubscriptionLifecycleStatusSchema,
  trialEndsAt: z.string().nullable().optional(),
  currentPeriodStart: z.string(),
  currentPeriodEnd: z.string(),
  graceEndsAt: z.string().nullable().optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type SubscriptionDto = z.infer<typeof SubscriptionDtoSchema>;

export const CreateSubscriptionSchema = z.object({
  companyId: z.string().min(1),
  planId: z.string().min(1),
  planPriceId: z.string().optional(),
  billingCycle: BillingCycleSchema.default('MONTHLY'),
  currency: z.string().length(3).toUpperCase().default('AED'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  seats: z.number().int().min(1).default(3),
  status: SubscriptionLifecycleStatusSchema.default('ACTIVE'),
  trialEndsAt: z.string().optional(),
  currentPeriodStart: z.string().optional(),
  currentPeriodEnd: z.string().optional(),
  graceEndsAt: z.string().optional(),
  notes: z.string().max(500).optional(),
});
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;

export const UpdateSubscriptionStatusSchema = z.object({
  status: SubscriptionLifecycleStatusSchema,
  reason: z.string().min(3).max(500),
  graceEndsAt: z.string().optional(),
  notes: z.string().max(500).optional(),
});
export type UpdateSubscriptionStatusInput = z.infer<typeof UpdateSubscriptionStatusSchema>;

export const ExtendSubscriptionSchema = z.object({
  extensionDays: z.number().int().min(1).max(365),
  reason: z.string().min(3).max(500),
});
export type ExtendSubscriptionInput = z.infer<typeof ExtendSubscriptionSchema>;

// ==========================================
// 4. Data-Driven Regions & Exchange Rates
// ==========================================
export const CountryRegionMappingSchema = z.object({
  countryCode: z.string().length(2).toUpperCase(),
  countryName: z.string().min(2),
  regionCode: z.string().min(2).toUpperCase(),
  regionName: z.string().min(2),
});
export type CountryRegionMapping = z.infer<typeof CountryRegionMappingSchema>;

export const AdminExchangeRateSchema = z.object({
  fromCurrency: z.string().length(3).toUpperCase(),
  toCurrency: z.string().length(3).toUpperCase(),
  rate: z.string().regex(/^\d+(\.\d{1,6})?$/),
  effectiveDate: z.string(),
});
export type AdminExchangeRate = z.infer<typeof AdminExchangeRateSchema>;

// ==========================================
// 5. Admin Metrics & MRR
// ==========================================
export const CurrencyMrrSchema = z.object({
  currency: z.string(),
  monthlyCount: z.number().int(),
  sixMonthsCount: z.number().int(),
  yearlyCount: z.number().int(),
  totalActiveCount: z.number().int(),
  mrrAmount: z.string(), // Decimal string
  arrAmount: z.string(), // Decimal string
});
export type CurrencyMrr = z.infer<typeof CurrencyMrrSchema>;

export const AdminDashboardOverviewSchema = z.object({
  companies: z.object({
    total: z.number().int(),
    active: z.number().int(),
    trial: z.number().int(),
    due: z.number().int(),
    grace: z.number().int(),
    readOnly: z.number().int(),
    suspended: z.number().int(),
    expiringIn7Days: z.number().int(),
  }),
  byRegion: z.array(
    z.object({
      region: z.string(),
      count: z.number().int(),
    })
  ),
  byCountry: z.array(
    z.object({
      country: z.string(),
      count: z.number().int(),
    })
  ),
  mrrByCurrency: z.array(CurrencyMrrSchema),
  totalEstimatedMrr: z
    .object({
      baseCurrency: z.string(),
      amount: z.string(),
      label: z.literal('Estimated'),
    })
    .nullable(),
  hasExchangeRates: z.boolean(),
  recentExpiringSubscriptions: z.array(SubscriptionDtoSchema),
});
export type AdminDashboardOverview = z.infer<typeof AdminDashboardOverviewSchema>;

// ==========================================
// 6. Cryptographic Admin Audit Log
// ==========================================
export const AdminAuditLogEntrySchema = z.object({
  id: z.string(),
  sequenceNumber: z.number().int(),
  actorId: z.string(),
  actorEmail: z.string(),
  adminRole: AdminRoleSchema,
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  beforeState: z.record(z.any()).nullable().optional(),
  afterState: z.record(z.any()).nullable().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  prevHash: z.string(),
  hash: z.string(),
  timestamp: z.string(),
});
export type AdminAuditLogEntry = z.infer<typeof AdminAuditLogEntrySchema>;
