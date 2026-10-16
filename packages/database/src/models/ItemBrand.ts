import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IItemBrand extends Document {
  companyId: Types.ObjectId;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemBrandSchema = new Schema<IItemBrand>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Brand must belong to a company'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Brand code is required'],
      trim: true,
      uppercase: true,
      minlength: 1,
      maxlength: 20,
    },
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
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
    collection: 'inventory_brands',
  }
);

ItemBrandSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const ItemBrand: Model<IItemBrand> =
  mongoose.models.ItemBrand ||
  mongoose.model<IItemBrand>('ItemBrand', ItemBrandSchema);
