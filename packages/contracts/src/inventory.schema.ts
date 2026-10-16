import { z } from 'zod';

// ==========================================
// 1. UNITS OF MEASURE (UoM)
// ==========================================

export const UomCategoryEnum = z.enum(['UNIT', 'WEIGHT', 'VOLUME', 'LENGTH', 'AREA', 'TIME', 'PACKAGING']);
export type UomCategory = z.infer<typeof UomCategoryEnum>;

export const CreateUnitOfMeasureInputSchema = z.object({
  code: z
    .string()
    .min(1, 'UoM code is required')
    .max(12, 'UoM code cannot exceed 12 characters')
    .trim()
    .toUpperCase(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(60).trim(),
  category: UomCategoryEnum.default('UNIT'),
  baseUnitId: z.string().optional().nullable(),
  conversionRatio: z
    .union([z.string(), z.number()])
    .default('1.0000')
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0;
    }, { message: 'Conversion ratio must be a strictly positive number' }),
  isBaseUnit: z.boolean().default(true),
  precision: z.number().int().min(0).max(4).default(0),
});

export const UpdateUnitOfMeasureInputSchema = CreateUnitOfMeasureInputSchema.partial();

export interface UnitOfMeasureResponseDto {
  id: string;
  companyId: string;
  code: string;
  name: string;
  category: UomCategory;
  baseUnitId?: string | null;
  baseUnitCode?: string | null;
  conversionRatio: string;
  isBaseUnit: boolean;
  precision: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 2. CATEGORIES & BRANDS
// ==========================================

export const CreateItemCategoryInputSchema = z.object({
  code: z
    .string()
    .min(1, 'Category code is required')
    .max(20, 'Category code cannot exceed 20 characters')
    .trim()
    .toUpperCase(),
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100).trim(),
  parentCategoryId: z.string().optional().nullable(),
  defaultInventoryAccountId: z.string().optional().nullable(),
  defaultCogsAccountId: z.string().optional().nullable(),
  defaultAdjustmentAccountId: z.string().optional().nullable(),
  description: z.string().max(300).optional().nullable(),
});

export interface ItemCategoryResponseDto {
  id: string;
  companyId: string;
  code: string;
  name: string;
  parentCategoryId?: string | null;
  defaultInventoryAccountId?: string | null;
  defaultCogsAccountId?: string | null;
  defaultAdjustmentAccountId?: string | null;
  description?: string | null;
  isActive: boolean;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const CreateItemBrandInputSchema = z.object({
  code: z
    .string()
    .min(1, 'Brand code is required')
    .max(20)
    .trim()
    .toUpperCase(),
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(300).optional().nullable(),
});

export interface ItemBrandResponseDto {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  itemCount?: number;
  createdAt: string;
}

// ==========================================
// 3. WAREHOUSES & BIN LOCATIONS
// ==========================================

export const CreateWarehouseInputSchema = z.object({
  code: z
    .string()
    .min(1, 'Warehouse code is required')
    .max(20)
    .trim()
    .toUpperCase(),
  name: z.string().min(2, 'Warehouse name must be at least 2 characters').max(100).trim(),
  branchId: z.string().optional().nullable(),
  address: z
    .object({
      street: z.string().max(150).optional().nullable(),
      city: z.string().max(100).optional().nullable(),
      state: z.string().max(100).optional().nullable(),
      country: z.string().max(100).default('AE'),
    })
    .optional()
    .nullable(),
  isDefault: z.boolean().default(false),
});

export interface WarehouseResponseDto {
  id: string;
  companyId: string;
  branchId?: string | null;
  branchName?: string | null;
  code: string;
  name: string;
  address?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    country: string;
  } | null;
  isDefault: boolean;
  isActive: boolean;
  binCount?: number;
  totalItemsStocked?: number;
  createdAt: string;
  updatedAt: string;
}

export const CreateWarehouseBinInputSchema = z.object({
  code: z
    .string()
    .min(1, 'Bin code is required')
    .max(30)
    .trim()
    .toUpperCase(),
  aisle: z.string().max(20).optional().nullable(),
  rack: z.string().max(20).optional().nullable(),
  shelf: z.string().max(20).optional().nullable(),
  bin: z.string().max(20).optional().nullable(),
  description: z.string().max(200).optional().nullable(),
});

