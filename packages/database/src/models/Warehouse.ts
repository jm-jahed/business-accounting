import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IWarehouse extends Document {
  companyId: Types.ObjectId;
  branchId?: Types.ObjectId | null;
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
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseSchema = new Schema<IWarehouse>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Warehouse must belong to a company'],
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Warehouse code is required'],
      trim: true,
      uppercase: true,
      minlength: 1,
      maxlength: 20,
    },
    name: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    address: {
      street: { type: String, trim: true, default: null },
      city: { type: String, trim: true, default: null },
      state: { type: String, trim: true, default: null },
      country: { type: String, trim: true, default: 'AE' },
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'inventory_warehouses',
  }
);

WarehouseSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const Warehouse: Model<IWarehouse> =
  mongoose.models.Warehouse ||
  mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
