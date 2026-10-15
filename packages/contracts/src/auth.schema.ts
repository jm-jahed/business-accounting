import { z } from 'zod';

export const RegisterUserInputSchema = z.object({
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().trim().max(30).optional(),
});

export const LoginInputSchema = z.object({
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const InviteUserInputSchema = z.object({
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  role: z.enum(['admin', 'accountant', 'auditor', 'viewer']),
});

export const AcceptInvitationInputSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
});

import { CompanySlugSchema } from './slug.schema.js';

export const CreateCompanyWithOnboardingSchema = z.object({
  name: z.string().trim().min(2, 'Company name must be at least 2 characters').max(100),
  legalName: z.string().trim().min(2, 'Legal name must be at least 2 characters').max(150),
  slug: CompanySlugSchema.optional(),
  taxId: z.string().trim().max(50).optional(),
  trn: z.string().trim().max(50).optional(),
  currency: z.string().trim().length(3, 'Currency must be a 3-letter ISO code').default('AED'),
  fiscalYearStartMonth: z.number().int().min(1).max(12).default(1),
  countryCode: z.string().trim().length(2).default('AE'),
  industryType: z.enum(['retail', 'supermarket', 'restaurant', 'trading', 'manufacturing', 'services', 'general']).default('general'),
  enabledModules: z.array(z.string()).default(['accounting']),
});

export const RegisterOwnerAndCompanySchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().trim().max(30).optional(),
  companyName: z.string().trim().min(2, 'Company name must be at least 2 characters').max(100),
  legalName: z.string().trim().min(2, 'Legal name must be at least 2 characters').max(150),
  slug: CompanySlugSchema.optional(),
  countryCode: z.string().trim().length(2).default('AE'),
  currency: z.string().trim().length(3, 'Currency must be a 3-letter ISO code').default('AED'),
  fiscalYearStartMonth: z.number().int().min(1).max(12).default(1),
  industryType: z.enum(['retail', 'supermarket', 'restaurant', 'trading', 'manufacturing', 'services', 'general']).default('general'),
  trn: z.string().trim().max(50).optional(),
});

export type RegisterUserInput = z.infer<typeof RegisterUserInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type InviteUserInput = z.infer<typeof InviteUserInputSchema>;
export type AcceptInvitationInput = z.infer<typeof AcceptInvitationInputSchema>;
export type CreateCompanyWithOnboardingInput = z.infer<typeof CreateCompanyWithOnboardingSchema>;
export type RegisterOwnerAndCompanyInput = z.infer<typeof RegisterOwnerAndCompanySchema>;

export const RefreshTokenInputSchema = z.object({
  refreshToken: z.string().trim().min(1, 'Refresh token cannot be empty').optional(),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenInputSchema>;

export const GoogleAuthInputSchema = z.object({
  idToken: z.string().trim().min(1, 'Google ID token is required'),
});
export type GoogleAuthInput = z.infer<typeof GoogleAuthInputSchema>;

export const GoogleLinkAccountInputSchema = z.object({
  idToken: z.string().trim().min(1, 'Google ID token is required'),
  password: z.string().min(1, 'Password is required to link this account'),
});
export type GoogleLinkAccountInput = z.infer<typeof GoogleLinkAccountInputSchema>;