export interface WarehouseBinResponseDto {
  id: string;
  companyId: string;
  warehouseId: string;
  warehouseCode?: string;
  code: string;
  aisle?: string | null;
  rack?: string | null;
  shelf?: string | null;
  bin?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

// ==========================================
// 4. ITEM MASTER
// ==========================================

export const ItemTypeEnum = z.enum(['STOCK', 'NON_STOCK', 'SERVICE']);
export type ItemType = z.infer<typeof ItemTypeEnum>;

export const ValuationMethodEnum = z.enum(['FIFO', 'WEIGHTED_AVERAGE']);
export type ValuationMethod = z.infer<typeof ValuationMethodEnum>;

export const CreateItemInputSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU cannot exceed 50 characters')
    .trim()
    .toUpperCase(),
  barcode: z.string().max(50).trim().optional().nullable(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(150).trim(),
  description: z.string().max(500).optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional().nullable(),
  type: ItemTypeEnum.default('STOCK'),
  valuationMethod: ValuationMethodEnum.default('FIFO'),

  // Units of measure
  baseUomId: z.string().min(1, 'Base UoM is required'),
  purchaseUomId: z.string().optional().nullable(),
  salesUomId: z.string().optional().nullable(),

  // Pricing & Valuation
  purchaseCost: z
    .union([z.string(), z.number()])
    .default('0.0000')
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 0;
    }, { message: 'Purchase cost must be a non-negative number' }),
  sellingPrice: z
    .union([z.string(), z.number()])
    .default('0.0000')
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 0;
    }, { message: 'Selling price must be a non-negative number' }),
  taxRateCode: z.string().max(20).optional().nullable(),

  // Reordering
  reorderLevel: z
    .union([z.string(), z.number()])
    .default('0.0000')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: 'Reorder level must be >= 0' }),
  reorderQuantity: z
    .union([z.string(), z.number()])
    .default('0.0000')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: 'Reorder quantity must be >= 0' }),
  preferredSupplierId: z.string().optional().nullable(),

  // Tracking flags
  trackBatches: z.boolean().default(false),
  trackSerials: z.boolean().default(false),
  allowNegativeStock: z.boolean().default(false),

  // GL Account bindings
  inventoryAccountId: z.string().optional().nullable(),
  cogsAccountId: z.string().optional().nullable(),
  adjustmentAccountId: z.string().optional().nullable(),

  // Variants & Media
  hasVariants: z.boolean().default(false),
  attributes: z.record(z.string()).optional().nullable(),
  imageUrl: z.string().url().max(500).optional().nullable(),
});

export const UpdateItemInputSchema = CreateItemInputSchema.partial();

export const ItemQueryFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  type: ItemTypeEnum.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).default('ACTIVE'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export interface ItemResponseDto {
  id: string;
  companyId: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  categoryId: string;
  categoryName?: string;
  brandId?: string | null;
  brandName?: string | null;
  type: ItemType;
  valuationMethod: ValuationMethod;
  baseUomId: string;
  baseUomCode?: string;
  baseUomName?: string;
  purchaseUomId?: string | null;
  salesUomId?: string | null;
  purchaseCost: string;
  sellingPrice: string;
  taxRateCode?: string | null;
  reorderLevel: string;
  reorderQuantity: string;
  preferredSupplierId?: string | null;
  trackBatches: boolean;
  trackSerials: boolean;
  allowNegativeStock: boolean;
  inventoryAccountId?: string | null;
  inventoryAccountCode?: string | null;
  cogsAccountId?: string | null;
  adjustmentAccountId?: string | null;
  hasVariants: boolean;
  attributes?: Record<string, string> | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateUnitOfMeasureInput = z.infer<typeof CreateUnitOfMeasureInputSchema>;
export type UpdateUnitOfMeasureInput = z.infer<typeof UpdateUnitOfMeasureInputSchema>;
export type CreateItemCategoryInput = z.infer<typeof CreateItemCategoryInputSchema>;
export type CreateItemBrandInput = z.infer<typeof CreateItemBrandInputSchema>;
export type CreateWarehouseInput = z.infer<typeof CreateWarehouseInputSchema>;
export type CreateWarehouseBinInput = z.infer<typeof CreateWarehouseBinInputSchema>;
export type CreateItemInput = z.infer<typeof CreateItemInputSchema>;
export type UpdateItemInput = z.infer<typeof UpdateItemInputSchema>;
export type ItemQueryFilter = z.infer<typeof ItemQueryFilterSchema>;
