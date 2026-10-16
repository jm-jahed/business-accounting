import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IWarehouseBin extends Document {
  companyId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  code: string;
  aisle?: string | null;
  rack?: string | null;
  shelf?: string | null;
  bin?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseBinSchema = new Schema<IWarehouseBin>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Bin must belong to a company'],
      index: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Bin must belong to a warehouse'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Bin code is required'],
      trim: true,
      uppercase: true,
      minlength: 1,
      maxlength: 30,
    },
    aisle: { type: String, trim: true, default: null },
    rack: { type: String, trim: true, default: null },
    shelf: { type: String, trim: true, default: null },
    bin: { type: String, trim: true, default: null },
    description: { type: String, trim: true, maxlength: 200, default: null },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    collection: 'inventory_warehouse_bins',
  }
);

WarehouseBinSchema.index({ companyId: 1, warehouseId: 1, code: 1 }, { unique: true });

export const WarehouseBin: Model<IWarehouseBin> =
  mongoose.models.WarehouseBin ||
  mongoose.model<IWarehouseBin>('WarehouseBin', WarehouseBinSchema);
