import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type StockTransferStatus = 'DRAFT' | 'APPROVED' | 'DISPATCHED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export interface IStockTransferLine {
  itemId: Types.ObjectId;
  quantity: Types.Decimal128;
  uomId: Types.ObjectId;
  sourceBinId?: Types.ObjectId | null;
  destBinId?: Types.ObjectId | null;
  batchNumber?: string | null;
  serialNumbers?: string[];
  unitCost: Types.Decimal128;
  totalCost: Types.Decimal128;
}

export interface IStockTransfer extends Document {
  companyId: Types.ObjectId;
  transferNumber: string;
  sourceWarehouseId: Types.ObjectId;
  destWarehouseId: Types.ObjectId;
  status: StockTransferStatus;
  lines: IStockTransferLine[];
  totalValue: Types.Decimal128;
  dispatchedAt?: Date | null;
  dispatchedBy?: Types.ObjectId | null;
  receivedAt?: Date | null;
  receivedBy?: Types.ObjectId | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const StockTransferLineSchema = new Schema<IStockTransferLine>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
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
    sourceBinId: {
      type: Schema.Types.ObjectId,
      ref: 'WarehouseBin',
      default: null,
    },
    destBinId: {
      type: Schema.Types.ObjectId,
      ref: 'WarehouseBin',
      default: null,
    },
    batchNumber: {
      type: String,
      trim: true,
      default: null,
    },
    serialNumbers: {
      type: [String],
      default: [],
    },
    unitCost: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.0000'),
    },
    totalCost: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.0000'),
    },
  },
  { _id: false }
);

const StockTransferSchema = new Schema<IStockTransfer>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    transferNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    sourceWarehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    destWarehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'DISPATCHED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'],
      default: 'DRAFT',
      index: true,
    },
    lines: {
      type: [StockTransferLineSchema],
      required: true,
      validate: {
        validator: (v: IStockTransferLine[]) => Array.isArray(v) && v.length > 0,
        message: 'A stock transfer must contain at least 1 line item',
      },
    },
    totalValue: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString('0.0000'),
    },
    dispatchedAt: { type: Date, default: null },
    dispatchedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    receivedAt: { type: Date, default: null },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, trim: true, maxlength: 500, default: null },
  },
  {
    timestamps: true,
    collection: 'inventory_stock_transfers',
  }
);

StockTransferSchema.index({ companyId: 1, transferNumber: 1 }, { unique: true });
StockTransferSchema.index({ companyId: 1, status: 1, createdAt: -1 });

export const StockTransfer: Model<IStockTransfer> =
  mongoose.models.StockTransfer ||
  mongoose.model<IStockTransfer>('StockTransfer', StockTransferSchema);
