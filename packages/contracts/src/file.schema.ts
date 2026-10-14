import { z } from 'zod';
import { CompanySlugSchema } from './slug.schema.js';

/**
 * File Route Contract Specification:
 * - Public/Canonical access pattern: /{storeSlug}/files/{fileName}
 * - Backend API access pattern: /api/v1/companies/{storeSlug}/files/{fileId}/{fileName}
 * - Physical Storage Namespace: companies/{companyId}/files/{fileId}/{safeFileName}
 *
 * Security Invariants:
 * 1. Store slug in URL must belong to the authenticated company membership.
 * 2. File ID must exist and belong to the verified tenant (file.companyId === session.companyId).
 * 3. File name must be sanitized against path traversal (no '..', '/', '\', or null bytes).
 * 4. Private files must never be served publicly by URL guessing.
 */

export const SAFE_FILE_NAME_REGEX = /^[a-zA-Z0-9_\-. ]+$/;

export const FileRouteParamsSchema = z.object({
  storeSlug: CompanySlugSchema,
  fileName: z
    .string()
    .trim()
    .min(1, 'File name is required')
    .max(255, 'File name cannot exceed 255 characters')
    .regex(SAFE_FILE_NAME_REGEX, 'File name contains illegal path traversal characters')
    .refine((name) => !name.includes('..'), 'Path traversal sequence is strictly prohibited'),
});

export const FileMetadataContractSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  storeSlug: CompanySlugSchema,
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().min(0),
  mimeType: z.string().min(1),
  isPublic: z.boolean().default(false),
  storageNamespace: z.string().min(1), // companies/{companyId}/files/{fileId}/{fileName}
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FileRouteParams = z.infer<typeof FileRouteParamsSchema>;
export type FileMetadataContract = z.infer<typeof FileMetadataContractSchema>;
