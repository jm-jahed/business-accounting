import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { invalidateCompanyDashboardCache } from '../services/dashboard-cache.js';

export type StockMovementType =
  | 'PURCHASE_RECEIPT'
  | 'SALES_ISSUE'
  | 'PURCHASE_RETURN'
  | 'SALES_RETURN'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT_INCREASE'
  | 'ADJUSTMENT_DECREASE'
  | 'PHYSICAL_COUNT_VARIANCE';

export interface IStockMovement extends Document {
  companyId: Types.ObjectId;
  movementNumber: string;
  movementType: StockMovementType;
  movementDate: Date;
  itemId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  binId?: Types.ObjectId | null;
  batchNumber?: string | null;
  serialNumber?: string | null;
  quantity: Types.Decimal128;
  uomId: Types.ObjectId;
  conversionFactor: Types.Decimal128;
  baseQuantity: Types.Decimal128;
  unitCost: Types.Decimal128;
  totalCost: Types.Decimal128;
  referenceVoucherType?: string | null;
  referenceVoucherId?: Types.ObjectId | null;
  journalEntryId?: Types.ObjectId | null;
  idempotencyKey?: string | null;
  notes?: string | null;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    movementNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    movementType: {
      type: String,
      enum: [
        'PURCHASE_RECEIPT',
        'SALES_ISSUE',
        'PURCHASE_RETURN',
        'SALES_RETURN',
        'TRANSFER_OUT',
        'TRANSFER_IN',
        'ADJUSTMENT_INCREASE',
        'ADJUSTMENT_DECREASE',
        'PHYSICAL_COUNT_VARIANCE',
      ],
      required: true,
      index: true,
    },
    movementDate: {
      type: Date,
      required: true,
      index: true,
      default: Date.now,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    binId: {
      type: Schema.Types.ObjectId,
      ref: 'WarehouseBin',
      default: null,
    },
    batchNumber: {
      type: String,
      trim: true,
      default: null,
    },
    serialNumber: {
      type: String,
      trim: true,
      default: null,
    },
    quantity: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    uomId: {
      type: Schema.Types.ObjectId,
      ref: 'UnitOfMeasure',
      required: true,
    },
    conversionFactor: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('1.0000'),
    },
    baseQuantity: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    unitCost: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    totalCost: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    referenceVoucherType: {
      type: String,
      trim: true,
      default: null,
    },
    referenceVoucherId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: 'JournalEntry',
      default: null,
      index: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'inventory_stock_movements',
  }
);

StockMovementSchema.index({ companyId: 1, movementNumber: 1 }, { unique: true });
StockMovementSchema.index({ companyId: 1, itemId: 1, movementDate: -1 });
StockMovementSchema.index({ companyId: 1, warehouseId: 1, movementDate: -1 });

// Cache Invalidation Hooks on Stock Movement mutations
StockMovementSchema.post('save', function (doc: any) {
  if (doc?.companyId) {
    invalidateCompanyDashboardCache(doc.companyId.toString());
  }
});

StockMovementSchema.post(['updateOne', 'updateMany', 'findOneAndUpdate'], function (this: any) {
  const filter = this.getFilter ? this.getFilter() : null;
  if (filter?.companyId) {
    invalidateCompanyDashboardCache(filter.companyId.toString());
  }
});

export const StockMovement: Model<IStockMovement> =
  mongoose.models.StockMovement ||
  mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
