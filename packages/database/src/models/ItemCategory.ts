import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IItemCategory extends Document {
  companyId: Types.ObjectId;
  code: string;
  name: string;
  parentCategoryId?: Types.ObjectId | null;
  defaultInventoryAccountId?: Types.ObjectId | null;
  defaultCogsAccountId?: Types.ObjectId | null;
  defaultAdjustmentAccountId?: Types.ObjectId | null;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemCategorySchema = new Schema<IItemCategory>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Category must belong to a company'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      trim: true,
      uppercase: true,
      minlength: 1,
      maxlength: 20,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    parentCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ItemCategory',
      default: null,
    },
    defaultInventoryAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    defaultCogsAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    defaultAdjustmentAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
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
    collection: 'inventory_categories',
  }
);

ItemCategorySchema.index({ companyId: 1, code: 1 }, { unique: true });

export const ItemCategory: Model<IItemCategory> =
  mongoose.models.ItemCategory ||
  mongoose.model<IItemCategory>('ItemCategory', ItemCategorySchema);
