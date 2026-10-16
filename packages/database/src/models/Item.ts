import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { ItemType, ValuationMethod } from '@accounting/contracts';

export interface IItem extends Document {
  companyId: Types.ObjectId;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  categoryId: Types.ObjectId;
  brandId?: Types.ObjectId | null;
  type: ItemType;
  valuationMethod: ValuationMethod;
  baseUomId: Types.ObjectId;
  purchaseUomId?: Types.ObjectId | null;
  salesUomId?: Types.ObjectId | null;
  purchaseCost: Types.Decimal128;
  sellingPrice: Types.Decimal128;
  taxRateCode?: string | null;
  reorderLevel: Types.Decimal128;
  reorderQuantity: Types.Decimal128;
  preferredSupplierId?: Types.ObjectId | null;
  trackBatches: boolean;
  trackSerials: boolean;
  allowNegativeStock: boolean;
  inventoryAccountId?: Types.ObjectId | null;
  cogsAccountId?: Types.ObjectId | null;
  adjustmentAccountId?: Types.ObjectId | null;
  hasVariants: boolean;
  parentItemId?: Types.ObjectId | null;
  attributes?: Record<string, string> | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Item must belong to a company'],
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
      minlength: 1,
      maxlength: 50,
    },
    barcode: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ItemCategory',
      required: [true, 'Category is required'],
      index: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'ItemBrand',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ['STOCK', 'NON_STOCK', 'SERVICE'],
      default: 'STOCK',
      index: true,
    },
    valuationMethod: {
      type: String,
      enum: ['FIFO', 'WEIGHTED_AVERAGE'],
      default: 'FIFO',
    },
    baseUomId: {
      type: Schema.Types.ObjectId,
      ref: 'UnitOfMeasure',
      required: [true, 'Base UoM is required'],
    },
    purchaseUomId: {
      type: Schema.Types.ObjectId,
      ref: 'UnitOfMeasure',
      default: null,
    },
    salesUomId: {
      type: Schema.Types.ObjectId,
      ref: 'UnitOfMeasure',
      default: null,
    },
    purchaseCost: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.0000'),
    },
    sellingPrice: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.0000'),
    },
    taxRateCode: {
      type: String,
      trim: true,
      default: null,
    },
    reorderLevel: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.0000'),
    },
    reorderQuantity: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.0000'),
    },
    preferredSupplierId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    trackBatches: {
      type: Boolean,
      default: false,
    },
    trackSerials: {
      type: Boolean,
      default: false,
    },
    allowNegativeStock: {
      type: Boolean,
      default: false,
    },
    inventoryAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    cogsAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    adjustmentAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    hasVariants: {
      type: Boolean,
      default: false,
    },
    parentItemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
    },
    attributes: {
      type: Map,
      of: String,
      default: null,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'inventory_items',
  }
);

ItemSchema.index({ companyId: 1, sku: 1 }, { unique: true });
ItemSchema.index({ companyId: 1, barcode: 1 }, { unique: true, sparse: true });
ItemSchema.index({ companyId: 1, categoryId: 1, isActive: 1 });

export const Item: Model<IItem> =
  mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);
